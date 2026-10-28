---
name: REST:ACT
description: The proposal and documentation site for the REST:ACT protocol, a documentation hub in the register of a standards body.
colors:
  petrol: "#0b5560"
  petrol-deep: "#073f47"
  petrol-tint: "#e8f1f1"
  on-petrol: "#ffffff"
  rust: "#9c3f16"
  paper: "#ffffff"
  footer-band: "#f2f4f4"
  code-ground: "#f5f7f7"
  code-strip: "#eef2f2"
  hairline: "#e4e8e8"
  rule: "#d6dcdc"
  rule-strong: "#a8b2b3"
  ink: "#172022"
  ink-2: "#3d494c"
  ink-3: "#5a6669"
  selection: "#c9e0e0"
  good: "#1b6e45"
  warn: "#855400"
  danger: "#b02a24"
  dark-petrol-band: "#0a4952"
  dark-petrol-tint: "#112b2f"
  dark-ground: "#0e1b1e"
  dark-footer-band: "#0b1618"
  dark-code-ground: "#0a1517"
  dark-hairline: "#1c3034"
  dark-rule: "#263d41"
  dark-rule-strong: "#3d5a5e"
  dark-ink: "#e2ebeb"
  dark-ink-2: "#b0c0c1"
  dark-ink-3: "#8fa1a3"
  dark-signal: "#6cc3cb"
  dark-signal-hover: "#9dd8dd"
  dark-rust: "#ea9067"
typography:
  display:
    fontFamily: "Public Sans Variable, Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(32px, 3.4vw, 46px)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Public Sans Variable, Public Sans, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.008em"
  title:
    fontFamily: "Public Sans Variable, Public Sans, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0em"
  lede:
    fontFamily: "Public Sans Variable, Public Sans, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.65
  body:
    fontFamily: "Public Sans Variable, Public Sans, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Public Sans Variable, Public Sans, system-ui, sans-serif"
    fontSize: "14.5px"
    fontWeight: 400
    lineHeight: 1.5
  code:
    fontFamily: "JetBrains Mono Variable, JetBrains Mono, ui-monospace, SF Mono, Menlo, Consolas, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
spacing:
  gutter: "clamp(20px, 3vw, 32px)"
  measure: "1168px"
  docs-measure: "1360px"
  section: "32px"
  section-phone: "28px"
  section-last: "72px"
  list-row: "18px"
  column-gap: "56px"
components:
  masthead:
    backgroundColor: "{colors.petrol}"
    textColor: "{colors.on-petrol}"
    height: "64px"
  tagline-bar:
    backgroundColor: "{colors.petrol-tint}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    padding: "10px"
  button-primary:
    backgroundColor: "{colors.petrol}"
    textColor: "{colors.on-petrol}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.petrol-deep}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  code-block:
    backgroundColor: "{colors.code-ground}"
    textColor: "{colors.ink-2}"
    typography: "{typography.code}"
    rounded: "{rounded.lg}"
    padding: "16px 20px"
  code-strip:
    backgroundColor: "{colors.code-strip}"
    textColor: "{colors.ink-3}"
    height: "40px"
  footer:
    backgroundColor: "{colors.footer-band}"
    textColor: "{colors.ink-2}"
    padding: "22px"
---

# Design System: REST:ACT

## Overview

**Creative North Star: "The Standards Sheet Under a Petrol Masthead"**

The site reads as the documentation hub for a protocol proposal, not a product launch. One committed brand colour, a deep petrol, fills the sticky masthead; a pale petrol tagline bar sits under it; then the page is white reading space in near-black ink, divided by hairline rules. Sections carry no boxes, bands or tiles: a 1px hairline with equal space above and below is the only section device. The register follows a2a-protocol.org and W3C/IETF documents: a left-aligned column, the draft title as the H1, plain paragraphs, ruled link lists.

Density is moderate and textual. Petrol is the only hue in the interface; it marks the masthead, links, focus rings, GET and verbs in examples. Rust appears only where a request writes (POST). Everything else is ink at three weights, white, and grey-green hairlines. Code is set in JetBrains Mono on a faintly tinted ground; prose, headings and UI share one face, Public Sans.

Light is the site's look and the default for every visitor; dark is an opt-in through the masthead toggle and never follows the OS preference. The old dark, teal, Space Grotesk landing-page look (status pill, two-tone slogan H1, stat strip, eyebrows, numbered feature cards, closing CTA card) is the confirmed anti-reference.

**Key Characteristics:**
- A petrol masthead band and pale-petrol tagline bar frame every page except the home page, which sets the tagline in its opening; below them, only white, ink and hairlines.
- Sections are separated by a single hairline with 32px either side (28px on phones), never by boxes or grey bands.
- One sans family for everything readable; mono only for code, paths, identifiers and the docname.
- Link lists are ruled rows (title link plus a one-line note), not cards.
- Light by default; dark is a deliberate, stored choice.

## Colors

A one-hue palette: petrol for brand and signal, rust for writes, and a cool grey-green neutral ramp for everything else.

