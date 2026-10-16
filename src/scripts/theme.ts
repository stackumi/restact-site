/** Theme toggle. The first paint is handled by the inline script in Base.astro; this only reacts to clicks. */
import { THEME_KEY as KEY } from '../site.config';

const root = document.documentElement;
const current = () => root.getAttribute('data-theme') ?? 'dark';

function sync() {
  const next = current() === 'dark' ? 'light' : 'dark';
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((b) => {
    b.setAttribute('aria-label', `Switch to the ${next} theme`);
  });
  const ground = getComputedStyle(document.body).backgroundColor;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', ground));
}

document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((b) => {
  b.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* storage blocked: the choice lasts for this page view only */
    }
    sync();
  });
});
sync();
