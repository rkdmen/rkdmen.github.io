import { reducedMotion } from './engine.js';

const glyphs = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ01<>{}/';
const pick = () => glyphs[Math.floor(Math.random() * glyphs.length)];
const SIZE = 15;
const STEP_MS = 45;
const RAIN_MS = 2200;
const FADE_MS = 500;

// Falling code drawn behind the page content; resolves once it has faded away.
export async function matrixRain() {
  if (reducedMotion.matches || document.hidden) return;
  const width = innerWidth;
  const height = innerHeight;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  const canvas = document.createElement('canvas');
  canvas.className = 'matrix-rain';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  const ctx = canvas.getContext('2d');
  ctx.scale(ratio, ratio);
  ctx.font = `${SIZE}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  const trailColor = dark ? '#3dff7a' : '#0b9b45';
  const headColor = dark ? '#eaffea' : '#04501f';
  const drops = Array.from({ length: Math.ceil(width / SIZE) }, () => ({
    y: -Math.random() * height * .6,
    speed: SIZE * (.6 + Math.random() * .6),
    glyph: pick()
  }));
  const started = performance.now();
  let last = 0;
  let frame = 0;

  const step = time => {
    if (time - last >= STEP_MS) {
      last = time;
      // Erase a little of everything each step so older characters leave a fading tail.
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, .14)';
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';
      const raining = time - started < RAIN_MS - 600;
      drops.forEach((drop, column) => {
        const x = column * SIZE;
        ctx.fillStyle = trailColor;
        ctx.fillText(drop.glyph, x, drop.y);
        drop.y += drop.speed;
        drop.glyph = pick();
        ctx.fillStyle = headColor;
        ctx.fillText(drop.glyph, x, drop.y);
        if (raining && drop.y > height) {
          drop.y = -Math.random() * height * .3;
        }
      });
    }
    frame = requestAnimationFrame(step);
  };

  document.body.append(canvas);
  frame = requestAnimationFrame(step);
  try {
    await new Promise(resolve => setTimeout(resolve, RAIN_MS));
    await canvas.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, fill: 'forwards' }).finished;
  } finally {
    cancelAnimationFrame(frame);
    canvas.remove();
  }
}
