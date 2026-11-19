// Reusable lightweight effects for every entrance, click, and idle movement.
// Native Web Animations keep the particle work off the main animation timeline.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const rand = (lo, hi) => Math.random() * (hi - lo) + lo;
const active = () => !reducedMotion.matches && !document.hidden;

function particle(type, x, y, size, frames, duration, easing) {
  if (!active() || !Number.isFinite(x + y)) return;
  const node = document.createElement('i');
  node.className = `trail-particle trail-${type}`;
  Object.assign(node.style, {
    left: `${x - size / 2}px`, top: `${y - size / 2}px`,
    width: `${size}px`, height: `${size}px`
  });
  document.body.append(node);
  const animation = node.animate(frames, { duration, easing, fill: 'forwards' });
  animation.finished.catch(() => {}).finally(() => node.remove());
  return node;
}

// A short-lived text decoration centred on a viewport point.
function decoration(className, text, x, y, frames, duration) {
  if (!active()) return Promise.resolve();
  const node = document.createElement('span');
  node.className = className;
  node.textContent = text;
  node.setAttribute('aria-hidden', 'true');
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  document.body.append(node);
  return node.animate(frames, { duration, fill: 'forwards' }).finished
    .catch(() => {}).finally(() => node.remove());
}

function snow(x, y) {
  particle('snow', x + rand(-2, 2), y, rand(3, 6), [
    { transform: 'translate3d(0,0,0) scale(1)', opacity: .9 },
    { transform: `translate3d(${rand(-16,-5)}px,${rand(-8,15)}px,0) scale(.25)`, opacity: 0 }
  ], rand(560, 850), 'ease-out');
}

function cloud(x, y) {
  particle('cloud', x, y, rand(8, 15), [
    { transform: 'translate3d(0,0,0) scale(.65)', opacity: .65 },
    { transform: `translate3d(${rand(-12,12)}px,${rand(-16,-4)}px,0) scale(1.6)`, opacity: 0 }
  ], rand(800, 1300), 'ease-out');
}

function exhaust(x, y) {
  particle('exhaust', x, y, rand(5, 11), [
    { transform: 'translate3d(0,0,0) scale(.6)', opacity: .55 },
    { transform: `translate3d(${rand(9,22)}px,${rand(-12,-3)}px,0) scale(1.55)`, opacity: 0 }
  ], rand(650, 1050), 'ease-out');
}

function steam(x, y) {
  particle('steam', x, y, rand(4, 8), [
    { transform: 'translate3d(0,0,0) scale(.5)', opacity: .42 },
    { transform: `translate3d(${rand(-7,7)}px,-25px,0) scale(1.15)`, opacity: 0 }
  ], rand(1300, 1800), 'ease-out');
}

// Each moving actor gets its own beat, starting on its first frame. No frame-by-frame layout reads.
function trail(interval, getPosition, emit) {
  let previous = null, last = -Infinity;
  return rect => {
    if (!active() || !rect || rect.opacity < .5) return;
    const center = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    const now = performance.now();
    if (now - last < interval) return;
    const at = getPosition(rect, previous ?? center, center);
    emit(at.x, at.y);
    previous = center;
    last = now;
  };
}

const snowTail = rect => ({ x: rect.x + rect.width * .22, y: rect.y + rect.height * .86 });
// The plane points up and right, so its tail is bottom left.
const planeTail = rect => ({ x: rect.x + rect.width * .15, y: rect.y + rect.height * .8 });
// The red car faces left; the rear exhaust is on its right side.
const exhaustPipe = rect => ({ x: rect.x + rect.width * .87, y: rect.y + rect.height * .66 });

export const snowTrail = () => trail(80, snowTail, snow);
export const cloudTrail = () => trail(110, (_rect, previous) => previous, cloud);
export const exhaustTrail = () => trail(90, exhaustPipe, exhaust);

function rocketSmoke(x, y) {
  particle('rocket', x, y, rand(7, 13), [
    { transform: 'translate3d(0,0,0) scale(.5)', opacity: .75 },
    { transform: `translate3d(${rand(-10,10)}px,${rand(-10,6)}px,0) scale(${rand(2, 3.2)})`, opacity: 0 }
  ], rand(900, 1500), 'ease-out');
}

