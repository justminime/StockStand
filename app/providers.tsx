'use client';

/**
 * Client-side providers wrapper.
 * SessionProvider supplies the auth session to all client components via React context.
 * It does NOT load any external scripts — just React context.
 * Safe to render for all age tiers (the COPPA guard lives in AuthButton, not here).
 */
import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
