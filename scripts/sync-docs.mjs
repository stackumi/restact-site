// Vendors the built restactd documentation into public/docs/, served at restact.org/docs. Run by a
// human when the docs change, then commit the result (the same pattern as sync:spec):
//
//   corepack pnpm sync:docs <tag>                  a restactd release, such as v0.1.0
//   corepack pnpm sync:docs <path-to-checkout>     a local restactd checkout (before the release asset exists)
//
// From a release, it downloads the docs tarball and its .sha256 from the GitHub release and refuses
// a tarball whose hash does not match. From a checkout, it runs restactd's docs gate there
// (`make docs-site-check`; with C4_EXPORT=skip, only the build, `make docs-site`) for this site's
// address, then copies docs-site/dist. Either way, the copy is scanned for addresses and names that
// must not be published before it replaces public/docs/ wholesale, and public/docs/SOURCE.json
// records where it came from. `pnpm verify` recomputes SOURCE.json's tree_sha256, so the committed
// copy cannot be edited by hand.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { scanText, treeHash } from './vendored.mjs';

const REPO = 'stackumi/restactd';
// The address the docs are built for; restactd's build bakes it into every link.
const DOCS_SITE = 'https://restact.org';
const DOCS_BASE = '/docs';
// The release asset's name; restactd's release step (stackumi/restactd#901, part 1) must match it.
const asset = (tag) => `restactd-docs-${tag}.tar.gz`;

const root = new URL('..', import.meta.url).pathname;
const out = join(root, 'public', 'docs');
const arg = process.argv[2];
const fail = (msg, code = 1) => {
  console.error(`sync-docs: ${msg}`);
  process.exit(code);
};
if (!arg) fail('pass a restactd release tag (v0.1.0) or the path to a restactd checkout.', 2);

const work = mkdtempSync(join(root, 'node_modules', '.sync-docs-'));
process.on('exit', () => rmSync(work, { recursive: true, force: true }));

let dist;
let source;
if (/^v\d/.test(arg)) {
  // A release: the tarball and its checksum, by `gh` (which also reads a private repository).
  const name = asset(arg);
  execFileSync('gh', ['release', 'download', arg, '-R', REPO, '-p', name, '-p', `${name}.sha256`, '-D', work], { stdio: 'inherit' });
  const want = (readFileSync(join(work, `${name}.sha256`), 'utf8').match(/^[0-9a-f]{64}\b/) ?? [])[0];
  if (!want) fail(`${name}.sha256 holds no sha256; nothing was written.`);
  const got = createHash('sha256').update(readFileSync(join(work, name))).digest('hex');
  if (got !== want) fail(`${name} has sha256 ${got}, but the release says ${want}; nothing was written.`);
  dist = join(work, 'unpacked');
  mkdirSync(dist);
  execFileSync('tar', ['-xzf', join(work, name), '-C', dist]);
  // Accept the files at the top of the tarball, or inside one top directory.
  const top = readdirSync(dist);
  if (!existsSync(join(dist, 'index.html')) && top.length === 1) dist = join(dist, top[0]);
  source = { repository: REPO, release: arg, asset: name, sha256: got };
} else {
  const src = resolve(arg);
  if (!existsSync(join(src, 'docs-site', 'astro.config.mjs'))) fail(`${src} is not a restactd checkout (no docs-site/).`, 2);
  const git = (...a) => execFileSync('git', ['-C', src, ...a], { encoding: 'utf8' }).trim();
  if (git('status', '--porcelain', '--', 'docs', 'docs-site', ':!docs-site/dist')) {
    fail('the checkout has uncommitted changes under docs/ or docs-site/; commit or stash them first.', 2);
  }
  const skip = process.env.C4_EXPORT === 'skip';
  execFileSync('make', ['-C', src, skip ? 'docs-site' : 'docs-site-check'], {
    stdio: 'inherit',
    env: { ...process.env, DOCS_SITE, DOCS_BASE },
  });
  dist = join(src, 'docs-site', 'dist');
  source = { repository: REPO, commit: git('rev-parse', 'HEAD'), date: git('log', '-1', '--format=%cI'), ...(skip && { c4: 'placeholders' }) };
}

for (const f of ['index.html', '404.html']) if (!existsSync(join(dist, f))) fail(`the docs build has no ${f}; nothing was written.`);
const hits = scanText(dist);
if (hits.length) fail(`the docs build must not be published:\n${hits.map(([f, w]) => `  ${f}: ${w}`).join('\n')}\nNothing was written.`);

// Stage beside public/docs/, then swap, so a failure never leaves a half-copied tree.
const next = `${out}.next`;
rmSync(next, { recursive: true, force: true });
cpSync(dist, next, { recursive: true });
const record = { ...source, built_for: `${DOCS_SITE}${DOCS_BASE}/`, tree_sha256: treeHash(next) };
writeFileSync(join(next, 'SOURCE.json'), JSON.stringify(record, null, 2) + '\n');
rmSync(out, { recursive: true, force: true });
renameSync(next, out);
console.log(`sync-docs: ${source.release ?? source.commit.slice(0, 7)} → public/docs/ (tree ${record.tree_sha256.slice(0, 12)})`);
