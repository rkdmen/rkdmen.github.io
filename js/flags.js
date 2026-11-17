import { reducedMotion } from './engine.js';

const SLICES = 10;

// Vertical strips of the same glyph bob slightly out of phase, which reads as cloth waving.
export function waveFlags(flags) {
  if (reducedMotion.matches) return;
  flags.forEach(flag => {
    const glyph = flag.textContent;
    const base = document.createElement('span');
    base.className = 'flag-base';
    base.textContent = glyph;
    flag.classList.add('flag');
    flag.replaceChildren(base);
    for (let i = 0; i < SLICES; i++) {
      const slice = document.createElement('span');
      slice.className = 'flag-slice';
      slice.setAttribute('aria-hidden', 'true');
      slice.textContent = glyph;
      // Half a percent of overlap hides seams between strips.
      const left = Math.max(0, i * 100 / SLICES - .5);
      const right = Math.max(0, 100 - (i + 1) * 100 / SLICES - .5);
      slice.style.clipPath = `inset(0 ${right}% 0 ${left}%)`;
      slice.style.animationDelay = `${-i * .09}s`;
      flag.append(slice);
    }
  });
}
