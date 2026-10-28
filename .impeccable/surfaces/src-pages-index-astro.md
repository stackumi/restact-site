---
version: 1
slug: "src-pages-index-astro"
primary_target: "src/pages/index.astro"
related_targets: ["src/layouts/Base.astro","src/components/Header.astro","src/components/Footer.astro","src/styles/tokens.css","src/pages/spec/index.astro","src/pages/start.astro"]
---

## Scope

The home page (`src/pages/index.astro`) and the site frame every page shares (`Base.astro`, `Header.astro`,
`Footer.astro`, `tokens.css`, `global.css`). Mode: **Read**. The visitor is one of three equal audiences
(PRODUCT.md): a protocol reviewer, an API platform builder, or an agent-tooling developer. Job: understand what
REST:ACT is in one screen, see the mechanism, then take the path for their role.

## Direction contract

THESIS: A calm documentation hub for a protocol proposal, in the a2a-protocol.org register: one committed brand
colour in the masthead and white reading space beneath it. It refuses the landing-page arrangement the old home
used (status pill, two-tone slogan H1, stat strip, eyebrows, numbered cards, closing CTA card, teal on near-black).

OWN-WORLD: A deep petrol masthead band (#0b5560 in light) with a white wordmark and nav. Beneath it, a pale-petrol
tagline bar. Then white, near-black ink (#172022) and hairline rules (#e4e8e8 / #d6dcdc), with no boxes around
sections. Petrol is the only hue: it marks links, focus rings, GET and verbs in the demo. Rust (#9c3f16) appears
only on POST. Public Sans for headings, UI and body; JetBrains Mono only for code, paths and identifiers.

STORY: The visitor reads the draft's title and a two-paragraph abstract that says what REST:ACT is. They watch one
object answer four requests, which shows how the URL carries the verb. They pick their next step from three
reader-grouped link lists, learn the four uses and the six-item mandatory core, and see a verb built, uploaded and
called.

FIRST VIEWPORT: Masthead (wordmark left, NAV + GitHub + theme toggle right; a Menu button below 940px, the narrowest width at which that row fits on one line). Tagline bar: "Let users
and their agents add the functions an API doesn't have." on the left, "An open-source protocol and reference
server." on the right in quieter ink. One left-aligned column: the H1 is the draft title at about 46px over three
lines, then the abstract at 19px in a 62ch measure. Nothing sits beside the opening; it is the single entry point.
A hairline with 32px either side, then "One object, four requests" and the top of the AnatomyDemo at 1440×900.
The primary actions are the reader-grouped links that follow the demo.

FORM: Docs portal, #3 on the grounded list (IETF document, W3C TR, docs portal, standards sheet, HTTP exchange,
preprint, plain page). The roll's assigned lead was #5 (HTTP exchange, built as option B); the owner chose the
docs portal from four rendered previews. seed:cf2bf458fbb289bc

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Decisions recorded with the owner

- The single-column opening came from the owner: side-by-side title and demo gave two competing focal points.
- Section rhythm: 32px above and below each hairline (28px on phones).
- The status line ("Written as an individual Internet-Draft…") is off the home page by owner choice. Draft status
  still appears on the specification pages.
- "Open-source" holds at publish: restactd and restact-specs become public and licensed then.
- Narrow screens get a Menu disclosure button with 48px rows inside the masthead.
- Light is the default for every visitor; dark is opt-in through the header toggle only (owner, after review).
- The footer is one quiet row: restact-specs, restactd, restactd documentation, and the docname (owner, after
  review). The sitemap columns duplicated the header nav.
- /spec/ and /start/ follow the same hairline register as the home page: no boxed sections or tile walls.

## Unresolved

- Feedback channel (PRODUCT.md open decision): the home page shows an unlinked placeholder.
