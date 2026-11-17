// Runs independently of the animation module so in-app browsers always receive sizing.
(() => {
  const page = document.querySelector('.page');
  const lines = document.querySelector('.emoji-lines');
  const rows = [...document.querySelectorAll('.emoji-line')];
  if (!page || !lines || !rows.length) return;

  function fit() {
    const visual = window.visualViewport;
    const viewportWidth = Math.min(document.documentElement.clientWidth || Infinity, window.innerWidth || Infinity, visual?.width || Infinity);
    const viewportHeight = Math.min(window.innerHeight || Infinity, visual?.height || Infinity);
    if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) return;
    // Some in-app browsers report a narrower visual viewport than the layout viewport.
    page.style.width = `${Math.floor(viewportWidth)}px`;
    page.style.marginLeft = viewportWidth < document.documentElement.clientWidth - 2 ? '0' : '';
    const style = getComputedStyle(page);
    const gutters = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const maxRowWidth = Math.min(lines.clientWidth, viewportWidth - gutters) - 2;
    const maxPageHeight = Number.isFinite(viewportHeight) ? viewportHeight - 2 : Infinity;
    const fits = size => {
      lines.style.fontSize = `${size}px`;
      const widthOK = rows.every(row => row.getBoundingClientRect().width <= maxRowWidth);
      const heightOK = page.getBoundingClientRect().bottom <= maxPageHeight;
      return widthOK && heightOK;
    };
    let low = 7, high = 29;
    if (!fits(high)) {
      // A binary search uses actual glyph geometry, which differs across Safari and Instagram.
      for (let i = 0; i < 14; i++) {
        const mid = (low + high) / 2;
        if (fits(mid)) low = mid;
        else high = mid;
      }
      fits(low);
    }
  }

  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; fit(); });
  }
  fit();
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('orientationchange', schedule, { passive: true });
  window.addEventListener('pageshow', schedule, { passive: true });
  window.visualViewport?.addEventListener('resize', schedule, { passive: true });
  window.visualViewport?.addEventListener('scroll', schedule, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); });
  document.fonts?.ready.then(schedule);
  setTimeout(schedule, 250);
  setTimeout(schedule, 1200);
})();
