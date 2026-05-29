/**
 * Programmatic sound effects via Web Audio API.
 * No audio files — all sounds are synthesised from oscillators.
 * Zero bytes added to the bundle beyond this module.
 *
 * Sounds:
 *  coin      – rising double-tone   (positive round P&L)
 *  coin-loss – falling double-tone  (negative round P&L)
 *  event     – two-tone chime       (game event fires)
 *  win       – ascending C-major arpeggio (win / goal reached)
 *  unlock    – sparkle trio         (card or Mystery Sip unlocked)
 */

// Lazy singleton AudioContext — must be created after a user gesture.
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitAudioContext;
      ctx = new Ctor() as AudioContext;
    }
    // Resume if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function playTone(
  frequency:  number,
  duration:   number,
  type:       OscillatorType = 'sine',
  gain        = 0.18,
  startDelay  = 0,
): void {
  const ac = getCtx();
  if (!ac) return;

  const osc = ac.createOscillator();
  const env = ac.createGain();

  osc.type            = type;
  osc.frequency.value = frequency;

  const t0 = ac.currentTime + startDelay;
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(env);
  env.connect(ac.destination);

  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

export type SoundType = 'coin' | 'coin-loss' | 'event' | 'win' | 'unlock';

export function playSound(type: SoundType): void {
  switch (type) {
    case 'coin':
      // Rising double-tone: profit ✓
      playTone(880,  0.12, 'sine',     0.15, 0.00);
      playTone(1320, 0.18, 'sine',     0.12, 0.10);
      break;

    case 'coin-loss':
      // Falling double-tone: loss ✗
      playTone(440, 0.18, 'sine', 0.12, 0.00);
      playTone(330, 0.22, 'sine', 0.10, 0.12);
      break;

    case 'event':
      // Two-tone chime: event card
      playTone(659, 0.15, 'triangle', 0.14, 0.00);
      playTone(784, 0.20, 'triangle', 0.12, 0.14);
      break;

    case 'win':
      // C-major ascending arpeggio: C5 E5 G5 C6
      playTone(523,  0.15, 'sine', 0.14, 0.00);
      playTone(659,  0.15, 'sine', 0.14, 0.15);
      playTone(784,  0.15, 'sine', 0.14, 0.30);
      playTone(1047, 0.28, 'sine', 0.16, 0.45);
      break;

    case 'unlock':
      // Sparkle ascending trio
      playTone(1047, 0.10, 'sine', 0.12, 0.00);
      playTone(1319, 0.10, 'sine', 0.12, 0.08);
      playTone(1568, 0.15, 'sine', 0.12, 0.16);
      break;
  }
}
