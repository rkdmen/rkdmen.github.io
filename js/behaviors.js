import { play, travel, passThrough, choose, particles } from './engine.js';
import { snowTrail, cloudTrail, exhaustTrail, coffeeSteam, champagneBubbles, antTrail } from './trails.js';

const shake = el => play(el, { rotate: [0, -17, 15, -14, 0] }, { duration: .48 });
// Blurred for about 1.5s between the fades.
const blurSelf = el => el.animate([
  { filter: 'blur(0)', easing: 'ease-out' },
  { filter: 'blur(6px)', offset: .1 },
  { filter: 'blur(6px)', offset: .9, easing: 'ease-in' },
  { filter: 'blur(0)' }
], { duration: 1900 }).finished;
// Everything except the tapped 🔞 goes out of focus; the blur itself is in CSS.
const blurOthers = () => {
  const root = document.documentElement;
  root.classList.add('censoring');
  return new Promise(resolve => setTimeout(resolve, 1500)).then(() => root.classList.remove('censoring'));
};
const bump = el => play(el, { y: [0, -17, 0, -7, 0], scale: [1, 1.18, 1, 1.08, 1] }, { duration: .55 });
const tilt = el => play(el, { rotate: [0, -18, 15, -8, 0], y: [0, -7, 0] }, { duration: .62 });
// Loop-the-loop that starts and ends at rest position.
const loop = radius => Array.from({ length: 9 }, (_, i) => {
  const angle = i * Math.PI / 4;
  return [radius * Math.sin(angle), -radius * (1 - Math.cos(angle)), -45 * i];
});

// A coordinated scene. The golfer grows, swings, and sends the nearby ball flying.
export async function golfShot(ctx) {
  const ball = ctx.emojis.find(el => el.dataset.action === 'kick');
  const golfer = ctx.emojis.find(el => el.getAttribute('aria-label') === 'Golfer');
  if (!ball || !golfer) return;
  const swing = play(golfer, {
    scale: [1, 1.20, 1.48, 1.52, 1.24, 1],
    rotate: [0, -12, -29, 27, -8, 0],
    y: [0, -3, -10, -8, 0, 0]
  }, { duration: 1.18 });
  await new Promise(resolve => setTimeout(resolve, 340));
  const ballFlight = travel(ball, [
    [0, 0, 0], [-15, -19, -75], [-48, -53, -205],
    [-94, -28, -380], [-55, 0, -540], [0, 0, -720]
  ], { duration: 1.18 });
  return Promise.all([swing, ballFlight]);
}

// Toast only the closest neighbor, using actual emoji coordinates.
export function toast(drinks, anchor = choose(drinks)) {
  if (!anchor || drinks.length < 2) return Promise.resolve();
  const center = el => { const r = el.getBoundingClientRect(); return r.left + r.width / 2; };
  const partner = drinks.filter(el => el !== anchor)
    .sort((a, b) => Math.abs(center(a) - center(anchor)) - Math.abs(center(b) - center(anchor)))[0];
  const a = anchor.getBoundingClientRect();
  const b = partner.getBoundingClientRect();
  const dx = center(partner) - center(anchor);
  const direction = Math.sign(dx) || 1;
  const movement = Math.max(3, (Math.abs(dx) - (a.width + b.width) * .5) / 2 + 3);
  const first = play(anchor, {
    x: [0, direction * movement, direction * movement, 0],
    y: [0, -10, -12, 0], rotate: [0, direction * 15, -direction * 7, 0]
  }, { duration: .68 });
  const second = play(partner, {
    x: [0, -direction * movement, -direction * movement, 0],
    y: [0, -10, -12, 0], rotate: [0, -direction * 15, direction * 7, 0]
  }, { duration: .68 });
  particles(anchor, ['✨', '🥂'], 3);
  return Promise.all([first, second]);
}

