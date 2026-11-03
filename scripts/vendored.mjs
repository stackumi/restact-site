// Shared by check-site.mjs and sync-docs.mjs: the leak and address patterns the site enforces, and
// the two checks over a vendored directory (a scan of its text files, and a hash of its tree).
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// Names and hosts that must not be published, with the label an error shows. These hold for
// vendored files too.
export const LEAKS = [
  [/REST:VIEW/, 'REST:VIEW'], [/REST\/ACT/, 'REST/ACT'], [/RestAct/, 'RestAct'],
  [/pathfinder/i, 'pathfinder'], [/\bdiscovery\.[a-z0-9-]+\.[a-z]{2,}/i, 'a discovery.* hostname'],
  [/fonts\.(?:googleapis|gstatic)\.com/i, 'a Google Fonts request'],
];
// The site's own copy also names no container image: it says no release is tagged yet. The vendored
// restactd docs describe restactd's releases, and restactd's gate owns those claims.
export const FORBIDDEN = [...LEAKS, [/docker pull/i, '`docker pull`'], [/ghcr\.io/i, 'ghcr.io']];

export const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)*\.[A-Za-z]{2,}\b/;

export function* walk(dir) {
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

// Text files are scanned for LEAKS; of those, scripts and styles are not scanned for addresses,
// as in restactd's own leak scan and the site's page check (a bundled library's author line, such
// as Pagefind's, is not ours to remove).
const TEXT = /\.(?:html|txt|xml|json|js|mjs|css|svg|md|webmanifest)$/;
const CODE = /\.(?:js|mjs|css)$/;
// `scheme://user:password@host` is a URL's userinfo, such as a placeholder connection string, not
// an address.
const USERINFO = /[a-z][a-z0-9+.-]*:\/\/[^\s/@]*:$/i;

/** The first email address in `s`, ignoring URL userinfo, or null. */
export const findEmail = (s) => {
  for (const m of s.matchAll(new RegExp(EMAIL.source, 'g'))) {
    if (!USERINFO.test(s.slice(Math.max(0, m.index - 200), m.index))) return m[0];
  }
  return null;
};

/** Every address and leaked name in `dir`'s text files, as [path, what] pairs. */
export const scanText = (dir) => {
  const hits = [];
  for (const f of walk(dir)) {
    if (!TEXT.test(f)) continue;
    const s = readFileSync(f, 'utf8');
    const em = CODE.test(f) ? null : findEmail(s);
    if (em) hits.push([relative(dir, f), `email address "${em}"`]);
    for (const [re, label] of LEAKS) if (re.test(s)) hits.push([relative(dir, f), `contains ${label}`]);
  }
  return hits;
};

/**
 * A sha256 over `dir`'s files in path order, each as `<path>\0<sha256 of its bytes>\n`, leaving out
 * the paths in `skip`. It names the tree's content, so it can be recomputed from the committed copy.
 */
export const treeHash = (dir, skip = []) => {
  const h = createHash('sha256');
  for (const f of walk(dir)) {
    const p = relative(dir, f).split(sep).join('/');
    if (skip.includes(p)) continue;
    h.update(`${p}\0${createHash('sha256').update(readFileSync(f)).digest('hex')}\n`);
  }
  return h.digest('hex');
};
