'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import styles from './HelpScreen.module.css';

// ─── Slide definitions ────────────────────────────────────────────────────────

const SLIDES = [
  'welcome',
  'products',
  'pricing',
  'timer',
  'events',
  'cards',
  'modes',
  'goal',
  'mystery',
  'save',
] as const;

type SlideId = typeof SLIDES[number];

// ─── Sub-components for each slide content ────────────────────────────────────

function WelcomeSlide() {
  return (
    <>
      <span className={styles.slideEmoji} aria-hidden="true">🍋</span>
      <h2 className={styles.slideTitle}>Welcome to StockStand!</h2>
      <p className={styles.slideSubtitle}>
        Run a lemonade stand and secretly learn how the stock market works.
        Every product you sell is linked to a real publicly-traded stock.
      </p>
      <ul className={styles.featureList}>
        <li className={styles.featureItem}>
          <span className={styles.featureIcon} aria-hidden="true">⏱️</span>
          <span className={styles.featureText}>
            <span className={styles.featureLabel}>60-second rounds</span>
            <span className={styles.featureSub}>Set your prices, then watch customers roll in</span>
          </span>
        </li>
        <li className={styles.featureItem}>
          <span className={styles.featureIcon} aria-hidden="true">📈</span>
          <span className={styles.featureText}>
            <span className={styles.featureLabel}>Real market data</span>
            <span className={styles.featureSub}>Live stock prices secretly affect your ingredient costs</span>
          </span>
        </li>
        <li className={styles.featureItem}>
          <span className={styles.featureIcon} aria-hidden="true">🏆</span>
          <span className={styles.featureText}>
            <span className={styles.featureLabel}>Earn $100 to win</span>
            <span className={styles.featureSub}>Or keep playing in sandbox mode forever</span>
          </span>
        </li>
      </ul>
    </>
  );
}

