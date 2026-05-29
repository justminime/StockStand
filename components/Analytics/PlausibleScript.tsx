'use client';

import Script from 'next/script';

/**
 * PlausibleScript — COPPA-safe analytics.
 *
 * Rules (from docs/DESIGN_SYSTEM.md compliance guide):
 *  • ONLY loads for adult (18+) users — never child or teen.
 *  • Requires NEXT_PUBLIC_PLAUSIBLE_DOMAIN env var to be set.
 *  • Uses Plausible (privacy-first: no cookies, no PII, no cross-site tracking).
 *  • strategy="afterInteractive" — never blocks render.
 *
 * Usage in GameBoard (after ageTier is known from localStorage):
 *   {state.ageTier === 'adult' && <PlausibleScript />}
 */
export default function PlausibleScript() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  // Don't render anything if the env var isn't set (dev / staging without analytics)
  if (!domain) return null;

  return (
    <Script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
}
