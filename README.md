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
time from copies of the sources in `stackumi/restact` (the specification repository, named restact-specs
until 2026-10-29), committed under `src/content/spec/`
(the Cloudflare build needs no sibling checkout). `SOURCE.json` there records the source commit.
When the specification changes, a person runs

```sh
corepack pnpm sync:spec [path-to-spec-checkout]   # default ../restact-specs
corepack pnpm verify
```

and commits the result. The sync keeps only the `ins:` line of the draft's `author:` list (any
other key there is dropped), stops with an error if the draft has no front matter, and scans every
copied file for an email address, deleting its output and failing if it finds one. No address
enters this repository. `src/lib/specmd.ts` turns the kramdown-rfc draft and the plain
Markdown files into HTML (section numbering, `{#anchor}` ids, `{{xref}}` links, references,
BCP 14 keywords). `src/lib/spec-map.ts` holds the hand-written gists and core/optional tags for the
section map on `/spec/`; the build fails if the draft gains a top-level section with no entry.

### The restactd documentation, at /docs

`/docs/` is the restactd documentation (Astro Starlight), built in the restactd repository and
committed here as static files under `public/docs/` (stackumi/restactd#901). The build there bakes
`https://restact.org` and `/docs` into every link. To update it, a person runs

```sh
corepack pnpm sync:docs v0.1.0                     # a restactd release: its docs tarball and .sha256
corepack pnpm sync:docs ../restact                 # or a local restactd checkout, before the release asset exists
corepack pnpm verify
```

and commits the result. From a release, the sync refuses a tarball whose sha256 does not match the
release's. From a checkout, it runs restactd's docs gate there (`make docs-site-check`, which needs
Docker; `C4_EXPORT=skip` builds only, with diagram placeholders). It scans the copy for addresses
and names that must not be published, replaces `public/docs/` wholesale, and writes
`public/docs/SOURCE.json` (the release or commit, and a hash of the tree). `pnpm verify` recomputes
that hash, so a hand edit under `public/docs/` fails it. The docs carry their own `404.html`:
Cloudflare serves the nearest one, so a missing `/docs/…` page gets the docs' 404 and the rest of
the site keeps its own.

## Layout

| Path | What |
|---|---|
| `src/site.config.ts` | `INDEXABLE`, site constants, header `NAV`, docs side nav `DOCS_NAV`, `THEME_KEY` |
| `src/styles/tokens.css` | colour, type and spacing tokens, light (the default) and opt-in dark |
| `src/styles/global.css` | reset, shared utilities (`.container`, `.band`, `.btn`, `.card`, `.eyebrow`, `.h2`), code span classes, `.prose` |
| `src/layouts/Base.astro` | document shell: head, theme script, header, tagline bar, footer. Props `title`, `description`, `wide` |
| `src/layouts/Docs.astro` | docs page: side nav, article, on-this-page list, prev/next |
| `src/layouts/MdPage.astro` | maps MDX frontmatter onto `Docs.astro` |
| `src/components/` | Shell: Header, Tagline, ThemeToggle, Footer. Building blocks: CodeBlock, Tabs, Callout, MethodTag, SpecBody, SpecSideNav. Figures and demos: AnatomyDemo, Venn, BudgetFigure, UiMock, UiDocumentDemo, NodeFamilies, ResolutionWalk |
| `src/pages/spec/` | the specification hub, the draft, presentation verbs and registries pages |
| `scripts/` | `sync-spec.mjs` (vendor the specification sources), `sync-docs.mjs` (vendor the restactd docs), `check-site.mjs` (content checks), `vendored.mjs` (their shared scans) |
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

The theme is stored under the `restact-theme` key in `localStorage` (`light` or `dark`). With no
stored value the site is light, whatever the OS prefers: dark applies only after a visitor picks it.

## Going public

Search engines are kept out by one constant: `INDEXABLE` in `src/site.config.ts` (currently
`false`). It drives the `noindex` meta tag and the generated `/robots.txt` (`src/pages/robots.txt.ts`).
To go public, set it to `true`, run `corepack pnpm verify`, and deploy. There is no `public/robots.txt`.
Once `INDEXABLE` is true, robots.txt allows every crawler and names the sitemap.

Search and answer engines read these, all built from `site` in `astro.config.mjs` (`https://restact.org`):

- a canonical link and Open Graph tags on every page but the 404, with the preview image
  `public/og.png` (edit `scripts/og/og-image.html` and re-render it; the file says how);
- `/sitemap.xml`, listing every page from the page files;
- `/llms.txt`, a reading list for language models (`src/pages/llms.txt.ts`);
- schema.org JSON-LD on the home page, the draft and /restactd/ (the license joins it at launch).

`/.well-known/security.txt` (RFC 9116, `src/pages/.well-known/security.txt.ts`) names where to report a
vulnerability. Its `Expires` date must stay under a year away; renew it before it passes, or `pnpm verify` fails.

`pnpm verify` checks them all. Two things outside this repo must be done before launch, tracked
with the `pre-release` label: restact.dev and the www hosts redirect to restact.org (#7), and
Cloudflare lets search and AI crawlers through (#8).

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

Add `restact.org` as the custom domain on the Worker (Settings → Domains & Routes). `restact.dev`,
`www.restact.dev`, and `www.restact.org` `301`-redirect to `https://restact.org` via Cloudflare
Redirect Rules so search engines and AI crawlers see a single canonical site.

## Identity

The site frame is a petrol masthead band (`--brand`) with the name REST:ACT set as text, a
pale-petrol tagline bar under it, and white reading space with hairline rules. Petrol is the only
hue; rust marks POST. Public Sans sets headings, UI and body text, and JetBrains Mono sets only
code, paths and identifiers. Both are self-hosted from the fontsource packages. The SVG mark and
wordmark in `src/assets/` are not used by the site.