### Primary
- **Deep Petrol** (`petrol`): the masthead band, links, focus outlines, keywords in highlighted code, GET and the verb colon in requests, the primary button. In light it is both `--brand` and `--signal`.
- **Petrol Shadow** (`petrol-deep`): link hover and the darkened primary button.
- **Pale Petrol** (`petrol-tint`): the tagline bar under the masthead, current side-nav item, pressed rows and copy-button hover.

### Secondary
- **Rust** (`rust`): POST, and nothing else. Method labels, the rule under an action in the request demo, `‹…›` spans in terminal transcripts.

### Neutral
- **Paper** (`paper`): page ground and surfaces.
- **Footer Band** (`footer-band`): the footer row only.
- **Code Ground / Code Strip** (`code-ground`, `code-strip`): code blocks and the label strip above them, table heads in docs prose.
- **Hairline** (`hairline`): section rules and list-row separators.
- **Rule** (`rule`): borders of the few framed objects (code blocks, callouts), heading underlines in link groups, table heads.
- **Strong Rule** (`rule-strong`): secondary-button border, inactive markers, scrollbar thumb.
- **Ink / Ink 2 / Ink 3** (`ink`, `ink-2`, `ink-3`): headings and primary text; leads, notes and code; captions, metadata, the docname and secondary tagline line.
- **Status tones** (`good`, `warn`, `danger`): callout tones and status words only, tinted at 6% for grounds and 35% for borders. Never decoration.

### Dark (opt-in)
The dark theme keeps the same roles: band `dark-petrol-band`, tint `dark-petrol-tint`, ground `dark-ground`, ink ramp `dark-ink` to `dark-ink-3`, hairlines `dark-hairline` / `dark-rule` / `dark-rule-strong`. Signal lifts to a light petrol (`dark-signal`, hover `dark-signal-hover`) and rust to `dark-rust` for contrast.

### Named Rules
**The One Hue Rule.** Petrol is the only interface hue. If a new element wants colour, it is a link, a focus state or a GET; otherwise it is ink.

**The Rust Means Write Rule.** Rust marks POST and action verbs. It is never a highlight, a badge colour or an accent.

**The Light Default Rule.** Light is the default for every visitor. Dark is chosen through the toggle and remembered; the OS preference is not consulted.

## Typography

**Display Font:** Public Sans (variable; fallback system-ui, Segoe UI, sans-serif)
**Body Font:** Public Sans
**Label/Mono Font:** JetBrains Mono (variable; fallback ui-monospace, SF Mono, Menlo, Consolas), ligatures off, tabular figures

**Character:** a sober government-grade grotesque for every word a person reads, and a plain coding mono for every string a machine reads.

### Hierarchy
- **Display** (700, clamp 32–46px, 1.12, -0.015em): the one H1 per page, max 22ch on the home page so the draft title breaks over three lines.
- **Headline** (700, 28px / 24px on phones, 1.2, -0.008em): section H2s; docs prose H3 is 21px.
- **Title** (700, 17px, 0 tracking): H3 above a ruled link group, with a `rule` underline.
- **Lede** (400, 19px, 1.65, 62ch): the opening abstract; section leads are 18px in `ink-2` (17px on phones).
- **Body** (400, 17px / 16px under 720px, 1.6; docs prose 1.68): running text, 68ch measure.
- **Label** (400–600, 13–15px): tagline bar (14.5px), nav (500, 15px), footer (15px), metadata rows.
- **Code** (400, 14px, 1.6): code blocks; inline code at 0.88em; strip labels and copy button 12px.

### Named Rules
**The Machine Strings Rule.** Mono marks code, URLs, paths, identifiers, BCP 14 keywords and the docname. Prose, headings and buttons are never mono.

**The Sentence-Case Rule.** Headings, nav and labels are sentence case at normal tracking. No uppercase tracked labels.

## Layout

A single left-aligned column inside a 1168px measure plus a `clamp(20px, 3vw, 32px)` gutter; the docs layout widens the frame to 1360px for its side nav, article and table of contents. Text runs at 62–68ch; demos and code sit at 800–880px max.

Every full-width page is a stack of sections, each opened by a 1px `hairline` with 32px above and below (28px under 720px); the last section leaves 72px (56px on phones) before the footer. The opening section has 64px above it (40px on phones). Grouped links run in three columns with a 56px column gap, falling to two at 1080px and one at 720px. Ruled list rows take 13–18px vertical padding.

The masthead is sticky at 64px (68px under 1000px) and anchors scroll with that clearance. Below 1000px the nav folds behind a Menu button and opens inside the band as 48px rows; without JavaScript it wraps under the wordmark. The tagline bar scrolls away; its second line wraps under the first below 860px. The footer is one row: source and documentation links left, docname right.

### Named Rules
**The Hairline Section Rule.** A section begins with one hairline and 32px either side. No background bands, no boxed sections, no alternating fills.

**The Single Entry Rule.** The opening is one column: title, then abstract. Nothing sits beside it.

