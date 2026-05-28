# Software Architecture Plan
## StockStand — v1.1 Technical Design

> **Status:** VP-reviewed. Critical and High issues resolved. See §14 for remaining open questions.
> **Deployment target:** Vercel (App Router, Edge Functions, KV, Postgres)
> **User model:** Single-user consumer app — each player has their own account; no multi-tenancy, no organisations, no shared workspaces.

---

## 1. Architectural decisions log

| Decision | Choice | Rationale |
|---|---|---|
| Meta-framework | **Next.js 15 (App Router)** | Native Vercel integration; API routes, edge functions, and React UI in one repo |
| Auth | **NextAuth v5 (Auth.js)** | Edge-native, integrates with Next.js App Router natively; server-side OAuth redirect — no Google OAuth JS SDK loaded in the browser |
| Database | **Vercel Postgres (Neon)** | Serverless Postgres provisioned in Vercel dashboard; serverless-native; tight env-var integration |
| ORM | **Drizzle ORM** | Lightweight, edge-compatible (no binary client), TypeScript-first; right-sized for one DB table |
| Proxy cache | **Vercel KV (Redis)** | Cross-request cache for stock prices; survives cold starts; free on hobby tier |
| Styling | **CSS Modules + CSS custom properties** | Zero runtime; maps directly to design system tokens; no extra config layer |
| Charts | **Custom SVG (zero dependency)** | Sparklines: hand-rolled, zero KB. P&L chart: minimal axes-free line chart in SVG — see §5.4 for scope note |
| Analytics | **Plausible** | COPPA-safe; no cookies; conditional load — only after session resolves to `age_tier === 'adult'` |
| Migration path | **Full rewrite for v1.1** | `stockstand.html` preserved as reference; game logic ported to TypeScript/React |

---

## 2. Repository structure

```
stockstand/
├── app/                            # Next.js App Router
│   ├── layout.tsx                  # Root layout: fonts, AgeGate, conditional Plausible
│   ├── loading.tsx                 # CSS-only skeleton shown during AgeGate hydration
│   ├── page.tsx                    # / → redirects to /setup (new) or /game (returning)
│   ├── setup/
│   │   └── page.tsx                # Stand setup: name, product picker, theme selector
│   ├── game/
│   │   └── page.tsx                # Main game page
│   ├── privacy/
│   │   └── page.tsx                # /privacy — required by COPPA §7; linked from footer
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts        # NextAuth handler (Google OAuth, server-side redirect)
│       ├── prices/
│       │   └── route.ts            # Stock proxy: KV cache + dampening (Edge runtime)
│       ├── game-state/
│       │   └── route.ts            # GET/PUT game state to/from Postgres
│       └── cron/
│           └── purge-inactive/
│               └── route.ts        # Deletes rows inactive > 90 days (CRON_SECRET required)
│
├── components/
│   ├── AgeGate/                    # Blocking modal (renders before any other content)
│   │   ├── AgeGate.tsx
│   │   └── AgeGate.module.css
│   ├── GameBoard/                  # Root game component — passes `mode` prop to all children
│   │   ├── GameBoard.tsx
│   │   └── GameBoard.module.css
│   ├── ProductCard/                # Accepts `mode: 'junior' | 'explorer'`
│   ├── MarketEventBanner/          # Accepts `mode` — simplified copy in Junior
│   ├── MarketCards/                # Collectible cards panel
│   ├── MarketTicker/               # Scrolling stock ticker bar (Explorer only)
│   ├── Timer/                      # SVG ring countdown timer
│   ├── StatsBar/                   # Bottom bar; coin stacks in Junior, dollar amounts in Explorer
│   ├── ModeToggle/                 # Settings icon → Junior / Explorer toggle
│   ├── Onboarding/                 # 3-step first-visit overlay; copy adapts to active mode
│   ├── SessionRecap/               # Post-session recap screen
│   ├── ReturnScreen/               # "You were away X days" screen (shown on re-login)
│   └── Footer/                     # Disclaimer text + link to /privacy (rendered on every page)
│
├── lib/
│   ├── auth.ts                     # NextAuth config, Google provider, age-tier cookie, DB upsert
│   ├── db.ts                       # Drizzle client — uses POSTGRES_URL (pooled) for app runtime
│   ├── schema.ts                   # Drizzle table definitions
│   ├── game-engine.ts              # Demand formula, event selection, win condition (no browser deps)
│   ├── stock-proxy.ts              # Price fetch, dampening, KV cache logic
│   ├── sync.ts                     # localStorage ↔ DB sync logic (plain module, no React)
│   └── hash.ts                     # sha256 via Web Crypto API (edge-compatible)
│
├── hooks/
│   ├── useGameState.ts             # Calls lib/sync.ts; provides game state to components
│   └── useStockPrices.ts           # Fetches /api/prices each round
│
├── types/
│   └── game.ts                     # Shared TypeScript types (GameState, Product, DisplayMode, etc.)
│
├── styles/
│   └── tokens.css                  # CSS custom properties (all design system tokens)
│
├── docs/                           # Project documentation (existing)
├── src/
│   └── stockstand.html             # Original MVP — preserved as reference, not deployed
├── public/
│   └── sounds/                     # Opt-in audio files (< 50 KB total)
│
├── drizzle/
│   └── migrations/                 # Auto-generated Drizzle migration files
│
├── next.config.ts
├── drizzle.config.ts
├── vercel.json
├── tsconfig.json
└── package.json
```

