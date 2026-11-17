// Reusable lightweight effects for every entrance, click, and idle movement.
// Native Web Animations keep the particle work off the main animation timeline.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const rand = (lo, hi) => Math.random() * (hi - lo) + lo;
const active = () => !reducedMotion.matches && !document.hidden;

function particle(type, x, y, size, frames, duration) {
  if (!active() || !Number.isFinite(x + y)) return;
  const node = document.createElement('i');
  node.className = `trail-particle trail-${type}`;
  Object.assign(node.style, {
    left: `${x - size / 2}px`, top: `${y - size / 2}px`,
    width: `${size}px`, height: `${size}px`
  });
  document.body.append(node);
  const animation = node.animate(frames, { duration, easing: 'ease-out', fill: 'forwards' });
  animation.finished.catch(() => {}).finally(() => node.remove());
}

function snow(x, y) {
  particle('snow', x + rand(-2, 2), y, rand(3, 6), [
    { transform: 'translate3d(0,0,0) scale(1)', opacity: .9 },
    { transform: `translate3d(${rand(-16,-5)}px,${rand(-8,15)}px,0) scale(.25)`, opacity: 0 }
  ], rand(560, 850));
}

function cloud(x, y) {
  particle('cloud', x, y, rand(8, 15), [
    { transform: 'translate3d(0,0,0) scale(.65)', opacity: .65 },
    { transform: `translate3d(${rand(-12,12)}px,${rand(-16,-4)}px,0) scale(1.6)`, opacity: 0 }
  ], rand(800, 1300));
}

function exhaust(x, y) {
  particle('exhaust', x, y, rand(5, 11), [
    { transform: 'translate3d(0,0,0) scale(.6)', opacity: .55 },
    { transform: `translate3d(${rand(9,22)}px,${rand(-12,-3)}px,0) scale(1.55)`, opacity: 0 }
  ], rand(650, 1050));
}

function steam(x, y) {
  particle('steam', x, y, rand(4, 8), [
    { transform: 'translate3d(0,0,0) scale(.5)', opacity: .42 },
    { transform: `translate3d(${rand(-7,7)}px,-25px,0) scale(1.15)`, opacity: 0 }
  ], rand(1300, 1800));
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
  ], rand(900, 1500));
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
    ], rand(650, 1200));
  }
}

function drop(x, y) {
  particle('blood', x, y, rand(4, 8), [
    { transform: 'translate3d(0,0,0) rotate(45deg) scale(.3)', opacity: .95 },
    { transform: 'translate3d(0,1px,0) rotate(45deg) scale(1)', opacity: .95, offset: .3 },
    { transform: `translate3d(0,${rand(18, 46)}px,0) rotate(45deg) scale(.8)`, opacity: 0 }
  ], rand(900, 1500));
}

// Drops swell at the bottom edge of the emoji, then fall and fade.
export function bloodDrops(el, count) {
  if (!active() || !el?.isConnected) return;
  const r = el.getBoundingClientRect();
  for (let i = 0; i < count; i++) {
    setTimeout(() => drop(r.left + r.width * rand(.2, .8), r.bottom - r.height * .12), i * rand(20, 55));
  }
}

function antDot(x,y) {
  particle('ant',x,y,rand(2,4),[
    {transform:'translate3d(0,0,0) scale(1)',opacity:.65},
    {transform:'translate3d(0,-4px,0) scale(.1)',opacity:0}
  ],rand(500,850));
}
export const antTrail = () => trail(85,rect=>
  ({x:rect.x+rect.width*.18,y:rect.y+rect.height*.76}),antDot);
