# Roadmap
## StockStand — From Prototype to Launch

---

## Current status

| Milestone | Status |
|---|---|
| ✅ Concept & PRD | Complete |
| ✅ Design system | Complete |
| ✅ Playable prototype (simulated data) | Complete |
| 🔜 Live stock API | Next |
| 📋 Auth & persistence | Planned |
| 📋 Polish & launch | Planned |

---

## Sprint plan

### Sprint 1 — Foundation & live data · Weeks 1–2

**Goal:** Replace simulated stock prices with real market data.

- [ ] Evaluate and select stock API (Alpha Vantage vs Polygon.io vs Marketstack)
- [ ] Build server-side proxy (Vercel edge function or Netlify function)
  - API key never exposed in client bundle
  - Cache responses: 1 poll per ticker per minute, shared across all sessions
  - Apply dampening formula server-side: `game_delta = real_delta × 0.3`
- [ ] Handle market-closed state (weekends, holidays, after-hours)
  - Serve last known price with `"market_closed": true` flag
  - Game shows "Market closed — using yesterday's prices" banner
- [ ] Handle API rate limit fallback (serve cached historical data)
- [ ] Update stock prices in game state on each round tick
- [ ] Update market ticker to show real prices

**Deliverable:** Game runs on real AAPL, TSLA, MCD, KO, GME prices.

---

### Sprint 2 — Game polish · Weeks 3–4

**Goal:** Make the core loop feel irresistible.

- [ ] Win condition: "Save $100" goal with a progress bar (optional toggle: sandbox mode)
- [ ] Session end recap screen: "Best decision of the day", total earned, cards collected
- [ ] Stand illustration: static SVG background (3 visual themes to choose from)
- [ ] Lock Mystery Sip (GME) until round 5 — adds progression
- [ ] Onboarding: 3-step overlay tutorial for first-time players
- [ ] Sound effects: opt-in toggle, coin sound on sale, event chime (lightweight, < 50kb)
- [ ] Improve event engine: weight events by current real market conditions
  - If real S&P500 is up today → weight good events higher
  - If VIX is elevated → weight volatile events higher

**Deliverable:** First-time experience is smooth. Players understand the goal.

---

### Sprint 3 — Junior mode · Weeks 5–6

**Goal:** Make the game work for ages 6–8 without dumbing down the engine.

- [ ] Mode toggle: Junior / Explorer (stored in localStorage)
- [ ] Junior mode UI changes:
  - Replace all dollar amounts with coin emoji stacks (🪙🪙🪙)
  - Remove stock ticker and stock names from product cards
  - Replace margin bar with a simple smiley/frowny face
  - Event copy simplified: "It's hot outside! More people want drinks!"
  - Larger tap targets (buttons 56px min height)
- [ ] Explorer mode additions:
  - Stock name chip visible on product card
  - Sparkline chart (last 10 rounds) on each card
  - Real stock % move shown in event banner
  - P&L line chart in bottom bar (recharts or Chart.js)
- [ ] Mode auto-detected by age gate (v1.1 auth) or manually selectable

**Deliverable:** A 7-year-old and a 14-year-old can both play the same game.

---

### Sprint 4 — Auth & persistence (v1.1) · Weeks 7–8

**Goal:** Add optional accounts so players can save cross-device.

- [ ] Age gate: hard modal on first visit — Under 13 / 13–17 / 18+
  - Choice stored in localStorage
  - Under 13: localStorage only, no Google OAuth shown
  - 13+: Google OAuth shown as optional
- [ ] Google OAuth integration (Firebase Auth or NextAuth)
- [ ] Backend DB (Supabase or PlanetScale):
  - Under 13: no row created
  - Teen (13–17): `{ google_sub_hashed, age_tier: 'teen', game_state, last_seen }`
  - Adult (18+): `{ google_sub_hashed, email, age_tier: 'adult', game_state, last_seen }`
- [ ] "You were away 3 days — here's what the market did to your ingredients" return screen
- [ ] COPPA compliance audit:
  - Privacy-safe analytics (Plausible — no PII, no cookies)
  - Analytics suppressed entirely for guest and teen sessions
  - "For entertainment only" disclaimer in footer
  - Data retention: auto-purge inactive accounts after 90 days

**Deliverable:** Players can log in on any computer and resume their stand.

---

### Sprint 5 — QA, legal & accessibility · Weeks 9–10

**Goal:** Launch-ready quality bar.

- [ ] WCAG AA audit — fix all contrast and keyboard navigation issues
- [ ] Legal review:
  - COPPA 2025 compliance checklist (see `COMPLIANCE.md`)
  - Stock API terms of service review
  - "For entertainment only" disclaimer visible on every screen
- [ ] Cross-browser testing: Chrome, Firefox, Safari, Edge
- [ ] Performance audit: Lighthouse score > 85
- [ ] Fallback testing:
  - API down → serve cached data, show "Using saved prices" notice
  - localStorage full → graceful degradation
  - Market closed → weekend/holiday handling
- [ ] Load testing: simulate 50 concurrent sessions hitting the API proxy

**Deliverable:** No known bugs, legally reviewed, accessible.

---

### Sprint 6 — Beta & launch · Weeks 11–12

**Goal:** Real users, real feedback, public launch.

- [ ] Closed beta with 5–10 families across age groups (6–8, 11–13, 16–18, adults)
- [ ] Structured feedback sessions:
  - Did kids understand what to do without instructions?
  - Did they understand why prices changed?
  - Did they want to come back tomorrow?
- [ ] Fix top 10 usability issues from beta
- [ ] Set up Plausible analytics (privacy-first, COPPA-safe)
- [ ] Public launch:
  - Product Hunt submission
  - Reddit: r/personalfinance, r/investing, r/learnprogramming
  - Twitter/X announcement thread
  - Teacher outreach: email 20 personal finance teachers

**Deliverable:** Public URL live, first 100 players, feedback loop established.

---

## Post-launch backlog (v1.2+)

| Feature | Priority | Notes |
|---|---|---|
| Portfolio mode (multiple stands) | High | Teaches diversification |
| Market Cards as shareable images | Medium | Social virality |
| Classroom pack (teacher dashboard) | High | Monetization path |
| News ticker integration | Medium | Real headlines → game events |
| Historical replay ("What if" mode) | High | 2008 crash, COVID dip, meme stocks |
| Mobile responsive layout | High | Kids play on tablets |
| Dark mode | Low | v1.2 polish |
| Multiplayer / class leaderboard | Medium | Engagement mechanic |

See `ADDONS.md` for full specs on each.

---

## Technical decisions log

| Decision | Choice | Rationale |
|---|---|---|
| Frontend framework | Vanilla JS (MVP) → React (v1.1) | Zero build complexity for MVP |
| Stock API | TBD — Alpha Vantage or Polygon.io | Evaluate cost vs rate limits |
| Auth provider | Firebase Auth (Google OAuth) | Free tier, well-documented |
| Database | Supabase | Free tier, Postgres, real-time |
| Hosting | Vercel | Free tier, edge functions for API proxy |
| Analytics | Plausible | COPPA-safe, no cookies, $9/mo |
| Dampening formula | real_delta × 0.3 | Validated by playtesting |

---

## Open questions

- [ ] Win condition or infinite sandbox? (user testing will decide)
- [ ] Should Market Cards be exportable/shareable?
- [ ] Classroom pack: school SaaS model or freemium?
- [ ] Should GME be the mystery stock or rotate randomly?
- [ ] Voice narration for Junior mode — in scope for v1.1?
