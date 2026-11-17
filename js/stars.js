// Ambient glints live only in the empty space below the emoji content.
// No fixed star positions: every twinkle gets a fresh size, location, and duration.
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const random = (low, high) => low + Math.random() * (high - low);
const shapes = ['✦', '✧', '✶', '⋆', '✦'];
const colors = ['#fff6db', '#d0e9ff', '#f9d7ff', '#ffffff', '#ffe6a3'];
const activeStars = new Set();
let started = false;
let stage;

function availableSpace() {
  const lines = document.querySelector('.emoji-lines');
  if (!lines) return null;
  const view = window.visualViewport;
  const width = Math.min(
    document.documentElement.clientWidth || Infinity,
    window.innerWidth || Infinity,
    view?.width || Infinity
  );
  const height = Math.min(
    document.documentElement.clientHeight || Infinity,
    window.innerHeight || Infinity,
    view?.height || Infinity
  );
  if (!Number.isFinite(width + height) || width < 90 || height < 250) return null;

  // Keep a generous gap below the LAST emoji. The stars fill the unused page,
  // not the emoji rows. On cramped phones, skip them rather than overlap content.
  const contentBottom = lines.getBoundingClientRect().bottom;
  const top = Math.max(contentBottom + Math.min(85, height * .11), height * .53);
  const bottom = height - 26;
  if (bottom - top < 105) return null;
  return { width, top, bottom };
}

function makeStar() {
  if (reduceMotion.matches || document.hidden || activeStars.size >= 24) return;
  const space = availableSpace();
  if (!space) return;

  const node = document.createElement('span');
  node.className = 'twinkle-star';
  node.textContent = shapes[Math.floor(Math.random() * shapes.length)];
  const chance = Math.random();
  // Mostly tiny stars, with an occasional oversized, bright star.
  const size = chance < .12 ? random(34, 52) :
    chance < .34 ? random(20, 31) : random(8, 18);
  const x = random(25, Math.max(26, space.width - 25));
  const y = random(space.top + 10, space.bottom - 10);
  node.style.fontSize = `${size}px`;
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  node.style.color = colors[Math.floor(Math.random() * colors.length)];
  stage.append(node);
  activeStars.add(node);

  // Alternate slow dreamy shines and very fast, sharp flashes.
  const slow = Math.random() < .55;
  const duration = slow ? random(2700, 5800) : random(520, 1150);
  const peak = slow ? random(.75, 1.18) : random(1.2, 1.9);
  const angle = random(-28, 28);
  const animation = node.animate([
    { opacity: 0, transform: `translate(-50%,-50%) scale(.12) rotate(${angle}deg)`, offset: 0 },
    { opacity: slow ? .82 : 1, transform: `translate(-50%,-50%) scale(${peak}) rotate(0deg)`, offset: slow ? .32 : .38 },
    { opacity: slow ? .68 : .8, transform: `translate(-50%,-50%) scale(${peak * .85}) rotate(12deg)`, offset: slow ? .72 : .6 },
    { opacity: 0, transform: `translate(-50%,-50%) scale(.18) rotate(35deg)`, offset: 1 }
  ], { duration, easing: 'ease-in-out', fill: 'both' });
  animation.finished.catch(() => {}).finally(() => {
    activeStars.delete(node);
    node.remove();
  });
}

export function startStarfield() {
  if (started || reduceMotion.matches) return;
  started = true;
  stage = document.createElement('div');
  stage.className = 'star-stage';
  stage.setAttribute('aria-hidden', 'true');
  document.body.append(stage);

  // Populate the lower blank space at varied offsets, then keep it alive.
  for (let i = 0; i < 14; i++) {
    setTimeout(makeStar, random(100, 1850));
  }
  function repeat() {
    if (!document.hidden) {
      makeStar();
      if (Math.random() < .18) makeStar();
    }
    setTimeout(repeat, random(300, 720));
  }
  setTimeout(repeat, 850);
}
