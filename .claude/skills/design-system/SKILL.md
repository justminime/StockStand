---
name: design-system
description: Load StockStand's full visual language and component specs before building any UI. Surfaces color tokens, typography rules, component patterns, animation guidelines, and accessibility requirements from the design system document.
---

You are about to build or modify UI for StockStand. Load and apply the full design system from `stockstand.html` (which despite its extension contains the design system content — see CLAUDE.md for the file-name mapping).

## What to read

Read `stockstand.html` in full before making any visual decisions. Key sections to internalize:

1. **Color palette** — exact CSS variable names and hex values
   - `--yellow: #F5C518` (primary), `--bg: #FFFBF0` (warm white background)
   - `--green: #2ECC71` (profit) | `--red: #E74C3C` (loss)
   - Never use plain white (#FFFFFF) as background; never use generic grays

2. **Typography**
   - Fredoka One: hero text, stand name, CTA buttons, card panel title
   - Nunito: all other text (body, labels, numbers)
   - Never substitute Inter, Roboto, or system fonts — they break the summer-stand feel
   - Google Fonts import snippet is in the design system doc

3. **Component specs with ASCII mockups**
   - Product card (with margin bar, demand faces, sell button)
   - Market event banner (green/red/yellow border based on event type)
   - Primary button (sell/start), stat pill, market card
   - Range slider, timer ring, margin bar

4. **Spacing & layout**
   - Card padding: 24px, card gap: 20px
   - Border radius: 20px (cards), 12px (buttons/inputs), 100px (pills)
   - Products grid: `repeat(auto-fit, minmax(280px, 1fr))`

5. **Motion & animation**
   - Use `transform` and `opacity` only — no animating width/height/layout properties
   - Durations: 200–400ms; always wrap in `@media (prefers-reduced-motion: reduce)`

6. **Accessibility**
   - WCAG AA minimum contrast everywhere
   - Never use color as the sole signal — always pair with text or icon
   - All interactive elements must be keyboard-navigable

7. **Junior vs Explorer mode**
   - Junior (ages 6–8): replace dollar amounts with 🪙 stacks, hide stock names/tickers, use happy/sad face instead of margin bar
   - Explorer (ages 11+): stock name chip visible, sparkline chart, real % moves shown

## Checklist before submitting UI changes

- [ ] Colors match exact hex values from the palette (use CSS variables)
- [ ] Fonts: Fredoka One for display, Nunito for body — no substitutes
- [ ] Background is `#FFFBF0`, not pure white
- [ ] Animations use only `transform`/`opacity` and respect `prefers-reduced-motion`
- [ ] No color-only signals — icons or text accompany every color cue
- [ ] Interactive elements are keyboard-accessible
- [ ] Margin bar: green > 40%, yellow 15–40%, red < 15%
- [ ] Button has `box-shadow: 0 3px 0 var(--*-dark)` pressed-key effect
