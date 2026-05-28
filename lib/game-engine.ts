import type { ProductId, GameState, GameEvent, MarketCard, RoundSummary } from '@/types/game';

// ─── Products ────────────────────────────────────────────────────────────────

export const PRODUCTS: Record<ProductId, {
  label:        string;
  emoji:        string;
  stockSymbol:  string;
  defaultCost:  number;
  defaultPrice: number;
}> = {
  lemonade: { label: 'Lemonade',     emoji: '🍋', stockSymbol: 'KO',   defaultCost: 0.50, defaultPrice: 1.00 },
  juice:    { label: 'Juice Blend',  emoji: '🧃', stockSymbol: 'AAPL', defaultCost: 0.75, defaultPrice: 1.50 },
  cookies:  { label: 'Warm Cookies', emoji: '🍪', stockSymbol: 'MCD',  defaultCost: 1.00, defaultPrice: 2.00 },
  tea:      { label: 'Iced Tea',     emoji: '🍵', stockSymbol: 'TSLA', defaultCost: 0.60, defaultPrice: 1.25 },
  mystery:  { label: 'Mystery Sip',  emoji: '⭐', stockSymbol: 'GME',  defaultCost: 0.80, defaultPrice: 2.50 },
};

// ─── Demand formula ──────────────────────────────────────────────────────────

/**
 * Demand formula (from PRD):
 *   baseDemand  = (cost × 2.2) / price
 *   gameDelta   = stockDelta × 0.3   ← dampening: real 10% move → 3% game effect
 *   demand      = baseDemand × 6 × demandMult × (1 + gameDelta)
 *   sales       = clamp(round(demand), 0, 20) per product per round
 *
 * The ×6 scale factor ensures sensible customer counts at default prices:
 *   lemonade default (cost=$0.50, price=$1.00) → ~7 customers/round
 *   high price (5× cost)                       → ~2 customers/round
 *   low price (at cost)                        → ~13 customers/round
 */
export function calculateDemand(
  cost:       number,  // ingredient cost (after costMult applied)
  price:      number,  // selling price set by the player
  demandMult: number,  // global demand multiplier from events/cards
  stockDelta: number,  // % change in linked stock today (0.05 = +5%)
): number {
  const gameDelta  = stockDelta * 0.3;
  const baseDemand = (cost * 2.2) / price;
  const demand     = baseDemand * 6 * demandMult * (1 + gameDelta);
  return Math.round(Math.max(0, Math.min(20, demand)));
}

// ─── Market Cards ────────────────────────────────────────────────────────────

export const MARKET_CARDS: MarketCard[] = [
  {
    id: 'sunny_day',
    name: 'Sunny Day',
    emoji: '☀️',
    description: 'Perfect weather brings everyone outside! Demand shoots up.',
    unlockAt: { type: 'round', value: 3 },
    effect: { target: 'demandMult', modifier: 0.3, duration: 2 },
  },
  {
    id: 'cool_breeze',
    name: 'Cool Breeze',
    emoji: '🌬️',
    description: 'A cool breeze means lower ingredient costs today.',
    unlockAt: { type: 'revenue', value: 50 },
    effect: { target: 'costMult', modifier: -0.15, duration: 1 },
  },
  {
    id: 'school_pickup',
    name: 'School Pickup',
    emoji: '🏫',
    description: 'School just let out — kids are thirsty and hungry!',
    unlockAt: { type: 'round', value: 6 },
    effect: { target: 'demandMult', modifier: 0.5, duration: 1 },
  },
  {
    id: 'power_hour',
    name: 'Power Hour',
    emoji: '⚡',
    description: 'Your most productive hour yet. All prices rise!',
    unlockAt: { type: 'revenue', value: 100 },
    effect: { target: 'price', modifier: 0.2, duration: 1 },
  },
  {
    id: 'neighborhood_bbq',
    name: 'Neighborhood BBQ',
    emoji: '🔥',
    description: 'The whole neighborhood is out for a BBQ. Huge crowd!',
    unlockAt: { type: 'event', value: 'good' },
    effect: { target: 'demandMult', modifier: 0.4, duration: 2 },
  },
  {
    id: 'rainy_day',
    name: 'Rainy Day Strategy',
    emoji: '🌧️',
    description: 'Bad weather? Cut costs and wait it out.',
    unlockAt: { type: 'event', value: 'bad' },
    effect: { target: 'costMult', modifier: -0.25, duration: 2 },
  },
  {
    id: 'lucky_break',
    name: 'Lucky Break',
    emoji: '🍀',
    description: 'Everything goes right. Demand and sales surge!',
    unlockAt: { type: 'round', value: 10 },
    effect: { target: 'demandMult', modifier: 0.6, duration: 1 },
  },
  {
    id: 'market_crash',
    name: 'Market Crash',
    emoji: '📉',
    description: 'The market dipped, but your stand is still open! Costs drop fast.',
    unlockAt: { type: 'revenue', value: 200 },
    effect: { target: 'costMult', modifier: -0.3, duration: 3 },
  },
];