---

## 3. Packages and dependencies

### Production

| Package | Version | Purpose |
|---|---|---|
| `next` | `^15.0.0` | Framework: App Router, API routes, edge runtime |
| `react` | `^19.0.0` | UI library |
| `react-dom` | `^19.0.0` | DOM renderer |
| `next-auth` | `5.0.0-beta.25` | Auth: Google OAuth, session management, edge-native. **Pinned to exact beta — do not float.** |
| `drizzle-orm` | `^0.39.0` | ORM: type-safe Postgres queries, edge-compatible |
| `@vercel/postgres` | `^0.10.0` | Vercel Postgres (Neon) connection pooling client |
| `@vercel/kv` | `^3.0.0` | Redis KV — stock price cache |

> **No chart library** — sparklines and P&L chart built as custom SVG components (see §5.4).
> **No CSS-in-JS** — styling via CSS Modules + `styles/tokens.css`.
> **No crypto package** — Web Crypto API (`crypto.subtle`) used for sha256 — edge-compatible.

### Development

| Package | Version | Purpose |
|---|---|---|
| `typescript` | `^5.7.0` | Type checking |
| `@types/node` | `^22.0.0` | Node type definitions |
| `@types/react` | `^19.0.0` | React type definitions |
| `@types/react-dom` | `^19.0.0` | ReactDOM type definitions |
| `drizzle-kit` | `^0.30.0` | Drizzle CLI: generate and run migrations (uses `POSTGRES_URL_NON_POOLING`) |
| `eslint` | `^9.0.0` | Linting (Next.js config bundled) |
| `eslint-config-next` | `^15.0.0` | Next.js ESLint ruleset |
| `prettier` | `^3.0.0` | Formatting |

---

## 4. TypeScript types

```typescript
// types/game.ts

export type AgeTier     = 'child' | 'teen' | 'adult';
export type DisplayMode = 'junior' | 'explorer';
export type ProductId   = 'lemonade' | 'juice' | 'cookies' | 'tea' | 'mystery';

export interface ProductState {
  cost:           number;
  price:          number;
  salesThisRound: number;
  isOpen:         boolean;
}

export interface GameState {
  schemaVersion:   number;           // Increment on every breaking shape change; used for DB migration
  standName:       string;
  displayMode:     DisplayMode;      // 'junior' | 'explorer' — persisted in localStorage + DB
  winCondition:    'goal' | 'sandbox'; // Open question — field reserved so no schema migration needed later
  coins:           number;
  totalRevenue:    number;
  totalCosts:      number;
  round:           number;
  totalSales:      number;
  selectedProducts: ProductId[];
  products:        Record<ProductId, ProductState>;
  unlockedCards:   string[];
  stockPrices:     Record<string, number>;
  priceHistory:    Record<ProductId, number[]>; // Last 10 rounds — used by Explorer sparklines
  pnlHistory:      number[];                    // Cumulative net profit per round — used by P&L chart
  demandMult:      number;
  costMult:        number;
  currentEvent:    { type: 'good' | 'bad' | 'neutral'; emoji: string; title: string } | null;
  onboardingDone:  boolean;
  soundEnabled:    boolean;
  lastSaved:       string; // ISO timestamp — used for conflict resolution on DB sync
}
```

