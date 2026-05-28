import { kv }          from '@vercel/kv';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

const SYMBOLS   = ['AAPL', 'TSLA', 'MCD', 'KO', 'GME'] as const;
const CACHE_TTL = 55; // seconds — intentionally NOT 60 to avoid round-timer alignment

type PriceMap = Record<string, number>;

// ─── NYSE market-hours detection ─────────────────────────────────────────────

/**
 * Returns true when NYSE is closed (weekend, holiday, or outside 9:30–16:00 ET).
 * Uses Intl APIs available in the Edge runtime — no node:process dependency.
 */
function isNYSEClosed(): { closed: boolean; reason: string } {
  const now = new Date();

  // Resolve current date/time components in America/New_York
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

  const weekday = get('weekday');  // 'Mon' | 'Tue' | ...
  const month   = get('month');    // '01' … '12'
  const day     = get('day');      // '01' … '31'
  const year    = get('year');     // '2025' …
  const hour    = parseInt(get('hour'),   10); // 0–23 (hour12:false)
  const minute  = parseInt(get('minute'), 10); // 0–59

  // Weekend
  if (weekday === 'Sat' || weekday === 'Sun') {
    return { closed: true, reason: 'weekend' };
  }

  // Regular trading hours: 09:30 – 16:00 ET (exclusive of close)
  const nowMinutes   = hour * 60 + minute;
  const openMinutes  = 9  * 60 + 30; // 9:30
  const closeMinutes = 16 * 60;      // 16:00
  if (nowMinutes < openMinutes || nowMinutes >= closeMinutes) {
    return { closed: true, reason: 'after-hours' };
  }

  // NYSE holidays (YYYY-MM-DD in Eastern time)
  const fullDate = `${year}-${month}-${day}`;
  const NYSE_HOLIDAYS: string[] = [
    // 2025
    '2025-01-01', // New Year's Day
    '2025-01-20', // Martin Luther King Jr. Day
    '2025-02-17', // Presidents' Day
    '2025-04-18', // Good Friday
    '2025-05-26', // Memorial Day
    '2025-06-19', // Juneteenth
    '2025-07-04', // Independence Day
    '2025-09-01', // Labor Day
    '2025-11-27', // Thanksgiving
    '2025-12-25', // Christmas
    // 2026
    '2026-01-01', // New Year's Day
    '2026-01-19', // MLK Day
    '2026-02-16', // Presidents' Day
    '2026-04-03', // Good Friday
    '2026-05-25', // Memorial Day
    '2026-06-19', // Juneteenth
    '2026-07-03', // Independence Day (observed, Friday)
    '2026-09-07', // Labor Day
    '2026-11-26', // Thanksgiving
    '2026-12-25', // Christmas
  ];

  if (NYSE_HOLIDAYS.includes(fullDate)) {
    return { closed: true, reason: 'holiday' };
  }

  return { closed: false, reason: 'open' };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET() {
  const { closed, reason } = isNYSEClosed();

  // Mock mode: skip cache and Yahoo, return static fallback
  if (process.env.STOCK_API_PROVIDER === 'mock') {
    const fallback = await import('@/public/fallback-prices.json') as unknown as { default: Record<string, unknown> };
    const prices: PriceMap = {};
    for (const sym of SYMBOLS) {
      const v = fallback.default[sym];
      if (typeof v === 'number') prices[sym] = v;
    }
    return NextResponse.json({ ...prices, source: 'mock', market_closed: false });
  }

  // Per-minute cache key — prevents TTL from aligning with 60s round timer
  const cacheKey = 'stock:prices:v1:' + new Date().toISOString().slice(0, 16);

  try {
    // Try KV cache first
    const cached = await kv.get<PriceMap>(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, source: 'cache', market_closed: closed, market_closed_reason: reason });
    }

    // Fetch live prices from Yahoo Finance
    const prices = await fetchLivePrices([...SYMBOLS]);
    await kv.set(cacheKey, prices, { ex: CACHE_TTL });
    return NextResponse.json({ ...prices, source: 'live', market_closed: closed, market_closed_reason: reason });
  } catch (err) {
    console.error('[prices] Error:', err instanceof Error ? err.message : err);
    // Fallback on any error (KV down, Yahoo down, etc.)
    const fallback = await import('@/public/fallback-prices.json') as unknown as { default: Record<string, unknown> };
    const prices: PriceMap = {};
    for (const sym of SYMBOLS) {
      const v = fallback.default[sym];
      if (typeof v === 'number') prices[sym] = v;
    }
    return NextResponse.json({ ...prices, source: 'fallback', market_closed: closed, market_closed_reason: reason });
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
