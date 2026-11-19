import { animate } from 'https://cdn.jsdelivr.net/npm/motion@14.11.1/+esm';
import { reducedMotion, sampleSmoothPath, easeInOut } from './engine.js';

const ROW_SLICES = 10;
const PARADE_SLICES = 6;
const rand = (min, max) => min + Math.random() * (max - min);

// Vertical strips of the same glyph bob slightly out of phase, which reads as cloth waving.
function buildWave(el, slices) {
  const glyph = el.textContent;
  const base = document.createElement('span');
  base.className = 'flag-base';
  base.textContent = glyph;
  el.classList.add('flag');
  el.replaceChildren(base);
  for (let i = 0; i < slices; i++) {
    const slice = document.createElement('span');
    slice.className = 'flag-slice';
    slice.setAttribute('aria-hidden', 'true');
    slice.textContent = glyph;
    // Half a percent of overlap hides seams between strips.
    const left = Math.max(0, i * 100 / slices - .5);
    const right = Math.max(0, 100 - (i + 1) * 100 / slices - .5);
    slice.style.clipPath = `inset(0 ${right}% 0 ${left}%)`;
    slice.style.animationDelay = `${-i * .09}s`;
    el.append(slice);
  }
}

export function waveFlags(flags) {
  if (reducedMotion.matches) return;
  flags.forEach(flag => buildWave(flag, ROW_SLICES));
}

const stage = () => {
  const node = document.createElement('div');
  node.className = 'party-stage';
  node.setAttribute('aria-hidden', 'true');
  document.body.append(node);
  return node;
};

function paradeFlag(layer, width, height) {
  const holder = document.createElement('span');
  holder.className = 'parade-flag';
  holder.style.fontSize = `${rand(20, 46)}px`;
  holder.style.top = `${rand(4, 82)}%`;
  const cloth = document.createElement('span');
  cloth.textContent = '🇰🇷';
  holder.append(cloth);
  buildWave(cloth, PARADE_SLICES);
  layer.append(holder);
  const bob = rand(10, 28);
  const lean = rand(-10, 10);
  return holder.animate([
    { transform: `translate(-80px, 0) rotate(${lean}deg)` },
    { transform: `translate(${width * .33}px, ${-bob}px) rotate(${-lean}deg)` },
    { transform: `translate(${width * .66}px, ${bob}px) rotate(${lean}deg)` },
    { transform: `translate(${width + 80}px, 0) rotate(${-lean}deg)` }
  ], { duration: rand(2600, 4600), delay: rand(0, 1600), easing: 'linear', fill: 'both' }).finished;
}

// The chant runs in five beats: two long, then three short.
const CHANT_BEATS = [0, .14, .3, .42, .54, .66, .78, .9, 1];
const CHANT_SCALES = [.6, 1.12, 1, 1.12, 1, 1.08, 1, 1, .9];

// Korean flags of every size stream across the screen while the chant pulses at the bottom.
export function koreaParade() {
  if (reducedMotion.matches || document.hidden) return Promise.resolve();
  const layer = stage();
  const flags = Array.from({ length: Math.round(rand(30, 50)) }, () => paradeFlag(layer, innerWidth, innerHeight));
  const chant = document.createElement('span');
  chant.className = 'chant';
  chant.textContent = '대~한민국~';
  layer.append(chant);
  const shout = chant.animate(CHANT_BEATS.map((offset, i) => ({
    offset,
    transform: `translateX(-50%) scale(${CHANT_SCALES[i]})`,
    opacity: i === 0 || i === CHANT_BEATS.length - 1 ? 0 : 1
  })), { duration: 5200, easing: 'ease-out', fill: 'both' }).finished;
  return Promise.all([...flags, shout]).catch(() => {}).finally(() => layer.remove());
}

const EAGLE_SIZE = 44;
const EAGLE_SECONDS = 4.6;
const FLAPS = 9;

// The eagle bursts out of the flag, loops around the screen and soars off the top right.
// The 🦅 glyph faces left, so it is mirrored whenever it flies right.
export async function eagleFlight(flag) {
  if (reducedMotion.matches || document.hidden || !flag?.isConnected) return;
  const r = flag.getBoundingClientRect();
  const w = innerWidth;
  const h = innerHeight;
  const start = [r.left + r.width / 2, r.top + r.height / 2];
  const at = sampleSmoothPath([
    start,
    [start[0] + 60, start[1] - 80],
    [w * .82, h * .14],
    [w * .86, h * .55],
    [w * .5, h * .82],
    [w * .14, h * .55],
    [w * .24, h * .18],
    [w * .62, h * .24],
    [w + 90, -70]
  ], 48);
  const layer = stage();
  const eagle = document.createElement('span');
  eagle.className = 'eagle';
  eagle.textContent = '🦅';
  layer.append(eagle);
  let facing = 1;
  const place = t => {
    const u = easeInOut(t);
    const [x, y] = at(u);
    const [aheadX] = at(Math.min(1, u + .01));
    // Ease the mirror toward the flight direction so turns read as a bank, not a flip.
    const target = aheadX > x ? -1 : 1;
    facing += (target - facing) * .18;
    const grow = Math.min(1, t * 8);
    const flap = 1 + .14 * Math.sin(t * Math.PI * 2 * FLAPS);
    eagle.style.opacity = grow;
    eagle.style.transform = `translate(${x - EAGLE_SIZE / 2}px, ${y - EAGLE_SIZE / 2}px) scale(${facing * (.4 + .6 * grow)}, ${flap * (.4 + .6 * grow)})`;
  };
  place(0);
  try {
    await new Promise(resolve => {
      animate(0, 1, { duration: EAGLE_SECONDS, ease: 'linear', onUpdate: place, onComplete: resolve });
    });
  } finally {
    layer.remove();
  }
}
