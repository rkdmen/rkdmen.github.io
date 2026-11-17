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


function copyEmojiContent(source, actor) {
  const original = source.querySelector('.spin-core');
  if (!original) {
    actor.textContent = source.textContent;
    return () => {};
  }
  const clone = original.cloneNode(true);
  actor.appendChild(clone);
  return () => {
    const from = original.getAnimations?.()[0];
    const to = clone.getAnimations?.()[0];
    if (from && to && from.currentTime != null) {
      try { to.currentTime = from.currentTime; } catch {}
    }
  };
}

// Moves a text-only stand-in along the path; the real button keeps its place in the row.
const gliding = new WeakSet();
// `at` maps progress 0..1 to [x, y, rotate, scale, opacity].
export async function glide(el, at, { duration, ease, onMove }) {
  if (reducedMotion.matches || !el || gliding.has(el)) return;
  gliding.add(el);
  const r = el.getBoundingClientRect();
  const computed = getComputedStyle(el);
  const ghost = document.createElement('span');
  ghost.className = 'emoji-actor';
  const alignSpin = copyEmojiContent(el, ghost);
  ghost.setAttribute('aria-hidden', 'true');
  Object.assign(ghost.style, {
    left: `${r.left}px`, top: `${r.top}px`,
    width: `${r.width}px`, height: `${r.height}px`,
    fontSize: computed.fontSize, fontFamily: computed.fontFamily,
    fontWeight: computed.fontWeight, letterSpacing: computed.letterSpacing
  });
  const place = u => {
    const [x, y, rotate, scale, rawOpacity] = at(u);
    const opacity = Math.min(1, Math.max(0, rawOpacity));
    ghost.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg) scale(${scale})`;
    ghost.style.opacity = opacity;
    onMove?.({ x: r.left + x, y: r.top + y, width: r.width, height: r.height, opacity });
  };
  document.body.append(ghost);
  alignSpin();
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

// Smooth cinematic entrances use a separate cubic Bézier path. Ordinary emoji
// interactions continue to use the lightweight travel() API above.
function splineSegments(knots) {
  const factor = 1 / 6;
  return knots.slice(0, -1).map((start, index) => {
    const end = knots[index + 1];
    const previous = knots[Math.max(0, index - 1)];
    const next = knots[Math.min(knots.length - 1, index + 2)];
    return [
      start,
      [start[0] + (end[0] - previous[0]) * factor,
       start[1] + (end[1] - previous[1]) * factor],
      [end[0] - (next[0] - start[0]) * factor,
       end[1] - (next[1] - start[1]) * factor],
      end
    ];
  });
}

function cubicPoint(segment, t) {
  const [a, b, c, d] = segment;
  const reverse = 1 - t;
  return [0, 1].map(axis =>
    reverse ** 3 * a[axis] +
    3 * reverse ** 2 * t * b[axis] +
    3 * reverse * t ** 2 * c[axis] +
    t ** 3 * d[axis]
  );
}

// Sample once and travel by distance rather than by segment index. That means
// the emoji doesn't accelerate at a tight bend or jump between waypoints.
export function sampleSmoothPath(knots, steps = 48) {
  const segments = splineSegments(knots);
  const samples = [{ point: knots[0], length: 0 }];
  let total = 0;
  for (const segment of segments) {
    for (let i = 1; i <= steps; i++) {
      const point = cubicPoint(segment, i / steps);
      const previous = samples[samples.length - 1].point;
      total += Math.hypot(point[0] - previous[0], point[1] - previous[1]);
      samples.push({ point, length: total });
    }
  }
  return progress => {
    const target = Math.max(0, Math.min(1, progress)) * total;
    let low = 0, high = samples.length - 1;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (samples[mid].length < target) low = mid + 1;
      else high = mid;
    }
    const end = samples[low];
    const start = samples[Math.max(0, low - 1)];
    const range = end.length - start.length;
    const blend = range > 0 ? (target - start.length) / range : 0;
    return [
      start.point[0] + (end.point[0] - start.point[0]) * blend,
      start.point[1] + (end.point[1] - start.point[1]) * blend
    ];
  };
}

// The first and final portions are gentle; the middle maintains an even speed.
const cruiseEase = progress => {
  const ramp = .19;
  const peak = 1 / (1 - ramp);
  if (progress < ramp) return peak * progress * progress / (2 * ramp);
  if (progress > 1 - ramp) {
    const remaining = 1 - progress;
    return 1 - peak * remaining * remaining / (2 * ramp);
  }
  return peak * (progress - ramp / 2);
};

export async function glideBezier(el, knots, { duration = 3.3, delay = 0, roll = 8, onMove } = {}) {
  if (reducedMotion.matches || !el || gliding.has(el)) return;
  gliding.add(el);
  const rect = el.getBoundingClientRect();
  const computed = getComputedStyle(el);
  const ghost = document.createElement('span');
  ghost.className = 'emoji-actor';
  const alignSpin = copyEmojiContent(el, ghost);
  ghost.setAttribute('aria-hidden', 'true');
  Object.assign(ghost.style, {
    left: `${rect.left}px`, top: `${rect.top}px`,
    width: `${rect.width}px`, height: `${rect.height}px`,
    fontSize: computed.fontSize, fontFamily: computed.fontFamily,
    fontWeight: computed.fontWeight, letterSpacing: computed.letterSpacing
  });
  const at = sampleSmoothPath(knots);
  const place = t => {
    const u = cruiseEase(t);
    const [x, y] = at(u);
    // Slight banking follows the turns but never snaps to a new angle.
    const rotation = roll * Math.sin(2 * Math.PI * u) * Math.sin(Math.PI * u);
    ghost.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg)`;
    onMove?.({ x: rect.left + x, y: rect.top + y, width: rect.width, height: rect.height, opacity: 1 });
  };
  document.body.append(ghost);
  alignSpin();
  place(0);
  el.style.visibility = 'hidden';
  try {
    const animation = animate(0, 1, {
      duration, delay, ease: 'linear', onUpdate: place
    });
    await animation.finished;
    place(1);
  } finally {
    ghost.remove();
    el.style.visibility = '';
    gliding.delete(el);
  }
}