## Elevation & Depth

Flat. There are no drop shadows anywhere in the system; depth is conveyed only by the petrol band against white, the tinted code ground, and hairlines. The only shadow-like value is an inset 1px `hairline` ring behind inline code in docs prose. Hover changes colour or border, never lift.

### Named Rules
**The Flat Page Rule.** Nothing floats. A state change is a colour, underline or border change.

## Shapes

Corners are small and functional: 4px for small controls (toggle, copy button, side-nav items, chips), 6px for buttons and inputs, 8px for the few framed objects (code blocks, callouts, docs-prose tables, the draft's header card, pagers). Borders are 1px throughout; the current nav item carries a 2px underline. Lists, tables and sections are open: rules above or below rows, no surrounding frame.

## Components

### Masthead
- **Style:** petrol band, white wordmark "REST:ACT" (700, 20px, +0.02em), nav at 500 / 15px with 26px gaps, GitHub as the last nav item, theme toggle at the right.
- **States:** hover adds a 1px underline; the current section has a 2px underline (`aria-current`). Focus outlines turn white inside the band. Menu and toggle hover is a 10% white wash.
- **Mobile:** below 1000px, wordmark, toggle and a "Menu" button (three bars that cross into a close mark) share one row; the open nav is full-width 48px rows split by translucent white rules.

### Tagline Bar
Pale petrol strip with a `rule` bottom border, 14.5px: the protocol's purpose left in `ink-2`, the project scope right in `ink-3`. The home page turns it off (`<Base tagline={false}>`) and sets the same two sentences as a 23px dek (20px on phones) between the H1 and the abstract, the scope sentence in `ink-3`, followed by one plain link per reader.

### Links
Petrol with a 1px underline at 35% opacity, offset 0.22em, firming to full and darkening on hover (120ms). Navigation lists drop the underline.

### Buttons
- **Shape:** gently rounded (6px), 48px tall (44px inside the draft card), 20px side padding, 600 / 16px.
- **Primary:** petrol fill, white text, 700; hover darkens the fill 18% toward black.
- **Secondary:** paper ground, `rule-strong` border, ink text; hover darkens the border to `ink-3`.
- Buttons are rare: the reading path is links. They appear on the draft card and the specification hub.

### Ruled Link Lists (signature)
The home page's reader groups and /start/'s columns: an optional 17px H3 over a `rule` underline, then rows of a 600-weight link and a 16px `ink-2` note, each row closed by a `hairline`. Untitled groups start on a `rule`. The mandatory-core list, the uses list, /spec/'s metadata rows and section table, and /start/'s endpoint list use the same row grammar.

### Code Blocks
- **Frame:** `rule` border, 8px radius, `code-ground`, no shadow, no window controls.
- **Strip:** 40px `code-strip` bar with a mono 12px label (filename, or "shell" for terminals) and a text "Copy" button that appears only with JavaScript.
- **Highlighting:** keywords in signal; strings, functions and constants in ink; everything else `ink-2`; comments `ink-3`. Terminal transcripts mark prompts (not copied), signal colons and bright output.
- **Long lines:** terminal blocks wrap at the box edge at every width, continuation lines indented 2ch so each command starts at the margin. Other blocks scroll sideways, with a soft shadow on the edge that hides more code; `wrap` makes one wrap from 640px up.

### Callouts
`note` (petrol), `warn` and `danger` tones: 1px border at 35% tone, ground at 6% tone, 8px radius, bold ink title, 15.5px body.

### Theme Toggle
44×44 transparent button in the masthead with a line-drawn half-filled circle (1.7 stroke). Its label names the theme a press switches to.

### Footer
`footer-band` ground with a `rule` top border, one 22px-padded row: restact-specs, restactd and restactd documentation links (44px targets) left, the docname in 13.5px mono `ink-3` right.

## Do's and Don'ts

### Do:
- **Do** open every section with one hairline and 32px either side (28px on phones).
- **Do** keep petrol the only hue: links, focus, GET, verbs, the masthead.
- **Do** reserve rust for POST and action verbs.
- **Do** set code, paths, identifiers and the docname in JetBrains Mono, everything else in Public Sans.
- **Do** present next steps as ruled link lists with a one-line note under each link.
- **Do** keep light the default and dark an opt-in stored by the toggle.
- **Do** give every interactive target at least 44px of hit area (48px for menu rows and buttons).

### Don't:
- **Don't** box sections, add grey or tinted section bands, or build tile walls; frames belong only to self-contained objects: code blocks, callouts, the request demo, docs-prose tables, the draft card and docs pagers.
- **Don't** use drop shadows or hover lift.
- **Don't** put a label, kicker or eyebrow above a heading, or use uppercase tracked labels.
- **Don't** use a status pill, two-tone headline, stat strip, numbered feature cards or a closing call-to-action card.
- **Don't** add a second accent hue; status tones are for callouts and status words only.
- **Don't** draw window dots or other chrome on code blocks.
- **Don't** follow the OS colour-scheme preference.
