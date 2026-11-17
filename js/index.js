import { behaviors, toast } from './behaviors.js';
import { reducedMotion, rand, choose, particles } from './engine.js';
import { entrance } from './intro.js';
import './layout.js';

const emojis = [...document.querySelectorAll('.emoji')];
const drinks = emojis.filter(el => ['cheers','wine','sway'].includes(el.dataset.action) || ['Whiskey','Champagne'].includes(el.ariaLabel));
const busy = new WeakSet();
const lastRun = new WeakMap();
const INTERVAL = { min: 340, max: 710 };
let timer;
let ticks = 0;

function trigger(el, clicked = false) {
  if (!el || document.hidden || reducedMotion.matches) return;
  if (!clicked && (busy.has(el) || performance.now() - (lastRun.get(el) || 0) < 1100)) return;
  if (busy.has(el) && !clicked) return;
  const behavior = behaviors[el.dataset.action];
  if (!behavior) return;
  busy.add(el);
  lastRun.set(el, performance.now());
  const ctx = { emojis, drinks, clicked, trigger: child => trigger(child) };
  Promise.resolve(behavior(el, ctx)).catch(() => {}).finally(() => {
    // Avoid queued animations fighting for the same emoji.
    setTimeout(() => busy.delete(el), 90);
  });
}

emojis.forEach(el => el.addEventListener('click', () => trigger(el, true)));

// Weighted story moments keep the page recognizable rather than random chaos.
const highlights = ['fly','ski','kick','drive','heart','cheers','wine'];
function tick() {
  if (!document.hidden && !reducedMotion.matches) {
    ticks++;
    if (ticks % 4 === 0) toast(drinks);
    const pick = ticks % 3 === 0
      ? choose(emojis.filter(e => highlights.includes(e.dataset.action)))
      : choose(emojis);
    trigger(pick);
    if (Math.random() < .32) trigger(choose(emojis));
  }
  timer = setTimeout(tick, rand(INTERVAL.min, INTERVAL.max));
}

const period = document.querySelector('.period');
function ensemble() {
  if (reducedMotion.matches) return;
  particles(period, ['✨','🎉','✦'], 8);
  [...emojis].sort(() => Math.random() - .5).slice(0, 12).forEach((el, i) => setTimeout(() => trigger(el, true), i * 85));
}
period.addEventListener('click', ensemble);
period.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); ensemble(); }
});

// In-app browsers can load the page before showing it; the first frame means it is on screen.
const whenVisible = () => new Promise(resolve => {
  const onChange = () => {
    if (document.hidden) return;
    document.removeEventListener('visibilitychange', onChange);
    requestAnimationFrame(resolve);
  };
  document.addEventListener('visibilitychange', onChange);
  onChange();
});

if (!reducedMotion.matches) {
  // Let the arrivals land before regular idle animations take over.
  whenVisible().then(entrance).catch(() => {}).finally(() => {
    toast(drinks);
    timer = setTimeout(tick, 220);
  });
}
