---
title: "The REST:ACT Protocol: Invoking Sandboxed Functionality over REST"
abbrev: "REST:ACT"
docname: draft-byrd-restact-protocol-00
category: exp
submissiontype: independent
ipr: trust200902
area: "Applications"
keyword:
  - REST
  - WebAssembly
  - custom methods
  - capability security
stand_alone: yes
pi: [toc, sortrefs, symrefs, comments]
author:
  -
    ins: N. Byrd
normative:
  RFC9110:
  RFC9111:
  RFC9457:
  RFC7232:
  RFC8288:
  RFC6749:
  RFC6750:
  RFC7240:
  RFC8259:
  RFC5234:
  RFC3986:
  RFC8615:
informative:
  RFC8126:
  RFC7519:
  RFC8693:
  RFC8252:
  RFC7636:
  RFC9700:
  OIDC:
    title: "OpenID Connect Core 1.0"
    target: https://openid.net/specs/openid-connect-core-1_0.html
  AIP136:
    title: "AIP-136: Custom Methods (Google API Improvement Proposals)"
    target: https://google.aip.dev/136
  AIP122:
    title: "AIP-122: Resource Names"
    target: https://google.aip.dev/122
  AIP158:
    title: "AIP-158: Pagination"
    target: https://google.aip.dev/158
  AIP160:
    title: "AIP-160: Filtering"
    target: https://google.aip.dev/160
  AIP161:
    title: "AIP-161: Field Masks"
    target: https://google.aip.dev/161
  AIP151:
    title: "AIP-151: Long-Running Operations"
    target: https://google.aip.dev/151
  JSONAPI:
    title: "JSON:API v1.1"
    target: https://jsonapi.org/format/
  ODATA:
    title: "OData Version 4.01 Part 1: Protocol"
    target: https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html
  WASI:
    title: "WASI 0.2 and the WebAssembly Component Model"
    target: https://component-model.bytecodealliance.org/
  IDEMPOTENCY:
    title: "The Idempotency-Key HTTP Header Field (draft-ietf-httpapi-idempotency-key-header)"
    target: https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-idempotency-key-header
  HTMLIFRAME:
    title: "HTML: the iframe element (WHATWG Living Standard)"
    target: https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element

--- abstract

REST:ACT extends the Representational State Transfer (REST) style so that clients can invoke
sandboxed *functionality* ("verbs") on a server, not only operate on data ("nouns"). A verb is an
uploaded, capability-confined program (canonically a WebAssembly component) that the server runs
under enforced resource limits. REST:ACT models a server as a tree of objects: each object has a
data representation and a set of verbs; the path hierarchy provides single inheritance; and a verb
is itself an addressable object with properties. The protocol reuses HTTP methods, status codes,
and headers, and is defined as a compatible extension of the custom-method conventions of the
Google API Design Guide. This document specifies the addressing grammar, method semantics, verb
resolution, the capability and authorization models, composition of verbs, error reporting, and
the security considerations of executing untrusted code on behalf of clients.

--- middle

# Introduction

Most "REST" APIs let a client manipulate the *state* of resources. A growing class of
applications also needs clients to supply *behavior* that runs on the server: a user uploading a
function to transform rows in a database; a bot contributing a tool to a remote service; a social
platform running a profile owner's code when others interact with it; or a user-built interactive
environment in which participants author both content and programming. The widespread availability
of code-generating AI assistants makes authoring such behavior accessible to non-experts, which
sharply increases both the demand for, and the untrustworthiness of, uploaded code.

REST:ACT addresses this by adding **verbs** — units of server-side functionality — to the REST
**nouns**. A verb is an uploaded program, sandboxed and resource-limited, invoked over ordinary
HTTP. REST:ACT keeps the HTTP uniform interface (methods, status codes, headers, content
negotiation, caching) and adds a small grammar and a set of conventions for addressing,
inheriting, invoking, authorizing, and composing verbs.

## Design goals

1. **A small normative core, with layered conventions.** The mandatory grammar is tiny; richer
   behavior (a world API, an authorization vocabulary, additional source languages) is layered and
   OPTIONAL. A trivial API uses a thin slice; a complex environment uses the whole stack; both are
   the same protocol.
2. **Untrusted by default.** Uploaded code is assumed hostile. Execution is capability-confined
   (deny-by-default), resource-limited, and bounded by the invoking principal's own authority.
3. **Compatible extension of existing practice.** REST:ACT extends the custom-method conventions
   of the Google API Design Guide {{AIP136}} and reuses HTTP semantics {{RFC9110}}; any
   AIP-136-compliant custom method is a valid REST:ACT verb invocation.

## Relationship to REST

REST:ACT operates at "Level 2" of the Richardson Maturity Model — resources with distinct URIs,
correct use of HTTP methods and status codes — and deliberately *extends* the uniform interface
with action and inheritance semantics, following the precedent of OData Actions and Functions
{{ODATA}} and AIP-136 custom methods {{AIP136}}. This is an intentional design choice, not an
attempt to be maximally "RESTful."

# Conventions and Terminology {#terminology}

{::boilerplate bcp14-tagged}

The following terms are used throughout:

Object:
: A resource addressed by a path. An object has a **data** representation and a set of **verbs**.

Verb:
: A unit of server-side functionality addressed off an object via the colon separator (`:`). A
  verb is itself an object with properties.

Function / Action:
: A verb with no observable side effects (a *function*, invoked with `GET`) versus one that may
  have side effects (an *action*, invoked with `POST`). See {{taxonomy}}.

Bound / Unbound verb:
: A verb attached to a specific object or collection (*bound*) versus one attached to the service
  root (*unbound*).

Property (of a verb):
: A sub-resource of a verb, addressed as `…:verb/<property>`. `code`, `policy`, and `meta` are
  RECOMMENDED conventional property names (see {{verb-properties}}).

Principal:
: An authenticated identity, established by an OAuth 2.0 / OIDC bearer token (see {{authz}}).

Caller:
: The principal that invoked a verb. In this version a verb executes with the caller's authority
  (see {{exec-identity}}).

Capability:
: A host interface a verb is permitted to import. Verbs have no ambient authority; a capability
  not declared is unreachable.

Host / Implementation:
: A server implementing this protocol.

# Protocol Overview

A REST:ACT server is a tree of objects addressed by path. Each object has:

* **Data** — its representation, accessed with the standard HTTP methods on the object's path.
* **Verbs** — uploaded programs, addressed with the colon separator and invoked over HTTP.

The path hierarchy is a **single-inheritance** chain: invoking a verb on `/a/b/c` resolves the
verb by searching `c`, then `b`, then `a`, then the root, and runs the first definition found,
bound to `c` ({{resolution}}). A verb is itself an object and therefore has its own properties,
addressed recursively ({{addressing}}).

# Conformance and Feature Discovery {#conformance}

REST:ACT is designed to be implementable across a wide range of deployments — from a stateless
function-as-a-service gateway to a monolithic, transactional, real-time server. To make this
possible the **mandatory core is small**, and nearly everything else is an **optional feature** that
a server implements independently and **advertises** in its discovery document ({{discovery}}).

A conformant server MUST implement:

* the addressing grammar ({{addressing}}) and verb **invocation** with the function/action method
  semantics ({{taxonomy}});
* **capability confinement** (deny-by-default; {{capabilities}}) and enforced per-invocation
  resource **limits** ({{limits}}) for any verb it executes;
* the **runs-as-caller** authority rule ({{exec-identity}});
* **Problem Details** error responses ({{errors}}); and
* a **discovery** document ({{discovery}}) advertising which optional features it supports and at
  what level.

Everything else is OPTIONAL and independently advertised, including: the object **data** plane
(stored representations and their CRUD) and the **object collection listing** ({{object-listing}});
verb **code management** and which non-`application/wasm`
source languages are accepted; **composition**; **active properties** (accessor verbs); **events,
triggers, and scheduling**; **asynchronous operations**; **conditional requests** and the
**consistency level** ({{consistency-txn}}); the **object-binding mode** ({{object-binding}});
**declared data properties** ({{data-properties}});
the read-only **caller identity** ({{caller-identity}}); collection
**pagination/filtering/field masks**; and the **JSON:API** representation.

A client MUST NOT assume an unadvertised feature is present. A verb MAY declare the features and the
minimum consistency level it requires; a server that cannot satisfy a verb's requirements MUST
refuse to deploy or invoke it and SHOULD respond `501` for an unsupported feature. The same verb can
thus run unchanged on any server meeting its declared requirements, while a minimal server stays
minimal.

A verb's declarations — its kind (function/action), required capabilities, declared call graph, and
minimum consistency level — are carried by the component's imported interfaces (for capabilities)
and by its verb metadata ({{verb-properties}}); the concrete schema is fixed by the companion
OpenAPI extension. A minimal or function-as-a-service server MAY omit the object data plane and code
management entirely and accept only verbs deployed out of band: verb existence (a mapping from path
to defined verbs) is independent of whether the server stores object data. This decoupling is the
default (`implicit`) **object-binding** mode ({{object-binding}}); a server MAY instead couple the
two planes — treating the object as the entity that owns its verbs — and advertise the coupling.

# Addressing {#addressing}

## Grammar

REST:ACT paths follow the generic URI path syntax of {{RFC3986}} with one added element: a path
segment MAY carry a verb, introduced by a colon. Using the ABNF of {{RFC5234}}:

~~~ abnf
act-path   = "/" segment *( "/" segment )
segment    = name [ ":" verb ] / ":" verb   ; never empty
name       = pchar-nc *pchar-nc           ; object/property id
verb       = lalpha *( ALPHA / DIGIT )    ; camelCase method name
pchar-nc   = unreserved / pct-encoded / sub-delims / "@"
lalpha     = %x61-7A                      ; a-z
~~~

A `segment` is a name, a `:verb`, or `name:verb`, but never empty. The colon binds the verb to the
object identified by the path up to and including that segment's `name` (or to the preceding object
when the name is empty, i.e. an unbound verb on the current object). `pchar-nc` is the `pchar`
production of {{RFC3986}} §3.3 with the colon (`:`) excluded. The leading **`@`** character is
**reserved**: a server uses `@`-prefixed names for internal storage (for example a verb's `shared`
property state) that is NOT a client-addressable object, and MUST reject a client request whose object
path contains a segment beginning with `@` (the reference returns `400 invalid-input`; a server MAY
instead treat it as `404`), so a client can never name internal storage directly and bypass the
declaring property's ACL. (`$`-prefixed names are likewise reserved for system fields,
{{representations}}.)

**Concrete paths vs. definition patterns.** The grammar above is for a **concrete** request path; a
concrete `name` never contains an unescaped `{` or `}`. A verb **definition pattern** (used when
deploying a bound entity verb, {{resolution}}) extends a `name` with one form of wildcard segment,
the literal text `{id}`, matching any one concrete segment:

~~~ abnf
pattern-name = name / "{id}"
~~~

The braces are **structural in a definition pattern only**. **Decoding and the verb separator.** The
verb-separator colon and the segment delimiter `/` are also percent-encodable name characters (`%3A`,
`%2F`). A server MAY split on the RAW path before decoding (so an encoded `%3A`/`%2F` is preserved as a
literal in a name) OR — as the reference implementation does — percent-decode the path first and THEN
split it into segments and split each segment's `name` from its `:verb`. Both are conformant because
authorization is always applied to the fully-resolved target ({{authz}}), so neither order lets a
request reach a resource the client could not also name directly; the only observable difference is
that under decode-then-split an object whose name literally contains `:` or `/` is not addressable
(such names SHOULD be avoided). Independent of order, the un-encoded literal `{id}` is the wildcard in
a definition pattern while `%7Bid%7D` denotes a concrete object literally named `{id}`: a concrete
request path is always matched literally against deployed patterns ({{resolution}}) and never
re-interpreted as a pattern, so `%7Bid%7D` in a request addresses the literal object `{id}` and can
never shadow a `{id}` wildcard definition. Name comparison is case-sensitive.

The grammar is **recursive**: because a verb is an object, a `:verb` segment MAY be followed by
further `/name` and `/name:verb` segments addressing the verb's properties and the verbs of those
properties. Examples:

~~~
/animals/dogs/fido                 the object 'fido'
/animals/dogs/fido:noise           the verb 'noise' (bare form = invoke)
/animals/dogs/fido:noise/code      the 'code' property of the verb
/animals/dogs/fido:noise/code:compile   invoke 'compile' on the code
/:bulkImport                       an unbound verb on the service root
~~~

Verb names follow {{AIP136}}: an **application** verb name SHOULD be a verb optionally followed by a
noun, MUST match the `verb` production above (`lalpha *( ALPHA / DIGIT )`, i.e. `camelCase`), and
SHOULD NOT contain prepositions. The names `get`, `list`, `create`, `update`, `set`, and `delete` are
**reserved for representation accessors** ({{active-properties}}), and any name matching `on*` (e.g.
`onCreate`, `onChange`, `onDelete`, `onEnter`) is **reserved for lifecycle hooks** ({{events}}); an
application verb MUST NOT use a reserved name, and a reserved name may be deployed only as the
accessor or hook it names (with the kind that role requires). A server MUST validate a verb name at
deployment and reject one outside this grammar with `400`, so an out-of-grammar name can never reach
the discovery document.

## The three addressing forms

| Form | Identifies | Operated on with |
|------|------------|------------------|
| `/obj` | an object's data | GET, PUT, POST, PATCH, DELETE |
| `/obj:verb` | a verb (bare form) | invocation: POST (action) or GET (function) |
| `/obj:verb/<prop>` | a property of a verb | GET, PUT, DELETE, OPTIONS (per convention) |

# HTTP Method Semantics

## Object data (the noun)

The standard HTTP methods on an object path have their usual {{RFC9110}} meanings and follow the
standard-method conventions of {{AIP122}}: `GET` retrieves the representation (or, on a collection,
lists members; see {{collections}}); `PUT` writes the object's data; `PATCH` partially updates (see
{{collections}} for field masks); `POST` creates a subordinate resource; `DELETE` removes. `PUT`
**creates or updates**: a server MAY implement it as a full replace (absent members removed) OR as a
**member-wise merge/upsert** (the provided members are written and absent members are retained) —
the reference host merges, so a partial `PUT` does not erase unsent members; a server MUST document
which. `PATCH` and `POST` member-level semantics on a bare object are OPTIONAL: a server that does
not support them on the data plane directly returns `405` (and a client uses a defined accessor verb,
below, or `PUT`). These operations are gated by the object's authorization policy
({{representations}}, the `$policy` system field): `GET` by `read`, `PUT`/`PATCH`/`POST` by `write`
(for every member; a declared member must also satisfy its own ACL, {{data-properties}}, which can only narrow this gate),
and `DELETE` by `delete`. A server MAY instead mediate any of these methods through a defined
accessor verb ({{active-properties}}), in which case the accessor's `execute` policy governs. Under a coupled object-binding mode ({{object-binding}}),
`DELETE` on an object also removes the verbs bound to that object (the object owns its verbs); under
the default `implicit` mode it removes only the object's stored data and leaves its verbs in place.

## Object collection listing {#object-listing}

A server MAY support enumerating the objects that have stored data. When it does, it advertises the
`object-listing` token (distinct from the `data-plane` token for the object data plane itself) and
answers `GET` at the API root (`/v1`) with a JSON object whose `objects` member lists each
client-addressable object the caller may read, as `{ "path", "properties" }` entries (`properties`
is the count of caller-readable members). The listing MUST be filtered by the same per-property read
authorization as `GET` on the object itself, so it never reveals an object — or a property count —
the caller could not already read directly. An object the caller can read but that has zero
caller-readable members MAY be listed with `properties: 0` ONLY when the caller could read the object
directly anyway — for example an empty object the caller OWNS; an object the caller does NOT own and
none of whose members are readable by the caller MUST be omitted entirely (no existence oracle). The reserved internal namespace
(object keys beginning with `@`) MUST NOT appear.

A server SHOULD paginate the listing ({{AIP158}}): it MAY accept a `pageSize` and a `pageToken` and
return a `nextPageToken` when more results remain, and MAY impose a maximum page size, so a single
request cannot force unbounded work. Because the listing reflects only what the caller may already
read, on an anonymous, public-read deployment it is anonymously enumerable (as the data plane itself
is); a server exposing it to untrusted callers SHOULD require authentication and apply rate limiting.

A server that advertises the `object-query` token MAY further accept a `filter` parameter
({{AIP160}}) and a `read_mask` parameter ({{AIP161}}) on the listing. The `filter` restricts the
result to objects matching the expression — at minimum a single `key=value` property equality — and
`read_mask` is a comma-separated set of property names whose values are projected into a `values`
member on each entry. Both MUST operate over only the caller-readable members: a property the caller
cannot read MUST NOT match a `filter` and MUST NOT be projected by `read_mask`, so neither parameter
reveals a value the caller could not already read with `GET` on the object. A malformed `filter`
SHOULD be rejected with a `400` problem rather than answered with an empty result.

## Verb invocation (the bare verb) {#taxonomy}

Invoking a verb uses the bare `:verb` form. The method MUST follow the function/action taxonomy:

