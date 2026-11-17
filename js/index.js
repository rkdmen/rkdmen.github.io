import { behaviors } from './behaviors.js';
import { surprise } from './celebration.js';
import { reducedMotion, rand, choose } from './engine.js';
import { entrance } from './intro.js';
import { coffeeSteam } from './trails.js';
import { play, particles } from './engine.js';

const emojis = [...document.querySelectorAll('.emoji')];
const drinks = emojis.filter(el => ['cheers', 'wine', 'sway'].includes(el.dataset.action));
const ball = emojis.find(el => el.dataset.action === 'kick');
const golfer = emojis.find(el => el.getAttribute('aria-label') === 'Golfer');
const heart = emojis.find(el => el.dataset.action === 'heart');
const coffee = emojis.find(el => el.dataset.action === 'steam');
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
  if (group.some(item => !item || busy.has(item))) return;
  if (!clicked && performance.now() - (lastRun.get(el) || 0) < 1100) return;
  const behavior = behaviors[el.dataset.action];
  if (!behavior) return;
  group.forEach(item => { busy.add(item); lastRun.set(item, performance.now()); });
  Promise.resolve().then(() => behavior(el, { emojis, drinks, clicked, trigger }))
    .catch(() => {}).finally(() => group.forEach(item => busy.delete(item)));
}

emojis.forEach(el => el.addEventListener('click', () => trigger(el, true)));

function tick() {
  if (!document.hidden && !reducedMotion.matches && !surpriseRunning) {
    ticks++;
    if (ticks % 4 === 0) trigger(choose(drinks));
    const pool = ticks % 3 === 0 ? emojis.filter(e => highlights.includes(e.dataset.action)) : emojis;
    trigger(choose(pool));
    if (Math.random() < .25) trigger(choose(emojis));
  }
  setTimeout(tick, rand(360, 650));
}

// A separate heartbeat makes it visible even when the random scheduler picks other emojis.
function heartbeat() {
  if (!document.hidden && !surpriseRunning) trigger(heart);
  setTimeout(heartbeat, rand(2300, 3200));
}

// Gentle coffee steam stays alive independently of movement and click events.
function ambientSteam() {
  if (!surpriseRunning && !document.hidden) coffeeSteam(coffee);
  setTimeout(ambientSteam, rand(1650, 2600));
}

// A brief mix of large and small star twinkles across the bottom emoji row.
function startTwinkles() {
  const bottom = document.querySelector('.emoji-line:last-child');
  if (!bottom || reducedMotion.matches) return;
  const picks = [...bottom.querySelectorAll('.emoji')].filter(el => el.dataset.action !== 'fly');
  picks.forEach((el, i) => setTimeout(() => {
    if (document.hidden || surpriseRunning || busy.has(el)) return;
    play(el, {
      scale: [1, i % 2 ? 1.10 : 1.26, .94, 1],
      y: [0, -4 - (i % 2) * 3, 0, 0]
    }, { duration: .55, ease: 'easeOut' });
    particles(el, i % 2 ? ['✦'] : ['✨'], i % 2 ? 1 : 2);
  }, 360 + i * 140));
}

const title = document.querySelector('.headline');
title?.addEventListener('click', async () => {
  if (surpriseRunning || reducedMotion.matches) return;
  surpriseRunning = true;
  try {
    await surprise(title, emojis);
  } finally {
    surpriseRunning = false;
  }
});

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
    startTwinkles();
    setTimeout(ambientSteam, 700);
    return entrance();
  }).catch(() => {}).finally(() => {
    trigger(choose(drinks));
    setTimeout(tick, 220);
    setTimeout(heartbeat, 750);
  });
}
