import { animate } from 'https://cdn.jsdelivr.net/npm/motion@14.11.1/+esm';
import { reducedMotion, rand, glideBezier } from './engine.js';

// A small, throttled snow trail. No layout reads on animation frames.
function emitSnow(x, y) {
  const dot = document.createElement('i');
  dot.className = 'snow-particle';
  const size = rand(3, 6);
  Object.assign(dot.style, {
    left: `${x + rand(-4, 4)}px`, top: `${y + rand(-3, 3)}px`,
    width: `${size}px`, height: `${size}px`
  });
  document.body.append(dot);
  animate(dot, {
    x: [0, rand(-16, -5)], y: [0, rand(-11, 17)],
    opacity: [.85, .65, 0], scale: [1, .75, .25]
  }, { duration: rand(.55, .9), ease: 'easeOut' }).finished
    .catch(() => {}).finally(() => dot.remove());
}

function snowTrail() {
  let last = 0;
  return ({ x, y, width, height }) => {
    const now = performance.now();
    if (now - last < 105) return;
    last = now;
    emitSnow(x + width * .24, y + height * .86);
  };
}

function viewportRect() {
  const v = window.visualViewport;
  return {
    left: v?.offsetLeft || 0, top: v?.offsetTop || 0,
    width: v?.width || window.innerWidth,
    height: v?.height || window.innerHeight
  };
}

// Each knot is measured relative to the final emoji slot so layout stays intact.
export async function entrance() {
  if (reducedMotion.matches || document.hidden) {
    document.documentElement.classList.remove('intro-pending');
    return;
  }
  const plane = document.querySelector('[data-action="fly"]');
  const board = document.querySelector('[data-action="ski"]');
  if (!plane || !board) {
    document.documentElement.classList.remove('intro-pending');
    return;
  }
  const view = viewportRect();
  const p = plane.getBoundingClientRect();
  const b = board.getBoundingClientRect();
  const X = fraction => view.left + view.width * fraction;
  const Y = fraction => view.top + view.height * fraction;
  const pointFor = (rect, x, y) => [x - rect.left, y - rect.top];

  const planeStart = [view.left + view.width + 8, view.top + view.height + 10];
  const boardStart = [view.left - b.width - 6, view.top + view.height + 10];

  const planeKnots = [
    pointFor(p, ...planeStart),
    pointFor(p, X(.29), Y(.59)),
    pointFor(p, X(.71), Y(.40)),
    [0, 0]
  ];
  const snowboardKnots = [
    pointFor(b, ...boardStart),
    pointFor(b, X(.17), Y(.76)),
    pointFor(b, X(.48), Y(.52)),
    pointFor(b, X(.29), Y(.38)),
    [0, 0]
  ];

  // Both stand-ins are created immediately, preventing an original emoji
  // from flashing in its final position before its entrance begins.
  try {
    const flight = glideBezier(plane, planeKnots, { duration: 4.2, roll: 13 });
    const ride = glideBezier(board, snowboardKnots, {
      duration: 3.75, delay: .28, roll: 9, onMove: snowTrail()
    });
    document.documentElement.classList.remove('intro-pending');
    await Promise.allSettled([flight, ride]);
  } finally {
    document.documentElement.classList.remove('intro-pending');
  }
}
