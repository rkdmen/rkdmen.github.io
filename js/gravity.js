import { animate } from 'https://cdn.jsdelivr.net/npm/motion@14.11.1/+esm';
import { reducedMotion, makeStandIn } from './engine.js';

const MATTER_URL = 'https://cdn.jsdelivr.net/npm/matter-js@0.20.0/+esm';
const PLAY_MS = 7000;
const WALL = 200;
let matter;

// Fetched on first use so visitors who never tap ♔ never download it.
async function loadMatter() {
  matter ??= (await import(MATTER_URL)).default;
  return matter;
}

const onScreen = el => el.isConnected
  && getComputedStyle(el).visibility !== 'hidden'
  && el.getBoundingClientRect().width > 0;

// Everything in the rows topples into a pile that can be dragged and flicked, then flies home.
export async function checkmate(items) {
  if (reducedMotion.matches || document.hidden) return;
  const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint } = await loadMatter();
  const width = innerWidth;
  const height = innerHeight;
  const engine = Engine.create({ gravity: { y: 1.1 } });
  const walls = [
    Bodies.rectangle(width / 2, height + WALL / 2, width + WALL * 2, WALL, { isStatic: true }),
    Bodies.rectangle(-WALL / 2, height / 2, WALL, height * 3, { isStatic: true }),
    Bodies.rectangle(width + WALL / 2, height / 2, WALL, height * 3, { isStatic: true })
  ];
  const actors = items.filter(onScreen).map(el => {
    const { ghost, rect } = makeStandIn(el);
    el.style.visibility = 'hidden';
    const home = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const body = Bodies.rectangle(home.x, home.y, rect.width, rect.height * .8, {
      chamfer: { radius: Math.min(rect.width, rect.height) * .3 },
      restitution: .45,
      friction: .2,
      frictionAir: .01
    });
    Body.setVelocity(body, { x: (Math.random() - .5) * 6, y: -Math.random() * 6 });
    Body.setAngularVelocity(body, (Math.random() - .5) * .3);
    return { el, ghost, body, home };
  });
  const overlay = document.createElement('div');
  overlay.className = 'physics-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  document.body.append(overlay);
  const grab = MouseConstraint.create(engine, {
    mouse: Mouse.create(overlay),
    constraint: { stiffness: .2, render: { visible: false } }
  });
  Composite.add(engine.world, [...walls, ...actors.map(actor => actor.body), grab]);

  const sync = () => actors.forEach(({ ghost, body, home }) => {
    ghost.style.transform = `translate3d(${body.position.x - home.x}px, ${body.position.y - home.y}px, 0) rotate(${body.angle}rad)`;
  });
  let last = performance.now();
  let frame = 0;
  const tick = now => {
    Engine.update(engine, Math.min(now - last, 33));
    last = now;
    sync();
    frame = requestAnimationFrame(tick);
  };

  try {
    frame = requestAnimationFrame(tick);
    await new Promise(resolve => setTimeout(resolve, PLAY_MS));
    cancelAnimationFrame(frame);
    overlay.remove();
    await Promise.all(actors.map(({ ghost, body, home }, i) => {
      const degrees = body.angle * 180 / Math.PI;
      ghost.style.transform = '';
      return animate(ghost, {
        x: [body.position.x - home.x, 0],
        y: [body.position.y - home.y, 0],
        // Unwind to the nearest full turn, so no emoji spins more than half a turn on the way home.
        rotate: [degrees, Math.round(degrees / 360) * 360]
      }, { duration: .9, delay: i * .02, ease: 'easeInOut' }).finished;
    }));
  } finally {
    cancelAnimationFrame(frame);
    overlay.remove();
    Engine.clear(engine);
    actors.forEach(({ el, ghost }) => {
      ghost.remove();
      el.style.visibility = '';
    });
  }
}
