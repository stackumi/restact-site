// Copies the specification sources from a checkout of stackumi/restact (the specification
// repository, named restact-specs until 2026-10-29; the local checkout keeps that name) into
// src/content/spec/, so the Cloudflare build needs no sibling checkout. Run by a human when the
// specification changes, then commit the result:
//
//   corepack pnpm sync:spec [path-to-spec-checkout]      (default: ../restact-specs)
//
// The vendored copies are not edited, with one exception: each draft's front matter (the protocol
// draft and the presentation draft) keeps only the `ins:` line of its author list, so no address enters this repository (a scan of every copied .md
// file for an address then fails the sync as a second guard). The author stays
// `ins: N. Byrd`. SOURCE.json records the commit the copies came from.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const src = resolve(process.argv[2] ?? join(root, '..', 'restact-specs'));
const out = join(root, 'src', 'content', 'spec');

const DRAFT = 'draft-byrd-restact-protocol-00.md';
const PRESENTATION = 'draft-byrd-restact-presentation-00.md';
for (const f of [DRAFT, PRESENTATION]) {
  if (!existsSync(join(src, f))) {
    console.error(`sync-spec: ${join(src, f)} not found. Pass the path to a checkout of stackumi/restact.`);
    process.exit(2);
  }
}

const git = (...args) => execFileSync('git', ['-C', src, ...args], { encoding: 'utf8' }).trim();
const commit = git('rev-parse', 'HEAD');
const date = git('log', '-1', '--format=%cI');
if (git('status', '--porcelain', '--', DRAFT, PRESENTATION, 'registries')) {
  console.error('sync-spec: the source checkout has uncommitted changes in the spec files; commit or stash them first.');
  process.exit(2);
}

// Strip the author's name and address from a draft's front matter (the first `---` ... `---` block).
// Inside the top-level `author:` list only `author:`, `-` and `ins:` lines survive, so any other
// key (name, email, org, uri, phone, a second author's address) is dropped rather than copied.
// Nested `author:` keys (inside a reference) are indented and stay as written.
function stripAuthor(file) {
  const draft = readFileSync(join(src, file), 'utf8');
  const end = draft.startsWith('---\n') ? draft.indexOf('\n---', 4) : -1;
  if (end === -1) {
    console.error(`sync-spec: no YAML front matter found in ${file}; nothing was written or removed.`);
    process.exit(1);
  }
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
  return front + draft.slice(end);
}
const drafts = [DRAFT, PRESENTATION].map((f) => [f, stripAuthor(f)]);

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'registries'), { recursive: true });
for (const [f, text] of drafts) writeFileSync(join(out, f), text);
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
  JSON.stringify({ repository: 'stackumi/restact', commit, date }, null, 2) + '\n',
);
console.log(`sync-spec: copied from ${src} @ ${commit.slice(0, 7)} (${date})`);
