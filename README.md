# restact.org · restact.dev

The REST:ACT website: a static Astro site (no adapter, no server runtime). Pages: the home page,
How it works, Security, Compare, Presentation verbs, Get started, the specification hub and the
rendered specification documents under `/spec/`, and a 404 page. The docs routes are listed in
`DOCS_NAV` in `src/site.config.ts`.

## Run

```sh
corepack pnpm install
corepack pnpm dev        # http://localhost:4321
corepack pnpm build      # writes dist/
corepack pnpm verify     # astro check, build, then scripts/check-site.mjs
```

Node 24+ and pnpm 12 (`corepack enable` installs the pnpm pinned in `package.json`).
`pnpm-workspace.yaml` keeps the lockfile in the one-document form that GitHub's dependency graph,
and so Dependabot, can read. It also carries the one-day supply-chain hold, which an install never
bypasses, and the rulings on dependency install scripts. Dependabot proposes updates weekly,
waiting out the same one-day hold.

`check-site.mjs` fails the build on banned words in prose, email addresses (in the built pages and in
the vendored `src/content/spec/` sources), strings that must not be published, a second `<h1>`, a
duplicate `id`, kramdown or template leftovers on the `/spec/` pages, a robots or `noindex` setting
that disagrees with `INDEXABLE`, and broken internal links or anchors. It prints the number of
pages checked and exits non-zero on any error.

The banned-word check skips the specification text itself, because the normative wording is not
ours to change. `SpecBody.astro` wraps exactly that text in `<!--verbatim-->` ... `<!--/verbatim-->`
markers and the check drops only that span, so our own copy on the same pages (the document card,
the hub, the page descriptions) is still checked. Meta descriptions are always checked.

## The specification pages

`/spec/`, `/spec/draft/`, `/spec/presentation-verbs/` and `/spec/registries/` are rendered at build
time from copies of the sources in `stackumi/restact-specs`, committed under `src/content/spec/`
(the Cloudflare build needs no sibling checkout). `SOURCE.json` there records the source commit.
When the specification changes, a person runs

```sh
corepack pnpm sync:spec [path-to-restact-specs]   # default ../restact-specs
corepack pnpm verify
```

and commits the result. The sync keeps only the `ins:` line of the draft's `author:` list (any
other key there is dropped), stops with an error if the draft has no front matter, and scans every
copied file for an email address, deleting its output and failing if it finds one. No address
enters this repository. `src/lib/specmd.ts` turns the kramdown-rfc draft and the plain
Markdown files into HTML (section numbering, `{#anchor}` ids, `{{xref}}` links, references,
BCP 14 keywords). `src/lib/spec-map.ts` holds the hand-written gists and core/optional tags for the
section map on `/spec/`; the build fails if the draft gains a top-level section with no entry.

## Layout

| Path | What |
|---|---|
| `src/site.config.ts` | `INDEXABLE`, site constants, header `NAV`, docs side nav `DOCS_NAV`, `FOOTER`, `THEME_KEY` |
| `src/styles/tokens.css` | colour, type and spacing tokens, dark default and light |
| `src/styles/global.css` | reset, shared utilities (`.container`, `.section`, `.btn`, `.card`, `.pill`, `.eyebrow`, `.h2`), code span classes, `.prose` |
| `src/layouts/Base.astro` | document shell: head, theme script, header, footer. Props `title`, `description`, `wide` |
| `src/layouts/Docs.astro` | docs page: side nav, article, on-this-page list, prev/next |
| `src/layouts/MdPage.astro` | maps MDX frontmatter onto `Docs.astro` |
| `src/components/` | Shell: Mark, Wordmark, Header, ThemeToggle, Footer. Building blocks: CodeBlock, Tabs, Callout, MethodTag, SpecBody, SpecSideNav. Figures and demos: AnatomyDemo, Venn, BudgetFigure, UiMock, UiDocumentDemo, NodeFamilies, ResolutionWalk |
| `src/pages/spec/` | the specification hub, the draft, presentation verbs and registries pages |
| `scripts/` | `sync-spec.mjs` (vendor the specification sources), `check-site.mjs` (content checks) |
| `src/lib/term.ts` | markup helper for hand-coloured terminal and JSON blocks |
| `src/lib/shiki-theme.mjs` | the highlighting theme, built from the CSS tokens |

### Adding a docs page

Write `src/pages/<slug>.mdx` with frontmatter and the shared adapter layout:

```mdx
---
layout: ../layouts/MdPage.astro
title: Security
description: One-sentence lead shown under the title and used as the meta description.
section: Protocol
chips: [Explanatory]
---
```

Then make sure the route is listed in `DOCS_NAV` in `src/site.config.ts`; the side nav, the prev/next
links read it. `check:content` does not read it: it checks every link in the built pages against `dist/`. Use `h2` and `h3` headings: they build the
on-this-page list. Components (`CodeBlock`, `Tabs`, `Callout`, `ResolutionWalk`) can be imported in
the MDX body.

### Theme

The theme is stored under the `restact-theme` key in `localStorage` (`dark` or `light`). With no
stored value the system preference applies.

## Going public

Search engines are kept out by one constant: `INDEXABLE` in `src/site.config.ts` (currently
`false`). It drives the `noindex` meta tag and the generated `/robots.txt` (`src/pages/robots.txt.ts`).
To go public, set it to `true`, run `corepack pnpm verify`, and deploy. There is no `public/robots.txt`.

## Deploy (Cloudflare Workers, static assets)

`wrangler.jsonc` deploys `dist/` as static assets with no Worker script. Its
`assets.not_found_handling` is `"404-page"`, so an unknown path gets `dist/404.html` (built from
`src/pages/404.astro`) with status 404; without it Cloudflare answers with a bare 404. Wrangler runs
`pnpm run build` itself before uploading. In the Worker's build settings in the Cloudflare
dashboard:

| Setting | Value |
|---|---|
| Build command | empty (or `pnpm build`; harmless) |
| Deploy command | `npx wrangler deploy` |
| Worker name | `restact-site` (must match `name` in `wrangler.jsonc`) |
| Node version | `24.22.0` (read from `.node-version`) |
| pnpm version | from `packageManager` in `package.json` (the build image's own pnpm switches to it) |

**Keep `wrangler.jsonc`.** Without it, `wrangler deploy` runs its framework autoconfig, which adds
`@astrojs/cloudflare` (`astro add cloudflare`) and builds through the adapter. In October 2026 that
failed with "Failed to get static paths from the Cloudflare prerender server … getAllWithMetadata
is not a function", and a static page has no use for the adapter anyway.

Add **both** `restact.org` and `restact.dev` as custom domains on the Worker (Settings → Domains &
Routes); they serve the same page. When the site goes public, pick one as canonical and redirect
the other to it (a Cloudflare redirect rule), so search engines see a single site.

## Identity

The mark, wordmark, colours and motion follow `docs/design/restact-visual-identity.md` in the
restactd repository (with the SVG originals in `docs/images/`). The wordmark is Space Grotesk Bold
converted to outlines, so it needs no font. Space Grotesk and JetBrains Mono for the page text are self-hosted from the fontsource packages. The mark's two lit tiles rise once per visit (a `sessionStorage` flag, read in the head script in
`Base.astro`), and not at all under reduced motion.