**Schema versioning:** When `GameState` shape changes, increment `schemaVersion`. The `lib/sync.ts` module runs a migration function before writing to or reading from the DB, converting old shapes to new.

---

## 5. Database schema

Single-user consumer app: **one table, one row per signed-in player.**
Under-13 (guest) users **never receive a DB row** — their state lives in `localStorage` only.

```typescript
// lib/schema.ts
import { pgTable, uuid, text, jsonb, timestamp, integer } from 'drizzle-orm/pg-core';
import type { GameState } from '@/types/game';

export const users = pgTable('users', {
  id:            uuid('id').defaultRandom().primaryKey(),

  // Google OAuth sub hashed with sha256 (Web Crypto) — raw sub never stored
  googleSubHash: text('google_sub_hash').notNull().unique(),

  // 'teen' (13–17) or 'adult' (18+). 'child' never reaches this table.
  ageTier:       text('age_tier', { enum: ['teen', 'adult'] }).notNull(),

  // Adults only — null for teens (data minimisation)
  email:         text('email'),
  displayName:   text('display_name'),

  // Full game state as JSON; schemaVersion field enables forward-migration
  gameState:     jsonb('game_state').$type<GameState>(),

  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastSeen:      timestamp('last_seen',  { withTimezone: true }).defaultNow().notNull(),
});

export type User    = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

**Indexes:** `google_sub_hash` is `UNIQUE` — serves as the lookup key on login.
**Connection URLs:** `POSTGRES_URL` (pooled, Neon serverless driver) for app runtime. `POSTGRES_URL_NON_POOLING` (direct connection) for `drizzle-kit` migrations only — never used by the app.
**Auto-purge:** Vercel Cron calls `GET /api/cron/purge-inactive` nightly. That route requires `Authorization: Bearer <CRON_SECRET>` and deletes rows where `last_seen < NOW() - INTERVAL '90 days'`.

---

## 5.1 Key data flows

### Age gate → auth → game

```
User visits /
      │
      ▼
app/loading.tsx renders CSS-only skeleton (no JS required)
      │
      ▼
AgeGate modal hydrates (reads localStorage for existing age_tier)
      │
  ┌───┴──────────────────────────┐
  │ child (< 13)                 │ teen / adult
  │                              │
  ▼                              ▼
Guest mode                  HttpOnly cookie `age_tier` set
localStorage only           BEFORE OAuth redirect fires
No DB row, ever             └─ NextAuth → Google → callback
  │                              │
  │                              ▼
  │                         lib/auth.ts signIn callback:
  │                           reads `age_tier` cookie
  │                           sha256(sub) via Web Crypto
  │                           DB upsert (teen: no email/name)
  │                           cookie cleared after use
  └──────────────┬──────────────┘
                 │
                 ▼
           /game page
    GameBoard receives `displayMode` from GameState
    (Junior/Explorer; auto-set from age_tier on first login)
```

### Round tick (stock prices)

```
Round timer reaches 0
      │
      ▼
useStockPrices hook calls GET /api/prices
      │
      ▼
app/api/prices/route.ts  [Edge runtime]
      │
      ├─ KV GET 'stock:prices:v1:{YYYYMMDD-HHMM}'   ← per-minute key prevents stale-shape bugs
      │     │
      │     ├─ HIT → return cached JSON
      │     │
      │     └─ MISS → fetch from Stock API
      │                │
      │                ├─ Apply dampening: game_delta = real_delta × 0.3
      │                ├─ Detect market_closed (NYSE hours + holiday check)
      │                ├─ KV SET key EX 55  ← 55s TTL prevents round-timer / TTL alignment issue
      │                └─ Return JSON
      │
      ▼
GameBoard: update product costs, event weights, market ticker
Append new prices to priceHistory (last 10 rounds, for sparklines)
Append net profit to pnlHistory (for P&L SVG chart)
      │
      ▼  (on round end)
lib/sync.ts → PUT /api/game-state → upsert to Postgres (signed-in users only)
```

### Game state persistence (single-user sync)

```
localStorage  ←→  lib/sync.ts  ←→  Postgres (signed-in only)
                       ↑
                 useGameState hook

