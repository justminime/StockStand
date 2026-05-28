import { kv }          from '@vercel/kv';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

const SYMBOLS   = ['AAPL', 'TSLA', 'MCD', 'KO', 'GME'] as const;
const CACHE_TTL = 55; // seconds — intentionally NOT 60 to avoid round-timer alignment

type PriceMap = Record<string, number>;

export async function GET() {
  // Mock mode: skip cache and Yahoo, return static fallback
  if (process.env.STOCK_API_PROVIDER === 'mock') {
    const fallback = await import('@/public/fallback-prices.json') as unknown as { default: Record<string, unknown> };
    const prices: PriceMap = {};
    for (const sym of SYMBOLS) {
      const v = fallback.default[sym];
      if (typeof v === 'number') prices[sym] = v;
    }
    return NextResponse.json({ ...prices, source: 'mock' });
  }

  // Per-minute cache key — prevents TTL from aligning with 60s round timer
  const cacheKey = 'stock:prices:v1:' + new Date().toISOString().slice(0, 16);

  try {
    // Try KV cache first
    const cached = await kv.get<PriceMap>(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, source: 'cache' });
    }

    // Fetch live prices from Yahoo Finance
    const prices = await fetchLivePrices([...SYMBOLS]);
    await kv.set(cacheKey, prices, { ex: CACHE_TTL });
    return NextResponse.json({ ...prices, source: 'live' });
  } catch (err) {
    console.error('[prices] Error:', err instanceof Error ? err.message : err);
    // Fallback on any error (KV down, Yahoo down, etc.)
    const fallback = await import('@/public/fallback-prices.json') as unknown as { default: Record<string, unknown> };
    const prices: PriceMap = {};
    for (const sym of SYMBOLS) {
      const v = fallback.default[sym];
      if (typeof v === 'number') prices[sym] = v;
    }
    return NextResponse.json({ ...prices, source: 'fallback' });
  }
}

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
