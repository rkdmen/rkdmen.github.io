import { reducedMotion } from './engine.js';

// ASCII noise keeps roughly the same width as the title's letters.
const noise = '01<>/{}[]#$%&*+=?';
const STEP_MS = 45;
const SCRAMBLE_MS = 450;
const REVEAL_MS = 1300;
const randomNoise = () => noise[Math.floor(Math.random() * noise.length)];

// Scrambles the headline into code, then resolves it back left to right.
export async function decodeHeadline(title) {
  if (reducedMotion.matches || !title || title.classList.contains('is-devilish')) return;
  const text = title.dataset.text;
  const started = performance.now();
  title.classList.add('is-decoding');
  try {
    await new Promise(resolve => {
      const timer = setInterval(() => {
        const elapsed = performance.now() - started - SCRAMBLE_MS;
        const revealed = Math.floor(Math.max(0, elapsed) / REVEAL_MS * text.length);
        title.textContent = [...text].map((char, i) => (i < revealed || char === ' ' ? char : randomNoise())).join('');
        if (revealed >= text.length) {
          clearInterval(timer);
          resolve();
        }
      }, STEP_MS);
    });
  } finally {
    title.textContent = text;
    title.classList.remove('is-decoding');
  }
}