function ProductsSlide() {
  const products = [
    { emoji: '🍋', name: 'Lemonade',    stock: 'KO',   rare: false, hint: 'Slow & reliable, like Coca-Cola' },
    { emoji: '🧃', name: 'Juice Blend', stock: 'AAPL', rare: false, hint: 'Steady evergreen, like Apple' },
    { emoji: '🍪', name: 'Cookies',     stock: 'MCD',  rare: false, hint: 'Consumer staple, like McDonald\'s' },
    { emoji: '🍵', name: 'Iced Tea',    stock: 'TSLA', rare: false, hint: 'Volatile — big swings!' },
    { emoji: '⭐', name: 'Mystery Sip', stock: 'GME',  rare: true,  hint: 'Wild card — unlocks at Round 5' },
  ];

  return (
    <>
      <span className={styles.slideEmoji} aria-hidden="true">🛍️</span>
      <h2 className={styles.slideTitle}>Your Products</h2>
      <p className={styles.slideSubtitle}>
        Each drink is secretly linked to a real stock. When that stock moves, your ingredient costs move too.
      </p>
      <div className={styles.productGrid}>
        {products.map(p => (
          <div key={p.stock} className={styles.productRow}>
            <span className={styles.productEmoji} aria-hidden="true">{p.emoji}</span>
            <span className={styles.productName}>{p.name}</span>
            <span className={styles.productStock} data-rare={p.rare}>{p.stock}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function PricingSlide() {
  return (
    <>
      <span className={styles.slideEmoji} aria-hidden="true">💰</span>
      <h2 className={styles.slideTitle}>Set the Right Price</h2>
      <p className={styles.slideSubtitle}>
        Price too high and customers walk away. Price too low and you lose money. Find the sweet spot!
      </p>
      <div className={styles.demandDiagram}>
        <div className={`${styles.demandRow} ${styles.bad}`}>
          <span className={styles.demandLabel}>💸 Priced too high</span>
          <span className={styles.demandPeople} aria-label="few customers">👤</span>
        </div>
        <div className={`${styles.demandRow} ${styles.sweet}`}>
          <span className={styles.demandLabel}>✨ Sweet spot</span>
          <span className={styles.demandPeople} aria-label="many customers">👤👤👤👤👤</span>
        </div>
        <div className={`${styles.demandRow} ${styles.good}`}>
          <span className={styles.demandLabel}>📦 Priced too low</span>
          <span className={styles.demandPeople} aria-label="lots of customers, low profit">👤👤👤👤👤👤👤👤</span>
        </div>
      </div>
      <p className={styles.slideSubtitle} style={{ marginTop: '14px', marginBottom: 0 }}>
        Tip: use the <strong>sparkline</strong> on each card to spot trends — and adjust before costs creep up!
      </p>
    </>
  );
}

function TimerSlide() {
  return (
    <>
      <span className={styles.slideEmoji} aria-hidden="true">⏱️</span>
      <h2 className={styles.slideTitle}>The Round Timer</h2>
      <p className={styles.slideSubtitle}>
        Each round lasts 60 seconds. During that time, adjust your prices, then let the timer run out to tally results.
      </p>
      <ul className={styles.featureList}>
        <li className={styles.featureItem}>
          <span className={styles.featureIcon} aria-hidden="true">🔢</span>
          <span className={styles.featureText}>
            <span className={styles.featureLabel}>Round number shown in header</span>
            <span className={styles.featureSub}>Track how far you've come</span>
          </span>
        </li>
        <li className={styles.featureItem}>
          <span className={styles.featureIcon} aria-hidden="true">⏳</span>
          <span className={styles.featureText}>
            <span className={styles.featureLabel}>Auto-tallies at zero</span>
            <span className={styles.featureSub}>"Tallying results…" appears while the engine calculates sales</span>
          </span>
        </li>
        <li className={styles.featureItem}>
          <span className={styles.featureIcon} aria-hidden="true">🔄</span>
          <span className={styles.featureText}>
            <span className={styles.featureLabel}>Next round starts immediately</span>
            <span className={styles.featureSub}>Prices carry over — adjust anytime between tallies</span>
          </span>
        </li>
        <li className={styles.featureItem}>
          <span className={styles.featureIcon} aria-hidden="true">📊</span>
          <span className={styles.featureText}>
            <span className={styles.featureLabel}>Stock prices refresh every 55 s</span>
            <span className={styles.featureSub}>Real data from NYSE via Yahoo Finance</span>
          </span>
        </li>
      </ul>
    </>
  );
}

function EventsSlide() {
  return (
    <>
      <span className={styles.slideEmoji} aria-hidden="true">🎲</span>
      <h2 className={styles.slideTitle}>Random Events</h2>
      <p className={styles.slideSubtitle}>
        Events shake things up every few rounds. They&apos;re weighted by real market data — volatile markets = more drama.
      </p>
      <div className={styles.eventPills}>
        <div className={`${styles.eventPill} ${styles.good}`}>
          <span className={styles.eventPillEmoji} aria-hidden="true">☀️</span>
          <span className={styles.eventPillText}>
            <span className={styles.eventPillLabel}>Good events — boost demand</span>
            <span className={styles.eventPillSub}>Perfect weather · School picnic · Sports day</span>
          </span>
        </div>
        <div className={`${styles.eventPill} ${styles.bad}`}>
          <span className={styles.eventPillEmoji} aria-hidden="true">🌧️</span>
          <span className={styles.eventPillText}>
            <span className={styles.eventPillLabel}>Bad events — cut demand</span>
            <span className={styles.eventPillSub}>Rainy day · Wasp nest · Road construction</span>
          </span>
        </div>
        <div className={`${styles.eventPill} ${styles.neutral}`}>
          <span className={styles.eventPillEmoji} aria-hidden="true">🏡</span>
          <span className={styles.eventPillText}>
            <span className={styles.eventPillLabel}>Neutral events — small effects</span>
            <span className={styles.eventPillSub}>New neighbor · Yard sale nearby</span>
          </span>
        </div>
      </div>
      <div className={styles.marketPills}>
        <div className={styles.marketPill}>
          <span aria-hidden="true">📈</span> SPY up → more good events
        </div>
        <div className={styles.marketPill}>
          <span aria-hidden="true">😱</span> VIX &gt; 30 → events happen more often
        </div>
      </div>
    </>
  );
}

function CardsSlide() {
  const cards = [
    { emoji: '☀️', name: 'Sunny Day',         when: 'Round 3',     effect: '+30% demand for 2 rounds' },
    { emoji: '🌬️', name: 'Cool Breeze',       when: '$50 revenue', effect: '−15% ingredient costs' },
    { emoji: '🏫', name: 'School Pickup',      when: 'Round 6',     effect: '+50% demand for 1 round' },
    { emoji: '⚡', name: 'Power Hour',         when: '$100 revenue', effect: '+20% to all prices' },
    { emoji: '🔥', name: 'Neighborhood BBQ',   when: 'Good event',  effect: '+40% demand for 2 rounds' },
    { emoji: '🌧️', name: 'Rainy Day Strategy', when: 'Bad event',   effect: '−25% costs for 2 rounds' },
    { emoji: '🍀', name: 'Lucky Break',        when: 'Round 10',    effect: '+60% demand for 1 round' },
    { emoji: '📉', name: 'Market Crash',       when: '$200 revenue', effect: '−30% costs for 3 rounds' },
  ];

  return (
    <>
      <span className={styles.slideEmoji} aria-hidden="true">📋</span>
      <h2 className={styles.slideTitle}>Market Cards</h2>
      <p className={styles.slideSubtitle}>
        Earn cards as you hit milestones. Each gives a temporary boost — use them wisely!
      </p>
      <ul className={styles.featureList}>
        {cards.map(c => (
          <li key={c.name} className={styles.featureItem}>
            <span className={styles.featureIcon} aria-hidden="true">{c.emoji}</span>
            <span className={styles.featureText}>
              <span className={styles.featureLabel}>{c.name}</span>
              <span className={styles.featureSub}>Unlocks: {c.when} · {c.effect}</span>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

function ModesSlide() {
  return (
    <>
      <span className={styles.slideEmoji} aria-hidden="true">🔍</span>
      <h2 className={styles.slideTitle}>Play Your Way</h2>
      <p className={styles.slideSubtitle}>
        Toggle between modes using the button in the top-right corner.
      </p>
      <div className={styles.modeCards}>
        <div className={`${styles.modeCard}`}>
          <span className={styles.modeCardEmoji} aria-hidden="true">🧒</span>
          <span className={styles.modeCardTitle}>Junior Mode</span>
          <span className={styles.modeCardDesc}>Emoji-friendly. No stock names or % numbers. Simple demand bars.</span>
        </div>
        <div className={`${styles.modeCard} ${styles.active}`}>
          <span className={styles.modeCardEmoji} aria-hidden="true">🧑‍💼</span>
          <span className={styles.modeCardTitle}>Explorer Mode</span>
          <span className={styles.modeCardDesc}>Live stock ticker, % price moves, sparkline charts, and full stats.</span>
        </div>
      </div>
      <ul className={styles.featureList} style={{ marginTop: '10px' }}>
        <li className={styles.featureItem}>
          <span className={styles.featureIcon} aria-hidden="true">🏙️</span>
          <span className={styles.featureText}>
            <span className={styles.featureLabel}>3 stand themes</span>
            <span className={styles.featureSub}>Street · Beach · Park — changes the background colour</span>
          </span>
        </li>
        <li className={styles.featureItem}>
          <span className={styles.featureIcon} aria-hidden="true">🔊</span>
          <span className={styles.featureText}>
            <span className={styles.featureLabel}>Sound effects toggle</span>
            <span className={styles.featureSub}>Coin sounds, event chimes, win fanfare — all synthesised, no files</span>
          </span>
        </li>
      </ul>
    </>
  );
}

function GoalSlide() {
  return (
    <>
      <span className={styles.slideEmoji} aria-hidden="true">🏆</span>
      <h2 className={styles.slideTitle}>Reach Your Goal</h2>
      <p className={styles.slideSubtitle}>
        Earn <strong>$100</strong> in coins to win. The goal bar at the top of the screen tracks your progress.
      </p>
      <div className={styles.goalDemo} role="presentation">
        <div className={styles.goalDemoBar}>
          <div className={styles.goalDemoFill} style={{ width: '72%' }} />
        </div>
        <div className={styles.goalDemoLabel}>
          <span>$0</span>
          <span>$72 / $100 💰</span>
          <span>$100 🏆</span>
        </div>
      </div>
      <ul className={styles.featureList} style={{ marginTop: '12px' }}>
        <li className={styles.featureItem}>
          <span className={styles.featureIcon} aria-hidden="true">🎯</span>
          <span className={styles.featureText}>
            <span className={styles.featureLabel}>Goal mode (default)</span>
            <span className={styles.featureSub}>Hit $100 → Win Screen with your full stats summary</span>
          </span>
        </li>
        <li className={styles.featureItem}>
          <span className={styles.featureIcon} aria-hidden="true">∞</span>
          <span className={styles.featureText}>
            <span className={styles.featureLabel}>Sandbox mode</span>
            <span className={styles.featureSub}>Play forever after winning — no goal bar shown</span>
          </span>
        </li>
        <li className={styles.featureItem}>
          <span className={styles.featureIcon} aria-hidden="true">🏁</span>
          <span className={styles.featureText}>
            <span className={styles.featureLabel}>End session anytime</span>
            <span className={styles.featureSub}>Tap "End session" to see your summary early</span>
          </span>
        </li>
      </ul>
    </>
  );
}

function MysterySlide() {
  return (
    <>
      <span className={styles.slideEmoji} aria-hidden="true">⭐</span>
      <h2 className={styles.slideTitle}>Mystery Sip</h2>
      <p className={styles.slideSubtitle}>
        The wild card unlocks automatically at <strong>Round 5</strong>. It&apos;s secretly linked to <strong>GME</strong> — the most volatile stock in the game.
      </p>
      <ul className={styles.featureList}>
        <li className={styles.featureItem}>
          <span className={styles.featureIcon} aria-hidden="true">🎰</span>
          <span className={styles.featureText}>
            <span className={styles.featureLabel}>High risk, high reward</span>
            <span className={styles.featureSub}>GME can spike or crash — your costs swing with it</span>
          </span>
        </li>
        <li className={styles.featureItem}>
          <span className={styles.featureIcon} aria-hidden="true">💜</span>
          <span className={styles.featureText}>
            <span className={styles.featureLabel}>Purple sparkle toast</span>
            <span className={styles.featureSub}>You'll get a special notification when it unlocks</span>
          </span>
        </li>
        <li className={styles.featureItem}>
          <span className={styles.featureIcon} aria-hidden="true">🤔</span>
          <span className={styles.featureText}>
            <span className={styles.featureLabel}>Junior mode keeps it mysterious</span>
            <span className={styles.featureSub}>Stock name only visible in Explorer mode</span>
          </span>
        </li>
        <li className={styles.featureItem}>
          <span className={styles.featureIcon} aria-hidden="true">📊</span>
          <span className={styles.featureText}>
            <span className={styles.featureLabel}>Real investing lesson</span>
            <span className={styles.featureSub}>GME = meme stock. High volatility = hard to predict</span>
          </span>
        </li>
      </ul>
    </>
  );
}

function SaveSlide() {
  return (
    <>
      <span className={styles.slideEmoji} aria-hidden="true">💾</span>
      <h2 className={styles.slideTitle}>Save Your Progress</h2>
      <p className={styles.slideSubtitle}>
        Your game saves automatically to this browser. To move to another device, use Export & Import.
      </p>
      <div className={styles.saveRow}>
        <div className={styles.demoBtn} aria-hidden="true">💾 Export</div>
        <div className={styles.demoBtn} aria-hidden="true">📂 Import</div>
      </div>
      <ul className={styles.featureList} style={{ marginTop: '12px' }}>
        <li className={styles.featureItem}>
          <span className={styles.featureIcon} aria-hidden="true">💾</span>
          <span className={styles.featureText}>
            <span className={styles.featureLabel}>Export save</span>
            <span className={styles.featureSub}>Downloads a .json file with all your coins, cards, and history</span>
          </span>
        </li>
        <li className={styles.featureItem}>
          <span className={styles.featureIcon} aria-hidden="true">📂</span>
          <span className={styles.featureText}>
            <span className={styles.featureLabel}>Import save</span>
            <span className={styles.featureSub}>Load a .json file to restore your progress anywhere</span>
          </span>
        </li>
        <li className={styles.featureItem}>
          <span className={styles.featureIcon} aria-hidden="true">🔒</span>
          <span className={styles.featureText}>
            <span className={styles.featureLabel}>100% private</span>
            <span className={styles.featureSub}>No accounts, no cloud sync — all data stays on your device</span>
          </span>
        </li>
        <li className={styles.featureItem}>
          <span className={styles.featureIcon} aria-hidden="true">⚠️</span>
          <span className={styles.featureText}>
            <span className={styles.featureLabel}>For entertainment only</span>
            <span className={styles.featureSub}>Prices are approximate and delayed. This is not financial advice.</span>
          </span>
        </li>
      </ul>
    </>
  );
}

// ─── Slide registry ───────────────────────────────────────────────────────────

const SLIDE_COMPONENTS: Record<SlideId, React.FC> = {
  welcome:  WelcomeSlide,
  products: ProductsSlide,
  pricing:  PricingSlide,
  timer:    TimerSlide,
  events:   EventsSlide,
  cards:    CardsSlide,
  modes:    ModesSlide,
  goal:     GoalSlide,
  mystery:  MysterySlide,
  save:     SaveSlide,
};

// ─── Main HelpScreen component ────────────────────────────────────────────────

interface HelpScreenProps {
  onClose: () => void;
}

export default function HelpScreen({ onClose }: HelpScreenProps) {
  const [index, setIndex] = useState(0);
  const trapRef = useFocusTrap<HTMLDivElement>(true);

  const total  = SLIDES.length;
  const isLast = index === total - 1;

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      { onClose(); return; }
      if (e.key === 'ArrowRight')  setIndex(i => Math.min(i + 1, total - 1));
      if (e.key === 'ArrowLeft')   setIndex(i => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, total]);

  const prev = useCallback(() => setIndex(i => Math.max(i - 1, 0)), []);
  const next = useCallback(() => {
    if (isLast) { onClose(); return; }
    setIndex(i => i + 1);
  }, [isLast, onClose]);

  const SlideContent = SLIDE_COMPONENTS[SLIDES[index]];

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="How to play StockStand"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.modal} ref={trapRef}>

        {/* Close button */}
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close help"
        >
          ✕
        </button>

        {/* Slide viewport */}
        <div className={styles.viewport} aria-live="polite" aria-atomic="true">
          <div
            className={styles.track}
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {SLIDES.map((id, i) => {
              const Content = SLIDE_COMPONENTS[id];
              return (
                <div
                  key={id}
                  className={styles.slide}
                  aria-hidden={i !== index}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  {...(i !== index ? { inert: '' } as any : {})}
                >
                  <Content />
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation footer */}
        <footer className={styles.footer}>
          <button
            className={styles.navBtn}
            onClick={prev}
            disabled={index === 0}
            aria-label="Previous slide"
          >
            ←
          </button>

          {/* Dot indicators */}
          <div className={styles.dots} role="tablist" aria-label="Slide navigation">
            {SLIDES.map((id, i) => (
              <button
                key={id}
                role="tab"
                aria-selected={i === index}
                aria-label={`Slide ${i + 1} of ${total}`}
                className={`${styles.dot} ${i === index ? styles.dotActive : ''}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>

          {isLast ? (
            <button className={styles.ctaBtn} onClick={onClose} autoFocus>
              Let&apos;s go! 🍋
            </button>
          ) : (
            <button
              className={styles.navBtn}
              onClick={next}
              aria-label="Next slide"
            >
              →
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
