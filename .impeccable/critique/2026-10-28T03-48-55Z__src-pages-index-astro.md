---
target: "the REST:ACT home page"
total_score: 26
max_score: 36
na_heuristics: 9
p0_count: 0
p1_count: 1
target_identity: "file:/home/chris/code/restact-site/src/pages/index.astro"
target_fingerprint: "sha256:1dd3e0d478b271084ec0790e2dc7d2c9bcb51844cc726b935e09b189adf7c81a"
target_path: /home/chris/code/restact-site/src/pages/index.astro
timestamp: 2026-10-28T03-48-55Z
slug: src-pages-index-astro
---
Method: dual-agent (A: design review · B: detector + browser evidence)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Demo state clear, height stable; pressed row close to hover |
| 2 | Match System / Real World | 3 | "host interfaces it imports", "object tree", "Presentation verbs" undefined |
| 3 | User Control and Freedom | 3 | Menu Escape/outside/focus-out close; theme persists |
| 4 | Consistency and Standards | 2 | "Implement a server" → /how-it-works/; example /v1/modules upload vs abstract's object-tree path |
| 5 | Error Prevention | 3 | Example assumes a running server; external links unmarked |
| 6 | Recognition Rather Than Recall | 3 | Terms defined in place; demo captions every part |
| 7 | Flexibility and Efficiency | 3 | Skip link, demo arrows, copy, deep links; no Left/Right/Home/End |
| 8 | Aesthetic and Minimalist Design | 3 | Calm; ~15 bold links in two sections; zigzag right edge at 1440 |
| 9 | Error Recovery | n/a | Static page |
| 10 | Help and Documentation | 3 | Reader routing; no comment channel (known) |
| **Total** | | **26/36** | **Good (72%)** |

## Design Specificity Verdict
LLM: AnatomyDemo and the draft-anchored core list are authored; the frame is interchangeable; wordmark colon unlit. Round-1 fixes praised (stable demo, phone wrap, aria-labels, focus rings, no overflow).
Deterministic: browser overlay clean on / at 1440 and 390 (nested-cards gone). CLI index.astro 4 advisories, all false positives (documented in DESIGN.md prose, absent from frontmatter tokens). components 32 (side-tab on BudgetFigure is a false positive). True: line-length on /start/ warn callout (~114ch) and /how-it-works/ column (~74–77ch).

## Priority Issues
- [P1, conflicts with owner decision] Demo below the fold at every width (y≈840/900 at 1440, 1085/844 at 390). Reviewer's two-column fix was rejected by the owner earlier; single-column alternative: on phones move the second abstract paragraph below the demo. /impeccable layout
- [P2] Opening links don't match destinations or group names: "Implement a server" → /how-it-works/; "Run restactd" and "Get started" both → /start/. Fix: point at /spec/, align phrasing with ReaderGroups. /impeccable clarify
- [P2] Example vs abstract vs demo: POST /v1/modules?verb=text:wordCount (restactd deployment profile) vs "uploads to a path in the object tree" vs notes/42:wordCount; no "server must be running" line. Needs owner call on wording. /impeccable clarify
- [P2] Terminal lines wrap only ≥640px (CodeBlock.astro:120); curl routes clipped at 570/390. Wrap at all widths with hanging indent; fade cue on Rust. /impeccable adapt
- [P3] "Where to go next" is section 2 of 7; page ends on "Feedback link: to be decided". Move reader groups to the close. /impeccable layout

## Persona Red Flags
Jordan: formal H1; undefined terms; "Presentation verbs"; icon-only toggle; demo rows look static. Riley: upload-path and binding inconsistencies; Left/Right no-ops; Tab Menu→toggle below 1000px (intentional). Casey: demo 1.3 screens down; lone "Run restactd" at fold; clipped curl; 49×32 copy buttons. Priya (protocol reviewer): docname only in footer; no comment channel; paraphrase reads as abstract; no .txt/.xml.

## Minor Observations
Dek breaks early at 570 under balance; pressed vs hover demo rows; verbose aria-live; uses item 4 fragment; no visible section anchors; zigzag right edge at 1440.

## Questions
Cover sheet or docs hub? End on "pick your path"? Colon as the brand?