// Shrinks the path to fit the emoji rows instead of flattening it at the edges.
export function travel(el, points, { duration, onMove } = {}) {
  const bounds = document.querySelector('.emoji-lines')?.getBoundingClientRect();
  if (!bounds || !el) return Promise.resolve();
  const r = el.getBoundingClientRect();
  const inset = 2;
  const fit = (room, reach) => (reach > Math.max(room, 0) ? Math.max(room, 0) / reach : 1);
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  const kx = Math.min(fit(bounds.right - inset - r.right, Math.max(...xs)), fit(r.left - bounds.left - inset, -Math.min(...xs)));
  const ky = Math.min(fit(bounds.bottom - inset - r.bottom, Math.max(...ys)), fit(r.top - bounds.top - inset, -Math.min(...ys)));
  const fitted = points.map(([x, y, rotate = 0, scale = 1]) => [x * kx, y * ky, rotate, scale, 1]);
  return glide(el, pathSampler(fitted), { duration, ease: easeInOut, onMove });
}

// Leaves forward to (dx, dy) while fading, then re-enters from (-dx, -dy), so it never reverses.
export function passThrough(el, { dx, dy, duration, onMove }) {
  const leave = pathSampler([[0, 0, 0, 1, 1], [dx * .55, dy * .55, 0, 1, 1], [dx, dy, 0, 1, 0]]);
  const enter = pathSampler([[-dx, -dy, 0, 1, 0], [-dx * .55, -dy * .55, 0, 1, 1], [0, 0, 0, 1, 1]]);
  const at = u => (u < .5 ? leave(u * 2) : enter(u * 2 - 1));
  return glide(el, at, { duration, ease: easeInOut, onMove });
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