* A verb declared as a **function** (no observable side effects) is invoked with `GET` and its
  response MAY be cacheable per {{RFC9111}}. Because a function's output MAY depend on the caller's
  identity ({{caller-identity}}) or on ACL-filtered object data, a server MUST NOT let a function
  response be cached by a SHARED cache and replayed to a different caller: it marks such a response
  `Cache-Control: private` (or `no-store`) and `Vary: Authorization`. A response a server can prove is
  caller-independent MAY be marked publicly cacheable. A weak `ETag` over the output SHOULD be emitted
  so a client revalidates with `If-None-Match`. A server MUST NOT permit a `GET` invocation to mutate
  observable state. A server enforces this at runtime over the whole call tree: a function — whether
  the request root or composed beneath one (a function may compose only functions, see
  {{composition}} rule 5) — that attempts an observable side effect (writing object data via the
  `object` capability's `set`/`set-at`, publishing an event, or invoking an action) MUST be refused
  with status `403` and `restact_code` `forbidden-side-effect`, and the mutation MUST NOT occur.
  Because a `GET` always resolves to a function and a function's tree is function-only, a `GET` is
  therefore side-effect-free end to end. A function reads its input from the request body; because a
  browser cannot attach a body to a `GET` (the Fetch standard forbids it), a server MAY also accept
  the input in an `?input=` query parameter. When both are present the **body wins**. A server that
  accepts query input advertises it with the `query-input` feature token ({{discovery}}); the input
  is part of the cache key, so two `GET`s with different `?input=` are distinct cacheable resources.
* A verb declared as an **action** (possible side effects) is invoked with `POST`. The request
  body is the verb's input. Actions are not cacheable.

For retry-safe actions, clients SHOULD send an `Idempotency-Key` header {{IDEMPOTENCY}}; a server
that honors it MUST return the original result for a repeated key within its retention window. The
key is **scoped to the (principal, route)**: the same key on a different route, or from a different
principal, is a distinct request and re-executes — so one caller's key can never replay another's
result, nor a result from an unrelated verb. The cached result is retained for a bounded,
server-defined window and MAY be evicted; a key whose entry has been evicted re-executes. While a
first request bearing a key is still in flight, a concurrent retry with the same key MUST NOT execute
a second time (single-flight) — it waits for, or is rejected in favor of, the first. A server MAY
treat a repeat whose request payload differs from the original under the same key as a client error
(`422 invalid-input`) rather than replaying a result that does not correspond to the new payload. A
key is meaningful only for a caller with a stable identity: a server MAY decline to honor an
`Idempotency-Key` from an unauthenticated (anonymous) caller, since every such caller shares one
identity and replaying across them would leak or skip side effects.

## Verb properties (the program itself) {#verb-properties}

Because a verb is an object, its facets are addressed as properties and operated on with ordinary
HTTP methods. This is how a client reads, uploads, or removes a verb's program and metadata:

~~~
GET    /obj:verb/code       read code (Accept picks the form)
PUT    /obj:verb/code       replace code (Content-Type=language; see below for create)
DELETE /obj:verb/code       remove the verb on this object
GET    /obj:verb/policy     read the authorization policy
PUT    /obj:verb/policy     set the authorization policy (omitted actions keep their value)
GET    /obj:verb/meta       read metadata (owner, limits, caps, graph)
GET    /obj:verb/history    read deployment history (OPTIONAL; {{verb-history}})
POST   /obj:verb/rollback   roll code back to a prior deployment (OPTIONAL; {{verb-history}})
~~~

`code`, `policy`, and `meta` are RECOMMENDED, registered conventional property names; they are NOT
mandatory. An implementation MAY expose none, some, all, or additional verb properties, and MAY
restrict the methods available on a property (for example, accepting `PUT …/code` while never
serving `GET …/code`). Reserved property names are managed by the registry in {{iana}};
implementation-defined verb properties are permitted but MUST NOT use a registered name for a
different purpose. A client MUST discover supported properties and methods via `OPTIONS`
({{discovery}}) rather than assuming them. Access to each property is governed by the verb's policy
({{authz}}) using property-specific actions (e.g. `read-code`, `write-code`).

**Deployment history and rollback (OPTIONAL, feature `verb-history`).** `history` and `rollback`
are a further pair of registered property names, reserved for the OPTIONAL Deployment History and
Rollback profile ({{verb-history}}): a server that does not support the profile MUST NOT define
either name for any other purpose.

**Delegation (OPTIONAL, feature `delegated-tokens`).** While a verb is stamped as elevated under a
delegation ({{delegated-tokens}}), its `meta` MAY carry `boundVia`, the actor's identifier and never
the grant id.

**Paused hooks.** While a lifecycle hook is paused by an operator's ownership recovery
({{admin-reown}}), its `meta` carries `paused: true`; the member is absent otherwise.

**Conditional management (OPTIONAL, feature `verb-conditional-requests`).** Per-property entity
tags on `code`, `policy` and `props`, `If-Match` on every write to them, and create-only deployment
are specified in {{verb-conditional}}.

# Verb Resolution and Inheritance {#resolution}

When a verb is invoked on an object, the server MUST resolve the verb definition by walking up the
path hierarchy: it searches the target object, then each ancestor in turn up to the root, and uses
the first object on which the verb is defined. The verb executes **with `this` set to the target
object** (the object named before the colon in the request), regardless of which ancestor defined
it. A verb observes `this` only if it imports the object-access capability ({{capabilities}}); a
pure-compute verb that imports nothing does not observe `this`. If no definition is found, the
server MUST return `404`. An **unbound** verb (`/:verb`) is resolved only at the service root, with
no ancestor walk, and executes with `this` set to the root.

A verb is defined on a **path pattern** whose segments are each either a literal object name or a
single-segment **wildcard** `{id}` that matches any one concrete segment (a *bound* entity verb; see
{{terminology}}). One level of the hierarchy MAY therefore hold more than one matching definition:
for a request on `/counters/2`, both a literal definition on `counters/2` and a wildcard definition
on `counters/{id}` match at the same level. When several definitions match at the same level, the
server MUST select the **most specific** — comparing the candidate patterns segment by segment, a
literal segment is more specific than a wildcard, so the candidate with the most literal segments
wins (`counters/2` overrides `counters/{id}`). This selection MUST NOT depend on the order in which
definitions were created or stored. The ancestor walk still dominates the tiebreak: a definition on a
longer (more deeply nested) path always takes precedence over one on a shorter path, even when the
deeper definition is a wildcard and the shorter one is a literal; specificity orders only the
candidates that match at the same level.

Writing a verb property targets the **specific object** in the request path: `PUT /a/b/c:verb/code`
replaces (or overrides onto `c`) the code of an existing verb, shadowing any inherited definition.
**Creating** a verb requires more than code — its kind, declared call graph, limits, capability
grants, and produced media type ({{deployment}}) — so a server need not let a bare `PUT …:verb/code`
on a not-yet-defined verb create it; it MAY instead require the deployment profile ({{deployment}})
and reject the bare write (`404`), or accept it and default the remaining declarations. A server MUST
document which. `GET /a/b/c:verb/code` returns the *effective* definition (resolving up) and, when
the definition is inherited, SHOULD include a header identifying the defining object.

By convention, an object's *data properties* MAY also be inherited from ancestors; the precise
semantics of data-property inheritance and overriding are implementation-defined in this version.
The OPTIONAL **Declared Data Properties** profile ({{data-properties}}) specifies a declaration for
properties whose value is shared across instances, write-once, or access-controlled.

# Object Binding {#object-binding}

A verb is always *bound to* an object — the object named before the colon in its definition path. How
that binding relates to the **existence** of the object varies by deployment: in a function-as-a-
service style, a verb is a free-standing program and the object is merely an addressing handle; in an
object-oriented style (the MOO lineage, {{terminology}}), the object is a first-class entity that must
exist before a verb can be defined on it, and it *owns* its verbs. Rather than prescribe one, this
document defines a vocabulary of **object-binding modes** and requires a server to advertise the one
it enforces in discovery ({{discovery}}). This is server policy, not a per-verb declaration; a server
MUST NOT advertise a mode it does not enforce.

The modes are:

* **`implicit`** — the object and the verb plane are independent. Deploying a verb neither requires
  nor creates the object it binds to, and an object's stored data is independent of the verbs defined
  on it. Supporting it is the only behavior required of a conformant server, and it is the model
  the rest of this document assumes unless stated otherwise. A server that supports `strict` and has
  any authentication configured ({{authz}}) MUST default to `strict` unless its operator explicitly
  chooses another mode, and SHOULD warn its operator when that choice is `implicit`; a server with no
  authentication configured SHOULD default to `implicit`.
* **`auto-create`** — the object is the entity that owns its verbs. Deploying a verb on an object that
  does not yet exist MUST create that object (an empty, caller-owned record), so it thereafter appears
  in the object data plane and listing.
* **`strict`** — the same coupling as `auto-create`, except that deploying a verb on an object that
  does not yet exist MUST be refused (a `409`), rather than creating it.

The two coupled modes (`auto-create`, `strict`) test existence against the **deepest concrete
ancestor** of the verb's binding path: the longest prefix of literal (non-wildcard) segments. A verb
bound to a concrete object (`a/b:verb`) tests `a/b`; a *bound* entity verb whose path ends in a
wildcard (`counters/{id}:verb`) tests its concrete collection ancestor (`counters`); an **unbound**
verb (`/:verb`) binds to no concrete object and is exempt. A verb whose binding path *begins* with a
wildcard (`{id}:verb`) has no concrete ancestor yet binds to every entity; under a coupled mode a
server MUST refuse it (it owns no object), rather than treat it as exempt. Existence is tested against
the server's object registry, not against per-property read authorization, so a caller's inability to
read an object's data does not make it appear absent.

Under a coupled mode, because the object owns its verbs, a server MUST require that the caller is
authorized to **write** the object before defining, replacing, or removing a verb on an object that
already exists — whether the verb is created by upload or by writing its `code`/`policy` property
({{verb-properties}}). Defining a verb on an object owned by another principal MUST be refused
(`403`), and the existence rule above applies equally to these property writes (a `strict` server MUST
NOT let `PUT …:verb/code` shadow a verb onto a non-existent object). Creating the first verb on a
not-yet-existing object under `auto-create` makes the caller its owner. This keeps every verb on an
object within the authority of that object's owner, so the cascading `DELETE` above can never remove a
verb the caller could not have removed directly.

Object **deletion** is symmetric with the mode. Under a coupled mode, `DELETE` on an object removes
the object together with the verbs bound *exactly* to it (not those merely inherited from an ancestor
or matched through a `{id}` pattern, which belong to other objects) and any object-scoped state those
verbs declared; under `implicit`, `DELETE` removes only the object's stored data and leaves its verbs
in place. The cascade MUST be **fail-closed**: a server MUST refuse the object `DELETE` (rather than
remove anything) unless the caller is authorized to delete *every* verb the cascade would remove — the
same authority a direct `DELETE /obj:verb/code` requires — so the cascade can never remove a verb the
caller could not have removed directly. Removing a verb (`DELETE /obj:verb/code`) never deletes the
object in any mode.

The mode governs **deployment and deletion** only; it does not change **invocation**. A deployed verb
is still invoked on any concrete object the resolution rules ({{resolution}}) match — including an
entity instance that does not yet hold data — and the verb's own writes bring that instance into
existence, exactly as under `implicit`.

# Representations {#representations}

## Native representation

The native representation of object data is a JSON object {{RFC8259}} whose members are the
object's user-defined data; its media type is `application/restact+json` (a server MAY serve it as
`application/json`). In this version a user-data member VALUE is a **UTF-8 string** (matching the
`set`/`set-at` capability encoding, {{capabilities}}); richer JSON value types (numbers, booleans,
nested objects/arrays) are a reserved increment, and a server MAY reject a write whose member value is
not a string with `422 invalid-input` rather than coercing it silently. User data MUST NOT use
`$`-prefixed member names, which are reserved for the server-managed system fields below. A server **MAY** surface these system fields in the
representation (each `$`-prefixed); they are OPTIONAL, so a minimal server MAY return only the
user-data members. The defined system fields are:

| Field | Meaning |
|-------|---------|
| `$name` | the object's full resource name (path) |
| `$uid` | a stable, server-assigned identifier (survives renames) |
| `$create_time`, `$update_time` | RFC 3339 timestamps (output-only) |
| `$links` | a HATEOAS link object (at minimum a `self` link) |
| `$verbs` | a map of the object's *effective* (post-resolution) verb names — those for which the caller has `execute` permission — to the URL of each verb's `meta` (the defining object's, when inherited) |
| `$owner` | the subject recorded as the object's owner (first-writer-owns), backing the `owner` matcher in object and property authorization. Ownership is **fixed** ({{ownership}}): no write changes it. A `PUT` MAY carry `$owner` only to restate the current owner, which only that owner may do and which changes nothing; any other `$owner` member is refused `403` (`forbidden`). Only an operator's recovery act reassigns it ({{admin-reown}}) |
| `$policy` | OPTIONAL object-level authorization policy (feature `object-policy`): `{ read, write, delete }`, each a list of authorization subjects ({{authz}}). It gates the object as a whole — `read` gates retrieval (a denied read behaves as not-found), `write` gates writes to every member (a declared member's `acl` can only narrow it, never widen it, {{data-properties}}), `delete` gates removal. An omitted policy defaults to `read: [public]`, `write: [owner]`, `delete: [owner]`. A server MAY allow the owner to set it (the reference host accepts it as a writable `$`-member on `PUT`); it is not returned in the representation |

A server that implements object-level policy advertises the `object-policy` feature. Because `$policy`
is not part of the representation, a server MAY additionally offer a read-back through a metadata channel
(feature `object-policy-read`): `GET /v1/<obj>?meta=policy` returns the object's effective policy as
`{ owner, read, write, delete }` (subject tokens, {{authz}}), so a manager can inspect it before
replacing it; `?meta=policy&raw=1` returns instead only the dimensions explicitly set (unset stay
empty), distinguishing a default-by-omission from an explicit default. The read is gated on **manage
authority** — the same `write` policy that authorizes
*setting* `$policy` — and an unauthorized caller, like a non-existent object, MUST receive a not-found
response (no existence or authorization oracle), consistent with the object read gate. Note that
`$policy` and `$owner`, even on a server that surfaces other system fields, are NOT returned in the
representation (they are authorization metadata, read back only through the gated channel above).
Servers MAY additionally convey links via the HTTP `Link` header field {{RFC8288}}. Concurrency metadata (e.g.
`ETag`) is carried in HTTP headers rather than the body (see {{consistency-txn}}).

### Prefix-inherited object policy {#object-policy-inheritance}

A server MAY additionally support **prefix inheritance** of object policy, advertised as the
`object-policy-inheritance` feature. When supported, `$policy` accepts an OPTIONAL boolean member
`inherit`; a policy with `inherit: true` is a **governing anchor**. The effective policy for an
object is resolved as: (1) if the object stores its own `$policy` (including an empty `{}`), that
policy governs, with `owner`/`prop:` matchers resolving against the object's own `$owner`/members;
(2) otherwise, the nearest strict ancestor (by path hierarchy, nearest first) whose stored `$policy`
is a governing anchor supplies the WHOLE effective policy, with its `owner`/`prop:` matchers
resolving against the ANCHOR's `$owner`/members — an unmarked ancestor policy governs only its own
object and is skipped in this walk; (3) otherwise the omitted-policy defaults apply. A server that
does not advertise the feature MUST ignore the `inherit` member (governance stays per-object) and
round-trips it as an unknown member.

Under a governing anchor the effective policy governs descendants **absolutely**: a descendant's own
`$owner` receives no exemption (so revoking a subject at the anchor revokes it everywhere beneath).
Two rules protect the tree: **creation** — a first write that would create a new object under a
governing anchor MUST be admitted by the anchor's `write` policy before first-writer-owns assigns
`$owner` (a denied create behaves as not-found when the creator also cannot read the location, else
as forbidden); and **descendant-policy management** — writing a descendant's own `$policy` (including
the `{}` opt-out) under a governing anchor is a **manage** act that MUST require the anchor's owner,
not mere `write` access. An object's own declared-member ACLs, and the rule that ownership is fixed
({{ownership}}), are unchanged by inheritance. When the feature is enabled, `?meta=policy` gains an additive
`source` member — `"self"`, `"default"`, or the governing anchor's path — reporting where the
effective policy came from; the `raw=1` view is unchanged (the object's own stored record, including
an `inherit` marker if present).

**Governed creation (OPTIONAL, feature `governed-creation`).** The creation rule above governs only
paths a governing anchor reaches; where none does, first-writer-owns applies and the omitted-policy
defaults ({{authz}}) make the new object world-readable and owned by whoever wrote first. On a
multi-principal deployment that is a squatting surface at every never-yet-written path. A server MAY
therefore support a stricter regime, advertised as the `governed-creation` feature and available
only on a server that also supports prefix inheritance. Under it, a write that would create an
object is admitted only if **either** a governing anchor reaches the path (in which case the rule
above applies unchanged) **or** that same write itself carries an explicit `$policy` for the object
being created — the object self-governs from birth. A creating write satisfying neither MUST be
refused with `403`, and MUST NOT be refused with `404`: there is no anchor whose read-denial a
not-found could mirror, and a server without the feature already discloses strictly more through the
same probe. An explicit `$policy` satisfies the rule whether or not it is a governing anchor
(`inherit: true`); requiring the marked form would make every seeded intermediate parent an anchor
and thereby block the very descendant creations it was seeded to permit.

This is a **client-observable change to the calling convention**, which is why it takes a feature
token rather than being a silent operator setting: a client that creates an object and then writes
its `$policy` as a second request MUST merge them into a single creating write when the token is
advertised. The feature governs creation only — it applies no retroactive requirement to objects
that already exist, and does not change reads, deletes, ownership ({{ownership}}), or policy management.

## Optional JSON:API representation

A server MAY offer the JSON:API media type {{JSONAPI}} (`application/vnd.api+json`) as a
content-negotiated alternative representation, in which child and verb paths are expressed as
`relationships` links. When serving JSON:API, a server MUST NOT use JSON:API's colon-prefixed
extension-member mechanism, as `:` is reserved by this protocol as the verb separator.

## Verb code: source and executable {#languages}

A verb has a **source representation** (in some programming language) and an **executable
representation** (a WebAssembly component {{WASI}}). On `PUT …:verb/code`, the `Content-Type`
declares the source language:

* `application/wasm` — a WebAssembly component, executed directly.
* `text/javascript` and other source media types — the server, if it supports the language, either
  compiles or transpiles the source to a WebAssembly component at upload time and stores both
  representations, **or** stores only the source and executes it through a server-provided runtime
  component (an interpreter) at invocation time. Either way the executable that runs is a
  WebAssembly component subject to the same capability confinement and limits, and the source
  representation is retained for `GET …:verb/code`.

If the server does not support the supplied language it MUST return `415`. On `GET …:verb/code`,
the server selects the representation by `Accept` (for a source-only language, the source
representation is the one available).

For a **source-only (interpreted) language**, the component that actually runs is the server's shared
runtime, whose imports are the union of capabilities any script might use — so a script's capability
grant is NOT statically inspectable from that component as it is for a hand-written `application/wasm`
verb. The per-verb capability manifest is instead the **server's record** of what THIS script is
granted, and the server MUST enforce that grant at the host boundary (denying a capability the verb's
record withholds, exactly as if the runner had not imported it). A deployer therefore relies on the
server, not on component introspection, for the confinement of an interpreted verb. A server MUST be able to produce and execute the WebAssembly
representation; support for any non-`application/wasm` source language is OPTIONAL and advertised via
discovery ({{discovery}}).

## Verb declaration (deployment profile) {#deployment}

Beyond the code itself, deploying a verb declares: its **kind** (function/action, {{taxonomy}}); its
**call graph** (the verbs it may compose, with each edge's kind, {{composition}}); its per-invocation
**limits** ({{limits}}); which gated **capabilities** ({{capabilities}}) it is granted (deny-by-default
— a grant may only WITHHOLD a declared import, never add one); and the **produced media type** of its
invocation response. A server MUST provide an interface to set these at deployment and MUST reflect
them faithfully in discovery ({{discovery}}); a deployer and a second implementation MUST be able to
declare them identically. These declarations are part of a verb's authoritative `meta`
({{verb-properties}}). The reference deployment profile (`POST /v1/modules`) carries them as query
parameters on the upload — `verb` (the route id), `kind`, `calls`, the limits `fuel`/`mem_mb`/`wall_ms`,
the per-capability grant flags (`compose`/`object`/`event`, each set to `deny` to WITHHOLD an otherwise
granted import), `exec` (the `execute`-action shorthand, below), `produces`, and the source `lang` —
alongside the code body; a server MAY offer an
equivalent manifest form, but MUST document a profile through which every declaration above is
expressible, so a verb's deployment is portable rather than reference-only.

**Discovering the reference profile (OPTIONAL).** A server MAY advertise the
`verb-reference-deployment` feature token ({{discovery}}). A server that advertises it MUST accept
verb creation and replacement through the reference profile above (`POST /v1/modules` with those
query parameters and the code as the body). The token states only that the endpoint exists with
this profile: it authorizes nobody, and every deployment through it remains subject to
authentication, authorization ({{authz}}) and any object-binding gate ({{object-binding}}). Its
absence does not mean the profile is absent (servers that predate the token offer it unadvertised),
so a client that does not see the token MAY still attempt the reference profile; if the server
refuses it as unsupported (for example `404`, `405` or `501`), the client MUST surface that
refusal to its user plainly, as this server not accepting deployment through the reference profile,
and MUST NOT treat it as a transient failure to retry.

**Description (OPTIONAL).** A deployment MAY also declare a **description**: prose, for people and
for models, stating what the verb does and what input it expects. It is documentation, not a
declaration of behavior: it has no effect on invocation, authorization, or any other property, and a
server does not interpret it. A server that accepts one MUST reflect it verbatim in the verb's
discovery entry and `meta` ({{discovery}}, {{verb-properties}}), MAY bound its length, and MUST
refuse a description over that bound rather than truncate it. A replacement of the verb's code alone
(`PUT …:verb/code`, or a rollback, {{verb-history}}) preserves the description; a deployment through a
profile that declares the verb's properties re-declares it. The reference profile carries it as the
`description` query parameter of `POST /v1/modules`. A description is disclosed wherever discovery
is, including to unauthenticated callers, and it is authored by whoever deployed the verb: a client
that presents it to a model SHOULD attribute it to the verb's deployer and treat it as untrusted
input, like any other deployer-authored data.

**Born policy.** A verb created through a deployment profile is born with a policy ({{authz}})
whose owner is the deployer. On a server that does not advertise the `verb-private-default`
feature token ({{discovery}}), the born policy is the fixed default the simple profile states
(`read: public`, `execute: public`, `write: owner`, {{simple-profile}}). On a server that
advertises it, the born policy admits only the `owner` matcher for every action (`read`,
`execute`, `write`), and the owner widens it through `PUT …:verb/policy`. A client can tell the two
apart only through the token. The reference profile's `exec` parameter is a shorthand for the `execute`
action alone. On a server that advertises `verb-private-default`, `exec` MUST accept exactly `public` or `owner`, MUST refuse any other
value, including an empty one, with `400` (`invalid-input`), and sets `execute` to that single
matcher without touching any other action. The born policy governs who may invoke the verb and
read its properties ({{verb-properties}}); it does not by itself withdraw the verb from discovery.

**Replacement.** A route on which a verb is already defined (on the same path pattern)
identifies an existing resource: registering a verb at it through any deployment interface
**replaces** that verb, and a server MUST authorize the replacement against the existing
verb's `write` action exactly as for `PUT …:verb/code` ({{verb-properties}}) — they are one
operation through two interfaces. A replacement MUST NOT change the verb's owner, and MUST NOT
change its policy unless the deployer is separately authorized for the `manage` action; a
deployment interface that cannot express that distinction MUST leave the existing policy
intact when the deployer is not so authorized. On a server advertising `verb-private-default`,
a replacement through the reference profile by a deployer who IS so authorized also leaves the
existing policy intact, except that an `exec` parameter, when present, replaces the policy's
`execute` action and nothing else; the replacement's other declarations are re-declared as
usual, and a replacement by a deployer not authorized for `manage` MUST refuse `exec` (`400`,
`invalid-input`). The code-replacement paths (`PUT …:verb/code`, rollback, and re-registration)
then agree, and re-declaring a verb's options never opens a window in which the verb runs under
a default policy. Replacing the code of a verb deployed
runs-as-owner — or setting `runs_as=owner` on a replacement — is making the owner's opt-in
({{exec-identity}}) and MUST be performed by the owner. Likewise, replacing the code of a
lifecycle hook ({{events}}), which runs under its owner's authority, MUST be performed by the
owner, through every interface (`PUT …:verb/code`, rollback, and re-registration): an
authenticated non-owner receives `403`, whatever `$policy` grants (an unauthenticated caller
receives `401`, and a non-owner re-registration carrying `exec` is refused `400` first, as
above). This rule applies to every server advertising `lifecycle-hooks` and is not gated on
any delegation token. A replacement by the owner through any of those interfaces also resumes a
hook that an operator's ownership recovery paused ({{admin-reown}}).
Registering at a route with no
existing definition on that exact path pattern creates the verb; the deployer becomes its
owner ({{authz}}). A deployer that must not replace an existing verb can make the
registration create-only ({{verb-conditional}}).

## Deployment history and rollback (OPTIONAL, feature `verb-history`) {#verb-history}

Because every code replacement ({{verb-properties}}) simply overwrites a verb's registration, an
implementation that retains no further record makes a bad redeploy unrecoverable in place and
attributes no deployer identity distinct from the (possibly unchanged) owner. A server MAY support
this OPTIONAL profile, advertised via the `verb-history` feature token ({{discovery}}), to make
deployment reversible without a client round-trip of code bytes.

**History.** A server supporting this profile MUST maintain, per verb registration, a bounded,
newest-first history of the deployments a code replacement has SUPERSEDED, and MUST expose it via
`GET …:verb/history`. Each entry MUST identify the superseded version's full **hash triple** — the
executable's content address, and, for a source-language verb ({{languages}}), the source's content
address together with its media type — and SHOULD additionally record the deployer's identity, when
the code landed, and when it was superseded. A history entry made under delegation ({{delegated-tokens}}) SHOULD
record the delegation actor beside the deployer, and MUST NOT carry the grant id. A history entry MUST NOT be pushed when a property
write does not change the effective hash triple (for example, a policy-only replacement of
`policy`): pushing on every unrelated write would make the history record cost unbounded in the
number of touches rather than the number of code changes. The response MUST NOT include the code's
bytes; access is governed by the verb's `write` action ({{authz}}), since a principal entitled to
replace the code is already entitled to see its lineage, while a principal that may merely `execute`
the verb MUST NOT. A server MAY bound the retained history to a fixed depth per registration,
discarding the oldest entries first, and MUST document that bound.

**Rollback.** A server supporting this profile SHOULD expose `POST …:verb/rollback` to rebind a
verb's code to a version named in its own history. The request body MUST supply an **expected echo**
of the target entry's full hash triple; the server MUST refuse the request (`409`) if no entry in
the CURRENT history matches the echo exactly — a stale echo (superseded again since the client last
read `history`, or naming an entry evicted by the retention bound) MUST be refused rather than
silently applied to a different version, so a concurrent redeploy cannot be raced into a rollback the
client did not intend. A rollback of a **wasm** verb rebinds `code` to the named executable
directly. A rollback of a **source-language** verb MUST re-run source deployment ({{languages}})
against the server's CURRENT runtime registered for the entry's source media type, using the
entry's stored source — it MUST NOT reinstate whatever runtime component was current when that
source was originally deployed, since a source-language verb's semantic identity is its source, and
the runtime is host-provided infrastructure a server may have since upgraded. If either the target
executable or source cannot be retrieved, the server MUST fail the request rather than silently no-op.
Because a rollback IS a code replacement, it is authorized identically to `PUT …:verb/code`
({{verb-properties}}) — including the runs-as-owner and, where supported, invoker-grant
({{caller-identity}}) restriction to the owner, and the lifecycle-hook restriction to the
owner ({{events}}) — except that, under a coupled object-binding mode
({{object-binding}}), a server MUST exempt rollback from that mode's ancestor-ownership
requirement, since a rollback can only rebind code to a hash triple already recorded in the
route's own history, named by an exact expected echo, and therefore never introduces code the
caller was not already authorized to install. It MUST itself push the ROLLED-BACK-FROM
version into history, so that rolling forward again is simply another rollback. A rollback MUST NOT
change the verb's owner or policy, and MUST NOT accept parameters that would.

## Conditional verb management (OPTIONAL, feature `verb-conditional-requests`) {#verb-conditional}

A server MAY support conditional requests on the verb-property plane ({{verb-properties}}) and its
deployment profile ({{deployment}}), advertised via the `verb-conditional-requests` feature token
({{discovery}}). It lets a client change a verb without silently overwriting a concurrent change,
and create a verb without silently replacing one a concurrent deployer created. Without the token,
a server MAY ignore these preconditions, and a client therefore cannot rely on them. (Informative:
the reference host honours `If-Match` on `PUT …:verb/code` whether or not it advertises the token.)

**Per-property validators.** A server supporting this profile MUST give each mutable verb property
its own strong entity tag ({{RFC9110}}, Section 8.8.3): `code`, whose tag is the one `GET …:verb/code` returns for
the verb's source representation (or its executable, for a verb with no source representation,
{{languages}}); `policy`; and, where the server exposes it, `props` ({{data-properties}}). A `GET` of
each MUST carry its tag in `ETag`, and a successful `PUT` of it, or a rollback ({{verb-history}})
for `code`, MUST return the property's new tag. A property's tag MUST change whenever that
property's value changes and MUST NOT change when only a different property changes, so a policy
change never invalidates a precondition on the code, nor the reverse. A server MAY return the same
tag for an identical value.

**Preconditions on writes.** A server supporting this profile MUST honour `If-Match` on
`DELETE …:verb/code`, on `POST …:verb/rollback`, on `PUT …:verb/policy` and on `PUT …:verb/props`,
as well as on `PUT …:verb/code`. A rollback's precondition is compared against the CURRENT `code`
tag, the version the rollback would supersede; it is independent of the request's expected echo,
which names the target. The comparison is strong, and `*` matches any existing verb. On a mismatch
the server MUST respond `412` (`precondition-failed`, {{errors}}) and change nothing. Each
precondition is compared against the property as a `GET` at the request's own path would serve it
({{resolution}}).

**Create-only deployment.** A server supporting this profile MUST honour `If-None-Match: *` on its
deployment profile (`POST /v1/modules` in the reference profile). If the request would otherwise be
a replacement ({{deployment}}), because a definition exists on the same path pattern and verb name,
the server MUST respond `412` and change nothing, unless the deployer could not have replaced the
existing verb, in which case that refusal (`401`/`403`) comes first (Evaluation, below). Path
patterns are compared as for replacement ({{deployment}}); a server that accepts other spellings of
a pattern MUST canonicalize them identically for both comparisons. The existence check and the creation MUST be one atomic step: of
concurrent create-only requests for the same pattern and verb name, at most one succeeds, and every
other receives `412`. `If-None-Match: *` is the only precondition the deployment profile accepts
under this profile; a server MUST refuse any other `If-None-Match` value, and any `If-Match`, with
`400` (`invalid-input`) rather than ignore it. This deliberately fails loud where an unsupported
precondition is commonly ignored: a client that expected a conditional replacement must not
silently replace. A conditional replacement uses `If-Match` on `PUT …:verb/code`.

**Evaluation.** Authentication, authorization ({{authz}}) and any object-binding refusal
({{object-binding}}) MUST be decided before these preconditions are evaluated, so a caller without
authority for the write receives that refusal and learns nothing from the tag comparison. Other
failures are ordered as {{RFC9110}}, Section 13.2.1 allows: a server MAY answer `412` before it
validates the request content, for example for a stale `If-Match` on a `PUT …:verb/code` whose body
is also invalid, or a create-only deployment whose module it has not yet compiled. Apart from create-only, a precondition here carries
at least the best-effort semantics of the `conditional` level ({{consistency-txn}}). A server SHOULD
evaluate it in the same serialized step as the write, so that at most one of two concurrent
conditional writers to the same property succeeds.

# Capability Model {#capabilities}

A verb executes as a WebAssembly component {{WASI}} whose interface declares exactly the host
interfaces it imports. A verb has **no ambient authority**: any host interface it does not import
is unreachable. Host capabilities are organized as **layered interfaces** that an implementation
grants per policy:

* a minimal interface (e.g. structured logging, and a read-only view of the caller's identity —
  {{caller-identity}}) suitable for most verbs;
* a "world" interface providing object-graph access (reading and writing the bound object's data,
  traversing ancestors, listing children, and invoking other verbs) for environment-grade use;
* domain-specific interfaces (e.g. scoped key-value storage, allow-listed outbound HTTP).

On upload, a server MUST reject a component that imports an interface the server does not permit
(for example, raw network or filesystem access), returning `403`. The set of permitted interfaces
and the policy for granting them are implementation-defined; this document defines only the
declaration-and-granting mechanism and reserves a registry for standard capability interfaces
({{iana}}).

### The guest contract (WIT) {#wit-contract}

The standard host interfaces are defined as a WebAssembly Interface Types (WIT) package,
`rest-act:plugin`, normatively given in {{appendix-wit}}. A verb's imported interfaces ARE its
capability manifest, statically inspectable from the component without running it. The package
**evolves additively**: a new capability is a NEW interface (and a NEW WIT *world* composing it) added
to the package WITHOUT removing or changing any existing interface, so a component built against an
earlier interface set keeps linking. An existing interface MAY equally gain a NEW method under the
same rule and for the same reason — nothing existing is removed or altered, so every already-compiled
component still links — provided the new method is bound to its own feature token: a component that
imports it cannot link on a server that lacks it, so an author must be able to gate *deployment*, not
merely use, on the method's presence. Whether an ability arrives as a new interface or as a new
method on an existing one is a question of where it belongs, not of what the additivity rule permits.
Each interface, and each separately tokened method, is bound to a **feature token** ({{iana}}); a
server advertises the interfaces it grants in discovery ({{discovery}}), so a client can determine
**before upload** whether a component's imported interfaces are all supported (an unsupported import
is rejected with `403` at upload, never a silent link failure). A server MUST NOT make a
breaking change under the same package version; a breaking change requires a new package version and
a new feature token.

## Object Data Access {#object-data}

The "world" tier above is an OPTIONAL feature (token `object-data-access`). Its first increment lets
a verb read and write the **declared data properties** ({{data-properties}}) of the object it is
bound to, through a gated `object` capability interface the verb imports:

* `path() -> option<string>` returns the path of the bound object itself (OPTIONAL feature, token
  `object-self-path`). The value MUST be the **concrete** object the verb was invoked on, never the
  route pattern the verb was deployed at: a verb deployed at `ws/{id}/pages/{id}:render` and invoked
  on `ws/w1/pages/p3` MUST read `ws/w1/pages/p3`. It MUST be none when, and only when, there is no
  bound object — an `unbound` verb ({{resolution}}), or a verb the server has not granted the `object`
  capability. It is a property of the INVOCATION: a server MUST NOT vary it with the runs-as-caller
  principal (so a verb executing under runs-as-owner reads the object it was addressed at, not its
  owner's), and under composition each frame MUST observe its OWN bound object rather than its
  caller's. Where a server dispatches an invocation the caller did not name — a representation
  accessor ({{active-properties}}) or a lifecycle hook ({{events}}) — the value is the concrete
  object dispatched for, respectively the requested object and the mutated one. It is a pure read
  disclosing only what the caller supplied in the request URL, so it grants no authority and a
  `function` verb MAY call it.
* `get(name) -> option<string>` reads a property of the bound object. A property the caller is not
  permitted to read (per its ACL, {{data-properties}}) is indistinguishable from an absent one
  (both return none).
* `set(name, value) -> result<_, error>` writes a property of the bound object. A write the caller
  is not permitted to make returns `forbidden`; a write to an already-set write-once (`final`)
  property returns `property-final`.
* `get-at(path, name) -> option<string>` reads a property of another object (an ancestor on the
  inheritance chain, or any other path), gated by that object's `read` policy and the property's read ACL — both must allow. As with
  `get`, a read-denied property is indistinguishable from an absent one.
* `set-at(path, name, value) -> result<_, error>` writes a property of another object by path. The
  write is permitted only where the **runs-as-caller** principal could have written it directly (the
  cross-object write-policy intersection), so a verb is never a confused deputy; the same
  `forbidden`/`property-final` rules as `set` apply, and the reserved (`@`/`$`) namespaces and
  `shared`-scoped properties are refused.
* `shape() -> object-shape` and `shape-at(path) -> object-shape` enumerate an object's shape — the
  `properties` it exposes (readable property names), its direct `children` (readable child object
  paths), and the `verbs` invokable on it — each ACL-filtered against the runs-as-caller principal
  (verb names follow the public discovery document). `shape` reflects committed state.
* `query(prefix, order-by, descending, predicate, limit, cursor) -> query-page` reads a PAGE of the
  objects under a path prefix — each row carrying the object's path and its caller-**readable**
  property map — in ONE call, rather than one `get-at` per property per object (OPTIONAL feature,
  token `verb-object-query`). Ordering is lexicographic over the named property's string value
  (`order-by` absent = path order); `predicate` is a single `key == value` equality applied to the
  **readable** value, so a property the caller may not read never matches and the filter is no
  information-leak oracle; `cursor` is an opaque keyset continuation the caller threads back
  unmodified. A server MUST bound the page: it MUST clamp `limit` to a server-chosen maximum and
  MUST NOT interpret any `limit` as unbounded, so a guest cannot force an unbounded result set into
  its runtime. A page MAY be shorter than `limit` while further rows remain, so a caller MUST drive
  pagination off the returned cursor rather than off a short page. Every row is filtered by exactly
  the gate `get-at` applies — the query is an access *accelerator*, never a widening of authority —
  and it is a pure read, so a `function` verb MAY call it.

Access is evaluated against the **runs-as-caller** principal ({{authz}}): a verb can read or write a
property only where the caller could on the data plane — where the object's own policy allows it **and** the property's ACL allows it. The capability is gated
exactly like composition — a server MUST link it only for components that import it, and a server
that does not support the feature MUST refuse to deploy such a component (`501`). Property storage
semantics (scope `instance`/`shared`, `final`, ACL) are those of {{data-properties}}; the value
encoding in this increment is a UTF-8 string.

Whether mutations are durable, and their consistency across a composition tree, follow the server's
advertised consistency level ({{consistency-txn}}); a server advertising only `conditional` MAY treat a
verb's writes as last-writer-wins per property rather than as one atomic invocation. A `set-at` write
to a foreign object commits at the call rather than as part of the verb's bound-object transaction —
so on a server advertising only `conditional`, a foreign `set-at` is NOT rolled back if the invoking
verb later traps; only the verb's OWN bound-object writes (buffered and committed on success) are
atomic with the invocation. An action's `If-Match` precondition therefore applies to the bound object
only and does not extend to foreign objects a `set-at` touches. A server providing a transactional
consistency level MAY make the whole tree atomic. Binary (non-UTF-8) property values are a reserved
increment of the same interface.

## Caller Identity {#caller-identity}

A server MAY expose a read-only view of the **runs-as-caller** principal ({{exec-identity}}) to a
verb, through an `identity` capability interface the verb imports (OPTIONAL feature, token
`caller-identity`):

* `subject() -> option<string>` — the authenticated subject, or none when the caller is anonymous.
* `is-anonymous() -> bool` — true when there is no authenticated subject.
* `roles() -> list<string>` and `scopes() -> list<string>` — the caller's roles and scopes (the same
  sets the authorization subject matchers consult, {{authz}}); empty when none.
