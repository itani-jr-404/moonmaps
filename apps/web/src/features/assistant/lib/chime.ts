import { prefersReducedMotion } from '@/lib/motion/reduced-motion';

/*
  A short, soft two-note tone for a reply that arrives while the panel is closed. It is made with
  the Web Audio API (no audio file). Browsers only allow sound after the visitor has interacted
  with the page, so it is skipped before any gesture, and also when reduced motion is set.
  Web Audio API reference: MDN, "Web Audio API", https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
  (owner Mozilla, read 2026-11-15).
*/

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

let context: AudioContext | null = null;

export function playChime(): void {
  if (typeof window === 'undefined' || prefersReducedMotion()) return;
  const activation = (
    navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }
  ).userActivation;
  if (activation && !activation.hasBeenActive) return;
  const Ctor =
    window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  if (!Ctor) return;
  try {
    context ??= new Ctor();
    const ctx = context;
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime;
    [660, 880].forEach((freq, i) => {
      const start = now + i * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.05, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.34);
    });
  } catch {
    // Sound is a nicety; any failure is ignored.
  }
}
