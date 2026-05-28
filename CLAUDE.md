# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project overview

**StockStand** is a browser-based educational game for kids (ages 6–17+) where running a lemonade stand secretly teaches real investing concepts — supply & demand, profit margins, volatility, diversification. Every product sold is secretly linked to a real publicly traded stock.

**Vision:** "The game where running a lemonade stand teaches you more about investing than most adults know."

---

## ⚠️ Critical: file names do not match contents

The docs were uploaded with mismatched filenames. Actual content per file:

| File name | Actual content |
|---|---|
| `README.md` | Project overview (correct) |
| `stockstand.html` | Design system (colors, typography, components, animations) |
| `docs/ROADMAP.md` | PRD — product requirements, game loop, localStorage schema, tech specs |
| `docs/COMPLIANCE.md` | Roadmap — 6-sprint plan, technical decisions log |
| `docs/DESIGN_SYSTEM.md` | COPPA 2025 & privacy/compliance guide |
| `docs/PRD.md` | Add-ons & post-MVP extensions (Junior mode, Classroom pack, Portfolio mode, etc.) |

When working with any of these docs, use the table above to find the right file. The `docs/` directory now exists; `stockstand.html` is still at the repo root (not yet in `src/`).

---

## Stack & architecture

- **MVP:** Single HTML file (`stockstand.html`) — Vanilla HTML + CSS + JS, zero dependencies, zero build step
- **Persistence:** `localStorage` only — no backend, no accounts, no COPPA exposure in MVP
- **Fonts:** Google Fonts CDN only (Fredoka One + Nunito)
- **Market data:** Simulated in MVP; real stock API added in v1.1 via a server-side proxy

**v1.1+ tech decisions (already decided):**
- Frontend framework: Vanilla JS (MVP) → React (v1.1)
- Hosting: Vercel (edge functions for API proxy)
- Auth: Firebase Auth (Google OAuth)
- Database: Supabase
- Analytics: Plausible (COPPA-safe — no cookies, no PII)
- Stock API: Alpha Vantage (MVP) → Polygon.io (scale)

---

## Running / testing

No build step. Open the game file directly in a browser:

```
open stockstand.html
```

There is no package.json, no npm, no test framework. Browser support: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+.

---

## localStorage schema

All game state is persisted under the key `stockstand_v1`:

```json
{
  "stockstand_v1": {
    "standName": "Sunny Sips Co.",
    "coins": 24.50,
    "totalRevenue": 48.20,
    "totalCosts": 23.70,
    "round": 7,
    "totalSales": 34,
    "selectedProducts": ["lemonade", "cookies"],
    "products": {
      "lemonade": { "cost": 1.28, "price": 2.75, "salesThisRound": 0, "isOpen": true },
      "cookies":  { "cost": 0.96, "price": 2.10, "salesThisRound": 0, "isOpen": true }
    },
    "unlockedCards": ["supply_demand", "bull_market", "multi_product"],
    "stockPrices": { "AAPL": 184.2, "TSLA": 251.8, "MCD": 297.4, "KO": 63.1, "GME": 17.9 },
    "demandMult": 1.4,
    "costMult": 1.0,
    "currentEvent": { "type": "good", "emoji": "☀️", "title": "Perfect weather!" }
  }
}
```

---

## Core game mechanics

**Product → stock mapping:**
| Product | Stock | Behavior |
|---|---|---|
| Classic Lemonade | AAPL | Stable, evergreen |
| Exotic Juice Blend | TSLA | Volatile, big swings |
| Warm Cookies | MCD | Consumer staple, low drama |
| Iced Tea | KO | Slow & reliable |
| Mystery Sip | GME | Wild card, high risk/reward |

**Dampening formula:** `game_cost_delta = real_stock_delta × 0.3`
(a real 10% stock move → 3% ingredient cost change)

**Demand formula:**
```
demand_score   = (cost × 2.2 / price) × demand_multiplier
num_customers  = round(demand_score × 6 × demand_mult)
```

---

## Design rules (summary — full spec in `stockstand.html`)

- **Background:** `#FFFBF0` (warm white) — never plain white
- **Primary color:** `#F5C518` (lemon yellow)
- **Profit:** `#2ECC71` (green) | **Loss:** `#E74C3C` (red)
- **Fonts:** Fredoka One for hero/buttons; Nunito for everything else — never use Inter/Roboto/system fonts
- **Animations:** `transform` and `opacity` only (GPU-accelerated); 200–400ms; always wrap in `prefers-reduced-motion`
- **Accessibility:** WCAG AA minimum contrast; never use color as the sole signal
- **Junior mode** (ages 6–8): emoji-only amounts, no stock names, smiley face instead of margin bar
- **Explorer mode** (ages 11+): stock names, sparklines, % moves visible

Run `/design-system` to load the full component specs before building any UI.

---

## COPPA compliance rules

> Full guide in `docs/DESIGN_SYSTEM.md` (see file name mapping above).

**MVP is COPPA-safe** — zero personal data collected, localStorage never leaves the device.

**For v1.1+ (when adding auth/data):**
- Age gate **must** appear before Google OAuth initializes — Under 13 → guest/localStorage only, no OAuth button shown
- Analytics (Plausible) must **only load** for `age_tier === 'adult'`
- No third-party SDK (analytics, ads, tracking) may fire for under-13 users
- Store `google_sub` as `sha256(sub)` — never raw
- Auto-purge inactive teen/adult accounts after 90 days
- Footer must display: *"StockStand is a game for educational purposes only. Stock prices shown are approximate and may be delayed. This is not financial advice."*

Run `/compliance-check` before adding any feature that touches auth, analytics, or personal data.

---

## Repo conventions

- All game code lives in `stockstand.html` (MVP is a single file)
- PRs: include a clear description of what changed and why (see README)
- "For entertainment only" disclaimer must appear on every screen
- When adding a real stock API: proxy server-side (API key must never appear in client bundle); cache 1 poll per ticker per minute; apply dampening formula server-side
