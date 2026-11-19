import { behaviors } from './behaviors.js';
import { surprise } from './celebration.js';
import { reducedMotion, rand, choose } from './engine.js';
import { entrance } from './intro.js';
import { coffeeSteam, idleTrails, bloodDrops, torchFlicker } from './trails.js';
import { cycleGreeting } from './greeting.js';
import { waveFlags } from './flags.js';
import { startStarfield } from './stars.js';

const emojis = [...document.querySelectorAll('.emoji')];
const drinks = emojis.filter(el => ['cheers', 'wine', 'sway'].includes(el.dataset.action));
const ball = emojis.find(el => el.dataset.action === 'kick');
const golfer = emojis.find(el => el.getAttribute('aria-label') === 'Golfer');
const heart = emojis.find(el => el.dataset.action === 'heart');
const noEntry = emojis.find(el => el.dataset.action === 'censor');
const coffee = emojis.find(el => el.dataset.action === 'steam');
const adobe = emojis.find(el => el.dataset.action === 'bleed');
const statue = emojis.find(el => el.dataset.action === 'liberty');
const vehicles = {
  car: emojis.find(el => el.dataset.action === 'drive'),
  plane: emojis.find(el => el.dataset.action === 'fly'),
  board: emojis.find(el => el.dataset.action === 'ski')
};
const busy = new WeakSet();
const lastRun = new WeakMap();
const highlights = ['fly', 'ski', 'kick', 'drive', 'heart', 'cheers', 'wine'];
let ticks = 0;
let surpriseRunning = false;

function participants(el) {
  if (el === ball || el === golfer) return [ball, golfer];
  if (drinks.includes(el)) return drinks;
  return [el];
}

function trigger(el, clicked = false) {
  if (!el || document.hidden || reducedMotion.matches || surpriseRunning) return;
  const group = participants(el);
  if (group.some(item => !item)) return;
  // Taps always run; only the idle scheduler waits for an emoji to finish.
  if (!clicked && group.some(item => busy.has(item))) return;
  if (!clicked && performance.now() - (lastRun.get(el) || 0) < 1100) return;
  const behavior = behaviors[el.dataset.action];
  if (!behavior) return;
  group.forEach(item => { busy.add(item); lastRun.set(item, performance.now()); });
  Promise.resolve().then(() => behavior(el, { emojis, drinks, clicked, trigger, takeover }))
    .catch(() => {}).finally(() => group.forEach(item => busy.delete(item)));
}

emojis.forEach(el => el.addEventListener('click', () => trigger(el, true)));

function tick() {
  if (!document.hidden && !reducedMotion.matches && !surpriseRunning) {
    ticks++;
    if (ticks % 4 === 0) trigger(choose(drinks));
    const pool = ticks % 3 === 0 ? emojis.filter(e => highlights.includes(e.dataset.action)) : emojis;
    trigger(choose(pool));
    if (Math.random() < .3) trigger(choose(emojis));
  }
  setTimeout(tick, rand(300, 540));
}

// Signature moments and ambient effects keep their own beat, independent of the random scheduler.
function every(min, max, run) {
  if (!document.hidden && !surpriseRunning) run();
  setTimeout(() => every(min, max, run), rand(min, max));
}

const title = document.querySelector('.headline');
// Page-wide scenes pause the idle scheduler and every other tap until they finish.
async function takeover(run) {
  if (surpriseRunning || reducedMotion.matches) return;
  surpriseRunning = true;
  try {
    await run();
  } finally {
    surpriseRunning = false;
  }
}

title?.addEventListener('click', () => takeover(() => surprise(title, emojis)));

cycleGreeting(document.querySelector('.greeting'));
waveFlags(emojis.filter(el => ['korea', 'usa'].includes(el.dataset.action)));

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
  whenVisible().then(() => {
    setTimeout(() => every(1400, 2200, () => coffeeSteam(coffee)), 700);
    setTimeout(() => every(1000, 1000, () => torchFlicker(statue, 1000)), 900);
    return entrance();
  }).catch(() => {}).finally(() => {
    // Fill the genuinely empty area below the emojis with random ambient starlight.
    setTimeout(startStarfield, 400);
    trigger(choose(drinks));
    setTimeout(tick, 220);
    setTimeout(() => every(2000, 2800, () => trigger(heart)), 750);
    setTimeout(() => every(3500, 5500, () => trigger(noEntry)), 1500);
    setTimeout(() => every(5000, 8000, () => trigger(vehicles.board)), 2500);
    setTimeout(() => every(380, 600, () => idleTrails(vehicles)), 300);
    setTimeout(() => every(900, 1700, () => bloodDrops(adobe, 1)), 1100);
  });
}
