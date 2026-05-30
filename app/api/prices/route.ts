import { NextResponse } from 'next/server';

// No external cache dependency — module-level Map works because
// Vercel Fluid Compute reuses function instances across requests.
// TTL varies: 55 s during market hours (align below round timer),
//             5 min when market is closed (prices won't move anyway).

const SYMBOLS            = ['AAPL', 'TSLA', 'MCD', 'KO', 'GME'] as const;
const CACHE_TTL_OPEN     =  55_000; // ms — market open
const CACHE_TTL_CLOSED   = 300_000; // ms — market closed / after-hours

// ─── Per-stock beta relative to a foreign index ───────────────────────────────
// When NYSE is closed we use a live foreign index as mood signal and scale
// it by each stock's "beta" to keep volatility differences meaningful.
//   KO / MCD  — defensive consumer staples, low beta
//   AAPL      — large-cap tech, moderate beta
//   TSLA      — high-growth volatile, high beta
//   GME       — meme stock, extreme beta
const STOCK_BETAS: Record<string, number> = {
  KO:   0.7,
  MCD:  0.6,
  AAPL: 1.1,
  TSLA: 1.8,
  GME:  2.8,
};

type PriceMap = Record<string, number>;

/** Market context returned alongside prices for weighted event selection */
export interface MarketContextPayload {
  spy_delta: number;  // SPY daily % change as decimal (e.g. 0.015 = +1.5%)
  vix:       number;  // VIX index level
}

// ─── In-memory cache ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CachedPayload = Record<string, any> & { market_context: MarketContextPayload };

interface CacheEntry {
  payload:   CachedPayload;
  expiresAt: number; // Date.now() + CACHE_TTL
}

const cache = new Map<string, CacheEntry>();

function getCached(): CachedPayload | null {
  const entry = cache.get('prices');
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete('prices');
    return null;
  }
  return entry.payload;
}

function setCache(payload: CachedPayload, closed: boolean): void {
  const ttl = closed ? CACHE_TTL_CLOSED : CACHE_TTL_OPEN;
  cache.set('prices', { payload, expiresAt: Date.now() + ttl });
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

// ─── Foreign market detection ────────────────────────────────────────────────
//
// When NYSE is closed we look for a major market that IS currently trading
// and use its index as a live mood signal.  This keeps demand swings and
// event probabilities dynamic even on evenings / weekends.
//
// Schedule (all UTC, Mon–Fri only):
//   00:00 – 02:30   Tokyo morning session  (^N225, JST 09:00-11:30)
//   02:30 – 03:30   Tokyo lunch break      — no signal
//   03:30 – 06:30   Tokyo afternoon session (^N225, JST 12:30-15:30)
//   06:30 – 08:00   All major markets closed — no signal
//   08:00 – 14:30   London / Europe open   (^FTSE, before NYSE opens)
//   14:30 – 21:00   NYSE open              — this function won't be called
//   21:00 – 24:00   All markets closed     — no signal

interface ForeignMarket { symbol: string; name: string }

function getOpenForeignMarket(): ForeignMarket | null {
  const now     = new Date();
  const day     = now.getUTCDay();                              // 0 = Sun
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  if (day === 0 || day === 6) return null; // weekend — no live signal

  // Tokyo morning + afternoon (skip lunch 2:30-3:30 UTC)
  if ((minutes < 150) || (minutes >= 210 && minutes < 390)) {
    return { symbol: '^N225', name: 'Nikkei 225' };
  }
  // London/Europe — only before NYSE opens (< 14:30 UTC = 870 min)
  if (minutes >= 480 && minutes < 870) {
    return { symbol: '^FTSE', name: 'FTSE 100' };
  }
  return null;
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
    // Realistic mock daily changes — keeps cards/explain lively during dev
    const dayChangePcts: Record<string, number> = {
      AAPL: 0.015, TSLA: -0.032, MCD: 0.008, KO: 0.004, GME: 0.11,
    };
    return NextResponse.json({
      ...prices,
      dayChangePcts,
      source: 'mock',
      market_closed: false,
      market_context: { spy_delta: 0.005, vix: 18 } satisfies MarketContextPayload,
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
    const [priceResult, marketCtx] = await Promise.all([
      fetchLivePrices([...SYMBOLS]),
      fetchMarketContext(),
    ]);

    // Start with the daily % changes from each US stock
    let dayChangePcts      = priceResult.dayChangePcts;
    let effectiveMarketCtx = marketCtx;
    let foreignMarketName: string | undefined;

    // When NYSE is closed, try to replace with a live foreign index so the
    // game stays dynamic (yesterday's US delta is static every round)
    if (closed) {
      const foreign = getOpenForeignMarket();
      if (foreign) {
        try {
          const foreignMeta = await fetchSymbolMeta(foreign.symbol);
          const baseDelta   = typeof foreignMeta?.regularMarketChangePercent === 'number'
            ? foreignMeta.regularMarketChangePercent / 100
            : null;

          if (baseDelta !== null) {
            // Scale by per-stock beta so meme stocks swing more than staples
            dayChangePcts = {};
            for (const sym of SYMBOLS) {
              dayChangePcts[sym] = baseDelta * (STOCK_BETAS[sym] ?? 1.0);
            }
            // Use the foreign index move as the overall "market mood"
            effectiveMarketCtx = { spy_delta: baseDelta, vix: marketCtx.vix };
            foreignMarketName  = foreign.name;
          }
        } catch {
          // Foreign fetch failed — keep US dayChangePcts as fallback
        }
      }
    }

    const payload = {
      ...priceResult.prices,
      dayChangePcts,
      market_context:  effectiveMarketCtx,
      ...(foreignMarketName ? { foreignMarket: foreignMarketName } : {}),
    };
    setCache(payload, closed);

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
      dayChangePcts: {},
      source: 'fallback',
      market_closed: closed,
      market_closed_reason: reason,
      market_context: { spy_delta: 0, vix: 20 } satisfies MarketContextPayload,
    });
  }
}

