// StockStand — Game TypeScript Types
// Source of truth: docs/ARCHITECTURE.md (v1.1)

export type AgeTier     = 'child' | 'teen' | 'adult';
export type DisplayMode = 'junior' | 'explorer';
export type ProductId   = 'lemonade' | 'juice' | 'cookies' | 'tea' | 'mystery';

export interface ProductState {
  price:       number;
  cost:        number;
  sales:       number;
  revenue:     number;
  stockSymbol: string;
  demandMult:  number;
}

export interface MarketCard {
  id:          string;
  name:        string;
  emoji:       string;
  description: string;
  unlockAt:    { type: 'round' | 'revenue' | 'event'; value: string | number };
  effect:      { target: 'demandMult' | 'costMult' | 'price'; modifier: number; duration: number };
}

export interface GameEvent {
  type:    'good' | 'bad' | 'neutral';
  emoji:   string;
  title:   string;
  message: string;
  effect:  { target: 'demandMult' | 'costMult'; modifier: number };
}

export interface RoundSummary {
  round:   number;
  perProduct: Record<ProductId, {
    sales:   number;
    revenue: number;
    costs:   number;
    profit:  number;
  }>;
  totalRevenue: number;
  totalCosts:   number;
  netProfit:    number;
  event:        GameEvent | null;
  newCards:     string[];
  stockDeltas:  Record<string, number>;
}

export interface GameState {
  schemaVersion:    number;            // increment on breaking schema change
  standName:        string;
  displayMode:      DisplayMode;
  winCondition:     'goal' | 'sandbox';
  coins:            number;
  totalRevenue:     number;
  totalCosts:       number;
  round:            number;
  totalSales:       number;
  selectedProducts: ProductId[];
  products:         Record<ProductId, ProductState>;
  unlockedCards:    string[];
  activeCards:      string[];          // cards currently applying effects
  stockPrices:      Record<string, number>;
  prevStockPrices:  Record<string, number>;
  priceHistory:     Record<ProductId, number[]>;  // last 10 rounds
  pnlHistory:       number[];                      // last 10 rounds net P&L
  demandMult:       number;
  costMult:         number;
  currentEvent:     GameEvent | null;
  onboardingDone:   boolean;
  soundEnabled:     boolean;
  lastSaved:        string;            // ISO timestamp
}
