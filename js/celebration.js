import { animate } from 'https://cdn.jsdelivr.net/npm/motion@14.11.1/+esm';
import { play, reducedMotion } from './engine.js';

const colors = ['#ff3e81', '#ff9e31', '#ffe04a', '#42d9ab', '#49b8ff', '#9462f5'];
const emojiSet = ['🍷', '🍣', '⚽', '✨', '🥂', '🌈', '❤️', '⛳'];
const random = (min, max) => min + Math.random() * (max - min);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function stageParticle(stage, x, y, type, index) {
  const el = document.createElement('span');
  el.className = 'party-particle';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  if (type === 'emoji') {
    el.textContent = emojiSet[index % emojiSet.length];
    el.style.fontSize = `${random(19, 35)}px`;
  } else {
    const size = random(5, 10);
    el.style.width = `${size}px`;
    el.style.height = `${size * random(.65, 1.5)}px`;
    el.style.borderRadius = index % 3 === 0 ? '50%' : '2px';
    el.style.backgroundColor = colors[index % colors.length];
  }
  stage.append(el);
  return el;
}

function playParticle(node, frames, options) {
  const animation = animate(node, frames, options);
  return animation.finished.catch(() => {}).finally(() => node.remove());
}

// Fireworks originate around the entire screen, not just above the headline.
function burst(stage, x, y, count, width, height, offset) {
  const effects = [];
  const baseRadius = Math.min(width, height) * .17;
  for (let i = 0; i < count; i++) {
    const item = stageParticle(stage, x, y, i % 6 === 0 ? 'emoji' : 'confetti', offset + i);
    const angle = (i / count) * Math.PI * 2 + random(-.18, .18);
    const distance = baseRadius + random(28, Math.min(130, width * .32));
    const dx = clamp(Math.cos(angle) * distance, 9 - x, width - 9 - x);
    const dy = clamp(Math.sin(angle) * distance, 9 - y, height - 9 - y);
    const spin = random(-430, 430);
    effects.push(playParticle(item, {
      x: [0, dx * .7, dx],
      y: [0, dy * .7 - 15, dy + 12],
      rotate: [0, spin * .6, spin],
      scale: [.2, 1.35, .7],
      opacity: [0, 1, 1, 0]
    }, { duration: random(1.25, 1.9), delay: random(0, .22), ease: 'easeOut' }));
  }
  return effects;
}

// Streamers fall across the full viewport. All nodes stay in the fixed stage.
function confettiRain(stage, width, height, count) {
  const effects = [];
  for (let i = 0; i < count; i++) {
    const x = random(8, width - 8);
    const item = stageParticle(stage, x, -28, 'confetti', i);
    effects.push(playParticle(item, {
      x: [0, random(-38, 38), random(-48, 48)],
      y: [0, height * .5, height + 65],
      rotate: [0, random(90, 260), random(380, 850)],
      opacity: [0, 1, 1, 0]
    }, { duration: random(1.8, 2.65), delay: random(0, .35), ease: 'linear' }));
  }
  return effects;
}

function flyingEmojis(stage, width, height, count) {
  const effects = [];
  for (let i = 0; i < count; i++) {
    const x = (i + .5) / count * width + random(-10, 10);
    const item = stageParticle(stage, x, height + 26, 'emoji', i);
    effects.push(playParticle(item, {
      x: [0, random(-45, 45), random(-75, 75)],
      y: [0, -height * random(.45, .65), -height * random(.75, 1.15)],
      scale: [.35, 1.55, 1.05],
      rotate: [0, random(-30, 30), random(-170, 170)],
      opacity: [0, 1, 1, 0]
    }, { duration: random(1.6, 2.35), delay: random(.1, .48), ease: 'easeOut' }));
  }
  return effects;
}

function shockwave(stage, x, y, width, height) {
  const effects = [];
  for (let i = 0; i < 2; i++) {
    const ring = document.createElement('span');
    ring.className = 'party-ring';
    const diameter = 90;
    ring.style.left = `${x - diameter / 2}px`;
    ring.style.top = `${y - diameter / 2}px`;
    ring.style.width = `${diameter}px`;
    ring.style.height = `${diameter}px`;
    ring.style.borderColor = colors[i * 3];
    stage.append(ring);
    const finalScale = Math.max(width, height) * 1.8 / diameter;
    effects.push(playParticle(ring, {
      scale: [.05, finalScale],
      opacity: [.75, .34, 0]
    }, { duration: 1.05, delay: i * .15, ease: 'easeOut' }));
  }
  return effects;
}

function emojiWave(emojis, width, height) {
  return emojis.map((el, i) => new Promise(resolve => setTimeout(resolve, i * 23)).then(() => {
    if (!el.isConnected || getComputedStyle(el).visibility === 'hidden') return;
    const r = el.getBoundingClientRect();
    const centerX = r.left + r.width / 2;
    const centerY = r.top + r.height / 2;
    const dx = clamp((centerX - width / 2) * .22 + random(-25, 25),
      8 - r.left, width - r.right - 8);
    const dy = clamp((centerY - height / 2) * .25 + random(-34, 45),
      8 - r.top, height - r.bottom - 8);
    const lift = clamp(-random(25, 52), 8 - r.top, height - r.bottom - 8);
    const spin = (i % 2 ? -1 : 1) * random(25, 85);
    return play(el, {
      x: [0, dx * .85, dx, 0],
      y: [0, lift, dy, 0],
      rotate: [0, spin * .7, spin, 0],
      scale: [1, random(1.35, 1.7), 1.2, 1]
    }, { duration: random(.75, 1.05), ease: 'easeOut' });
  }));
}

export async function surprise(title, emojis) {
  if (!title || reducedMotion.matches || document.hidden) return;
  const stage = document.createElement('div');
  stage.className = 'party-stage';
  stage.setAttribute('aria-hidden', 'true');
  document.body.append(stage);
  title.classList.add('is-celebrating');
  try {
    const width = stage.clientWidth || innerWidth;
    const height = stage.clientHeight || innerHeight;
    const rect = title.getBoundingClientRect();
    const x = clamp(rect.left + rect.width / 2, 20, width - 20);
    const y = clamp(rect.top + rect.height / 2, 20, height - 20);
    const compact = width < 500;
    const glow = document.createElement('span');
    glow.className = 'party-glow';
    stage.append(glow);

    const effects = [
      playParticle(glow, { opacity: [0, .55, .17, 0] },
        { duration: 1.5, ease: 'easeInOut' }),
      ...shockwave(stage, x, y, width, height),
      ...burst(stage, x, y, compact ? 11 : 15, width, height, 0),
      ...burst(stage, width * .20, height * .45, compact ? 11 : 15, width, height, 25),
      ...burst(stage, width * .79, height * .55, compact ? 11 : 15, width, height, 50),
      ...burst(stage, width * .48, height * .80, compact ? 11 : 15, width, height, 75),
      ...confettiRain(stage, width, height, compact ? 15 : 22),
      ...flyingEmojis(stage, width, height, compact ? 8 : 12),
      play(title, { scale: [1, .91, 1.20, 1.02, 1.13, 1],
        rotate: [0, -4, 4, -2, 0] }, { duration: 1.2, ease: 'easeOut' }),
      ...emojiWave(emojis, width, height)
    ];
    await Promise.allSettled(effects);
  } finally {
    title.classList.remove('is-celebrating');
    stage.remove();
  }
}