// Rects passed here are the tail point itself.
export const rocketTrail = () => trail(26, (_rect, _previous, center) => center, rocketSmoke);

const parked = el => el?.isConnected && getComputedStyle(el).visibility !== 'hidden';

// A light trail for vehicles sitting in their slots; moving ones are covered by their own trail.
export function idleTrails({ car, plane, board }) {
  if (!active()) return;
  const at = (el, tail) => tail(el.getBoundingClientRect());
  if (parked(car)) { const p = at(car, exhaustPipe); exhaust(p.x, p.y); }
  if (parked(plane)) { const p = at(plane, planeTail); cloud(p.x, p.y); }
  if (parked(board)) { const p = at(board, snowTail); snow(p.x, p.y); }
}

export function coffeeSteam(el, count = 1) {
  if (!active() || !el?.isConnected) return;
  const r = el.getBoundingClientRect();
  for (let i = 0; i < count; i++) {
    steam(r.left + r.width * (.47 + (i - (count - 1) / 2) * .14), r.top + r.height * .14);
  }
}

export function champagneBubbles(el, count = 5) {
  if (!active() || !el?.isConnected) return;
  const r = el.getBoundingClientRect();
  for (let i = 0; i < count; i++) {
    const x = r.left + r.width * .64 + rand(-6, 6);
    const y = r.top + r.height * .2;
    particle('bubble', x, y, rand(3, 7), [
      { transform: 'translate3d(0,0,0) scale(.5)', opacity: .8 },
      { transform: `translate3d(${rand(-15,15)}px,${rand(-20,-39)}px,0) scale(1.25)`, opacity: 0 }
    ], rand(650, 1200), 'ease-out');
  }
}

function splat(x, y) {
  particle('splat', x, y, rand(6, 10), [
    { transform: 'scale(.4, .2)', opacity: .9 },
    { transform: 'scale(1.9, .45)', opacity: 0 }
  ], 750, 'ease-out');
}

// Swells at the edge, stretches as it falls under gravity, and splats where it lands.
function drop(x, y) {
  const fall = rand(45, 95);
  const duration = rand(1300, 2000);
  particle('blood', x, y, rand(5, 10), [
    { transform: 'translate3d(0,0,0) scale(.2) rotate(45deg)', opacity: .98, easing: 'ease-out' },
    { transform: 'translate3d(0,2px,0) scale(1) rotate(45deg)', opacity: .98, offset: .4, easing: 'ease-in' },
    { transform: `translate3d(0,${fall}px,0) scale(.7, 1.8) rotate(45deg)`, opacity: .9 }
  ], duration, 'linear');
  setTimeout(() => splat(x, y + fall + 4), duration);
}

const DRIP_COLUMNS = 18;

// Uneven drips run down from the top of the screen until it is covered, then the blood drains away.
export function bloodFlood() {
  if (!active()) return Promise.resolve();
  const layer = document.createElement('div');
  layer.className = 'blood-flood';
  layer.setAttribute('aria-hidden', 'true');
  const width = 100 / DRIP_COLUMNS;
  const pours = Array.from({ length: DRIP_COLUMNS }, (_, i) => {
    const drip = document.createElement('i');
    drip.className = 'blood-drip';
    // Slight overlap hides the seams between neighbouring drips.
    drip.style.left = `${i * width - .4}%`;
    drip.style.width = `${width + .8}%`;
    layer.append(drip);
    return drip.animate([
      { transform: 'scaleY(0)' },
      { transform: 'scaleY(1)' }
    ], { duration: rand(900, 1700), delay: rand(0, 350), easing: 'cubic-bezier(.5, 0, .75, 1)', fill: 'forwards' }).finished;
  });
  document.body.append(layer);
  return Promise.all(pours)
    .then(() => layer.animate([{ opacity: 1 }, { opacity: 1, offset: .35 }, { opacity: 0 }], { duration: 1100, fill: 'forwards' }).finished)
    .catch(() => {})
    .finally(() => layer.remove());
}

