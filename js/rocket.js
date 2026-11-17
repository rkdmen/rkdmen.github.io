import { animate } from 'https://cdn.jsdelivr.net/npm/motion@14.11.1/+esm';
import { reducedMotion, easeOut } from './engine.js';
import { rocketTrail } from './trails.js';

const DURATION = 2.3;
// Share of the timeline spent fading in and growing before the boost.
const APPEAR = .3;
// The 🚀 glyph points up and to the right.
const GLYPH_HEADING = -45;

// A rocket grows out of the emoji, turns toward the bottom-right corner and boosts off screen.
export async function launchRocket(from) {
  if (reducedMotion.matches || document.hidden || !from?.isConnected) return;
  const r = from.getBoundingClientRect();
  const size = parseFloat(getComputedStyle(from).fontSize);
  const startX = r.left + r.width / 2;
  const startY = r.top + r.height / 2;
  const dx = innerWidth - startX + size * 2;
  const dy = innerHeight - startY + size * 2;
  const heading = Math.atan2(dy, dx);
  const turn = heading * 180 / Math.PI - GLYPH_HEADING;
  const tail = size * .45;
  const smoke = rocketTrail();
  const rocket = document.createElement('span');
  rocket.className = 'rocket';
  rocket.textContent = '🚀';
  rocket.setAttribute('aria-hidden', 'true');
  Object.assign(rocket.style, { left: `${startX}px`, top: `${startY}px`, fontSize: `${size}px` });

  const place = t => {
    const appear = Math.min(1, t / APPEAR);
    const boost = Math.max(0, (t - APPEAR) / (1 - APPEAR)) ** 2;
    const x = dx * boost;
    const y = dy * boost;
    const scale = .25 + .75 * easeOut(appear);
    rocket.style.opacity = appear;
    rocket.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) rotate(${turn * easeOut(appear)}deg) scale(${scale})`;
    if (t > APPEAR) {
      const tailX = startX + x - Math.cos(heading) * tail;
      const tailY = startY + y - Math.sin(heading) * tail;
      smoke({ x: tailX, y: tailY, width: 0, height: 0, opacity: 1 });
    }
  };

  document.body.append(rocket);
  place(0);
  try {
    await new Promise(resolve => {
      animate(0, 1, { duration: DURATION, ease: 'linear', onUpdate: place, onComplete: resolve });
    });
  } finally {
    rocket.remove();
  }
}
