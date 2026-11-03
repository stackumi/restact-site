---
target: "the REST:ACT home page"
total_score: 23
max_score: 36
na_heuristics: 9
p0_count: 0
p1_count: 3
target_identity: "file:/home/chris/code/restact-site/src/pages/index.astro"
target_fingerprint: "sha256:744106fc6f1d27e63830edcc111123c24d4ef8749beddbdd262ced560a1dd39a"
target_path: /home/chris/code/restact-site/src/pages/index.astro
timestamp: 2026-10-28T01-21-59Z
slug: src-pages-index-astro
---
Method: dual-agent (A: design review · B: detector + browser evidence)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | No draft date or version history |
| 2 | Match System / Real World | 2 | Invented framing; unexplained jargon in status strip |
| 3 | User Control and Freedom | 3 | No in-page nav on a 9,000px home page |
| 4 | Consistency and Standards | 2 | /start/ has three labels; "Read the specification" goes to hub; two TOCs on draft |
| 5 | Error Prevention | 3 | Closing `make docker-build` lacks clone step |
| 6 | Recognition Rather Than Recall | 3 | ~25 undefined terms on home |
| 7 | Flexibility and Efficiency | 2 | No .txt/.xml/diff; hover-only permalinks |
| 8 | Aesthetic and Minimalist Design | 2 | 12 equal-weight sections duplicating subpages |
| 9 | Error Recovery | n/a | Static site |
| 10 | Help and Documentation | 3 | No comment/issue channel for a proposal |
| Total | | 23/36 | Acceptable (64%) |

## Design Specificity Verdict
Content is product-specific (AnatomyDemo, ABNF, 408/429/507 limits, /.well-known/restact, resolution walk); the frame is a generic dev-tool landing skeleton (status pill, two-tone H1, stat strip, 9 eyebrows over aphorism H2s, numbered 01–04 cards, 3x2 compare grid, 5-card tools row, closing CTA card, fake terminal chrome, teal/near-black + Space Grotesk/JetBrains Mono). Prose tell is cadence: every H2 a period-ended aphorism; "Every noun can act."; "we hardly notice how extraordinary that is" (Evolution.astro:44). Docs pages read human.
Detector: CLI 2 findings (side-tab Callout.astro:29 real; BudgetFigure.astro:37 false positive). Browser 46 findings: home 23 (kicker-above-heading x9, numbered-section-labels x4, nested-cards x2, unbalanced-heading x4, straggler x2, line-length x1, low-contrast x1 GET label 4.4:1); /spec/draft/ 18 (mostly spec-text false positives; undersized-ui-text 10.5px section numbers); /start/ 4 (hero-eyebrow-chip, side-tab, straggler x2); /how-it-works/ 1 (side-tab). Overlay not user-visible (Chrome extension disconnected; Playwright fallback).

## Priority Issues
1. [P1] Home page in Persuade mode on a SaaS skeleton for a Read-mode site. Fix: cut to abstract + AnatomyDemo + MUST list/section map + 3 use cases + 3 exits (read draft directly, run restactd, comment). /impeccable distill, /impeccable layout
2. [P1] H1 overclaims "safely"; browser analogy inverts the trust model; present tense for unsubmitted -00. Fix: lead with mechanism; move analogy to /security/ with its limits. /impeccable clarify
3. [P1] No proposal affordances (comment link, date, history/diff, .txt/.xml, open questions, implementation status). /impeccable shape
4. [P2] Aphorism H2s + eyebrows. Fix: descriptive headings in draft vocabulary; delete eyebrows; lint period-ended H2s. /impeccable clarify
5. [P2] /spec/draft/ reading: display face body, two TOCs, pill inline code, hover-only permalinks. /impeccable typeset

## Persona Red Flags
First-timer: no use case; jargon in first two screens; three unexplained entry points. Stress tester: visits 1 vs "1"; "about one call's budget"; restactd defaults under protocol heading. Mobile: 19 screens, demo below fold, toggle labels hidden, sideways code, 11px labels. Implementer/standards reviewer: launch framing on an Experimental I-D; agent-plugin hype read; no date/expiry, comment channel; two TOCs.

## Minor Observations
8 header controls, 14 footer links; status disclaimer repeated 4+ times; restactd "primary" invisible; aria-pressed toggles for single choice; closing command copy={false}; "N. Byrd" sole author signal.

## Questions to Consider
What would a standards reader lose with only abstract + demo + MUST list? Which audience? Is the browser analogy standing in for a use case? What should a convinced reader do next?