* `claim(name) -> option<string>` — a single scalar token claim by name, or none if absent.

Unlike composition and object-data access, this capability is **ambient**: it conveys no authority
beyond what the caller already holds (the verb executes *as* this caller), so a server SHOULD link it
without a separate grant or attenuation, and the value flows unchanged to composed sub-invocations.
A server MAY additionally expose, through this interface, the **frame originator** of an
authority-switched invocation ({{exec-identity}}), as an OPTIONAL feature (token
`identity-invoker`). This exposure is NOT ambient: it MUST be granted at deploy time on the
reading verb, MUST be advertised in that verb's descriptor so callers can inspect it before
invoking, and MUST return none where it has not been granted.

A server MAY additionally expose, through this interface, the **delegation actor** of the
invocation ({{delegated-tokens}}), as an OPTIONAL feature (token `identity-actor`). This value
is ambient. It is returned in every frame whose work runs under a delegation's bounds,
authority-switched frames and hooks included, and in every frame of code installed under a
delegation, whoever triggered it, and none otherwise. It discloses the actor's identifier
only — never the delegating subject, nor any role, scope, group, or claim — and it reaches
another owner's authority-switched frames and hooks when delegated work reaches them. Apart from
this value and the explicitly granted frame originator, a server MUST NOT expose through this
interface any identity other than the request's runs-as-caller principal. A verb still imports the interface to use it, so it remains visible in the verb's
capability manifest.

# Resource Limits {#limits}

A server MUST enforce, per invocation, at minimum: a wall-clock time limit, a CPU/compute limit,
and a memory limit; and MUST terminate a verb that exceeds any of them. Servers SHOULD enforce
independent wall-clock and compute limits, because a compute (instruction) limit does not bound a
verb that stalls without consuming compute, and a wall-clock limit alone is non-deterministic. A
verb terminated for exceeding a time limit results in `408`; for memory, `507`; for compute
budget, `429`. Servers SHOULD advertise applicable limits in verb metadata and MAY apply per-tenant
quotas; see {{security}} for denial-of-wallet considerations.

# Composition {#composition}

A verb MAY invoke another verb (by path, resolved per {{resolution}}) through a host interface. A
server that permits composition MUST enforce all of the following:

1. **Declared call graph.** A verb MUST declare the set of verbs it may call; an attempt to call an
   undeclared verb MUST be refused before execution. The declared graph MUST be inspectable
   statically (via verb metadata). A server MAY additionally support the OPTIONAL pattern form
   `*:<verbName>` in the declared set (advertised as the `compose-patterns` feature): a dynamic
   edge admitting a call to ANY object's verb of exactly that name — the verb name is fixed, only
   the object path is dynamic, and deny-by-default is preserved (the pattern is itself an explicit
   declaration). Because a dynamic edge cannot be statically checked against rule 5's
   function-purity constraint, a server supporting patterns MUST reject (`400
   invalid-call-graph`) a *function* that declares one; the runtime function→action refusal
   remains the backstop.
2. **Attenuation.** A called verb MUST execute with authority no greater than the caller's
   (consistent with {{exec-identity}}); composition MUST NOT escalate authority. The one exception
   is the gated authority switch {{exec-identity}} itself sanctions: a called verb that carries the
   OPTIONAL `runs_as=owner` opt-in executes with its owner's attenuated authority, which may exceed
   the caller's. That is not an escape from this rule but the same deliberate, deploy-time,
   descriptor-advertised setuid grant, subject in a composed frame to every constraint
   {{exec-identity}} places on it directly — the owner made the opt-in, the callee's execute policy
   is still evaluated against the real caller, and cost still lands on the real caller. Absent such
   an opt-in on the callee itself, this rule is unconditional; a caller can never confer authority
   it does not hold.
3. **Shared budget.** All invocations in a single request tree MUST draw from one shared resource
   budget; a sub-invocation MUST NOT receive a fresh budget. This is the primary defense against
   amplification and denial-of-wallet via deep or wide call trees.
4. **Bounds.** A server MUST bound call-tree depth and per-invocation fan-out, and MUST detect
   cycles. Exceeding depth or detecting a cycle results in `508`.
5. **Side effects.** Every invoked verb MUST appear in the caller's declared call graph (rule 1); a
   call to an action MUST additionally be declared as an action call (distinguishable from a
   function call). A function MUST NOT invoke an action. A server MUST enforce this: at runtime it
   refuses any attempt by a function to compose an action with status `403` and `restact_code`
   `forbidden-side-effect`; and it SHOULD reject at deploy, with status `400` and `restact_code`
   `invalid-call-graph`, a function whose declared call graph names a verb currently deployed as an
   action — so the call graph a function advertises in discovery stays function-only. Subject to
   these rules, an action MAY compose actions — for example, a `set` accessor composing child `set`
   accessors.

Composition MAY cross servers: invoking a verb on a remote REST:ACT server is itself a REST:ACT
request, and the same rules apply at each server boundary. A cross-server hop starts a fresh budget
and call stack on the remote server, so the intra-server cycle and depth bounds (rules 4–5) do NOT
see a cycle that crosses servers (A→B→A) and the shared compute budget does NOT propagate across the
hop. A server SHOULD therefore propagate a bounded **hop count** (decremented at each boundary,
refusing at zero) to cap distributed depth, and MAY propagate a budget hint; absent that, the remote
request's own request timeout ({{limits}}) and the caller's per-tenant quota are the backstops against
distributed amplification. A full distributed loop-prevention and budget-propagation mechanism is
left to a future revision.

# Active Properties (Accessor Verbs) {#active-properties}

Retrieving or mutating an object's representation MAY be mediated by code rather than served from
storage, using ordinary verbs under a naming convention. This feature is entirely OPTIONAL: a
server that does not implement it serves stored representations.

The verb names `get`, `list`, `create`, `update`, `set`, and `delete` are RESERVED as
representation accessors. These are the standard data-method names that {{AIP136}} already forbids
as custom-method names, so they do not collide with application verbs. An accessor verb produces
(for reads) or accepts (for writes) the representation of the object or property it is bound to,
and MAY compose child accessors. For example, `GET /pet/dog:get` invokes the `get` accessor, which
MAY itself invoke `/pet/dog/tail:get`, `/pet/dog/legs:get`, and so on, assembling the result. This
is ordinary composition ({{composition}}); the shared budget, cycle detection, depth and fan-out
bounds, and authority attenuation all apply unchanged.

A `get` or `list` accessor is a function (no observable side effects), so it is safe and cacheable
per {{taxonomy}}; `set`, `update`, `create`, and `delete` accessors are side-effecting (actions). A
server MUST reject an accessor deployed with a kind inconsistent with this (a non-function `get`/`list`
or a non-action `create`/`update`/`set`/`delete`). When a server dispatches a bare-object data-method
request to an accessor, it maps the HTTP method to the accessor as follows, trying each candidate in
order and dispatching to the first one defined:

| Method | Accessor (preference order) |
|--------|----------|
| `GET`  | `get` (own representation), else `list` (collection enumeration) — both functions |
| `PUT`  | `update` (full replace, action) |
| `PATCH` | `set` (partial/property write), else `update` — both actions |
| `POST` | `create` (action) |
| `DELETE` | `delete` (action) |

A server that dispatches the `set` (`PATCH`) and `list` (`GET`-collection) accessors in addition to
`get`/`update`/`create`/`delete` advertises the `set-list-accessors` feature; the `get`→`list` and
`set`→`update` fall-throughs make the extension backward-compatible (an object defining only the latter
four behaves unchanged). The accessor's result and errors propagate to the outer response. Because the dispatched verb is
invoked through the ordinary invocation path, its own `execute` policy governs the request — so an
accessor's policy is the object-level authorization for that operation, layered above the baseline
object policy ({{representations}}) that applies when no accessor is defined. Accessor verbs resolve
up the inheritance chain ({{resolution}}), so a base type MAY define default accessors that a subtype
overrides and MAY invoke explicitly (a "super" call). A server MAY use a `read_mask` ({{collections}})
to limit which child accessors a `get` composes.

Whether a request to an object's data path (for example, `GET /pet/dog`) is served from storage or
dispatched to a defined accessor verb is a server-selected behavior: a server MAY dispatch by default,
MAY serve stored representations by default, or MAY make it configurable, and a server that dispatches
MUST advertise it in discovery ({{discovery}}, the `bare-path-accessor-dispatch` feature and the
`accessorDispatch` flag). When dispatch is enabled but no accessor is defined for the request, the
server serves the stored representation unchanged. Whether an accessor wraps underlying storage or
computes a purely virtual representation is determined solely by the capabilities granted to the verb
({{capabilities}}); this document defines no separate mechanism for it.

# Declared Data Properties {#data-properties}

This OPTIONAL feature (token `data-properties`) lets an object **declare** named data properties with
storage and access semantics, so that shared or sensitive state is defined deliberately rather than
emerging by accident. A server that does not implement it treats all object state as undeclared (see
below). A server that does SHOULD advertise `data-properties` in discovery, and MAY advertise each
object's declarations.

A **declaration** has a `name` (a data-property name; user data MUST NOT use a `$`-prefixed name,
which is reserved for system fields), an optional advisory `type`, an optional `default` value, and
the following modifiers:

- **`scope`** — `instance` (default) or `shared`. An `instance` property's value is stored on the
  concrete object the verb is invoked on, so sibling instances under one bound-verb definition (for
  example `counters/{id}`) have independent values. A `shared` property's value is stored on the
  object the property is **declared on** (the definition object — the resolution ancestor reached by
  the inheritance walk, {{resolution}}), so every instance observes and updates one common value. A
  global counter is a `shared` property; the absence of a declaration MUST NOT be treated as shared.

- **`final`** — when true, the property is write-once: a write to a value that is already set MUST
  fail with `property-final` (409) and MUST NOT mutate state.

- **`inherit`** — when true (default false), value inheritance is enabled: reading a concrete object
  that has no locally-stored value for the property returns the value stored on the **nearest
  ancestor** object on the inheritance chain ({{resolution}}), and if no ancestor holds one, the
  declared `default`. When false the property never inherits a value (an absent value reads as absent),
  preserving plain stored-representation behavior. `inherit` applies only to `instance` scope — a
  `shared` property already resolves to a single value — and a server SHOULD reject `inherit` on a
  `shared` declaration. Inheritance MUST be applied identically whether the property is read through
  the object data plane or through a verb's object-data capability ({{capabilities}}), and is gated by
  the property's read `acl` exactly as a local read is, so it never reveals more than a direct read.

- **`acl`** — an optional `{ read, write }` pair, each a list of authorization subjects ({{authz}}:
  `public`, `owner`, `sub:`, `role:`, `group:`, `scope:`, `claim:`). A read or write is permitted only if the
  caller (the runs-as-caller principal, {{authz}}) matches a listed subject; an omitted list defaults
  to `read: [public]`, `write: [owner]`. The property ACL is evaluated **in addition to** the object's own policy
  (`$policy`, {{representations}}, or the policy it inherits from a governing anchor) and, for an
  access made through a verb, the verb's own `execute` policy. It can only further restrict, never widen:
  a read needs both the object's `read` and the property's `read`; a write needs both the object's
  `write` and the property's `write` (a write that creates the object, or the first write to an
  existing object with no recorded owner, passes the object-level gate exactly as it would for an
  undeclared member); and a server MUST NOT let a property ACL admit a principal the object's policy
  refuses. A `shared` property is state of its declaration, not of an object: its writes are gated by
  its ACL and `final`; a read of it through an object path additionally needs that object's `read`. A denied read behaves as if the property is
  absent; a denied write MUST fail with `forbidden` (403) and MUST NOT mutate state. This version
  defines exactly the two property actions `read` and `write`; finer per-property actions (e.g. a
  separate `manage`, or distinct code-vs-value actions) are a reserved increment, and a server MUST
  reject an `acl` naming an unknown action with `400 invalid-input` rather than silently ignoring it.

An **undeclared** property is equivalent to `{ scope: instance, final: false, acl: { read:
[public], write: [public] } }` — i.e. governed by the object's own policy alone, the pre-existing behavior — so adding
this feature is backward-compatible. A write refused under `final` or `acl` MUST abort the
invocation, discarding any other state changes it made (an `atomic-invocation` server, {{consistency-txn}},
already guarantees this). Concurrent writers of a `shared` property MUST NOT lose updates; a server
MAY serialize them or use the optimistic-concurrency / transactional mechanisms of
{{consistency-txn}}.

How declarations are submitted is server-defined. The reference host accepts them through a `props`
verb property ({{verb-properties}}); a server MAY instead derive them from the object's schema.

# Authorization and Identity {#authz}

## Authentication

A client authenticates with an OAuth 2.0 {{RFC6749}} bearer token {{RFC6750}}, typically an OIDC
{{OIDC}} ID token or access token carrying a subject and OPTIONAL scopes and claims (a JWT
{{RFC7519}}). Requests without acceptable credentials for a protected operation MUST receive `401`;
authenticated requests lacking permission MUST receive `403`.

## Authorization policy

Authorization is governed by a **policy** attached to an object or verb: a set of allow/deny rules.
Each rule has an effect (`allow` or `deny`), a set of subject matchers, and a set of actions.
Subject matchers bind directly to the authenticated token:

| Matcher | Matches | Bound to |
|---------|---------|----------|
| `owner` | the resource owner | the principal's `sub` equals the resource's `$owner` (an anonymous principal matches `owner` only when `$owner` is the anonymous identity) |
| `public` | any principal, including anonymous | — |
| `sub:<id>` | a specific subject | the `sub` claim |
| `role:<r>` | a role claim | a member of the `roles` claim (a JSON array of strings) |
| `group:<g>` | a group claim | a member of the `groups` claim (a JSON array of strings) |
| `scope:<s>` | a token bearing OAuth scope `<s>` | a member of the space-delimited `scope` claim ({{RFC6749}}) |
| `claim:<k>=<v>` | a token whose claim `<k>` equals `<v>` | the scalar claim named `<k>` |
| `prop:<name>` | the subject named by THIS object instance's `<name>` property value (OPTIONAL, feature `prop-matchers`) | the principal's `sub` equals the concrete object's stored value for `<name>` |
| `readers:<path>` | any principal that may `read` the object at `<path>` (OPTIONAL, feature `readers-matchers`; verb policy only) | the object-level `read` decision for the concrete object at `<path>`, evaluated per request |

The bound claim names are fixed so two implementations evaluate a policy identically; a server MAY
map a differently-named identity-provider claim onto these at the authentication boundary, but the
matcher vocabulary above is normative.

**Per-instance matchers.** `prop:<name>` is OPTIONAL (advertised as the `prop-matchers` feature)
and resolves against the concrete object the access targets, so one declaration on a collection
gates each instance by that instance's own value (e.g. a letter's `body` readable only by the
subject its `for` property names). It is meaningful only where an instance exists: a server
supporting it MUST evaluate it in per-property ACLs and object-level policy, MUST treat a missing
property, an anonymous principal, or an absent instance context as a non-match (fail closed), and
MUST reject it in verb policy with `400`. The comparison is an exact, single-value subject match.

**Object-reader matchers.** `readers:<path>` is OPTIONAL (advertised as the `readers-matchers`
feature) and lets a verb's audience follow an object's: it admits exactly the principals that may
`read` the object at `<path>`, so sharing that object shares the verb, and unsharing it unshares the
verb. `<path>` is a concrete object path in the data-plane grammar ({{addressing}}), with no leading
`/`, no wildcard segment, no `.` or `..` segment, and no verb; a server MUST reject any other path
with `400` (`invalid-input`) and MUST NOT normalize it. A server supporting it:

* MUST evaluate it per request, against current state, as the object-level `read` decision a
  data-plane `GET` of `<path>` by the same principal and the same credential would reach
  ({{object-policy-inheritance}}, {{path-scoped-tokens}}). A matcher admits the principal only if
  that `GET` would return the object.
* MUST treat an absent object, or one the principal may not read, as a non-match. If the server
  cannot complete the evaluation (for example, its store is unavailable), it MUST fail the request
  with a server error (`5xx`) rather than treat the matcher as either a match or a non-match.
* MUST accept it only in verb policy, and MUST reject it with `400` (`invalid-input`) in object
  policy (`$policy`) and in per-property ACLs. This mirrors `prop:` being refused in verb policy.
* MUST treat a `readers:` matcher found in object policy or in a per-property ACL, however it came
  to be stored, as a non-match, and MUST NOT evaluate it. An object's `read` decision under the baseline
  object policy (`$policy`, governing anchor, default) therefore never consults a `readers:`
  matcher, which rules out recursion there. An accessor verb's `execute` policy is not consulted
  by this matcher.

As with every matcher other than `public`, admission depends on the caller, so a function gated by
it is never caller-independent in the sense of the caching rule in {{taxonomy}}; unlike the others,
a `readers:` admission can change with no change to the verb.