// ─── Live price fetching ──────────────────────────────────────────────────────

interface SymbolResult {
  price:        number | null;
  dayChangePct: number | null; // regularMarketChangePercent / 100 (decimal)
}

interface LivePriceResult {
  prices:       PriceMap;
  dayChangePcts: Record<string, number>; // always present, may be partial
}

async function fetchLivePrices(symbols: string[]): Promise<LivePriceResult> {
  const results = await Promise.allSettled(
    symbols.map(sym => fetchOneSymbol(sym))
  );

  const prices:       PriceMap                = {};
  const dayChangePcts: Record<string, number> = {};
  let failCount = 0;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const sym    = symbols[i];
    if (result.status === 'fulfilled' && result.value.price !== null) {
      prices[sym] = result.value.price;
      if (result.value.dayChangePct !== null) {
        dayChangePcts[sym] = result.value.dayChangePct;
      }
    } else {
      failCount++;
    }
  }

  // Circuit breaker: if more than 2 symbols fail, throw to trigger fallback
  if (failCount > 2) {
    throw new Error(`Too many symbol fetch failures: ${failCount}/${symbols.length}`);
  }

  return { prices, dayChangePcts };
}

async function fetchOneSymbol(symbol: string): Promise<SymbolResult> {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
  try {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return { price: null, dayChangePct: null };
    const data = await res.json() as {
      chart?: { result?: Array<{ meta?: {
        regularMarketPrice?:         number;
        regularMarketChangePercent?: number;
      } }> }
    };
    const meta   = data?.chart?.result?.[0]?.meta;
    const price  = typeof meta?.regularMarketPrice         === 'number' ? meta.regularMarketPrice  : null;
    // Yahoo returns e.g. 2.34 for +2.34% — convert to decimal
    const chgPct = typeof meta?.regularMarketChangePercent === 'number' ? meta.regularMarketChangePercent / 100 : null;
    return { price, dayChangePct: chgPct };
  } catch {
    return { price: null, dayChangePct: null };
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
