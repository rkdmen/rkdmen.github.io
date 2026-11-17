import { play, travel, choose, particles } from './engine.js';
import { cloudTrail } from './intro.js';
import { animate } from 'https://cdn.jsdelivr.net/npm/motion@14.11.1/+esm';

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

// Tiny rainbow burst. Nodes are fixed, short-lived, and don't change layout.
function confetti(title) {
  const rect = title.getBoundingClientRect();
  const colors = ['#ef7eb3','#ffbe5a','#8ed7ae','#81b3f7','#b99bfa'];
  const icons = ['✨','🍣','🍷','⚽','❤️','✦'];
  const animations = [];
  const count = 25;
  for (let i = 0; i < count; i++) {
    const bit = document.createElement('span');
    bit.className = 'party-particle';
    const icon = i % 5 === 0;
    if (icon) {
      bit.textContent = icons[Math.floor(i / 5) % icons.length];
      bit.style.fontSize = '15px';
    } else {
      const size = 5 + Math.random() * 5;
      bit.style.width = `${size}px`;
      bit.style.height = `${size * .65}px`;
      bit.style.borderRadius = i % 3 ? '1px' : '50%';
      bit.style.background = colors[i % colors.length];
    }
    bit.style.left = `${rect.left + rect.width * (.15 + Math.random() * .7)}px`;
    bit.style.top = `${rect.top + rect.height * .52}px`;
    document.body.append(bit);
    const angle = i * Math.PI * 2 / count + (Math.random() - .5) * .55;
    const radius = 55 + Math.random() * Math.min(135, window.innerWidth * .27);
    const dx = Math.cos(angle) * radius;
    const dy = Math.sin(angle) * radius;
    const spin = (Math.random() > .5 ? 1 : -1) * (210 + Math.random() * 360);
    const animation = animate(bit, {
      x: [0, dx * .55, dx],
      y: [0, dy * .55 - 22, dy + 34],
      rotate: [0, spin * .45, spin],
      opacity: [0, 1, 1, 0],
      scale: [.3, 1, .55]
    }, { duration: 1.05 + Math.random() * .45, ease: 'easeOut' });
    animations.push(animation.finished.catch(() => {}).finally(() => bit.remove()));
  }
  return Promise.allSettled(animations);
}

// A short, exuberant emoji cascade; the page returns to normal afterward.
export async function surprise(title, emojis) {
  title.classList.add('is-celebrating');
  try {
    const titlePop = play(title, {
      scale: [1,.94,1.11,.98,1.04,1],
      rotate: [0,-2.5,2.5,-1,0]
    }, { duration: .98, ease: 'easeOut' });
    const burst = confetti(title);
    const wave = emojis.map((el, index) =>
      new Promise(resolve => setTimeout(resolve, index * 30)).then(() =>
        play(el, {
          y: [0,-12 - (index % 3) * 5,0],
          scale: [1,1.13 + (index % 4) * .055,1],
          rotate: [0,index % 2 ? -9 : 9,0]
        }, { duration: .5, ease: 'easeOut' })
      )
    );
    await Promise.allSettled([titlePop, burst, ...wave]);
  } finally {
    title.classList.remove('is-celebrating');
  }
}

// Same entries handle both idle activity and taps; taps are deliberately bigger.
export const behaviors = {
  rock: (el, ctx) => play(el, { rotate: [0, -24, 22, -16, 0], scale: [1, 1.22, 1] }, { duration: .6 }),
  devil: (el) => { particles(el, ['😈','🔥'], 3); return play(el, { scale: [1, 1.25, 1], rotate: [0, -15, 15, 0] }, { duration: .6 }); },
  look: el => play(el, { x: [0, 12, -9, 0], rotate: [0, 10, -10, 0] }, { duration: .6 }),
  no: el => play(el, { rotate: [0, -17, 15, -14, 0] }, { duration: .48 }),
  cheers: (el, ctx) => toast(ctx.drinks, el),
  wine: (el, ctx) => toast(ctx.drinks, el),
  sway: (el, ctx) => toast(ctx.drinks, el),
  pop: el => { particles(el); return bump(el); },
  steam: el => { particles(el, ['☁️','♨️'], 3); return play(el, { y: [0,-9,-3,0], scale: [1,1.12,1] }, { duration: .65 }); },
  champagne: el => { particles(el, ['🫧','✨','🥂'], 5); return play(el, { y: [0,-12,0], rotate: [0,-17,15,0], scale: [1,1.15,1] }, { duration: .8 }); },
  sushi: el => play(el, { x: [0,-3,5,-3,0], rotate: [0,-11,13,-8,0], y: [0,-6,0] }, { duration: .8 }),
  sizzle: el => { particles(el, ['♨️','✨'], 3); return play(el, { scale: [1,1.08,1], y: [0,-4,0] }, { duration: .72 }); },
  egg: el => play(el, { y: [0,-15,-18,0], rotate: [0,-20,175,360] }, { duration: 1.0 }),
  croissant: el => play(el, { y: [0,-8,0], rotate: [0,-28,24,0] }, { duration: .8 }),
  bounce: bump,
  code: el => play(el, { y: [0,-7,0,-5,0], rotate: [0,2,-2,0] }, { duration: .55 }),
  buzz: el => play(el, { x: [0,-5,5,-4,4,0], rotate: [0,-9,9,0] }, { duration: .42 }),
  drive: (el, ctx) => travel(el, [[0,0],[65,-1],[0,0]], { duration: ctx.clicked ? 1.4 : 1.1 }),
  charge: el => travel(el, [[0,0],[-13,0],[55,0],[0,0]], { duration: 1.1 }),
  crawl: el => travel(el, [[0,0],[14,-2,-4],[28,0,6],[0,0]], { duration: 1.3 }),
  grow: el => play(el, { y: [0,-23,0], scale: [1,1.28,1] }, { duration: .62 }),
  spin: el => play(el, { y: [0,-5,0], scale: [1,1.1,1] }, { duration: .75 }),
  kick: (_el, ctx) => golfShot(ctx),
  golf: (el, ctx) => el.getAttribute('aria-label') === 'Golfer' ? golfShot(ctx) : play(el, { rotate: [0, -16, 16, 0] }, { duration: .6 }),
  ski: (el, ctx) => travel(el, [[0,0,0],[20,-14,-12],[44,-22,-4],[66,-8,10],[84,4,4],[0,0,0]], { duration: ctx.clicked ? 1.8 : 1.5 }),
  shuffle: (el, ctx) => { ctx.trigger(choose(ctx.emojis)); return play(el, { rotate: [0,180,360] }, { duration: .62 }); },
  wave: el => play(el, { rotate: [0,24,-18,25,-14,0] }, { duration: .66 }),
  heart: el => play(el, { scale: [1,1.28,.96,1.34,.96,1.12,1], y: [0,-7,0,-10,0,-3,0] }, { duration: .82 }),
  fly: (el, ctx) => travel(el, loop(ctx.clicked ? 34 : 24), { duration: ctx.clicked ? 1.7 : 1.4, onMove: cloudTrail() }),
  earth: el => play(el, { y: [0,-5,0], scale: [1,1.13,1] }, { duration: 1.2 })
};