**The anonymous principal.** A request without an authenticated identity carries the **anonymous**
principal, which has no `sub` and is a single shared identity — every unauthenticated caller is the
*same* anonymous principal. This has consequences a deployment MUST account for: (1) on an open
server (no authentication configured), the anonymous principal is the de-facto owner of resources it
creates, and the `owner` matcher admits it for those resources; (2) because the identity is shared, a
server that has ANY authentication configured MUST NOT allow the anonymous principal to perform an
owner-gated MUTATION (deploy, verb-property write, or data-plane write), since one unauthenticated
caller could otherwise seize a resource owned by "anonymous" that another created — reads and
execute-policy-gated invocation of public verbs remain available; and (3) an `Idempotency-Key` and an
asynchronous-operation handle are meaningful only with a stable identity, so a server MAY decline to
honor them for the anonymous principal ({{taxonomy}}, {{operations}}).

Actions include `read` (with `read-data` / `read-code` refinements), `write`, `execute`, and
`manage` (changing policy; ownership itself is fixed, {{ownership}}). Evaluation is **deny-overrides with default-deny**: access is
granted only if at least one `allow` rule matches and no `deny` rule matches; with no matching rule,
access is denied.

## The simple (MOO-style) profile {#simple-profile}

A compact profile expresses the common case — an owner plus per-action public flags:

~~~ yaml
owner: alice
read: public
execute: public
write: owner
~~~

This profile is a **bidirectional projection** of the canonical policy. The expansion is: each
profile field whose name is an action (`read`, `write`, `execute`, `delete`) maps to a single
canonical **`allow`** rule for that action whose subject-matcher set is the field's value — a single
matcher token or an array of them (an OR-list: the action is permitted if any matcher admits the
caller). The `owner` field names the resource's `$owner`, which is set when the resource is
created and never changed by a policy write ({{ownership}}). In a **complete** policy document (one that
states the policy as a whole, such as the policy a resource is created with or one rendered back
from a canonical policy), an omitted action field takes that action's default. A **partial** update
of an existing verb's policy (`PUT …:verb/policy`, {{verb-properties}}) is different: an action the
body omits MUST keep its current value, and an omitted `owner` keeps the current owner, so a
narrowing update such as `{"execute": "owner"}` never re-opens another action to its default. An
`owner` equal to the current owner is accepted and changes nothing, so a client may write back the
policy it read. An `owner` naming anyone else MUST be refused `403` (`forbidden`), and a present
`owner` that is not a string `400` (`invalid-input`); either way nothing in the body is applied. For
an object, the defaults are `read: public`, `write: owner`, `delete: owner`. For a verb, they are
the values of the server's born policy ({{deployment}}): `read: public`, `execute: public`,
`write: owner` on a server that does not advertise `verb-private-default`, and `owner` for every
action on one that does. The profile emits **no
`deny` rules**, so its expansion is a deny-free policy on which deny-overrides reduces to "allow if
any matcher matches, else deny" — exactly the OR-list evaluation a simple-profile server performs.
Rendering back to the profile is the inverse and is defined only for a canonical policy of this
deny-free, one-allow-rule-per-action shape; any other canonical policy has no profile form.

A server that implements only the deny-free simple subset MUST advertise that it does not accept
`deny` rules (rejecting a canonical policy that carries one with `400` `invalid-input`), so a client
knows a deny-bearing policy will not be honored. An implementation MAY accept and present only the
simple profile and store canonical rules internally.

## Ownership is fixed {#ownership}

A resource's owner, an object's `$owner` or a verb's policy `owner`, is assigned once, when the
resource is created (first-writer-owns for an object; the deployer for a verb, {{deployment}}),
and is **fixed** thereafter. A server MUST NOT let any request change it, whoever makes it: not the
current owner, not a principal the resource's policy admits for `write` or `manage`, not a
delegated request ({{delegated-tokens}}), and not a verb. Specifically:

* A data-plane write carrying `$owner` is admitted only when the caller is the object's current
  owner (for this rule, and for a `$policy` write, an object with no recorded owner is treated as owned by the anonymous identity) AND the value equals
  that owner; the member then changes nothing. Any other `$owner` member MUST be refused `403`
  (`forbidden`), and the write MUST change nothing. A caller that is not the owner receives that
  refusal whatever value it sends.
* A `PUT …:verb/policy` follows {{simple-profile}}: an `owner` equal to the current owner is a
  no-op, and any other `owner` is refused.
* No deployment, replacement, rollback, or verb-property write changes a verb's owner
  ({{deployment}}).

The reason is the authority an owner lends. A lifecycle hook runs under its owner's authority
({{events}}), and a runs-as-owner verb under its owner's ({{exec-identity}}); both resolve the
owner when they run. If ownership could be reassigned, whoever wrote such code could name another
principal as its owner and then trigger it, and that principal's authority would back code it never
chose. The owner-made opt-in rule forbids exactly that. Sharing is unaffected: an owner lends access
through policies ({{authz}}) without moving the owner identity. Deleting a resource lets anyone
create a new one at its path, which inherits nothing of the old one's ownership or code.

Because nothing can change hands, a resource whose owner can no longer authenticate cannot be
managed by anyone else. A server MAY offer the operator recovery act of {{admin-reown}}, which is
the only way an owner changes.

## Operator ownership recovery (OPTIONAL, feature `admin-reown`) {#admin-reown}

A server MAY let a configured operator reassign ownership. It advertises the `admin-reown` feature
token when the act is available. The act belongs to the operator, not to the product's users. A
server that offers it:

* MUST admit it only for operator subjects named in server configuration: never through a role,
  group, scope, claim, `public`, or `owner` matcher, and never for the anonymous identity or a
  path-scoped sub-token ({{path-scoped-tokens}}). A delegated request is refused as on every
  administrative route ({{delegated-tokens}});
* MUST answer as if the act did not exist when it is not configured;
* MUST name, in each act, a current owner `from`, a new owner `to`, and an object path. It MUST move
  only resources that path names, and only those `from` currently owns: the object at the path and
  the verbs defined on it, plus everything beneath the path when the act asks for its subtree;
* MUST refuse with `400` (`invalid-input`) a `to` that equals `from`, that is the anonymous
  identity, or, on a server advertising `delegated-client-actors`, that begins `client:`
  ({{client-actors}});
* MUST, in the same write that changes a verb's owner, turn off its runs-as-owner opt-in
  ({{exec-identity}}) and any other owner-made grant of authority or visibility the verb carries,
  and MUST pause the verb if it is a lifecycle hook. Nothing then runs with the new owner's
  authority until the new owner opts in with their own credential;
* MUST NOT move registrations (schedules and subscriptions, {{events}}), which run under their
  registrant's authority; MUST NOT fire lifecycle hooks or publish events for the change of owner
  itself; and SHOULD NOT move a slot of a secrets mount ({{secrets-mount}}), whose credential the
  old owner supplied.

**A paused hook** is not invoked when its event occurs; the server records the skip in its operator
log, and it does not resolve past the paused hook to an ancestor's. Every other invocation of the
verb (a direct call, a schedule or subscription that targets it, a composition) is unaffected,
because none of them runs under the owner's authority. The hook's `meta` carries `paused: true`
({{verb-properties}}). Only its owner replacing its code resumes it: `PUT …:verb/code`, a rollback
({{verb-history}}), or a re-registration ({{deployment}}). A `policy` or other property write
leaves it paused. A runs-as-owner opt-in is restored only the way it was first made, by the owner
at deploy.

The reference host's wire form follows. A server MAY offer the act through another operator
interface with the same semantics.

~~~
POST /admin/reown                 Content-Type: application/json
{"from": "<subject>", "to": "<subject>", "path": "<object path>",
 "subtree": false, "dryRun": false}
→ 200 {"from", "to", "path", "subtree", "dryRun",
       "verbs": [{"route", "runsAsCleared", "invokerCleared", "paused"}],
       "objects": <count>, "skipped": {"secretSlots": <count>}}
~~~

`dryRun` reports what the act would move and changes nothing. Each resource moves atomically; the
act as a whole need not. Because it selects only what `from` still owns, repeating an act completes
a partial one.

## Execution identity {#exec-identity}

In this version, a verb executes with the **caller's** principal. A verb's effective authority is
the intersection of the caller's permissions on the targets it touches, the capabilities the verb
declared ({{capabilities}}), and the target objects' policies. Consequently a verb can do nothing
the caller could not do directly, and nothing it did not declare. The compute cost of an
invocation is attributed to the caller.

A **server-initiated** invocation (a trigger or schedule; {{events}}) has no request caller and
instead runs with the attenuated authority of the principal who **registered** it. The social-media
case — a profile owner's verb running when a visitor interacts — is exactly this: it is a trigger
registered by the owner, so it runs with the *owner's* attenuated authority (never the visitor's),
observes only what the policy exposes about the visitor through the event payload, and is charged to
the owner.

**Runs-as-owner (OPTIONAL, feature `runs-as-owner`).** A server MAY support a deploy-time,
callee-side opt-in (`runs_as=owner`) under which a verb executes with its **owner's** attenuated
authority instead of the caller's — the explicitly gated "set-uid" mechanism. Constraints: the
opt-in MUST be made by the owner at deploy (it is the owner's authority being lent to the code;
because ownership is fixed, {{ownership}}, the owner who opted in is the owner the verb runs as,
unless an operator's recovery act withdrew the opt-in, {{admin-reown}});
the verb's execute policy MUST still be evaluated against the **real caller** (the flag never
widens who may trigger the verb); the synthesized owner principal MUST be attenuated exactly as a
server-initiated registrant's (the owning subject only — no roles, groups, scopes, or claims);
compute cost MUST remain attributed to the real caller (attributing it to the owner would let any
caller drain the owner's quota); and the descriptor MUST advertise the switch (`runsAs: "owner"`)
so callers know the verb does not act as them. The confused-deputy burden falls on the opted-in
verb: its input is caller-controlled and MUST be treated as untrusted, and a server MUST NOT
surface the real caller's identity to the verb through a forgeable channel (such as the input
payload).

**Delegated requests (OPTIONAL, feature `delegated-tokens`).** A request authenticated by a
delegated token ({{delegated-tokens}}) runs as its **subject**, bounded by the grant: the bounds are
additional denials only, and they follow every frame the request causes. Code installed under a
delegation stays bound by it, whoever triggers it. The compute cost of such a request is attributed
to its real caller, the subject.

## Path-scoped sub-tokens (OPTIONAL, feature `path-scoped-tokens`) {#path-scoped-tokens}

Every bearer credential defined so far carries its principal's COMPLETE authority. A server MAY
additionally support minting a deliberately **attenuated** sub-credential: confined to one object-path
prefix, read-only, and short-lived. This is a NARROWING primitive — a sub-token MUST NOT confer any
right its minting principal does not already hold ({{authz}}) — suited to delegating a minimal,
temporary, read-only view of a subtree to an untrusted or semi-trusted context: a sandboxed
{{HTMLIFRAME}}-style opaque-origin frame, a short-lived share link's fetcher, or an embedded widget.

**Minting.** A server supporting this profile MUST expose `POST /v1/tokens/sub`, taking a JSON body
`{"prefix": "<object-path-prefix>", "ttl_seconds": <optional integer>}` and returning, on success,
`200` with `{"token": "<bearer>", "expires_at": <unix-seconds>, "prefix": "<prefix>", "read_only":
true}`. The endpoint MUST refuse an unauthenticated (anonymous) caller with `401`, unconditionally —
even though the anonymous principal's own read rights would still be an upper bound on what could be
minted, minting is refused outright, since an anonymous mint surface would collapse any per-principal
rate limit into one shared bucket and an anonymous sub-token grants nothing an anonymous read could
not already do directly. The server MUST verify, against its LIVE authorization state (never trusted
from the request), that the calling principal can itself **read** `prefix` — the identical gate a
data-plane read of that path would apply ({{object-data}}) — and MUST refuse `403` when it cannot;
this is the load-bearing attenuation check, since everything downstream depends on the minted token
never exceeding it. The minted token MUST be read-only (this profile defines no write-capable
sub-token). `ttl_seconds`, when supplied, MUST be honored up to a server-defined ceiling and MUST be
CLAMPED (never refused) when the request exceeds it; a server SHOULD default to a short TTL (on the
order of minutes) when the field is absent and MUST advertise both the default and the ceiling (for
example, in its documentation or a discovery extension) since they are otherwise unobservable to a
client. The endpoint MUST be rate-limited per authenticated principal, refusing excess mint attempts
with `429` — minting is cheap to request but each attempt costs a signature, so an unbounded mint
surface is a denial-of-wallet vector in its own right, independent of what is ultimately minted.

**Recognizing a sub-token.** The mint response's `token` MUST be structurally distinguishable from an
ordinary bearer issued by the same server (for example, via a reserved `aud` claim on a JWT-shaped
token) — every downstream authorization gate consulting it needs to know, without ambiguity, that it
is confined. A server MUST derive the sub-token's authorization matchers ({{authz}}) using ONLY the
minting principal's `sub` (for the `owner`/`sub:<id>` matchers and for provenance/logging) — mirroring
the existing attenuation rule for a synthesized owner or server-initiated-registrant principal
("the owning subject only — no roles, groups, scopes, or claims", above): a resource readable only via
a `role:`/`group:`/`scope:`/`claim:` matcher, never `owner`/`sub:`, is therefore UNREADABLE through a
sub-token even though the minting principal could read it directly. This is narrower than "exactly the
minting principal's authority", which a server MAY choose to implement instead if its wire format for
the sub-token carries those claims too — either is compliant, since attenuation only ever needs to
narrow, never to widen; a server MUST NOT invent a construction that could resolve to something WIDER
than the minting principal's own authority.

**Enforcement.** For any request authenticated as a sub-token, a server MUST apply the following as
ADDITIONAL denials layered on top of its ordinary authorization evaluation — this profile can only
ever turn an `allow` into a `deny`, never the reverse:

1. A read of an object path that is not within the token's `prefix` MUST be refused `403`.
2. Any write, delete, manage, or verb-deployment action MUST be refused `403`, unconditionally —
   independent of what the underlying `$policy` or verb policy would otherwise permit. Minting a
   FURTHER sub-token from a sub-token MUST likewise be refused `403` (a non-read action against
   `POST /v1/tokens/sub` itself), foreclosing scope-laundering and unbounded delegation depth. A sub-token MUST likewise be refused
   `403` `delegation-bound` on the grants API, and as the exchange's `actor_token`
   ({{delegated-tokens}}), and a principal that is the actor of a live grant it has exchanged MUST NOT mint one.
3. A read within `prefix` is authorized exactly as the minting principal's own read would be
   (subject to the narrowing in "Recognizing a sub-token" above) — no NEW grant is created.

Expiry is enforced exactly as for any other bearer of the same underlying credential mechanism; a
sub-token past its `exp` MUST be refused like any other expired bearer.

**Reachability from an opaque origin.** The primary motivating consumer is a sandboxed, opaque-origin
browsing context ({{HTMLIFRAME}}, `sandbox="allow-scripts"` without `allow-same-origin`) whose fetches to
the server are cross-origin with `Origin: null`. A server that also implements CORS ({{security}}) MAY
extend its allowed-origin policy so that a request presenting a sub-token succeeds from `Origin: null`
for reads within scope, WITHOUT reflecting credentials — this does not create a new server-side
authorization ({{security}}: CORS governs only whether a browser lets a page read a response, never
whether the server accepts the request), and remains fully subject to the enforcement rules above.

**Discovery.** A server supporting this profile MUST advertise `path-scoped-tokens` in its feature list
({{discovery}}); a client MUST NOT assume the mint endpoint exists absent that token.

## Delegated tokens (OPTIONAL, feature `delegated-tokens`) {#delegated-tokens}