// ─── Game Events pool ────────────────────────────────────────────────────────

export const GAME_EVENTS: GameEvent[] = [
  // Good events (demandMult boost)
  { type: 'good',    emoji: '☀️', title: 'Perfect weather!',   message: "It's a scorching hot day — everyone wants a cold drink!",          effect: { target: 'demandMult', modifier:  0.3  } },
  { type: 'good',    emoji: '🎉', title: 'School picnic!',     message: "A school picnic just ended nearby. Hungry kids everywhere!",        effect: { target: 'demandMult', modifier:  0.4  } },
  { type: 'good',    emoji: '⚽', title: 'Sports day!',        message: "Local sports day is in full swing. Athletes need refreshments!",     effect: { target: 'demandMult', modifier:  0.35 } },
  // Bad events (demandMult penalty)
  { type: 'bad',     emoji: '🌧️', title: 'Rainy day',          message: "It's pouring outside. Customers are staying indoors.",              effect: { target: 'demandMult', modifier: -0.3  } },
  { type: 'bad',     emoji: '🐝', title: 'Wasp nest!',         message: "A wasp nest was found nearby. People are keeping their distance.",   effect: { target: 'demandMult', modifier: -0.25 } },
  { type: 'bad',     emoji: '🚧', title: 'Road construction',  message: "Loud construction nearby is driving customers away.",               effect: { target: 'demandMult', modifier: -0.2  } },
  // Neutral events
  { type: 'neutral', emoji: '🏡', title: 'New neighbor!',      message: "A new family moved in down the street. They might stop by!",        effect: { target: 'demandMult', modifier:  0    } },
  { type: 'neutral', emoji: '🏷️', title: 'Yard sale nearby',  message: "A yard sale is bringing extra foot traffic past your stand.",        effect: { target: 'demandMult', modifier:  0.1  } },
];

// ─── checkCardUnlocks ────────────────────────────────────────────────────────

/**
 * Returns array of newly unlocked card IDs (not already in state.unlockedCards).
 */
export function checkCardUnlocks(state: GameState, eventFired?: GameEvent | null): string[] {
  const alreadyUnlocked = new Set(state.unlockedCards);
  const newIds: string[] = [];

  for (const card of MARKET_CARDS) {
    if (alreadyUnlocked.has(card.id)) continue;

    const { type, value } = card.unlockAt;
    let shouldUnlock = false;

    if (type === 'round') {
      shouldUnlock = state.round >= (value as number);
    } else if (type === 'revenue') {
      shouldUnlock = state.totalRevenue >= (value as number);
    } else if (type === 'event') {
      // Unlock when an event of the matching type was fired this round
      shouldUnlock = eventFired != null && eventFired.type === value;
    }

    if (shouldUnlock) {
      newIds.push(card.id);
    }
  }

  return newIds;
}

// ─── simulateRound ───────────────────────────────────────────────────────────

