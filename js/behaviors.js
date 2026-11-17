import { play, travel, rand, choose, particles } from './engine.js';

const bump = el => play(el, { y: [0, -17, 0, -7, 0], scale: [1, 1.18, 1, 1.08, 1] }, { duration: .55 });
const tilt = el => play(el, { rotate: [0, -18, 15, -8, 0], y: [0, -7, 0] }, { duration: .62 });
// Loop-the-loop that starts and ends at rest position.
const loop = radius => Array.from({ length: 9 }, (_, i) => {
  const angle = i * Math.PI / 4;
  return [radius * Math.sin(angle), -radius * (1 - Math.cos(angle)), -45 * i];
});

// Drink group owns shared interactions. Can be called by any glass or by idle scheduler.
export function toast(drinks) {
  const picked = drinks.length >= 2 ? [...drinks].sort(() => Math.random() - .5).slice(0, 2) : drinks;
  picked.forEach((el, i) => {
    const direction = i ? -1 : 1;
    play(el, { x: [0, 11 * direction, 11 * direction, 0], y: [0, -12, -14, 0], rotate: [0, 17 * direction, -8 * direction, 0] }, { duration: .68 });
  });
  if (picked.length > 1) particles(picked[0], ['✨', '🥂'], 3);
}

// Same entries handle both idle activity and taps; taps are deliberately bigger.
export const behaviors = {
  rock: (el, ctx) => play(el, { rotate: [0, -24, 22, -16, 0], scale: [1, 1.22, 1] }, { duration: .6 }),
  devil: (el) => { particles(el, ['😈','🔥'], 3); return play(el, { scale: [1, 1.25, 1], rotate: [0, -15, 15, 0] }, { duration: .6 }); },
  look: el => play(el, { x: [0, 12, -9, 0], rotate: [0, 10, -10, 0] }, { duration: .6 }),
  no: el => play(el, { rotate: [0, -17, 15, -14, 0] }, { duration: .48 }),
  cheers: (el, ctx) => toast(ctx.drinks),
  wine: (el, ctx) => toast(ctx.drinks),
  sway: (el, ctx) => toast(ctx.drinks),
  pop: el => { particles(el); return bump(el); },
  steam: el => { particles(el, ['☁️','♨️'], 3); return play(el, { y: [0,-9,-3,0], scale: [1,1.12,1] }, { duration: .65 }); },
  bounce: bump,
  code: el => play(el, { y: [0,-7,0,-5,0], rotate: [0,2,-2,0] }, { duration: .55 }),
  buzz: el => play(el, { x: [0,-5,5,-4,4,0], rotate: [0,-9,9,0] }, { duration: .42 }),
  drive: (el, ctx) => travel(el, [[0,0],[65,-1],[0,0]], { duration: ctx.clicked ? 1.4 : 1.1 }),
  charge: el => travel(el, [[0,0],[-13,0],[55,0],[0,0]], { duration: 1.1 }),
  crawl: el => travel(el, [[0,0],[14,-2,-4],[28,0,6],[0,0]], { duration: 1.3 }),
  grow: el => play(el, { y: [0,-23,0], scale: [1,1.28,1] }, { duration: .62 }),
  spin: el => play(el, { rotate: [0,360] }, { duration: .82 }),
  kick: (el, ctx) => travel(el, [[0,0,0],[14,-20,90],[32,-31,180],[49,-9,350],[64,0,480],[78,-14,570],[0,0,720]], { duration: ctx.clicked ? 1.6 : 1.3 }),
  golf: el => { particles(el, ['⛳','🏌️','✨'], 3); return play(el, { rotate: [0,-23,22,0], y: [0,-11,0] }, { duration: .7 }); },
  ski: (el, ctx) => travel(el, [[0,0,0],[20,-14,-12],[44,-22,-4],[66,-8,10],[84,4,4],[0,0,0]], { duration: ctx.clicked ? 1.8 : 1.5 }),
  shuffle: (el, ctx) => { ctx.trigger(choose(ctx.emojis)); return play(el, { rotate: [0,180,360] }, { duration: .62 }); },
  wave: el => play(el, { rotate: [0,24,-18,25,-14,0] }, { duration: .66 }),
  heart: el => play(el, { scale: [1,1.35,1,1.26,1] }, { duration: .58 }),
  fly: (el, ctx) => travel(el, loop(ctx.clicked ? 34 : 24), { duration: ctx.clicked ? 1.7 : 1.4 }),
  earth: el => play(el, { rotate: [0,360], scale: [1,1.13,1] }, { duration: 1.2 })
};