Every credential defined so far is either a principal's COMPLETE authority or, for a sub-token
({{path-scoped-tokens}}), a read-only view of one subtree. A server MAY additionally let one
principal (the **subject**) authorize another (the **actor**) to act for them, within bounds,
while BOTH identities stay visible. The subject creates a durable **grant**; the actor presents
proof of itself and receives a short-lived **delegated token** that authenticates as the subject,
bounded by the grant. The record of why this is a distinct credential type, and the rulings behind
every choice below, is [ADR-0109](https://github.com/stackumi/restactd/blob/main/spec/decisions/0109-delegated-tokens.md).

**Four independent tokens.**

* `delegated-tokens`: the grant, the grants API, the exchange, the delegated token, the bounds
  and their reach, the refused surfaces, traces, and secret values (this section).
* `delegated-client-actors`: an actor that is a program with no principal of its own
  ({{client-actors}}). A server advertising it MUST advertise `delegated-tokens`.
* `identity-actor`: the delegation actor in the `identity` interface and in every frame the bounds
  reach ({{caller-identity}}). A server advertises it only alongside `delegated-tokens`.
* `object-provenance`: the `?meta=provenance` facet ({{provenance-facet}}). It is usable without
  delegation.

A fifth token, `delegated-prefixes`, is named for a later amendment that lets a grant carry a
workspace list. It is NOT defined here; its absence tells a client that `prefixes` is refused.

**The grant.** A grant is a server-held record with these fields:

| Field | Meaning |
|---|---|
| `id` | opaque, at least 128 random bits. An identifier, not a credential: exchanging needs the actor's proof. |
| `subject` | the creating principal's subject. Immutable. |
| `actor` | `{"kind":"principal","sub":"<subject>"}`, or `{"kind":"client","id":"client:<random>","label":"<text>"}` ({{client-actors}}). Immutable. |
| `read_only` | boolean. `true` when a request omits it. |
| `snapshot` | the creating credential's roles, groups, scopes and scalar claims, captured at creation and re-captured at every `PATCH`. NEVER returned on the wire. |
| `created_at`, `expires_at` | `expires_at` MUST NOT exceed `created_at` plus the advertised `grantTtl.maxSeconds` |
| `label` | optional display text, at most 200 characters |
| `last_used_at` | the time of the last successful exchange (SHOULD) |
| `exchanged_at` | the time of the grant's first successful exchange. Server-held: set once, never changed or cleared (a `PATCH` keeps it), NEVER returned on the wire. A principal is bound as an actor ({{delegated-tokens}}) only once this is set. |
| `secret_hash` | client actors only: the hash of the current grant secret. NEVER returned on the wire. |

* Only the subject's own ordinary credential manages a grant. It MUST be non-anonymous, and neither
  a sub-token nor a delegated token.
* An actor equal to the subject MUST be refused (`400`). A server MAY restrict which principals may
  create grants.
* **The snapshot is how the ceiling is "the user's own permissions".** A delegated principal's
  roles, groups, scopes and claims come from the grant's snapshot, so a permission the subject
  holds through a `role:`, `group:`, `scope:` or `claim:` matcher is not lost. The snapshot MUST
  NOT be wider than the credential that created or last renewed the grant.
* **`prefixes` is reserved.** Until a server advertises `delegated-prefixes`, it MUST refuse any
  grants request that carries a `prefixes` member, whatever its value (`null` and `[]` included),
  with `400` `invalid-input` ("workspace prefixes are not supported by this server"), and it MUST
  treat a stored grant that carries `prefixes` (after a downgrade or a restore) as **not live**
  everywhere liveness is checked. A list is never accepted and left unenforced.

**The grants API.** All routes live under the reserved `/v1/tokens/` namespace. The wire uses
snake_case, as `POST /v1/tokens/sub` does.

| Request | Result |
|---|---|
| `POST /v1/tokens/grants` | `201` with the grant. Body: `actor` (a subject) or `client` ({{client-actors}}); then `read_only?`, `ttl_seconds?` (CLAMPED to `grantTtl.maxSeconds`, never refused) and `label?`. |
| `GET /v1/tokens/grants` | `200`, the caller's own live grants, newest first, paginated as {{collections}} defines (`pageSize`, `pageToken`, `nextPageToken`) in a body `{"grants":[…],"nextPageToken"?:"…"}` |
| `GET /v1/tokens/grants/{id}` | `200`, or `404` when the grant is absent, expired, revoked, not live, or not the caller's: ONE answer for all, so there is no existence oracle |
| `PATCH /v1/tokens/grants/{id}` | `200`. Any of `read_only`, `ttl_seconds` (resets `expires_at` from now, clamped) and `label`. MUST re-capture the snapshot from the presenting credential (replacing it, not merging), whether or not any other field changes. Narrowing and widening are both allowed, since only the subject can call it. |
| `DELETE /v1/tokens/grants/{id}` | `204`; the grant is revoked. Again, or for another's grant: `404`. |

* An anonymous caller MUST get `401`.
* A sub-token or delegated caller MUST get `403` `delegation-bound`.
* `POST` and `PATCH` by a principal that is the actor of ANY live grant it has exchanged MUST get `403`
  `delegation-bound`, even with its own ordinary bearer. Its `GET` and `DELETE` are unaffected:
  revoking is always allowed. This refusal precedes any ownership answer.
* Excess requests, or a per-subject cap on live grants, give `429` `quota`.
* A `prefixes` member gives `400` `invalid-input`. A refused `PATCH` MUST change nothing.
* Timestamps are unix seconds. A grant's wire actor is `{"kind":"principal","sub":"<subject>"}` or
  the client form above.
* No response ever carries `snapshot`, `secret_hash` or a pending client's `code_challenge`. Every
  response, errors included, MUST carry `Cache-Control: no-store`.
* A server accepting cookie-borne sessions on the grants API MUST apply its cross-site request
  forgery defense there: a forged grant creation hands the forger a credential.

**The exchange (RFC 8693).** `POST /v1/tokens/exchange`, `application/x-www-form-urlencoded`, as
{{RFC8693}} §2.1 defines it.

| Parameter | Value |
|---|---|
| `grant_type` | `urn:ietf:params:oauth:grant-type:token-exchange` |
| `subject_token` | the grant id |
| `subject_token_type` | `urn:restact:params:oauth:token-type:grant` |
| `actor_token` | **the actor's proof.** For a principal actor, its own ordinary bearer (`actor_token_type` `urn:ietf:params:oauth:token-type:access_token`). For a client actor, the grant secret (`urn:restact:params:oauth:token-type:grant-secret`, {{client-actors}}). |

The two `urn:restact:` token-type URIs are provisional ({{iana}}).

A server MUST apply these refusals in this order:

1. A request with an `Authorization` header gets `400` `invalid_request`. The actor is proven only
   by `actor_token`.
2. `resource`, `audience` or `scope`, or a `requested_token_type` other than an access token, gets
   `400` `invalid_request`. Narrowing lives on the grant, not on the exchange.
3. When `actor_token_type` is the access-token type, the server MUST VERIFY `actor_token` through
   its ordinary bearer verification first; a token that fails gets `401`. Only a token that
   verifies is then classified: a delegated token or a sub-token gets `403` `delegation-bound`.
   Unverified claims MUST NOT be read, so a forged token learns nothing beyond `401`.
4. The grant named by `subject_token` is loaded. An unknown, expired or revoked grant, or one that
   is not live, gets `401` `invalid_grant`.
5. The proof is checked against what **the grant's `actor.kind`** requires, never against the type
   the caller declared: a principal actor requires step 3's verified bearer, with `sub` equal to
   `grant.actor.sub`; a client actor requires the grant-secret type, matching `secret_hash`.
   Anything else gets `401` `invalid_grant`.

Steps 4 and 5 MUST answer identically, in status and body. The endpoint MUST be rate-limited per
actor and per source (`429` `quota`); a failed exchange counts against the presenting source and
actor, never against the grant. A limit MUST NOT refuse a proof that verifies; `429` replaces
only a failure. The source is the transport peer, so a server behind a proxy has one source for
all of its callers; a server's counters MAY be per process (N nodes then give N times the budget)
and MAY be bounded, in which case a failure from an untracked key is limited rather than
unlimited. Success is `200` with `Cache-Control: no-store`:

~~~json
{ "access_token": "…", "issued_token_type": "urn:ietf:params:oauth:token-type:access_token",
  "token_type": "Bearer", "expires_in": 900, "subject": "alice", "grant_secret": "…" }
~~~

`subject` is the grant's subject; **the actor MUST check it** against the user it is serving before
using the token. `grant_secret` is present for a client actor only. Errors are Problem Details
({{errors}}) with one added member, `error`, carrying the RFC 6749 §5.2 code (`invalid_request`,
`invalid_grant`); status codes follow this protocol's error table, so an `invalid_grant` is `401`.

A successful exchange MUST record `exchanged_at`, if it is unset, before it returns the token. The write MUST be conditional on the grant still being stored and live, so it never revives a revoked grant, and on a multi-node backend it MUST be committed to the shared store. If it cannot be committed, the exchange MUST fail `500` and issue no token.

**The delegated token and the delegated principal.** The token is signed with the server's ordinary
bearer key and MUST carry NO `kid` header (a `kid` would route it to an external identity
provider's verifier). Its claims: `aud` containing the reserved value `restact-delegated`; `sub`
the grant's subject; `act` `{"sub": <actor id>}`; `grant` the grant id; `iat`; and `exp` no later
than the lesser of now plus `tokenTtl.maxSeconds` and the grant's `expires_at`. A refresh is a
fresh exchange.

* A server treats a credential as delegated only if it issued it through the exchange. An `act`
  claim on any other credential MUST be ignored.
* A request that carries both a trusted identity header and a bearer whose `aud` contains
  `restact-delegated` MUST be refused `401`, so the proxy's identity cannot silently drop the
  grant's bounds. Reading `aud` for this refusal needs no verification, because it can only refuse.
* **Per request**, the server verifies the signature and `exp`; loads the grant and checks that it
  is live and has a recorded exchange, that `grant.subject == sub` and that `grant.actor == act.sub`
  (otherwise `401` `unauthorized`; so no delegated request is served under a grant whose exchange
  the store does not show, for example after a restore); and builds the **delegated principal**, whose subject is `grant.subject` and
  whose roles, groups, scopes and claims come from `grant.snapshot`. Beside it, never on it, the
  server carries the **delegation record** `{actor, grant, read_only}`.
* The precedence of authentication mechanisms is unchanged: a delegated token is recognized only
  where a bearer is the credential that authenticated the request.
* The token's own claims (`act`, `grant`, `aud`) MUST NOT be visible to any matcher or to
  `identity.claim()`. All bounds come from the stored grant on every request, so a `PATCH` or a
  `DELETE` takes effect on the next request without a new token.
* **The actor adds no authority.** Policy is evaluated as the subject; a matcher naming the actor's
  own principal does not admit a delegated request.
* Liveness is checked once, when the request is authenticated; a request already in flight
  completes. A server MAY cache grant state for at most the advertised
  `revocationLatencySeconds`. A cached copy that shows no exchange is never trusted: the server
  re-reads the grant before it refuses for that reason, and before it applies the actor rule.

**The bounds: additional denials only.** Like a sub-token's, the bounds can turn an allow into a
deny, never the reverse. A request the delegated principal could not make is refused exactly as the
subject's own would be (the **ceiling**). A `read_only` grant additionally admits ONLY `GET` and
`HEAD` of stored representations and facets, and `GET` invocations of functions; it refuses every
other method with `403` `delegation-bound`, decided from the request and the grant alone, before
policy or existence is consulted, so the refusal is no existence oracle. Inside a frame, the guest
sees the same error a policy denial gives it, with no new error case. Read-only blocks changes
only: it does not block what a read or a function reaches without changing anything.

**The bounds follow the work.** Code installed under a delegation stays bound by it, whoever
triggers it.

* *(a) Frames the request causes* (composition hops, authority-switched frames, lifecycle hooks
  fired by a delegated write, and asynchronous operations) carry the delegation record's actor
  unchanged across every switch; an operation started under delegation completes under the bounds
  captured when it started.
* *(b) Registrations made under delegation.* A schedule or subscription created by a delegated
  request MUST store the grant id. Each firing runs as the registrant's attenuated authority and
  carries the actor. A firing MUST be skipped, finally and with an operator-log record, when its
  grant is not live, or when the grant is read-only and the target is an action. The registration
  itself remains.
* *(c) Code installed under delegation: the stamp.* A server MUST stamp a verb
  `elevatedUnderGrant: <grant id>` when a write made under delegation leaves it running as its
  owner or touches a lifecycle hook (a deployment, a rollback, a `policy` write, or any other
  verb-property write). The stamp is server state, replaces any earlier stamp, and is checked at
  every authority switch into a stamped verb and at every firing of a stamped hook. When the
  stamp's grant is not live, every stamped verb pauses (the switch is refused `403`
  `delegation-bound`, a hook firing is skipped and logged). When the grant is read-only, the same
  applies to stamped actions and every stamped hook, but a stamped function proceeds. When the grant
  is live, the switch proceeds and carries the stamp's actor. The stamp is cleared when a
  non-delegated credential of the grant's subject, or of the verb's owner, makes any stamping write
  on the verb; a rollback that leaves the verb running as its owner, or a verb that is a lifecycle
  hook, re-applies the grant recorded with the history entry it restores, unless made by a
  non-delegated credential of that grant's subject. While a verb is stamped, its `meta`
  carries `boundVia: <actor id>` and NEVER the grant id.
* *The actor's own registrations.* A schedule or subscription whose registrant is a stamp grant's
  actor, created with that actor's own credential while its target is stamped, MUST record that
  grant; its firings are skipped once the grant is not live, even after the target is re-saved, so a
  standing registration the agent set up for itself does not come back to life because the user
  later re-saved the verb.
* *Hook code is the owner's to replace.* Replacing the code of a lifecycle hook, which runs under
  its owner's authority, MUST be performed by the owner ({{deployment}}). This applies to every
  caller.

**Never-delegable acts, and refused surfaces.** A delegated principal MUST be refused `403`
`delegation-bound` for every method of the grants API, the exchange (whether as the caller or as
the `actor_token`), client-actor redemption, and sub-token minting. A **principal that is the actor
of any live grant it has exchanged** MUST likewise be refused when it creates or renews a grant or mints a sub-token,
EVEN WITH ITS OWN ORDINARY BEARER; its reading, listing and revoking of its own grants stay
allowed. A server MUST also refuse a delegated principal, `403` `delegation-bound`, on the surfaces
whose bounds cannot be shown to hold: SSE subscriptions, a remote MCP facet, embedder custom
routes, and the administrative routes. Native (embedder) verbs are not refused; they are invoked
through the ordinary verb path and a server MUST NOT hand them the raw delegated bearer.

**Traces.**

* An object created under delegation is owned by the subject.
* A deployment or rollback made under delegation SHOULD record `deployedVia` (the actor id) beside
  `deployedBy` ({{verb-history}}). The grant id MUST NOT appear in a history representation.
* The auto-published event payload ({{event-publish}}) carries an `actor` member when the mutation
  ran under delegation; event names are unchanged.

**Secret values stay the user's to type.** On a server that also advertises `secrets-management`, a
delegated `PUT` carrying a `value` member on a mount path MUST be refused `403` `delegation-bound`.
Creating the reference (metadata, no value) is allowed.

**Discovery and configuration.** A server MUST advertise `delegated-tokens` only when it can sign
and the operator has not switched delegation off, and MUST publish `serviceConfig.delegation`
(`tokenTtl {defaultSeconds, maxSeconds}`, `grantTtl {defaultSeconds, maxSeconds}`,
`revocationLatencySeconds`; the reference values are 900/900, 3600/2,592,000 and 0). **Until it
advertises the token, every route in this section answers `404` and authentication refuses every
delegated token with `401`**, so no grant or client secret can be minted before its enforcement
exists. The paths `tokens/grants` (and everything beneath it) and `tokens/exchange` under `/v1/`
are reserved on every server, whether or not it advertises delegation, as `/v1/tokens/sub` is. A
server that switches delegation off MUST fail closed: every grant is not live, and a server that
boots with delegation off MUST revoke every stored grant before serving a request, so that
switching it back on revives nothing. If that revocation cannot be committed the server MUST refuse
to boot. On a multi-node backend the revocation is made in the shared store, and a node running
with delegation off treats every grant as not live, even one another node created after it booted.
A pending asynchronous operation started under delegation is not resumed.

## Client actors (OPTIONAL, feature `delegated-client-actors`) {#client-actors}

A **client actor** is a program on the user's machine with no principal of its own. The flow follows
{{RFC8252}} loopback sign-in with {{RFC7636}} PKCE:

1. The program starts a loopback listener and opens the sign-in page with a `code_challenge`.
2. That page, in the user's own session, calls `POST /v1/tokens/grants` with
   `{"client": {"label", "code_challenge", "code_challenge_method": "S256"}, …}`.
3. The server assigns the actor id `client:<random>` and returns the grant plus a one-time `code`
   that lives at most 120 seconds.
4. The page relays the code to the listener. The server never redirects. The relay target MUST be a
   loopback IP literal (`127.0.0.1` or `[::1]`) with a port, and the page MUST refuse any other
   target.
5. The program calls `POST /v1/tokens/grants/redeem` with `{code, code_verifier}`. This route is
   unauthenticated, and is refused if it carries a sub-token or a delegated token.
6. The server checks the S256 verifier and returns `{grant_id, grant_secret, actor}`, exactly once.

The code is consumed by its first redeem attempt, successful or not. The label is untrusted text:
a sign-in page and every grants list MUST render it as plain text beside the server-assigned id.

**The grant secret** has at least 256 random bits and is stored only as a hash. It is the client's
`actor_token` and is not a bearer for any other route. **It rotates on every exchange**: a
successful exchange returns a new `grant_secret` and supersedes the one presented, and presenting a
superseded secret MUST revoke the grant (the refresh-token rotation of {{RFC9700}}). Where the platform offers an operating-system credential
store bound to the client program, the client MUST keep the secret there; otherwise it MUST tell
the user at sign-in that the agent's own tools may be able to read the secret, and MUST NOT put the
secret in an environment variable that tools the agent runs inherit.

An actor id SHOULD NOT encode the delegating subject. On a server advertising this token, no
ordinary credential whose subject begins with `client:` authenticates (`401`).

## The provenance facet (OPTIONAL, feature `object-provenance`) {#provenance-facet}

`GET /v1/<obj>?meta=provenance` returns `{"created":{"subject","actor"?,"at"},"updated":{…}}` for
the object. It covers every committed mutation of the object (data-plane and capability writes,
blob writes, `$policy` and `$owner` writes), committed atomically with the write it describes.
`subject` is the principal the write ran as; `actor` appears only for a write made under delegation;
no grant id ever appears. An object last written before the feature existed returns no `created` or
`updated` member. The facet is read-gated by the object's own `read` and answers `404` or `403`
exactly as a `GET` of the object would; it is never part of the object's representation.

## The mediated secrets mount (OPTIONAL, feature `secrets-management`) {#secrets-mount}

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
`unavailable`) and MUST NOT fall back to storing the value.

**Discovery.** A server supporting this profile MUST advertise `secrets-management`; absent it, a
client MUST NOT assume a mount exists, and MUST treat a `value` member as ordinary data.

## The mediated outbound call (OPTIONAL, feature `mediated-egress`) {#mediated-egress}

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

**Authorization.** The call executes as the principal the server's own identity chain resolved for
the inbound request; the embedder's handler MUST NOT be able to name a principal. An anonymous
principal and a path-scoped sub-token ({{path-scoped-tokens}}) MUST both be refused. The use-grant
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
exactly one verified address without a second lookup. TLS MUST be used and verified against the
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

**Discovery.** A server supporting this profile MUST advertise `mediated-egress`.

# Consistency {#consistency-txn}

REST:ACT does **not** mandate a single consistency or storage model. An implementation may range
from eventually-consistent external storage (typical of a function-as-a-service deployment) to a
serializable transactional store (typical of a monolithic server), and anything between. Instead of
prescribing a mechanism, this document defines a vocabulary of **consistency levels** and requires
a server to **advertise** the level it provides in discovery ({{discovery}}); a server MUST NOT
claim a level it does not provide. From weakest to strongest:

* **eventual** — operations are subject only to the guarantees of the backing store; a read may not
  immediately reflect a prior write.
* **conditional** — single-resource operations are immediately consistent and support optimistic
  concurrency: a representation carries an `ETag` {{RFC7232}}, a mutating request (`PUT`, `PATCH`,
  `DELETE`, or an action) MAY carry `If-Match` / `If-None-Match`, and a precondition failure results
  in `412`. At this level the precondition is **best-effort**: the check and the write are not
  guaranteed to be one atomic compare-and-swap, so two concurrent writers MAY both pass `If-Match` and
  the later write wins (last-writer-wins under the precondition). A guaranteed atomic CAS — where at
  most one of two concurrent conditional writers succeeds — otherwise requires the **transactional**
  level, **unless the server advertises the `atomic-conditional` feature** ({{discovery}}): a server
  advertising that token guarantees that a single-resource `If-Match` check-and-write is performed as
  one atomic compare-and-swap, so at most one of two concurrent conditional writers to the same
  resource succeeds (the other receives `412`) even at the `conditional` level. A server that also
  advertises the `object-cas` feature additionally exposes this guarantee to verb code as a
  per-property compare-and-swap on the object capability (a write conditioned on the property's
  current value), letting a verb run a lost-update-free read-modify-write loop; both features are
  optional and advertised, so a server that omits them remains conformant at the best-effort behavior
  described above.
