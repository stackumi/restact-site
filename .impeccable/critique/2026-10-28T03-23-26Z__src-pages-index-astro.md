---
target: "the REST:ACT home page"
total_score: 25
max_score: 36
na_heuristics: 9
p0_count: 0
p1_count: 2
target_identity: "file:/home/chris/code/restact-site/src/pages/index.astro"
target_fingerprint: "sha256:adc7d47d873ddc6dfa90df83c8d0f3c5cf1785196b1626af0dcd72d9e6692523"
target_path: /home/chris/code/restact-site/src/pages/index.astro
timestamp: 2026-10-28T03-23-26Z
slug: src-pages-index-astro
closed: true
---
Method: dual-agent (A: design review · B: detector + browser evidence)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Demo state clear; draft status (-00, unsubmitted) absent from the page text |
| 2 | Match System / Real World | 3 | Real URLs explain it; "host interfaces it imports", "object tree" undefined |
| 3 | User Control and Freedom | 3 | Menu Escape/outside-click/focus-out work; skip link; theme persists |
| 4 | Consistency and Standards | 3 | Label drift (Security vs Security model); petrol = link and GET |
| 5 | Error Prevention | 3 | End-to-end example assumes restactd already on :8080 |
| 6 | Recognition Rather Than Recall | 3 | No in-page index on a 5,600px phone page |
| 7 | Flexibility and Efficiency | 2 | "Read the draft" is Tab stop 14 at y≈1440; Get started not in NAV |
| 8 | Aesthetic and Minimalist Design | 3 | Calm; two bands above content; empty right 40% at 1440 |
| 9 | Error Recovery | n/a | Static page, no inputs |
| 10 | Help and Documentation | 3 | Task-grouped routing; no search; feedback channel undecided |
| **Total** | | **25/36** | **Acceptable (69%)** |

## Design Specificity Verdict
LLM: content authored (AnatomyDemo, draft title, must-implement anchors, real cargo/curl); frame is the stock docs-hub kit; six sections share one shape; the colon is unused in the wordmark.
Deterministic: index.astro 2 advisories, layouts 2, components 35 (1 warning). Font-size advisories are false positives (documented in DESIGN.md prose, missing from frontmatter tokens); BudgetFigure side-tab is a false positive (bar divider). True: nested-cards on AnatomyDemo .explain (1440 and 390); AnatomyDemo radii 20/12/10px off the 4/6/8 scale; 11.5px captions below the 13px label floor; line-length ~145ch in /start/ warn Callout and ~97–99ch in the /how-it-works/ docs column. Overlay ran headless; not user-visible.

## Priority Issues
- [P1] No link in the first viewport at any width; "Get started" missing from NAV and the Menu. Fix: three audience links under the abstract; add Get started to NAV. /impeccable layout
- [P1] Draft status absent from the home page; the paraphrase under the draft title reads as its abstract. Conflicts with the owner's decision to remove the status line; lighter fix: link the footer docname, reword the paragraphs so they can't pass as the abstract. /impeccable clarify
- [P2] Theme toggle focus ring invisible in light mode: Header.astro:121 `.site-header :focus-visible` is scoped and does not reach ThemeToggle; falls back to petrol on petrol. /impeccable harden
- [P2] AnatomyDemo clips `GET /v1/notes/42:archive/meta` at 390 (.parts 331 vs 316); also nested card, 20/12/10px radii, 11.5px captions. /impeccable adapt, /impeccable polish
- [P2] Best one-liner sits in the 14.5px tagline strip; bands take 19% of a 390×844 screen before a five-line H1. /impeccable typeset

## Persona Red Flags
Jordan: RFC-style H1; demo buttons below the fold; no "just curious" path. Riley: example never starts the server; demo button names run together; no-JS toggle label wrong; ends on "to be decided". Casey: no link on first screen; demo at y≈1270; Get started absent from Menu; /meta clipped. Ines (protocol reviewer): no status/author/date; no § numbers; paraphrase as abstract; nowhere to send comments.

## Minor Observations
Demo top strip nearly empty; demo opens on request 2 of 4; use item 4 is a fragment; no operator rationale; nav GitHub ambiguous; dark band barely shifts; /start/ callout and /how-it-works/ column exceed 68ch.

## Questions
Open with the demo? Is "Where to go next" a hub or an exit? Built to be cited? Why doesn't the identity use the colon?