// Staggered particles released along the bottom edge of the emoji.
function sprinkle(el, count, emit) {
  if (!active() || !el?.isConnected) return;
  const r = el.getBoundingClientRect();
  for (let i = 0; i < count; i++) {
    setTimeout(() => emit(r.left + r.width * rand(.2, .8), r.bottom - r.height * .12), i * rand(20, 55));
  }
}

// Drops swell at the bottom edge of the emoji, then fall and fade.
export const bloodDrops = (el, count) => sprinkle(el, count, drop);

function crumb(x, y) {
  particle('crumb', x, y, rand(2, 5), [
    { transform: 'translate3d(0,0,0) rotate(0deg)', opacity: .95 },
    { transform: `translate3d(${rand(-9, 9)}px,${rand(16, 34)}px,0) rotate(${rand(-200, 200)}deg)`, opacity: 0 }
  ], rand(600, 1000), 'ease-out');
}

export const crumbs = (el, count) => sprinkle(el, count, crumb);

const POP = 'translate(-50%, -50%) scale';

// A red unread badge on the phone's top-right corner.
export function notifyBadge(el) {
  const r = el.getBoundingClientRect();
  return decoration('notify-badge', '1', r.right - r.width * .18, r.top + r.height * .14, [
    { transform: `${POP}(0)`, opacity: 1 },
    { transform: `${POP}(1.25)`, offset: .12 },
    { transform: `${POP}(1)`, offset: .2 },
    { transform: `${POP}(1)`, opacity: 1, offset: .85 },
    { transform: `${POP}(.6)`, opacity: 0 }
  ], 1600);
}

// A speech bubble above the emoji.
export function speechBubble(el, text) {
  const r = el.getBoundingClientRect();
  return decoration('speech-bubble', text, r.left + r.width / 2, r.top - r.height * .35, [
    { transform: `${POP}(.3)`, opacity: 0 },
    { transform: `${POP}(1.08)`, opacity: 1, offset: .15 },
    { transform: `${POP}(1)`, opacity: 1, offset: .25 },
    { transform: `${POP}(1)`, opacity: 1, offset: .82 },
    { transform: `${POP}(.9)`, opacity: 0 }
  ], 1800);
}

// Footprints walking away to the left of the emoji, appearing one by one.
export function footsteps(el, count) {
  const r = el.getBoundingClientRect();
  const step = r.width * .55;
  return Promise.all(Array.from({ length: count }, (_, i) => decoration(
    'footstep', '👣',
    r.left - step * (i + .4), r.bottom - r.height * (i % 2 ? .18 : .3),
    [
      { opacity: 0, offset: 0 },
      { opacity: 0, offset: i * .12 },
      { opacity: .85, offset: i * .12 + .05 },
      { opacity: .85, offset: .75 },
      { opacity: 0 }
    ],
    1700
  )));
}

// Characters drift up from the top of the emoji with a little sway.
export function floatUp(el, chars, count) {
  const r = el.getBoundingClientRect();
  return Promise.all(Array.from({ length: count }, (_, i) => {
    const sway = rand(-14, 14);
    return decoration('float-char', chars[i % chars.length], r.left + r.width * rand(.2, .8), r.top + r.height * .2, [
      { transform: `${POP}(.5) translate(0, 0)`, opacity: 0 },
      { transform: `${POP}(1) translate(${sway * .4}px, -10px)`, opacity: 1, offset: .2 },
      { transform: `${POP}(.9) translate(${sway}px, ${-rand(34, 52)}px)`, opacity: 0 }
    ], rand(1100, 1600) + i * 90);
  }));
}

const FISH = ['🐟', '🐠', '🐡'];
const SWIM_STEPS = 10;

// Fish glyphs face left: mirror them when heading right, then point them along the heading.
function swimFrame(angle, x, y, scale, wiggle, opacity) {
  const right = Math.cos(angle) > 0;
  const turn = (right ? angle : angle - Math.PI) * 180 / Math.PI + wiggle;
  return { transform: `${POP}(1) translate(${x}px, ${y}px) rotate(${turn}deg) scale(${right ? -scale : scale}, ${scale})`, opacity };
}

