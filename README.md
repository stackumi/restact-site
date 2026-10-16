# restact.org · restact.dev

The placeholder splash page for REST:ACT: the mark and the wordmark on the slate ground, nothing
else, until the protocol's site is ready. One static Astro page; no server runtime. It is the
sibling of the stackumi.com placeholder and is built the same way.

## Run

```sh
pnpm install
pnpm dev      # http://localhost:4321
pnpm build    # writes dist/
```

Node 22+ and pnpm 10 (`corepack enable` installs the pinned pnpm from `package.json`).

## Deploy (Cloudflare Workers, static assets)

`wrangler.jsonc` deploys `dist/` as static assets with no Worker script. Wrangler runs
`pnpm run build` itself before uploading. In the Worker's build settings in the Cloudflare
dashboard:

| Setting | Value |
|---|---|
| Build command | empty (or `pnpm build`; harmless) |
| Deploy command | `npx wrangler deploy` |
| Worker name | `restact-site` (must match `name` in `wrangler.jsonc`) |
| Node version | `22` (read from `.node-version`) |

**Keep `wrangler.jsonc`.** Without it, `wrangler deploy` runs its framework autoconfig, which adds
`@astrojs/cloudflare` (`astro add cloudflare`) and builds through the adapter. In October 2026 that
failed with "Failed to get static paths from the Cloudflare prerender server … getAllWithMetadata
is not a function", and a static page has no use for the adapter anyway.

Add **both** `restact.org` and `restact.dev` as custom domains on the Worker (Settings → Domains &
Routes); they serve the same page. When the site goes public, pick one as canonical and redirect
the other to it (a Cloudflare redirect rule), so search engines see a single site.

`public/robots.txt` and the page's `noindex` meta keep the placeholder out of search engines; remove
both when the site goes public.

## Identity

The mark, wordmark, colours and motion follow `docs/design/restact-visual-identity.md` in the
restact repository (with the SVG originals in `docs/images/`). The wordmark is Space Grotesk Bold
converted to outlines, so no font is loaded at runtime. The mark's two lit tiles rise once when the
page first paints, and not at all under reduced motion.
