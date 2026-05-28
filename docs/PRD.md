# Add-ons & Extensions
## StockStand — Post-MVP Features

---

## Add-on A · Junior mode (ages 6–8)
**Target version:** v1.1  
**Effort:** Medium (2 sprints)

A completely redesigned presentation layer for young players. Same underlying game engine — different everything else.

**Changes from default UI:**
- All dollar amounts replaced with coin emoji stacks (🪙🪙🪙)
- Stock tickers and company names hidden
- Margin bar replaced with a happy/sad face indicator
- Event copy simplified: "Hot day! People are thirsty!" instead of market language
- Larger tap targets (56px min button height)
- Bright, maximalist color use
- Optional: voice narration of events (Web Speech API or pre-recorded)

**Auto-detection:** If age gate selects "Under 13", Junior mode activates automatically. Can be manually toggled by a parent via a settings icon.

---

## Add-on B · Classroom pack
**Target version:** v1.2  
**Effort:** High (3–4 sprints)  
**Monetization:** $99/year per classroom

Turns StockStand into a structured learning tool for teachers.

**Teacher features:**
- Dashboard to set a market scenario (crash, boom, sector rotation, inflation)
- Assign scenario to a class — all students play the same market conditions
- Closed leaderboard (class-only, no public data)
- Session export: PDF discussion guide showing class-wide results
- Concept coverage report: which Market Cards each student unlocked

**Student features (classroom mode):**
- Class code to join instead of individual account
- Stand names visible to teacher (anonymized to classmates)
- Preset starting conditions set by teacher

**Legal note:** School context brings FERPA into scope alongside COPPA. School administrator consent covers COPPA requirements for under-13 students in an educational context.

---

## Add-on C · Portfolio mode
**Target version:** v1.2  
**Effort:** High (3 sprints)

Instead of one stand, the player owns multiple stands in different "neighborhoods" (market sectors). Each stand is tied to a sector ETF.

**Sectors / neighborhoods:**
| Neighborhood | ETF | Products |
|---|---|---|
| Tech Corner | QQQ | Phone cases, gadgets |
| Main Street | XLP | Lemonade, cookies, everyday items |
| Energy Block | XLE | Hot drinks, fuel-linked items |
| Health Hub | XLV | Smoothies, vitamins |

**Core lesson:** Diversification — when one stand struggles, others compensate. Players viscerally feel why investors spread risk.

**UI:** A neighborhood map showing all stands. Click a stand to manage it. Overall portfolio P&L shown at the top.

---

## Add-on D · News ticker integration
**Target version:** v1.3  
**Effort:** Medium (1–2 sprints)

Real financial headlines translated into stand-flavored game events.

**How it works:**
1. Poll a news API (Tiingo, NewsAPI) for financial headlines every 15 minutes
2. Run headlines through a classifier (keyword matching or lightweight LLM call)
3. Map headline to a game event template:
   - "Apple reports record iPhone sales" → "Lemon Inc. launches a super lemon! Demand surges!"
   - "Oil prices spike" → "Energy costs up! Refrigeration is more expensive today."
   - "Fed raises interest rates" → "Borrowing gets expensive. Customers tighten spending."
4. Inject as a special "Breaking News" event with a 📰 icon

**Why this matters:** Creates a direct, memorable link between reading the news and understanding market impact. Older players start checking financial news voluntarily.

---

## Add-on E · Market Cards — full set (20 cards)
**Target version:** v1.1  
**Effort:** Low (1 sprint)

Expand from 8 to 20 collectible Market Cards covering a full intro finance curriculum.

**Additional cards:**

| Card | Concept | Trigger |
|---|---|---|
| 📊 Stock Market | What is a stock exchange | Round 1 |
| 🏦 Interest Rate | How rates affect spending | Fed event fires |
| 💸 Inflation | Why prices rise over time | 3+ cost spikes |
| 🛢️ Commodity | Raw material price basics | Supply event |
| 📉 Recession | When the economy shrinks | 3 bad events in a row |
| 🏆 Blue Chip | Stable, reliable large companies | AAPL/KO stable for 5 rounds |
| 🎯 Price-to-Earnings | How investors value companies | Explorer mode, round 8 |
| 💎 Dividend | Companies sharing profit | KO product selected |
| 🔄 Market Cycle | Boom → bust → recovery | Round 10 |
| 🌍 Global Market | Events abroad affect local prices | International event |
| ⚡ Meme Stock | Hype-driven price spikes | GME moves > 15% |
| 🏗️ IPO | When a company first sells shares | Mystery product unlocked |

**Presentation:** Cards designed as beautiful trading card visuals — front (illustration + name), back (explanation + real-world example). Shareable as PNG images.

---

## Add-on F · "What if" time machine
**Target version:** v2.0  
**Effort:** High (3–4 sprints)

Replay a real historical market event as a stand session.

**Scenarios:**
- 🔴 2008 Financial Crisis — watch your ingredient costs collapse, then spiral
- 🟡 COVID March 2020 — sudden demand crash, then V-shaped recovery
- 🟢 2020–2021 Bull Run — everything up, easy profits
- 🚀 GameStop Short Squeeze (Jan 2021) — Mystery Sip goes insane
- 📉 2022 Tech Correction — juice blend (TSLA) gets wrecked

**How it works:**
- Historical price data pre-loaded (no API needed)
- Player makes decisions not knowing what happens next
- After each round: "Here's what actually happened to investors"
- Session ends with a comparison: "You made $X. Real investors who held TSLA made/lost $Y."

**Why it's powerful:** Real emotional stakes. A kid who lived through the GameStop scenario will remember what a short squeeze is forever.

---

## Add-on G · Mobile layout
**Target version:** v1.2  
**Effort:** Medium (1–2 sprints)

Full mobile-responsive design for tablet and phone play.

**Key changes:**
- Product cards stacked vertically (1 column)
- Bottom nav bar for switching between products
- Swipe gestures for market cards
- Touch-optimized slider (larger thumb, 44px touch target)
- Event banner as a slide-up sheet instead of top banner
- Timer as a floating pill instead of bottom bar element

**Priority:** High — kids play on tablets, not desktops. This should move up to v1.1 if user testing shows it's blocking engagement.

---

## API options for v1.1+

| Provider | Data | Free tier | Paid | Recommendation |
|---|---|---|---|---|
| Alpha Vantage | Delayed quotes, fundamentals | 25 req/day | $50/mo | Good for MVP API |
| Polygon.io | Real-time, news, options | Limited | $29/mo | Best for v1.2+ |
| Marketstack | Real-time, 70+ exchanges | 100 req/mo | $9.99/mo | Budget option |
| Tiingo | EOD + news feed | Free tier | $10/mo | Good for news addon |
| Yahoo Finance | Real-time (unofficial) | Free | Free | ToS risk — avoid |

**Recommendation:** Alpha Vantage for v1.1 (free tier covers low traffic), Polygon.io when scale requires it.

---

## Monetization paths

| Model | When | Revenue potential |
|---|---|---|
| Classroom SaaS ($99/yr) | v1.2 | High — recurring, B2B |
| Premium Market Card packs | v1.1 | Low — one-time, small |
| White-label for banks/fintechs | v2.0 | Very high — enterprise |
| Consumer Pro ($3/mo) | v1.3 | Medium — depends on retention |

**Recommendation:** Classroom SaaS is the clearest monetization path. Keep the consumer game free — it's the marketing funnel.