export function simulateRound(
  state:         GameState,
  currentPrices: Record<string, number>,
): { newState: GameState; roundSummary: RoundSummary } {
  // --- Stock deltas ---
  const stockDeltas: Record<string, number> = {};
  for (const symbol of Object.keys(currentPrices)) {
    const curr = currentPrices[symbol];
    const prev = state.stockPrices[symbol];
    stockDeltas[symbol] = prev && prev !== 0 ? (curr - prev) / prev : 0;
  }

  // --- Per-product simulation ---
  type ProductBreakdown = { sales: number; revenue: number; costs: number; profit: number };
  const perProduct = {} as Record<ProductId, ProductBreakdown>;

  let totalRevenue = 0;
  let totalCosts   = 0;
  let totalSales   = 0;

  const updatedProducts = { ...state.products };

  for (const id of state.selectedProducts) {
    const product     = state.products[id];
    const symbol      = PRODUCTS[id].stockSymbol;
    const stockDelta  = stockDeltas[symbol] ?? 0;
    const effectiveCost = product.cost * state.costMult;

    const sales   = calculateDemand(effectiveCost, product.price, state.demandMult, stockDelta);
    const revenue = product.price * sales;
    const costs   = effectiveCost * sales;
    const profit  = revenue - costs;

    perProduct[id] = { sales, revenue, costs, profit };
    totalRevenue  += revenue;
    totalCosts    += costs;
    totalSales    += sales;

    updatedProducts[id] = {
      ...product,
      sales,
      revenue,
    };
  }

  // --- Fire random event (20% chance) ---
  let firedEvent: GameEvent | null = null;
  let newDemandMult = state.demandMult;
  let newCostMult   = state.costMult;

  // Reset event effects from last round before applying new ones
  // (events are temporary — we reset multipliers to 1.0 baseline before re-applying)
  // Note: multipliers accumulate from cards; event effects are additive on top of base 1.0
  // For simplicity in MVP, we track only the event delta and reset each round
  if (state.currentEvent) {
    // Undo previous event's effect
    const prevEffect = state.currentEvent.effect;
    if (prevEffect.target === 'demandMult') {
      newDemandMult = Math.max(0, newDemandMult - prevEffect.modifier);
    } else if (prevEffect.target === 'costMult') {
      newCostMult = Math.max(0, newCostMult - prevEffect.modifier);
    }
  }

  if (Math.random() < 0.2) {
    firedEvent = GAME_EVENTS[Math.floor(Math.random() * GAME_EVENTS.length)];
    if (firedEvent.effect.target === 'demandMult') {
      newDemandMult = Math.max(0, newDemandMult + firedEvent.effect.modifier);
    } else if (firedEvent.effect.target === 'costMult') {
      newCostMult = Math.max(0, newCostMult + firedEvent.effect.modifier);
    }
  }

  // --- Update P&L history (keep last 10) ---
  const netProfit    = totalRevenue - totalCosts;
  const newPnlHistory = [...state.pnlHistory, netProfit].slice(-10);

  // --- Update price history per product (keep last 10) ---
  const newPriceHistory = { ...state.priceHistory } as Record<ProductId, number[]>;
  for (const id of state.selectedProducts) {
    const symbol = PRODUCTS[id].stockSymbol;
    const price  = currentPrices[symbol] ?? 0;
    const prev   = newPriceHistory[id] ?? [];
    newPriceHistory[id] = [...prev, price].slice(-10);
  }

  // --- Check card unlocks ---
  // We pass the state with updated round/revenue to checkCardUnlocks
  const stateForUnlockCheck: GameState = {
    ...state,
    round:        state.round + 1,
    totalRevenue: state.totalRevenue + totalRevenue,
    totalCosts:   state.totalCosts   + totalCosts,
    totalSales:   state.totalSales   + totalSales,
    coins:        state.coins        + netProfit,
  };
  const newCardIds = checkCardUnlocks(stateForUnlockCheck, firedEvent);

  // --- Build new state ---
  const newState: GameState = {
    ...state,
    products:        updatedProducts,
    coins:           state.coins + netProfit,
    totalRevenue:    state.totalRevenue + totalRevenue,
    totalCosts:      state.totalCosts   + totalCosts,
    totalSales:      state.totalSales   + totalSales,
    round:           state.round + 1,
    demandMult:      newDemandMult,
    costMult:        newCostMult,
    currentEvent:    firedEvent,
    pnlHistory:      newPnlHistory,
    priceHistory:    newPriceHistory,
    prevStockPrices: { ...state.stockPrices },
    stockPrices:     { ...currentPrices },
    unlockedCards:   [...state.unlockedCards, ...newCardIds],
    lastSaved:       new Date().toISOString(),
  };

  const roundSummary: RoundSummary = {
    round:        state.round,
    perProduct,
    totalRevenue,
    totalCosts,
    netProfit,
    event:        firedEvent,
    newCards:     newCardIds,
    stockDeltas,
  };

  return { newState, roundSummary };
}

// ─── createInitialState ───────────────────────────────────────────────────────

export function createInitialState(overrides?: Partial<GameState>): GameState {
  const allProductIds: ProductId[] = ['lemonade', 'juice', 'cookies', 'tea', 'mystery'];

  const products = {} as GameState['products'];
  for (const id of allProductIds) {
    const def = PRODUCTS[id];
    products[id] = {
      cost:        def.defaultCost,
      price:       def.defaultPrice,
      sales:       0,
      revenue:     0,
      stockSymbol: def.stockSymbol,
      demandMult:  1.0,
    };
  }

  const priceHistory = {} as GameState['priceHistory'];
  for (const id of allProductIds) {
    priceHistory[id] = [];
  }

  const base: GameState = {
    schemaVersion:    1,
    standName:        '',
    displayMode:      'junior',
    winCondition:     'goal',
    coins:            10,
    totalRevenue:     0,
    totalCosts:       0,
    round:            1,
    totalSales:       0,
    selectedProducts: ['lemonade', 'cookies'],
    products,
    unlockedCards:    [],
    activeCards:      [],
    stockPrices:      {},
    prevStockPrices:  {},
    priceHistory,
    pnlHistory:       [],
    demandMult:       1.0,
    costMult:         1.0,
    currentEvent:     null,
    ageTier:          null,
    onboardingDone:   false,
    soundEnabled:     false,
    standTheme:       'street',
    lastSaved:        new Date().toISOString(),
  };

  return { ...base, ...overrides };
}
