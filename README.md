# 🍋 StockStand

> Run a lemonade stand. Beat the market. Learn investing without knowing it.

StockStand is a browser-based kids game where every product you sell is secretly linked to a real stock. Ingredient costs rise and fall with the market. Weather events mirror real market volatility. Kids learn supply & demand, profit margins, and market concepts — just by running their stand.

---

## 🎮 Play it

Open `src/stockstand.html` in any browser. No install, no server, no account needed.

```bash
open src/stockstand.html
```

---

## 🗂 Repo structure

```
stockstand/
├── src/
│   └── stockstand.html      # Full playable prototype (single file)
├── docs/
│   ├── PRD.md               # Product Requirements Document
│   ├── DESIGN_SYSTEM.md     # Visual language & component rules
│   ├── ROADMAP.md           # 6-sprint plan to launch
│   ├── ADDONS.md            # Post-MVP features & extensions
│   └── COMPLIANCE.md        # COPPA 2025 & data privacy guide
├── public/                  # Static assets (future)
└── README.md
```

---

## 🍋 Products & stock mapping

| Product | Stock | Ticker | Personality |
|---|---|---|---|
| Classic Lemonade | Apple Inc. | AAPL | Stable, evergreen |
| Exotic Juice Blend | Tesla Inc. | TSLA | Volatile, exciting |
| Warm Cookies | McDonald's | MCD | Consumer staple |
| Iced Tea | Coca-Cola | KO | Slow & reliable |
| Mystery Sip | GameStop | GME | Wild card |

---

## 🚀 How it works

1. Name your stand and pick 2–3 products
2. Set your selling price with a slider — demand meter updates live
3. A 60-second timer fires a **market event** every round
4. Events shift ingredient costs and customer demand — just like real stocks
5. Earn coins, collect **Market Cards**, learn investing concepts

---

## 📚 Market Cards (learning layer)

Players unlock collectible cards as they play, each teaching a real investing concept:

- ⚖️ Supply & Demand
- 💹 Profit Margin
- 🎢 Volatility
- 🐂 Bull Market
- 🐻 Bear Market
- 💰 Revenue vs Profit
- 🌈 Diversification
- 🔮 Opportunity Cost

---

## 🛠 Tech stack (MVP)

- **Frontend:** Vanilla HTML + CSS + JS (single file, zero dependencies)
- **Persistence:** `localStorage` — no backend, no accounts, no COPPA issues
- **Fonts:** Google Fonts (Fredoka One + Nunito)
- **Market data:** Simulated in MVP → real API in v1.1

---

## 🗓 Roadmap summary

| Phase | Focus | Status |
|---|---|---|
| MVP | Playable prototype, simulated data, localStorage | ✅ Done |
| v1.1 | Live stock API, age-tiered auth (Google login) | 🔜 Next |
| v1.2 | Portfolio mode, sector stands | 📋 Planned |
| v1.3 | News ticker integration, classroom pack | 📋 Planned |

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for full sprint plan.

---

## ⚖️ Legal & compliance

- MVP collects **zero personal data** — fully COPPA-safe
- No analytics, no tracking, no cookies beyond localStorage
- "For entertainment only" — not a financial product
- See [`docs/COMPLIANCE.md`](docs/COMPLIANCE.md) for full guide

---

## 🤝 Contributing

This is an early-stage prototype. Issues and PRs welcome.

1. Fork the repo
2. Make your changes in `src/stockstand.html`
3. Open a PR with a clear description of what changed and why

---

## 📄 License

MIT — free to use, modify, and distribute.
