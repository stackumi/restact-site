/** Theme toggle. The first paint is handled by the inline script in Base.astro; this only reacts to clicks. */
const KEY = 'restact-theme'; // keep in sync with THEME_KEY in site.config.ts

const root = document.documentElement;
const current = () => root.getAttribute('data-theme') ?? 'dark';

function sync() {
  const next = current() === 'dark' ? 'light' : 'dark';
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((b) => {
    b.setAttribute('aria-label', `Switch to the ${next} theme`);
  });
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', getComputedStyle(document.body).backgroundColor);
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
