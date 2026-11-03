# Presentation verbs and the `application/vnd.restact.ui+json` media type

*This document specifies the `application/vnd.restact.ui+json` media type and the
presentation-verb contract. Status: **normative**, tracked by
[ADR-0056](https://github.com/stackumi/restactd/blob/main/spec/decisions/0056-presentation-verbs.md) and
[ADR-0114](https://github.com/stackumi/restactd/blob/main/spec/decisions/0114-presentation-verbs-normative.md). The key words "MUST", "MUST NOT",
"SHOULD", "SHOULD NOT", and "MAY" are to be interpreted as described in
[RFC 2119](https://www.rfc-editor.org/info/rfc2119) and
[RFC 8174](https://www.rfc-editor.org/info/rfc8174) when, and only when, they appear in all
capitals.*

## 1. Problem

REST:ACT lets an untrusted client change an application's **functionality** by uploading a sandboxed
verb. It has no equivalent for **presentation**: a verb can transform the data a client displays, but
cannot add a field, add a view, or reshape a layout — the client owns rendering. Presentation verbs
close that gap **without a protocol change**: a verb returns a *declarative UI document* drawn from a
fixed **component catalog** that a trusted, generic client renders. Because the catalog is closed and
the client escapes everything, an untrusted verb can shape presentation without the client trusting it.

## 2. A presentation verb

A **presentation verb** (informally a *view verb*) is an ordinary REST:ACT verb with three properties:

1. **`kind=function`** — GET-safe, cacheable, side-effect-free (it is invoked with `GET /v1/<obj>:<verb>`).
2. **`produces=application/vnd.restact.ui+json`** — declared at deploy (`POST /v1/modules?…&produces=…`).
3. Its body returns a **UI document** (§4): a JSON tree of catalog nodes. It typically reads the bound
   object's data via the gated `object` capability ([ADR-0023](https://github.com/stackumi/restactd/blob/main/spec/decisions/0023-object-data-capability.md)),
   exactly like [`examples/render-html`](https://github.com/stackumi/restactd/tree/main/examples/render-html).

Nothing else is special. A view verb links against only the already-frozen `object` (+ `log`)
interfaces; `wit/world.wit` is unchanged. It runs under the same sandbox, fuel/epoch/memory limits,
and run-as-caller identity as any verb, so a view sees only what the caller may read.

Naming convention (non-normative, but used by the reference implementations):

- A **top-level view** binds a collection object and has no `{id}` template: `library:homeView`,
  `library:bySeriesView`. It becomes a navigation entry.
- A **per-object view** is templated: `library/book/{id}:detailView`. It renders one object and is
  reached by drill-down. Via inheritance it resolves for every child (`library/book/9780…:detailView`).
- A view named after a reserved accessor (`:get`/`:list`) additionally participates in bare-object
  dispatch ([ADR-0031](https://github.com/stackumi/restactd/blob/main/spec/decisions/0031-object-policy-inheritance-accessors.md)): `GET /v1/<obj>` returns
  the UI document. This is optional; a distinctly named view is the simpler default.

## 3. The media type

`application/vnd.restact.ui+json` is a `+json` structured-syntax type: the payload is JSON. A view
verb declares it via `produces`; the host stamps it as the response `Content-Type` and adds
`x-content-type-options: nosniff` (as for any verb output). It is **not** `text/html`, so the host's
HTML-only Content-Security-Policy and `Content-Disposition: attachment` hardening do **not** apply —
the browser never renders the payload; the trusted client fetches and interprets it.

## 4. The component catalog (the trust boundary)

A UI document is a tree of **nodes**. Every node is a JSON object with a `type` field naming a catalog
component; the remaining fields are that component's properties. **All string fields are plain text**
(the client escapes them at render) — except a field the registry declares as **markdown source**,
which a client renders only under the registry's
[*markdown rendering contract*](registries/ui-catalog-nodes.md#markdown-rendering-contract-since-v018),
never as HTML. There is **no node that carries raw HTML or script.**

The node vocabulary is defined by the **REST:ACT UI Catalog Node Types registry**
([`registries/ui-catalog-nodes.md`](registries/ui-catalog-nodes.md)). The registry is
**additive-only**: a registered node type is never removed or redefined, and new capability enters
the catalog only as new node types or new optional fields. Each registry entry states the fields a
conforming client consumes and the client's obligation for each — including degradation for absent
or malformed values; the registry owns that per-node detail, and where this document and the
registry both speak, they agree.

### Conformance requirements

- A client MUST create text content only via text nodes (no `innerHTML`-family API on any
  catalog-rendering path).
- A client MUST validate every verb route received in a UI document (`link.view`,
  `card.link.view`, `image.link.view`, `action.verb`, `form.submit.verb`, `upload.then.verb`,
  each entry of `table.rowLinks`, the facet routes — `edit.verb`/`edit.split`/`edit.merge`,
  `compose.verb`, `move.verb`, `remove.verb` — and each text-run entry's `view`) against the
  route grammar **before** issuing any request — for facet routes, before any editing affordance
  is wired — and MUST NOT fetch an invalid or unresolvable route. A facet whose route fails
  validation is ignored: the node renders read-only, never inert.
- A client MUST validate every object path received in a UI document (`image.src`,
  `upload.pathPrefix`, `slideshow.images[].src`, each entry of `page.subscribe`, and every facet
  `target`) against the
  registry's path grammar **before** issuing any fetch — for `page.subscribe`, before any event
  stream is opened — and MUST resolve a valid object path only against the **same-origin data
  plane** (discovery base + `/v1/` + path). This is the sharpened form of the safe-schemes
  requirement for path-valued fields: a valid object path is scheme-free by construction, so
  external URLs and `data:` URIs are unrepresentable. A facet `target` is never fetched by the
  client — it travels only as commit input — but is validated identically before the facet is
  honored.
- Inline editing (the registry's v0.4 facet contracts) MUST capture edited content only as
  plain text: pasted or composed input enters the edited value as a plain string (or a checkbox
  boolean), never as markup, and an edited or optimistically echoed value MUST reach the DOM
  only as a form-control value or a text node. A client MUST NOT **serialize** edited content
  into any markup, and MUST NOT parse markup shorthand in any field **except a declared
  markdown-source field, which it parses only to render it** under the markdown rendering
  contract; rich text that is *edited* still reaches the client as `runs` or as plain source text,
  and edit capture stays plain text. `runs` is the registry's rich-text data model (a closed mark
  whitelist over text; run text is never interpreted as markup), and any shorthand-to-runs parsing
  is the **verb's** job, server-side.

  For a `text` node whose `markdown` is consumed and which carries an `edit` facet of kind
  `"multiline"`, `edit.value` is the markdown source. A client MAY present a source editor in
  place of the plain multi-line text area, and MAY render the in-progress source under the
  markdown rendering contract (live preview). This is an exception to "the edited value MUST
  reach the DOM only as a control value or text node". Capture stays plain text:
  - the committed value is exactly the source characters the author typed, or pasted as plain
    text;
  - a client MUST NOT build the value by serializing a document model, and MUST NOT normalize it;
  - every source character MUST remain reachable for editing: a rendered construct reveals its
    source when the selection enters it, or a source mode is available.
- Facet commits follow the registry's notification-rule deviation: success is silent (no `ok`
  notification — the clearing of the pending affordance is the signal); failure surfaces `err`
  and reverts any optimistic echo. Servers SHOULD return problem-detail text on a failed facet
  commit; clients SHOULD display it.
- Declared client-side constraints and confirm prompts (the registry's advisory-validation rule)
  are advisory UX, never a security control: a client MAY decline to submit while a declared
  constraint fails, but a server MUST validate all input regardless of what the document declared.
  There is no author-supplied regex anywhere in the catalog — typed formats are validated only by
  the browser's native input-type machinery.
- A client MUST render an unknown node `type` as an inert placeholder; it MUST NOT
  interpret unknown nodes as markup or skip-and-reparent their children.
- A client MUST ignore unknown fields on known node types.
- A client MAY offer a viewing presentation that omits the fields the registry designates
  *authoring material* (the registry's authoring-material rule, Since v0.20). The omission is
  presentational only, never an authorization or confidentiality control.
- A client MUST restrict any URL-valued field to safe schemes.
- The root node of a UI document MUST be a `page`.
- A verb producing `application/vnd.restact.ui+json` MUST be `kind=function`.

`link.view` and `action.verb`/`form.submit.verb` are **verb routes** the client resolves against the
discovery document / data plane; a route is *unresolvable* when it cannot be resolved against that
discovery document / data plane (§5). The `field` node is the unit of "add a field to the UI": a view
that adds one `field` to a `fieldList` surfaces a new datum with no client change.

Authoring note (v0.4 rich text): a view emitting `runs` on a `text`/`heading`/`quote` node SHOULD
also emit the node's `value` as the plain-text flattening — a pre-v0.4 client ignores `runs` and
renders `value`, so the words never disappear; a v0.4 client ignores `value` when `runs` is
consumed.

### Security model

The catalog is closed and the client is trusted; therefore:

- An untrusted verb composes **only** from the catalog. It cannot emit `<script>`, inline event
  handlers, `javascript:` URLs, or arbitrary tags — there is no node for them.
- The client **escapes every string** and **scheme-checks every URL** (any URL-valued field is
  restricted to safe schemes), exactly as [`render-html`](https://github.com/stackumi/restactd/tree/main/examples/render-html) sanitizes its
  output.
- Markdown source is parsed to a closed element set with no raw-HTML path; raw HTML inside it
  renders as literal text.
- A `cell`'s source is never evaluated by the client. A cell runs only through its `run`
  control, an ordinary `action`, and what a run produced arrives as the cell's `output`, a
  read-only surface on which no facet is wired.
- Unknown node types are inert. A newer verb targeting a richer catalog degrades safely on an older
  client.
- A view runs **run-as-caller**, so it can place in the document only data the caller may read; the
  document cannot become a data-exfiltration channel past the object ACLs.

The **conformance reference implementation** is the tabularasa client (`client/src/render.ts` in `stackumi/stackumi`);
[`demo/tabularasa/ui/app.js`](https://github.com/stackumi/restactd/blob/main/demo/tabularasa/ui/app.js) is the
minimal single-file example. The contract is this document plus the registry, not either
implementation.

## 5. Discovery

A host advertises support additively (frozen contract preserved):

- `service.features` includes **`presentation-verbs`**.
- A verb descriptor carries **`role: "view"`** when its `produces` is `application/vnd.restact.ui+json`
  and its name is not a reserved accessor/lifecycle name. (`produces` itself already appears in the
  descriptor, so a client can key on either signal.)

A client builds its UI **from discovery**: fetch `GET /.well-known/restact`, take every `role == "view"`
verb, treat the untemplated ones as navigation and the templated ones as per-object views, and render
each by invoking it and interpreting the returned document. The client needs **no built-in knowledge
of the application's domain** — which is what lets a newly deployed view verb appear with no client
edit.

One catalog node is additionally **feature-gated on discovery**: `upload` depends on the data
plane's binary object values ([ADR-0053](https://github.com/stackumi/restactd/blob/main/spec/decisions/0053-data-plane-enablers-query-negotiation-binary.md)),
so when `service.features` lacks **`binary-values`** a client MUST render `upload` inert with a
visible notice (copy non-normative) instead of attempting a data-plane `PUT`. This is the
catalog's first feature-gated node, and the pattern generalizes: a node whose behavior depends on
an optional server feature is gated on that feature's discovery token and degrades to
inert-with-notice when the token is absent — the node is known, the capability is not.

## 6. Relationship to other REST:ACT features

- **`render-html` ([ADR-0023](https://github.com/stackumi/restactd/blob/main/spec/decisions/0023-object-data-capability.md))** is the precedent: a pure
  function reading object data and returning a typed body. A presentation verb differs only in
  returning a *structured UI tree* a generic client composes, instead of a finished HTML page a
  browser renders — moving the trust boundary from "sanitize the verb's HTML" to "the verb never emits
  HTML."
- **Accessor verbs ([ADR-0031](https://github.com/stackumi/restactd/blob/main/spec/decisions/0031-object-policy-inheritance-accessors.md))**: a view MAY be
  named `:get`/`:list` to serve the UI document from the bare-object path.
- **Events/SSE ([ADR-0039](https://github.com/stackumi/restactd/blob/main/spec/decisions/0039-lifecycle-hooks-and-events.md))**: `page.subscribe`
  (registry, v0.3) is the push mechanism. The view declares the object paths whose events
  should invalidate the rendered document; a client that consumes the field (gated on the
  `event-subscriptions` discovery token, ignored entirely when absent) subscribes to each
  path's SSE stream and, on any data-plane lifecycle event (`onCreate`/`onChange`/`onDelete`)
  or `gap`, re-invokes the current view. It is an invalidation signal only: event names and
  payloads MUST NOT be interpreted or rendered. `page.refresh` (registry, v0.2) remains the
  time-based mechanism — client-side re-invocation on a fixed interval with a normative ≥ 5 s
  floor, paused while the document is hidden — and is the working fallback on servers that do
  not advertise `event-subscriptions`; the two fields are independent, and a view wanting live
  updates everywhere declares both.
  Authoring guidance: event topics are exact-match object paths, so a collection view cannot
  hear member writes directly. Designate a seeded **anchor object** for the collection, declare
  `subscribe` with the anchor's path, and have the application's action verbs — granted the
  `event.publish` capability — publish an event named `onChange` to the anchor topic after
  mutating any member (a detail view needs no pattern: subscribing to the object itself hears
  the auto-published lifecycle events directly). Publishing under a lifecycle name is an
  ordinary use of the arbitrary-name publish capability; it never fires the object's lifecycle
  hooks (hooks fire on data-plane mutation, not on published events). Like any published
  event, it is delivered to any registered topic subscription bound to the anchor, under the
  server's existing rate-limit and quota bounds.
- **Native verbs + embedding ([ADR-0052](https://github.com/stackumi/restactd/blob/main/spec/decisions/0052-native-verbs-and-embedding-api.md))**: the
  demo client is served by an embedding binary; the demo's book data and views are seeded over the
  ordinary HTTP surface, so the whole demo is standard REST:ACT.

## 7. Out of scope

- `Accept`-negotiated representation from *uploaded* verbs (native-only today,
  [ADR-0053](https://github.com/stackumi/restactd/blob/main/spec/decisions/0053-data-plane-enablers-query-negotiation-binary.md)); a gated `request` WIT
  interface is deferred.
- A `catalogVersion` field in discovery remains deferred. (The versioned catalog registry itself
  exists: [`registries/ui-catalog-nodes.md`](registries/ui-catalog-nodes.md).)
- Structurally reshaping fixed third-party clients (e.g. stock Mastodon apps) — impossible without a
  client extension point; views target catalog-aware clients.
