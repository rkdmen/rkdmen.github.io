import { play, travel, passThrough, choose, particles } from './engine.js';
import { matrixRain } from './matrix.js';
import { decodeHeadline } from './decode.js';
import { launchRocket } from './rocket.js';
import { checkmate } from './gravity.js';
import {
  snowTrail, cloudTrail, exhaustTrail, coffeeSteam, champagneBubbles, antTrail, bloodDrops,
  crumbs, notifyBadge, speechBubble, footsteps, floatUp, fireworks
} from './trails.js';

const shake = el => play(el, { rotate: [0, -17, 15, -14, 0] }, { duration: .48 });
// Blurred for about 1.5s between the fades.
const blurSelf = el => el.animate([
  { filter: 'blur(0)', easing: 'ease-out' },
  { filter: 'blur(6px)', offset: .1 },
  { filter: 'blur(6px)', offset: .9, easing: 'ease-in' },
  { filter: 'blur(0)' }
], { duration: 1900 }).finished;
// Puts a class on <html> for a while; the look for each mode lives in CSS.
const pageMode = (name, ms) => {
  const root = document.documentElement;
  root.classList.add(name);
  return new Promise(resolve => setTimeout(resolve, ms)).then(() => root.classList.remove(name));
};
const typing = el => play(el, { y: [0,-7,0,-5,0], rotate: [0,2,-2,0] }, { duration: .55 });
const earthBob = el => play(el, { y: [0,-5,0], scale: [1,1.13,1] }, { duration: 1.2 });
const bump = el => play(el, { y: [0, -17, 0, -7, 0], scale: [1, 1.18, 1, 1.08, 1] }, { duration: .55 });
const sparkleBump = el => { particles(el); return bump(el); };
const buzzShake = el => play(el, { x: [0,-5,5,-4,4,0], rotate: [0,-9,9,0] }, { duration: .42 });
const waveHand = el => play(el, { rotate: [0,24,-18,25,-14,0] }, { duration: .66 });
const moonBob = el => play(el, { y: [0,-5,0], scale: [1,1.1,1] }, { duration: .75 });
const rockOn = el => play(el, { rotate: [0, -24, 22, -16, 0], scale: [1, 1.22, 1] }, { duration: .6 });

const PHASES = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌑'];
// Steps the inner glyph through the lunar cycle; its spin pauses so the lit side reads correctly.
function moonPhases(el) {
  const core = el.querySelector('.spin-core');
  if (!core) return Promise.resolve();
  core.style.animation = 'none';
  return new Promise(resolve => {
    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      core.textContent = PHASES[index];
      if (index === PHASES.length - 1) {
        clearInterval(timer);
        core.style.animation = '';
        resolve();
      }
    }, 140);
  });
}

// Pan jerks, the egg flips high, lands and squashes.
const panToss = el => play(el, {
  y: [0, 5, -54, 0, 3, 0],
  rotate: [0, -14, 180, 360, 360, 360],
  scaleY: [1, .92, 1.04, 1, .86, 1]
}, { duration: 1.1, times: [0, .12, .45, .76, .86, 1] });

const BITES = ['0em', '.3em', '.48em', '.66em'];
// Each tap bites more off the top-right corner; the tap after the last bite brings a fresh bar.
function bite(el) {
  const next = (Number(el.dataset.bites ?? 0) + 1) % BITES.length;
  el.dataset.bites = String(next);
  el.style.setProperty('--bite', BITES[next]);
  el.classList.toggle('is-bitten', next > 0);
  if (next === 0) {
    return sparkleBump(el);
  }
  crumbs(el, 6);
  return play(el, { rotate: [0, -7, 5, 0], scale: [1, .94, 1] }, { duration: .35 });
}

