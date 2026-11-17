import { animate } from 'https://cdn.jsdelivr.net/npm/motion@14.11.1/+esm';
import { reducedMotion, rand, glide, easeOut } from './engine.js';

function emitSnow(x, y) {
  // Tiny DOM particles are cheaper and simpler here than a D3 simulation.
  for (let i = 0; i < 2; i++) {
    const dot = document.createElement('i');
    dot.className = 'snow-particle';
    const size = rand(3, 7);
    Object.assign(dot.style, {
      left: `${x + rand(-7, 7)}px`, top: `${y + rand(-5, 5)}px`,
      width: `${size}px`, height: `${size}px`
    });
    document.body.append(dot);
    animate(dot, {
      x: [0, rand(-31, -6)],
      y: [0, rand(-19, 28)],
      opacity: [.95, .85, 0],
      scale: [1, .8, .2]
    }, { duration: rand(.42, .72), ease: 'easeOut' }).finished
      .catch(() => {}).finally(() => dot.remove());
  }
}

function snowTrail() {
  let last = 0;
  return actor => {
    const now = performance.now();
    if (now - last < 65) return;
    last = now;
    const at = actor.getBoundingClientRect();
    emitSnow(at.left + at.width * .25, at.bottom - 3);
  };
}

// One-time arrivals: each emoji glides in from off screen and settles into its slot.
export async function entrance() {
  if (reducedMotion.matches || document.hidden) return;
  const plane = document.querySelector('[data-action="fly"]');
  const board = document.querySelector('[data-action="ski"]');
  const p = plane.getBoundingClientRect();
  const b = board.getBoundingClientRect();
  const px = Math.max(120, window.innerWidth - p.left + 45);
  const py = -Math.min(95, window.innerHeight * .16);
  const bx = -Math.max(140, b.left + b.width + 35);
  const by = -42;
  const flight = glide(plane, [[px, py, -24], [px * .4, py * .55, -10], [0, 0, 0]],
    { duration: 1.4, ease: easeOut, onMove: undefined });
  await new Promise(resolve => setTimeout(resolve, 280));
  const ride = glide(board, [[bx, by, -20], [bx * .62, by * .8, 10], [bx * .28, by * .35, -8], [0, 0, 0]],
    { duration: 1.5, ease: easeOut, onMove: snowTrail() });
  await Promise.allSettled([flight, ride]);
}
