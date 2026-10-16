// Content checks over the built site (dist/**/*.html). Run after `astro build`:
//   node scripts/check-site.mjs        (or: pnpm run check:content)
//
// Any error exits non-zero. What it enforces:
//   - banned marketing/AI-tell wording in visible text (allowed inside <code> and <pre>); the
//     specification text itself is exempt, because the normative text is not ours to reword. Pages
//     that render it wrap exactly that span in <!--verbatim-->...<!--/verbatim--> (SpecBody does),
//     so our own copy on those pages is still checked, as are all meta descriptions.
//   - no email addresses, no names or hosts that must not be published
//   - noindex meta on every page, and a disallowing robots.txt, while INDEXABLE is false
//   - exactly one <h1> per page
//   - no duplicate id on a page, and no kramdown or template leftovers ({{ref}}, {:ial}, {::ext},
//     "--- middle") in the rendered specification pages under /spec/
//   - internal links and same-site anchors resolve (every href="#x" needs a matching id="x")
//   - no email address in src/content/spec/** (the vendored specification sources)
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const CONFIG = new URL('../src/site.config.ts', import.meta.url).pathname;

const BANNED_WORDS = [
  /\bseamless(?:ly)?\b/i, /\brobust(?:ness)?\b/i, /\bleverag(?:e|es|ed|ing)\b/i, /\bpowerful\b/i,
  /\bcutting[- ]edge\b/i, /\bunlock(?:s|ed|ing)?\b/i, /\bempower(?:s|ed|ing|ment)?\b/i,
  /\belevate[sd]?\b/i, /\bstreamlin(?:e|es|ed|ing)\b/i, /\bharness(?:es|ed|ing)?\b/i,
  /\bdelv(?:e|es|ed|ing)\b/i, /\bdive into\b/i, /\bgame[- ]changer\b/i, /\brevolutioni[sz]e[sd]?\b/i,
  /\bnext[- ]generation\b/i, /\bworld[- ]class\b/i, /\beffortless(?:ly)?\b/i, /\bsupercharg(?:e|es|ed|ing)\b/i,
  /\bunleash(?:es|ed|ing)?\b/i, /\bin today['’]s\b[^.]{0,60}\blandscape\b/i, /\bwhether you['’]re\b/i,
  /\bat its core\b/i, /\bit['’]s worth noting\b/i, /\bsimply\b/i, /\bjust\b/i, /\bblazing(?:ly)?[- ]fast\b/i,
  /\bimagine\b/i, /\bnot just\b/i, /\bit['’]s not\b[^.]{0,80}\bit['’]s\b/i,
];

const FORBIDDEN = [
  [/docker pull/i, '`docker pull`'], [/REST:VIEW/, 'REST:VIEW'], [/REST\/ACT/, 'REST/ACT'], [/RestAct/, 'RestAct'],
  [/pathfinder/i, 'pathfinder'], [/\bdiscovery\.[a-z0-9-]+\.[a-z]{2,}/i, 'a discovery.* hostname'], [/ghcr\.io/i, 'ghcr.io'],
  [/fonts\.(?:googleapis|gstatic)\.com/i, 'a Google Fonts request'],
];

const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)*\.[A-Za-z]{2,}\b/;

const errors = [];
const err = (page, msg) => errors.push(`${page}: ${msg}`);

if (!existsSync(DIST)) {
  console.error('dist/ not found. Run `astro build` first.');
  process.exit(2);
}

const indexable = /INDEXABLE\s*=\s*true/.test(readFileSync(CONFIG, 'utf8'));

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

// Vendored specification sources must hold no email address.
const SPEC_SRC = new URL('../src/content/spec/', import.meta.url).pathname;
if (existsSync(SPEC_SRC)) {
  for (const f of walk(SPEC_SRC)) {
    if (!f.endsWith('.md')) continue;
    const m = readFileSync(f, 'utf8').match(EMAIL);
    if (m) err(relative(SPEC_SRC, f), `email address "${m[0]}" in a vendored specification file`);
  }
}

const pages = [...walk(DIST)].filter((p) => p.endsWith('.html'));
const route = (file) => {
  const r = '/' + relative(DIST, file).replace(/index\.html$/, '').replace(/\.html$/, '');
  return r;
};

