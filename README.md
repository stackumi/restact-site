# restact.org · restact.dev

The REST:ACT website: a static Astro site (no adapter, no server runtime). The home page, the
"How it works" page and the shared layouts and components are in place; the remaining pages follow
the route plan in `src/site.config.ts` (`DOCS_NAV`).

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

`check-site.mjs` fails the build on banned words in prose, email addresses, strings that must not
be published, a second `<h1>`, a robots or `noindex` setting that disagrees with `INDEXABLE`, and
broken internal links or anchors. Routes that are planned but not built yet are reported as
warnings, one per route.

## Layout

| Path | What |
|---|---|
| `src/site.config.ts` | `INDEXABLE`, site constants, header `NAV`, docs side nav `DOCS_NAV`, `FOOTER`, `THEME_KEY` |
| `src/styles/tokens.css` | colour, type and spacing tokens, dark default and light |
| `src/styles/global.css` | reset, shared utilities (`.container`, `.section`, `.btn`, `.card`, `.pill`, `.eyebrow`, `.h2`), code span classes, `.prose` |
| `src/layouts/Base.astro` | document shell: head, theme script, header, footer. Props `title`, `description`, `wide` |
| `src/layouts/Docs.astro` | docs page: side nav, article, on-this-page list, prev/next |
| `src/layouts/MdPage.astro` | maps MDX frontmatter onto `Docs.astro` |
| `src/components/` | Mark, Wordmark, Header, ThemeToggle, Footer, CodeBlock, Tabs, Callout, MethodTag, AnatomyDemo, ResolutionWalk |
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
links and the `check:content` route list all read it. Use `h2` and `h3` headings: they build the
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

`wrangler.jsonc` deploys `dist/` as static assets with no Worker script. Wrangler runs
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
restact repository (with the SVG originals in `docs/images/`). The wordmark is Space Grotesk Bold
converted to outlines, so it needs no font. Space Grotesk and JetBrains Mono for the page text are self-hosted from the fontsource packages. The mark's two lit tiles rise once when the
page first paints, and not at all under reduced motion.