- localStorage is the primary store (fast, always available)
- DB sync happens via lib/sync.ts on: round end, card unlock, session quit
- lib/sync.ts is a plain module — no React, fully testable
- On sign-in: load DB state; merge with localStorage using lastSaved timestamp (last-write-wins)
- Under-13 / guest: localStorage only; lib/sync.ts skips DB calls when no session exists
```

### 5.4 Custom SVG chart scope

**Sparklines (5 product cards × 10 data points):** Straightforward — a polyline element with `priceHistory[productId]` mapped to SVG coordinates. ~30 lines per component.

**P&L line chart (bottom bar):** Rendered as an axes-free SVG line connecting `pnlHistory` values. No axis labels, no grid lines — just a trend line matching the design system's profit/loss colours. This is intentionally minimal to stay within the zero-dependency constraint. If user testing shows players need axes and labels, `recharts` (~150 KB) can be added at that point.

---

## 6. Auth configuration

```typescript
// lib/auth.ts
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { cookies } from 'next/headers';
import { db } from './db';
import { users } from './schema';
import { sha256 } from './hash';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      // Read age_tier from the HttpOnly cookie set by AgeGate before OAuth redirect
      const cookieStore = await cookies();
      const ageTier = cookieStore.get('pending_age_tier')?.value;

      // Block sign-in entirely for under-13 — they should never reach OAuth
      if (!ageTier || ageTier === 'child') return false;

      const subHash = await sha256(account!.providerAccountId);

      await db.insert(users).values({
        googleSubHash: subHash,
        ageTier: ageTier as 'teen' | 'adult',
        email:       ageTier === 'adult' ? (profile?.email ?? null) : null,
        displayName: ageTier === 'adult' ? (profile?.name  ?? null) : null,
      })
      .onConflictDoUpdate({
        target: users.googleSubHash,
        set: { lastSeen: new Date() },
      });

      // Clear the age_tier cookie after it's consumed
      cookieStore.delete('pending_age_tier');
      return true;
    },

    async session({ session, token }) {
      session.user.ageTier = token.ageTier as AgeTier;
      return session;
    },
  },
});
```

> **COPPA note:** NextAuth v5 uses server-side OAuth redirects — it does NOT load the Google OAuth JS SDK (`accounts.google.com/gsi/client`) in the browser. No third-party script fires for any age tier at the framework level. Ensure no future developer adds a `<Script src="https://accounts.google.com/...">` tag — that would violate COPPA for under-13 sessions.

---

## 7. Hash utility (edge-compatible)

```typescript
// lib/hash.ts
// Uses Web Crypto API — works on Node.js, Vercel Edge, and browser runtimes.
// Do NOT use node:crypto here — it is unavailable on the Edge runtime.