// A school of fish bursts out of the emoji and swims off screen in every direction.
export function fishSchool(el, count) {
  const r = el.getBoundingClientRect();
  const reach = Math.max(innerWidth, innerHeight) * .85;
  return Promise.all(Array.from({ length: count }, (_, i) => {
    const angle = i / count * Math.PI * 2 + rand(-.25, .25);
    const sway = rand(8, 16);
    const frames = Array.from({ length: SWIM_STEPS + 1 }, (_, k) => {
      const t = k / SWIM_STEPS;
      const along = reach * t ** .8;
      const side = sway * Math.sin(t * Math.PI * 4);
      const x = Math.cos(angle) * along - Math.sin(angle) * side;
      const y = Math.sin(angle) * along + Math.cos(angle) * side;
      return swimFrame(angle, x, y, Math.min(1, .3 + t * 4), Math.sin(t * Math.PI * 8) * 12, k === SWIM_STEPS ? 0 : 1);
    });
    return decoration('fish', FISH[i % FISH.length], r.left + r.width / 2, r.top + r.height / 2, frames, rand(1800, 2600));
  }));
}

const MONEY = ['💸', '💵', '💵', '🪙'];

// Bills and coins tumble from the emoji down past the bottom of the screen.
export function moneyRain(el, count) {
  const r = el.getBoundingClientRect();
  const fall = innerHeight - r.top + 40;
  return Promise.all(Array.from({ length: count }, (_, i) => {
    const drift = rand(-90, 90);
    const spin = rand(-280, 280);
    return decoration('money', MONEY[i % MONEY.length], r.left + r.width / 2 + rand(-8, 8), r.top + r.height / 2, [
      { transform: `${POP}(.4) translate(0, 0) rotate(0deg)`, opacity: 0 },
      { transform: `${POP}(1) translate(${drift * .15}px, -16px) rotate(${spin * .1}deg)`, opacity: 1, offset: .14, easing: 'ease-in' },
      { transform: `${POP}(1) translate(${drift}px, ${fall}px) rotate(${spin}deg)`, opacity: 1 }
    ], rand(1300, 2100));
  }));
}

// Fire speed in px per ms, so every puff rises at the same pace.
const FIRE_SPEED = .9;

function flame(x, y, rise, size) {
  const spread = rand(-.1, .1) * rise;
  particle(Math.random() < .3 ? 'fire-core' : 'fire', x + rand(-.2, .2) * size, y, size, [
    { transform: 'translate3d(0,0,0) scale(.5)', opacity: .95 },
    { transform: `translate3d(${spread * .15}px,${-rise * .1}px,0) scale(1.4)`, opacity: .95, offset: .25, easing: 'ease-in' },
    { transform: `translate3d(${spread}px,${-rise}px,0) scale(2.6)`, opacity: 0 }
  ], Math.max(500, rise / FIRE_SPEED), 'linear');
}

// Flames from the statue's raised torch, which sits on its upper left.
function burnTorch(el, ms, interval, emit) {
  if (!active() || !el?.isConnected) return Promise.resolve();
  const r = el.getBoundingClientRect();
  const x = r.left + r.width * .3;
  const y = r.top + r.height * .1;
  const timer = setInterval(() => emit(x, y), interval);
  return new Promise(resolve => setTimeout(resolve, ms)).finally(() => clearInterval(timer));
}

// A continuous blast up to the top of the screen.
export const torchFire = (el, ms) => burnTorch(el, ms, 22, (x, y) => {
  flame(x, y, y + 40, rand(10, 18));
  flame(x, y, y + 40, rand(10, 18));
});

// A small, candle-like flicker that stays on the torch.
export const torchFlicker = (el, ms) => burnTorch(el, ms, 90, (x, y) => flame(x, y, rand(10, 20), rand(4, 7)));

function antDot(x,y) {
  particle('ant',x,y,rand(2,4),[
    {transform:'translate3d(0,0,0) scale(1)',opacity:.65},
    {transform:'translate3d(0,-4px,0) scale(.1)',opacity:0}
  ],rand(500,850), 'ease-out');
}
export const antTrail = () => trail(85,rect=>
  ({x:rect.x+rect.width*.18,y:rect.y+rect.height*.76}),antDot);
