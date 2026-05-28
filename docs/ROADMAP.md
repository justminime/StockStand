# Product Requirements Document
## StockStand — v1.0 MVP

**Status:** In development  
**Platform:** Desktop browser (Chrome, Firefox, Safari, Edge)  
**Data:** Simulated market (MVP) → Live API (v1.1)  
**Auth:** None — localStorage only (MVP)  
**Last updated:** May 2026

---

## 1. Problem statement

Children and young adults have almost no exposure to how markets work before adulthood. Existing tools — Investopedia, paper trading apps, finance courses — are adult-first and intimidating. There is no product that teaches real market intuition to kids in a way that feels like play.

StockStand solves this by wrapping real stock market concepts inside the joyful, familiar metaphor of running a lemonade stand. Kids learn supply & demand, profit margins, and market volatility just by playing — without ever knowing they're getting a finance education.

---

## 2. Vision

> "The game where running a lemonade stand teaches you more about investing than most adults know."

---

## 3. Target users

| Persona | Age | Goal | Mode |
|---|---|---|---|
| Lemon Kid | 6–10 | Have fun, feel like a shop owner | Junior (emoji-heavy, no raw numbers) |
| Market Explorer | 11–17 | Understand why prices change, beat the market | Explorer (data + stock names visible) |
| Curious Adult | 18+ | Learn investing basics in a low-stakes sandbox | Explorer + full data |
| Parent / Teacher | 25+ | See what kids are learning, use as a teaching tool | Dashboard (v1.3) |

---

## 4. Core concept

Every product sold at the stand is secretly linked to a real publicly traded stock:

| Product | Linked Stock | Why |
|---|---|---|
| Classic Lemonade | AAPL (Apple) | Stable, evergreen, everyone loves it |
| Exotic Juice Blend | TSLA (Tesla) | Exciting, volatile, big swings |
| Warm Cookies | MCD (McDonald's) | Consumer staple, low drama |
| Iced Tea | KO (Coca-Cola) | Slow, steady, dividend-like loyalty |
| Mystery Sip | GME (GameStop) | Wild card, high risk / high reward |

When the linked stock moves, the ingredient cost for that product changes. A market rally makes demand go up. A supply chain event makes costs rise. The game world mirrors the real market — with a dampening layer so extreme moves don't break gameplay.

**Dampening formula:** `game_cost_delta = real_stock_delta × 0.3`

This means a real 10% stock move creates a 3% ingredient cost change — dramatic enough to feel real, small enough to keep the game fun.

---

## 5. Core game loop

```
Open stand → Pick products → Set prices → Market event fires →
Ingredient costs shift → Adjust prices → Sell → Earn coins →
Unlock Market Card → Repeat
```

Each loop takes ~60 seconds (one round). Sessions are designed for 5–15 rounds (5–15 minutes).

---

## 6. Features — MVP scope

### F1 · Stand setup
- Player names their stand (max 28 characters)
- Picks 2–3 products from a menu of 5
- Each product shows its linked stock ticker and a one-line personality description
- Setup persists in localStorage

### F2 · Product cards
- Each active product has a card showing:
  - Product emoji, name, linked stock
  - Current ingredient cost (updated each round)
  - Price slider (min: cost + $0.01, max: cost × 5)
  - Live profit margin bar (green > 40%, yellow 15–40%, red < 15%)
  - Demand meter (5 emoji faces, updates as price changes)
  - Stock move indicator (▲/▼/● with % change)
  - Sell button that triggers a customer animation + coin pop

### F3 · Market events engine
- A 60-second countdown fires a random event each round
- 10 event types: heat wave, rain, festival, supply chain issue, market rally, road works, school letting out, energy spike, organic trend, news day
- Each event has: emoji, kid-friendly headline, description, demand multiplier, cost multiplier, stock delta
- Event banner slides in with color coding (green = good, red = bad)
- Market ticker scrolls across the top showing all stock prices + % moves

### F4 · Selling simulation
- Clicking "Sell" calculates customers based on demand curve:
  - `demand_score = (cost × 2.2 / price) × demand_multiplier`
  - `num_customers = round(demand_score × 6 × demand_mult)`
- Customers appear as animated emoji people walking in
- Coin pop animation shows profit/loss per sale
- Revenue, costs, and net profit update in real time in the bottom bar

### F5 · Market Cards (learn layer)
- 8 collectible cards unlock based on gameplay triggers:

| Card | Trigger |
|---|---|
| Supply & Demand | Cost spike event fires |
| Profit Margin | Player achieves > 55% margin |
| Volatility | Any stock moves > 5% from base |
| Bull Market | Positive event fires |
| Bear Market | Negative event fires |
| Revenue vs Profit | Player makes 10 total sales |
| Diversification | Player has 2+ products active |
| Opportunity Cost | Player reaches round 5 |

- Cards slide in as a panel from the right
- Locked cards show as greyed out with a lock icon
- Lesson popup appears for 5 seconds when a card is unlocked

### F6 · Persistence
- Full game state saved to localStorage on every action
- On return visit: prompt to resume or start fresh
- Saved: stand name, coins, round, stock prices, unlocked cards, product states

### F7 · Topbar & stats
- Stand name display
- Live coin counter (total wallet)
- Net profit pill (green = positive, red = negative)
- Round counter
- Bottom bar: Revenue / Costs / Net Profit / Cards collected

---

## 7. Non-goals (MVP)

- No user accounts or authentication
- No backend or database
- No real-time stock API (simulated data only)
- No multiplayer or leaderboards
- No sound or music
- No mobile-specific layout (desktop first)
- No parent dashboard
- No ads or monetization
- Not a financial product — "for entertainment only"

---

## 8. Success metrics

| Metric | Target |
|---|---|
| Average session length | > 8 minutes |
| Rounds played per session | > 5 |
| Market Cards unlocked per session | 2–4 |
| Day-2 return rate | > 35% |
| Concept recall (optional post-session quiz) | > 60% |

---

## 9. Technical specifications

### Stack
- Single HTML file (Vanilla JS + CSS) — zero build step, zero dependencies
- Google Fonts loaded via CDN (Fredoka One + Nunito)
- localStorage for all persistence

### localStorage schema
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
    "stockPrices": {
      "AAPL": 184.2, "TSLA": 251.8, "MCD": 297.4, "KO": 63.1, "GME": 17.9
    },
    "demandMult": 1.4,
    "costMult": 1.0,
    "currentEvent": { "type": "good", "emoji": "☀️", "title": "Perfect weather!" }
  }
}
```

### Browser support
Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Performance targets
- First meaningful paint: < 1s
- No network requests after initial load (MVP)
- localStorage operations: synchronous, < 5ms

---

## 10. Open questions

- [ ] Which stock API to use for v1.1? (Alpha Vantage, Polygon.io, or Marketstack)
- [ ] Win condition: save $100 goal, or infinite sandbox?
- [ ] Should Market Cards be shareable as images?
- [ ] Junior mode (ages 6–8): is voice narration in scope for v1.1?
- [ ] Should the mystery product (GME) be locked until round 5?

---

## 11. Out of scope / future versions

See `ADDONS.md` for post-MVP features including:
- Live stock API integration
- Age-tiered Google login + database persistence
- Junior mode (simplified UI for ages 6–8)
- Classroom pack (teacher dashboard)
- Portfolio mode (multiple stands = diversified portfolio)
- Historical market replay ("What if" time machine)
- News ticker integration
