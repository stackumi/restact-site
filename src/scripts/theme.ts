/**
 * Theme toggle. Light is the default and dark is opt-in: the first paint is handled by the inline
 * script in Base.astro (stored choice, else light); this only reacts to clicks and keeps the
 * color-scheme and theme-color metas in step with the chosen theme.
 */
import { THEME_KEY as KEY } from '../site.config';

const root = document.documentElement;
const current = () => root.getAttribute('data-theme') ?? 'light';

function sync() {
  const next = current() === 'dark' ? 'light' : 'dark';
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((b) => {
    b.setAttribute('aria-label', `Switch to the ${next} theme`);
  });
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', current());
  // The browser chrome matches the masthead band, which is the brand colour in either theme.
  const brand = getComputedStyle(root).getPropertyValue('--brand').trim();
  if (brand) document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', brand));
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
