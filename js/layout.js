// Fit real glyph widths, not guessed emoji counts. Safari and Chrome render emoji differently.
const page = document.querySelector('.page');
const lines = document.querySelector('.emoji-lines');
const rows = [...document.querySelectorAll('.emoji-line')];

export function fitLayout() {
  if (!page || !lines || !rows.length) return;
  const availableWidth = lines.clientWidth;
  if (!availableWidth) return;
  const visibleHeight = Math.min(
    document.documentElement.clientHeight || Infinity,
    window.visualViewport?.height || Infinity
  );
  const fits = size => {
    lines.style.fontSize = `${size}px`;
    const widthOK = rows.every(row => row.getBoundingClientRect().width <= availableWidth + .5);
    const heightOK = page.getBoundingClientRect().bottom <= visibleHeight + .5;
    return widthOK && heightOK;
  };
  // Never intentionally overflow horizontally; respect the viewport's actual glyph widths.
  let low = 6, high = 29;
  if (!fits(high)) {
    for (let i = 0; i < 12; i++) {
      const mid = (low + high) / 2;
      if (fits(mid)) low = mid;
      else high = mid;
    }
    fits(low);
  }
}

let frame;
const scheduleFit = () => {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(fitLayout);
};
fitLayout();
window.addEventListener('resize', scheduleFit, { passive: true });
window.visualViewport?.addEventListener('resize', scheduleFit, { passive: true });
document.fonts?.ready.then(scheduleFit);