export async function sha256(input: string): Promise<string> {
  const encoded    = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray  = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

---

## 8. Stock proxy (edge function)

```typescript
// app/api/prices/route.ts
export const runtime = 'edge';

import { kv } from '@vercel/kv';

const TICKERS    = ['AAPL', 'TSLA', 'MCD', 'KO', 'GME'] as const;
const INDICATORS = ['SPY', 'VIX'] as const;  // for event weighting
const DAMPENING  = 0.3;
const CACHE_TTL  = 55; // seconds — intentionally < 60s to prevent round-timer alignment issues

function cacheKey(): string {
  // Per-minute key: adding a new ticker never serves a stale shape from the previous schema
  const now = new Date();
  return `stock:prices:v1:${now.toISOString().slice(0, 16)}`; // e.g. 2026-05-27T06:00
}

export async function GET() {
  const key    = cacheKey();
  const cached = await kv.get(key);
  if (cached) return Response.json(cached);

  // Fetch from configured provider (Alpha Vantage or Polygon.io — see ERE-101)
  const raw      = await fetchFromProvider([...TICKERS, ...INDICATORS]);
  const response = buildGameResponse(raw, DAMPENING);

  await kv.set(key, response, { ex: CACHE_TTL });
  return Response.json(response);
}

/* Response shape:
{
  AAPL:    { price: 184.2, realDelta: 0.012, gameDelta: 0.004, marketClosed: false },
  TSLA:    { ... },
  MCD:     { ... },
  KO:      { ... },
  GME:     { ... },
  _market: { spyDelta: 0.008, vix: 18.4 }  // drives event weighting in game-engine.ts
  _stale:  false                            // true if served from fallback historical data
}
*/
```

**Fallback chain:** Live API → stale KV value (with `_stale: true`) → bundled historical JSON (`/public/fallback-prices.json`)

---

## 9. Cron: auto-purge inactive accounts

```typescript
// app/api/cron/purge-inactive/route.ts
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { lt, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  // Require CRON_SECRET to prevent unauthenticated bulk deletion
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const cutoff = sql`NOW() - INTERVAL '90 days'`;
  const result = await db.delete(users).where(lt(users.lastSeen, cutoff));
  return Response.json({ deleted: result.rowCount });
}
```

---

## 10. Plausible analytics (adult sessions only)

```typescript
// app/layout.tsx (simplified)
import { auth } from '@/lib/auth';

export default async function RootLayout({ children }) {
  // Session resolved server-side — no flash-of-analytics risk
  const session = await auth();
  const isAdult = session?.user?.ageTier === 'adult';

  return (
    <html>
      <body>
        {children}
        {/* Only inject Plausible after session is known to be adult.
            Never loads for child or teen sessions. */}
        {isAdult && (
          <script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
          />
        )}
      </body>
    </html>
  );
}
```

---

## 11. "You were away" return screen

When a signed-in user logs back in, the app compares `users.lastSeen` with the current date and shows a return screen if `lastSeen < NOW() - INTERVAL '1 day'`.

**API contract addition to `GET /api/game-state`:**

```typescript
// Response shape includes return-screen data when applicable:
{
  gameState: GameState,
  returnData: {
    daysAway:     number,        // Math.floor((now - lastSeen) / 86400000)
    priceChanges: {              // How stocks moved while they were away
      [ticker: string]: {
        priceThen: number,
        priceNow:  number,
        deltaPercent: number
      }
    }
  } | null  // null if user was last seen < 24h ago
}
```

**Component:** `components/ReturnScreen/ReturnScreen.tsx` — shown as a full-screen overlay before `/game`. Dismissed with "Back to my stand →".

---

## 12. CSS design tokens

```css
/* styles/tokens.css — imported globally in app/layout.tsx */
:root {
  /* Primary */
  --yellow:            #F5C518;
  --yellow-dark:       #E6A800;
  --yellow-light:      #FFF8DC;

  /* Semantic */
  --green:             #2ECC71;
  --green-dark:        #27AE60;
  --red:               #E74C3C;
  --red-dark:          #C0392B;

  /* Accent */
  --blue:              #3498DB;
  --purple:            #9B59B6;
  --orange:            #E67E22;

  /* Neutral */
  --bg:                #FFFBF0;
  --card:              #FFFFFF;
  --text:              #2C2C2C;
  --muted:             #6B6B6B;  /* ⚠️ Was #888888 (3.2:1 on --bg — fails WCAG AA).
                                      #6B6B6B gives ~4.6:1 on #FFFBF0 — verify with
                                      https://webaim.org/resources/contrastchecker/ */
  --border:            #EEEEEE;

  /* Spacing */
  --page-padding:      28px;
  --card-padding:      24px;
  --card-gap:          20px;
  --radius-card:       20px;
  --radius-btn:        12px;
  --radius-pill:       100px;

  /* Tap targets */
  --btn-height:        44px;    /* Default minimum (WCAG 2.5.5) */
  --btn-height-junior: 56px;    /* Junior mode — larger targets for ages 6–8 */
}

/* Honour user motion preference — required for WCAG AA (2.3.3) */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration:   0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration:  0.01ms !important;
  }
}
```

---

## 13. Security headers & CSP

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options',           value: 'DENY' },
        { key: 'X-Content-Type-Options',    value: 'nosniff' },
        { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
        {
          key: 'Content-Security-Policy',
          // Whitelist only known origins. Plausible and stock API are connect-src.
          // Update STOCK_API_HOST when provider is confirmed (ERE-101).
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://plausible.io",   // unsafe-inline required for Next.js inline scripts
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "connect-src 'self' https://plausible.io https://*.alphavantage.co https://*.polygon.io",
            "img-src 'self' data:",
            "frame-ancestors 'none'",
          ].join('; '),
        },
      ],
    },
  ],
};

