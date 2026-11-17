// Short starbursts near the bottom emojis, after their entrances have landed.
// Fixed positioning and containment prevent scrollbars in Instagram and Safari.
const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const sparkleChars = ['✦','✧','✦','✨'];
const random = (low, high) => Math.random() * (high - low) + low;

export function starWave() {
  if (prefersReducedMotion.matches || document.hidden) return Promise.resolve();
  const row = document.querySelector('.emoji-line:last-child');
  if (!row) return Promise.resolve();
  const candidates = [...row.querySelectorAll('.emoji')].filter(el => getComputedStyle(el).visibility !== 'hidden');
  if (!candidates.length) return Promise.resolve();
  const host = document.createElement('div');
  host.className = 'star-stage';
  host.setAttribute('aria-hidden','true');
  document.body.append(host);
  const vw = document.documentElement.clientWidth || innerWidth;
  const vh = innerHeight;
  const tasks = [];
  const starCount = 13;
  for (let i=0; i<starCount; i++) {
    const target = candidates[i % candidates.length];
    const bounds = target.getBoundingClientRect();
    const node = document.createElement('span');
    node.className = 'twinkle-star';
    node.textContent = sparkleChars[i % sparkleChars.length];
    const size = i % 4 === 0 ? 31 : i % 3 === 0 ? 23 : 15;
    node.style.fontSize = `${size}px`;
    node.style.color = i % 3 === 0 ? '#ffcb57' : i % 3 === 1 ? '#84c7ff' : '#f7a6e8';
    const x = Math.min(vw-22,Math.max(20,bounds.left + bounds.width / 2 + random(-22,22)));
    const y = Math.min(vh-22,Math.max(20,bounds.top + bounds.height / 2 + random(-28,23)));
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    host.append(node);
    const scale = i % 3 === 0 ? 2.0 : 1.5;
    const animation = node.animate([
      { transform: 'translate(-50%,-50%) scale(0) rotate(-35deg)', opacity:0 },
      { transform: `translate(-50%,-50%) scale(${scale}) rotate(20deg)`, opacity:1, offset:.42 },
      { transform: 'translate(-50%,-50%) scale(.35) rotate(75deg)', opacity:0 }
    ], { duration: random(660,970), delay:i*115, easing:'ease-out',fill:'both' });
    tasks.push(animation.finished.catch(()=>{}).finally(()=>node.remove()));
  }
  return Promise.allSettled(tasks).finally(()=>host.remove());
}
