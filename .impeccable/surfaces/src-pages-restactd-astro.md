---
version: 1
slug: "src-pages-restactd-astro"
primary_target: "src/pages/restactd.astro"
related_targets: ["src/components/InRestactd.astro","src/pages/spec/index.astro","src/pages/start.astro"]
---

## Scope

`/restactd/` (`src/pages/restactd.astro`), the reference server's page on this site, and the restactd links it
anchors across the site: the `restactd` NAV item, the fourth opening link on the home page, the "In restactd"
sections that close the protocol pages (`InRestactd.astro`), the "Implementation and tests" section on /spec/,
and /start/ framed as a restactd walk-through. Mode: **Read**. The visitor wants to know what restactd is, how far
along it is, and where in its documentation to go next; an implementer also wants to test their own server.

## Direction contract

THESIS: The implementation's counterpart to the specification hub, in the same hairline register. It does not
copy the restactd documentation: that stays in the restactd repository, versioned with the code and its generated
diagrams, and this page routes into it.

OWN-WORLD: Inherited unchanged from DESIGN.md (petrol masthead, white reading space, hairline sections, Public Sans
with JetBrains Mono for machine strings).

STORY: The H1 "restactd, the reference server", a pronunciation line in quieter ink, a two-sentence lede, then
three buttons: Get started (primary), Documentation, Source on GitHub. "At a glance" is ten unruled
term and value rows taken from the restactd README and docs. "Documentation" is six titled link groups into the
docs site (#docs, which /start/ links to). "Test a server against the draft" shows the one conformance script and
how to point the suite elsewhere. It closes on "Also in the repository" in two untitled columns.

FIRST VIEWPORT: Tagline bar, H1, pronunciation, lede, buttons, and the start of "At a glance" at 1440×900.

FORM: Extension of the established docs portal; no concept round (a hub page in an existing world, structured
like /spec/).

## Decisions recorded with the owner

- 2026-10-28: link to the restactd documentation rather than moving it into this site; give restactd its own page,
  a NAV item, a home page link, an "In restactd" close on each protocol page and an entry on /spec/. The docs stay
  at `DOCS_SITE_URL` (stackumi.github.io/restactd) until a custom domain is set up.
- Adding `restactd` to NAV moved the Menu breakpoint from 1000px to 1080px, the narrowest width where the masthead
  row still fits on one line.
- verbsmith was renamed to `restact mcp`, a subcommand of the restact command line; links now go to
  `cli/docs/mcp/README.md` in restactd.
- The status line under the lede was removed (owner, 2026-10-28); the "Releases" row in "At a glance" still
  says no release is tagged yet.
- Row rules came off the page (owner, 2026-10-28) and then off link groups site-wide: link rows take space, records
  and tables keep hairlines (DESIGN.md, Headed Link Groups and the Records Rule; "At a glance" is a Fact List).

## Unresolved

- The docs site's custom domain (restactd.restact.org was proposed); change `DOCS_SITE_URL` when it exists.
- Facts on this page are copied from restactd's docs; re-check them when restactd tags its first release.
