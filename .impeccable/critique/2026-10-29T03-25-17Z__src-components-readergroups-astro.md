---
target: row rules on link lists across the site
total_score: 8
max_score: 12
na_heuristics: 1,2,3,5,7,9,10
p0_count: 0
p1_count: 1
target_identity: "file:/home/chris/code/restact-site/src/components/ReaderGroups.astro"
target_fingerprint: "sha256:8745855e0e2665375240aaff66b7994a27f6cd56b0e06e440a1214d9c5abe817"
target_path: /home/chris/code/restact-site/src/components/ReaderGroups.astro
timestamp: 2026-10-29T03-25-17Z
slug: src-components-readergroups-astro
---
Method: dual-agent (A: design review · B: detector and rule counts)

Target: the ruled-row rule for link lists (ReaderGroups and related lists) across the site, after /restactd/ went plain.

Verdict: make it a context rule. Link rows in headed groups: space only. Records read across from a term or route to its value (spec tables and metadata, home .core grid, /start/ endpoints): hairline per row. Lists set in a prose column (InRestactd, home .uses): keep rules.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 4 | Consistency and standards | 2 | Same ReaderGroups ruled on / and plain on /restactd/; /start/ and /restactd/ untitled lists differ |
| 6 | Recognition rather than recall | 3 | Link plus note scans well either way |
| 8 | Aesthetic and minimalist design | 3 | Rules ladder across uneven columns; heading rule stacks under a row hairline on phones |
| Total | | 8/12 | Others n/a: static navigation, no state, input or errors |

Design specificity: ruling every row is a generic docs habit; the authored signature is section hairlines plus the H3-over-rule group heading. Keeping rules only for records gives them meaning.

Deterministic scan: 48 findings (43 off-ramp font sizes, many named in DESIGN.md prose; 4 radius in illustrations; 1 side-tab false positive on BudgetFigure). No rule-related checks. Overlay on /restactd/: two stragglers in At a glance ("share.", "on."), conformance paragraph ~88ch.
Rule counts (1440): / 44 lines (19 row separators), /start/ 40, /spec/ 87 (69 rows, mostly tables), /restactd/ 19 (0 rows).

Priority issues:
- [P1] Inconsistent treatment of ReaderGroups. Fix: plain by default for headed groups; drop or invert the `plain` prop (its "many rows" reason is wrong). Command: /impeccable layout
- [P2] Untitled plain groups lose their start edge (/restactd/ "Also in the repository"). Fix: keep one `rule` on untitled groups; match /start/ "Where to go next". Command: /impeccable layout
- [P2] Home reader groups ladder at 1440 and sandwich hairline/H3/rule at 390. Fix: plain rows. Command: /impeccable quieter
- [P3] DESIGN.md stale (Ruled Link Lists, list-row token, 13-18px). Fix: rewrite per proposed wording. Command: /impeccable document
- [P3] Two definition-row styles (/restactd/ At a glance vs /spec/ .rows). Fix: align or document. Command: /impeccable polish

Personas: implementer moving between /spec/ and /restactd/ loses the parallel between the two facts blocks; first-time phone visitor sees equal stripes on home, group headings read as rows.

Minor: At a glance 11em term column leaves ~130px gap; .core top border is hairline where untitled groups open on rule.

Questions: is the H3 rule the real signature? Should .uses be prose bullets? Any reason /start/ next steps differ from /restactd/ repository list?