* **atomic-invocation** — additionally, all data a single verb invocation mutates is atomic: it
  commits on normal return and is discarded on trap or limit failure. At this level a server MUST
  NOT admit the `object-cas` compare-and-swap within an invocation — the call MUST fail without
  writing — and MUST NOT advertise the `object-cas` feature: a compare-and-swap commits against
  committed state synchronously and therefore cannot join a buffered frame. A server MAY re-admit
  it at this level only by committing the compare-and-swap atomically with the invocation's write
  set.
* **transactional** — additionally, a same-server composition tree ({{composition}}) executes as one
  atomic, serializable transaction (mirroring the single shared budget); a conflict between
  concurrent invocations is resolved by aborting and optionally retrying one, and an unresolved
  conflict fails with `409`.

A server advertises the highest level it guarantees; a verb MAY declare a minimum level it requires
({{conformance}}), and a server that cannot meet it MUST refuse the verb. These levels describe
*observable guarantees only* — the storage engine, durability, and any replication or
distributed-consistency mechanism are entirely implementation-defined. Cross-server invocations are
always independent of each other; end-to-end retry safety across servers uses idempotency keys
({{taxonomy}}).

Verbs are **stateless**: no state survives between invocations, and all persistent state lives in
object data. Cross-object references are expressed as links ({{representations}}); referential
integrity (cascades and so on) is application-defined, not part of this protocol.

# Collections: Listing, Pagination, Filtering, Field Masks {#collections}

For a `GET` on a collection, servers SHOULD follow the Google API Design Guide query conventions.
REST:ACT spells the pagination parameters in **camelCase** to match the object listing
({{object-listing}}) and the discovery document: `pageSize` and an **opaque** `pageToken`, returning
`nextPageToken` {{AIP158}}; a `filter` expression {{AIP160}}; and an `orderBy` parameter. A `pageToken`
is opaque to the client (a server-defined cursor); a client MUST treat it as such and MUST NOT
construct or mutate one, and a server MAY expire a token (a stale token yields `400 invalid-input`).
For partial reads and writes, servers SHOULD support field masks {{AIP161}}: a `readMask` query
parameter selecting fields on `GET`, and an `updateMask` on `PATCH` (with `*` meaning full
replacement).

# Asynchronous Operations {#operations}

A verb whose execution may exceed an interactive time bound MAY be invoked asynchronously.

**Election.** A client requests asynchronous handling with the `Prefer: respond-async` header
{{RFC7240}} on the invocation; a server MAY also elect async on its own for a verb it advertises as
always-asynchronous (the per-verb `asyncOperation` discovery field, {{discovery}}). When async
handling occurs the server responds `202 Accepted` with a `Location` header naming an operation
resource under `/operations/`. A server that does not support async handling ignores the preference
and runs the verb synchronously.

**Resource and states.** The operation resource, following {{AIP151}}, reports at least `done`
(boolean); while running, `done` is false; on completion `done` is true with either a `result` or an
`error` (Problem Details, {{errors}}), plus OPTIONAL `metadata`. A client polls with `GET`. `DELETE`
requests **best-effort cancellation** and returns `200`; a cancelled operation completes `done` with
an `error`.

**Access scoping.** An operation is **owner-scoped**: only the principal that started it may poll or
cancel it. Any other principal — and a non-existent or expired id — MUST receive `404` (absent-
indistinguishable: the id is not a cross-tenant handle, and the response is no existence oracle). The
operation id MUST be opaque and SHOULD be unguessable, so a sequential value cannot be used to
enumerate other callers' operations.

**Retention.** Completed operations are retained for a bounded, server-defined window and MAY be
evicted; an evicted id reads as `404`. A server SHOULD retain a completed operation long enough for
the initiating client to retrieve its result at least once.

# Events, Triggers, and Scheduling {#events}

Beyond client-initiated invocation, a server MAY support **server-initiated** invocation, running a
verb in response to an event or a schedule. This entire section is OPTIONAL; a server that does not
support it remains conformant.

An **event** is a message with a name and payload, associated with a **topic**, where a topic is an
object path: events concerning `/rooms/tavern` are published on that path. A verb MAY publish an
event through a host capability ({{capabilities}}); publishing is the only new primitive —
everything that *handles* an event is an ordinary verb. There are three handling mechanisms, each
reusing existing constructs:

