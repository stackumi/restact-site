# REST:ACT UI Catalog Node Types registry

A *catalog node* is one entry in the closed component vocabulary of the
`application/vnd.restact.ui+json` media type: a JSON object whose `type` field names a registered
node type and whose remaining fields are that type's properties, as returned by a presentation
verb and rendered by a trusted, generic client. The normative description of presentation verbs,
the media type, and the document model is [`../presentation-verbs.md`](../presentation-verbs.md);
the vocabulary is tracked by [ADR-0056](https://github.com/stackumi/restactd/blob/main/spec/decisions/0056-presentation-verbs.md),
[ADR-0114](https://github.com/stackumi/restactd/blob/main/spec/decisions/0114-presentation-verbs-normative.md),
[ADR-0058](https://github.com/stackumi/restactd/blob/main/spec/decisions/0058-ui-catalog-v0.2.md),
[ADR-0059](https://github.com/stackumi/restactd/blob/main/spec/decisions/0059-ui-catalog-v0.3-subscribe.md),
[ADR-0063](https://github.com/stackumi/restactd/blob/main/spec/decisions/0063-ui-catalog-v04-block-editing.md),
[ADR-0065](https://github.com/stackumi/restactd/blob/main/spec/decisions/0065-ui-catalog-v05-data-grid.md),
[ADR-0067](https://github.com/stackumi/restactd/blob/main/spec/decisions/0067-ui-catalog-v06-page-tree.md),
[ADR-0068](https://github.com/stackumi/restactd/blob/main/spec/decisions/0068-ui-catalog-v07-views-relations-embeds.md),
[ADR-0069](https://github.com/stackumi/restactd/blob/main/spec/decisions/0069-viewembed-block-facets.md),
[ADR-0070](https://github.com/stackumi/restactd/blob/main/spec/decisions/0070-ui-catalog-v08-pager.md),
[ADR-0073](https://github.com/stackumi/restactd/blob/main/spec/decisions/0073-component-facet-carriers.md),
[ADR-0074](https://github.com/stackumi/restactd/blob/main/spec/decisions/0074-route-rule-dot-segments.md),
[ADR-0075](https://github.com/stackumi/restactd/blob/main/spec/decisions/0075-ui-catalog-v09-toolbar-menu.md),
[ADR-0076](https://github.com/stackumi/restactd/blob/main/spec/decisions/0076-ui-catalog-v010-external-link.md),
[ADR-0078](https://github.com/stackumi/restactd/blob/main/spec/decisions/0078-viewembed-chrome-none.md),
[ADR-0081](https://github.com/stackumi/restactd/blob/main/spec/decisions/0081-route-rule-empty-path.md),
[ADR-0086](https://github.com/stackumi/restactd/blob/main/spec/decisions/0086-ui-catalog-v011-node-identity.md),
[ADR-0088](https://github.com/stackumi/restactd/blob/main/spec/decisions/0088-ui-catalog-v012-diff-view.md),
[ADR-0090](https://github.com/stackumi/restactd/blob/main/spec/decisions/0090-ui-catalog-v013-chart-view.md),
[ADR-0091](https://github.com/stackumi/restactd/blob/main/spec/decisions/0091-ui-catalog-v014-sandbox-iframe.md),
[ADR-0097](https://github.com/stackumi/restactd/blob/main/spec/decisions/0097-ui-catalog-v015-semantic-tone.md),
[ADR-0098](https://github.com/stackumi/restactd/blob/main/spec/decisions/0098-ui-catalog-v016-slot-fixes.md),
[ADR-0101](https://github.com/stackumi/restactd/blob/main/spec/decisions/0101-ui-catalog-v017-new-surfaces.md),
[ADR-0103](https://github.com/stackumi/restactd/blob/main/spec/decisions/0103-ui-catalog-v018-text-markdown.md),
[ADR-0105](https://github.com/stackumi/restactd/blob/main/spec/decisions/0105-ui-catalog-v019-collection-controls.md), and
[ADR-0107](https://github.com/stackumi/restactd/blob/main/spec/decisions/0107-ui-catalog-v020-cell.md).

- Registration policy: **Specification Required** (see [`README.md`](README.md)).
- Registry-specific rule: **additive-only** — a registered node type is never removed or
  redefined. A client MUST render an unregistered/unknown `type` as an inert placeholder (see the
  unknown-type rule below), never as markup and never silently skipped; this inert degradation is
  the catalog's versioning mechanism. New capability enters the catalog only as new node types or
  new optional fields.

Each entry below states the fields a conforming client consumes and the client's obligation for
each — including the behavior when a field is absent or mistyped. Fields not listed for a node are
ignored (see the unknown-field rule).

## Registry-wide client obligations

These rules apply to every node type; per-node entries reference them rather than restating them.

- **Presence rule (optional fields).** An optional field is *present* iff its value is
  non-nullish (neither `null` nor `undefined`); authors signal absence by omitting the field or
  setting it to `null`. A present-but-falsy value (`""`, `0`, `false`) still renders its element,
  stringified. An element documented as "omitted when absent" is omitted exactly when the field is
  absent under this rule.
- **Malformed-input rule.** A renderer MUST NOT throw on any input; a malformed field degrades,
  it never fails the view. A field whose value has the wrong type is treated as empty: where an
  array is expected, any non-array value (including array-likes such as strings) is treated as
  `[]`, with no coercion; where a text value is expected, a nullish value renders as empty text —
  never the literal `"null"` or `"undefined"` — and any other value is stringified. A required
  field that is missing or malformed degrades per its entry (typically: the control renders
  inert).
- **Node-position rule.** Wherever a child node is expected: a nullish entry renders nothing; a
  bare string renders as a `text` node of style `body`; a bare array renders each entry in order;
  any other non-object value renders the unknown-type placeholder.
- **Unknown-type rule.** A node whose `type` is not registered renders as an inert, text-only
  placeholder that names the unsupported type. It MUST NOT be skipped-and-interpreted, and its
  content MUST NOT be treated as markup. The placeholder's exact copy is non-normative.
- **Unknown-field rule.** Unrecognized fields on a known node type are ignored.
- **Typed-entry rule (Since v0.16).** Four entry lists admit exactly the node types named
  here — `card.actions` and `gridColumn.menu` and `boardColumn.add` (`action` only), and
  `callout.actions` (`action` or `link`): an entry whose `type` is not exactly one of those renders
  as the **inert unknown-type placeholder in its position** — never re-interpreted as the node it
  names under the node-position rule, and never skipped (the `menu`-inside-`menu` disposition,
  generalized). The rule is carried in each row's prose; a pre-existing row's Type column is
  unchanged by it (additive-only), and every other `node`[] field admits every registered node.
  **Since v0.19, two single-node slots** — `gridColumn.sortToggle` and `dataGrid.addRow` — admit
  exactly `action`. A value that is not an object whose `type` is exactly `"action"` is
  **ignored**: the slot's affordance is absent, as for any malformed optional field
  (malformed-input rule), because a slot has no position of its own in which a placeholder could
  stand. It is never re-interpreted as the node it names. **Since v0.20**, the entry list
  `cell.settings` (`action` only) joins the four entry lists above, and `cell.run` joins the
  single-node slots.
- **Identity rule (Since v0.11).** Any node MAY carry an optional `id`: a **string** chosen by
  the emitting verb, opaque to the client. It is a *rendering-stability key*: a client MAY use
  it solely to decide whether a node in one document is "the same" node as one in a
  previously rendered document of the same view — e.g. to scope a repaint to changed nodes, or
  to preserve focus and transient UI state across a refresh of unchanged content. Within one
  `node`[] collection, values SHOULD be pairwise distinct; a client MUST tolerate duplicate,
  missing, or non-string values (a non-string is treated as absent) by falling back to
  re-rendering the collection wholesale. The value is data, never displayed: it MUST NOT reach
  a class name, attribute, or markup, MUST NOT be used to build a selector, and MUST NOT be
  used to construct or influence any route, path, fetch, or invocation. It MUST NOT change
  *what* renders — only whether unchanged content is re-rendered. This field is unrelated to
  `treeItem.id` and `relationChoice.id`, which are required commit inputs on embedded shapes,
  not node fields, and are unchanged by this rule.
- **Text rule (escaping).** Every string field is plain text — **except `text.markdown`,
  rendered only under the
  [markdown rendering contract](#markdown-rendering-contract-since-v018)** — and MUST reach the
  DOM only as text content (text nodes) — there is no raw-HTML path for verb-supplied strings.
  Enumerated fields
  (`text.style`, `callout.style`) are strictly whitelisted: any value outside the whitelist falls
  back to the documented default, and the raw value MUST never reach a class name, attribute, or
  markup.
- **Route rule.** A route-bearing field (`link.view`, `card.link.view`, `image.link.view`,
  `action.verb`, `form.submit.verb`, `upload.then.verb`, each entry of `table.rowLinks`, the
  facet routes `edit.verb`/`edit.split`/`edit.merge`, `compose.verb`, `move.verb`, and
  `remove.verb` — see the facet contracts below — each text-run entry's `view` (`runs[].view`
  on `text`, `heading`, and `quote`), each tree item's `view` (`treeItem.view` on `pageTree`,
  at every nesting depth), the board move contract's `verb` (`board.move.verb`, the `cardMove`
  shape — see the `board` entry), `viewEmbed.view`, and each pager affordance's `view`
  (`pagerNav.view` on a `pager`, at every member position — `prev`/`next`/`first`/`last` and
  each `jump[]` entry; see the `dataGrid` and `page` entries), and each link destination inside
  `text.markdown` that is not an external href (validated before any navigation; unresolvable →
  inert)) is a
  **string** whose **entire value** matches the route grammar
  `[A-Za-z0-9_.\-/{}]*:[A-Za-z][A-Za-z0-9]*` (anchored at both ends — a substring match does not
  satisfy this rule). The path portion MAY be **empty**: `:verbName` is the protocol's **unbound**
  verb route (draft §Addressing's `segment = name [ ":" verb ] / ":" verb`, second arm — a verb
  invoked on the current object, resolved at the service root), and it resolves under the same
  base as every other route, `/v1/` + the route, giving `/v1/:verbName`. A route also has **no
  segment of whose path portion — everything before the final `:` — is `.` or `..`** (the path
  rule's segment constraint: a route resolves under the same `/v1/` base, so a traversal-shaped
  route is exactly as unsafe as a traversal-shaped path; an empty path portion contains no
  segments and satisfies this constraint vacuously). A
  non-string value MUST fail validation without
  coercion. Validation MUST happen **before any fetch or navigation is issued** — for rendered
  controls, at render time before any handler is wired; for `form.submit.verb`, at submit time
  before invocation. A control whose route is missing or fails validation renders inert
  (non-interactive text; a linked card renders as a plain card), and the navigation/invocation
  callback MUST be unreachable.
- **Path rule (object paths).** An object-path field (`image.src`, `upload.pathPrefix`,
  `slideshow.images[].src`, each entry of `page.subscribe`, each facet's `target` —
  `edit.target`, `move.target`, `remove.target`, validated identically although the client never
  fetches a facet target: it travels only as commit input — and each tree item's `target`
  (`treeItem.target` on `pageTree`, at every nesting depth, validated identically and likewise
  never fetched: it travels only as move-/remove-commit input), each board card's `target`
  (`boardCard.target` on `board`, validated identically and likewise never fetched: it travels
  only as board-move commit input), and each calendar item's `target` (`calendarItem.target` on
  `calendar`, validated identically and never fetched)) is a **string** whose **entire
  value** matches the path grammar
  `[A-Za-z0-9_.\-]+(/[A-Za-z0-9_.\-]+)*` (anchored at both ends — a substring match does not
  satisfy this rule), whose length is at most 1024 characters, and **no segment of which is `.` or
  `..`**. A non-string value MUST fail validation without coercion. By construction a valid path
  is colon-free (no scheme — it cannot be confused with a verb route) and has no leading `/`, no
  empty segment (`//`), no traversal, no whitespace, and no `%`, `?`, or `#`. The client resolves
  a valid path against **its own data plane only**: the fetch URL is the same-origin discovery
  base + `/v1/` + path. Validation MUST happen **before any fetch is issued**. A control whose
  path is missing or fails validation renders inert per its entry (for `image`: an inert
  placeholder carrying the `alt` text, with no fetch). External URLs and `data:` URIs are
  unrepresentable by design — this closes exfiltration and tracking-pixel vectors.
- **External-link rule (Since v0.5; generalized v0.10).** The catalog has exactly **three**
  sanctioned external-href surfaces: a `gridCell` in a `url`-typed `gridColumn` (see
  `dataGrid`; Since v0.5), the `externalLink` node (Since v0.10), and a link inside
  `text.markdown`. All three consume one shared
  **external-href gate**: the candidate is a string of at most 2048 characters; it parses as an
  **absolute** URL under the URL implementation the client's rendering environment itself
  navigates with (for web clients, the WHATWG URL parser), with **no base URL supplied** — a
  relative reference fails; the parsed scheme is exactly a member of the client-fixed allowlist
  `https`/`http` (a client-fixed constant, **not** an author-supplied pattern — the
  advisory-validation rule's "no author regex anywhere in the catalog" is preserved); the
  parsed username and password components are empty; the parsed host is non-empty. A value
  passing the gate renders as an external anchor whose `href` is the **parse's canonical
  serialization** — never the authored string — with `rel="noopener noreferrer"` and a new
  browsing context (`target="_blank"`); **any other value** renders per the consuming surface's
  failure disposition (a url grid cell: inert plain text; an `externalLink`: inert label text),
  never truncated or repaired. The gate admits user-activated navigation only: no request is
  ever issued at render time on its account. It applies to no other node or field: these are
  the only exceptions to the route/path rules' "external URLs are unrepresentable."
- **Advisory-validation rule.** Declared client-side affordances — the field constraints
  (`required`, `min`, `max`, `step`, `minLength`, `maxLength`) and the confirm prompts
  (`action.confirm`, `form.submit.confirm`) — are **advisory UX, never a security control**. The
  client SHOULD surface constraint failures as inline text near the field and MAY decline to
  submit while a constraint fails, but MUST NOT treat any of this as enforcement: the server MUST
  validate all input, and the 422 flow is unchanged. There is **no author-supplied regex anywhere
  in the catalog**: typed formats are validated only by the browser's native input-type machinery,
  so no author-controlled pattern ever reaches a regex engine.
- **Notification rule.** For invoking nodes (`action`, `form`): a successful invocation surfaces
  a notification of kind `ok`; a failed invocation surfaces a notification of kind `err` and
  re-enables the control; an invalid route never invokes (route rule). Notification copy is
  non-normative. Post-success navigation is app-level and non-normative. **Facet commits (the
  edit/compose/move/remove contracts below, Since v0.4) deviate on the success half only:** a
  successful facet commit surfaces **no** `ok` notification — commits are frequent (every blur)
  and the clearing of the pending affordance is the success signal; the `err` half applies
  unchanged, and servers SHOULD supply problem-detail text that clients SHOULD display.
  **The two single-node action slots deviate the same way (Since v0.19):** a successful invocation
  through `gridColumn.sortToggle` or `dataGrid.addRow` surfaces **no** `ok` notification — the
  re-rendered grid is the success signal — and the `err` half applies unchanged.
- **Authoring-material rule (Since v0.20).** A client MAY offer a *viewing presentation*: a way
  of rendering a document for using it rather than authoring it (for example, a view/edit
  switch). In a viewing presentation a client MAY omit any field that a node entry designates
  **authoring material**, and only those fields. In this version only the `cell` entry designates
  any. Every other field renders as in any other presentation, and a client that offers no viewing
  presentation renders authoring material like any other field. In a viewing presentation a
  client MAY also decline to wire any facet; the node then renders as if the facet were absent
  (read-only). Both are presentational only, never an authorization or confidentiality control:
  omitted content is still in the document the client received, and the server's policy governs
  every write regardless (advisory-validation rule). A server that must not disclose a field
  omits it from the document.

The document root MUST be a `page` ([`../presentation-verbs.md`](../presentation-verbs.md) §4).

## Facet contracts

Since v0.4 the registry defines three shared, optional **facet contracts** — `edit`, `compose`,
and the `move`/`remove` pair — carried as fields by the node entries that declare them. A facet
is not a node: it never appears as a `type`, and it is consumed only on the nodes whose contracts
list it. Per the unknown-field rule, a facet on any other node is ignored. Two carrier sets are
used below: **edit-capable** = `text`, `heading`, `todo`, `quote`, `code` (plus `page.titleEdit`;
plus `callout` and the thirteen component carriers, since a v0.8 amendment, 2026-07-30 — see
"Component carriers" below; plus `externalLink`, a component carrier since its v0.10
registration; plus `cell`, since its v0.20 registration, whose `edit` governs its `source`);
**block-capable** = `text`, `heading`, `todo`, `quote`, `code`,
`image`, `callout`, `divider` (plus `viewEmbed`, since a v0.7 amendment, 2026-07-24 — see the
`viewEmbed` entry; plus the same thirteen component carriers, since the same v0.8 amendment;
plus `externalLink`, since its v0.10 registration; plus `chartView`, since its v0.13
registration — block-capable **only**, deliberately not edit-capable: see the `chartView`
entry; plus `cell`, since its v0.20 registration).
Since v0.5 the grid's embedded shapes also carry facets: `gridColumn` and `gridCell` are
edit-capable (each may carry `edit`), `gridRow` is remove-capable (may carry `remove`), and the
`dataGrid` node carries a `compose` facet under the field name `addColumn` (a second, on-label use
of the `compose` contract with column-insertion semantics — see the `dataGrid` entry). These shapes
are not nodes; the same facet rules (validate before wiring, ignore-on-invalid, silent-`ok` commit)
apply on them exactly as on node carriers. Since v0.6 the `pageTree` node carries the `move` and
`remove` facet member shapes and the `compose` contract under **tree semantics** — per-item
re-parent/reorder affordances committing `{target, parent, after}` rather than `{target, dir}`,
a per-item delete affordance committing `{target}` with the item's own target, and per-item add
affordances committing `{type, parent, after}` rather than `{type}`/`{type, after}` (on-label
reuses of facet contracts, as `dataGrid.addColumn` is of `compose`; see the `compose` and
`move`/`remove` sections below and the `pageTree` entry). Also Since v0.6, the block `move`
contract itself admits a **positional** commit form, `{target, after}`, alongside the adjacent
`{target, dir}` form (see the `move`/`remove` section below). Since v0.7 the board's and
calendar's embedded shapes are also edit-capable: `boardCard` and `calendarItem` may each carry
`edit` (see the `board` and `calendar` entries). These shapes are not nodes; the same facet
rules (validate before wiring, ignore-on-invalid, silent-`ok` commit) apply on them exactly as
on node carriers.

**Component carriers (Since a v0.8 amendment, 2026-07-30).** Thirteen component node types —
`stat`, `barChart`, `table`, `card`, `columns`, `tabs`, `accordion`, `progress`, `meter`,
`badge`, `link`, `fieldList`, `form` — are block-capable and edit-capable; `callout` (already
block-capable) is edit-capable. `externalLink` (Since v0.10) is a component carrier at
registration — block-capable and edit-capable from birth, under the same rules. `move` and
`remove` on a component carrier govern the node at its block position exactly as on the v0.4
carriers, including the positional commit form. The
`edit` contract is unchanged — `field` remains opaque commit data naming whichever stored
property the emitting verb chooses (for a component block, conventionally its configuration
property) — with one rule specific to these carriers: they have no canonical display string, so
an `edit` facet whose `value` is absent is **ignored** (read-only render), never seeded from an
empty string — a blur against an unseeded control would otherwise commit an empty value over
the block's entire configuration. On the excluded nodes — `page`, `section`, `grid`, `list`,
`field`, `action`, `upload`, `slideshow`, `dataGrid`, `board`, `calendar`, `pageTree` — facets
at node level remain ignored (or, for `pageTree` and the view surfaces, remain governed by their
own already-registered contracts); each exclusion is additive-reversible later.

Facet routes and targets are server-authored data: every facet route MUST pass the route rule and
every facet `target` MUST pass the path rule **before any affordance is wired**; a facet whose
required members are missing or invalid is **ignored** — the node renders exactly as if the facet
were absent (read-only), never inert. Facet commits follow the notification rule's facet
deviation (silent `ok`; `err` unchanged).

### The `edit` facet (inline editing)

An edit-capable node may carry `edit`:
`{verb, target, field, kind, value?, options?, split?, merge?}`.

| Member | Type | Required | Client obligation |
|---|---|---|---|
| `verb` | string (verb route) | yes | MUST pass the route rule before any editing affordance is wired; missing or invalid → the facet is ignored. |
| `target` | string (object path) | yes | MUST pass the path rule; missing or invalid → facet ignored. Sent verbatim as commit input; the client never fetches it. |
| `field` | string | yes | Consumed iff a non-empty string; else the facet is ignored. Sent verbatim as commit input; MUST never reach a class name, attribute, or markup (it is data and is never displayed). |
| `kind` | `"line"` \| `"multiline"` \| `"check"` \| `"select"` \| `"date"` \| `"number"` \| `"url"` \| `"relation"` \| `"multiselect"` | yes | Strict whitelist (`select`/`date`/`number`/`url` added Since v0.5; `relation` Since v0.7; `multiselect` Since v0.17). Absent, non-string, or unrecognized → **the facet is ignored** (read-only render) — deliberately not a fallback to another kind: editing a value through the wrong control shape would commit garbage, and ignore-on-unknown is the forward-compatibility mechanism by which later versions add kinds without breaking older clients (a pre-v0.5 client renders the four new kinds read-only by exactly this rule, a pre-v0.7 client renders `relation` cells read-only the same way, and a pre-v0.17 client renders `multiselect` cells read-only the same way — additive growth as designed). The raw value MUST never reach a class name or attribute (text rule). The v0.5 kinds map to native input controls — `number` a number input (committed value the control's dot-decimal string), `date` a date input (committed value `YYYY-MM-DD`), `url` a `type="url"` input (line semantics), `select` a text input backed by a `options` datalist (below). `relation` (Since v0.7): the current value is a **JSON-encoded array of opaque id tokens**; the client renders it as removable chips plus a picker fed by the **column's** `choices` (see the `gridColumn` shape — emitted once per column, never per cell), and commit posts the JSON-encoded id array as `value` through the unchanged commit contract. `multiselect` (Since v0.17): the current value is a **JSON-encoded array of tag strings** — each tag is its own display text, never an id resolved through a candidate list; the client renders the tags as removable chips, **one chip per entry, in array order**, plus an entry field with typeahead over the **facet's own** `options` (per field, as for `select` — never a column's `choices`). **Create-on-type is part of the contract:** a typed token absent from `options` is legal and the client MUST offer to add it; an empty or absent `options` never disables the control. Commit posts the JSON-encoded array of the chips, in chip order, as `value` through the unchanged commit contract; `"[]"` clears. Seed, token and commit details are the **`multiselect` editing rules** below. |
| `value` | string | no | The editor's seed text. Present (presence rule) → the swapped-in control is seeded with exactly this string; absent → seeded with the node's own canonical display string (per-carrier: `text.value`, `heading.value`, `quote.value`, `code.value`, `todo.label`, `page.title`; `callout.value` since a v0.8 amendment, 2026-07-30; for a `gridCell`, `gridCell.value`; for a `gridColumn` rename, `gridColumn.label`; for a `boardCard` or `calendarItem`, its `label`; for a `cell`, `cell.source` (Since v0.20)). The thirteen component carriers of the same v0.8 amendment have no canonical display string: on them an `edit` whose `value` is absent is **ignored** (read-only render) — see "Component carriers" above. On a `cell`, an `edit` whose `value` is absent while `source` is also absent is **ignored** (see the `cell` entry). A verb that renders `runs` supplies the stored rich-text source here, so the user edits source, not a lossy flattening. |
| `options` | string[] | no | Since v0.5. Consumed **only** when `kind` is `"select"` or (Since v0.17) `"multiselect"`: for `select`, the suggestion list (datalist) for the combobox; for `multiselect`, the entry field's typeahead candidates (the **`multiselect` editing rules** below) — each entry rendered as text (non-string entries dropped individually; non-array → no suggestions). The suggestions never constrain the committed value — the server validates (advisory-validation rule), and the control is deliberately open (a closed set without an option-management UI would deadlock an option-less column). For `multiselect` the openness is normative: an empty or absent `options` never disables the control, and create-on-type is required. Present-but-unconsumed for any other `kind` → ignored (unknown-field rule). |
| `split` / `merge` | string (verb route) | no | Each consumed independently iff it passes the route rule; an invalid entry disables only that behavior, never the whole facet. Semantics below. |

**Editing behavior.** A node with a consumed `edit` facet is activate-to-edit: on
activation (pointer, or keyboard on the focused node) the client swaps in a **plain-text input
control** seeded per `value` — `kind:"line"` a single-line text input, `"multiline"` a multi-line
text area, `"check"` a checkbox reflecting the carrier's checked state (no text control), and
(Since v0.5) `"number"` a native number input, `"date"` a native date input, `"url"` a
`type="url"` input, and `"select"` a text input paired with a `options` datalist (an open
combobox — the typed-or-chosen string is the value, not a closed selection), (Since v0.7) `"relation"` a removable-chips control paired with a picker over the column's `choices` (the committed value is the JSON-encoded id array, not display text), and (Since v0.17) `"multiselect"` a removable-chips control paired with an entry field offering typeahead over the facet's own `options` plus create-on-type (the committed value is the JSON-encoded tag array, never a joined string; the **`multiselect` editing rules** below). Edited content MUST
be captured only as a plain-text string (or the checkbox boolean): pasted or composed input MUST
enter the edited value as plain text, never as markup, and the edited value MUST reach the DOM
only as a control value or text node. The commit contract, triggers, one-in-flight queueing,
pending/echo/revert, and repaint rules below are identical for every kind.

**Markdown source editing (Since v0.18).** For a `text` node whose `markdown` is consumed and which
carries an `edit` facet of kind `"multiline"`, `edit.value` is the markdown source. A client MAY
present a source editor in place of the plain multi-line text area, and MAY render the in-progress
source under the markdown rendering contract (live preview). This is an exception to "the edited
value MUST reach the DOM only as a control value or text node". Capture stays plain text:
- the committed value is exactly the source characters the author typed, or pasted as plain text;
- a client MUST NOT build the value by serializing a document model, and MUST NOT normalize it;
- every source character MUST remain reachable for editing: a rendered construct reveals its
  source when the selection enters it, or a source mode is available.

**`multiselect` editing rules (Since v0.17).** *Seed.* The seed (per `value`) is parsed with the client's JSON parser, never evaluated. A seed empty after trimming ASCII whitespace is the empty set; otherwise the facet is consumed **iff** the seed parses to an array every entry of which is a string, and any other seed — a non-array, an array holding a non-string, unparseable text — makes **the facet ignored** (read-only render): an editor that cannot show the stored tags would, on its first commit, overwrite them with whatever it did show. *Chips.* One removable chip per seed entry, in array order, duplicates included; chip text is the entry, as text (text rule). Removing a chip MUST be operable by pointer **and** by keyboard. *Entry and typeahead.* The entry field suggests the consumed `options` entries; which entries match the typed text is the client's choice (non-normative); suggestions never constrain the committed value (advisory-validation rule — the `select` posture). *Create-on-type.* Whenever the typed text, trimmed of ASCII whitespace, is non-empty, the client MUST offer to add it as a token whether or not it matches an `options` entry; choosing a suggestion, or confirming the typed text (Enter in the entry field), adds one chip and clears the entry field. Enter in the entry field adds a token and is never a commit trigger. A trimmed-empty text adds nothing; a token equal by code units, after trimming, to an existing chip is not added a second time; case is not folded. A token is added **only by an explicit act** — never on loss of focus (uncommitted typed text is discarded, since a blur is not a decision), and pasted text is never split on a separator (a pasted `a, b` is the single token `a, b`; tags may contain commas). *Commit.* `value` is the JSON-encoded array of the current chips' texts in chip order — `"[]"` when none remain, **never `""`**. Commit trigger: focus leaving the control (entry field and chips together — the `relation` posture); the client MAY additionally commit after each chip added or removed. The one-in-flight, echo, pending, revert and repaint rules below apply unchanged.

**Commit contract.** A commit `POST`s to `verb` with input `{target, field, value}` — all three strings, `value` the control's current text (for `"check"`: `"true"` or `"false"`; for `"multiselect"`: the JSON-encoded tag array). Commit
triggers: loss of focus (blur); Enter for `kind:"line"` (superseded by `split` when declared, see below); activation for `"check"`; for `"multiselect"`, focus leaving the control (its editing rules — Enter in its entry field adds a token and never commits). The client MAY additionally commit on an idle debounce while
typing, but MUST NOT commit per keystroke and MUST NOT have more than one commit in flight per
`(target, field)` (a newer value queues and supersedes). On a 2xx response the commit is
committed — the response body is not interpreted — and the client re-invokes the current view
(as after an `action`). On failure the client MUST revert any locally echoed value to the last
server-rendered value and surface an `err` notification (notification rule's facet deviation).

**Echo, pending, and repaints.** The client SHOULD echo the committed value into the rendered
node immediately (the echoed string reaching the DOM as text nodes only) and MUST indicate a
pending state until a subsequent render reflects server truth. A repaint (poll, `refresh`, or
`subscribe` invalidation) MUST NOT discard an active editor's uncommitted content: the client
either preserves the active control across the repaint (keyed by `(target, field)`) or defers
the repaint while the editor is active and reconciles after — which posture is implementation
choice; losing user input is not.

**`split` / `merge` semantics.** For `kind:"line"`/`"multiline"` with `split` consumed: Enter
(superseding the plain Enter-commit for `"line"`; for `"multiline"`: Enter, with Shift+Enter
inserting a literal newline) commits a split — `POST` to `split` with
`{target, field, before, after}`, the text before and after the caret. With `merge` consumed:
Backspace with the caret at offset 0 commits a merge — `POST` to `merge` with
`{target, field, value}`, the control's full current text (so uncommitted edits survive into the
merged block). Both are structural: the client MUST NOT echo them optimistically; it marks the
block pending and awaits the re-invoked view. After a split the client SHOULD move focus to the
next editable block once the repaint arrives (the new block's identity is server-assigned and
unknown until then; this heuristic is deliberately non-normative). Without a declared
`split`/`merge`, Enter in `"multiline"` inserts a newline and Backspace at offset 0 does nothing
structural.

Old-client degradation: `edit` (and `split`/`merge`) are ignored fields → the node renders
read-only.

### The `compose` facet (insertion)

A compose-capable container (v0.4: `page` only) may carry `compose`:
`{verb, types: [{type, label}, ...]}`. Since v0.5 the **same contract** is additionally carried by
`dataGrid` under the field name `addColumn` — an on-label second use with column-insertion
semantics (below); everything about the contract other than the field name and the `after` rule is
identical. Since v0.6 the same contract is also carried by `pageTree` under a **tree form** — an
on-label third use with per-item placement semantics (below); everything about the contract other
than the affordance surface and the commit's identity members is identical.

| Member | Type | Required | Client obligation |
|---|---|---|---|
| `verb` | string (verb route) | yes | Route rule before any affordance is wired; missing or invalid → facet ignored (no insertion UI). |
| `types` | entry[] | yes | One menu entry per valid entry, in order. `type`: consumed iff a non-empty string; an application-defined token submitted verbatim as data — never displayed, and it MUST never reach a class name, attribute, or markup. `label`: the entry's visible text, as text (text rule). An entry with a missing/empty `type` or `label` is dropped individually. Non-array, or empty after dropping → facet ignored. |

**Behavior.** With a consumed facet the client renders an insertion affordance for the container
offering the `types` menu; selecting an entry `POST`s to `verb` with input `{type}` or
`{type, after}` — `after`, when the insertion was invoked from a specific block's context, is
that sibling block's declared `target` (taken **only** from the sibling's own
`edit.target`/`move.target`/`remove.target`, i.e. an already-path-validated server-authored
value; the client never synthesizes paths). Success/failure follows the `edit` commit contract
(silent `ok` + re-invoke view; `err` on failure). A client MAY additionally open the same menu
from within an active editor (the slash-menu idiom); that surface is optional UX — the insertion
affordance is the contract.

**`addColumn` (Since v0.5).** Carried by `dataGrid`, the contract renders as a trailing "+"
header affordance whose menu lists `types[]`; selecting an entry `POST`s **`{type}` only** to
`addColumn.verb` — `after` is **never** sent, because columns append at the tail (there is no
positional column insertion in this batch). Identity (which table) lives in the verb route, per
the `page.compose` convention. All other compose rules (route validation before wiring,
per-entry `type`/`label` dropping, verbatim never-displayed `type`, silent-`ok` commit) are
unchanged.

**Tree compose (Since v0.6).** Carried by `pageTree` under the field name `compose`, the contract
renders **per-item add affordances** — operable by **menu/keyboard (required)**, the tree-facet
affordance posture — on every item bearing its own valid `id`, plus one tree-level affordance for
adding at the root. An affordance offers the `types[]` menu; selecting an entry `POST`s to `verb`
with **`{type, parent, after}`**, `after` omitted for an insertion at the tail: `type` per the
contract above (verbatim, never displayed); `parent` is the destination item's `id`, or the
**empty string `""`** — the client-authored root token — for an insertion at top level; `after`
is the preceding sibling's `id`, or the **empty string `""`** — the client-authored head token —
for an insertion at the **first position** among the destination's children. `parent`/`after`
values are taken **only** from items' own already-consumed `id`s or the fixed `""` root/head
tokens — the client never synthesizes identities (the tree-move identity rules; see the
`move`/`remove` section below). Which placements a given affordance offers (add child, add
sibling after, add at root) is presentation choice, non-normative — the commit contract is the
contract. All other compose rules (route validation before wiring, per-entry `type`/`label`
dropping, verbatim never-displayed `type`, silent-`ok` commit) are unchanged; the commit is
structural — no optimistic echo; the new item arrives via the re-invoked view (its identity is
server-assigned and unknown until then, the `split` posture).

Old-client degradation: ignored field → no insertion UI (and, for `dataGrid` and `pageTree`, the
whole node is an inert placeholder on a pre-v0.5 / pre-v0.6 client respectively).

### The `move` and `remove` facets (reorder, delete)

A block-capable node may carry `move` and `remove`, each of shape `{verb, target}`:

| Member | Type | Required | Client obligation |
|---|---|---|---|
| `verb` | string (verb route) | yes | Route rule before wiring; invalid → that facet ignored. |
| `target` | string (object path) | yes | Path rule; invalid → that facet ignored. Sent verbatim as input; never fetched. |

**Behavior.** `move`: the client renders move-up and move-down affordances, operable by pointer
**and** keyboard; activation `POST`s to `verb` with `{target, dir}` where `dir` is exactly
`"up"` or `"down"` (a closed, client-authored value set — a client adding drag reorder as
progressive polish MUST commit through this contract — the adjacent form here or the positional
form below — or not at all). `remove`: a single
delete affordance; activation `POST`s `{target}`. Both follow the `edit` commit contract with no
optimistic echo (structural ops: pending + await the re-invoked view; silent `ok`; `err` on
failure). Move affordances at a boundary (first/last block) still render; the server rejects or
no-ops an impossible move — order is server truth, and the client does not know its position.

**Positional block move (Since v0.6).** On the block carriers the `move` contract additionally
admits a **positional** commit form: a commit `POST`s to `verb` with `{target, after}` — no
`dir` — moving the target block to the position **after a named sibling**. `after` is the
destination's preceding sibling's declared facet `target` (taken **only** from that sibling's
own `edit.target`/`move.target`/`remove.target`, i.e. an already-path-validated, server-authored
value — the `compose` `after` posture; the client never synthesizes paths), or the **empty
string `""`** — the client-authored head token, as in the tree contracts — for a move to the
**first position** in the container (a valid path is never empty, so the token is unambiguous).
Exactly **one** of `dir` or `after` travels per commit — the two are mutually exclusive, and the
member present is what discriminates the forms: unlike tree move there is no `parent` member to
mark the form, so a move to the tail names the **last sibling** in `after` rather than omitting
it, and a commit carrying neither or both members is malformed — the server rejects it. The
adjacent form is not deprecated: menu and keyboard affordances keep committing `{target, dir}`;
the positional form exists so a drag that drops a block an arbitrary distance away commits
**once** rather than decomposing into N adjacent commits with a partial-failure window. Both
forms share the same discipline — structural, non-optimistic (pending + await the re-invoked
view; silent `ok`; `err` on failure) — and a commit naming an unknown or impossible `after` is
the server's to reject: order is server truth. A server verb registered before this form rejects
a positional commit as unrecognized input and the client surfaces the `err` notification
unchanged (the registering consumer ships client and server in lockstep, where this carries no
weight).

**Tree move (Since v0.6).** Carried by `pageTree` under the same `{verb, target}` member shape
and validation rules, the `move` contract commits the tree's **re-parent/reorder** form instead
of `{target, dir}`. With the facet consumed, the client renders per-item move affordances —
operable by **menu/keyboard (required)**; drag is optional polish that MUST commit through this
same contract or not at all — on every item bearing its own valid `target` (see the `treeItem`
shape). A commit `POST`s to `verb` with `{target, parent, after}`, `after` omitted for a move to
the tail: `target` is the **moved item's** own `target` (never the facet's — the facet's `target`
names the tree's root object and does not travel in tree-move commits); `parent` is the
destination item's `id`, or the **empty string `""`** — the client-authored root token — for a
move to top level; `after` is the preceding sibling's `id`, or the **empty string `""`** — the
client-authored head token, symmetric with `parent`'s root token — for a move to the **first
position** among the destination's children. **`dir` is never sent.**
`parent`/`after` values are taken **only** from items' own already-consumed `id`s or the fixed
`""` root/head tokens — the client never synthesizes identities (the `compose` `after` posture). The
commit is structural and non-optimistic exactly as block move (pending + await the re-invoked
view; silent `ok`; `err` on failure), and impossible moves (a cycle, a depth-cap breach) are the
server's to reject — placement is server truth.

**Tree remove (Since v0.6).** Carried by `pageTree` under the same `{verb, target}` member shape
and validation rules, the `remove` contract keeps its commit form unchanged. With the facet
consumed, the client renders a per-item delete affordance — operable by **menu/keyboard
(required)**, the tree-move affordance posture — on every item bearing its own valid `target`
(see the `treeItem` shape). Activation `POST`s to `verb` with `{target}` where `target` is the
**removed item's** own `target` (never the facet's — the facet's `target` names the tree's root
object and does not travel in tree-remove commits, exactly as in tree move). The commit is
structural and non-optimistic exactly as block remove (pending + await the re-invoked view;
silent `ok`; `err` on failure), and an impossible removal is the server's to reject — membership
is server truth. Removal is a **structural un-listing** of the item from the tree — not an HTTP
`DELETE` and not an object-lifecycle operation; whether the item's underlying object persists
(e.g. restorably, with its children re-homed) is application semantics, delivered by the
re-invoked view.

Old-client degradation: ignored fields → no reorder/delete UI (and, for `pageTree`, the whole
node is an inert placeholder on a pre-v0.6 client).

## Format hints

Since v0.16 four value slots — `field.format`, `fieldList.fields[].format`, `stat.format`, and
`table.columnFormats` (an array parallel to `columns`) — MAY carry a **format hint**: a member of
one closed set that asks the client to render a value in the viewer's own locale instead of
verbatim. It is the catalog's one bounded interpreter of a verb-supplied string, and it is bounded
by construction: each member admits exactly one closed input shape, matched by a client-fixed
anchored regex against the value (stringified per the malformed-input rule, then trimmed of ASCII
whitespace) — matched against the **entire** trimmed value, never a line within it — an
implementation whose `^`/`$` are line anchors MUST use whole-string anchors, so a value with an
interior line break fails every shape — and hands only a matched value to the client's own
date/number machinery — never a free-form string, never an author-supplied pattern (the
advisory-validation rule's "no author regex anywhere in the catalog" holds).

| Member | Consumed iff the value matches | Rendering when consumed |
|---|---|---|
| `datetime` | an RFC 3339 date-time **with an explicit zone**: `^\d{4}-\d{2}-\d{2}[Tt ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?([Zz]\|[+-]\d{2}:\d{2})$` | the instant, in the viewer's own time zone and locale, as a date and time. |
| `date` | a calendar date `^\d{4}-\d{2}-\d{2}$` | the calendar date in the viewer's locale. A date-only value is a **civil** date: the client MUST NOT shift it by the viewer's time zone. |
| `time` | a clock time `^\d{2}:\d{2}(:\d{2})?$` | the time of day in the viewer's locale, unshifted. |
| `relative` | the `datetime` shape | the distance between the instant and the client's current time ("3 minutes ago", "in 2 days" — copy and granularity non-normative). A client MAY re-render it on its own clock; it MUST NOT issue any request on its account. |
| `number` | `^-?\d+(\.\d+)?$` **with at most 15 digits, counting neither the sign, the decimal point, nor leading zeros** (an integer part's leading zeros and the zeros between the decimal point and the first non-zero fractional digit; trailing zeros count, they are digits to preserve); a longer value fails the gate and renders verbatim — the bound is what makes the next obligation implementable on an IEEE-754 double | the number with the viewer's locale's digit grouping and decimal separator, **preserving every digit as given** — no rounding, no padding; a client that cannot format a gated value without changing any of its digits MUST render it verbatim. A currency symbol or unit is not part of the value: an author places it in the slot's `label`/`hint`, or formats verbatim. |

**Obligations (normative).** `format` is a strict whitelist: absent, non-string, or unrecognized →
no hint, and the raw value MUST never reach a class name or attribute (text rule). When a hint is
consumed and the value **passes** its gate, the client renders **its own** localized text, generated
from the parsed value; the raw value does not render as the slot's text (a client MAY additionally
show it, as text). When the value **fails** the gate, the raw value renders **verbatim as text** —
never empty, never an "invalid" placeholder, never a guessed interpretation (a zone-less date-time
renders verbatim precisely because its instant is ambiguous, and the ambiguity MUST NOT be silently
resolved). A value that satisfies a member's shape but is not a valid date, time, or instant (month
13, day 30 in February, hour 25, minute 61, a zone offset outside `-23:59`..`+23:59`, and — ruled
for determinism, since clients' calendar machinery disagrees about it — a seconds field of `60`, the
leap second) MUST render **verbatim**, exactly as a gate failure — the shape gate is necessary, not
sufficient. A format hint changes **nothing but the displayed text**: it MUST NOT affect the `table`
comparison rule (sorting operates on the raw cell, where ISO dates and plain numbers already order
correctly), MUST NOT change any submit payload, MUST NOT change an `edit` facet's seed text (a
formatted `stat` displays the localized text while its editor opens on the raw value — the seam is
accepted, and it is why `gridColumn` is excluded), and no value it touches reaches a route, a path,
a class name, or an attribute. Locale and time zone are the viewer's environment and non-normative;
two conforming clients in different locales legitimately render different text. `gridColumn` carries
no format hint in this version — a formatted display over an editable cell is a second contract this
registry has not needed.

## Markdown rendering contract (Since v0.18)

This section is normative. It governs every field this registry declares as **markdown source**
— in this version, only `text.markdown` (see the `text` entry). A client consumes such a field only
if it implements this contract, and renders it only under this contract, never as HTML.

- **Grammar reference.** Markdown source is interpreted per
  [CommonMark 0.31.2](https://spec.commonmark.org/0.31.2/) with exactly these extensions: GFM
  tables, GFM strikethrough with a double tilde only, GFM task-list item markers, and literal
  autolinks for `http://`/`https://` only (no `www.`, no e-mail). Every other construct follows
  the cut line.
- **The cut line.**
  - **Renders.** Paragraphs; emphasis (`*em*`), strong (`**strong**`) and strikethrough
    (`~~strike~~`); inline code; fenced and indented code blocks; ATX and setext headings; bullet
    and ordered lists (with start number), including task-list markers; blockquotes; thematic
    breaks; tables with alignment; links — inline `[t](dest)`, autolinks `<…>`, and bare
    `http(s)://` text; backslash escapes; entity and numeric character references (decoded to
    characters, as text).
  - **Renders as literal characters.** Raw HTML (block and inline, including comments), images,
    link reference definitions and reference-style links, footnotes render as their
    literal characters, as do definition lists, attribute syntax, wiki-links, emoji shortcodes,
    and any construct not listed under **Renders**. Front matter and math have no special
    meaning: their characters are interpreted by the rules above, so a `---` line can render as a
    thematic break and `$…$` text can contain emphasis.
- **Line breaks.** Line breaks inside a paragraph render as line breaks.
- **Closed element set.** The output is a closed element set, and **a client MUST NOT create any
  element or attribute from markdown content except through that set**.
- **Images.** An image's source is never fetched.
- **Links.** Links follow the external-href gate or the route rule, else inert; titles are not
  rendered.
- **Limits.** A client MUST bound the work it does per field and MUST render the source verbatim
  as text (with `pre` whitespace semantics) rather than fail, hang or truncate when a field
  exceeds its limits. **Author floor:** a field of at most 16,384 characters nesting no deeper
  than 8 is rendered formatted by every consuming client. A client that renders a markdown field
  while it is being edited MUST keep the editor responsive for any content, and MUST apply the
  same limit decision to the whole field as it does for display. Non-normative note: some
  published markdown parsers are super-linear on runs of emphasis delimiters and on nested
  brackets, and the [corpus](fixtures/markdown/) includes such inputs.
- **Approvals.** A consuming client that offers an approve-this-text action SHOULD offer the exact
  source.
- **Conformance means structure.** For any input within the author floor, conforming clients
  produce the same structure: the same element kinds from the closed set, the same nesting, the
  same text content and the same link classification. Class names, styling and the heading-level
  offset are client choices.

## Registered node types

| Node | Since | Status |
|---|---|---|
| `page` | v0 | provisional |
| `section` | v0 | provisional |
| `grid` | v0 | provisional |
| `list` | v0 | provisional |
| `card` | v0 | provisional |
| `field` | v0 | provisional |
| `fieldList` | v0 | provisional |
| `table` | v0 | provisional |
| `text` | v0 | provisional |
| `badge` | v0 | provisional |
| `link` | v0 | provisional |
| `action` | v0 | provisional |
| `form` | v0 | provisional |
| `stat` | v0.1 | provisional |
| `barChart` | v0.1 | provisional |
| `columns` | v0.1 | provisional |
| `divider` | v0.1 | provisional |
| `callout` | v0.1 | provisional |
| `tabs` | v0.2 | provisional |
| `accordion` | v0.2 | provisional |
| `progress` | v0.2 | provisional |
| `meter` | v0.2 | provisional |
| `image` | v0.2 | provisional |
| `upload` | v0.2 | provisional |
| `slideshow` | v0.2 | provisional |
| `heading` | v0.4 | provisional |
| `todo` | v0.4 | provisional |
| `quote` | v0.4 | provisional |
| `code` | v0.4 | provisional |
| `dataGrid` | v0.5 | provisional |
| `pageTree` | v0.6 | provisional |
| `board` | v0.7 | provisional |
| `calendar` | v0.7 | provisional |
| `viewEmbed` | v0.7 | provisional |
| `toolbar` | v0.9 | provisional |
| `menu` | v0.9 | provisional |
| `externalLink` | v0.10 | provisional |
| `diffView` | v0.12 | provisional |
| `chartView` | v0.13 | provisional |
| `sandboxIframe` | v0.14 | provisional |
| `cell` | v0.20 | provisional |

## Node contracts

### `page`

The view root: a titled container of blocks.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `title` | string | no | Rendered as the page heading, as text; heading omitted when absent (presence rule). |
| `blocks` | node[] | no | Each entry rendered in order (node-position rule); non-array → `[]` (malformed-input rule). |
| `refresh` | number | no | Consumed iff a finite number > 0: the client re-invokes the current view every `max(refresh, 5)` seconds — the ≥ 5 s clamp is normative — while the document is visible, and MUST pause the timer while the document is hidden, resuming on visibility. Re-render SHOULD preserve scroll position and focus. Absent or invalid → no auto-refresh. Each rendered document's own `refresh` governs the timer: a re-invocation that returns a document without a valid `refresh` stops the timer. A failed re-invocation (4xx/5xx/network) leaves the prior render in place and does **not** stop the timer — the next tick retries. |
| `subscribe` | string[] | no | Consumed iff discovery `service.features` contains `event-subscriptions`; when the token is absent the field is ignored entirely. Each entry is an object path validated against the path rule **before any stream is opened**; an entry that fails validation is dropped individually; a non-array value is treated as absent (malformed-input rule). For each honored entry the client subscribes to the topic's event stream (`GET /v1/<path>` with `Accept: text/event-stream`) and, on any data-plane lifecycle event (`onCreate`/`onChange`/`onDelete`) or a gap signal (`gap`), re-invokes the current view. The stream is strictly an invalidation signal: the client MUST NOT interpret or render event names or payloads beyond treating those names as the invalidation set. A client MAY cap the number of honored entries but MUST honor at least the first valid one. Each rendered document's own `subscribe` governs the page's subscriptions, exactly as `refresh` governs its timer. `subscribe` is independent of `refresh`: both may be declared, and neither disables the other. |
| `compose` | compose facet | no | Per the **`compose` facet contract** — the page-level insertion affordance and type menu. |
| `titleEdit` | edit facet | no | Per the **`edit` facet contract**, governing the rendered page heading; consumed iff its `kind` is `"line"` (any other kind → ignored). `value` defaults to `page.title`. This is the rename-the-page affordance — the title is a `page` field, not a node, so it needs its own attachment point. |
| `pager` | `pager` (embedded) | no | Since v0.8. Per the **`pager` shape** and the **Windowed emission** contract on `dataGrid`, by reference — one shared windowing mechanism, not a second one (the `text.runs` reference posture): a long document windows by **block ranges** through the identical affordance group. Absent or non-object → ignored; the node renders exactly as today (malformed-input rule). |

`refresh` and `subscribe` are complementary, not alternatives: `subscribe` is the push mechanism —
the SSE-driven re-invalidation ([ADR-0039](https://github.com/stackumi/restactd/blob/main/spec/decisions/0039-lifecycle-hooks-and-events.md)) that
`refresh` stood in for — and `refresh` is the time-based one, the verb's declared staleness budget
and the working fallback on servers that do not advertise `event-subscriptions`. A view whose
freshness matters everywhere declares both.

Since: v0 (`refresh`: v0.2; `subscribe`: v0.3; `compose`, `titleEdit`: v0.4; `pager`: v0.8).
Status: provisional.

### `section`

A titled vertical grouping of blocks.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `title` | string | no | Rendered as the section heading, as text; omitted when absent (presence rule). |
| `blocks` | node[] | no | Each entry rendered in order (node-position rule); non-array → `[]` (malformed-input rule). |

Since: v0. Status: provisional.

### `grid`

A responsive grid, typically of `card`s.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `items` | node[] | no | Each entry rendered in order as a grid item (node-position rule); non-array → `[]` (malformed-input rule). |

A non-empty grid whose items are all `stat` nodes may receive a denser stat layout; this is a
presentation detail, not contract.

Since: v0. Status: provisional.

### `list`

A vertical list, typically of `card`s or `text`.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `items` | node[] | no | Each entry rendered in order (node-position rule); non-array → `[]` (malformed-input rule). |
| `style` | `"plain"` \| `"bullet"` \| `"number"` | no (default `plain`) | Strict whitelist; any other value → `plain`; the raw value MUST never reach a class name or attribute (text rule). `bullet`/`number` render items with list markers (numbering is display order, client-assigned). `plain` is the unmarked vertical stack. A bulleted/numbered document list is a `list` whose `items` are ordinary nodes (typically `text`) each carrying their own facets — there is no separate list-item node. |

Since: v0 (`style`: v0.4). Status: provisional.

### `card`

A summary tile; if `link` is present the whole card activates it.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `title` | string | no | Rendered as the card heading, as text; heading omitted when absent (presence rule). |
| `subtitle` | string | no | Rendered under the title, as text; omitted entirely when absent (presence rule). |
| `badges` | (string \| `{label, tone?}`)[] | no | Each entry rendered as a chip. A **string** entry (v0) is the chip's text, as text, in the **untoned treatment** (the `badge` node's "The untoned treatment" paragraph, by reference — a bare string is the author saying nothing about meaning, *not* `tone: "neutral"`). An **object** entry (Since v0.16): `label` is the chip's text, as text — nullish or non-string → an empty chip, never the literal `"null"` or `"[object Object]"`; `tone` carries **exactly the `badge.tone` contract by reference** — the same four members, the same strict-whitelist fallback to the untoned treatment, the same text rule, and the same load-bearing sentence: a treatment derived from the label MUST NOT be applied when `tone` is consumed. A consumed `tone` here and a consumed `tone` on a `badge` node MUST select the same treatment in the same client, so a card's chip row and a `badge` in its `fields` can never disagree about one status **when both carry a consumed `tone`**; and a client SHOULD apply the same untoned treatment to a string entry here as to an untoned `badge` node, so the two carriers agree in the untoned state too (a client that hashes one and not the other has reintroduced the finding). Unrecognized keys on the object (including a `type` key) are ignored — the entry is a chip descriptor, not a node. A nullish entry renders an empty chip, never the literal `"null"`; any other non-string, non-object entry renders an empty chip; non-array → no badges (malformed-input rule). *Old-client note:* a pre-v0.16 client stringifies an object entry (`[object Object]`) — authors targeting mixed-version clients emit strings. |
| `fields` | `node`[] | no | Rendered in order within the card. An entry that is an object bearing a string `type` renders per the node-position rule (an ordinary node under the standing rules — the `boardCard.fields` posture); any other entry — a **type-less `{label, value}` object (the v0 form)**, or a nullish or malformed entry — renders as a label/value pair, empty where members are missing (the v0 disposition, preserved verbatim: every pre-v0.10 emission renders unchanged). Non-array → omitted (malformed-input rule). |
| `link` | `{view: string, label?: string}` | no | The card becomes the activation target **iff** `link.view` passes the route rule, and only then: the clickable affordance (styling, **link semantics** — `role="link"` — and focusability) and the activation handlers are applied together, and activation MUST work by pointer **and** by keyboard (Enter MUST activate; Space MAY). The activation target's accessible name SHOULD be the card's `title` when one is rendered (link semantics would otherwise name it by the whole card's text). Since v0.17 — through v0.16 this sentence named `role="button"`, which announces a navigation as a command. An absent, non-string, or invalid `link.view` renders a plain, non-interactive card with none of the above. The route is validated before any fetch (route rule). |
| `link.label` | string | no | Since v0.16. Consumed **iff** the card is linked (above) **and** `label` is present as a string: not consumed when `label` is missing (nullish), non-string, empty, or whitespace-only. When consumed, rendered as the link's visible text, **after every other element of the card** (the card's foot), as text (text rule). **Display only:** the card remains the single activation target; the label carries no handler, role, or focusability of its own, and an activation that begins on the label is the card's own activation, exactly once — a client MUST NOT make the label a second navigation. When not consumed the card renders **exactly as it does without the field** — a client MUST NOT synthesize link text (no "Open", no route text); the card's title stays the activation target's accessible name. A label on a card whose `link.view` is absent or fails the route rule renders nothing and revives nothing: the card stays plain and inert. Whitespace-only is "not consumed" by design — a stated deviation from the presence rule — because an element present in the DOM and empty on screen is indistinguishable from a dropped node (the `link` node's "empty after stringification is malformed" posture). Minted on `card.link` only; `image.link` stays `{view}`. |
| `actions` | `action`[] | no | Each rendered as a button within the card; omitted when empty or non-array (malformed-input rule). An entry whose `type` is not exactly `action` renders as the inert unknown-type placeholder in its position (typed-entry rule, Since v0.16 — a `link` belongs in `fields`, which admits any node). Activating an inline action MUST NOT also activate the card's `link` (the action's events do not propagate to the card). |
| `edit` | edit facet | no | Per the **`edit` facet contract**; a component carrier has no canonical display string, so an `edit` whose `value` is absent is **ignored** (see "Component carriers" in the facet contracts). |
| `move` / `remove` | move/remove facets | no | Per the **`move` and `remove` facet contracts**. |

Since: v0 (`edit`, `move`, `remove`: v0.8 amendment, 2026-07-30; `fields` widened to `node`[]:
v0.10; `badges` widened to admit `{label, tone}` entries, `link.label`, and the `actions`
typed-entry sentence: v0.16; `link`'s link semantics: v0.17). Status: provisional.

### `field`

A single labeled value (one label/value pair).

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `label` | string | no | Rendered as the pair's label, as text; nullish → empty text (malformed-input rule). |
| `value` | string | no | Rendered as the pair's value, as text; nullish → empty text (malformed-input rule). |
| `format` | format hint | no | Since v0.16. Per **Format hints**: consumed iff a member and `value` passes that member's gate; then the value renders as the client's own localized text; otherwise verbatim. |

Since: v0 (`format`: v0.16). Status: provisional.

### `fieldList`

A definition list of label/value pairs — the usual detail body.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `fields` | `{label, value, format?}`[] | no | One label/value pair per entry, in input order; a nullish or malformed entry renders as an empty pair; a nullish `label`/`value` renders as empty text. Any non-array value — **including array-likes such as strings** — is treated as `[]`, with no per-character or per-element coercion (malformed-input rule). |
| `fields[].format` | format hint | no | Since v0.16. Per **Format hints**, applied to that entry's `value`: consumed iff a member and the value passes that member's gate; otherwise verbatim. |
| `edit` | edit facet | no | Per the **`edit` facet contract**; a component carrier has no canonical display string, so an `edit` whose `value` is absent is **ignored** (see "Component carriers" in the facet contracts). |
| `move` / `remove` | move/remove facets | no | Per the **`move` and `remove` facet contracts**. |

Since: v0 (`edit`, `move`, `remove`: v0.8 amendment, 2026-07-30; `fields[].format`: v0.16). Status:
provisional.

### `table`

A data table (an alternate layout of a collection).

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `columns` | string[] | no | One header cell per entry, as text; a nullish entry renders as an empty cell, never the literal `"null"`; non-array → no header cells (malformed-input rule). |
| `rows` | string[][] | no | One row per entry, one cell per row entry, as text; a nullish cell renders as empty text; a non-array row entry renders as an empty row; non-array → no rows (malformed-input rule). |
| `sortable` | boolean | no | Consumed iff exactly `true`: column headers become sort controls, operable by pointer **and** by keyboard. Sorting is purely client-side over the delivered rows; it MUST NOT issue any request. The first activation of a header sorts ascending by that column; activating the same header again reverses; a different header restarts ascending. Initial render is document order. Every sort is computed from document order — stability is relative to document order, not to the currently displayed order — so the ascending sort MUST be stable (equal cells keep their document order) and MUST use the comparison rule below; descending is the stable sort under the mirrored comparator. |
| `pageSize` | integer | no | Consumed iff a finite integer ≥ 1: rows render in client-side pages of `pageSize` with previous/next controls and a position indicator; else ignored (all rows shown). When both apply, sorting applies to the full row set **before** pagination, and activating a sort resets the view to the first page. Paging MUST NOT issue any request. |
| `columnFormats` | (string \| null)[] | no | Since v0.16. Parallel to `columns` by index (the `rowLinks` idiom): an entry is consumed iff it is a **Format hints** member, and then applies to every cell of that column — each cell renders per that member (localized text when the cell passes the gate, verbatim otherwise). `null`, missing, non-string, or unrecognized entries format nothing; entries beyond `columns.length` are ignored; non-array → no hints (malformed-input rule). Display only: the comparison rule below operates on the **raw** cell, unchanged. |
| `rowLinks` | (string \| null)[] | no | Parallel to `rows` by original index; the pairing is established once at render and survives sorting and pagination. An entry is consumed iff it passes the route rule; then the row navigates to that route. **Pointer:** activation anywhere on the row activates it, exactly once, and the row shows the link affordance. **Keyboard and assistive technology** (Since v0.17): the row keeps its table-row semantics — a row of a table MUST NOT be given another role — and exactly **one** element inside the row carries link semantics (`role="link"`), focusability and keyboard activation (Enter MUST activate; Space MAY): an element wrapping the content of the first cell, in column order, whose rendered text is non-empty after trimming ASCII whitespace (never the cell or row element itself), with that cell's rendered text as its accessible name. A row whose every cell is empty after trimming renders plain — a link with no accessible name is not offered. Through v0.16 this entry said the whole row activated "exactly as `card.link`", which put `role="button"` on a table row. A `null`, missing, non-string, or invalid entry renders a plain row. `rowLinks` entries with no corresponding row (an array longer than `rows`) are ignored. Non-array → no row links (malformed-input rule). Routes are validated before any fetch (route rule). |
| `edit` | edit facet | no | Per the **`edit` facet contract**; a component carrier has no canonical display string, so an `edit` whose `value` is absent is **ignored** (see "Component carriers" in the facet contracts). |
| `move` / `remove` | move/remove facets | no | Per the **`move` and `remove` facet contracts**. |

**Comparison rule (normative).** Let `norm(c)` be the cell stringified per the malformed-input
rule (nullish → `""`), then trimmed of ASCII whitespace. A cell is **numeric** iff, after removing
one leading `$` and then all `,` characters, the remainder matches `^-?[0-9]+(\.[0-9]+)?$`; its
numeric value is that remainder parsed as a decimal number. For cells `a`, `b` in the sort column,
ascending order is: both numeric → by numeric value; exactly one numeric → the numeric cell first;
neither → compare `norm(a).toLowerCase()` against `norm(b).toLowerCase()` by UTF-16 code units,
ties broken by comparing `norm(a)` against `norm(b)` by code units. Code units are used instead of
locale collation because locale collation is environment-dependent — two conforming clients could
disagree; code-unit comparison is exactly reproducible in a test. ISO dates (`YYYY-MM-DD`) and
times (`HH:MM`) order correctly as text under this rule; `$`-prefixed amounts and comma-grouped
numbers order numerically; other currency symbols order as text (authors format sortable columns
accordingly).

Since: v0 (`sortable`, `pageSize`, `rowLinks`: v0.2; `edit`, `move`, `remove`: v0.8 amendment,
2026-07-30; `columnFormats`: v0.16; `rowLinks`' in-row link element: v0.17). Status: provisional.

### `text`

A block of body text.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `value` | string | no | Rendered as text; nullish → empty text (malformed-input rule). |
| `style` | `"body"` \| `"muted"` \| `"heading"` \| `"pre"` | no (default `body`) | Strict whitelist: any other value — absent, non-string, or unrecognized (including multi-token strings) — MUST fall back to `body`, and the raw value MUST never reach a class name or attribute (text rule). Unchanged in v0.4: `heading` remains a presentation style; document headings are the dedicated `heading` node. `pre` (Since v0.16) is pre-formatted **prose**: a client that consumes it MUST preserve every line break and every run of whitespace in the displayed text as rendered whitespace (whitespace-only lines are content and MUST NOT be collapsed), MUST wrap a line that overflows its container — never a horizontal scroll, never an overflow that widens the page — **including a single unbroken run of non-whitespace characters longer than the container, which MUST also wrap** (a client that preserves whitespace without also breaking long unbroken runs — a 400-character URL, a base64 blob — has not satisfied this obligation; T3-F6's 1,659 px line was exactly that), and renders in the body register, the same face and size as `body`, **not** monospace (a verbatim monospace block is `code`). The style applies to whichever text the node displays (`value`, or `runs` when consumed), and nothing in it is ever parsed as markup. A pre-v0.16 client falls back to `body` by this same row: the words render, the line structure collapses — lost layout, never lost content. |
| `runs` | entry[] | no | Inline rich text. Each entry is `{text, marks?, view?}`. Present and non-empty **after per-entry validation** → `runs` supersedes `value` for display; otherwise the node renders `value` as above. Per entry: `text` — the run's content, as text (text rule; a nullish `text` drops the entry); `marks` — array of mark tokens from the closed set `"b"` \| `"i"` \| `"code"` \| `"link"`, each consumed iff exactly a member (strict whitelist; unknown or non-string tokens are ignored individually and MUST never reach a class name, attribute, or markup; non-array → no marks); `view` — consumed iff the entry's marks include `link` **and** it passes the route rule, making the run an activation target exactly like a `link` node (pointer + keyboard activation, validated before any fetch); a `link` mark without a valid `view` renders the run as plain text (inert). Marks compose (a run may be bold **and** code). **Nothing in a run is ever parsed as markup** — a run's `text` containing `**` or `<b>` renders those characters literally. Non-array `runs` → absent (malformed-input rule). |
| `markdown` | string | no | Since v0.18. It is consumed iff it is a non-empty string and the client implements the [contract](#markdown-rendering-contract-since-v018). When consumed it supersedes `runs` and `value` for display. `style` applies only as `body`/`muted` register (`heading` and `pre` fall back to `body`). Nullish or non-string → absent (malformed-input rule). With `edit`, `edit.value` is the markdown source, and edit capture stays plain text. |
| `edit` | edit facet | no | Per the **`edit` facet contract**. Authors pair it with `runs` by supplying the stored rich-text source as `edit.value`; the client never parses or serializes any markup shorthand except display rendering of `markdown` per the [contract](#markdown-rendering-contract-since-v018) — parsing is server-side (see [`../presentation-verbs.md`](../presentation-verbs.md) §4). |
| `move` / `remove` | move/remove facets | no | Per the **`move` and `remove` facet contracts**. |

Authoring guidance: a verb emitting `runs` SHOULD also emit `value` as the plain-text flattening —
pre-v0.4 clients ignore `runs` and render `value`, so the words never disappear; a v0.4 client
ignores `value` when `runs` is consumed. A verb emitting `markdown` (Since v0.18) SHOULD also emit
`value`, preferably the raw source.

Since: v0 (`runs`, `edit`, `move`, `remove`: v0.4; `style: "pre"`: v0.16; `markdown`: v0.18).
Status: provisional.

### `badge`

A chip.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `label` | string | no | Rendered as the chip's text; nullish → empty text (malformed-input rule). |
| `tone` | `"ok"` \| `"warn"` \| `"danger"` \| `"neutral"` | no (default: the untoned treatment) | Strict whitelist: any other value — absent, non-string, or unrecognized — MUST fall back to the untoned treatment (below), and the raw value MUST never reach a class name or attribute (text rule). A consumed value selects the client's own semantic treatment for that meaning — success, caution, danger, muted respectively; the palette, the contrast, and any accompanying non-color cue are the client's and are non-normative. The field is presentational only: it MUST NOT change what text renders, MUST NOT make the chip interactive, and carries no authorization, validation, or enforcement meaning. |
| `edit` | edit facet | no | Per the **`edit` facet contract**; a component carrier has no canonical display string, so an `edit` whose `value` is absent is **ignored** (see "Component carriers" in the facet contracts). |
| `move` / `remove` | move/remove facets | no | Per the **`move` and `remove` facet contracts**. |

**The untoned treatment (Since v0.15).** With no consumed `tone` a badge renders as it always has:
this registry does not constrain that treatment, and a client MAY derive it from the label
(deriving a hue by hashing the label is one shipped choice) or use a single neutral chip. What the
registry does now say is that a treatment derived from the label MUST NOT be applied when `tone`
is consumed — a label-derived hue is arbitrary with respect to meaning, so "out of stock" can
otherwise render in a client's success color. Authors who need the meaning carried supply `tone`;
a pre-v0.15 client ignores it (unknown-field rule) and renders the untoned treatment, which is
exactly today's rendering.

Since: v0 (`edit`, `move`, `remove`: v0.8 amendment, 2026-07-30; `tone`: v0.15). Status: provisional.

### `link`

Client-side navigation to another view route.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `view` | string (verb route) | yes | MUST pass the route rule (string, grammar-valid) before any handler is wired; validated before any fetch. Missing, non-string, or invalid → the control renders inert (non-interactive text) and navigation is unreachable. |
| `label` | string | yes | Rendered as the link's text. A label that is missing (nullish), non-string, or empty after stringification is malformed input: the control renders inert (malformed-input rule). The client MUST NOT substitute the route text for a missing label. |
| `edit` | edit facet | no | Per the **`edit` facet contract**; a component carrier has no canonical display string, so an `edit` whose `value` is absent is **ignored** (see "Component carriers" in the facet contracts). |
| `move` / `remove` | move/remove facets | no | Per the **`move` and `remove` facet contracts**. |
| `current` | boolean | no (default `false`) | Since v0.19. Marks this link as leading to the view the reader is on — the current tab of a view switcher, the current entry of a navigation group. Consumed iff the value is exactly `true`; any other value, including a truthy non-boolean, is not current. When consumed, the client renders its own current treatment and exposes the state to assistive technology (for example as `aria-current`). **Presentational only:** the route, its validation, and activation are unchanged — a current link stays a link — and it is never an authorization or security signal. Currentness is the verb's statement: a client MUST NOT infer it from `label` or by comparing `view` with its own location, and renders every `link` that carries it as marked (the registry sets no cap and does not rank them). The field travels with the `link` node wherever it appears. A pre-v0.19 client ignores it (unknown-field rule) and renders the link unmarked. |

Since: v0 (`edit`, `move`, `remove`: v0.8 amendment, 2026-07-30; `current`: v0.19). Status: provisional.

### `action`

A button that invokes an action verb, then refreshes the view.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `verb` | string (verb route) | yes | MUST pass the route rule (string, grammar-valid) before any handler is wired; validated before any fetch. Missing, non-string, or invalid → the control renders inert (non-interactive text) and the invocation is unreachable. |
| `label` | string | yes | Rendered as the button's text. A label that is missing (nullish), non-string, or empty after stringification is malformed input: the control renders inert (malformed-input rule). The client MUST NOT substitute the route text for a missing label. |
| `input` | object | no | Passed as the invocation payload; absent → `{}`. |
| `confirm` | string | no | Present (presence rule) and non-empty after stringification → activation becomes a two-step inline confirm: the first activation transforms the control in place into a confirm state that displays the confirm text **as text** with explicit confirm and cancel affordances; only the confirming activation invokes the verb; cancel restores the control. The client MUST NOT use `window.confirm` or any blocking dialog. Advisory UX, never a security control (advisory-validation rule) — the server enforces preconditions regardless. Absent, nullish, or empty → single-step activation. |
| `emphasis` | `"primary"` \| `"default"` | no (default `default`) | Strict whitelist: any other value — absent, non-string, or unrecognized — MUST fall back to `default`, and the raw value MUST never reach a class name or attribute (text rule). `primary` marks the surface's principal control. A client that consumes it gives the control **at most the visual weight it gives a `form` submit**, and MUST NOT change the control's behavior on its account — the same route, the same payload, the same `confirm` step, the same notification. The registry places no cap on how many `action` nodes in one document carry `primary`; a client MUST render every one of them and MUST NOT suppress, reorder, or de-duplicate on that basis (an author emitting several has simply made none of them principal). |
| `tone` | `"default"` \| `"danger"` | no (default `default`) | Strict whitelist: any other value — absent, non-string, or unrecognized — MUST fall back to `default`, and the raw value MUST never reach a class name or attribute (text rule). `danger` marks a control whose invocation is destructive; a client that consumes it renders the control in its own danger treatment (palette, contrast, and any non-color cue non-normative). Presentational only, and **never a security control**: it MUST NOT change the route, the payload, or whether the verb is invoked, it does not itself introduce a confirmation step, and the server enforces every precondition regardless (advisory-validation rule). Authors marking a control `danger` SHOULD also supply `confirm`; the two fields are independent and either may appear without the other. |

On activation the client disables the control synchronously, then invokes the verb. On success it
surfaces an `ok` notification and re-renders the current view so the action's effect is visible;
on failure it re-enables the control and surfaces an `err` notification (notification rule; copy
non-normative). Inside a linked `card`, activation MUST NOT also activate the card's link (see
`card`).

`emphasis` and `tone` are independent axes and any combination is legal, including
`emphasis: "primary"` with `tone: "danger"` — a destructive control can be the principal one on a
surface whose whole purpose is that act. A client resolves the combination in its own visual
system; the registry does not rank them, and it specifies no absolute visual weight anywhere —
`emphasis`'s cap is deliberately **relative** to a treatment the client already has (its own
`form` submit), because an absolute one would be unimplementable in a registry that never
prescribes appearance.

Both fields are minted on `action` only. A `form`'s submit is the surface's principal control by
construction and needs no marker; a `link` navigates rather than commits, so a danger treatment on
one would name no destructive act. The fields travel with the `action` node wherever it appears —
a `card.actions` entry, a `toolbar` item, a `menu` entry, the `gridColumn.sortToggle` and
`dataGrid.addRow` slots (Since v0.19), the `cell.run` slot and `cell.settings` entries (Since
v0.20) — because those carriers add no behavior
of their own and every entry keeps its own contract; a client renders the treatment in whatever
form its compact or disclosed context allows.

Since: v0 (`confirm`: v0.2; `emphasis`, `tone`: v0.15). Status: provisional.

### `form`

A form; submit invokes an action verb with the field values as input.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `title` | string | no | Rendered as the form's heading, as text, **inside** the form block; omitted when absent (presence rule). A form is a composable block and MUST NOT claim page-level chrome (no page wrapper, no page-title heading). |
| `fields` | entry[] | no | One input row per entry, in order; each entry is `{name, label?, placeholder?, value?, type?, options?, suggestions?, required?, min?, max?, step?, minLength?, maxLength?}` per the rows below; non-array → no rows (malformed-input rule). A `null` entry MUST render as a skipped/inert row — the renderer MUST NOT throw. |
| `fields[].name` | string | no | The input's name and its key in the submit payload; nullish → empty string. |
| `fields[].label` | string | no | The row's label, as text; nullish → falls back to `name` (an empty string stays empty — presence rule). |
| `fields[].placeholder` | string | no | The input's placeholder; nullish → empty (presence rule: falsy non-null values render stringified). |
| `fields[].value` | string | no | The input's initial value; nullish → empty (presence rule: falsy non-null values render stringified). For `type` `checkbox` and `select`, see the encoding pins below. |
| `fields[].type` | `"text"` \| `"textarea"` \| `"select"` \| `"checkbox"` \| `"number"` \| `"date"` \| `"time"` \| `"email"` \| `"tel"` | no (default `text`) | Strict whitelist: absent, non-string, or unrecognized → `text`; the raw value MUST never reach a class name, attribute, or markup (text rule). Each value maps to the corresponding native input control (a `textarea` element for `textarea`; a `select` for `select`). |
| `fields[].options` | (string \| `{label?, value}`)[] | no | Consumed only when `type` is `select`: one option per entry. A **string** entry is rendered as text and submitted verbatim (value = label). An **object** entry (Since v0.16): `value` is the string **submitted** when the option is selected — nullish or non-string → the entry is skipped (an option that cannot be submitted is not an option); `label` is the text **rendered**, nullish → falls back to `value`; rendered as text. **A client MUST submit `value` and only `value`** — never the label, never a concatenation, never a string derived from the label: the split exists so the visible text can be a name while the submitted string is an identifier. Unrecognized keys are ignored. A nullish entry is skipped; any other non-string, non-object entry is skipped. When `type` is `select` and `options` is absent, non-array, or empty after skipping, the field degrades to a `text` input. When `value` (prefill) equals an option's submitted string (a string entry itself, or an object entry's `value`), that option is preselected; otherwise the first option is. Ignored for other types. *Old-client note:* a pre-v0.16 client stringifies an object entry and submits `[object Object]` — the server's own validation is the backstop (advisory-validation rule); authors targeting mixed-version clients emit strings. |
| `fields[].suggestions` | string[] | no | For the free-text types (`text`, `email`, `tel`): rendered as a datalist of autocomplete hints, as text; nullish entries skipped; non-array → ignored. Ignored for other types. Suggestions never constrain the submitted value. |
| `fields[].required` | boolean | no | Advisory (advisory-validation rule). Consumed iff exactly `true`; any other value ignored. Marks the input required for native constraint validation and visible affordance. |
| `fields[].min` / `fields[].max` | number \| string | no | Advisory (advisory-validation rule). For `type` `number`: consumed iff a finite number. For `type` `date`: consumed iff a string matching the `YYYY-MM-DD` **shape** (`^\d{4}-\d{2}-\d{2}$`); calendar validity (e.g. rejecting `2026-02-31`) is the native date input's concern, not this shape check. For `type` `time`: consumed iff a string matching the `HH:MM` shape (`^\d{2}:\d{2}$`), 24-hour validity likewise deferred to the native input. Otherwise ignored. Applied via the native input's min/max. |
| `fields[].step` | number | no | Advisory (advisory-validation rule). Consumed iff `type` is `number` and the value is a finite positive number; else ignored. |
| `fields[].minLength` / `fields[].maxLength` | integer | no | Advisory (advisory-validation rule). Consumed for `type` `text`, `textarea`, `email`, `tel` iff a non-negative integer; else ignored. |
| `submit` | `{label?, verb, extra?, confirm?}` | no | Absent → the form renders but is inert: it never invokes anything. |
| `submit.label` | string | no | The submit button's text; nullish → the default label `"Submit"` (an empty string stays empty — presence rule). |
| `submit.verb` | string (verb route) | yes (to submit) | Validated per the route rule **at submit time, before invocation**. Missing, non-string, or invalid → an `err` notification and the verb is never invoked; the form still renders. |
| `submit.extra` | object | no | Merged into the submit payload alongside the fields' live values. On a key collision between a field `name` and an `extra` key, **`extra` wins** — server-pinned context is not user-overridable. |
| `submit.confirm` | string | no | Identical contract to `action.confirm`: present and non-empty → submission becomes a two-step inline confirm (confirm text rendered as text; no `window.confirm` or blocking dialog), and only the confirming activation invokes `submit.verb`. Advisory UX, never a security control (advisory-validation rule). |
| `edit` | edit facet | no | Per the **`edit` facet contract**; a component carrier has no canonical display string, so an `edit` whose `value` is absent is **ignored** (see "Component carriers" in the facet contracts). |
| `move` / `remove` | move/remove facets | no | Per the **`move` and `remove` facet contracts**. |

**Submit-payload encoding (normative).** All submitted values are strings, keyed by `name`, as
today. A `checkbox` field submits `"true"` when checked and is **omitted from the payload
entirely** when unchecked; its prefill is checked iff `value === "true"`. A `select` field submits
the selected option string verbatim. `number`, `date`, and `time` fields submit the native input's
own value string — never a reformatted or reparsed value: `number` submits the raw numeric string
the control holds (which may be `""` when empty), `date` submits `YYYY-MM-DD`, and `time` submits
`HH:MM` (24-hour). The server parses and validates these strings (advisory-validation rule).

Submission never navigates the browser (default submit is prevented). In flight, the submit
button is disabled; on failure it re-enables with an `err` notification; on success an `ok`
notification is surfaced (notification rule; copy non-normative). Post-success navigation is
app-level and non-normative.

Since: v0 (`fields[].type`/`options`/`suggestions`/`required`/`min`/`max`/`step`/`minLength`/
`maxLength` and `submit.confirm`: v0.2; `edit`, `move`, `remove`: v0.8 amendment, 2026-07-30;
`fields[].options` widened to admit `{label, value}` entries: v0.16). Status: provisional.

### `stat`

A single metric tile.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `value` | string \| number | no | Rendered as the metric, as text; nullish → an em dash (`—`) placeholder; an empty string stays empty. |
| `label` | string | no | Always rendered under the value, as text; nullish → empty text (malformed-input rule). |
| `hint` | string | no | Rendered as a hint line; omitted when absent (presence rule). |
| `format` | format hint | no | Since v0.16. Per **Format hints**, applied to `value` (a number is stringified first): consumed iff a member and the value passes that member's gate; then the metric renders as the client's own localized text; otherwise verbatim. The em-dash placeholder for a nullish `value` is unchanged. |
| `edit` | edit facet | no | Per the **`edit` facet contract**; a component carrier has no canonical display string, so an `edit` whose `value` is absent is **ignored** (see "Component carriers" in the facet contracts). |
| `move` / `remove` | move/remove facets | no | Per the **`move` and `remove` facet contracts**. |

Since: v0.1 (`edit`, `move`, `remove`: v0.8 amendment, 2026-07-30; `format`: v0.16). Status: provisional.

### `barChart`

A horizontal bar chart; `bars` are **leaf data** (not nodes), auto-scaled to the max.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `title` | string | no | Rendered as the block title, as text; omitted when absent (presence rule). |
| `unit` | string | no | Appended after each bar's value, space-separated, when present and its stringified form is non-empty; nullish or `""` → no suffix. |
| `bars` | `{label, value}`[] | no | One bar row per entry, in order; non-array → no rows (malformed-input rule). A nullish entry MUST render as an empty-label row — the renderer MUST NOT throw. |
| `bars[].label` | string (leaf) | no | Rendered as the bar's label, as text; nullish → empty text. Leaf data: never interpreted as a child node, even when node-shaped. |
| `bars[].value` | number (leaf, coerced) | no | Rendered as the bar's value text, with a fill proportional to the largest **finite** positive value among the bars. A value that is zero, negative, or non-numeric MUST show exactly zero fill; a positive value whose proportion rounds to zero MAY be floored to a minimally visible fill. The fill mechanism (attribute, inline style, animation timing) is non-normative; only this observable contract is. |
| `edit` | edit facet | no | Per the **`edit` facet contract**; a component carrier has no canonical display string, so an `edit` whose `value` is absent is **ignored** (see "Component carriers" in the facet contracts). |
| `move` / `remove` | move/remove facets | no | Per the **`move` and `remove` facet contracts**. |

Behavior for non-finite values (`Infinity`, `NaN` after coercion) is unspecified beyond the
malformed-input rule's no-throw, text-only degradation.

Since: v0.1 (`edit`, `move`, `remove`: v0.8 amendment, 2026-07-30). Status: provisional.

### `columns`

A responsive multi-column layout; each inner array is one column of nodes.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `of` | node[][] | no | One column per entry, each column's nodes rendered in order (node-position rule); non-array → no columns (malformed-input rule). A non-array entry in `of` renders as an **empty column** — it is not coerced into a one-node column. |
| `edit` | edit facet | no | Per the **`edit` facet contract**; a component carrier has no canonical display string, so an `edit` whose `value` is absent is **ignored** (see "Component carriers" in the facet contracts). |
| `move` / `remove` | move/remove facets | no | Per the **`move` and `remove` facet contracts**. |

Since: v0.1 (`edit`, `move`, `remove`: v0.8 amendment, 2026-07-30). Status: provisional.

### `divider`

A hairline rule, optionally labeled.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `label` | string | no | Present (presence rule) → a labeled rule carrying the label as text; absent → a bare rule with no label element. |
| `move` / `remove` | move/remove facets | no | Per the **`move` and `remove` facet contracts**. |

Since: v0.1 (`move`, `remove`: v0.4). Status: provisional.

### `callout`

An accented note; `hero` carries a page thesis.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `style` | `"info"` \| `"hero"` \| `"ok"` \| `"warn"` \| `"danger"` | no (default `info`) | Strict whitelist: any other value — absent, non-string, or unrecognized — MUST fall back to `info`, and the raw value MUST never reach a class name or attribute (text rule). `danger` (Since v0.15) carries a refusal or a destructive outcome — a request the server declined, or something the reader has lost — and a client that consumes it renders the note in its own danger treatment, distinct from `warn`'s caution treatment (palette, contrast, and any non-color cue non-normative). Presentational only: it changes no other client obligation on this node, and a pre-v0.15 client falls back to `info` by this same row. |
| `title` | string | no | Rendered as the callout's title, as text; omitted when absent (presence rule). |
| `value` | string | no | The callout's body, always rendered, as text; nullish → empty text (malformed-input rule). |
| `actions` | (`action` \| `link`)[] | no | Since v0.16. Rendered as the note's control row, in order, each entry per its own contract, validated independently (route rule before wiring). An entry whose `type` is not exactly `action` or `link` renders as the inert unknown-type placeholder in its position (typed-entry rule); nullish entries render nothing; non-array → no control row (malformed-input rule). A callout adds no behavior of its own: activating an entry does what that entry does and **MUST NOT dismiss the note on its account** (the `toolbar` posture — every entry keeps its own contract). |
| `dismiss` | boolean | no | Since v0.16. Consumed **iff** exactly `true`: the note renders a dismiss affordance, operable by pointer and by keyboard; activating it hides the note on the current surface. Dismissal is **client-local presentation state**: it MUST NOT issue any request, MUST NOT be round-tripped to the server, and MUST NOT be treated as an acknowledgement of the content by anyone. A client MAY keep the note hidden across repaints of the same view within the session when the node carries an `id` **and the node's rendered content is unchanged** (the Identity rule's "transient UI state across a refresh of unchanged content", no more): a change to the note's rendered content — for example its `style`, `title`, `value`, or `actions` — MUST bring it back, so a verb that re-uses an `id` for a new message is never silenced by an old dismissal; without an `id` a repaint MAY restore it. Any other value → no dismiss affordance. |
| `edit` | edit facet | no | Per the **`edit` facet contract**, governing the body. Unlike the component carriers, this node has a canonical display string: `value` defaults to this node's `value` (see the `edit` facet's `value` row). |
| `move` / `remove` | move/remove facets | no | Per the **`move` and `remove` facet contracts**. |

Since: v0.1 (`move`, `remove`: v0.4; `edit`: v0.8 amendment, 2026-07-30; `style: "danger"`: v0.15;
`actions`, `dismiss`: v0.16). Status: provisional.

### `tabs`

Client-side tabbed panels; switching never fetches.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `items` | `{label, blocks}`[] | no | One tab per entry, in order; non-array → `[]` (malformed-input rule); a nullish or malformed entry renders as a tab with an empty label and an empty panel — never skipped. `label`: string, rendered as the tab's text; nullish → empty text. `blocks`: node[], the panel's content per the node-position rule. Exactly one panel is visible at a time; switching is client-side only and MUST NOT issue any request. Tabs MUST be operable by keyboard. |
| `initial` | number | no | The initially selected tab's index; consumed iff a finite integer within `0..items.length-1`; else `0`. |
| `edit` | edit facet | no | Per the **`edit` facet contract**; a component carrier has no canonical display string, so an `edit` whose `value` is absent is **ignored** (see "Component carriers" in the facet contracts). |
| `move` / `remove` | move/remove facets | no | Per the **`move` and `remove` facet contracts**. |

Author guidance: content inside a `tabs` node is invisible to pre-v0.2 clients (the node degrades
to an inert placeholder — children are never reparented); do not put content old clients need
inside one.

Since: v0.2 (`edit`, `move`, `remove`: v0.8 amendment, 2026-07-30). Status: provisional.

### `accordion`

A disclosure list — `<details>`/`<summary>` semantics.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `items` | `{label, blocks, open?}`[] | no | One disclosure row per entry, in order; non-array → `[]` (malformed-input rule); a nullish or malformed entry renders as a closed row with an empty summary. `label`: string, the summary text; nullish → empty text. `blocks`: node[] per the node-position rule. `open`: consumed iff exactly `true` → initially expanded; any other value → closed. Toggling is client-side only and MUST NOT issue any request. |
| `edit` | edit facet | no | Per the **`edit` facet contract**; a component carrier has no canonical display string, so an `edit` whose `value` is absent is **ignored** (see "Component carriers" in the facet contracts). |
| `move` / `remove` | move/remove facets | no | Per the **`move` and `remove` facet contracts**. |

Since: v0.2 (`edit`, `move`, `remove`: v0.8 amendment, 2026-07-30). Status: provisional.

### `progress`

Determinate progress toward a known total (task completion, seats booked).

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `label` | string | no | Rendered as text with the track; omitted when absent (presence rule). |
| `value` | number (coerced) | no | Consumed iff a finite number after coercion; else zero fill. Fill proportion = `clamp(value, 0, max) / max`; a negative value is likewise zero fill. |
| `max` | number | no | Consumed iff a finite number > 0; absent or invalid → `100`. |
| `edit` | edit facet | no | Per the **`edit` facet contract**; a component carrier has no canonical display string, so an `edit` whose `value` is absent is **ignored** (see "Component carriers" in the facet contracts). |
| `move` / `remove` | move/remove facets | no | Per the **`move` and `remove` facet contracts**. |

The control MUST expose value/max to assistive technology as a progress semantic. The fill
mechanism is non-normative.

Since: v0.2 (`edit`, `move`, `remove`: v0.8 amendment, 2026-07-30). Status: provisional.

### `meter`

A measurement against thresholds (e.g. budget consumed) — HTML-`<meter>`-shaped.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `label` | string | no | As `progress.label`. |
| `value` | number (coerced) | no | As `progress.value`. |
| `max` | number | no | As `progress.max` (default `100`). |
| `warnAt` / `dangerAt` | number | no | **Absolute values on the same scale as `max`** (never fractions). Each is consumed independently iff a finite number; a non-numeric threshold is simply absent. The tier comparison uses the **raw coerced `value`, not the clamped fill value** — thresholds are unclamped, and an over-target `value` greater than `max` is real (e.g. an over-budget expense), so it MUST reach the `danger` tier. Tier: `danger` iff `dangerAt` is present and (raw) `value ≥ dangerAt`; else `warn` iff `warnAt` is present and (raw) `value ≥ warnAt`; else `ok`. A non-finite `value` (zero fill) is `ok`. The tier selects presentation only and MUST NOT be conveyed by color alone (fill position carries the same information). |
| `edit` | edit facet | no | Per the **`edit` facet contract**; a component carrier has no canonical display string, so an `edit` whose `value` is absent is **ignored** (see "Component carriers" in the facet contracts). |
| `move` / `remove` | move/remove facets | no | Per the **`move` and `remove` facet contracts**. |

Since: v0.2 (`edit`, `move`, `remove`: v0.8 amendment, 2026-07-30). Status: provisional.

### `image`

An image whose bytes live on the data plane, with declarative, non-destructive edit rendering.
The bytes are served by the data plane's binary object values
([ADR-0053](https://github.com/stackumi/restactd/blob/main/spec/decisions/0053-data-plane-enablers-query-negotiation-binary.md)): `GET /v1/{path}`
returns them with the stored `Content-Type`.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `src` | string (object path) | yes | MUST pass the **path rule** before any fetch; fetched same-origin from the data plane (`/v1/` + path), exactly one attempt per render. Missing or invalid → the node renders as an inert placeholder carrying the `alt` text, with no fetch. A failed fetch (4xx/5xx/network) degrades to the same alt-text placeholder. In either degraded case, `caption`, if present, still renders below the placeholder (it does not depend on the image bytes). |
| `alt` | string | no | The image's alternative text; nullish → empty (a decorative image). |
| `caption` | string | no | Rendered as text below the image; omitted when absent (presence rule). |
| `rotate` | number | no | Consumed iff exactly one of `0`, `90`, `180`, `270`; any other value → `0`. Rendered as a quarter-turn transform; `90`/`270` MUST swap the layout box's aspect so the rotated image is fully contained. |
| `crop` | `"original"` \| `"square"` \| `"wide"` | no (default `original`) | Strict whitelist; any other value → `original`; the raw value MUST never reach a class name, attribute, or style (text rule). `square` renders a 1:1 viewport, `wide` a 16:9 viewport, both via aspect-ratio + cover-fit; `original` renders the intrinsic aspect. |
| `filters` | object | no | Whitelisted keys only: `grayscale`, `sepia` (each clamped to `[0, 1]`), `saturate`, `brightness`, `contrast` (each clamped to `[0.25, 2]`). A key is consumed iff its value is a finite number, then clamped to its range; non-finite/non-numeric values and unknown keys are ignored; non-object → no filters. The client serializes the CSS filter list itself from the clamped numbers — **no author-supplied string or unclamped number ever reaches a style property**, so untrusted values cannot produce hostile CSS. |
| `link` | `{view: string}` | no | The image becomes the activation target **iff** `link.view` passes the route rule, identically to `card.link`: the clickable affordance (styling, link semantics — `role="link"`, Since v0.17 — and focusability) and the activation handlers are applied together, activation MUST work by pointer **and** by keyboard (Enter MUST activate; Space MAY), and the route is validated before any fetch (route rule). An absent, non-string, or invalid `link.view` renders a plain, non-interactive image. The `alt` text SHOULD serve as the accessible name of the activation target. |
| `move` / `remove` | move/remove facets | no | Per the **`move` and `remove` facet contracts**. |

Since: v0.2 (`move`, `remove`: v0.4; `link`'s link semantics: v0.17). Status: provisional.

### `upload`

Binary upload of one or more files to the data plane, each followed by a registering verb
invocation (one file per activation unless `multiple` is consumed).
**Discovery-gated**: when `service.features` lacks `binary-values`, the node renders **inert with
a visible notice** (copy non-normative) — not an unknown-type placeholder; the node is known but
the capability is absent.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `label` | string | yes | The control's visible label, as text. A label that is missing (nullish), non-string, or empty after stringification is malformed input: the control renders inert (as `action.label`). |
| `pathPrefix` | string (object path) | yes | MUST pass the **path rule** (note: no trailing slash). The client forms the destination path as `pathPrefix + "/" + segment`, where `segment` is a client-generated unique token matching `[A-Za-z0-9_-]+`; the full path MUST itself satisfy the path rule — including its ≤ 1024-character limit, so a `pathPrefix` long enough that the generated path exceeds 1024 characters renders the control inert. Missing or invalid → the control renders inert. |
| `accept` | string | no | Split on `,`, trimmed; an entry is consumed iff it matches `^(image\|audio\|video\|text\|application)/([A-Za-z0-9.+\-]+\|\*)$` or `^\.[A-Za-z0-9]+$`; other entries are dropped. Surviving entries feed the file picker's filter; none surviving or absent → no filter. Advisory only — the picker filter is UX, not a control. |
| `then` | `{verb, label?, emphasis?}` | yes | `then.verb` MUST pass the route rule **at render time**; missing or invalid → the whole control renders inert. `then.label`: the submit affordance's text; nullish → a default label (copy non-normative). `then.emphasis` (Since v0.16): **exactly the `action.emphasis` contract by reference** — `"primary"` \| `"default"`, default `default`, strict whitelist, text rule, at most the visual weight the client gives a `form` submit, and no change to behavior on its account (same `PUT`, same `then.verb`, same input, same notification). |
| `multiple` | boolean | no | Since v0.16. Consumed **iff** exactly `true` (any other value → single-file, today's control). The picker admits several files. On activation the client processes the selected files **one at a time, in picker order**: each file is `PUT` to its own generated path (the `pathPrefix` rule, one fresh `segment` per file), and on that `PUT`'s 2xx `then.verb` is invoked **once for that file** with that file's input (the Behavior paragraph) — never a batched payload, so a `then` verb written for a single upload keeps working unchanged. A non-2xx `PUT` or a failed `then` invocation for one file surfaces `err` (copy non-normative; SHOULD name the failing file's generated `path`), re-enables the control, and **stops the sequence**: files after it are not sent; files already registered stay registered (no rollback — the server owns what it accepted). A file whose `PUT` succeeded and whose `then` invocation then failed is a **stored object with no registration** — the same orphan the single-file path can leave today; a sequence makes it likelier, and the `path` that same `err` names is what the author's verb or an operator reconciles. The client MAY coalesce the per-file `ok` notifications and re-renders into one at the end of a fully successful sequence; it MUST NOT coalesce an `err`. In flight the control is disabled for the whole sequence; activation with no file selected stays a no-op. |

Behavior: activation with no file selected is a no-op (no `PUT`, no notification, control stays
enabled). On activation with a file selected, the client `PUT`s the raw bytes to `/v1/{path}`
(same-origin) with `Content-Type` = the file's reported MIME type when it is a well-formed media
type matching `^(image|audio|video|text|application)/[A-Za-z0-9.+\-]+$`, else
`application/octet-stream`; on 2xx it invokes `then.verb` with input `{path, contentType, bytes}`
(Since v0.16; `{path}` before it): `path` is the string path, no leading `/v1/`; `contentType` is
**the exact `Content-Type` string the client sent on that `PUT`**, after the gate above (so
`application/octet-stream` when the file's reported type failed it), never the picker's unfiltered
report; `bytes` is the number of bytes the client transferred in that `PUT`'s body, as a JSON
number. Both are what the client *did*, not what the file *is* — the server's stored
`Content-Type` and length are the facts of record, and a registering verb that must be certain
reads the object. They are additive input keys (a verb reading only `path` is unaffected), and the reverse holds:
a `then` verb invoked by a **pre**-v0.16 client receives `{path}` only and MUST tolerate their
absence. Like every declared affordance they are, **advisory, never a security control** (advisory-validation rule): a
verb MUST NOT treat `contentType` as proof of content. The client then follows the notification
rule (`ok` + re-render / `err` + re-enable). A non-2xx `PUT` (including the host's size-cap 413)
surfaces `err` and re-enables. In flight, the control is disabled. Exactly one file per activation
unless `multiple` is consumed (above).

Since: v0.2 (`then.emphasis`, `multiple`, and the `contentType`/`bytes` input keys: v0.16). Status:
provisional.

### `slideshow`

A sequential viewer for a set of images. Entries reuse the `image` node's field contract,
including the declarative edit fields.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `images` | entry[] | no | Each entry is `{src, alt?, caption?, rotate?, crop?, filters?}`, every field under the **`image` node's field contract** (path rule on `src`; whitelists and clamps on `rotate`/`crop`/`filters`; `caption` as text). An entry with a missing or invalid `src` renders as an inert alt-text slide — never skipped. Non-array or empty → the node renders an inert empty frame with no controls (malformed-input rule). With ≥ 2 slides, previous/next controls MUST always be rendered, and navigation wraps: advancing past the last slide returns to the first, and going back before the first goes to the last (autoplay wraps the same way). |
| `interval` | number | no | Consumed iff a finite number > 0 → autoplay advances every `max(interval, 3)` seconds (the ≥ 3 s clamp is normative). Absent or invalid → no autoplay (manual only). Autoplay MUST NOT run under `prefers-reduced-motion` and MUST pause while the document is hidden; manual controls always work. |

Since: v0.2. Status: provisional.

### `heading`

A document heading (a dedicated node, not a `text.style` variant — `text.style`'s `heading`
member remains a presentation style and is unchanged).

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `value` | string | yes | The heading text, as text; nullish → empty text (malformed-input rule). |
| `level` | number | no (default `1`) | Consumed iff exactly one of `1`, `2`, `3`; any other value → `1`. Selects the heading's visual rank and its accessibility semantic (the client maps it to a real heading level, ranked below the page title's own); the raw value MUST never reach a class name or attribute (text rule). |
| `runs` | entry[] | no | Identical contract to `text.runs`, by reference — supersedes `value` for display when consumed. |
| `edit` | edit facet | no | Per the **`edit` facet contract**; `kind` MUST be `"line"` (a heading is single-line; any other kind → facet ignored). With `split` declared, Enter at the caret splits per the facet contract — the heading-then-paragraph idiom. `value` defaults to this node's `value` (or the stored rich-text source when the verb renders `runs`). |
| `move` / `remove` | move/remove facets | no | Per the **`move` and `remove` facet contracts**. |

Old-client degradation: inert placeholder naming the type — the heading text does **not** survive
on a pre-v0.4 client (unlike a `text` node). Authors targeting mixed-version deployments should
weigh this; the registering consumer ships client and server in lockstep, where the degradation
carries no weight.

Since: v0.4. Status: provisional.

### `todo`

A checkable to-do row.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `label` | string | yes | The item's text, as text; nullish → empty text (malformed-input rule). |
| `checked` | boolean | no | Consumed iff exactly `true` → rendered checked, with a done affordance that MUST NOT be conveyed by color alone; any other value → unchecked. |
| `edit` | edit facet | no | Per the **`edit` facet contract**, governing the label; `kind` MUST be `"line"` or `"multiline"` (a `"check"` kind here is unrecognized for this carrier → facet ignored). |
| `toggle` | edit facet | no | Per the **`edit` facet contract**, governing the checkbox: consumed iff its `kind` is `"check"` (any other kind → ignored). The rendered checkbox is interactive iff `toggle` is consumed; commit value `"true"`/`"false"` per the facet contract. Without a consumed `toggle`, the checkbox renders as a static indicator. |
| `move` / `remove` | move/remove facets | no | Per the **`move` and `remove` facet contracts**. |

Deliberately minimal in v0.4: no `runs` on `todo` (plain label; rich to-do text is additive later
if an application exercises it).

Old-client degradation: inert placeholder.

Since: v0.4. Status: provisional.

### `quote`

A block quotation.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `value` | string | yes | The quotation, as text; nullish → empty text (malformed-input rule). |
| `runs` | entry[] | no | Identical contract to `text.runs`, by reference — one shared inline data model, not a second one. |
| `edit` | edit facet | no | Per the **`edit` facet contract**. |
| `move` / `remove` | move/remove facets | no | Per the **`move` and `remove` facet contracts**. |

Old-client degradation: inert placeholder.

Since: v0.4. Status: provisional.

### `code`

A verbatim monospace block. **No syntax highlighting**: highlighting is client-side
interpretation of untrusted content (a tokenizer at the trust boundary) and is deliberately
outside the contract; a conforming client renders the value as plain monospace text.

Non-normative (Since v0.20): code that runs is a `cell`, which carries its own source, run
control, status and output. `code` stays the display of code that doesn't run, and code shown
inside prose can also be a fenced block in `text.markdown`.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `value` | string | yes | The code, as text — rendered whitespace-preserving and monospace; nullish → empty text (malformed-input rule). Never parsed, tokenized, or executed. |
| `language` | string | no | Rendered as a small text label on the block (presence rule); it MUST never reach a class name or attribute (text rule — the `class="language-x"` idiom is exactly what this forbids). |
| `style` | `"default"` \| `"muted"` | no (default `default`) | Since v0.16. Strict whitelist: any other value — absent, non-string, or unrecognized — MUST fall back to `default`, and the raw value MUST never reach a class name or attribute (text rule). `muted` de-emphasizes the block in the client's own muted treatment (the `text.style: "muted"` treatment's monospace counterpart; palette and contrast non-normative) — for output that is stale, secondary, or superseded and should stay legible without competing. Presentational only: it MUST NOT change the text, the whitespace preservation, the monospace face, or the `language` label, and MUST NOT hide the block. |
| `edit` | edit facet | no | Per the **`edit` facet contract**; `kind` is expected to be `"multiline"`. No shorthand exists for code — `edit.value` defaults to this node's `value`. |
| `move` / `remove` | move/remove facets | no | Per the **`move` and `remove` facet contracts**. |

Old-client degradation: inert placeholder.

Since: v0.4 (`style`: v0.16). Status: provisional.

### `dataGrid`

An editable, column-typed data grid (a spreadsheet-shaped surface — distinct from `table`, which
stays a read-only, client-sorted display of scalar `rows`). `columns` defines column order and
per-column presentation; `rows[].cells` are **positional against `columns`**. Cell and column
editing ride the shared `edit` facet contract (v0.5 kinds included); filtering, hiding, and view
management need **no fields here** — they are ordinary `action`/`form`/`link` nodes the verb
emits elsewhere in the page, writing server-held view config. Sorting and adding a row may be
emitted elsewhere too, and since v0.19 each also has one optional slot on the grid that places an
ordinary verb-authored `action` where a reader looks for it — `gridColumn.sortToggle` and
`addRow` (see **Collection controls** below).

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `columns` | `gridColumn`[] | yes | The grid's columns, in order; each entry per the **`gridColumn` shape** below. A missing, non-array, or empty-after-validation `columns` renders the whole node as an **inert placeholder** (a `dataGrid` with no columns has nothing to lay out — the standing unknown/degraded rule). |
| `rows` | `gridRow`[] | no | The data rows, in order; each entry per the **`gridRow` shape** below; non-array → no rows (malformed-input rule). |
| `addColumn` | compose facet | no | Per the **`compose` facet contract** carried under this field name (Since v0.5): a trailing "+" header affordance offering `addColumn.types[]`; selecting an entry commits **`{type}` only** to `addColumn.verb` (`after` is never sent — columns append at the tail). Missing/invalid → no add-column affordance. |
| `pager` | `pager` (embedded) | no | Since v0.8. The grid's windowed-emission affordance group, per the **`pager` shape** and the **Windowed emission** contract below. Absent or non-object → ignored; the node renders exactly as today — a full, unwindowed grid (malformed-input rule). |
| `addRow` | `action` | no | Since v0.19. The grid's add-row control: one `action` node, per the **`action`** entry, rendered as a trailing row (see **Collection controls** below). A value that is not an object whose `type` is exactly `"action"` is **ignored**, and so is an `action` its own contract renders inert (a route failing the route rule, a missing or empty `label`): no trailing row renders (typed-entry rule, single-node slots). |

**Positional cells (normative).** `rows[i].cells[j]` is the cell for `columns[j]`. A row with
**fewer** cells than columns pads its tail with empty, read-only cells; a row with **extra** cells
(more than `columns.length`) drops the surplus. A cell's presentation is driven by its **column's**
`type`, not by anything on the cell.

**Collection controls (Since v0.19, normative).** `gridColumn.sortToggle` and `addRow` each hold
one ordinary `action` node that the verb authors, and each keeps the whole **`action`** contract
— the route rule before any handler is wired, `input` as the payload, the two-step `confirm`,
synchronous disabling while the invocation is in flight, re-rendering the current view on
success, and re-enabling with an `err` notification on failure — except that a successful
invocation surfaces **no** `ok` notification (notification rule). The slots add placement, never
behavior: the client MUST NOT derive a request from `sort`, `menu`, `columns`, `rows`, or
anything else in the document, and on activation MUST NOT do anything beyond invoking the
carried `action`.

- **`sortToggle`.** The column's header label becomes the control, and it MUST be activatable by
  keyboard as well as by pointer. Its visible text stays `gridColumn.label`, which also stays its
  accessible name, so every cell's column header still reads as the column; the carried
  `action`'s `label` SHOULD be exposed to assistive technology as the control's description, and
  serves as its accessible name when the column's label renders empty. `sort` goes on presenting
  the column's current state, visually and to assistive technology. The sort cycle belongs to the
  verb: each document carries the step that follows the state it displays, and the re-render after
  success delivers the next one. The client MUST NOT reorder rows, compute a next step, or present
  a state the document did not deliver. When the column also consumes `edit` (the header rename),
  the client MUST present the two as **distinct affordances**: no single activation both invokes
  `sortToggle` and opens the rename editor, and each stays reachable without the other; how the
  rename affordance is reached is non-normative. `menu` is unaffected.
- **`addRow`.** The client renders the control as a trailing row after the last delivered row —
  the only body row when `rows` is empty or absent — spanning the grid's columns, and places it
  after that row in focus order as well as visually, so keyboard traversal reaches it directly
  after the last cell. The control creates nothing itself: on activation the client MUST NOT
  insert, synthesize, or optimistically render a row; a new row appears only in the re-rendered
  document, wherever the server placed it.
- Both slots render as though absent on a read-only nested surface (see `viewEmbed`, **Read-only
  embeds**). Neither is an authorization control: the server's policy governs every invocation
  (advisory-validation rule).

*Authoring guidance (non-normative).* A cycle of unsorted → ascending → descending → unsorted,
with each `action`'s `label` naming the step it performs ("Sort ascending", "Sort descending",
"Clear sort"), matches what readers expect from spreadsheet and table products. Where view
config is shared, one activation rewrites it for every reader. On a windowed grid, an author
either omits `addRow` from windows other than the last or accepts that the new row can land
outside the displayed window; post-success navigation is app-level and non-normative.

**`gridColumn` shape** — one column's order-and-presentation descriptor:

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `label` | string | yes | The header text, as text; nullish → empty text (malformed-input rule). |
| `type` | `"text"` \| `"number"` \| `"select"` \| `"date"` \| `"checkbox"` \| `"url"` \| `"relation"` \| `"rollup"` \| `"multiselect"` | no (default `text`) | A **presentation hint** for the column's cells (alignment, chip, checkbox glyph, url handling per the external-link rule), **never a validation contract** — validation is the server's (advisory-validation rule). Strict whitelist (`relation`/`rollup` added Since v0.7; `multiselect` Since v0.17): any other value → `text`; the raw value MUST never reach a class name or attribute (text rule). `number` right-aligns; `date` renders `YYYY-MM-DD` verbatim; `checkbox` renders a checkbox (interactive iff a cell's `edit` with `kind:"check"` is consumed, else a static glyph); `select` renders each cell value as a chip token; `url` renders per the external-link rule (external anchor iff the value passes the external-href gate, else inert text); `relation` (Since v0.7) renders each cell's `value` — the verb-emitted display string — as text, with editing via the `relation` edit kind fed by the column's `choices`; `rollup` (Since v0.7) is a display hint only — right-aligned, read-only posture (rollup cells carry no `edit` facet by construction); `multiselect` (Since v0.17) renders each cell's `value` — the **JSON-encoded tag array itself**, not a display string — as **one chip per entry, in array order**: the client parses it with its JSON parser (never evaluated); when the result is an array, each string entry becomes a chip whose text is the entry, as text (text rule), with the chip treatment the client gives a `select` cell's value, and a non-string entry is dropped individually (display is lossless: no deduplication, no joining — a joined string would mis-split a tag containing the separator); when the value does not parse, or parses to a non-array, it renders verbatim as text (the plain-text fallback). Editing is via the `multiselect` edit kind, whose candidates are the cell facet's own `edit.options`. |
| `sort` | `"asc"` \| `"desc"` | no | A pure **display indicator** of the active view's sort on this column; absent → unsorted. Strict whitelist; any other value → treated as absent; the raw value MUST never reach a class name or attribute (text rule). It is **not** a control — the client MUST NOT sort on it, and MUST NOT derive a request from it; sorting is driven by `action` nodes the verb emits — `sortToggle` (Since v0.19) or `menu` entries — that write view config server-side (unlike `table.sortable`'s client-side sort). |
| `sortToggle` | `action` | no | Since v0.19. The column's sort control: one `action` node, per the **`action`** entry, whose invocation moves the view's sort one step (see **Collection controls** above). A value that is not an object whose `type` is exactly `"action"` is **ignored**, and so is an `action` its own contract renders inert (a route failing the route rule, a missing or empty `label`): the header then renders exactly as it would without the field (typed-entry rule, single-node slots). |
| `edit` | edit facet | no | Per the **`edit` facet contract** — the header-**rename** affordance; `kind` is expected to be `"line"`. `value` defaults to `label`. When `sortToggle` is also consumed, the rename and the sort control are distinct affordances (**Collection controls** above). |
| `menu` | node[] | no | Per-column controls (sort ↑/↓, hide, change-type, delete-column), rendered behind a per-column disclosure affordance; entries are expected to be `action` nodes and each is validated independently (an invalid route renders that entry inert, never failing the column). Since v0.16 the disposition of a non-`action` entry is stated: it renders as the inert unknown-type placeholder in its position (typed-entry rule — the prose resolves the v0.5 "degrades under the route/node-position/unknown-type rules" sentence; the Type column is unchanged); non-array → no menu (malformed-input rule). |
| `choices` | `relationChoice`[] | no | Since v0.7. Consumed **only** when `type` is `"relation"`: the relation editor's candidate list, threaded by the client into this column's cells' `relation` edit controls — emitted **once per column, never per cell** (the payload rule this field exists for); each entry per the **`relationChoice` shape** below, entries failing that shape dropped individually; non-array → no candidates (the picker renders empty; chips still render and remove). Present on a non-`relation` column → present-but-unconsumed, ignored (the standing rule, the `edit.options` posture). |

**`gridRow` shape** — one data row:

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `cells` | `gridCell`[] | yes | The row's cells, positional against `columns` (above); each entry per the **`gridCell` shape** below. Non-array or absent → the row renders as an all-empty, read-only row (malformed-input rule); a nullish entry renders an empty cell. |
| `remove` | remove facet | no | Per the **`remove` facet contract** (`{verb, target}`): a row-level delete affordance committing `{target}`; invalid/absent → no remove affordance. |

**`gridCell` shape** — one cell:

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `value` | string | no | The cell's display string, as text; absent → an empty cell (presence rule). Its presentation is the **column's** `type` (above), including the external-link rule for `url` columns. Whatever the type, `value` reaches the DOM only as text — for a url column passing the external-href gate, as the anchor's visible text, the anchor's `href` being the gate's canonical serialization, never the authored value (external-link rule). |
| `edit` | edit facet | no | Per the **`edit` facet contract** — the cell editor; `kind` matches the column's type (`line`/`number`/`date`/`url`/`select`/`check`/`relation`/`multiselect`). For a `select` column, `edit.options` supplies the combobox datalist, and for a `multiselect` column (Since v0.17) the entry field's typeahead candidates — per facet, as for `select`, never the column's `choices`; for a `relation` column (Since v0.7), the picker's candidates come from the **column's** `choices`, not from the facet. An absent/invalid `edit` → a read-only cell. |

**`relationChoice` shape** (Since v0.7) — one relation-picker candidate:

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `id` | string | yes | The candidate's commit token — an application-defined **opaque token**, consumed iff a non-empty string (an entry without one is dropped individually). It is data, never displayed: it enters the committed JSON-encoded id array verbatim and MUST never reach a class name, attribute, or markup (the `compose` `types[].type` posture). |
| `label` | string | yes | The candidate's visible text in the picker (and the chip text for a chip whose id matches), as text (text rule); an entry whose `label` is missing (nullish) or non-string is dropped individually. |

**`pagerNav` shape** (Since v0.8) — one windowed-navigation affordance: a navigation entry that
carries verb input.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `label` | string | yes | The affordance's visible text (e.g. "Next", "3"), as text (text rule). A label that is missing (nullish), non-string, or empty after stringification is malformed input: the affordance renders inert, and the client MUST NOT substitute the route text (the `link.label` posture). |
| `view` | string (verb route) | yes | MUST pass the **full route gate** — the route rule's grammar **plus discovery resolvability** (the `viewEmbed.view` posture) — before any handler is wired; validated before any fetch or navigation. Missing, non-string, or invalid → the affordance renders inert (non-interactive text) and navigation is unreachable. |
| `input` | object | no | The verb input the affordance carries: string-valued pairs the client encodes into its own session navigation state for the target view (in the reference client, the target location hash's query pairs), so that activating the affordance invokes `view` with exactly these pairs as the verb input. **Client-enforced caps (normative):** each value MUST be a string (a finite number MAY be coerced to its decimal string form; any other value type fails the caps); each key MUST match `^[a-zA-Z][A-Za-z0-9_]{0,31}$`; at most **8** pairs; each value at most **256** characters. **Any violation renders the whole affordance inert — never truncated-and-used.** The pairs are verb-authored data, never interpreted or rendered: keys and values MUST be encoded (never spliced raw) into any URL or navigation-state serialization, and they MUST never reach a class name, attribute, or markup. Absent → activation invokes `view` with empty input. No new field kind — an ordinary `object`, the `action.input` precedent. |

**`pager` shape** (Since v0.8) — the affordance group a windowed surface emits:

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `status` | string | no | The verb-authored window description (e.g. "Rows 201–400 of 10,000"), rendered as text (text rule) — plain text, never parsed or interpreted; omitted when absent (presence rule). |
| `prev` / `next` / `first` / `last` | `pagerNav` (embedded) | no | Each an independent navigation affordance per the **`pagerNav` shape**, validated independently — an entry failing the shape (or its `input` caps) renders that affordance inert without affecting its siblings. A verb omits `prev` on the first window and `next` on the last (authoring guidance; the client renders exactly what validates). |
| `jump` | `pagerNav`[] | no | Direct window entries (e.g. numbered pages), in order, each per the **`pagerNav` shape** and validated independently (an entry failing the shape renders inert, exactly as above). A client MAY cap the number of rendered entries (e.g. at 9); the cap is presentation choice, non-normative. Non-array → no jump entries (malformed-input rule). |

**Windowed emission (Since v0.8, normative).** The pager is **presentation, not protocol** — no
new invocation mechanism, no server-held window state, and no discovery token. A verb that
accepts window input pairs (pair names are verb-chosen, e.g. `winStart`/`winLen`; unknown or
absent input falls back to the **first window** — the standing verb-input posture) emits the
corresponding window of its collection plus a `pager` whose entries are ordinary validated
routes carrying exactly the input pairs that reproduce each neighboring window. The verb stays
stateless per request: window state lives in the client session's own navigation state, so one
session's page-2 is that session's page-2 and never repaints another viewer's. Activating a
`pagerNav` navigates to its `view` with its `input` pairs as the verb input, exactly as any view
navigation; the current view's pairs re-travel on every poll/`refresh`/`subscribe`
re-invocation, so a window survives repaints without any server state. A client that does not
consume `pager` (or a document without one) renders exactly as today — the growth is additive
and discovery-compatible. `table.pageSize` — client-side slicing of an already-delivered full
payload — remains registered for small, read-only tables and is explicitly **not** this
mechanism: `pageSize` never issues a request, while a `pager` entry always re-invokes the verb
for a new window.

Old-client degradation: a pre-v0.5 client renders the whole node as an inert placeholder naming
the unknown type (and would render any of the new-kind `edit` facets read-only) — additive growth
by construction; the registering consumer ships client and server in lockstep, where the
degradation carries no weight. A pre-v0.7 client renders `relation`/`rollup`-typed columns as
`text` (the `type` whitelist fallback) with `relation` cells read-only (unknown edit `kind` ⇒
facet ignored) and `choices` ignored (unknown-field rule) — the same additive-growth valve. A
pre-v0.8 client ignores `pager` (unknown-field rule) and renders the delivered window with no
pager affordances — the same valve again; the document stays fully rendered. A pre-v0.17 client
renders a `multiselect` column as `text` (the `type` whitelist fallback) — each cell shows its raw
JSON-encoded array as text — with its cells read-only (unknown edit `kind` ⇒ facet ignored): the
same valve.

A pre-v0.19 client ignores `gridColumn.sortToggle` and `addRow` (unknown-field rule): its headers
stay labels and its grid has no trailing add-row control, so on it sorting and adding a row are
reachable only through nodes the author emits elsewhere — `menu` sort entries, an add-row
`action` in the page — which a v0.19 client renders as well. The registering consumer ships
client and server in lockstep and emits each control once.

Since: v0.5 (`gridColumn.choices`, the `relationChoice` shape, and the `relation`/`rollup`
column types: v0.7; `pager`, the `pager`/`pagerNav` shapes, and the Windowed emission contract:
v0.8; `gridColumn.menu`'s typed-entry sentence: v0.16; the `multiselect` column type: v0.17;
`gridColumn.sortToggle`, `addRow`, and the Collection controls paragraph: v0.19). Status: provisional.

### `pageTree`

A navigable, nestable tree of links — the workspace-sidebar surface (distinct from `list`, which
stays a flat generic container with no disclosure, trail, or move semantics). The client renders
`items` as a collapsible tree. **Disclosure state is client-local and never round-tripped**:
expanding or collapsing MUST NOT issue any request, and no field carries or commits disclosure
state (initial disclosure and persistence are client choice, non-normative). Each item navigates
exactly like a `link` node; a client MAY derive an active-trail affordance (the current item and
its ancestors) from its own current route (non-normative presentation). When `move` is consumed
the client offers per-item reorder/re-parent affordances per the **tree move** form of the
`move` facet contract, when `remove` is consumed a per-item delete affordance per the
**tree remove** form of the `remove` facet contract, and when `compose` is consumed per-item
add affordances per the **tree compose** form of the `compose` facet contract (see the facet
contracts above).

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `items` | `treeItem`[] | yes | The top-level items, in order, each per the **`treeItem` shape** below. Non-object entries are dropped individually; a missing, non-array, or empty-after-dropping `items` renders the whole node as an **inert placeholder** (a tree with no items has nothing to show — the standing unknown/degraded rule). |
| `move` | move facet (tree form) | no | Per the **`move` facet contract's tree form** (Since v0.6): the `{verb, target}` member shape under the standing facet rules — route rule on `verb`, path rule on `target`, before any affordance is wired; a missing or invalid required member → the facet is ignored and the tree renders navigable but immutable (no move affordances). `target` names the tree's root object; like every facet target it is never fetched, and in the tree form it is not sent either — the commit's `target` member is always the moved item's own (see the facet contracts). Commits `{target, parent, after}` per the tree-move contract. |
| `remove` | remove facet (tree form) | no | Per the **`remove` facet contract's tree form** (Since v0.6): the `{verb, target}` member shape under the standing facet rules — route rule on `verb`, path rule on `target`, before any affordance is wired; a missing or invalid required member → the facet is ignored and the tree renders without delete affordances. `target` names the tree's root object; like every facet target it is never fetched, and in the tree form it is not sent either — the commit's `target` member is always the removed item's own (see the facet contracts). Commits `{target}` per the tree-remove contract. |
| `compose` | compose facet (tree form) | no | Per the **`compose` facet contract's tree form** (Since v0.6): the `{verb, types}` member shape under the standing facet rules — route rule on `verb`, per-entry `type`/`label` validation on `types`, before any affordance is wired; a missing or invalid required member → the facet is ignored and the tree renders without add affordances. Commits `{type, parent, after}` per the tree-compose contract, `parent`/`after` sourced per the tree-move identity rules — items' own already-consumed `id`s or the fixed `""` root/head tokens, never synthesized (see the facet contracts). |

**`treeItem` shape** — one tree item:

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `id` | string | yes | The item's identity within the tree's move and compose contracts — an application-defined **opaque token**, consumed iff a non-empty string. It is data, never displayed: it is sent verbatim as the `parent`/`after` value of tree-move and tree-compose commits, and it MUST never reach a class name, attribute, or markup (the `compose` `types[].type` posture). An item without a valid `id` still renders and navigates, but cannot be named as a move or compose destination or preceding sibling, and receives no per-item add affordance. |
| `label` | string | yes | The item's visible text, as text (text rule). A label that is missing (nullish), non-string, or empty after stringification is malformed input: the item renders inert with an empty label — the client MUST NOT substitute the route text (the `link.label` posture) — and its `children` still render. |
| `view` | string (verb route) | yes | MUST pass the route rule before any handler is wired (validated before any fetch). Valid → the item is an activation target exactly like a `link` node: pointer **and** keyboard navigation. Missing, non-string, or invalid → the item renders **label-only inert** (its label as text, no navigation, no move/remove/add affordance) — and its `children` still render: an invalid item never censors its subtree (the standing drop-individually rule). |
| `target` | string (object path) | no | MUST pass the path rule; invalid → treated as absent. When present it is the item's **commit target**: the value tree-move and tree-remove commits' `target` member carries, sent verbatim and never fetched (the standing facet-target posture). An item without a valid `target` receives no move or remove affordance (there is nothing to commit for it); it still renders, navigates, and may be referenced as a `parent`/`after` destination by `id`. |
| `kind` | `"page"` \| `"table"` | no (default `page`) | A **presentation hint** (icon/affordance selection), **never a validation contract** (advisory-validation rule). Strict whitelist: any other value → `page`; the raw value MUST never reach a class name or attribute (text rule). |
| `children` | `treeItem`[] | no | The item's child items, each per this shape, recursively; non-array → no children (malformed-input rule). **Depth cap (normative):** the client renders nesting to a maximum depth of **16**; items nested beyond the cap still render — **flattened at the cap's level, in document order** — and MUST NOT be dropped; a client MUST NOT recurse unboundedly. A cyclic or absurdly deep document degrades to a bounded render, never a hang or a lost item. |

Old-client degradation: a pre-v0.6 client renders the whole node as an inert placeholder naming
the unknown type — additive growth by construction; the registering consumer ships client and
server in lockstep, where the degradation carries no weight.

Since: v0.6. Status: provisional.

### `board`

A grouped card board — the kanban surface: columns of cards, each column keyed by a group-field
value, with a board-level move contract that commits a card's move **as a cell write**. Column
order is emission order; `boardColumn.value` is an opaque token the client never interprets.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `columns` | `boardColumn`[] | yes | The board's columns, in order; each entry per the **`boardColumn` shape** below. Non-object entries are dropped individually; a missing, non-array, or empty-after-dropping `columns` renders the whole node as an **inert placeholder** (a board with no columns has nothing to lay out — the standing unknown/degraded rule). |
| `move` | `cardMove` (embedded) | no | The board's card-move commit contract, per the **`cardMove` shape** below. Consumed iff both members validate (route rule on `verb`, non-empty string `field`); missing or invalid → the contract is ignored and the board renders read-placed — cards render without move affordances (the standing ignore-on-invalid facet posture). |

**Card moves.** When `move` validates **and** a card's own `target` passes the path rule, the client offers per-card move affordances — operable by **menu/keyboard (required)**; drag between columns is optional polish that MUST commit through this same contract or not at all (the `pageTree` posture) — committing `POST` to `move.verb` with **`{target, field: move.field, value: <the destination column's value>, from: <the source column's value>}`** — the `edit` facet's commit payload plus one member, deliberately: a board move *is* a cell write, validated server-side like any other. `from` (Since v0.17) is the `value` of the column the card is moved **out of** — `""` from the ungrouped column — an **opaque token, never interpreted**, sent verbatim exactly as `value` is; the client includes it on every move path whenever the source column's `value` is a string, and never otherwise. It exists because one card can sit in several columns (next paragraph): `value` names where the card goes, `from` names which of its placements moves. **The server computes the result**: for a single-valued group field `from` carries no information and is ignored; for a set-valued one the expected result is the card's set with `from` replaced by `value` (a move to `""` removes `from` only) — the registry fixes what the client sends, not the arithmetic. A server that does not consume `from` ignores it: like the v0.16 `then` input's `contentType`/`bytes`, it is an additive input key, and a pre-v0.17 client omits it. A card with an invalid or missing `target` renders without move affordances but renders fully otherwise (move-independent — the `treeItem` independent-gates precedent). The commit is structural and non-optimistic (pending + await the re-invoked view; silent `ok`; `err` on failure); an impossible or rejected move is the server's to reject — placement is server truth.

**Several placements of one card (Since v0.17).** A server MAY place the same `target` in several columns — a card grouped by a field that holds several values per row appears once in each matching column. Each appearance is a **placement**, identified by the card's `target` together with its column. The client MUST render every placement (never merging or deduplicating cards across columns) and MUST track pending state **per placement**: a pending move disables that placement's move affordances only. Moves of two placements of one `target` MAY be in flight together — each carries its own `from` and the server applies each to the value current when it arrives — so the `edit` facet's supersede queue does not apply to moves (every move is its own commit), and a server with set-valued group fields SHOULD perform that read-modify-write atomically (a conditional write, ADR-0061) so concurrent moves do not lose each other. A client MAY omit, from a placement's destinations, the columns that already hold a placement of the same `target`. On a set-valued group field a commit **without** `from` is a pre-v0.17 client's move or a whole-value write: a server SHOULD refuse any such commit whose `value` is not in that field's own edit grammar, and in particular SHOULD NOT read a bare `""` as a clear — that is exactly what a pre-v0.17 client sends for a move to the ungrouped column.

**`boardColumn` shape** — one column:

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `label` | string | yes | The column's header text, as text; nullish → empty text (malformed-input rule). |
| `value` | string | yes | The column's group-field value — the string a move to this column commits as the move's `value`, and (Since v0.17) a move out of this column commits as the move's `from`. An **opaque token, never interpreted** by the client: it is data, sent verbatim as commit input, and MUST never reach a class name, attribute, or markup. The **empty string `""` is valid** — the ungrouped column. Consumed iff a string; a non-string `value` → the column renders (label + cards) but is not offered as a move destination, and a move out of it carries no `from`. |
| `cards` | `boardCard`[] | no | The column's cards, in order; each entry per the **`boardCard` shape** below; non-object entries dropped individually; non-array → no cards (an empty column still renders — it remains a valid move destination). |
| `add` | node[] | no | The per-column add-card affordance; entries are expected to be `action` nodes and each is validated independently (an invalid route renders that entry inert, never failing the column). Since v0.16 the disposition of a non-`action` entry is stated: it renders as the inert unknown-type placeholder in its position (typed-entry rule — the prose resolves the v0.7 "degrades under the route/node-position/unknown-type rules" sentence, the `gridColumn.menu` precedent; the Type column is unchanged); non-array → no add affordance (malformed-input rule). |

**`boardCard` shape** — one card:

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `label` | string | yes | The card's visible text, as text; nullish → empty text (malformed-input rule). |
| `target` | string (object path) | no | MUST pass the path rule; invalid → treated as absent. The card's underlying row: the value a board-move commit's `target` member carries, sent verbatim and never fetched (the standing facet-target posture). Since v0.17 one `target` may appear on cards in several columns; a card's **move identity** is its `target` together with its column — a *placement* (the **Several placements of one card** paragraph). A card without a valid `target` renders without move affordances; everything else about it renders unchanged. |
| `edit` | edit facet | no | Per the **`edit` facet contract** — the inline title editor (the card's primary-field value); `kind` is expected to be `"line"`. `value` defaults to `label`. |
| `fields` | node[] | no | Display-only field/badge nodes rendered in order within the card (node-position rule; each entry an ordinary node under the standing rules); non-array → none (malformed-input rule). |

**`cardMove` shape** — the board's move commit contract (registered by ADR-0068, v0.7; tabulated by ADR-0101 with its members unchanged):

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `verb` | string (verb route) | yes | MUST pass the route rule before any move affordance is wired; the verb every move commits to (see **Card moves**). |
| `field` | string | yes | Consumed iff a non-empty string; sent verbatim as the commit's `field`; MUST never reach a class name, attribute, or markup (it is data and is never displayed). |

Old-client degradation: a pre-v0.7 client renders the whole node as an inert placeholder naming
the unknown type — additive growth by construction; the registering consumer ships client and
server in lockstep, where the degradation carries no weight. A pre-v0.17 client omits `from` and
renders each placement of a multiply-placed `target` as an independent card whose moves carry no
`from` — which a server with set-valued group fields refuses (the placements paragraph), so the
failure is an `err`, never a silent rewrite. A v0.17 client against a pre-v0.17 server whose move
verb refuses unknown input keys sees every move fail with `err` — loud, never silent.

Since: v0.7 (`boardColumn.add`'s typed-entry sentence: v0.16; the move commit's `from` and several placements per card: v0.17). Status: provisional.

### `calendar`

A date-placed item collection — the calendar surface. The **client** owns month-grid layout,
month navigation, and the today marker (presentation state, client-local like tree disclosure —
never round-tripped, and no field carries or commits it); the server emits items and their
stored dates only.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `items` | `calendarItem`[] | yes | The items, each per the **`calendarItem` shape** below; non-object entries dropped individually; non-array → `[]` (malformed-input rule). A `calendar` with no valid `items` renders as an **honest empty month, not a placeholder** — an empty collection is valid data (deliberately unlike `dataGrid`/`pageTree`/`board`, whose empty required member leaves nothing to lay out; the month grid is client presentation and renders meaningfully at zero items). |

**Placement.** An item whose `date` conforms renders on that day in the client's month grid; an
item whose `date` is absent or non-conforming renders in an explicit **"No date" section — never
hidden** (data honesty over false blanks). Day-cell and section ordering is emission order.

**`calendarItem` shape** — one item:

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `date` | string | no | The item's stored date. Consumed iff a string matching `^\d{4}-\d{2}-\d{2}$` (`YYYY-MM-DD`; a client-fixed pattern, not an author regex — the advisory-validation rule is preserved); absent or non-conforming → the item renders in the "No date" section, never hidden. Rendered placement only — the raw value MUST never reach a class name or attribute (text rule). |
| `label` | string | yes | The item's visible text, as text; nullish → empty text (malformed-input rule). |
| `target` | string (object path) | no | MUST pass the path rule; invalid → treated as absent. The item's underlying row, the standing facet-target posture (never fetched; travels only as commit input). **No `calendar` contract in this version consumes it** — it is registered so the shape matches `boardCard` and a later contract can consume it without a shape change; a conforming client validates it and otherwise ignores it. |
| `edit` | edit facet | no | Per the **`edit` facet contract** — the inline label editor; `kind` is expected to be `"line"`. `value` defaults to `label`. |

Old-client degradation: a pre-v0.7 client renders the whole node as an inert placeholder naming
the unknown type — additive growth by construction; the registering consumer ships client and
server in lockstep, where the degradation carries no weight.

Since: v0.7. Status: provisional.

### `viewEmbed`

An inline live embed of another view's document — a database view inside a document page.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `view` | string (verb route) | yes | MUST pass the **full route gate** — the route rule's grammar **plus discovery resolvability** — before any fetch is issued; missing or invalid → the node renders **inert** (no fetch, no subscription). |
| `label` | string | no | Rendered as the embed's caption, as text; omitted when absent (presence rule). |
| `chrome` | `"none"` \| `"readonly"` | no | Strict whitelist; `"none"` (v0.10) and `"readonly"` (Since v0.16) are the registered values in this version. Absent, non-string, or unrecognized → **the field is ignored** and the embed renders with full chrome — deliberately not a fallback to another value, and the forward-compatibility mechanism by which a later version registers further values without breaking older clients (the `editFacet.kind` ignore-on-unknown posture; `readonly` is the first value registered through it). The raw value MUST never reach a class name or attribute (text rule). When `"none"` is consumed, see **Embedded chrome** below; when `"readonly"` is consumed, see **Read-only embeds** below it. |
| `move` / `remove` | move/remove facets | no | Per the **`move` and `remove` facet contracts** — the embed block itself reorders/deletes in its page's block order exactly as any sibling block; the facets govern the block, never the embedded document. |

**Behavior.** With `view` consumed, the client fetches the route's catalog document and renders
it on a **nested render surface** with its own subscribe/refresh lifecycle, through the same
generic renderer and validation gates as a first-class surface — facets inside the embedded
document behave exactly as on a first-class surface. The client **never nests further**: a
`viewEmbed` encountered anywhere but the main content surface (inside another embed's document,
or inside a sidebar/nav surface) renders as a validated `link` instead — navigable, never
recursed.

**Embedded chrome (`chrome: "none"`).** An embedded document arrives with whatever the view verb
emits when that view is the whole page — including its own title tier and its own top-level
control tier — because the verb cannot tell that it is being fetched as an embed. Only the
embedder knows. With `chrome: "none"` consumed, the client renders the embedded document on its
nested surface exactly as it otherwise would, with **two** elements suppressed and nothing else:
(i) the embedded root `page`'s **`title`**, and with it any `titleEdit` facet on that root (which
has no anchor once the title is not rendered); and (ii) every **`toolbar`** node that is a
**direct entry of the embedded root `page`'s block list**. Blocks at every other position,
`toolbar` nodes nested inside other blocks, and every facet on every surviving block render
unchanged. The suppression is defined by naming these two node positions, never by a client
judgement about what looks like chrome. It is **presentational only**: it does not change what
the verb emitted, does not suppress the fetch, the subscription, or the refresh lifecycle, and
MUST NOT be applied to any surface other than this embed's own nested surface. `label` is
unaffected — the embedding surface owns the title tier, which is the point. A `viewEmbed` that
degrades to a validated `link` (the never-nest-further rule above) ignores `chrome`.
*Non-normative:* a suppressed top-level `toolbar` may contain `badge` entries, so an author
targeting embeds should not place load-bearing status in the top-level control tier.

**Read-only embeds (`chrome: "readonly"`, Since v0.16).** A **superset of `none`**: the client
suppresses everything `none` suppresses **and, on that nested surface, wires no facet** — every
affordance the **Facet contracts** section defines (`edit`, `compose`, `move`, `remove`), under
whatever field name a node carries it (`edit`, `titleEdit`, `compose`, `addColumn`, `add`, `move`,
`remove`, `board.move`, `gridRow.remove`, `gridCell.edit`, and the rest), renders exactly as it
would with the facet absent. A consuming client **MUST NOT wire any facet commit on that
surface**, and the suppression **MUST NOT cross the surface boundary**: the embedding surface and
every other surface render their facets as always, and the flag dies where `none`'s does.
Invoking nodes (`action`, `form`, `upload`) and navigation (`link`, `externalLink`, `pageTree`'s
navigation) are **content, not chrome**, and render unchanged — an author who wants them out of
an embed omits them from the view; `sandboxIframe` renders unchanged. **The one exception is the
collection controls (Since v0.19):** `gridColumn.sortToggle`, `gridColumn.menu`,
`dataGrid.addRow`, and `boardColumn.add` render as though absent on that nested surface. Their
`action` entries reshape or grow the collection the embed displays — its sort, its columns,
its rows or cards — rather than being content of it, and the embedded verb cannot omit them because
it cannot tell that it is being embedded. The exception names these four slots and `cell.settings` (below), and
nothing else; an `action` anywhere else on the surface renders unchanged. (`add` in the list above
already reached `boardColumn.add`; this sentence settles that it applies although that field's
entries are `action` nodes.) **`cell.settings` (Since v0.20, amended 2026-10-02) is the fifth
control the exception names:** a `cell` rendered on a `chrome: "readonly"` surface renders its
`settings` entries as though absent, for the same reason the four collection controls do — they
change how the cell behaves rather than being content of it, and the embedded verb cannot omit
them because it cannot tell that it is being embedded. `cell.run` is **not** affected: an invoking
`action` is content and renders unchanged. `readonly` is **presentational only and never an authorization control**:
the server's policy governs every write regardless
(advisory-validation rule) — an embed with full chrome shown to a reader who lacks write rights is
exactly as safe as one with `readonly`, which merely stops showing affordances a dashboard does
not want. The orthogonal cell — title kept, facets dropped — is not expressible in this version.

Old-client degradation: a pre-v0.7 client renders the whole node as an inert placeholder naming
the unknown type — additive growth by construction; the registering consumer ships client and
server in lockstep, where the degradation carries no weight. A client that knows `viewEmbed` but
not `chrome` ignores the field under the unknown-field rule and renders the embed with full
chrome — today's rendering, a cosmetic redundancy and never an incorrect or unreachable one.
One cost is not cosmetic: an author who upgrades an existing `chrome: "none"` embed to
`"readonly"` **loses the title/toolbar suppression on a pre-v0.16 client**, since that client
ignores the unrecognized value — an author targeting mixed-version clients keeps `none`, because
`readonly` is not a superset there.

The `cell.settings` addition (v0.20 amendment, 2026-10-02) is likewise a client obligation only.
The v0.19 collection-control exception is a client obligation only: a v0.16–v0.18 client that
renders `gridColumn.menu` (and, on its reading of the facet list, `boardColumn.add`) on a
read-only surface stays a conforming client of its own version, and nothing on the wire differs.

Since: v0.7 (`move`, `remove`: v0.7 amendment, 2026-07-24; `chrome`: v0.10 amendment,
2026-08-04; `chrome: "readonly"`: v0.16; the read-only collection-control exception: v0.19; `cell.settings` named in it: v0.20 amendment, 2026-10-02). Status: provisional.

### `toolbar`

A horizontal grouping of controls that configure or act on the content around it. A toolbar
conveys grouping and compactness; it adds no behavior of its own — every entry keeps its own
contract.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `items` | node[] | yes | Each entry rendered **in order** as a compact inline member of one visual group (node-position rule); entries are expected to be `action`, `form`, `link`, `badge`, or `menu` nodes and each is validated independently (an invalid or other-typed entry degrades under the route/node-position/unknown-type rules, never failing the toolbar); non-array, or no entry renders (all degraded to nothing) → the node renders as an inert placeholder (the standing degraded rule). The client MAY move trailing entries behind a single overflow disclosure when space requires, but every valid entry MUST remain reachable and order MUST be preserved; the client MUST NOT reorder, drop, or merge entries. |
| `label` | string | no | The group's accessible name, as text; consumed for assistive technology only, never rendered as visible content; absent → none. |

Old-client degradation: a pre-v0.9 client renders the whole node as an inert placeholder naming
the unknown type — additive growth by construction; the registering consumer ships client and
server in lockstep, where the degradation carries no weight.

Since: v0.9. Status: provisional.

### `menu`

A labeled disclosure containing a list of commands. Closed by default; the entries render only
while open. Disclosure state is client-local and never round-tripped (the `pageTree` posture).

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `label` | string | yes | The trigger's visible text, as text (text rule). Missing, or empty after stringification → the node renders as an inert placeholder (required-label posture, the `pagerNav` precedent). |
| `items` | node[] | yes | The disclosed entries, rendered **in order**; entries are expected to be `action` or `link` nodes and each is validated independently (an invalid or other-typed entry degrades under the route/node-position/unknown-type rules, never failing the menu — the `gridColumn.menu` precedent); non-array, or empty after validation → the trigger renders present, labeled, and **disabled** (never an empty popup, never skipped). |

**Interaction contract.** The trigger toggles the menu; keyboard support is required —
Enter/Space opens and moves focus to the first entry, ArrowDown/ArrowUp move focus among
entries, Escape closes and refocuses the trigger; interaction outside the open menu closes it.
Activating an entry commits per that entry's own contract (route rule before wiring,
notification rule unchanged) and closes the menu; entry activation events MUST NOT propagate to
ancestors (the `card.actions` posture). A `menu` nested inside another `menu`'s `items` is not
an `action` or `link` and therefore degrades inert under the entries rule above — submenus are
deliberately inexpressible in this version.

Old-client degradation: a pre-v0.9 client renders the whole node as an inert placeholder naming
the unknown type — additive growth by construction; the registering consumer ships client and
server in lockstep, where the degradation carries no weight.

Since: v0.9. Status: provisional.

### `externalLink`

An outbound hyperlink to a destination outside the application — the one node-level surface of
the external-href gate. Navigation leaves the application; the visual-distinction and
new-context obligations below are contract, not styling advice.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `href` | string (external URL) | yes | MUST pass the **external-href gate** (see the External-link rule) at render time, before any anchor is created or handler wired. Missing, non-string, or failing the gate → the control renders inert (non-interactive text of the `label`) and navigation is unreachable; the authored value MUST NOT reach the DOM in any form. On success the anchor's `href` MUST be the gate's canonical serialization, never the authored string. |
| `label` | string | yes | The link's visible text, as text. Missing (nullish), non-string, or empty after stringification → the control renders inert (malformed-input rule). The client MUST NOT substitute the `href` for a missing label. |
| `edit` | edit facet | no | Per the **`edit` facet contract**; a component carrier has no canonical display string, so an `edit` whose `value` is absent is **ignored** (see "Component carriers" in the facet contracts). |
| `move` / `remove` | move/remove facets | no | Per the **`move` and `remove` facet contracts**. |

**Rendering (normative).** A passing `externalLink` renders as a **true hyperlink element**
carrying the canonical `href` — never a script-mediated navigation — so the environment's
native destination preview (e.g. the browser status bar) reflects the real, canonicalized
destination. Activation MUST open a **new browsing context** with `rel="noopener noreferrer"`
(client-fixed, both tokens). The control MUST be visually distinct from route navigation: it
MUST carry an out-of-application indicator (form non-normative — a glyph, a suffix), and its
accessible name MUST convey that activation leaves the application (exact copy non-normative).
A client MAY additionally surface the destination host, and if it does, MUST display the
canonical (punycode) serialization, never the authored form. No request is issued at render
time.

Old-client degradation: a pre-v0.10 client renders the whole node as an inert placeholder naming
the unknown type — additive growth by construction; the registering consumer ships client and
server in lockstep, where the degradation carries no weight.

Since: v0.10. Status: provisional.

### `diffView`

An ordered list of labeled before/after value pairs — a proposed or applied change presented
for review.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `pairs` | `{label, old, new}`[] | no | One pair per entry, in input order: `label` is the pair's caption and `old`/`new` are the two compared values; each of the three members renders **as text** (text rule), and a nullish member renders as empty text, never the literal `"null"` (malformed-input rule). Each value renders as a single text run: the client MUST NOT parse, reformat, or diff the values — it MUST NOT compute or display intra-value differences (insertions, deletions, highlights); old and new are compared by the reader, not the client. The presentation MUST convey which value is the old and which the new (order, captions, or affordance — form and copy non-normative), and that distinction MUST NOT be conveyed by color alone. A nullish or malformed entry renders as an empty entry (empty label, empty old, empty new); any non-array value — **including array-likes such as strings** — is treated as `[]`, with no per-character or per-element coercion (malformed-input rule). |

The registry assigns no meaning to an absent `old` or `new`: "this property was never set" is
authoring vocabulary — the emitting verb chooses its placeholder — because a client-side
absence convention would conflate "never set" with "set to the empty string", both real
states one pair must be able to show honestly. An emitting verb that means to distinguish
never-set from empty-string MUST NOT omit the side; the placeholder substitution is verb-side.

Deliberately minimal at registration: no `edit`/`move`/`remove` facets — `diffView` joins
neither the component-carrier list nor the facet-exclusion list (the `toolbar`/`menu`
posture). A diff is a reviewing surface, and its commit affordances are ordinary `action`
nodes beside it; facets are additive later if an application exercises them.

Old-client degradation: a pre-v0.12 client renders the whole node as an inert placeholder
naming the unknown type — additive growth by construction; the registering consumer ships
client and server in lockstep, where the degradation carries no weight.

Since: v0.12. Status: provisional.

### `chartView`

A verb-declared chart over verb-supplied values: one of four frozen kinds, a shared x domain,
and one or more index-aligned numeric series. A fifth kind is a future registry amendment,
never a config knob. All fields are subject to the registry's standing rules (additive-only,
malformed-input never-throw, non-array → `[]`, text rule, identity rule).

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `kind` | `"bar"` \| `"line"` \| `"area"` \| `"scatter"` | yes | unknown value → the node renders as the inert unknown placeholder |
| `title` | string | no | text node only |
| `x` | `{label?: string, values: (string\|number)[]}` | yes | the shared domain; labels/values reaching the DOM are text nodes only |
| `series` | `[{label?: string, values: (number\|null)[]}]` | yes | index-aligned with `x.values`; the shorter length governs; `null`/non-finite → no mark (a gap), never a fabricated point |
| `yLabel` | string | no | text node only |
| `yMin`, `yMax` | number | no | may **widen** the y domain, never silently clip (the union rule below) |

**Normative content vs non-normative form.** Normative: every finite numeric value in a
rendered series maps to exactly one mark; marks are ordered by x index; the y scale is
**linear**; a bar chart's baseline is zero; series-to-mark correspondence is stable within a
render; every verb-supplied string reaches the DOM as text content only. The client computes
**no new information**: no aggregation, no comparison, no trend/regression, no binning, no
inferred axes — `kind`, axes, series names, and every value are verb-declared. Non-normative:
palette, typography, exact geometry, gridlines, tick count/placement, legend layout (tick
labels are numeral formatting of positions on the declared linear scale, not new
information). Animation: none.

**The y domain rule.** Effective domain = the union of the data extent and any declared
`yMin`/`yMax` (plus zero for `bar`). Declared bounds can widen the view; they can never
silently clip data — clipping semantics are how charts lie, and the union rule deletes the
question.

**Conformance floor.** A conforming client MUST handle at least 8 series and 1000 points per
series; beyond its caps it MUST indicate truncation as visible text, never silently drop. For
`scatter`, `x.values` must be numeric; non-numeric x values there produce gaps, the same rule
as y.

**The shell-built-SVG posture (a named precedent).** This is the first registry node whose
client obligation includes emitting **non-text DOM** (SVG elements) from verb data. The text
rule is untouched because no verb string ever reaches markup: strings become text nodes;
numbers reach attributes only after numeric validation. The normative implementation posture:
SVG is built exclusively by trusted shell code via `createElementNS`/`setAttribute` against a
fixed tag/attribute allowlist; no string-built markup path may exist.

**Facets.** `chartView` is page content, and joins the **block-capable** carrier set at
registration: it may carry `move` and `remove` (including the positional commit form) under
the unchanged facet contracts. It is deliberately **not** edit-capable — chart specs are
verb/agent-authored, and there is no in-place edit posture in v1; `edit` is additive later
under its own amendment.

Old-client degradation: a pre-v0.13 client renders the whole node as an inert placeholder
naming the unknown type — additive growth by construction; no discovery token, no gate.

Since: v0.13. Status: provisional.

### `sandboxIframe`

The catalog's **single code-bearing exception** ([ADR-0091](https://github.com/stackumi/restactd/blob/main/spec/decisions/0091-ui-catalog-v014-sandbox-iframe.md)):
author-supplied code (D3/WebGL/canvas — content the typed vocabulary cannot express) running in
an **opaque-origin** `<iframe>`, contained so completely that the exception buys no capability
beyond "display isolated content in a box." Every other node keeps the text rule and the
external-link rule absolutely; nothing in this entry licenses any other node to emit markup,
load a remote URL, or run code. The framed payload never enters the *embedding* document's DOM
as markup — it becomes a separate opaque-origin document — so the embedder-side "no raw-HTML
path" implementation posture is mechanically unchanged.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `payload` | string (object path) | yes | MUST pass the **path rule** before any fetch: the referenced **same-origin stored bytes** become the framed document under the sandbox envelope below. Missing or invalid → the node renders as an inert placeholder; no fetch, no iframe element. There is no author-supplied URL surface: external origins, `http(s)` URLs, and `data:` URIs are unrepresentable (the external-link rule's closure, preserved verbatim). |
| `scope` | string (object path prefix) | yes | The subtree the frame's credential is confined to: the embedder mints an [ADR-0092] path-scoped, read-only, short-TTL sub-token for exactly this prefix (never a wider one). MUST pass the path rule; the client MAY additionally clamp it under its own embedder-defined containment policy, and on any validation or containment failure renders the node inert — never a widened or repaired scope. The value is data: it MUST never reach a class name, attribute, or markup. |
| `title` | string | no | text node only (rendered in the embedder's own chrome, outside the frame). |

**The sandbox envelope (normative).** The rendered element is an `<iframe>` with **exactly**
`sandbox="allow-scripts"` — **no `allow-same-origin`** (its absence forces an opaque origin:
the framed document cannot reach the embedder's origin, storage, cookies, or DOM; this is the
containment, not optional and not togglable), and **no other sandbox token** (`allow-forms`,
`allow-popups`, `allow-top-navigation`, `allow-modals`, `allow-pointer-lock`,
`allow-downloads`, …). The iframe MUST carry `referrerpolicy="no-referrer"` and MUST NOT carry
`allow` (Permissions-Policy delegation) for any feature. The payload is wrapped as the frame's
document via `srcdoc` or a client-constructed `blob:` URL (either is conformant — both yield an
opaque origin under this envelope; clients SHOULD prefer `blob:`).

**The credential handoff (normative).** The frame receives data-fetch authority **only** via
`postMessage` from the embedder: the embedder MUST NOT post anything until the frame first
posts a `ready` message; on `ready` the embedder validates **source identity**
(`event.source === frame.contentWindow` — the origin string is `"null"` for an opaque frame, so
source identity, not origin string, is the guard), then posts **exactly** the [ADR-0092]
sub-token and nothing else — never the embedder's primary bearer, shell state, storage
contents, or DOM references. The frame fetches its scoped data cross-origin (`Origin: null`)
under that credential. The node is renderable **only** where such a credential is obtainable
(`path-scoped-tokens` advertised and the mint succeeds); otherwise it renders inert. There is
**no** posture where the frame runs on the embedder's primary bearer.

**Facets.** None minted at registration — no node-level `edit`, `move`, or `remove` (it joins
neither carrier set; the `diffView` facetless posture). An embedding application's block
machinery may place or remove the surface it embeds this node in at the app plane. There is no
client-side editor or config form for this node. A future amendment may mint facets on their
own merits.

Old-client degradation: a pre-v0.14 client renders the whole node as an inert placeholder
naming the unknown type — strictly safer than rendering; no discovery token of its own, no
gate (the credential dependency above is [ADR-0092]'s token, not this node's).

Since: v0.14. Status: provisional.

### `cell`

A runnable code cell as one node: the code, the control that runs it, the state of its last run,
and what that run produced. A client can therefore tell a cell from a `code` snippet by its type,
and can present a cell for use without its authoring material (the authoring-material rule). The
client never runs anything. A run belongs to the server: it is invoked through `run` like any
`action`, and its result arrives as `output` in a later document.

| Field | Type | Required | Client obligation |
|---|---|---|---|
| `source` | string | no | The cell's code, rendered as `code.value` is: as text, whitespace-preserving and monospace, never parsed, tokenized, highlighted or executed. Absent (presence rule) → no source is rendered. |
| `language` | string | no | A small text label on the source (presence rule), as `code.language`. It MUST never reach a class name or attribute (text rule). It isn't rendered when the source isn't. |
| `edit` | edit facet | no | **Authoring material.** Per the **`edit` facet contract**, governing the source; `kind` is expected to be `"multiline"`. If `edit.value` is absent, the editor is seeded from `source`. When neither is present the facet is **ignored** (read-only), because a blur on an unseeded editor would commit an empty value over the stored code. It isn't wired when the source isn't rendered. |
| `run` | `action` node | no | The control that runs the cell: one `action` node, under the `action` contract unchanged. That covers the route rule before wiring, `input`, `confirm`, `emphasis`, `tone` and the notification rule, including the re-render on success that brings the new `output`. A value that is not an object whose `type` is exactly `"action"` is **ignored**, and so is an `action` its own contract renders inert (a route failing the route rule, a missing or empty `label`): no run control renders (typed-entry rule, single-node slots). Nullish → no run control. |
| `settings` | `action`[] | no | **Authoring material.** Controls that change how the cell behaves rather than running it (for example, switching between showing the last saved run and evaluating on every view). Each entry follows the `action` contract, rendered in order; typed-entry rule (`action` only). A nullish entry renders nothing, and a non-array is `[]` (malformed-input rule). **On a `chrome: "readonly"` surface (a `viewEmbed` with that chrome, or a `cell`'s own `output`) the entries render as though absent** (v0.20 amendment, 2026-10-02); `run` is unaffected. |
| `status` | `{label, tone?}` | no | The state of the cell's last run, as the server states it (for example "not yet run" or "edited since last run"). `label` and `tone` follow the `badge` node's `label` and `tone` rows, by reference: `label` as text; `tone` a strict whitelist and presentational only. Absent or not an object → no status. The client never derives a status. |
| `output` | node[] | no | What the last run produced, rendered in order (node-position rule); non-array → `[]` (malformed-input rule). **It is a read-only surface:** a client MUST NOT wire any facet the **Facet contracts** section defines, under whatever field name, on any node at any depth within `output`. Each such node renders as if its facets were absent. Everything else renders as on a `chrome: "readonly"` surface: invoking nodes and navigation render unchanged, and the collection controls (`gridColumn.sortToggle`, `gridColumn.menu`, `dataGrid.addRow`, `boardColumn.add`, Since v0.19, and `cell.settings` of a `cell` nested in `output`) render as though absent. The suppression stops at a nested surface: a `viewEmbed` within `output` renders its fetched document under that document's own rules. |
| `label` | string | no | The cell's name, as text. A client uses it as the cell's accessible name (the `toolbar.label` posture) and MAY display it. |
| `move` / `remove` | move/remove facets | no | Per the **`move` and `remove` facet contracts**: the cell moves and is removed as one block. |

**Rendering.** A cell renders as one unit, in this order: the source with its language label; then
one control group holding `run`, the `settings` entries and `status`, in that order; then
`output`. Layout and styling are the client's choice, and the order is normative.

**Viewing presentation.** `edit` and `settings` are authoring material. A client MAY omit them in
a viewing presentation (the authoring-material rule): the source then renders read-only, and the
settings are not rendered. Every other part renders in every presentation: `source` with its
`language` label, `run`, `status` and `output`, with `label` as the accessible name. Running
executes the source with the authority of whoever activates `run`, and the source is what that
person consents to. It is therefore content, never authoring material, and it is displayed
wherever `run` is.

**Facets.** `cell` is edit-capable (its `edit` governs `source`) and block-capable. It is not a
component carrier.

Old-client degradation: a pre-v0.20 client renders the whole node as an inert placeholder naming
the unknown type, so the source, run control, status and output are all absent there. No field
can soften that, since such a client ignores every field of the node. An author who must reach
pre-v0.20 clients keeps emitting the composition this node replaces (a `code` node, a `toolbar`
of `action`s and a `badge`, and the output nodes as siblings), which remains valid catalog. There
is no discovery token, because a cell needs no server feature. The registering consumer ships
client and server in lockstep, where the degradation carries no weight.

Since: v0.20. Status: provisional.

[ADR-0092]: https://github.com/stackumi/restactd/blob/main/spec/decisions/0092-path-scoped-sub-tokens.md
