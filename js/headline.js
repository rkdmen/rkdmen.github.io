// Fast one-time typed reveal without resizing the heading or delaying layout.
(() => {
  const root = document.documentElement;
  const title = document.querySelector('.headline');
  if (!title || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.remove('type-pending');
    return;
  }
  const run = () => {
    if (!title.isConnected) return;
    title.classList.add('is-typing');
    root.classList.remove('type-pending');
    title.addEventListener('animationend', event => {
      if (event.animationName === 'headline-type') title.classList.remove('is-typing');
    });
  };
  requestAnimationFrame(run);
})();
