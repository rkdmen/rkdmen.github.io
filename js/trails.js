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

// Each moving actor gets its own throttle and last position. No frame-by-frame layout reads.
function trail(interval, threshold, getPosition, emit) {
  let previous = null, last = 0;
  return rect => {
    if (!active() || !rect) return;
    const center = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    if (!previous) { previous = center; last = performance.now(); return; }
    const now = performance.now();
    if (now - last < interval || Math.hypot(center.x - previous.x, center.y - previous.y) < threshold) return;
    const at = getPosition(rect, previous, center);
    emit(at.x, at.y);
    previous = center;
    last = now;
  };
}

export const snowTrail = () => trail(95, 3, rect =>
  ({ x: rect.x + rect.width * .22, y: rect.y + rect.height * .86 }), snow);

export const cloudTrail = () => trail(135, 4, (_rect, previous) =>
  ({ x: previous.x, y: previous.y }), cloud);

// The red car faces left; the rear exhaust is on its right side.
export const exhaustTrail = () => trail(115, 3, rect =>
  ({ x: rect.x + rect.width * .87, y: rect.y + rect.height * .66 }), exhaust);

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
