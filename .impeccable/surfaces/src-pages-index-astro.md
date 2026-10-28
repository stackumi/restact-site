---
version: 1
slug: "src-pages-index-astro"
primary_target: "src/pages/index.astro"
related_targets: ["src/layouts/Base.astro","src/components/Header.astro","src/components/Footer.astro","src/styles/tokens.css","src/styles/global.css"]
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
object answer four requests, which shows how the URL carries the verb. They learn the four uses and the six-item
mandatory core, see a verb built, uploaded and called, and close on three reader-grouped link lists and a note that
the comment channel is not chosen yet.

FIRST VIEWPORT: Masthead (wordmark left, NAV + GitHub + theme toggle right; a Menu button below 1000px, the narrowest width at which that row fits on one line). No tagline bar on
this page. One left-aligned column: the H1 is the protocol title, "The REST:ACT Protocol: APIs Their Clients Can Build On", at about 46px
over two lines (three on phones); then the tagline as a
23px dek, "Let users and their agents add the functions an API doesn't have." with "An open-source protocol and
reference server." in quieter ink; then the abstract at 19px in a 62ch measure; then one plain link per reader:
Review the protocol (the draft), Implement a server (/spec/), Write and call verbs (/start/), named as the
closing reader groups name them. Nothing sits beside the opening; it is the single entry point.
A hairline with 32px either side, then "How the server reads a request" and the top of the AnatomyDemo at 1440×900.
The primary actions are the three reader links in the opening and the reader groups that close the page.

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
- After the 2026-10-28 critique (owner chose all five issues except restoring the status line): the home page
  opening gains the tagline as a dek and three reader links, the tagline bar is off on the home page, "Get
  started" joins NAV (so the Menu breakpoint moves to 1000px), and the request demo is flattened onto the
  4/6/8px corner scale. Draft status stays off the home page by owner choice.
- After the second 2026-10-28 critique (owner chose link labels and targets, phone code wrapping and section
  order; not the reviewer's two-column opening, which the owner had already rejected): the reader links are
  renamed after the groups and "Implement a server" goes to /spec/; terminal blocks wrap at every width with a
  hanging indent and scrolling blocks shade their hidden edge; the reader groups move to the close with the
  comments note under them. The example uploads through `POST /v1/modules`, the draft's reference deployment
  profile, and its intro now says so and that restactd must be running.
- Creating a verb stays out of the request demo (owner, 2026-10-28): its URL is the deployment endpoint, not the
  object's own address, and showing it for both verbs made the panel long. The demo is headed "How the server
  reads a request", and the end-to-end example creates and calls `notes/42:wordCount`, the verb the demo calls.
- Owner copy edits (2026-10-28): the title becomes "The REST:ACT Protocol: APIs Their Clients Can Build On" (the
  draft in restact-specs still carries the old title until it is changed there and re-synced); the abstract's first
  sentence says clients add their own code within the permissions the server grants; "What it is for" opens with
  "A few examples of what client-extensible APIs make possible:".

## Unresolved

- Feedback channel (PRODUCT.md open decision): the home page shows an unlinked placeholder.