// Two random emojis trade places over arcs, pause, and come back along the other side.
function swapPair(emojis) {
  const pool = emojis.filter(e => e.dataset.action !== 'shuffle' && getComputedStyle(e).visibility !== 'hidden');
  const a = choose(pool);
  const b = choose(pool.filter(e => e !== a));
  if (!a || !b) return Promise.resolve();
  const ra = a.getBoundingClientRect();
  const rb = b.getBoundingClientRect();
  const dx = rb.left + rb.width / 2 - (ra.left + ra.width / 2);
  const dy = rb.top + rb.height / 2 - (ra.top + ra.height / 2);
  const lift = 26;
  const arc = (x, y, side) => [[0, 0], [x / 2, y / 2 - lift * side], [x, y], [x / 2, y / 2 + lift * side], [0, 0]];
  return Promise.all([
    travel(a, arc(dx, dy, 1), { duration: 2 }),
    travel(b, arc(-dx, -dy, -1), { duration: 2 })
  ]);
}

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
  rock: (el, ctx) => {
    floatUp(el, ['🎸', '🎵', '🎶'], ctx.clicked ? 6 : 2);
    return rockOn(el);
  },
  devil: (el) => { particles(el, ['😈','🔥'], 3); return play(el, { scale: [1, 1.25, 1], rotate: [0, -15, 15, 0] }, { duration: .6 }); },
  look: el => play(el, { x: [0, 12, -9, 0], rotate: [0, 10, -10, 0] }, { duration: .6 }),
  no: el => { particles(el, ['🔥'], 3); return shake(el); },
  censor: (el, ctx) => (ctx.clicked ? pageMode('censoring', 1500) : blurSelf(el)),
  cheers: (el, ctx) => toast(ctx.drinks, el),
  wine: (el, ctx) => toast(ctx.drinks, el),
  sway: (el, ctx) => toast(ctx.drinks, el),
  pop: sparkleBump,
  bleed: (el, ctx) => { bloodDrops(el, ctx.clicked ? 22 : 3); return play(el, { y: [0, -4, 0], scale: [1, 1.1, 1] }, { duration: .5 }); },
  flag: el => play(el, { rotate: [0, -10, 7, -4, 0], y: [0, -5, 0] }, { duration: .8 }),
  steam: el => { coffeeSteam(el, 3); return play(el, { y: [0,-9,-3,0], scale: [1,1.12,1] }, { duration: .65 }); },
  champagne: el => { champagneBubbles(el, 6); particles(el, ['✨','🥂'], 2); return play(el, { y: [0,-12,0], rotate: [0,-17,15,0], scale: [1,1.15,1] }, { duration: .8 }); },
  // Conveyor belt: rides off to the right and comes back round from the left.
  sushi: el => passThrough(el, { dx: 46, dy: 0, duration: 1.3 }),
  sizzle: el => { particles(el, ['♨️','✨'], 3); return play(el, { scale: [1,1.08,1], y: [0,-4,0] }, { duration: .72 }); },
  egg: panToss,
  croissant: (el, ctx) => {
    crumbs(el, ctx.clicked ? 12 : 4);
    return play(el, { y: [0,-8,0], rotate: [0,-28,24,0] }, { duration: .8 });
  },
  stomp: (el, ctx) => {
    if (ctx.clicked) footsteps(el, 4);
    return play(el, { y: [0, -12, 3, 0], scaleY: [1, 1.08, .85, 1] }, { duration: .5 });
  },
  bite: (el, ctx) => (ctx.clicked ? bite(el) : bump(el)),
  liberty: (el, ctx) => { fireworks(el, ctx.clicked ? 4 : 1); return bump(el); },
  checkmate: (el, ctx) => (ctx.clicked
    ? ctx.takeover(() => checkmate([...document.querySelectorAll('.emoji-line > *')]))
    : sparkleBump(el)),
  code: (el, ctx) => (ctx.clicked ? Promise.all([decodeHeadline(document.querySelector('.headline')), typing(el)]) : typing(el)),
  matrix: (el, ctx) => (ctx.clicked ? Promise.all([matrixRain(), typing(el)]) : typing(el)),
  buzz: (el, ctx) => (ctx.clicked ? Promise.all([notifyBadge(el), buzzShake(el)]) : buzzShake(el)),
  drive: (el, ctx) => passThrough(el, { dx: -48, dy: 0, duration: ctx.clicked ? 1.5 : 1.25, onMove: exhaustTrail() }),
  // The bull faces left, so it charges left.
  charge: el => passThrough(el, { dx: -50, dy: 0, duration: 1.1 }),
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
  spin: (el, ctx) => (ctx.clicked ? Promise.all([moonPhases(el), moonBob(el)]) : moonBob(el)),
  kick: (_el, ctx) => golfShot(ctx),
  golf: (el, ctx) => {
    if (ctx.clicked) pageMode('on-green', 2200);
    return el.getAttribute('aria-label') === 'Golfer' ? golfShot(ctx) : play(el, { rotate: [0, -16, 16, 0] }, { duration: .6 });
  },
  ski: (el, ctx) => passThrough(el, { dx: 44, dy: 10, duration: ctx.clicked ? 1.6 : 1.35, onMove: snowTrail() }),
  shuffle: (el, ctx) => Promise.all([swapPair(ctx.emojis), play(el, { rotate: [0,180,360] }, { duration: .62 })]),
  wave: (el, ctx) => (ctx.clicked
    ? Promise.all([speechBubble(el, document.querySelector('.greeting')?.textContent ?? 'Hi'), waveHand(el)])
    : waveHand(el)),
  heart: el => play(el, { scale: [1,1.28,.96,1.34,.96,1.12,1], y: [0,-7,0,-10,0,-3,0] }, { duration: .82 }),
  fly: (el, ctx) => travel(el, loop(ctx.clicked ? 34 : 24), { duration: ctx.clicked ? 1.7 : 1.4, onMove: cloudTrail() }),
  earth: (el, ctx) => (ctx.clicked ? Promise.all([launchRocket(el), earthBob(el)]) : earthBob(el))
};