const strip = (html, ...tags) => tags.reduce((h, t) => h.replace(new RegExp(`<${t}\\b[^>]*>[\\s\\S]*?</${t}>`, 'gi'), ' '), html);
const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
const idsCache = new Map();
const idsOf = (file) => {
  if (!idsCache.has(file)) idsCache.set(file, new Set([...readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return idsCache.get(file);
};
const fileFor = (r) => {
  const base = join(DIST, r);
  for (const c of [join(base, 'index.html'), base + '.html', base]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
};

for (const file of pages) {
  const page = route(file);
  const html = readFileSync(file, 'utf8');
  const noScripts = strip(html, 'script', 'style');
  // Drop only the verbatim specification span (comments are removed below, so do this first).
  const ours = noScripts.replace(/<!--verbatim-->[\s\S]*?<!--\/verbatim-->/g, ' ');
  const visibleHtml = strip(ours, 'pre', 'code', 'svg').replace(/<!--[\s\S]*?-->/g, ' ');
  const text = decode(visibleHtml.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
  const desc = decode((html.match(/<meta name="description" content="([^"]*)"/) ?? [])[1] ?? '');

  // (a) banned words, outside code
  for (const re of BANNED_WORDS) {
    const m = (text + ' ' + desc).match(re);
    if (m) err(page, `banned wording "${m[0]}"`);
  }
  // (b) emails, anywhere in the markup (scripts and styles excluded)
  const em = noScripts.match(EMAIL);
  if (em) err(page, `email address "${em[0]}"`);
  // (c) forbidden names and hosts, anywhere including code
  for (const [re, label] of FORBIDDEN) if (re.test(noScripts)) err(page, `contains ${label}`);
  // (d) noindex while not indexable
  const noindex = /<meta name="robots" content="[^"]*noindex/.test(html);
  if (!indexable && !noindex) err(page, 'missing noindex meta while INDEXABLE is false');
  if (indexable && noindex) err(page, 'noindex meta present while INDEXABLE is true');
  // (e) one h1
  const h1s = (noScripts.match(/<h1[\s>]/g) ?? []).length;
  if (h1s !== 1) err(page, `${h1s} <h1> elements (want exactly 1)`);
  // (e2) duplicate ids
  const seenIds = new Set();
  for (const m of noScripts.matchAll(/\sid="([^"]+)"/g)) {
    if (seenIds.has(m[1])) err(page, `duplicate id "${m[1]}"`);
    seenIds.add(m[1]);
  }
  // (e3) markup that should have been consumed by the specification renderer
  if (page.startsWith('/spec/')) {
    const body = decode(noScripts.replace(/<[^>]+>/g, ' '));
    for (const [re, label] of [[/\{\{/, '{{'], [/\{:/, '{:'], [/(?:^|\s)---\s+(?:abstract|middle|back)\b/, '--- section marker'], [/@@\w+@@/, '@@ placeholder'], [/\u0000/, 'NUL placeholder']]) {
      if (re.test(body)) err(page, `unrendered markup "${label}"`);
    }
  }
  // (f) links
  for (const m of noScripts.matchAll(/<a\b[^>]*?\shref="([^"]*)"/g)) {
    const href = decode(m[1]);
    if (!href || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) continue; // external, mailto, tel
    const [pathPart, hash] = href.split('#');
    const target = pathPart.split('?')[0] || page;
    const abs = target.startsWith('/') ? target : new URL(target, 'http://x' + page).pathname;
    const dest = fileFor(abs);
    if (!dest) {
      err(page, `link to ${abs} (no such route)`);
      continue;
    }
    if (hash && dest.endsWith('.html') && !idsOf(dest).has(hash)) err(page, `anchor #${hash} not found on ${abs}`);
  }
}

// robots.txt must agree with INDEXABLE
const robots = existsSync(join(DIST, 'robots.txt')) ? readFileSync(join(DIST, 'robots.txt'), 'utf8') : '';
if (!indexable && !/^Disallow:\s*\/\s*$/m.test(robots)) err('/robots.txt', 'does not disallow everything while INDEXABLE is false');
if (indexable && /^Disallow:\s*\/\s*$/m.test(robots)) err('/robots.txt', 'disallows everything while INDEXABLE is true');

const unique = (a) => [...new Set(a)];
for (const e of unique(errors)) console.error(`error    ${e}`);
console.log(`checked ${pages.length} pages, ${unique(errors).length} errors`);
process.exit(errors.length ? 1 : 0);