// Same entries handle both idle activity and taps; taps are deliberately bigger.
export const behaviors = {
  rock: (el, ctx) => play(el, { rotate: [0, -24, 22, -16, 0], scale: [1, 1.22, 1] }, { duration: .6 }),
  devil: (el) => { particles(el, ['😈','🔥'], 3); return play(el, { scale: [1, 1.25, 1], rotate: [0, -15, 15, 0] }, { duration: .6 }); },
  look: el => play(el, { x: [0, 12, -9, 0], rotate: [0, 10, -10, 0] }, { duration: .6 }),
  no: shake,
  censor: (el, ctx) => (ctx.clicked ? blurOthers() : blurSelf(el)),
  cheers: (el, ctx) => toast(ctx.drinks, el),
  wine: (el, ctx) => toast(ctx.drinks, el),
  sway: (el, ctx) => toast(ctx.drinks, el),
  pop: el => { particles(el); return bump(el); },
  steam: el => { coffeeSteam(el, 3); return play(el, { y: [0,-9,-3,0], scale: [1,1.12,1] }, { duration: .65 }); },
  champagne: el => { champagneBubbles(el, 6); particles(el, ['✨','🥂'], 2); return play(el, { y: [0,-12,0], rotate: [0,-17,15,0], scale: [1,1.15,1] }, { duration: .8 }); },
  sushi: el => play(el, { x: [0,-3,5,-3,0], rotate: [0,-11,13,-8,0], y: [0,-6,0] }, { duration: .8 }),
  sizzle: el => { particles(el, ['♨️','✨'], 3); return play(el, { scale: [1,1.08,1], y: [0,-4,0] }, { duration: .72 }); },
  egg: el => play(el, { y: [0,-15,-18,0], rotate: [0,-20,175,360] }, { duration: 1.0 }),
  croissant: el => play(el, { y: [0,-8,0], rotate: [0,-28,24,0] }, { duration: .8 }),
  bounce: bump,
  code: el => play(el, { y: [0,-7,0,-5,0], rotate: [0,2,-2,0] }, { duration: .55 }),
  buzz: el => play(el, { x: [0,-5,5,-4,4,0], rotate: [0,-9,9,0] }, { duration: .42 }),
  drive: (el, ctx) => passThrough(el, { dx: -48, dy: 0, duration: ctx.clicked ? 1.5 : 1.25, onMove: exhaustTrail() }),
  charge: el => travel(el, [[0,0],[-13,0],[55,0],[0,0]], { duration: 1.1 }),
  crawl: (el, ctx) => {
    if (ctx.clicked) particles(el, ['🍪','✦'], 3);
    return travel(el, [[0,0],[9,-7,-12],[28,6,10],[47,-9,-5],[30,2,12],[0,0,0]], {
      duration: ctx.clicked ? 2.0 : 1.5, onMove: antTrail()
    });
  },
  grow: (el, ctx) => {
    // Decorative market pulse, no data or price signal.
    particles(el, ctx.clicked ? ['↗','✦','↘','✨'] : ['↗','✦'], ctx.clicked ? 6 : 3);
    return play(el, {
      y: [0,-9,5,-23,-12,0],
      x: [0,3,-2,5,0,0],
      rotate: [0,-7,5,-8,3,0],
      scale: [1,1.1,.92,1.32,1.13,1]
    }, { duration: ctx.clicked ? 1.18 : .88 });
  },
  coin: (el, ctx) => {
    if (ctx.clicked) particles(el, ['✨','✦','💰'], 6);
    return play(el, {
      rotateY: [0,90,180,270,360,540,720],
      y: [0,-12,-22,-29,-18,-7,0],
      scale: [1,1.1,1.22,1.33,1.2,1.1,1]
    }, { duration: ctx.clicked ? 1.25 : .95, ease: 'easeOut' });
  },
  spin: el => play(el, { y: [0,-5,0], scale: [1,1.1,1] }, { duration: .75 }),
  kick: (_el, ctx) => golfShot(ctx),
  golf: (el, ctx) => el.getAttribute('aria-label') === 'Golfer' ? golfShot(ctx) : play(el, { rotate: [0, -16, 16, 0] }, { duration: .6 }),
  ski: (el, ctx) => passThrough(el, { dx: 44, dy: 10, duration: ctx.clicked ? 1.6 : 1.35, onMove: snowTrail() }),
  shuffle: (el, ctx) => { ctx.trigger(choose(ctx.emojis)); return play(el, { rotate: [0,180,360] }, { duration: .62 }); },
  wave: el => play(el, { rotate: [0,24,-18,25,-14,0] }, { duration: .66 }),
  heart: el => play(el, { scale: [1,1.28,.96,1.34,.96,1.12,1], y: [0,-7,0,-10,0,-3,0] }, { duration: .82 }),
  fly: (el, ctx) => travel(el, loop(ctx.clicked ? 34 : 24), { duration: ctx.clicked ? 1.7 : 1.4, onMove: cloudTrail() }),
  earth: el => play(el, { y: [0,-5,0], scale: [1,1.13,1] }, { duration: 1.2 })
};
