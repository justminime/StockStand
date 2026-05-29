'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { MarketContext } from '@/lib/game-engine';

const POLL_INTERVAL_MS = 55_000; // 55s — intentionally NOT 60s to avoid round-timer alignment
const SYMBOLS = ['AAPL', 'TSLA', 'MCD', 'KO', 'GME'] as const;

type Prices = Record<string, number>;

type ApiResponse = Prices & {
  source?:               string;
  market_closed?:        boolean;
  market_closed_reason?: string;
  market_context?:       { spy_delta: number; vix: number };
};

export function useStockPrices() {
  const [prices,        setPrices]       = useState<Prices>({});
  const [prevPrices,    setPrevPrices]   = useState<Prices>({});
  const [loading,       setLoading]      = useState(true);
  const [error,         setError]        = useState<string | null>(null);
  const [marketClosed,  setMarketClosed] = useState(false);
  const [marketContext, setMarketContext] = useState<MarketContext>({ spyDelta: 0, vix: 20 });
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPricesRef = useRef<Prices>({});

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch('/api/prices');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as ApiResponse;

      // Track market-closed flag from server (avoids client-side timezone logic)
      setMarketClosed(data.market_closed === true);

      // Market context for weighted event selection
      if (data.market_context) {
        setMarketContext({
          spyDelta: data.market_context.spy_delta,
          vix:      data.market_context.vix,
        });
      }

      // Strip non-price fields
      const newPrices: Prices = {};
      for (const sym of SYMBOLS) {
        if (typeof data[sym] === 'number') {
          newPrices[sym] = data[sym] as number;
        }
      }

      // Keep previous prices for delta calculation
      if (Object.keys(lastPricesRef.current).length > 0) {
        setPrevPrices({ ...lastPricesRef.current });
      }

      lastPricesRef.current = newPrices;
      setPrices(newPrices);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      console.error('[useStockPrices] fetch error:', msg);
      // Keep last known prices on error (don't wipe)
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    intervalRef.current = setInterval(fetchPrices, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchPrices]);

  const getStockDelta = useCallback((symbol: string): number => {
    const curr = prices[symbol];
    const prev = prevPrices[symbol];
    if (!curr || !prev || prev === 0) return 0;
    return (curr - prev) / prev;
  }, [prices, prevPrices]);

  return { prices, prevPrices, loading, error, marketClosed, marketContext, getStockDelta, refetch: fetchPrices };
}