export default config;
```

---

## 14. Environment variables

```bash
# ── NextAuth ────────────────────────────────────────────────────────────────
NEXTAUTH_URL=https://stockstand.vercel.app    # ⚠️ Production domain TBD — required for OAuth callbacks
NEXTAUTH_SECRET=                              # openssl rand -base64 32

# ── Google OAuth ─────────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID=                             # Google Cloud Console
GOOGLE_CLIENT_SECRET=

# ── Vercel Postgres (Neon) ───────────────────────────────────────────────────
POSTGRES_URL=                                 # Auto-set by Vercel (pooled — app runtime only)
POSTGRES_URL_NON_POOLING=                     # Auto-set by Vercel (direct — drizzle-kit migrations only)

# ── Vercel KV (Redis) ────────────────────────────────────────────────────────
KV_URL=                                       # Auto-set by Vercel when KV is linked
KV_REST_API_URL=
KV_REST_API_TOKEN=

# ── Stock API ─────────────────────────────────────────────────────────────────
STOCK_API_KEY=                                # ⚠️ Provider TBD — see ERE-101
STOCK_API_PROVIDER=alphavantage               # alphavantage | polygon | marketstack

# ── Cron security ─────────────────────────────────────────────────────────────
CRON_SECRET=                                  # openssl rand -base64 32 — guards /api/cron/* routes

# ── Analytics ──────────────────────────────────────────────────────────────────
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=stockstand.vercel.app  # ⚠️ Update when domain is confirmed
```

`POSTGRES_*` and `KV_*` are injected automatically when you link the services in the Vercel dashboard.

---

## 15. COPPA compliance in the architecture

| Rule | Where enforced |
|---|---|
| Age gate fires before any third-party script | `app/layout.tsx` — Plausible only rendered after `await auth()` resolves to `adult`; Plausible cannot flash for non-adult sessions |
| Google OAuth JS SDK never loads in browser | NextAuth v5 uses server-side redirects only — explicitly documented here to prevent future regressions |
| Google OAuth button never shown to under-13 | AgeGate component; `signIn()` call gated by `age_tier` cookie in `lib/auth.ts` |
| Under-13 never gets a DB row | `lib/auth.ts` `signIn` callback returns `false` for `child` tier |
| `age_tier` reliably passed to `signIn` callback | Set as `HttpOnly` cookie before OAuth redirect; read and deleted in callback |
| `google_sub` never stored raw | `lib/hash.ts` Web Crypto sha256 wrapper used in every DB write path |
| Plausible loads only for adults | Server-rendered in `layout.tsx` only when `session.user.ageTier === 'adult'` |
| Analytics suppressed for child/teen | Plausible script tag conditionally rendered; no other analytics SDK present |
| Auto-purge inactive accounts (90 days) | Vercel Cron: `0 3 * * *` → `GET /api/cron/purge-inactive` (guarded by `CRON_SECRET`) |
| Teen data minimisation | `email` and `displayName` columns always `null` for `age_tier = 'teen'` |
| "For entertainment only" disclaimer | `components/Footer/` renders on every page; linked to `/privacy` |
| Privacy policy page | `app/privacy/page.tsx` — linked from footer on every page |

---

## 16. Vercel deployment configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/purge-inactive",
      "schedule": "0 3 * * *"
    }
  ]
}
```

---

## 17. Migration checklist (MVP → v1.1, sprint-ordered)

### Sprint 1 prerequisites (before any code)
- [ ] Resolve stock API provider (ERE-101) — `STOCK_API_KEY` and `STOCK_API_PROVIDER` must be set
- [ ] Confirm production domain — required for `NEXTAUTH_URL` and Plausible config
- [ ] Decide win condition: `$100 goal` vs `sandbox` — determines `winCondition` field default in `GameState`

