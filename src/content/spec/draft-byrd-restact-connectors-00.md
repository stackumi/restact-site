---
title: "REST:ACT Connectors"
abbrev: "REST:ACT Connectors"
docname: draft-byrd-restact-connectors-00
category: exp
submissiontype: independent
ipr: trust200902
area: "Applications"
keyword:
  - REST
  - WebAssembly
  - capability security
  - credentials
  - language models
stand_alone: yes
pi: [toc, sortrefs, symrefs, comments]
author:
  -
    ins: N. Byrd
normative:
  RESTACT:
    title: "The REST:ACT Protocol: Invoking Sandboxed Functionality over REST"
    author:
      -
        ins: N. Byrd
        name: Nathan Byrd
    date: 2026-11
    seriesinfo:
      Internet-Draft: draft-byrd-restact-protocol-00
    target: https://github.com/stackumi/restact/blob/main/draft-byrd-restact-protocol-00.md
  RESTACT-HTTP-VERBS:
    title: "REST:ACT HTTP Verbs"
    author:
      -
        ins: N. Byrd
        name: Nathan Byrd
    date: 2026-11
    seriesinfo:
      Internet-Draft: draft-byrd-restact-http-verbs-00
    target: https://github.com/stackumi/restact/blob/main/draft-byrd-restact-http-verbs-00.md
  RFC3986:
  RFC8259:
informative:
  RESTACT-DELEGATION:
    title: "REST:ACT Identity and Delegation"
    author:
      -
        ins: N. Byrd
        name: Nathan Byrd
    date: 2026-11
    seriesinfo:
      Internet-Draft: draft-byrd-restact-delegation-00
    target: https://github.com/stackumi/restact/blob/main/draft-byrd-restact-delegation-00.md
  RESTACT-OBJECTS:
    title: "REST:ACT Objects and Data"
    author:
      -
        ins: N. Byrd
        name: Nathan Byrd
    date: 2026-11
    seriesinfo:
      Internet-Draft: draft-byrd-restact-objects-00
    target: https://github.com/stackumi/restact/blob/main/draft-byrd-restact-objects-00.md
  RFC8126:

--- abstract

This document specifies an optional extension to REST:ACT, the protocol for invoking sandboxed
verbs over HTTP. It defines how a server uses a credential that belongs to one of its users on that
user's behalf without releasing it. A secrets mount passes a credential written to it to an
external secrets backend and never returns it. A mediated outbound call is one bounded HTTP request
that the server makes through an owner-governed connector object, placing a mounted credential
into the request as it sends it. Model completion lets a verb ask a language model for one bounded,
text-only completion through such a connector, metered against a budget that the connector's owner
sets. Webhook delivery lets a verb send one signed JSON `POST` to the destination such a connector
names. A server advertises each feature with its own token: `secrets-management`, `mediated-egress`,
`llm-connector` and `webhook-connector`. This document also creates the REST:ACT LLM Providers
registry.

--- middle

# Introduction {#connectors-introduction}

An application often calls services outside the server for its users, with credentials that belong
to them: an API key for a model provider, or a token for a ticketing system. REST:ACT {{RESTACT}}
gives a verb no network access. A verb reaches an outside service only through a host interface
that names the operation (the "Capability Model" section of {{RESTACT}}). This document defines
four features for that, each optional and each advertised by its own feature token:

* The mediated secrets mount ({{secrets-mount}}, `secrets-management`): object paths at which a
  credential written by a client goes to an external secrets backend. The server stores only
  metadata there, and no path on the server returns the value.
* The mediated outbound call ({{mediated-egress}}, `mediated-egress`): one bounded outbound HTTP
  request that the server makes as the request's principal through a governed **connector**
  object, placing a mounted credential into the request at the moment of sending. It belongs to
  the server's embedding surface and defines no HTTP route.
* Model completion ({{llm}}, `llm-connector`): the `llm` capability interface, through which a verb
  asks a language model for one bounded, text-only completion over a connector, billed to the
  caller against a budget that the connector's owner controls.
* Webhook delivery ({{webhook}}, `webhook-connector`): the `webhook` capability interface, through
  which a verb sends one signed JSON `POST` to the destination and path that a connector's owner
  fixed, and learns only the status it was answered with.

Each builds on the one before it. An outbound call places only credentials held in the mount, and
a model completion or a webhook delivery is made under the rules of the outbound call, through a
connector of kind `llm` or `webhook`. The tokens are still advertised separately;
{{llm-discovery}} and {{webhook-discovery}} say when a server advertises `llm-connector` and
`webhook-connector`.

`llm` and `webhook` are typed interfaces: each names the one operation it performs, and the server,
not the verb, builds the request on the wire. No feature of this document gives a verb a request
whose method, target, header fields and content are all its own. An outside service that needs a
shape these interfaces do not offer is reached through a further typed interface under its own
feature token, or not from a verb.

