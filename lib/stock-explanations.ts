/**
 * stock-explanations.ts
 *
 * Age-tuned, short explanations for each stock's daily move.
 * Three tiers map to the AgeTier chosen at onboarding:
 *
 *   child  (under 13) — emoji-first, no jargon, max 2 short sentences
 *   teen   (13–17)    — simple finance terms introduced, 3–4 sentences
 *   adult  (18+)      — concise but complete, concepts named properly
 */

import type { AgeTier } from '@/types/game';
import { STOCK_DAMPENING, STOCK_COST_DAMPENING } from '@/lib/game-engine';

export interface StockExplanation {
  /** Company name for the header */
  companyName:  string;
  /** One-line company description */
  companyBlurb: string;
  /** What happened in the real world today */
  realWorld:    string;
  /** How it changes the player's ingredient cost */
  gameImpact:   string;
  /** Quick actionable tip */
  tip:          string;
  /** Emoji for the direction badge */
  directionEmoji: string;
}

type Direction = 'bigUp' | 'up' | 'flat' | 'down' | 'bigDown';

function getDirection(delta: number): Direction {
  if (delta >  0.03) return 'bigUp';
  if (delta >  0.005) return 'up';
  if (delta < -0.03) return 'bigDown';
  if (delta < -0.005) return 'down';
  return 'flat';
}

// ─── Copy tables ──────────────────────────────────────────────────────────────
// Each entry: { child, teen, adult }

type AgeCopy = Record<AgeTier, string>;

interface SymbolCopy {
  companyName:  string;
  blurb:        Record<AgeTier, string>;
  direction:    Record<Direction, AgeCopy>;
}

