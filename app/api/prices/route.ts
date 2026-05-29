import { NextResponse } from 'next/server';

// No external cache dependency — module-level Map works because
// Vercel Fluid Compute reuses function instances across requests.
// TTL: 55 s (intentionally NOT 60 s to avoid round-timer alignment).

const SYMBOLS   = ['AAPL', 'TSLA', 'MCD', 'KO', 'GME'] as const;
const CACHE_TTL = 55_000; // milliseconds

type PriceMap = Record<string, number>;

/** Market context returned alongside prices for weighted event selection */
export interface MarketContextPayload {
  spy_delta: number;  // SPY daily % change as decimal (e.g. 0.015 = +1.5%)
  vix:       number;  // VIX index level
}

// ─── In-memory cache ──────────────────────────────────────────────────────────

interface CacheEntry {
  payload:   PriceMap & { market_context: MarketContextPayload };
  expiresAt: number; // Date.now() + CACHE_TTL
}

const cache = new Map<string, CacheEntry>();

function getCached(): CacheEntry['payload'] | null {
  const entry = cache.get('prices');
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete('prices');
    return null;
  }
  return entry.payload;
}

function setCache(payload: CacheEntry['payload']): void {
  cache.set('prices', { payload, expiresAt: Date.now() + CACHE_TTL });
}

// ─── NYSE market-hours detection ──────────────────────────────────────────────

/**
 * Returns true when NYSE is closed (weekend, holiday, or outside 9:30–16:00 ET).
 * Uses Intl APIs — no timezone library needed.
 */
function isNYSEClosed(): { closed: boolean; reason: string } {
  const now = new Date();

  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone:  'America/New_York',
    weekday:   'short',
    year:      'numeric',
    month:     '2-digit',
    day:       '2-digit',
    hour:      '2-digit',
    minute:    '2-digit',
    hour12:    false,
  });
  const parts = fmt.formatToParts(now);
  const get   = (t: string) => parts.find(p => p.type === t)?.value ?? '';

  const weekday = get('weekday');
  const month   = get('month');
  const day     = get('day');
  const year    = get('year');
  const hour    = parseInt(get('hour'),   10);
  const minute  = parseInt(get('minute'), 10);

  if (weekday === 'Sat' || weekday === 'Sun') {
    return { closed: true, reason: 'weekend' };
  }

  const nowMinutes   = hour * 60 + minute;
  const openMinutes  = 9  * 60 + 30; // 9:30
  const closeMinutes = 16 * 60;      // 16:00
  if (nowMinutes < openMinutes || nowMinutes >= closeMinutes) {
    return { closed: true, reason: 'after-hours' };
  }

  const fullDate = `${year}-${month}-${day}`;
  const NYSE_HOLIDAYS: string[] = [
    // 2025
    '2025-01-01', '2025-01-20', '2025-02-17', '2025-04-18',
    '2025-05-26', '2025-06-19', '2025-07-04', '2025-09-01',
    '2025-11-27', '2025-12-25',
    // 2026
    '2026-01-01', '2026-01-19', '2026-02-16', '2026-04-03',
    '2026-05-25', '2026-06-19', '2026-07-03', '2026-09-07',
    '2026-11-26', '2026-12-25',
  ];

  if (NYSE_HOLIDAYS.includes(fullDate)) {
    return { closed: true, reason: 'holiday' };
  }

  return { closed: false, reason: 'open' };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET() {
  const { closed, reason } = isNYSEClosed();

  // Mock mode — env var override for local dev / testing
  if (process.env.STOCK_API_PROVIDER === 'mock') {
    const fallback = await import('@/public/fallback-prices.json') as unknown as { default: Record<string, unknown> };
    const prices: PriceMap = {};
    for (const sym of SYMBOLS) {
      const v = fallback.default[sym];
      if (typeof v === 'number') prices[sym] = v;
    }
    return NextResponse.json({
      ...prices,
      source: 'mock',
      market_closed: false,
      market_context: { spy_delta: 0, vix: 20 } satisfies MarketContextPayload,
    });
  }

  // Return cached payload if still fresh
  const cached = getCached();
  if (cached) {
    return NextResponse.json({
      ...cached,
      source: 'cache',
      market_closed: closed,
      market_closed_reason: reason,
    });
  }

  // Fetch live prices + market context in parallel
  try {
    const [prices, marketCtx] = await Promise.all([
      fetchLivePrices([...SYMBOLS]),
      fetchMarketContext(),
    ]);

    const payload = { ...prices, market_context: marketCtx };
    setCache(payload);

    return NextResponse.json({
      ...payload,
      source: 'live',
      market_closed: closed,
      market_closed_reason: reason,
    });
  } catch (err) {
    console.error('[prices] Error:', err instanceof Error ? err.message : err);

    // Static fallback on total failure
    const fallback = await import('@/public/fallback-prices.json') as unknown as { default: Record<string, unknown> };
    const prices: PriceMap = {};
    for (const sym of SYMBOLS) {
      const v = fallback.default[sym];
      if (typeof v === 'number') prices[sym] = v;
    }
    return NextResponse.json({
      ...prices,
      source: 'fallback',
      market_closed: closed,
      market_closed_reason: reason,
      market_context: { spy_delta: 0, vix: 20 } satisfies MarketContextPayload,
    });
  }
}

// ─── Live price fetching ──────────────────────────────────────────────────────

async function fetchLivePrices(symbols: string[]): Promise<PriceMap> {
  const results = await Promise.allSettled(
    symbols.map(sym => fetchOneSymbol(sym))
  );

  const prices: PriceMap = {};
  let failCount = 0;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const sym    = symbols[i];
    if (result.status === 'fulfilled' && result.value !== null) {
      prices[sym] = result.value;
    } else {
      failCount++;
    }
  }

  // Circuit breaker: if more than 2 symbols fail, throw to trigger fallback
  if (failCount > 2) {
    throw new Error(`Too many symbol fetch failures: ${failCount}/${symbols.length}`);
  }

  return prices;
}

async function fetchOneSymbol(symbol: string): Promise<number | null> {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
  try {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = await res.json() as { chart?: { result?: Array<{ meta?: { regularMarketPrice?: number } }> } };
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return typeof price === 'number' ? price : null;
  } catch {
    return null;
  }
}

// ─── Market context (SPY Δ% + VIX) ───────────────────────────────────────────

type YahooBriefMeta = {
  regularMarketPrice?:         number;
  regularMarketChangePercent?: number;
};
type YahooChartRes = { chart?: { result?: Array<{ meta?: YahooBriefMeta }> } };

async function fetchSymbolMeta(symbol: string): Promise<YahooBriefMeta | null> {
  const encoded = encodeURIComponent(symbol);
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=1d`;
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 3000);
    const res  = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json() as YahooChartRes;
    return data?.chart?.result?.[0]?.meta ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch SPY daily change% and VIX level for weighted event selection.
 * Returns safe defaults (neutral market) on any failure.
 */
async function fetchMarketContext(): Promise<MarketContextPayload> {
  const DEFAULT: MarketContextPayload = { spy_delta: 0, vix: 20 };
  try {
    const [spyMeta, vixMeta] = await Promise.all([
      fetchSymbolMeta('SPY'),
      fetchSymbolMeta('^VIX'),
    ]);

    const spy_delta =
      typeof spyMeta?.regularMarketChangePercent === 'number'
        ? spyMeta.regularMarketChangePercent / 100
        : 0;

    const vix =
      typeof vixMeta?.regularMarketPrice === 'number'
        ? vixMeta.regularMarketPrice
        : 20;

    return { spy_delta, vix };
  } catch {
    return DEFAULT;
  }
}