The decision records for this document are
[ADR-0087](https://github.com/stackumi/restactd/blob/main/spec/decisions/0087-secrets-backend-and-mediated-mount.md),
[ADR-0094](https://github.com/stackumi/restactd/blob/main/spec/decisions/0094-mediated-outbound-call.md)
and [ADR-0095](https://github.com/stackumi/restactd/blob/main/spec/decisions/0095-typed-connectors-llm.md)
in the reference implementation.

## Relationship to REST:ACT {#connectors-relationship}

This document is a REST:ACT extension, as described in the "Extension specifications" section of
{{RESTACT}}. The server requirements of each section bind only a server that advertises the token
that section names: `secrets-management` for {{secrets-mount}}, `mediated-egress` for
{{mediated-egress}}, `llm-connector` for {{llm}}, and `webhook-connector` for {{webhook}}. A requirement that also names a feature or
mechanism of another document, such as the refusal of a path-scoped sub-token, binds a server that
this document binds when that server also offers that feature or mechanism. A client does not assume any behavior of this document from a server
that does not advertise its token.

A secrets mount serves a `PUT` on a mount path by passing its `value` member to a system outside
the server without storing it. That is extension point E7 of the "Extension specifications"
section of {{RESTACT}}, and the object's own policy still governs the `PUT`.

{::boilerplate bcp14-tagged}

# The mediated secrets mount (OPTIONAL, feature `secrets-management`) {#secrets-mount}

An application often holds a credential belonging to a workspace owner — an API key, a token — that
must be governable, rotatable and auditable as a resource without ever being readable as data. A
server MAY designate an operator-configured **mount** (a route pattern over the object grammar, e.g.
`ws/{ws}/secrets/{name}`) at which object writes are natively **mediated**: a `PUT` carrying a
`value` member forwards that value to an external secrets backend and persists metadata only, and no
path on the server ever returns it.

**The reference object.** An object under the mount is an ordinary governed object in every respect a
client can observe — it has a `$policy`, an `$owner`, lifecycle events, Problem Details — except that
two of its members are **reserved to the mediation**: `value` is write-only and never persisted or
returned, and `version` is mediation-owned and MUST be refused on any client write. A server MUST
refuse a non-JSON (binary) `PUT` on a mount path, since a content-addressed blob IS a persisted
value. A `GET` serves metadata only. A reference created this way MUST be born with an explicit
owner-only `$policy` established in its creating write, so it is never world-readable for an instant.

**Failure.** When the backend cannot be reached, the server MUST refuse with `503` (`restact_code`
`unavailable`, which the "Errors" section of {{RESTACT}} registers) and MUST NOT fall back to
storing the value.

**`null` members.** On a mount path the reserved members keep their rules: a server MUST refuse
`"value": null` with `400` (`invalid-input`), `version` stays refused on every client write, `null`
included, and a server MUST refuse a `PUT` that carries `value` together with a `null` member. On a
server that also advertises `put-null-removes`, a `"$policy": null` member on a mount path would
leave a reference without the policy it must carry, so the server refuses it with `422`
(`invalid-input`) instead of removing the policy.

**Discovery.** A server supporting this profile MUST advertise `secrets-management`; absent it, a
client MUST NOT assume a mount exists, and MUST treat a `value` member as ordinary data.

# The mediated outbound call (OPTIONAL, feature `mediated-egress`) {#mediated-egress}

A credential held under the mount above is only useful if something can SPEND it. A server MAY
support performing one bounded outbound HTTP request **on the caller's behalf**, splicing the
owner's credential in server-side at the moment of sending — so the credential is used without ever
being released. This profile defines no HTTP route: it is a capability of the server's own embedding
surface, which an embedder exposes through a route of its own. Absent the feature token, a client
MUST NOT assume any such route behind it performs a credentialed call.

**The connector.** The destination is named by an ordinary governed object — a **connector** — whose
server-read members are: `destination` (JSON `{"host", "port", "tls": "required"}`, where `host` is a
DNS name and MUST NOT be an address literal), optional `secretRefs` (JSON array of reference-object
paths), `splice` (required exactly when `secretRefs` is non-empty: JSON `{"headers": {…}, "body":
{…}}` whose values are owner-written templates), optional `pathPrefixes`, and optional `limits`. A
connector is a **capability**: holding `read` on one means the server will splice its owner's
credential on the reader's behalf. A server MUST therefore refuse a call through a connector that
does not carry its own `$policy` — an inherited one is never a use-grant — or whose `write` and
`delete` matcher lists are not each exactly `["owner"]`, since those members ARE the capability. A
server MAY additionally declare a prefix under which connectors are created and refuse a creating
write there that is not born so governed.

On a server that also advertises `put-null-removes`, a `"$policy": null` member under a prefix where
the server requires a connector to be born governed would leave a connector without the policy it
must carry. The server refuses it in the same way as it refuses a creating write there that
carries no `$policy`.

**Authorization.** The call executes as the principal the server's own identity chain resolved for
the inbound request; the embedder's handler MUST NOT be able to name a principal. An anonymous
principal and a path-scoped sub-token (the "Path-scoped sub-tokens (OPTIONAL, feature `path-scoped-tokens`)" section of {{RESTACT-DELEGATION}}) MUST both be refused. The use-grant
is `read` on the connector's own policy — evaluated by the server's one policy engine, with a
refusal indistinguishable from "no such connector" — and, for each spliced reference, `read` on that
reference as well.

**Destination affinity.** A `${secret:<path>}` placeholder is honored ONLY inside the connector's own
`splice` templates. It MUST name a reference the connector declares in `secretRefs`, that reference
MUST list the connector's own path in its `connectors` member (both sides, byte-for-byte), and the
reference MUST live under the secrets mount ({{secrets-mount}}). The caller's own headers, body and
request target are data: no placeholder in them is ever honored, and the literal `${secret:`
appearing in any of them MUST be refused rather than passed through. A caller header colliding with a
splice slot, an occupied body slot, and a non-JSON body when body slots are declared MUST each be
refused. Every declared reference resolves or the call is refused: there is never a partial send with
an empty credential.

**Reach.** Destinations are bounded by operator configuration, never by the connector alone. A server
MUST resolve the declared name, verify EVERY resolved address against the ranges no such call may
reach (loopback, private, link-local, unique-local, multicast, unspecified, and cloud-metadata
addresses), refuse the call if ANY of them is blocked rather than choosing among them, and connect to
exactly one verified address without a second lookup. These checks bind the address the server
connects to. A server whose platform does not let it learn or choose that address, such as a
runtime whose `fetch` resolves the name itself and exposes no resolved address, MUST send every
such call through a forward proxy that applies the range check to the address it connects to and
refuses as this paragraph requires, or MUST NOT advertise `mediated-egress`, `llm-connector` or
`webhook-connector`. TLS MUST be used and verified against the
declared name — except a destination an operator has explicitly acknowledged as a deterministic test
harness, which a server MAY admit despite failing the range check above and MAY reach over plain
`http` instead of TLS; absent that explicit acknowledgement, such a destination MUST be refused. A
`3xx` response MUST be returned to the caller as a refusal and MUST NOT be followed: a redirect names
a destination the owner never declared.

**Bounds.** Request and response bytes, header count and header bytes, and wall-clock time MUST be
bounded; a response cut at its bound MUST be reported as truncated rather than served as if complete;
returned response headers MUST be a fixed allowlist that excludes cookies and authorization echoes.

**The invariant.** A server MUST NOT format a resolved value into any string it could return, log,
audit, or persist — the value MUST be carried as opaque bytes through substitution and never
concatenated into a request line, header name, path, or diagnostic message of its own. This
structural rule, not after-the-fact recognition, is what a response, log line, audit record, or
stored object being free of the value depends on. Servers SHOULD ALSO scrub responses for a resolved
value as a backstop against an upstream that echoes it back (an error page quoting a header it
received, a `Location` built from the request); this is advisory, not a MUST, because no fixed scrub
granularity or encoding list can catch every re-encoding an upstream might apply, and a value short
enough that scrubbing it would also redact ordinary text of the same length cannot be protected by a
scrub at all. A server SHOULD refuse to splice a value shorter than whatever floor its own scrub can
protect, rather than send one it could not recover if echoed. Every call, including every refusal,
SHOULD be audited by reference PATH — never by value, and never by value length.

On a server that also advertises `llm-connector` or `webhook-connector`, a mediated call through a
typed connector, one whose `kind` is `llm` ({{llm}}) or `webhook` ({{webhook}}), is refused
(`connector-kind-mismatch`): a typed connector is reached only through its own interface.

**Discovery.** A server supporting this profile MUST advertise `mediated-egress`.

## Codes of the mediated call {#egress-codes}

The codes that the refusals of {{mediated-egress}} carry, with the HTTP status class of each and the
feature tokens that cover it (the "Extension specifications" section of {{RESTACT}}), are below.
Each refuses a mediated call, except `connector-birth-ungoverned`, which refuses a creating write. A
code that `llm-connector` or `webhook-connector` also covers is one a refusal of `complete` ({{llm}}) or of `post` ({{webhook}}) can carry. A mediated
call through a typed connector carries `connector-kind-mismatch` ({{llm-discovery}}). Another
extension MAY carry `secret-not-bound`, `secret-not-mount`, `secret-denied` or `secret-too-short`
in a refusal of its own feature's use of a secret reference: that extension defines the refusal,
which names the same kind of fault as the code's row, and a feature token of that extension then
also covers the code and is listed in the row's Covered by cell. REST:ACT HTTP Verbs
{{RESTACT-HTTP-VERBS}} carries all four in its refusals of a deployment with webhook verification.

| Code | Status | Covered by | Meaning |
|---|---|---|---|
| `egress-denied` | 403 | `mediated-egress`, `llm-connector`, `webhook-connector` | the principal may not use the connector: it is anonymous or holds a path-scoped sub-token, or it lacks `read` in the connector's own `$policy`. A connector that does not exist is refused the same way |
| `egress-connector-ungoverned` | 403 | `mediated-egress`, `llm-connector`, `webhook-connector` | the connector carries no `$policy` of its own, or its `write` or `delete` list is not exactly `["owner"]` |
| `egress-not-allowed` | 403 | `mediated-egress`, `llm-connector`, `webhook-connector` | the destination is outside what the operator's configuration admits, or the request path is outside the connector's `pathPrefixes` |
| `egress-blocked-address` | 403 | `mediated-egress`, `llm-connector`, `webhook-connector` | an address the destination's name resolves to is in a range no mediated call may reach |
| `egress-connector-invalid` | 422 | `mediated-egress`, `llm-connector`, `webhook-connector` | the call names a connector path that is not an object path, or a connector member is absent or malformed, such as an address-literal `host` or a `tls` other than `"required"` |
| `egress-bounds-exceeded` | 413 | `mediated-egress`, `llm-connector`, `webhook-connector` | the request is over a byte or header bound |
| `egress-redirect-refused` | 502 | `mediated-egress`, `llm-connector`, `webhook-connector` | the destination answered with a redirect (`3xx`), which the server does not follow |
| `egress-upstream-error` | 502 | `mediated-egress`, `llm-connector`, `webhook-connector` | the destination could not be reached: name resolution, connection or TLS failed, or the wall-clock bound ran out |
| `connector-birth-ungoverned` | 422 | `mediated-egress` | a write that creates an object under the prefix the server declares for connectors carries no `$policy` of its own, or one whose `write` or `delete` list is not exactly `["owner"]` |
| `splice-slot-conflict` | 422 | `mediated-egress` | a caller header collides with a splice slot, or the caller's body occupies a body slot |
| `splice-body-not-json` | 422 | `mediated-egress` | the connector declares body slots and the caller's body is not JSON |
| `placeholder-in-caller-data` | 403 | `mediated-egress` | the literal `${secret:` appears in the caller's headers, body or request target |
| `secret-not-declared` | 403 | `mediated-egress` | a placeholder names a reference that the connector does not declare in `secretRefs` |
| `secret-not-bound` | 403 | `mediated-egress`, `llm-connector`, `webhook-connector`, `webhook-verification` | the reference's `connectors` member does not list the connector, or, for webhook verification, its `verifiers` member does not list the route and its owner |
| `secret-not-mount` | 403 | `mediated-egress`, `llm-connector`, `webhook-connector`, `webhook-verification` | the reference is not under the secrets mount |
| `secret-denied` | 403 | `mediated-egress`, `llm-connector`, `webhook-connector`, `webhook-verification` | the principal may not read the reference; for webhook verification, the principal deploying the verb |
| `secret-too-short` | 403 | `mediated-egress`, `llm-connector`, `webhook-connector`, `webhook-verification` | a resolved value is shorter than the floor the server's scrub can protect, or, for webhook verification or webhook delivery, a key shorter than 16 bytes or, for delivery, one that does not decode |
| `secret-unresolvable` | 503 | `mediated-egress`, `llm-connector`, `webhook-connector` | a declared reference did not resolve |
| `secret-not-utf8` | 422 | `mediated-egress`, `llm-connector` | a resolved value is not UTF-8 text, so it cannot be placed into a header or a JSON string unchanged. It stays unusable until its owner rewrites it |

# Model Completion (OPTIONAL, feature `llm-connector`) {#llm}

A server MAY let a verb ask a language model for a completion through an `llm` capability interface
the verb imports. The verb never reaches the network. It names a governed **connector** object, and
the server makes the call itself under the rules of the mediated outbound call
({{mediated-egress}}), placing the connector owner's credential from the secrets mount
({{secrets-mount}}) into the request and returning a typed result. The verb sees no socket, no
request or response on the wire, and never the credential. The interface has one operation:

* `complete(request) -> result<completion, invocation-error>` performs one bounded, non-streaming,
  text-only completion. The request carries `connector` (the connector's object path), an optional
  `system` prompt, `messages` (each a `role`, `user` or `assistant`, and a string `content`), and
  an optional `model`, `max-output-tokens` and `temperature`. The completion carries the model's
  `text`; a `stop-reason` normalized to `end`, `max-tokens`, `stop-sequence` or `other`; the `model`
  the provider reports having used; and `usage`: input, output and cache-read token counts, an
  optional `estimated-usd-micros`, and the `meter-tier` that produced them ({{llm-budget}}).

Every refusal is an `invocation-error` carrying a stable code ({{llm-discovery}}), never a trap, so
a verb can degrade.

The capability is gated the same way as composition and object-data access: a server links it only
for a component that imports it, a deployment MAY withhold it from a verb that declares it
(the "Verb declaration (deployment profile)" section of {{RESTACT}}), and it is attenuated down a composition tree, so a called verb never holds it when
its caller's frame does not (the "Composition" section of {{RESTACT}}). A call from a verb that does not hold it is refused
with `forbidden`.

**Purity.** `complete` is effectful by construction: it spends money, its result is not
deterministic, and the prompt leaves the server for a third party. A `function` (the "Verb invocation (the bare verb)" section of {{RESTACT}}) MUST
NOT call it; a server refuses the call with `403` `forbidden-side-effect`. A server MUST also reject
at deployment, with `400` `forbidden-side-effect`, a `function` whose component imports `llm`,
wherever the verb's own imports are known to it. A source-language verb whose runner serves every
verb of its language (the "Verb code: source and executable" section of {{RESTACT}}) has no imports of its own, so for it the runtime refusal is the
only one. A completion that has been sent is an external effect outside the invocation's atomic
write set (the "Consistency" section of {{RESTACT}}): a later trap rolls back the verb's object writes but not the spend,
which the budget ledger records regardless. A connector's `purity` member (below) cannot make
`complete` safe.

**The connector.** A connector used through `llm` is a connector of {{mediated-egress}}, under every
rule there for its own `$policy`, its owner-only `write` and `delete`, reach, TLS, redirects and
bounds, with these members in addition (string values, JSON-encoded where structured):

* `kind` (required): `"llm"`. A call naming a connector of another kind is refused
  (`connector-kind-mismatch`).
* `provider` (required): a registered, versioned identifier from the REST:ACT LLM Providers
  registry ({{connectors-iana}}), such as `anthropic-messages/v1`. The registry row fixes the wire format, the
  request path under the connector's `destination`, the request header that carries the
  credential, and how the provider's usage and stop reason map onto `usage` and `stop-reason`. An
  unregistered or unversioned value makes the connector invalid. A server MAY decline to implement
  a registered provider, and then refuses a connector that names it (`llm-provider-unsupported`).
* `secretRefs` (required): exactly one reference, whose value the server places in the header the
  provider's row names. A typed connector MUST NOT carry `splice`: the registry row fixes where the
  credential goes, so there is no owner-written template and nothing a caller could collide with.
* `budget` (required): the path of a budget root ({{llm-budget}}) whose `state` object has the same
  stored `$owner` as the connector, so that nobody bills a ceiling someone else owns.
* `models` (optional): `{"default": "<id>", "allowed": ["<id>", …]}`. A request naming a model
  outside `allowed`, when `allowed` is present, is refused, and so is a request that names no model
  to a connector with no `default` (`llm-model-not-allowed`). A request naming none otherwise uses
  `default`.
* `pricing` (optional): `{"inputPerMTok", "outputPerMTok", "cacheReadPerMTok"}`, the owner's
  statement of the provider's prices in US-dollar micros per million tokens, used to reconcile at
  tier 2.
* `meterTier` (optional): `"0"`, `"1"` or `"2"` ({{llm-budget}}); absent is `"0"`.
* `estimateUsdMicrosPerCall` (required at tier 1 or 2): the conservative amount reserved per call.
* `purity` (optional): `"safe"` or `"effectful"`, absent meaning `"effectful"`. A server only ever
  narrows with it: an operation the server knows to be effectful stays effectful whatever the member
  says. It exists for later typed interfaces whose operations can be safe.

**Authorization.** The server evaluates the use-grant for the principal the calling frame runs as
(the "Execution identity" section of {{RESTACT}}): `read` in the connector's own `$policy`, and `read` on the secret reference,
which MUST be mount-resident and MUST name the connector in its own `connectors` member
({{mediated-egress}}). An anonymous principal and a path-scoped sub-token
(the "Path-scoped sub-tokens (OPTIONAL, feature `path-scoped-tokens`)" section of {{RESTACT-DELEGATION}}) are refused. Under an authority switch the use-grant is evaluated for the
owner's frame while the spend is billed to the real caller ({{llm-budget}}), so a verb that runs as
its owner and imports `llm` spends its owner's connector for every principal its `execute` policy
admits. That policy, not the connector's `read` list, is then the effective spend policy, and an
owner SHOULD narrow it to the principals meant to use the credential.

**Bounds.** A server MUST hold every call within these ceilings. A server MAY apply lower bounds
that a connector's `limits` ({{mediated-egress}}) names; nothing raises them.

* At most 64 `messages`, and at most 64 KiB of serialized request (`llm-request-too-large`).
* `max-output-tokens` clamped to at most 4096, never raised; absent, the connector's or the
  server's default applies.
* At most 4 calls per invocation tree, counted across the whole composition tree under its one
  shared bound (the "Composition" section of {{RESTACT}}), every attempt included (`llm-calls-exceeded`). The cap is fixed,
  not configurable, so no configuration turns a bounded tree into an agent loop.
* The wall-clock bound of a mediated call ({{mediated-egress}}). The call also counts against
  the server's limit on mediated calls in flight.

Text is the only content. Images, documents, tool definitions and tool results, structured-output
schemas, streaming, and multi-turn continuation handles are not part of `complete`; each would be a
new method or a new interface (the "The guest contract (WIT)" section of {{RESTACT}}), never an overload of this one.

**Output.** The completion `text` is opaque, untrusted data to the verb and to everything
downstream. The server never interprets, parses or executes it, and a verb that renders it does so
under the same rules as any other string. Text a verb stores carries no mark of where it came from,
so an application that needs to tell model output apart keeps that record itself. An error answered
by the provider is returned as `llm-upstream-error`, carrying the provider's status
and a bounded excerpt scrubbed as {{mediated-egress}} recommends.

**Execution locus.** A credentialed call runs only in the server process. A server that runs a
verb's frame in a separate worker process (the "Security Considerations" section of {{RESTACT}}) MUST NOT resolve a secret value in that
worker. It refuses `complete` there with `typed-call-unavailable-under-isolation` before any policy
read, budget reservation or network I/O, rather than handing the credential to a weaker locus.

## The budget {#llm-budget}

Every `llm` connector names a budget, and the server meters every call against it. A budget is two
kinds of ordinary governed object under a root path `<b>`: `<b>/state`, the aggregate, and
`<b>/ledger/<seq>`, one row per charge. An application that also spends on the owner's behalf
(its own model calls, for example) keeps its spend in the same budget, so one ceiling covers both.

The owner creates `<b>/state`; the server never does, and refuses a call whose budget state is
absent (`budget-unconfigured`). `<b>/state` MUST carry its own `$policy` whose `write` and `delete`
lists are exactly `["owner"]`; otherwise the server refuses to use it (`budget-ungoverned`), since a
principal able to write it could raise the ceiling. The calling principal needs no authority over
the budget: its authority is `read` on the connector.

**Metering tiers.** The connector's `meterTier` decides how a call is costed.

| Tier | Source of the figure | What it bounds |
|---|---|---|
| `0` | what the server observes: calls, bytes, wall time | Safety: the call ceiling and the principal's quota. Needs nothing from the provider and records no dollar figure. |
| `1` | the connector's `estimateUsdMicrosPerCall` | A spending cap applied before dispatch: each call reserves the estimate and settles at it. |
| `2` | the provider's reported token usage times the connector's `pricing` | Accuracy: the reconciled figure, rounded up to the micro, replaces the estimate. |

Bounds never depend on the provider's cooperation; only accuracy does. Every dollar figure a server
records is an estimate built from the provider's reported usage and the owner's stated prices, and
is marked as one; the server never knows what is really billed. At tiers 1 and 2 a server MUST
reserve before it sends and reconcile afterwards: the estimate is debited before the request leaves
and the real figure replaces it after, so the next call is gated on what was spent, and a crash in
between leaves a conservative reservation rather than an unrecorded spend.

**`<b>/state`.** Members the owner decides on are top-level, written only by the owner through the
data plane, and never written by the server:

| Member | Meaning |
|---|---|
| `ceilingUsdMicros` | The period's ceiling for the whole root. |
| `ceilingCalls` | The period's call ceiling, which also bounds a tier-0 connector. |
| `periodSeconds` | The period length. |
| `subCeilings` | JSON `{"<principal>": {"ceilingUsdMicros": "<n>"}, …}`. A principal absent from it is bounded by the root ceiling only. |
| `totals` | The accrual envelope below, and the only member the server writes. |

Members that change when money is spent live inside `totals`, one JSON-encoded property, because a
compare-and-swap of a single property (`set-at-if`, the "Object Data Access" section of {{RESTACT-OBJECTS}}, or a conditional `PUT`) is the
only atomic write available to an application sharing the budget. Values are decimal-integer
strings unless noted.

| Sub-member | Meaning |
|---|---|
| `periodStart` | The start of the current period, in epoch milliseconds. |
| `spentUsdMicros`, `calls` | The period's running totals. |
| `reservedUsdMicros` | Open reservations. Written by the server only. |
| `lastPeriodSpentUsdMicros` | The previous period's spend. |
| `bySubject` | An object `{"<principal>": {"spentUsdMicros", "reservedUsdMicros", "calls"}}`, an entry created at zero when first touched. Only the server writes `reservedUsdMicros`. |
| `nextLedgerSeq` | The key of the next ledger row, taken and incremented in the same write. |
| `openReservations`, `foldedReservations` | The server's record of reservations in flight and of expired ones (below). Written by the server only. |

A server refuses a `state` whose `totals` is absent, is not a JSON object, or lacks a usable
`periodStart` or `nextLedgerSeq`, and one that carries `periodStart`, `spentUsdMicros`, `calls` or
`bySubject` at the top level instead of inside `totals` (`budget-unconfigured`). It never defaults
`periodStart` or `nextLedgerSeq`: a default would invent a period or renumber a ledger.

**Every writer carries through what it does not own.** A writer that rewrites `totals` MUST read
it, change only the sub-members it is entitled to, and write back every other sub-member, and
every other key inside a `bySubject` entry, unchanged. A writer that rebuilt the envelope from a
fixed list of keys would erase the other writer's members: an application that erased a server
reservation would over-admit, and a server that erased an application's member would lose its data.
A writer admitting its own spend MUST compare the ceiling against `spentUsdMicros +
reservedUsdMicros` plus the new charge, never against `spentUsdMicros` alone. Inside `totals` the
server writes only the sub-members above; outside it, only ledger rows.

**Write authority.** The server's budget writes pass through the same policy gate as any data-plane
write, evaluated as the stored `$owner` of `<b>/state`, and each is one conditional write of
`totals` (`If-Match` on the representation just read, the "Consistency" section of {{RESTACT}}) retried from a fresh
read on `412`. An application writes as the owner in the same way, so the two writers are
serialized by the ordinary conditional-write mechanism.

**Reserve.** Before any I/O the server reads `state`, settles expired reservations and rolls the
period over if it has ended (below). It then refuses `budget-exhausted`, naming the ceiling that
bound, when `calls + 1` exceeds `ceilingCalls`; or, at tier 1 or 2, when `spentUsdMicros +
reservedUsdMicros` plus the estimate exceeds `ceilingUsdMicros`; or, where `subCeilings` names the
billed principal, when that principal's own spent and reserved figures plus the estimate exceed
its ceiling. Otherwise, in one conditional write, it adds the estimate to `reservedUsdMicros`,
increments `calls` (and both for the principal in `bySubject`), takes `nextLedgerSeq` as the row key
and increments it, and records the reservation; then it creates the ledger row. A row the policy
gate refuses is `budget-ungoverned`, and the server releases the reservation before refusing.

**Reconcile, release and expiry.** After the call the server replaces the reservation with the
actual figure: at tier 2 the reported usage times `pricing`; at tier 1, or at tier 2 when the
response has no usage, the estimate; at tier 0, zero. A call that failed after the request was sent
and reported no usage settles at the estimate, never at zero. A failure after the reservation but
before any byte is sent is released instead: the row is written terminal with no spend, and the
reservation and its count in `calls` are removed. A reservation still open three times the
mediated-call wall-clock bound after it was made is presumed lost to a crash and is folded into
`spentUsdMicros` at its estimate; a reconcile that arrives later corrects that figure once. A ledger
row becomes terminal at most once and is never rewritten afterwards.

**Rows.** Every row carries `kind`, `principal` (the billed subject), `usdMicros`, `calls`,
`estimate` (whether the figure is an estimate), `reservedAt` (epoch milliseconds) and optionally
`connector`. A row the server writes has `kind` `"verb-llm"` and also carries `verb`, `meterTier`
and, at tier 2, the token counts. A row is created with the `$owner` of `<b>/state` and an explicit
`$policy` whose `read` list is that of `state` at the time and whose `write` and `delete` lists are
`["owner"]`: whoever may read the aggregate may read its rows, and only the owner edits history. A
server places no meaning on a `kind` it did not write. No row carries the prompt or the completion.

**Rollover.** The server, on every reserve, and an application, on each of its own writes to
`totals`, that finds `now ≥ periodStart + periodSeconds × 1000` MUST, in the same write and before
its own changes, set `lastPeriodSpentUsdMicros` to `spentUsdMicros`; set `spentUsdMicros`, `calls`,
and each `bySubject` entry's `spentUsdMicros` and `calls` to zero; and set `periodStart` to the
start of the period that contains `now` on the owner's grid,
`periodStart + ⌊(now − periodStart) / (periodSeconds × 1000)⌋ × periodSeconds × 1000`, not to `now`
itself, which would lengthen every quiet period by the gap. Reservations, `nextLedgerSeq` and the
server's reservation records carry over. Rollover happens lazily, on the first of those writes that
finds the period over, needs no timer, and is idempotent.

**Billing.** The billed principal is always the real caller, also under an authority switch
(the "Execution identity" section of {{RESTACT}}): a row's `principal` and the sub-ceiling consulted are the caller's, as for
quota.

**Out of scope.** A server does not create `state`, prune the ledger (deleting rows is the owner's
business), reconcile rows it did not write, convert currencies, know real prices, or enforce one
ceiling across several budget roots.

## Codes and discovery {#llm-discovery}

The codes a refusal of `complete` carries, with the HTTP status class of each, are:

| Code | Status | Meaning |
|---|---|---|
| `forbidden` | 403 | the verb does not hold the capability of the interface it called, `llm` or `webhook` ({{webhook}}) |
| `forbidden-side-effect` | 403 | a `function` called `complete` or `post` |
| `connector-kind-mismatch` | 422 | the connector's `kind` does not fit the call: a `complete` through a connector whose `kind` is not `llm`, a `post` through one whose `kind` is not `webhook` ({{webhook}}), or a mediated call through a typed connector ({{mediated-egress}}) |
| `llm-provider-unsupported` | 422 | the connector names a registered provider the server does not implement |
| `llm-model-not-allowed` | 403 | the model is outside `models.allowed`, or none was named and the connector has no default |
| `llm-request-too-large` | 413 | too many messages, or too many request bytes |
| `llm-calls-exceeded` | 429 | the invocation tree has used its calls |
| `budget-unconfigured` | 422 | the connector has no budget, or its `state` is absent, malformed or owned by someone else |
| `budget-ungoverned` | 403 | the budget's `state` is writable by someone other than its owner, or its ledger refuses the owner's row |
| `budget-exhausted` | 429 | a root or per-principal ceiling would be exceeded; the detail names which. Transient: the caller backs off, and the server does not retry |
| `typed-call-unavailable-under-isolation` | 501 | the server runs the frame where no secret may be resolved, a fixed property of its configuration |
| `llm-upstream-error` | 502 | the provider answered with an error |

A refusal under a rule this section takes from {{mediated-egress}} (authorization, destination
affinity, reach, or bounds) carries that rule's code from the table of {{egress-codes}}.

A server SHOULD audit every call as {{mediated-egress}} describes, adding the connector's kind and
provider, the model, the metering tier, the token counts, and the reconciled figure with its
estimate flag. Neither an audit record nor a ledger row ever carries the prompt or the completion:
they record that a call happened and what it cost.

**The interface.** The `llm` interface of the WIT package `rest-act:plugin` has one function,
`complete(completion-request) -> result<completion, invocation-error>` (feature `llm-connector`,
gated): one bounded, text-only model completion through a connector object. The "Guest Contract
(WIT package `rest-act:plugin`)" section of {{RESTACT}} lists it with the package's other
interfaces.

**Discovery.** A server that implements the `llm` interface and can place a mediated credential (a
secrets mount in service and a destination allowlist configured, {{mediated-egress}}) MUST advertise
`llm-connector`. The token is independent of `mediated-egress`: a server can offer the mediated call
without linking `llm`, and a server that links `llm` advertises its token whether or not it offers
the mediated call to embedders. A server that refuses `complete` in worker processes still
advertises it, since the interface links; the refusal is per call. A component that imports `llm` on
a server without the token is refused at upload (the "The guest contract (WIT)" section of {{RESTACT}}). A verb that holds the capability
reports `networkAccess` `"outbound"` in its descriptor (the "Discovery" section of {{RESTACT}}), which here means outbound
calls the server itself makes through connector objects, never a socket the verb holds, and lists
`rest-act:plugin/llm` among its `interfaces`. Its reported `world` MAY be the one it would target
without `llm`.

# Webhook Delivery (OPTIONAL, feature `webhook-connector`) {#webhook}

A server MAY let a verb send a signed webhook through a `webhook` capability interface the verb
imports. As with {{llm}}, the verb never reaches the network. It names a governed connector object,
and the server builds the request, signs it with the connector owner's key from the secrets mount
({{secrets-mount}}), and sends it under the rules of the mediated outbound call
({{mediated-egress}}). The interface has one operation:

* `post(request) -> result<delivery, invocation-error>` sends one `POST` with JSON content to the
  connector's destination. The request carries `connector` (the connector's object path), `body`
  (a string holding the JSON text {{RFC8259}} to send) and an optional `id`. The delivery carries
  `status`, the HTTP status code the destination answered with, and the `id` the server sent.

The verb chooses only the content and, optionally, the message identifier. The method, the
destination, the request target, the content type and every header field are fixed by this section
and by the connector's owner. Every refusal is an `invocation-error` carrying a stable code
({{webhook-discovery}}), never a trap.

The capability is gated as `llm` is ({{llm}}): a server links it only for a component that imports
it, a deployment MAY withhold it from a verb that declares it with the grant flag `webhook=deny`
(the "Verb declaration (deployment profile)" section of {{RESTACT}}), and it is attenuated down a
composition tree. A call from a verb that does not hold it is refused with `forbidden`.

**Purity.** `post` is effectful. A `function` MUST NOT call it; a server refuses the call with `403`
`forbidden-side-effect`, and MUST reject at deployment, with `400` `forbidden-side-effect`, a
`function` whose component imports `webhook`, wherever the verb's own imports are known to it. A
delivery that has been sent is an external effect outside the invocation's atomic write set (the
"Consistency" section of {{RESTACT}}): a later trap rolls back the verb's object writes but not the
delivery. A server sends each `post` at most once and never retries it. A refusal does not carry an
identifier the server made, so a verb that may retry a `post` passes its own `id`, the same one on
every attempt, and a receiver can then drop the duplicate.

**The connector.** A connector used through `webhook` is a connector of {{mediated-egress}}, under
every rule there for its own `$policy`, its owner-only `write` and `delete`, reach, TLS, redirects
and bounds, with these members in addition (string values):

* `kind` (required): `"webhook"`. A call naming a connector of another kind is refused
  (`connector-kind-mismatch`).
* `path` (required): the request target, which matches `path-absolute` of {{RFC3986}}, optionally
  followed by `?` and a query, holds no space or control character, and is at most 2048 bytes.
* `signing` (required): `"standard-webhooks"`, the only value of this version. The server signs as
  the `standard-webhooks` scheme of {{RESTACT-HTTP-VERBS}} verifies.
* `secretRefs` (required): exactly one reference, whose value is the signing key in the form that
  scheme reads. A key that does not decode, or decodes to fewer than 16 bytes, is refused
  (`secret-too-short`), and a server MUST NOT refuse a longer key for its length, so a key that
  verifies under {{RESTACT-HTTP-VERBS}} signs on every server. The key is never placed in the
  request, so the scrub floor of {{mediated-egress}} does not apply to it.

A webhook connector MUST NOT carry `splice` or `pathPrefixes`: the connector's `path` and this
section fix the whole request, so there is no owner-written template and nothing a caller could
collide with. A connector that breaks a rule of this list is refused (`egress-connector-invalid`).

**The request.** The server sends `POST` to the connector's `destination` at its `path`, with these
header fields and no others, apart from `Host`, a `User-Agent` of the server's choosing, and the
fields that framing the content needs:

* `Content-Type: application/json`;
* `webhook-id`: the request's `id` or, when it has none, an identifier of that form the server
  makes with at least 128 bits from a cryptographically secure random source. An `id` is 1 to 64 characters,
  each an ASCII letter, a digit, `_` or `-`; any other `id` is refused (`invalid-input`);
* `webhook-timestamp`: the server's clock when it signs, as that scheme writes a timestamp;
* `webhook-signature`: `v1,` and the signature over the `webhook-id`, `.`, the timestamp, `.`, and
  the content, as that scheme computes it.

The content is the UTF-8 encoding of the request's `body`, unchanged. The server MUST refuse a `body` that is
not JSON text (`webhook-body-invalid`) or is larger than 64 KiB (`egress-bounds-exceeded`), before
it resolves the key.

**The answer.** The verb learns only the status. Every status, a `3xx`, `4xx` or `5xx` included, is
a delivery and returns `status`, since the destination has received the request by then. A server
never follows a `3xx`; unlike the mediated call, it does not report one as a refusal. The
server reads the destination's response content only within the bounds of {{mediated-egress}} and
returns none of it, or any response header field, to the verb, so the interface carries data out and
brings back nothing an outside service chose beyond a status code.

**Authorization.** The server evaluates the use-grant for the principal the calling frame runs as,
as {{llm}} does: `read` in the connector's own `$policy`, and `read` on the secret reference, which
MUST be mount-resident and MUST name the connector in its own `connectors` member
({{mediated-egress}}). An anonymous principal and a path-scoped sub-token are refused. A verb that
runs as its owner and imports `webhook` sends through its owner's connector for every principal its
`execute` policy admits; that policy is then the effective policy for who may cause a delivery, and
an owner SHOULD narrow it.

**Bounds.** At most 8 calls of `post` per invocation tree, counted across the whole composition tree
under its one shared bound (the "Composition" section of {{RESTACT}}), every attempt included
(`webhook-calls-exceeded`). Each call is a mediated call for the wall-clock bound and the limit on
mediated calls in flight ({{mediated-egress}}). A server MAY apply lower bounds that a connector's
`limits` names; nothing raises them.

**Execution locus.** As for `complete` ({{llm}}), a server MUST NOT resolve the signing key in a
worker process that runs a verb's frame. It refuses `post` there with
`typed-call-unavailable-under-isolation` before any policy read or network I/O.

## Codes and discovery {#webhook-discovery}

The codes a refusal of `post` carries, beyond those {{llm-discovery}} defines and uses alike
(`forbidden`, `forbidden-side-effect`, `connector-kind-mismatch` and
`typed-call-unavailable-under-isolation`), are:

| Code | Status | Meaning |
|---|---|---|
| `webhook-body-invalid` | 422 | the `body` is not JSON text |
| `webhook-calls-exceeded` | 429 | the invocation tree has used its calls |

A refusal under a rule this section takes from {{mediated-egress}} (authorization, destination
affinity, reach, or bounds) carries that rule's code from the table of {{egress-codes}}. A
destination that could not be reached is `egress-upstream-error`.

A server SHOULD audit every call as {{mediated-egress}} describes, adding the connector's kind, the
`webhook-id` and the status. No audit record carries the content.

**The interface.** The `webhook` interface of the WIT package `rest-act:plugin` has one function,
`post(webhook-request) -> result<webhook-delivery, invocation-error>` (feature `webhook-connector`,
gated). The "Guest Contract (WIT package `rest-act:plugin`)" section of {{RESTACT}} lists it with
the package's other interfaces.

**Discovery.** A server that implements the `webhook` interface and can place a mediated credential
MUST advertise `webhook-connector`, independently of `mediated-egress` and `llm-connector`. A
server that refuses `post` in worker processes still advertises it, since the interface links. A
component that imports `webhook` on a server without the token is refused at upload (the "The guest
contract (WIT)" section of {{RESTACT}}). A verb that holds the capability reports `networkAccess`
`"outbound"` in its descriptor, as {{llm-discovery}} describes, and lists `rest-act:plugin/webhook`
among its `interfaces`.

# Security Considerations {#connectors-security}

The requirements that keep a credential from leaking are in the sections that define each feature.
This section adds no requirement. It lists them by the party they constrain: the verb, the caller,
and the owner of a connector or a mount.

* A verb never holds a socket or a credential value. It can ask for a completion only through a
  connector whose use-grant its frame's principal holds, within the call cap of its invocation tree
  and the ceilings of the connector's budget, and the text it gets back is untrusted data ({{llm}},
  {{llm-budget}}). A verb that runs as its owner spends the owner's connector for every principal
  its `execute` policy admits, so that policy is then the effective spend policy ({{llm}}). It
  can send a webhook only as JSON content to a destination and path that a connector's owner fixed,
  signed with a key it never sees, and learns only the status ({{webhook}}). The content is
  whatever the verb chose, so a verb that may read data can send it to that destination: holding
  `read` on a webhook connector is a grant to send data there.
* A caller's headers, body and request target are data. A `${secret:` placeholder is honored only
  in the connector owner's `splice` templates, a reference is used only when it lists the connector
  back, and the server connects only to a destination that the operator's configuration
  admits, at an address that passes the range check unless the operator has explicitly acknowledged
  that destination as a deterministic test harness, without following a redirect ({{mediated-egress}}). Holding `read` on a connector lets a caller have the server splice the
  owner's credential into a call; it never lets the caller see the credential.
* A value written to a mount path goes to the secrets backend and is never persisted or returned
  ({{secrets-mount}}). The server refuses a call through a connector whose own `$policy` does not
  limit `write` and `delete` to its owner, and refuses to use a budget `state` whose own `$policy`
  does not, since those objects decide where a credential goes and how much may be spent
  ({{mediated-egress}}, {{llm-budget}}).

The security considerations of {{RESTACT}} apply.

# IANA Considerations {#connectors-iana}

This document requests the following registrations in registries that {{RESTACT}} creates, and one
new registry.

* In the "REST:ACT Feature Tokens" registry: `secrets-management` ({{secrets-mount}}),
  `mediated-egress` ({{mediated-egress}}), `llm-connector` ({{llm}}) and `webhook-connector`
  ({{webhook}}).
* In the "REST:ACT Error Codes" registry: the codes in the tables of {{egress-codes}},
  {{llm-discovery}} and {{webhook-discovery}}, except `forbidden` and `forbidden-side-effect`,
  which {{RESTACT}} registers.
* In the "REST:ACT Capability Interfaces" registry: `rest-act:plugin/llm` ({{llm}}) and
  `rest-act:plugin/webhook` ({{webhook}}).
* A **"REST:ACT LLM Providers"** registry of the versioned wire-protocol identifiers an `llm`
  connector names in `provider` ({{llm}}), registration policy Specification Required {{RFC8126}};
  initial entry `anthropic-messages/v1`, in `registries/llm-providers.md`. A row pins the provider's
  wire format at a fixed API version, so a changed format is a new identifier, never an edit to a
  registered one.
