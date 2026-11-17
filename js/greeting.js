import { reducedMotion } from './engine.js';

const hellos = [
  ['ko', '안녕'], ['en', 'Hi'], ['es', 'Hola'], ['ja', 'こんにちは'], ['fr', 'Bonjour'],
  ['zh', '你好'], ['it', 'Ciao'], ['pt', 'Olá'], ['de', 'Hallo'], ['hi', 'नमस्ते']
];
const HOLD_MS = 1500;
// Matches the .greeting opacity transition.
const FADE_MS = 300;

export function cycleGreeting(el) {
  if (!el || reducedMotion.matches) return;
  let index = 0;
  setInterval(() => {
    if (document.hidden) return;
    el.classList.add('is-swapping');
    setTimeout(() => {
      index = (index + 1) % hellos.length;
      const [lang, text] = hellos[index];
      el.lang = lang;
      el.textContent = text;
      el.classList.remove('is-swapping');
    }, FADE_MS);
  }, HOLD_MS);
}
