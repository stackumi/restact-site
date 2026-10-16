// Copies the specification sources from a checkout of stackumi/restact-specs into
// src/content/spec/, so the Cloudflare build needs no sibling checkout. Run by a human when the
// specification changes, then commit the result:
//
//   corepack pnpm sync:spec [path-to-restact-specs]      (default: ../restact-specs)
//
// The vendored copies are not edited, with one exception: the draft's front matter loses the
// author's `name:` and `email:` lines, so no address enters this repository. The author stays
// `ins: N. Byrd`. SOURCE.json records the commit the copies came from.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const src = resolve(process.argv[2] ?? join(root, '..', 'restact-specs'));
const out = join(root, 'src', 'content', 'spec');

const DRAFT = 'draft-byrd-restact-protocol-00.md';
if (!existsSync(join(src, DRAFT))) {
  console.error(`sync-spec: ${join(src, DRAFT)} not found. Pass the path to a restact-specs checkout.`);
  process.exit(2);
}

const git = (...args) => execFileSync('git', ['-C', src, ...args], { encoding: 'utf8' }).trim();
const commit = git('rev-parse', 'HEAD');
const date = git('log', '-1', '--format=%cI');
if (git('status', '--porcelain', '--', DRAFT, 'presentation-verbs.md', 'registries')) {
  console.error('sync-spec: the source checkout has uncommitted changes in the spec files; commit or stash them first.');
  process.exit(2);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'registries'), { recursive: true });

// Strip the author's name and address from the front matter (the first `---` ... `---` block).
const draft = readFileSync(join(src, DRAFT), 'utf8');
const end = draft.indexOf('\n---', 4);
const front = draft
  .slice(0, end)
  .split('\n')
  .filter((l) => !/^\s+(?:name|email):/.test(l))
  .join('\n');
writeFileSync(join(out, DRAFT), front + draft.slice(end));

cpSync(join(src, 'presentation-verbs.md'), join(out, 'presentation-verbs.md'));
for (const f of readdirSync(join(src, 'registries')).filter((f) => f.endsWith('.md'))) {
  cpSync(join(src, 'registries', f), join(out, 'registries', f));
}

writeFileSync(
  join(out, 'SOURCE.json'),
  JSON.stringify({ repository: 'stackumi/restact-specs', commit, date }, null, 2) + '\n',
);
console.log(`sync-spec: copied from ${src} @ ${commit.slice(0, 7)} (${date})`);
