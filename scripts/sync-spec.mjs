// Copies the specification sources from a checkout of stackumi/restact-specs into
// src/content/spec/, so the Cloudflare build needs no sibling checkout. Run by a human when the
// specification changes, then commit the result:
//
//   corepack pnpm sync:spec [path-to-restact-specs]      (default: ../restact-specs)
//
// The vendored copies are not edited, with one exception: the draft's front matter keeps only the
// `ins:` line of its author list, so no address enters this repository (a scan of every copied .md
// file for an address then fails the sync as a second guard). The author stays
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

// Strip the author's name and address from the front matter (the first `---` ... `---` block).
// Inside the top-level `author:` list only `author:`, `-` and `ins:` lines survive, so any other
// key (name, email, org, uri, phone, a second author's address) is dropped rather than copied.
const draft = readFileSync(join(src, DRAFT), 'utf8');
const end = draft.startsWith('---\n') ? draft.indexOf('\n---', 4) : -1;
if (end === -1) {
  console.error('sync-spec: no YAML front matter found in the draft; nothing was written or removed.');
  process.exit(1);
}
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'registries'), { recursive: true });

let inAuthor = false;
const front = draft
  .slice(0, end)
  .split('\n')
  .flatMap((l) => {
    if (/^author:\s*$/.test(l)) {
      inAuthor = true;
      return [l];
    }
    if (/^\S/.test(l) && !/^-(\s|$)/.test(l)) inAuthor = false; // the next top-level key ends the author list
    if (!inAuthor) return [l];
    if (/^\s*-\s+ins:/.test(l)) return [l]; // compact form: `- ins: N. Byrd`
    if (/^\s*-\s*$/.test(l) || /^\s*ins:/.test(l)) return [l];
    if (/^\s*-\s+\S/.test(l)) return [l.replace(/^(\s*-).*$/, '$1')]; // `- name: ...` keeps only the list marker
    return [];
  })
  .join('\n');
writeFileSync(join(out, DRAFT), front + draft.slice(end));

cpSync(join(src, 'presentation-verbs.md'), join(out, 'presentation-verbs.md'));
for (const f of readdirSync(join(src, 'registries')).filter((f) => f.endsWith('.md'))) {
  cpSync(join(src, 'registries', f), join(out, 'registries', f));
}

// Guard: no vendored file may contain an email address (the same pattern check-site uses).
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)*\.[A-Za-z]{2,}\b/;
const scan = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) scan(p);
    else if (e.name.endsWith('.md')) {
      const hit = readFileSync(p, 'utf8').match(EMAIL);
      if (hit) {
        console.error(`sync-spec: ${p} contains an email address ("${hit[0]}"); removed the output. Strip it at the source or extend the filter.`);
        rmSync(out, { recursive: true, force: true });
        process.exit(1);
      }
    }
  }
};
scan(out);

writeFileSync(
  join(out, 'SOURCE.json'),
  JSON.stringify({ repository: 'stackumi/restact-specs', commit, date }, null, 2) + '\n',
);
console.log(`sync-spec: copied from ${src} @ ${commit.slice(0, 7)} (${date})`);