const COPY: Record<string, SymbolCopy> = {

  // ─── AAPL ────────────────────────────────────────────────────────────────
  AAPL: {
    companyName: 'Apple Inc.',
    blurb: {
      child: 'Makes iPhones and iPads that lots of people love.',
      teen:  'Makes iPhones, Macs, and the App Store — one of the biggest companies on Earth.',
      adult: 'Consumer tech giant: iPhone, Mac, Services. ~$3 T market cap.',
    },
    direction: {
      bigUp: {
        child: '🚀 Apple is having a GREAT day! Lots of people bought Apple shares because everyone loves their new stuff.',
        teen:  '🚀 Apple surged today — probably a big earnings beat or exciting product news. When a company does better than expected, investors rush in and the price shoots up.',
        adult: '🚀 Apple is up strongly — likely an earnings beat or major product catalyst. Institutional buying pressure drives momentum; watch for mean reversion after the gap.',
      },
      up: {
        child: '📈 Apple went up a little today! People think Apple will keep making cool things.',
        teen:  '📈 Apple is rising today. It often climbs when the overall market is doing well or analysts raise their price targets. Steady growth companies like Apple tend to drift upward over time.',
        adult: '📈 Apple is up modestly — could be sector rotation into tech, or a minor positive catalyst. Consistent with its long-term uptrend.',
      },
      flat: {
        child: '😐 Apple barely moved today. Sometimes nothing much happens!',
        teen:  '😐 Apple is flat today. Quiet days are totally normal — markets are not exciting every single day. Investors are just waiting.',
        adult: '😐 Apple is trading sideways. Low-volatility consolidation — the market is digesting recent moves before the next catalyst.',
      },
      down: {
        child: '📉 Apple dipped a bit today. Maybe people are a little worried, but Apple is still very popular.',
        teen:  '📉 Apple fell today. Could be supply-chain worries, a competitor announcement, or just general market nerves. Even great companies have off days.',
        adult: '📉 Apple is lower today — macro headwinds (rising yields, dollar strength) or sector weakness. Still within normal trading range for the name.',
      },
      bigDown: {
        child: '⚠️ Apple dropped a lot today! Big drops happen sometimes — it can go back up later.',
        teen:  '⚠️ Apple fell sharply. This usually means a disappointing earnings report or a big market sell-off. Scary, but long-term investors often see this as a buying opportunity.',
        adult: '⚠️ Apple is down sharply — likely an earnings miss, guidance cut, or systemic market event. Watch support levels; capitulation can precede a reversal.',
      },
    },
  },

  // ─── TSLA ────────────────────────────────────────────────────────────────
  TSLA: {
    companyName: 'Tesla, Inc.',
    blurb: {
      child: 'Makes electric cars and is famous for big ups and downs.',
      teen:  'Makes electric cars and batteries — known for huge price swings and its famous CEO.',
      adult: 'EV & energy storage leader. Extremely high beta; earnings-sensitive, sentiment-driven.',
    },
    direction: {
      bigUp: {
        child: '🚀 Whoa, Tesla is flying today! Big news or everyone got excited at the same time.',
        teen:  '🚀 Tesla is surging — might be a tweet from its CEO, great delivery numbers, or just a wave of excitement. Tesla can jump 10% in a day. That\'s what "volatile" means!',
        adult: '🚀 Tesla gapping up strongly — delivery beat, CEO catalyst, or short-squeeze dynamics. Elevated implied vol; this kind of move is typical for the name.',
      },
      up: {
        child: '📈 Tesla went up today! People are excited about electric cars.',
        teen:  '📈 Tesla is up today. Good EV sales data, a positive analyst note, or just market optimism can push it higher. Tesla fans are always enthusiastic.',
        adult: '📈 Tesla up — momentum continuation or positive sector read-through from an EV peer. Watch for RSI extension given the stock\'s tendency to overshoot.',
      },
      flat: {
        child: '😐 Tesla barely moved today. That\'s actually unusual for Tesla!',
        teen:  '😐 Tesla is unusually quiet today. Investors might be waiting for the next big announcement before making a move.',
        adult: '😐 Tesla is consolidating. Low-volatility sessions are rare for this name — often precede a significant move in either direction.',
      },
      down: {
        child: '📉 Tesla went down a bit. Electric cars are still popular — it\'ll be okay.',
        teen:  '📉 Tesla slipped today. Maybe delivery numbers were softer than expected, or rising interest rates make borrowing more expensive for big purchases like cars.',
        adult: '📉 Tesla pulling back — could be macro rate sensitivity (high-growth stocks hit harder by rising yields) or a minor negative catalyst. Normal within the volatility range.',
      },
      bigDown: {
        child: '⚠️ Tesla fell a lot today! Tesla can drop really fast, but it can also jump back up really fast.',
        teen:  '⚠️ Tesla dropped hard. This is what "high risk, high reward" looks like in practice. Earnings misses, production delays, or CEO controversies can send it down fast.',
        adult: '⚠️ Tesla is down sharply — earnings miss, guidance cut, or broad risk-off selloff. High beta amplifies everything. Position sizing matters with names like this.',
      },
    },
  },

  // ─── MCD ─────────────────────────────────────────────────────────────────
  MCD: {
    companyName: 'McDonald\'s Corp.',
    blurb: {
      child: 'Runs McDonald\'s restaurants all over the world.',
      teen:  'Runs 40,000+ fast-food restaurants worldwide — a "recession-proof" consumer staple.',
      adult: 'QSR giant with 40k+ locations. Dividend aristocrat; defensive, low-beta consumer staple.',
    },
    direction: {
      bigUp: {
        child: '🍔🚀 McDonald\'s had a great day! Maybe lots of people ate burgers.',
        teen:  '🍔🚀 McDonald\'s is popping! A big earnings beat or a strong "same-store sales" report can send it up several percent. Investors love steady companies that keep growing.',
        adult: '🍔🚀 McDonald\'s gapping up on strong earnings or SSS beat. Unusual magnitude for a low-beta defensive name — likely significant positive catalyst.',
      },
      up: {
        child: '📈 McDonald\'s went up a little. People keep eating there — no matter what!',
        teen:  '📈 McDonald\'s is quietly climbing. Investors often move money into "safe" consumer staples when they feel nervous about the rest of the market.',
        adult: '📈 McDonald\'s up modestly — defensive rotation or minor positive catalyst. Classic flight-to-safety behavior; often inversely correlated with risk appetite.',
      },
      flat: {
        child: '😐 McDonald\'s barely moved today. Boring — and that\'s fine!',
        teen:  '😐 McDonald\'s is flat. Boring is beautiful for dividend stocks! Shareholders get paid just to hold the shares on days like this.',
        adult: '😐 MCD is trading flat. Normal for a low-volatility dividend payer. The real return here is in the yield + long-term price appreciation, not daily moves.',
      },
      down: {
        child: '📉 McDonald\'s dipped a bit. Maybe food got a little more expensive for them.',
        teen:  '📉 McDonald\'s slipped. Could be rising food costs (beef, cooking oil), a new minimum wage law raising labour costs, or just general market weakness dragging it down.',
        adult: '📉 MCD lower — commodity cost pressure, labour expense guidance, or macro softness. Margin sensitivity to food inflation is the key risk for QSR names.',
      },
      bigDown: {
        child: '⚠️ McDonald\'s fell a lot! That\'s very unusual — they\'re usually very steady.',
        teen:  '⚠️ McDonald\'s dropped hard — very unusual for such a stable company. This likely means a major earnings miss or a food-safety scare. Rare events like this are what make diversification so important.',
        adult: '⚠️ MCD down sharply — likely a significant earnings miss or a headline risk event. Given the defensive nature of this stock, a drop this large signals a serious fundamental or macro issue.',
      },
    },
  },

  // ─── KO ──────────────────────────────────────────────────────────────────
  KO: {
    companyName: 'Coca-Cola Company',
    blurb: {
      child: 'Makes Coca-Cola drinks sold in almost every country.',
      teen:  'Sells drinks in 200+ countries — one of the most stable, dividend-paying stocks in history.',
      adult: 'Global beverage giant. 60+ years of dividend growth; Warren Buffett\'s archetypal "moat" stock.',
    },
    direction: {
      bigUp: {
        child: '🥤🚀 Wow, Coca-Cola jumped today! That\'s pretty unusual for them.',
        teen:  '🥤🚀 Coca-Cola is surging — rare! Probably a blockbuster earnings report or major new market deal. A company this stable doesn\'t pop this big very often.',
        adult: '🥤🚀 KO up strongly — unusual magnitude for this low-beta name. Likely a significant fundamental catalyst (volume inflection, pricing power data) or broad defensive squeeze.',
      },
      up: {
        child: '📈 Coca-Cola went up a little. People always buy drinks!',
        teen:  '📈 Coca-Cola is rising. It often climbs when investors want safety — like a savings account, but one that also pays dividends.',
        adult: '📈 KO up modestly — likely flight-to-safety rotation or dividend-yield compression in a falling rate environment. Classic defensive outperformance.',
      },
      flat: {
        child: '😐 Coca-Cola barely moved. That\'s totally normal for them!',
        teen:  '😐 Coca-Cola is flat. This is Coca-Cola\'s natural habitat — it barely moves most days. That\'s exactly why cautious investors and retirees love it.',
        adult: '😐 KO flat — exactly what you expect from a low-vol dividend payer in a neutral market session. The real return comes from the ~3% yield.',
      },
      down: {
        child: '📉 Coca-Cola dipped a little. Sugar or cans might cost more for them.',
        teen:  '📉 Coca-Cola slipped. Could be rising sugar prices squeezing margins, or a strong US dollar making its overseas sales worth less when converted back home.',
        adult: '📉 KO lower — likely commodity cost pressure (sugar, aluminium) or USD strength hitting the ~65% international revenue. Currency translation is a key risk for global consumer staples.',
      },
      bigDown: {
        child: '⚠️ Coca-Cola fell a lot! Very unusual for them — something big must have happened.',
        teen:  '⚠️ Coca-Cola dropped hard. This is very rare for such a stable company — something big happened. Even the safest stocks drop when the whole market panics.',
        adult: '⚠️ KO down sharply — atypical for this low-beta name; indicates either a significant earnings miss, guidance cut, or broad systemic risk-off. Dividend yield may cushion long-term holders.',
      },
    },
  },

  // ─── GME ─────────────────────────────────────────────────────────────────
  GME: {
    companyName: 'GameStop Corp.',
    blurb: {
      child: 'A game shop that became super famous for going up 1000% in one week.',
      teen:  'A video game store turned meme stock — famous for the 2021 short squeeze that shocked Wall Street.',
      adult: 'Legacy game retailer; low fundamental value but extreme meme-stock volatility. Retail-driven, social-media-sentiment-dependent.',
    },
    direction: {
      bigUp: {
        child: '🎮🚀 GameStop is going to the moon! People on the internet all bought it at the same time.',
        teen:  '🎮🚀 GME is squeezing! This often happens when social media communities coordinate a "short squeeze" — forcing investors who bet against it to buy shares fast, rocketing the price. Logic optional!',
        adult: '🎮🚀 GME is squeezing — retail coordination forcing short covering. Classic gamma/short squeeze dynamics. Fundamentals irrelevant at this point; pure sentiment and options flow.',
      },
      up: {
        child: '📈 GameStop went up today! Sometimes it just goes up because people get excited.',
        teen:  '📈 GameStop is climbing. Sometimes a rumour, a meme, or just internet buzz is enough to push GME up. The actual business barely matters — it\'s all about how people feel.',
        adult: '📈 GME up on retail momentum or social media attention. No fundamental catalyst needed for this name — sentiment and options gamma can sustain a move independently.',
      },
      flat: {
        child: '😐 GameStop is quiet today. It won\'t stay calm for long!',
        teen:  '😐 GME is quiet. Calm days for GameStop mean the internet has moved on temporarily. Something will kick it off again.',
        adult: '😐 GME consolidating. Low-vol sessions for this name typically precede breakouts. Retail interest is a crowded and unpredictable catalyst.',
      },
      down: {
        child: '📉 GameStop went down. When the excitement fades, it usually falls back.',
        teen:  '📉 GameStop is sliding back. When the social media hype dies down, reality returns — the actual business (selling game discs) is shrinking. Gravity always wins eventually.',
        adult: '📉 GME fading — post-squeeze mean reversion or loss of retail momentum. The underlying business is in structural decline (physical media); price disconnected from fundamentals.',
      },
      bigDown: {
        child: '⚠️ GameStop fell a lot. It can drop as fast as it goes up!',
        teen:  '⚠️ GME dropped hard. After every meme spike, gravity returns fast. The stock can lose 50–80% of its peak value in days once the squeeze ends. This is what "high risk" really means.',
        adult: '⚠️ GME in sharp selloff — post-squeeze unwind, retail capitulation, or forced long liquidation. This is the other side of the risk/reward asymmetry that makes meme stocks so dangerous.',
      },
    },
  },
};