### Sprint 1 — Foundation & live data
- [ ] `npx create-next-app@latest` with TypeScript, App Router, no Tailwind, src dir off
- [ ] Pin `next-auth` to exact beta version (currently `5.0.0-beta.25`) in `package.json`
- [ ] Add Google Fonts via `next/font/google` in `app/layout.tsx` (Fredoka One + Nunito)
- [ ] Copy `styles/tokens.css` from §12 — verify `--muted` contrast at [webaim.org/resources/contrastchecker](https://webaim.org/resources/contrastchecker/)
- [ ] Port `lib/game-engine.ts` from `stockstand.html` game logic (TypeScript, no browser deps)
- [ ] Port `types/game.ts` — include `schemaVersion`, `displayMode`, `winCondition`, `priceHistory`, `pnlHistory`
- [ ] Implement `lib/hash.ts` using `crypto.subtle` (verify works on Vercel Edge)
- [ ] Build `/api/prices` edge function with KV cache (55s TTL, per-minute cache key)
- [ ] Build fallback: bundle `/public/fallback-prices.json` with 30 days of historical data

### Sprint 2 — Game UI rewrite
- [ ] Build components bottom-up: `ProductCard` → `StatsBar` → `Timer` → `MarketEventBanner` → `GameBoard`
- [ ] All components accept `mode: DisplayMode` prop from `GameBoard`
- [ ] Implement custom SVG sparklines in `ProductCard` (Explorer mode only)
- [ ] Implement custom SVG P&L trend line in `StatsBar` (axes-free — see §5.4)
- [ ] Add `app/loading.tsx` CSS-only skeleton for cold-load before AgeGate hydrates
- [ ] Add `components/Footer/` with disclaimer text and link to `/app/privacy`
- [ ] Wire `useGameState` hook → `lib/sync.ts` (sync module is pure TS, no React)

### Sprint 3 — Junior mode
- [ ] Build `ModeToggle` component (settings icon, Junior/Explorer, persists to localStorage)
- [ ] Junior mode: coin emoji stacks, no tickers, smiley margin, 56px buttons (`--btn-height-junior`)
- [ ] Explorer mode: stock chip, sparkline, real % move in event banner
- [ ] `prefers-reduced-motion` already handled globally in `tokens.css` — verify per-component

### Sprint 4 — Auth & persistence
- [ ] Link Vercel Postgres in dashboard → `POSTGRES_*` env vars auto-populated
- [ ] Link Vercel KV in dashboard → `KV_*` env vars auto-populated
- [ ] `npx drizzle-kit generate` + `npx drizzle-kit migrate` → creates `users` table
- [ ] Configure Google OAuth in Google Cloud Console; add Vercel preview + production callback URLs
- [ ] Set `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` in Vercel
- [ ] Set `CRON_SECRET` in Vercel (used by `/api/cron/purge-inactive`)
- [ ] Build `AgeGate` component — sets `HttpOnly` cookie before OAuth redirect
- [ ] Implement `lib/auth.ts` — reads `pending_age_tier` cookie, sha256 hash, DB upsert, cookie delete
- [ ] Build `ReturnScreen` component and extend `GET /api/game-state` with `returnData`
- [ ] Add `vercel.json` cron definition
- [ ] Run `/compliance-check "auth age-gate analytics DB-write cron-purge"` before merging

### Sprint 5 — QA
- [ ] Verify WCAG AA contrast for all tokens (especially `--muted` — see §12)
- [ ] Verify `prefers-reduced-motion` kills all transitions/animations
- [ ] Verify Plausible does NOT fire for child or teen sessions (devtools Network tab)
- [ ] Verify Google OAuth script NOT present in document for any session (devtools Elements)
- [ ] Verify `google_sub` never appears in DB (query `users` table directly)
- [ ] Privacy policy content written for `app/privacy/page.tsx`
- [ ] Footer disclaimer visible on every page, links to `/privacy`
- [ ] CSP header validated — no CSP violations in browser console
- [ ] Lighthouse ≥ 85 on mobile and desktop (screenshot attached to ERE-99)

---

## 18. Open questions (unresolved)

- [ ] **Stock API provider** — evaluation in progress; tracked in ERE-101. `STOCK_API_KEY` blocks Sprint 1.
- [ ] **Win condition** — `$100 save goal` vs `sandbox`; `winCondition` field reserved in schema; tracked in ERE-106.
- [ ] **Production domain** — required before configuring Google OAuth callback URLs, `NEXTAUTH_URL`, and Plausible domain.
- [ ] **NextAuth v5 stable release** — currently pinned to `5.0.0-beta.25`. Check [github.com/nextauthjs/next-auth/releases](https://github.com/nextauthjs/next-auth/releases) before launch and update to stable if available.
