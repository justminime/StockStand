/**
 * Yahoo Finance price fetcher.
 * No API key required for basic market data.
 * Circuit breaker: if 2+ symbols fail, throws to trigger fallback.
 */

export interface StockPrice {
  price:         number;
  previousClose: number;
  changePercent: number;
}

type YahooChart = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?:         number;
        chartPreviousClose?:         number;
        regularMarketPreviousClose?: number;
      };
    }>;
    error?: unknown;
  };
};

export async function fetchStockPrices(
  symbols: string[]
): Promise<Record<string, StockPrice>> {
  const results = await Promise.allSettled(
    symbols.map(sym => fetchOne(sym))
  );

  const prices: Record<string, StockPrice> = {};
  let failCount = 0;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const sym    = symbols[i];
    if (result.status === 'fulfilled' && result.value) {
      prices[sym] = result.value;
    } else {
      failCount++;
      console.warn(`[stock-proxy] Failed to fetch ${sym}`);
    }
  }

  if (failCount > 2) {
    throw new Error(`Circuit breaker: ${failCount}/${symbols.length} symbols failed`);
  }

  return prices;
}

async function fetchOne(symbol: string): Promise<StockPrice | null> {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
  try {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json() as YahooChart;
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const price         = meta.regularMarketPrice ?? 0;
    const previousClose = meta.chartPreviousClose ?? meta.regularMarketPreviousClose ?? price;
    const changePercent = previousClose !== 0
      ? (price - previousClose) / previousClose
      : 0;

    return { price, previousClose, changePercent };
  } catch {
    return null;
  }
}
