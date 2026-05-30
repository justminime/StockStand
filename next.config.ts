import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        // ── Content Security Policy ───────────────────────────────────────────
        // NOTE: 'unsafe-inline' in script-src is required by Next.js 15 App Router
        // (inline hydration scripts). This is a known limitation — tracked for
        // future nonce-based solution when Next.js provides first-class support.
        // Mitigations in place: frame-ancestors 'none', X-Frame-Options: DENY,
        // no user-generated HTML, no eval.
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://plausible.io",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https:",
            "connect-src 'self' https://plausible.io https://query2.finance.yahoo.com",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "object-src 'none'",
          ].join('; '),
        },
        // ── Framing protection ────────────────────────────────────────────────
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        // ── MIME sniffing protection ──────────────────────────────────────────
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        // ── Referrer ──────────────────────────────────────────────────────────
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        // ── Cross-Origin policies ─────────────────────────────────────────────
        // COOP: prevents cross-origin window references (protects against
        // Spectre/side-channel attacks and popup-based XSS)
        {
          key: 'Cross-Origin-Opener-Policy',
          value: 'same-origin',
        },
        // COEP not set — would block Google Fonts CDN (no CORP headers)
        // ── Feature / Permissions policy ─────────────────────────────────────
        // Disable browser features this app will never use
        {
          key: 'Permissions-Policy',
          value: [
            'camera=()',
            'microphone=()',
            'geolocation=()',
            'payment=()',
            'usb=()',
            'bluetooth=()',
            'accelerometer=()',
            'gyroscope=()',
            'magnetometer=()',
          ].join(', '),
        },
        // ── HSTS ──────────────────────────────────────────────────────────────
        // 1-year max-age with subdomain + preload. Safe: this app is HTTPS-only.
        // Vercel enforces HTTPS so HTTP will never serve this header in prod.
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        },
      ],
    },
  ],
};

export default nextConfig;
