import { reducedMotion, glideBezier } from './engine.js';
import { snowTrail, cloudTrail } from './trails.js';

// A small, throttled snow trail. No layout reads on animation frames.
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
    const flight = glideBezier(plane, planeKnots, { duration: 4.2, roll: 13, onMove: cloudTrail() });
    const ride = glideBezier(board, snowboardKnots, {
      duration: 3.75, delay: .28, roll: 9, onMove: snowTrail()
    });
    document.documentElement.classList.remove('intro-pending');
    await Promise.allSettled([flight, ride]);
  } finally {
    document.documentElement.classList.remove('intro-pending');
  }
}
