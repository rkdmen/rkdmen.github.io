import { animate } from 'https://cdn.jsdelivr.net/npm/motion@14.11.1/+esm';

export const rand = (min, max) => Math.random() * (max - min) + min;
export const choose = items => items[Math.floor(Math.random() * items.length)];
const running = new WeakMap();
export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

// Every emoji has one owner for its transform. A new gesture picks up where the old one stopped.
export function play(el, frames, options = {}) {
  if (reducedMotion.matches || !el) return Promise.resolve();
  running.get(el)?.stop();
  const fromCurrent = Object.fromEntries(
    Object.entries(frames).map(([key, values]) => [key, [null, ...values.slice(1)]])
  );
  const animation = animate(el, fromCurrent, { duration: .65, ease: 'easeInOut', ...options });
  running.set(el, animation);
  return animation.finished.catch(() => {}).finally(() => {
    if (running.get(el) === animation) running.delete(el);
  });
}
export function stop(el) { running.get(el)?.stop(); running.delete(el); }

// Spline through [x, y, rotate, scale] points, parameterised by distance so speed is continuous.
function pathSampler(points) {
  const last = points.length - 1;
  const lengths = points.slice(1).map((p, i) => Math.max(Math.hypot(p[0] - points[i][0], p[1] - points[i][1]), .001));
  const starts = lengths.map((_, i) => lengths.slice(0, i).reduce((sum, length) => sum + length, 0));
  const total = starts[last - 1] + lengths[last - 1];
  const tangents = points.map((p, i) => {
    const before = points[Math.max(i - 1, 0)];
    const after = points[Math.min(i + 1, last)];
    const span = (i > 0 ? lengths[i - 1] : 0) + (i < last ? lengths[i] : 0);
    // Come to rest at a point where the path doubles back.
    const reverses = (p[0] - before[0]) * (after[0] - p[0]) + (p[1] - before[1]) * (after[1] - p[1]) < 0;
    return p.map((_, c) => (reverses ? 0 : (after[c] - before[c]) / span));
  });
  return u => {
    const d = u * total;
    let i = 0;
    while (i < last - 1 && d > starts[i + 1]) i++;
    const L = lengths[i];
    const t = (d - starts[i]) / L;
    const t2 = t * t;
    const t3 = t2 * t;
    return points[i].map((v, c) => (2 * t3 - 3 * t2 + 1) * v + (t3 - 2 * t2 + t) * L * tangents[i][c]
      + (3 * t2 - 2 * t3) * points[i + 1][c] + (t3 - t2) * L * tangents[i + 1][c]);
  };
}

export const easeInOut = t => t * t * (3 - 2 * t);
export const easeOut = t => 1 - (1 - t) ** 3;

// Moves a text-only stand-in along the path; the real button keeps its place in the row.
const gliding = new WeakSet();
export async function glide(el, points, { duration, ease, onMove }) {
  if (reducedMotion.matches || !el || gliding.has(el)) return;
  gliding.add(el);
  const r = el.getBoundingClientRect();
  const computed = getComputedStyle(el);
  const ghost = document.createElement('span');
  ghost.className = 'emoji-actor';
  ghost.textContent = el.textContent;
  ghost.setAttribute('aria-hidden', 'true');
  Object.assign(ghost.style, {
    left: `${r.left}px`, top: `${r.top}px`,
    width: `${r.width}px`, height: `${r.height}px`,
    fontSize: computed.fontSize, fontFamily: computed.fontFamily,
    fontWeight: computed.fontWeight, letterSpacing: computed.letterSpacing
  });
  const at = pathSampler(points.map(([x, y, rotate = 0, scale = 1]) => [x, y, rotate, scale]));
  const place = u => {
    const [x, y, rotate, scale] = at(u);
    ghost.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg) scale(${scale})`;
    onMove?.(ghost);
  };
  document.body.append(ghost);
  place(0);
  el.style.visibility = 'hidden';
  try {
    await new Promise(resolve => {
      animate(0, 1, { duration, ease: 'linear', onUpdate: t => place(ease(t)), onComplete: resolve });
    });
  } finally {
    ghost.remove();
    el.style.visibility = '';
    gliding.delete(el);
  }
}

// Shrinks the path to fit the emoji rows instead of flattening it at the edges.
export function travel(el, points, { duration }) {
  const bounds = document.querySelector('.emoji-lines')?.getBoundingClientRect();
  if (!bounds || !el) return Promise.resolve();
  const r = el.getBoundingClientRect();
  const inset = 2;
  const fit = (room, reach) => (reach > room ? Math.max(room, 0) / reach : 1);
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  const kx = Math.min(fit(bounds.right - inset - r.right, Math.max(...xs)), fit(r.left - bounds.left - inset, -Math.min(...xs)));
  const ky = Math.min(fit(bounds.bottom - inset - r.bottom, Math.max(...ys)), fit(r.top - bounds.top - inset, -Math.min(...ys)));
  return glide(el, points.map(([x, y, ...rest]) => [x * kx, y * ky, ...rest]), { duration, ease: easeInOut, onMove: undefined });
}
export function particles(el, chars = ['✦','✨'], count = 4) {
  if (reducedMotion.matches) return;
  const r = el.getBoundingClientRect();
  for (let i = 0; i < count; i++) {
    const node = document.createElement('span'); node.className = 'spark';
    node.textContent = chars[i % chars.length];
    node.style.left = `${r.left + r.width / 2}px`;
    node.style.top = `${r.top + r.height / 2}px`;
    document.body.append(node);
    const a = 2 * Math.PI * i / count + rand(-.25, .25);
    const d = rand(24, 65);
    animate(node, { x: [0, Math.cos(a) * d], y: [0, Math.sin(a) * d - 12], opacity: [0, 1, 0], scale: [.7, 1, .4] },
      { duration: .55, ease: 'easeOut' }).finished.finally(() => node.remove());
  }
}
