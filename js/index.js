import { behaviors } from './behaviors.js';
import { surprise } from './celebration.js';
import { reducedMotion, rand, choose } from './engine.js';
import { entrance } from './intro.js';
import { coffeeSteam, idleTrails } from './trails.js';
import { startStarfield } from './stars.js';

const emojis = [...document.querySelectorAll('.emoji')];
const drinks = emojis.filter(el => ['cheers', 'wine', 'sway'].includes(el.dataset.action));
const ball = emojis.find(el => el.dataset.action === 'kick');
const golfer = emojis.find(el => el.getAttribute('aria-label') === 'Golfer');
const heart = emojis.find(el => el.dataset.action === 'heart');
const coffee = emojis.find(el => el.dataset.action === 'steam');
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

function ambientTrails() {
  if (!surpriseRunning && !document.hidden) idleTrails(vehicles);
  setTimeout(ambientTrails, rand(380, 600));
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
    setTimeout(ambientSteam, 700);
    return entrance();
  }).catch(() => {}).finally(() => {
    // Fill the genuinely empty area below the emojis with random ambient starlight.
    setTimeout(startStarfield, 400);
    trigger(choose(drinks));
    setTimeout(tick, 220);
    setTimeout(heartbeat, 750);
    setTimeout(ambientTrails, 300);
  });
}