// ─── Public API ───────────────────────────────────────────────────────────────

export function getStockExplanation(params: {
  symbol:       string;
  delta:        number;
  productName:  string;
  costMult:     number;   // current effective cost multiplier (includes events)
  ageTier:      AgeTier | null;
}): StockExplanation {
  const { symbol, delta, productName, costMult, ageTier } = params;
  const tier: AgeTier = ageTier ?? 'child';
  const dir   = getDirection(delta);
  const copy  = COPY[symbol];

  // Direction badge emoji
  const dirEmoji: Record<Direction, string> = {
    bigUp:   '🚀',
    up:      '📈',
    flat:    '😐',
    down:    '📉',
    bigDown: '⚠️',
  };

  // Game impact — uses actual multipliers from game-engine
  const realPct     = (Math.abs(delta) * 100).toFixed(1);
  const demandPct   = (Math.abs(delta * STOCK_DAMPENING) * 100).toFixed(0);
  const costPct     = (Math.abs(delta * STOCK_COST_DAMPENING) * 100).toFixed(1);
  const costChange  = costMult > 1 ? 'up' : costMult < 1 ? 'down' : 'flat';

  function gameImpact(): string {
    if (Math.abs(delta) < 0.005) {
      return `${productName} ingredient costs are flat today — focus on pricing for demand.`;
    }
    const costDir   = delta > 0 ? 'cheaper' : 'more expensive';
    const demandDir = delta > 0 ? 'more' : 'fewer';
    if (tier === 'child') {
      return delta > 0
        ? `Your ${productName} ingredients are cheaper today AND more customers show up! 🎉`
        : `Your ${productName} costs more to make AND fewer customers come. 😬 Try raising your price a little!`;
    }
    if (tier === 'teen') {
      return `Ingredients are ${costPct}% ${costDir} (${realPct}% real move × ${STOCK_COST_DAMPENING} cost factor). Demand is also ${demandPct}% ${demandDir} customers (${realPct}% × ${STOCK_DAMPENING} demand factor).`;
    }
    // adult
    return `Cost: ${delta > 0 ? '−' : '+'}${costPct}% (${realPct}% × ${STOCK_COST_DAMPENING} dampening). Demand: ${delta > 0 ? '+' : '−'}${demandPct}% (${realPct}% × ${STOCK_DAMPENING} amplifier). Effective cost is ${costChange}.`;
  }

  function tip(): string {
    if (Math.abs(delta) < 0.005) return 'No stock movement — focus on pricing for demand.';
    if (delta > 0) {
      // cost fell → can lower price or pocket extra margin
      if (tier === 'child') return 'Try lowering your price — you might get more customers! 😊';
      if (tier === 'teen')  return 'Costs fell, so you can lower your price to attract more customers, or keep it and earn more profit per sale.';
      return 'Cost tailwind: consider a slight price reduction to gain market share, or hold price for margin expansion.';
    } else {
      // cost rose → raise price or watch margin
      if (tier === 'child') return 'Try raising your price a little so you still make money! 💪';
      if (tier === 'teen')  return 'Costs went up — raise your price a bit to protect your profit margin, or your earnings will shrink.';
      return 'Cost headwind: raise price to defend margin. Watch the margin bar — if it turns red, you\'re selling at a loss.';
    }
  }

  if (!copy) {
    return {
      companyName:   symbol,
      companyBlurb:  `${symbol} is a real publicly-traded company linked to your ${productName}.`,
      realWorld:     `${symbol} moved ${delta > 0 ? '+' : ''}${(delta * 100).toFixed(2)}% today.`,
      gameImpact:    gameImpact(),
      tip:           tip(),
      directionEmoji: dirEmoji[dir],
    };
  }

  return {
    companyName:    copy.companyName,
    companyBlurb:   copy.blurb[tier],
    realWorld:      copy.direction[dir][tier],
    gameImpact:     gameImpact(),
    tip:            tip(),
    directionEmoji: dirEmoji[dir],
  };
}
