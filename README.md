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

## Deploy (Cloudflare Pages)

Connect this repository in the Cloudflare dashboard with:

| Setting | Value |
|---|---|
| Framework preset | Astro |
| Build command | `pnpm build` |
| Build output directory | `dist` |
| Node version | `22` (read from `.node-version`) |

Add **both** `restact.org` and `restact.dev` as custom domains on the one Pages project; they
serve the same page. When the site goes public, pick one as canonical and redirect the other to it
(a Cloudflare redirect rule), so search engines see a single site.

`public/robots.txt` and the page's `noindex` meta keep the placeholder out of search engines; remove
both when the site goes public.

## Identity

The mark, wordmark, colours and motion follow `docs/design/restact-visual-identity.md` in the
restact repository (with the SVG originals in `docs/images/`). The wordmark is Space Grotesk Bold
converted to outlines, so no font is loaded at runtime. The mark's two lit tiles rise once when the
page first paints, and not at all under reduced motion.
