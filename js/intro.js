import { animate } from 'https://cdn.jsdelivr.net/npm/motion@14.11.1/+esm';
import { reducedMotion, rand, glide, easeOut } from './engine.js';

function emitSnow(x, y) {
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

function viewRect() {
  const v = window.visualViewport;
  const left = v?.offsetLeft || 0;
  const top = v?.offsetTop || 0;
  return {
    left, top,
    width: v?.width || window.innerWidth,
    height: v?.height || window.innerHeight
  };
}

// All coordinates are derived from the destination. The final [0,0] always
// places the original emoji back in its exact inline slot.
export async function entrance() {
  if (reducedMotion.matches || document.hidden) return;
  const plane = document.querySelector('[data-action="fly"]');
  const board = document.querySelector('[data-action="ski"]');
  if (!plane || !board) return;
  const v = viewRect();
  const p = plane.getBoundingClientRect();
  const b = board.getBoundingClientRect();
  const x = fraction => v.left + v.width * fraction;
  const y = fraction => v.top + v.height * fraction;
  const planeTo = (absoluteX, absoluteY, angle) => [absoluteX - p.left, absoluteY - p.top, angle];
  const boardTo = (absoluteX, absoluteY, angle) => [absoluteX - b.left, absoluteY - b.top, angle];

  // Enters from the bottom right, sweeps left, then right, making an S before landing.
  const flight = glide(plane, [
    planeTo(v.left + v.width + p.width, v.top + v.height + p.height, -30),
    planeTo(x(.78), y(.76), -28),
    planeTo(x(.20), y(.55), 16),
    planeTo(x(.73), y(.33), -20),
    planeTo(p.left - Math.min(45, v.width * .12), p.top - 28, 14),
    [0, 0, 0]
  ], { duration: 2.2, ease: easeOut });

  await new Promise(resolve => setTimeout(resolve, 260));
  // Rides in from the bottom left, carving across the page with snow dust.
  const ride = glide(board, [
    boardTo(v.left - b.width - 15, v.top + v.height + 18, -24),
    boardTo(x(.14), y(.78), -20),
    boardTo(x(.46), y(.60), 14),
    boardTo(x(.25), y(.42), -13),
    boardTo(b.left - 24, b.top + 24, 9),
    [0, 0, 0]
  ], { duration: 1.95, ease: easeOut, onMove: snowTrail() });

  await Promise.allSettled([flight, ride]);
}