* **Lifecycle hooks** are reserved verb names beginning with `on` (for example `onCreate`,
  `onDelete`, `onChange`, `onEnter`). When a server performs the corresponding operation on an
  object, it invokes that object's hook verb if one is defined, resolved up the inheritance chain
  ({{resolution}}) — exactly as accessor verbs ({{active-properties}}) mediate data access. A server
  MAY support the **data-plane CRUD subset** of lifecycle hooks independently of the rest of this
  section, advertised by the `lifecycle-hooks` feature token. A server that advertises it MUST treat
  `onCreate`, `onChange`, and `onDelete` as reserved verb names that MUST be actions ({{taxonomy}}), and
  MUST, after a data-plane mutation on an object path commits, invoke that object's matching hook if
  one resolves: `PUT` fires `onCreate` when the object did not previously exist and `onChange` when it
  did, and `DELETE` fires `onDelete` (after the delete). The hook runs through the ordinary invocation
  path under **registrant authority**: as the principal who registered the hook (its owner), charged to
  that owner's quota and bound by the same limits and the hook's own `execute` policy — NOT as the
  caller who triggered it. The triggering caller's identity is conveyed to the hook only as
  informational input, granting no authority; this prevents a hook that auto-fires on a third party's
  write from acting with that writer's identity (reading the writer's data or claims and exfiltrating
  them). Firing is **best-effort**: a hook error or trap does not roll back or fail the mutation (the
  mutation is the client's authoritative intent). A hook paused by an operator's ownership recovery
  is not invoked ({{admin-reown}}). A server MUST bound a hook→write→hook chain (e.g. a
  maximum hook-firing depth). To bound fan-out further, a server MAY restrict this subset to fire only
  on the data plane and not on accessor-mediated or capability-mediated writes.
* **Subscriptions** bind a topic to a target verb. A subscription is an ordinary resource, created
  and removed with the standard methods; a server that supports eventing invokes the target verb
  when a matching event is published. A subscription is **read-gated** like an SSE stream
  ({{event-sse}}), against the registering principal, both when it is created and at every delivery
  ({{verb-subscriptions}}).
* **Schedules** bind a time or recurrence to a target verb in the same way, providing timer and
  heartbeat behavior.

A server-initiated invocation has no request caller; it executes with the **authority of the
principal that registered** the trigger or schedule, captured at registration time and attenuated
to what the handler requires ({{authz}}), with cost attributed to that principal. Each firing is a
distinct invocation, atomic where the server's consistency level provides it ({{consistency-txn}}),
bounded by the usual limits ({{limits}}) and, for fan-out, by the composition rules
({{composition}}).

## Publishing events {#event-publish}

The **event-publish capability** is a gated host capability ({{capabilities}}), granted to a verb the
same way as composition and object-data access (deny-by-default; a deployment MAY withhold it from a
verb that declares it). It exposes one operation, `publish(topic, name, data)`, which appends an
event (a name and an opaque payload) to the named topic's event log. The topic MUST be a
client-addressable object path. Because publishing is an observable side effect, a **function MUST
NOT publish** ({{taxonomy}}); a server MUST refuse a publish attempt by a function with `403`
`forbidden-side-effect`. A server MAY additionally **auto-publish** a system event to an object's
topic when that object is mutated through the data plane, so subscribers observe mutations without a
guest hook. A server that auto-publishes these system events MUST name them after the corresponding
lifecycle hooks: `onCreate`, `onChange`, and `onDelete`. A server that supports the publish
capability advertises it in discovery ({{discovery}}); a deployment MAY disable eventing entirely,
in which case the capability and the SSE surface ({{event-sse}}) are both withdrawn and the
discovery token is omitted.

**Reserved host topics.** A server MAY publish its own operational lifecycle events — a checkpoint
starting and finishing, for instance — on topics in a **reserved namespace** of its own. Such a
topic is deliberately NOT a client-addressable object path: it is distinguished by a syntactic form
the path grammar ({{addressing}}) cannot produce, so that the rule above ("the topic MUST be a
client-addressable object path") makes the namespace unspeakable by a verb's `publish` and by the
data plane alike. That is what keeps it a one-way channel — by construction, rather than by an ACL
that could be misconfigured. The reference host reserves paths whose first segment begins with `@`
(for example `@host/checkpoint`).

Because a reserved host topic has no backing object, the read gate of {{event-sse}} — the same
authorization as reading the object — has nothing to evaluate. A server MUST NOT treat that as
open: it MUST require an authenticated principal to subscribe to a reserved host topic, on any
deployment where authentication is configured at all. Verb subscriptions ({{verb-subscriptions}})
MAY bind a target verb to a reserved host topic and fire under registrant authority exactly as for
any other topic; the same rule is their read gate, applied to the registering principal at
registration and again at every delivery. Both are read-side carve-ins only; neither creates a way
to publish into the namespace. A server that reserves such a namespace MUST document the reserved
form and the topics it publishes.

A server that advertises the **`targeted-invalidation`** feature ({{discovery}}) MUST auto-publish
the lifecycle event on every committed object mutation — a data-plane `PUT`/`DELETE` AND a verb's
object capability (`set`/`set-at`, and delete where a deployment profile exposes one) alike, closing
the base rule's data-plane-only scope for such a server. Its auto-published payload MUST be a JSON
object carrying at least an `object` member (the mutated object's path — the target this feature
turns on); a `subject` member (the triggering principal) MAY also be present. The event name is
carried on the transport as usual ({{event-sse}}), never inside this payload as a separate
requirement. The payload MAY carry an `actor` member, and MUST carry one for a mutation made under
delegation ({{delegated-tokens}}) on a server advertising `delegated-tokens` and
`targeted-invalidation`.

### The read set of an invocation {#read-set-headers}

The `targeted-invalidation` feature has a second, response-side half: scoped delivery is only useful
to a client that knows **which objects a rendered view actually depends on**. A server that
advertises the feature MUST report that dependency set on the response to an invocation whose
representation is `application/vnd.restact.ui+json` (presentation verbs), using the response header

~~~
Restact-Read-Set: <path>[, <path>]*
~~~

whose value is a comma-separated list of object paths ({{addressing}}). The set is
**server-observed, not verb-declared**: it names the object paths the invocation read through the
object-data capability ({{object-data}}), including reads served by a page-granular query. A verb
declares nothing and needs no change to be covered; a server MUST NOT populate this header from any
value the verb or the request supplied, because a client uses it to decide what to re-fetch.

The header is host-asserted metadata and MUST be carried as a response header, never injected into
the verb-authored representation: the document is untrusted verb output, and a client MUST NOT read
invalidation scoping out of it.

**Disclosure filter, applied first.** The emitted set MUST contain only paths the **requesting
principal** could itself read directly — the same existence-and-read gate a data-plane `GET` on that
path would apply, evaluated against the requester, not against a switched execution principal
({{exec-identity}}). A view running under `runs_as=owner` or registrant authority may legitimately
read objects its caller cannot; reporting those paths would disclose their existence and full path
to that caller. The consequence is stated plainly: such a caller's view is under-invalidated on
exactly those objects and refreshes on the coarser ladder instead — staleness, never disclosure.

**Bounds and overflow.** A server MUST bound the header. The bound for this version is **32 paths
and 2 KiB of header value, whichever binds first** (a bound chosen to stay well inside the header
budgets of ordinary reverse proxies). When the filtered set exceeds either bound, the server MUST
omit `Restact-Read-Set` and instead emit

~~~
Restact-Read-Set-Coarse: <path>
~~~

whose value is the **deepest common ancestor of the already-filtered set** and means "any change
under this path invalidates this response". The coarse form MUST be a single, plain, grammar-valid
object path: never a wildcard or pattern form (the path grammar admits none, so a client validating
the value — as it MUST, both values being server-sent data — would reject it and silently fall back
to no invalidation at all), and never a truncated list (which would silently under-invalidate). The
exact/coarse distinction is carried by the **header name**, never by the value's grammar. The
filter-before-ancestor ordering is normative: computing the ancestor over an unfiltered set would
reintroduce, as a prefix, exactly the disclosure the filter removed.

**Absent rather than empty, and absent rather than wrong.** Neither header has an empty form. A
server MUST omit both when it has nothing correct to report — an invocation that read no object at
all, a response replayed from an idempotency record rather than freshly computed, a filtered set
with no common ancestor to coarsen to, or any condition under which the server knows its observation
was incomplete. A client MUST treat the absence of both headers as "scope unknown" and fall back to
whatever unscoped refresh it would have performed without this feature; a server MUST NOT emit a
narrower value than it can justify, since an under-stated read set is silently stale rendering,
which is the failure this feature exists to prevent.

Both header names are outside the CORS-safelist, so a server that supports browser clients
({{security}}) MUST expose them via `Access-Control-Expose-Headers` alongside the other REST:ACT
response headers it exposes. A server that does not advertise `targeted-invalidation` emits neither
header, and a client that does not see the token MUST NOT rely on them.

## Delivering events to clients (SSE) {#event-sse}

Delivery of events to *clients* (rather than to verbs) is a transport concern. A server that supports
eventing SHOULD support Server-Sent Events (the WHATWG/W3C `text/event-stream` mechanism): a `GET` on a topic's object path
with `Accept: text/event-stream` opens a live stream of that topic's events instead of returning the
object's representation (content negotiation on the data-plane `GET`). The stream is **read-gated by
the same authorization as reading the object** ({{authz}}): a client that could not `GET` the
object's representation MUST NOT receive its events. Each of the topic's OWN events carries a
monotonic id; a client MAY request **replay** of the topic's own retained events it missed by sending
`Last-Event-ID` (or an equivalent query parameter), and the server resumes after that id. A
subscriber that sends no cursor is making no claim about what it has already seen: a server MAY
begin the stream with the topic's retained events, and MAY instead begin at the live tail. A client
that requires only new events MUST therefore be prepared to receive retained ones it has already
observed, and SHOULD coalesce or discard them rather than treating each as a distinct change.
Retention is bounded and server-defined; a server MAY drop the oldest events and SHOULD signal a gap to a
lagging subscriber. A server MAY bound the number and lifetime of concurrent subscriptions.

A server that advertises **`targeted-invalidation`** MAY additionally accept a `?scope=subtree`
parameter (or an equivalent mechanism) on the subscribe request: an opted-in connection additionally
receives the lifecycle event for any committed mutation under the subscribed topic (not only the
topic itself), disambiguated from the topic's own events by the payload's `object` member — no new
event name. A subtree-delivered frame MUST NOT carry an `id`: the transport's event ids are commonly
allocated from a single space shared across all topics, so stamping a descendant's (typically higher)
id onto a frame delivered to a different topic's subscription would corrupt that subscription's own
replay cursor. Consequently, subtree-delivered frames are **not** retained on the subscribed topic and
are **not** subject to the replay guarantee above — that guarantee covers only a topic's own events,
delivered on its own subscription. Delivery of a subtree event is gated exactly as an ordinary
subscription would gate a direct subscription to the mutated object — the same read-authorization
rule stated above, evaluated per delivered object, not merely once at subscribe time against the
topic. For a deletion, a server MUST evaluate that gate against the authorization the deleted object
would have had **immediately before** its removal (the object's own policy if it had one, else its
governing context, precisely as a `GET` issued an instant earlier would have been gated) rather than
refusing outright merely because the object no longer exists — the event describes a past state, and
the gate must describe the authority over that past state, not the object's absence.

## Verb subscriptions (OPTIONAL, feature `verb-subscriptions`) {#verb-subscriptions}

A **verb subscription** binds a topic to a target verb ({{events}}): when an event is published on
the topic, the server invokes the target as a server-initiated invocation under the authority of the
principal that registered the subscription (the **registrant**), attenuated as {{events}} requires
and billed to that principal. A server that supports verb subscriptions advertises the
`verb-subscriptions` feature token ({{discovery}}). Delivering an event to a verb discloses it exactly
as delivering it to a client does, so a verb subscription is read-gated by the same authorization as
an SSE stream ({{event-sse}}), evaluated at two points.

**The registrant is the principal checked.** The read gate is evaluated against the registrant's
authority as it is attenuated for server-initiated execution (when that attenuation keeps only the
subject, a grant the registrant holds only through a role, group, scope, or claim does not admit
it). It is NOT evaluated against the execution identity the target verb runs under: a target that
runs as its owner ({{exec-identity}}) does not widen what the registrant may subscribe to, and the
server MUST NOT admit a registration or a delivery because the target's owner could read the topic.
The registrant chooses where the topic's events go, so the registrant's authority is what bounds
them; a target's execution identity can also change after registration (a redeploy, or a more
specific definition that later shadows a wildcard one, {{resolution}}).

**Attenuation never escapes a `deny` rule.** On a server that accepts `deny` rules ({{authz}}),
removing the registrant's roles, groups, scopes, or claims could otherwise widen what it may read: a
`deny` rule keyed on a matcher the attenuated registrant no longer carries would stop matching. Such a
server MUST treat every `deny` rule whose matcher depends on a role, group, scope, or claim as
**matching** the attenuated registrant, both at registration and at every delivery, so that
attenuation only narrows and never widens ({{path-scoped-tokens}}). A server that implements only the
deny-free simple profile is unaffected.

**At registration.** A server MUST refuse to create a subscription whose topic object the requesting
principal is not authorized to read ({{authz}}), and MUST give an absent topic and an unreadable
topic the same refusal: `404` `not-found`, the refusal an SSE subscribe to the topic gives the same
principal. A subscription to a topic that does not exist yet is therefore refused; the topic object
is created first. When the requester is authorized to read the topic but the attenuated registrant
authority is not, the server MUST refuse the registration, and SHOULD do so with `403` `forbidden`,
since that refusal discloses nothing the requester could not already learn by reading the topic. A reserved host topic
({{event-publish}}) has no backing object; it is subscribable only by an authenticated principal on
a deployment where authentication is configured, as for SSE.

**At every delivery.** Before it invokes the target for an event, a server MUST evaluate the read
gate again, against the registrant and the authorization in force when the delivery is made — not
the authorization in force when the subscription was registered. A policy change, the revocation or
granting of a read, a change to the topic's governing context ({{object-policy-inheritance}}), and
the topic's deletion therefore take effect at the next delivery, in both directions. For a deletion
event on the topic, the gate is evaluated against the authorization the topic had immediately before
its removal, exactly as for a subtree deletion over SSE ({{event-sse}}); if the server cannot
establish that authorization, it MUST NOT deliver. A subscription binds a path, not an object
identity: events for an object later re-created at the same path are gated by that object's own
authorization.

**A refused delivery is skipped.** It is not delivered, not retried, and not deferred. The target is
not invoked, no quota or cost is charged to the registrant, and the skip MUST NOT consume any
per-subscription rate allowance the server applies (such as a minimum interval between deliveries),
so that it never suppresses a permitted delivery of a later event. A skip is final: a server MUST
NOT deliver a skipped (subscription, event) pair later — including through a replay, a catch-up, or
a restart's drain of retained events — even if the registrant has since become authorized to read
the topic. A server that deduplicates deliveries across nodes can meet this by recording a skipped
pair exactly as it records a delivered one. A skip MUST NOT be observable to the registrant
through the subscription resource or any other surface (a skip count or timestamp would itself
disclose that the unreadable topic changed). A server SHOULD record each skip in an operator-facing
log identifying the subscription and the registrant; any such record MUST NOT carry the event's
payload, its name, or the principal that caused it.

A subscription registered before a server enforced this gate remains registered and is subject to
the delivery gate from then on; a server is not required to delete or re-validate it.

A server that advertises `verb-subscriptions` MUST implement both gates and MUST also advertise the
**`verb-subscriptions-read-gate`** feature token. A client that sees `verb-subscriptions` without
`verb-subscriptions-read-gate` is talking to a server that predates this rule and MUST NOT assume
that subscriptions are read-gated.

The wire representations of subscription and schedule resources (the request and response bodies
binding a topic or a time to a target verb) are server-defined; a server that advertises
`verb-subscriptions` or `schedules` MUST document their schemas.

# Errors {#errors}

Error responses MUST use Problem Details {{RFC9457}} with media type `application/problem+json`.
REST:ACT defines two extension members: `restact_code`, a stable lower-kebab-case token naming the
error condition, and `restact_verb`, the verb route in question (the path from the colon onward,
e.g. `:summarize`). The defined `restact_code` values and their HTTP status codes are:

| `restact_code` | Status | Meaning |
|---|---|---|
| `timeout` | 408 | wall-clock deadline exceeded |
| `cpu-budget` | 429 | compute/fuel budget exhausted |
| `quota` | 429 | per-tenant quota or rate exceeded |
| `memory-limit` | 507 | memory limit exceeded |
| `composition-cycle` | 508 | composition cycle or depth limit |
| `disallowed-import` | 403 | module imports a forbidden capability |
| `not-declared` | 403 | undeclared composition target |
| `forbidden` | 403 | caller not authorized for the action |
| `forbidden-side-effect` | 403 | a function attempted a side effect (write/publish/action call) |
| `invalid-call-graph` | 400 | a function declared a call to an action at deploy |
| `unauthorized` | 401 | authentication required (or invalid credential) |
| `unsupported-feature` | 501 | optional feature/level not supported |
| `unsupported-consistency` | 501 | operation not admitted at the server's consistency level (e.g. `object-cas` under `atomic-invocation`) |
| `conflict` | 409 | unresolved write conflict (transactional level) |
| `precondition-failed` | 412 | an `If-Match`/`If-None-Match` precondition failed |
| `property-final` | 409 | write to a write-once (`final`) data property |
| `object-too-large` | 413 | object data exceeds a per-object size/key cap |
| `not-found` | 404 | no such verb, object, or operation |
| `method-not-allowed` | 405 | the method does not match the verb kind, or is unsupported on a bare object |
| `object-binding` | 409 | a coupled object-binding mode ({{object-binding}}) refused the deploy/bind |
| `invalid-filter` | 400 | a malformed collection/listing `filter` ({{object-listing}}) |
| `invalid-component` | 400 | the uploaded bytes are not a valid Wasm component |
| `invalid-source` | 422 | source rejected by the runtime (parse/validation) |
| `invalid-input` | 400/422 | malformed or rejected input |
| `delegation-bound` | 403 | the credential is bound by delegation ({{delegated-tokens}}): a sub-token, a delegated token, or the actor of a live grant it has exchanged, on an act it may never perform; or a delegated request outside its grant's bounds |

Additional values MAY be registered ({{iana}}). For multi-field validation failures, a response MAY
include an `errors` array whose entries carry a `source` object with `pointer` and/or `parameter`
members (the convention of {{JSONAPI}}). For gRPC interoperability a server MAY include a
`restact_grpc_code` member carrying the `google.rpc.Code` name as a string (e.g.
`RESOURCE_EXHAUSTED`).

# Discovery {#discovery}

A server MUST support `OPTIONS` on object, verb, and verb-property paths, reporting the methods and
properties it supports there. A conformant server MUST publish a discovery document at
`/.well-known/restact` describing the **optional features it supports**, its **consistency
level** ({{conformance}}, {{consistency-txn}}), and its **object-binding mode** ({{object-binding}}),
and the available verbs — their kind (function/action), binding, declared capabilities and call
graph, applicable limits, and accepted source languages. The document is a JSON object and, at a
minimum, MUST carry:

* a `service` object with a `features` array (the advertised feature tokens, from the registry in
  {{iana}}), a `consistency` string, and the per-verb default `limits`; and
* a `verbs` array, each entry naming a verb's `route` and a `verb` object giving its `kind`
  (`function`/`action`), `binding`, declared `capabilities` (the interface ids) and `callGraph`, and
  `limits`.

A server MAY add further fields; clients MUST ignore unknown ones. The full schema (including each
optional feature's fields) is defined by the companion OpenAPI extension ({{iana}}), which extends
but does not contradict this minimum.

A server MAY additionally advertise a `service.openapi` member: a URI reference, resolved relative to
the discovery document's own URL, naming an OpenAPI document that describes the server's live surface
(conventionally `/openapi.json`). A server that advertises it MUST also advertise the
`openapi-document` feature token, and the referenced document SHOULD carry the companion extension's
`x-restact` (service-wide) and `x-restact-verb` (per-operation) members so a generic OpenAPI client
can recover the REST:ACT semantics. The document MUST NOT reveal more than the unauthenticated
discovery document does. This lets a client discover the OpenAPI description from the server itself
rather than being handed it out of band; it is a convenience, not a substitute for the discovery
document or `OPTIONS`.

These channels have defined roles: **`OPTIONS`** is authoritative for the capabilities of a
specific path (mandatory, evaluated live); the **`/.well-known/restact`** document is the
service-level manifest (and MAY be cached); the **`$verbs`** representation field
({{representations}}) is a convenience link map into each verb's **`meta`** ({{verb-properties}}),
which is the per-verb authoritative record.

# Relationship to Google AIP and JSON:API

This section is informative. REST:ACT is a compatible extension of the Google API Design Guide:
its object/collection model follows {{AIP122}}; its data-method semantics follow the standard
methods; its verb invocation adopts {{AIP136}} custom methods, extending them by treating the
colon-verb as a traversable object rather than a terminal token (AIP-136 is silent on what follows
a custom method, so this is a non-conflicting superset). Pagination {{AIP158}}, filtering
{{AIP160}}, field masks {{AIP161}}, and operations {{AIP151}} are adopted as described above. From
JSON:API {{JSONAPI}}, REST:ACT borrows the optional relationship/HATEOAS representation and the
`source.pointer` error convention. REST:ACT does not adopt JSON:API as its native representation,
nor gRPC-style status objects.

# Security Considerations {#security}

REST:ACT servers execute untrusted, possibly malicious code on behalf of clients. The following
risks are inherent and several have no complete solution; implementers MUST treat the runtime as
part of the trusted computing base and adopt defense in depth.

* **Sandbox escape.** Bugs in the WebAssembly compiler/runtime can yield host memory access.
  Implementers MUST track and rapidly patch runtime advisories and SHOULD add operating-system
  process or microVM isolation between tenants as defense in depth.
* **Spectre and microarchitectural side channels.** In-process isolation does not fully mitigate
  speculative-execution attacks. High-sensitivity deployments SHOULD isolate tenants at the
  process or virtual-machine level and SHOULD reduce timer precision exposed to verbs.
* **Resource exhaustion and denial-of-wallet.** Unbounded compute, memory, fan-out, or
  outbound requests can exhaust the host or run up costs, an effect amplified by autoscaling
  back ends. Servers MUST enforce per-invocation limits ({{limits}}) and a single shared budget
  across composition trees ({{composition}}), and SHOULD enforce per-tenant quotas with
  fail-closed circuit breakers and spending caps applied before dispatch to any metered back end.
* **Autonomous execution.** Triggered, subscribed, and scheduled verbs ({{events}}) run without a
  connected client and are a denial-of-wallet and amplification vector (event storms, runaway
  schedules). A server MUST bound them by the registering principal's quota and the per-invocation
  limits, and SHOULD rate-limit event fan-out and scheduled firings.
* **Metering evasion.** Instruction-level compute accounting correlates imperfectly with wall-clock
  cost; servers SHOULD enforce an independent wall-clock limit as a backstop.
* **Confused deputy.** Granting a verb authority broader than its task risks misuse. The
  runs-as-caller rule ({{exec-identity}}) and capability attenuation ({{composition}}) bound a
  verb to the caller's own authority and its declared capabilities.
* **Cross-principal interaction.** When a verb runs in response to another principal's action, the
  platform MUST NOT expose that principal's credentials or private data to the verb beyond what its
  policy and the verb's declared capabilities permit.
* **Disclosure through subscriptions.** An event carries metadata (that an object exists, when it
  changed, and who changed it) and may carry content a verb published. A verb subscription is a
  standing delivery channel with no lifetime bound, so a server MUST read-gate it against its
  registrant at registration and at every delivery ({{verb-subscriptions}}); a gate at registration
  alone would let a revoked reader keep receiving a topic's events indefinitely, and a gate keyed to
  the target verb's execution identity would let any principal route a topic into a runs-as-owner
  verb whose owner can read it.
* **Memory-unsafe source languages.** Compiling C/C++ to WebAssembly does not confer memory safety
  within the verb's own linear memory; servers handling security-sensitive verbs SHOULD prefer
  memory-safe languages or additional analysis.
* **Supply chain and AI-generated code.** Uploaded modules — including AI-generated ones — may be
  subtly malicious and are not reliably detectable by static analysis at scale. Servers SHOULD
  content-address and sign stored modules, record provenance tied to the uploader's identity, and
  complement static checks with runtime behavioral monitoring.
* **Precompiled artifacts.** A server that caches a precompiled native artifact MUST treat it as
  trusted only if the server itself produced it and its integrity is verified (e.g. by content
  hash) before use; precompiled artifacts received from clients MUST NOT be executed as native
  code.
* **Verb seizure (route hijack).** A verb's program, policy, and registration are
  ACL-protected data. A deployment or management interface that registers over an existing
  route without evaluating the existing verb's policy lets any principal replace another's
  code — which subsequent callers then execute with *their own* authority
  ({{exec-identity}}) — or reopen its policy. Servers MUST apply the replacement rule of
  {{deployment}} on every such interface, including bulk or out-of-band deployment tooling.
* **Declaration is not a grant.** A data-property declaration can only narrow access to the objects
  its route reaches. Were a property ACL able to admit a principal the object's policy refuses, any
  principal able to declare a property on a verb whose route reaches another principal's object could
  open it. Declarations can still narrow, hide (a read ACL), make a member write-once (`final`), or
  supply values (`inherit`, `default`) across every object their route reaches, so who may declare is
  itself an authority: under a coupled object-binding mode ({{object-binding}}) only the owner of the
  route's deepest concrete ancestor may.
* **Binding under authentication.** Under `implicit`, a verb's binding does not depend on owning the
  object it is bound under, so on a server with more than one authenticated principal any caller can
  bind a verb, a reserved accessor, a lifecycle hook or a property declaration on an ancestor of
  another principal's objects and act on their requests to it. Coupled modes tie each binding to
  ownership of the bound object, and a coupled mode protects only ancestors that exist.
* **Pushed authority (ownership reassignment).** Code that runs under its owner's authority, a
  lifecycle hook or a runs-as-owner verb, must run only as a principal that chose it. A server that
  let a resource's owner be reassigned would let any principal able to deploy code make another
  principal its owner and then trigger it. Servers MUST keep ownership fixed ({{ownership}}). An
  operator recovery act MUST withdraw the runs-as-owner opt-in and pause the hooks on what it
  moves ({{admin-reown}}), so a reassignment by the operator does not do the same thing.

* **Delegation.** A grant ({{delegated-tokens}}) lends a user's authority to an actor, and what
  survives its revocation is stated plainly: revocation stops delegated tokens, the schedules,
  subscriptions and elevated code installed under the grant, but NOT the data the actor wrote, the
  shares it made (it can never give anything away, {{ownership}}), the ordinary verbs it deployed,
  or the connector wiring it created. A role snapshot goes stale until the grant is renewed. A server accepting cookie-borne
  sessions on the grants API MUST apply its cross-site request forgery defense there, because a
  forged grant creation hands the forger a credential.

Authentication and authorization are as described in {{authz}}; transport MUST be protected with
TLS.

# IANA Considerations {#iana}

This document requests the following registrations (details to be completed in a later revision).

* **Media type** `application/restact+json` for REST:ACT native representations.
* **Media type** `application/vnd.restact.ui+json` for presentation-verb UI documents
  (`presentation-verbs.md`).
* A well-known URI {{RFC8615}} `restact` for the discovery document ({{discovery}}).
* A **"REST:ACT Verb Property Names"** registry (initial entries `code`, `policy`, `meta`),
  registration policy Specification Required {{RFC8126}}.
* A **"REST:ACT Capability Interfaces"** registry for standard host interfaces ({{capabilities}}),
  registration policy Specification Required.
* A **"REST:ACT Source Languages"** registry mapping source media types to handling requirements
  ({{languages}}), registration policy Specification Required.
* A **"REST:ACT Feature Tokens"** registry naming the optional-feature tokens a server advertises in
  discovery ({{conformance}}, {{discovery}}), registration policy Specification Required; initial
  entries in `registries/feature-tokens.md`. A token names one independently-observable
  optional behavior, names are permanent, and a feature whose contract changes incompatibly takes a
  new token rather than redefining an existing one. This document deliberately does not restate the
  token list inline: the registry file is the single enumeration, mirrored machine-readably by the
  companion OpenAPI extension's `featureToken` enum.
* A **"REST:ACT Error Codes"** registry for the `restact_code` tokens ({{errors}}), registration
  policy Specification Required, seeded with the values in the {{errors}} table (including
  `forbidden-side-effect`, `invalid-call-graph`, and the `invalid-input`/`invalid-filter`/
  `object-binding`/`unsupported-feature` conditions).
* The **`delegation-bound`** error code ({{errors}}), and the two provisional token-type URIs
  `urn:restact:params:oauth:token-type:grant` and
  `urn:restact:params:oauth:token-type:grant-secret` ({{delegated-tokens}}); and the reserved object
  paths `tokens/grants` (and everything beneath it) and `tokens/exchange` under `/v1/`
  ({{delegated-tokens}}).
* A **"REST:ACT UI Catalog Node Types"** registry for the presentation-verb component catalog
  (`presentation-verbs.md`; initial entries in `registries/ui-catalog-nodes.md`),
  registration policy Specification Required, additive-only.

If no registrations are ultimately required, this section will state that this document has no IANA
actions.

--- back

# Guest Contract (WIT package `rest-act:plugin`) {#appendix-wit}

This appendix is normative. The standard host interfaces a verb may import are defined by the WIT
package `rest-act:plugin@0.1.0`. The full WIT text is the authoritative artifact (carried in the
reference distribution as `wit/*.wit`); this appendix summarizes its interfaces and worlds, which a
component targets to declare its capability manifest. The package comprises:

* `types` — shared types (`payload = list<u8>`, the structured `invocation-error`, `log-level`).
* `host` — the ambient minimal interface: `log(level, message)`. Always granted.
* `identity` — the ambient read-only caller view (feature `caller-identity`):
  `subject`/`is-anonymous`/`roles`/`scopes`/`claim`. Ungated; grants no authority.
* `compose` — `invoke(verb, input) -> result<payload, invocation-error>` (feature `composition`,
  gated; deny-by-default per the declared call graph and {{composition}}).
* `object` — the object-data capability (feature `object-data-access`, gated):
  `get`/`set`/`get-at`/`set-at`/`shape`/`shape-at`, plus the separately-advertised
  `set-at-if` (feature `object-cas`), `query` (feature `verb-object-query`) and `path` (feature
  `object-self-path`) ({{object-data}}).
* `event` — `publish(topic, name, data) -> result<_, invocation-error>` (feature
  `event-subscriptions`, gated; {{event-publish}}).

Worlds compose these for a component to target, exactly as in `wit/*.wit`:

* `plugin` — `host` only (the frozen base world, `world.wit`).
* `plugin-compose` — `plugin` plus `compose`.
* `plugin-identity` — `plugin` plus `identity`.
* `plugin-object` / `plugin-object-compose` — the object worlds; each adds `object` AND the ambient
  `identity` view (`plugin-object-compose` also has `compose`).
* `plugin-object-event` / `plugin-object-compose-event` — add `event` to the two object worlds.

The ambient `identity` interface is thus reachable from the `plugin-identity` and object worlds, not
from bare `plugin`/`plugin-compose`, and the `event` capability extends only the two object worlds. New
capabilities are added as new interfaces and new worlds in the SAME package WITHOUT changing an
existing interface ({{wit-contract}}); a server links the superset of worlds it supports and advertises
the corresponding feature tokens.

# Implementation Status and Experience

A reference implementation (a Rust host on the Wasmtime engine) and a security-focused tracer-bullet
have demonstrated the core execution and safety model: capability-denied execution, enforced
wall-clock / compute / memory limits, an upload pipeline with import allow-listing and content
addressing, and host-mediated composition with a declared call graph, cycle detection, and a shared
budget. Observed behavior informed the default limits referenced in {{limits}}.

# Acknowledgments

The protocol draws on OData Actions/Functions {{ODATA}}, the Google API Design Guide {{AIP136}},
JSON:API {{JSONAPI}}, and the WebAssembly Component Model and WASI {{WASI}}.
