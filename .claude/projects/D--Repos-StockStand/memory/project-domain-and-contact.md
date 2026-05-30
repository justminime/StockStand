---
name: project-domain-and-contact
description: StockStand production URL and contact email address
metadata:
  type: project
---

Production URL: **https://stockstand.shifth.com**
Contact email: **StockStand@shifth.com**

Used in:
- `app/layout.tsx` — `metadataBase`, `openGraph.url`, `openGraph.siteName`
- `.env.local.example` — `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` default value
- Plausible analytics must be configured for domain `stockstand.shifth.com`

**Why:** User confirmed the custom domain when setting up the Vercel project. All canonical URL references and analytics config should use this domain.

**How to apply:** Any new feature that references the app's public URL (share links, canonical tags, email templates, analytics) should use `stockstand.shifth.com` and contact `StockStand@shifth.com`.
