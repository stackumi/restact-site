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
  RFC8288:
  RFC6749:
  RFC6750:
  RFC7240:
  RFC8259:
  RFC5234:
  RFC3986:
  RFC8615:
  RFC8785:
  RFC6901:
  RFC7493:
  RFC6839:
  JSON-SCHEMA:
    title: "JSON Schema: A Media Type for Describing JSON Documents (draft 2020-12)"
    target: https://json-schema.org/draft/2020-12/json-schema-core
  JSON-SCHEMA-VALIDATION:
    title: "JSON Schema Validation: A Vocabulary for Structural Validation of JSON (draft 2020-12)"
    target: https://json-schema.org/draft/2020-12/json-schema-validation
informative:
  RFC8126:
  RFC2104:
  RFC4648:
  RFC7519:
  RFC8693:
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
  FIELDING:
    title: "Architectural Styles and the Design of Network-based Software Architectures (doctoral dissertation, University of California, Irvine)"
    author:
      -
        ins: R. Fielding
        name: Roy T. Fielding
    date: 2000
    target: https://ics.uci.edu/~fielding/pubs/dissertation/top.htm
  WASI:
    title: "WASI 0.2 and the WebAssembly Component Model"
    target: https://component-model.bytecodealliance.org/
  IDEMPOTENCY:
    title: "The Idempotency-Key HTTP Header Field (draft-ietf-httpapi-idempotency-key-header)"
    target: https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-idempotency-key-header
  FETCH:
    title: "Fetch (WHATWG Living Standard)"
    target: https://fetch.spec.whatwg.org/
  FETCH-METADATA:
    title: "Fetch Metadata Request Headers (W3C Working Draft)"
    target: https://www.w3.org/TR/fetch-metadata/
  RFC6454:
  RESTACT-PRESENTATION:
    title: "REST:ACT Presentation Verbs"
    author:
      -
        ins: N. Byrd
        name: Nathan Byrd
    date: 2026-11
    seriesinfo:
      Internet-Draft: draft-byrd-restact-presentation-00
    target: https://github.com/stackumi/restact/blob/main/draft-byrd-restact-presentation-00.md
  RESTACT-CONNECTORS:
    title: "REST:ACT Connectors"
    author:
      -
        ins: N. Byrd
        name: Nathan Byrd
    date: 2026-11
    seriesinfo:
      Internet-Draft: draft-byrd-restact-connectors-00
    target: https://github.com/stackumi/restact/blob/main/draft-byrd-restact-connectors-00.md
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
  RESTACT-EVENTS:
    title: "REST:ACT Events"
    author:
      -
        ins: N. Byrd
        name: Nathan Byrd
    date: 2026-11
    seriesinfo:
      Internet-Draft: draft-byrd-restact-events-00
    target: https://github.com/stackumi/restact/blob/main/draft-byrd-restact-events-00.md
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
  RESTACT-MCP:
    title: "REST:ACT Model Context Protocol Facet"
    author:
      -
        ins: N. Byrd
        name: Nathan Byrd
    date: 2026-11
    seriesinfo:
      Internet-Draft: draft-byrd-restact-mcp-00
    target: https://github.com/stackumi/restact/blob/main/draft-byrd-restact-mcp-00.md
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

A REST:ACT server is meant to grow from the inside: a client deploys a verb through the same HTTP
interface it uses to invoke one, because a verb is an object and its code is one of its properties
({{deployment}}). Deployment is an optional feature, and a server whose verbs arrive by other means
still conforms, but a client with the authority to deploy can extend a server without leaving the
protocol.

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

Fielding's dissertation {{FIELDING}} classifies mobile-code styles in its Section 3.5. REST adopts
one of them, Code on Demand (Section 3.5.3), as an optional constraint (Section 5.1.7): code moves
from the server to the client, which executes it. Uploading a verb moves code the other way, from
the client to the server, which executes it using resources it holds. That is the Remote Evaluation
style (Section 3.5.2), with the server's sandbox in the role of the virtual machine (Section 3.5.1).
The dissertation names the costs of Remote Evaluation as lost visibility, since the server receives
code instead of standard requests, and the need to trust the client's code. REST:ACT answers both.
A verb is an addressable resource with a descriptor in discovery and in `:verb/meta`, so it stays
visible. It runs capability-confined and metered, under the caller's own authority, so the server
does not have to trust it. Each invocation is an ordinary `GET` or `POST` on a resource, and the
code travels once, as the representation of the verb.

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
: An authenticated identity: a subject and the claims that policy reads, which the server
  establishes for a request through an authentication mechanism such as an OAuth 2.0 / OIDC bearer
  token or the authentication of an application the server is mounted in (see {{authentication}}).

Caller:
: The principal that invoked a verb. In this version a verb executes with the caller's authority
  (see {{exec-identity}}).

Capability:
: A host interface a verb is permitted to import. Verbs have no ambient authority; a capability
  not declared is unreachable.

Host / Implementation:
: A server implementing this protocol.

Base URL:
: The URL a server's interface is rooted at: a scheme, an authority and a path **prefix**. The
  prefix is empty for a server that owns its origin, and is the mount point for a server that runs
  inside another application. See {{base-url}}.

# Protocol Overview

A REST:ACT server is a tree of objects addressed by path. Each object has:

* **Data** — its representation, accessed with the standard HTTP methods on the object's path.
* **Verbs** — uploaded programs, addressed with the colon separator and invoked over HTTP.

The path hierarchy is a **single-inheritance** chain: invoking a verb on `/a/b/c` resolves the
verb by searching `c`, then `b`, then `a`, then the root, and runs the first definition found,
bound to `c` ({{resolution}}). A verb is itself an object and therefore has its own properties,
addressed as `/obj:verb/<property>` ({{addressing}}).

# Conformance and Feature Discovery {#conformance}

REST:ACT is designed to be implementable across a wide range of deployments — from a stateless
function-as-a-service gateway to a monolithic, transactional, real-time server. To make this
possible the **mandatory core is small**, and nearly everything else is an **optional feature** that
a server implements independently and **advertises** in its discovery document ({{discovery}}).

A conformant server MUST satisfy every requirement of this document that binds it. Each requirement
binds the servers its own wording names. A requirement stated for a server that implements a
feature, offers a mechanism, or does something this document permits but does not require binds
such a server, whether or not it advertises a feature token. A requirement stated for a server that
advertises a feature token binds only a server that advertises it. A requirement on a server stated
with no such condition binds every conformant server, in whichever section it is stated. A
requirement stated for a client binds every client that uses the mechanism or feature it concerns,
and a page or program that calls a server on a user's behalf is such a client. A server's
conformance does not depend on its clients'.

In summary, and not exhaustively, the mandatory core of a server is:

* the addressing grammar ({{addressing}}) and verb **invocation** with the function/action method
  semantics ({{taxonomy}}), including a function's input in the `?input=` query parameter;
* **capability confinement** (deny-by-default; {{capabilities}}) and enforced per-invocation
  resource **limits**, at least a wall-clock limit and a memory limit ({{limits}}), for any verb it
  executes;
* the **runs-as-caller** authority rule ({{exec-identity}});
* **Problem Details** error responses ({{errors}});
* `OPTIONS` on object, verb and verb-property paths ({{discovery}});
* a **discovery** document ({{discovery}}) carrying the feature tokens it supports (the core tokens
  among them), its consistency level ({{consistency-txn}}), its object-binding mode when that is not
  `implicit`, and the verbs available to the caller;
* the `strict` default under authentication, below, on a server that supports a `strict`
  object-binding mode;
* the refusal of a cross-origin request ({{security}}) on a server that accepts a credential a
  browser attaches on its own or lets an anonymous caller change state; and
* TLS on its transport, except over a loopback interface ({{security}}).

Optional features, each implemented and advertised independently, include: the object **data** plane
(stored representations and their CRUD, {{object-noun}}; token `data-plane`); verb **code management** and which non-`application/wasm`
source languages are accepted; **composition**; **asynchronous operations**; **conditional
requests** on the data plane and a **consistency level** above `eventual` ({{consistency-txn}}); the read-only **caller identity**
({{caller-identity}}), pairwise unless the operator discloses the real one; and collection **pagination/filtering/field masks**. The features that the
extension documents define are optional in the same way ({{extensions}}).

A client MUST NOT assume an unadvertised feature is present. A verb MAY declare, in its verb
metadata ({{verb-properties}}), the features and the minimum consistency level it requires; a server
that cannot satisfy a requirement declared there MUST refuse to deploy or invoke the verb and SHOULD
respond `501` (`unsupported-feature`). The capabilities a verb uses are declared differently, by the
interfaces its component imports, and a server refuses at upload a component that imports an
interface or method it does not permit or does not implement, with `403` (`disallowed-import`)
({{capabilities}}). The same verb can
thus run unchanged on any server meeting its declared requirements, while a minimal server stays
minimal.

A verb's declarations — its kind (function/action), required capabilities, declared call graph, and
minimum consistency level — are carried by the component's imported interfaces (for capabilities)
and by its verb metadata ({{verb-properties}}); the concrete schema is fixed by the companion
OpenAPI extension. A minimal or function-as-a-service server MAY omit the object data plane and code
management entirely and accept only verbs deployed out of band: verb existence (a mapping from path
to defined verbs) is independent of whether the server stores object data. This decoupling is the
`implicit` **object-binding** mode, the one this document defines. A server MAY instead couple the
two planes, treating the object as the entity that owns its verbs, and a server that couples them
advertises the coupling. A server that supports a `strict`
object-binding mode (one that refuses to deploy a verb on an object that does not exist, and ties
the verb to the object's owner) and has any authentication configured ({{authz}}) MUST default to `strict`
unless its operator explicitly chooses another mode, whatever features it advertises, and SHOULD
warn its operator when that choice is `implicit`; a server with no authentication configured SHOULD
default to `implicit`.

## Extension specifications {#extensions}

A REST:ACT **extension** is a separate specification that adds optional behavior on top of this
document. An extension:

* registers each feature token it defines in the REST:ACT Feature Tokens registry
  ({{iana}}), and any other registry entries it needs, under the registries' Specification
  Required policy;
* MUST NOT redefine a feature token, field, member name, path, error code or media type that this
  document defines or reserves;
* is OPTIONAL, and a server that implements it advertises its feature token(s) in discovery like
  any other feature; a client MUST NOT assume an extension that is not advertised.

While a server advertises an extension's feature token, the extension MAY add requirements for
that server, including refusals of requests that this document defines. An extension's server
requirements on a mechanism that one of its feature tokens covers bind only a server that advertises
that token. Two sets of rules are the exception. Each also binds a server that implements the feature it names but does not advertise
that feature's token:

* the rules the "Delegated tokens (OPTIONAL, feature `delegated-tokens`)" section of {{RESTACT-DELEGATION}} sets for a server that implements delegated tokens but does not
  advertise `delegated-tokens`;
* the rule that a server that implements targeted invalidation or webhook verification but does
  not advertise that feature's token (`targeted-invalidation` or `webhook-verification`) emits none
  of the response header fields that feature defines, which this section reserves (below).

A server that offers anything an extension defines, whether an endpoint, a verb, a capability
function, a request parameter or member, a response member, a header field, an error code or a
behavior, MUST advertise the extension's feature token that covers it in discovery ({{discovery}}).
So a server that offers an extension's feature is bound by that extension's requirements, and a
client that sees the feature in use can check discovery for its token.

A requirement that an extension places on a mechanism that none of its feature tokens covers binds
every server that offers that mechanism, whatever it advertises.

An extension MUST NOT relax a requirement of this document except at an extension point that this
section names, and then only while its token is advertised. The extension points are:

E1:
: An operator act that reassigns the owner of a resource ({{ownership}}).

E2:
: Invocations that the server starts without a request caller, each running under the authority
  of the principal that registered it as an attenuated principal, which keeps only that
  principal's subject ({{exec-identity}}, {{authz}}).

E4:
: The withdrawal of a runs-as-owner opt-in by an act defined at E1 ({{exec-identity}}).

E5:
: A meaning for a `null` member of a `PUT`, which this document otherwise refuses with
  `invalid-input` ({{representations}}).

E6:
: The policy that governs an object with no `$policy` of its own, which this document otherwise
  sets to `read: [public]`, `write: [owner]`, `delete: [owner]` ({{representations}},
  {{non-reader}}); and, where the extension lets one object's policy govern other objects, the
  owner who may set the `$policy` of each of them, whether or not it stores one, which this
  document otherwise makes the object's own owner.

E7:
: Serving a data-plane method on an object other than by reading or writing its stored data:
  through a defined accessor verb (the "Active Properties (Accessor Verbs)" section of {{RESTACT-OBJECTS}}), whose `execute` policy then governs that
  method, or by passing a member's value to a system outside the server without storing it, in
  which case the object's own policy still governs the method ({{object-noun}}).

E9:
: Exposing through the `identity` interface an identity value other than the runs-as-caller
  principal ({{caller-identity}}).

E10:
: A path deeper than a verb property: a `/name` segment after `/obj:verb/<property>`, or a second
  `:verb` segment ({{grammar}}).

E11:
: How an endpoint that an extension defines to carry another protocol's messages answers a
  refusal: in a message of that protocol, as the extension states, rather than as the HTTP status
  and Problem Details response this document requires ({{authz}}, {{errors}}).

E12:
: A verb's own response: the status and content of the response to an invocation, set by a verb
  that an advertised extension lets set them rather than by the server. The point covers a status
  that the extension admits and, for a status of `400` or more, content other than Problem Details
  ({{errors}}), including the tool result that the facet of {{RESTACT-MCP}} returns for it. It never
  extends to content of the media type `application/problem+json` or `application/problem+xml`,
  which stay the server's, so a client can tell the server's own refusals from a verb's response.

E13:
: The principal that the compute cost of an invocation, and of the call tree beneath it
  ({{composition}}), is attributed to, in place of the caller ({{exec-identity}}), for an invocation
  that reaches a verb through a mechanism an advertised extension defines. That principal accepted
  the cost by an act of its own that the extension defines, such as its own deployment of the verb
  with an option of that extension (a replacement that keeps or sets that option MUST be performed
  by that principal), and is never one that the request names or its sender chooses. The extension
  states how a server bounds the cost that such invocations attribute to that principal, so that
  they cannot exhaust the quota its own requests draw on. Only the attribution of cost changes: the
  authority the invocation runs with, and the principal its `execute` policy is evaluated against,
  stay as {{exec-identity}} sets them.

The labels E3 and E8 are not assigned.

This document reserves the following names, each for the meaning that this document, or the
extension that defines it, gives it:

* the object path `tokens/sub` under `/v1/` (the "Path-scoped sub-tokens (OPTIONAL, feature `path-scoped-tokens`)" section of {{RESTACT-DELEGATION}});
* the object paths `tokens/grants` and `tokens/exchange`, and every path beneath either, each
  under `/v1/` (the "Delegated tokens (OPTIONAL, feature `delegated-tokens`)" section of {{RESTACT-DELEGATION}});
* the path `/mcp`, relative to the base URL ({{base-url}}), for the endpoint of {{RESTACT-MCP}};
* object member names that begin with `$` or `@`, and the `inherit` member of `$policy`
  ({{representations}});
* the verb names `get`, `list`, `create`, `update`, `set` and `delete`, and the verb names that
  {{grammar}} reserves for lifecycle hooks;
* the verb property names `history` and `rollback` ({{verb-properties}});
* the event names `onCreate`, `onChange`, `onDelete` and `gap` ({{grammar}}).

This document reserves the response header fields `Restact-Read-Set` and `Restact-Read-Set-Coarse`
(the "The read set of an invocation" section of {{RESTACT-EVENTS}}). A server MUST NOT emit either unless it advertises `targeted-invalidation`.
It also reserves the response header field `Restact-Webhook-Replay` (the "Replay" section of
{{RESTACT-HTTP-VERBS}}). A server MUST NOT emit it unless it advertises `webhook-verification`.

A server MUST NOT give a reserved name any other meaning, whether or not it advertises the
extension that defines the name. This rule binds what the server itself does with the name.
Whether a client may use a reserved name is set where the name is defined, as {{grammar}} does for
verb names.

This document reserves the value `restact-delegated` of the `aud` claim of a bearer credential
(the "Delegated tokens (OPTIONAL, feature `delegated-tokens`)" section of {{RESTACT-DELEGATION}}). A server that does not advertise `delegated-tokens` MUST refuse with `401`
every bearer credential whose `aud` contains that value, whichever of its authentication mechanisms
({{authentication}}) accepts the credential, an application's own included.

Known extensions (informative): REST:ACT Presentation Verbs {{RESTACT-PRESENTATION}}, which defines
presentation verbs, the `application/vnd.restact.ui+json` media type, and the UI catalog node
registry, advertised by the `presentation-verbs` feature token. REST:ACT Connectors
{{RESTACT-CONNECTORS}} defines model completion, webhook delivery, the mediated outbound call and
the mediated secrets mount, advertised by the `llm-connector`, `webhook-connector`,
`mediated-egress` and `secrets-management` feature tokens. REST:ACT Objects and Data {{RESTACT-OBJECTS}} defines object listing and query,
declared data properties, prefix-inherited object policy, the object-binding modes, active
properties, the `object` capability, deployment history and conditional verb management; its
feature tokens include `object-data-access`, `object-listing`, `data-properties`,
`object-policy-inheritance`, `object-binding`, `active-properties`, `put-null-removes` and
`verb-history`. REST:ACT Events {{RESTACT-EVENTS}} defines lifecycle hooks, event publication and
subscriptions, schedules and targeted invalidation; its feature tokens include `lifecycle-hooks`,
`event-subscriptions`, `verb-subscriptions`, `schedules` and `targeted-invalidation`. REST:ACT
Identity and Delegation {{RESTACT-DELEGATION}} defines operator ownership recovery, path-scoped
sub-tokens, delegated tokens, client actors and object provenance; its feature tokens include
`admin-reown`, `path-scoped-tokens`, `delegated-tokens`, `delegated-client-actors`,
`identity-actor` and `object-provenance`. REST:ACT Model Context Protocol Facet {{RESTACT-MCP}}
defines a fixed set of Model Context Protocol tools over a server's verbs and objects, advertised
by the `mcp-facet` feature token. REST:ACT HTTP Verbs {{RESTACT-HTTP-VERBS}} defines verbs that
read declared request header fields and set their own response status, header fields and content
type, and webhook verification, advertised by the `verb-http-handler` and `webhook-verification`
feature tokens.

# Addressing {#addressing}

## Base URL {#base-url}

A server has one **base URL**: a scheme, an authority and a path prefix. The prefix is either empty
or one or more segments, each preceded by `/`, so it never ends with `/`. Each segment is a
`segment-nz` of {{RFC3986}}, Section 3.3, and is neither `.` nor `..`. A server that owns its origin
has the empty prefix. A server mounted inside another application, for example as middleware beside
that application's own routes, has its mount point as its prefix (`/restact`, say).

Every path that this document and its extensions write for a request is relative to the base URL:
the object, verb and verb-property paths of {{grammar}}, and the fixed paths such as
`/.well-known/restact`, `/v1/modules`, `/operations/{id}`, `/mcp` and `/admin/reset`. The URL of a
request is the base URL followed by that path, joined as text. A base URL given to a client with a
`/` at its end, as a URL with the empty prefix is usually written, names the same server without
it, and the client removes that `/` before it joins. A client MUST NOT form the URL by
resolving the path as a reference against the base URL ({{RFC3986}}, Section 5): a path that begins
with `/` replaces the prefix when it is resolved that way. With the base URL
`https://shop.example/restact`:

~~~
/.well-known/restact      https://shop.example/restact/.well-known/restact
/animals/dogs/fido:noise  https://shop.example/restact/animals/dogs/fido:noise
~~~

**Finding the base URL.** A client is given a server's base URL as configuration. Nothing in a URL
marks where the prefix ends, so a client MUST NOT derive the base URL from another URL of the
server, whether by removing path segments or by asking the root of the origin.

**Paths in messages.** A path a server or a client writes into a message is one of two kinds:

* An **object path** or a **route** names an object or a verb, not a URL, and never carries the
  prefix: the `route` of a discovery entry ({{discovery}}), the `$name` of an object
  ({{representations}}), the path of a `readers:<path>` matcher ({{authz}}), a path a verb passes
  to a capability interface or composes ({{composition}}), an argument of an MCP tool
  ({{RESTACT-MCP}}), and an event topic. A stored policy or object therefore reads the same wherever
  the server is mounted, and a client that wants the URL joins the path to the base URL as above.
* A **URI reference** names a URL, and its reader resolves it as {{RFC3986}} and {{RFC9110}} direct:
  a `Location` header field ({{operations}}), a `Link` header field and the values of `$links` and
  `$verbs` ({{representations}}), and the `service.openapi` member ({{discovery}}). A server MUST
  write one that resolves to a URL under its base URL, so a reference that begins with `/` carries
  the prefix: under the base URL above an operation is at `Location: /restact/operations/{id}`.
  A value of `$links` or `$verbs` MUST be an absolute URI or begin with `/`: a representation also
  reaches its reader where it has no URL of its own to resolve against, as in a tool result of
  {{RESTACT-MCP}}.

A server cannot always learn its prefix from the request, for instance behind a proxy that removes
it, and then has to be configured with it. A server MUST NOT take its prefix from a request header
field unless a proxy it is configured to trust supplies that field: a prefix a client can choose
reaches other clients through every reference the server writes into a cached response.

Two servers MAY share an origin under different prefixes, neither of which is the other followed
by further segments. Each is a server of its own, with its own
discovery document, objects and verbs, and nothing in this document relates one to the other.
{{security}} describes what a server shares with whatever else is served from its origin.

## Grammar {#grammar}

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
object identified by the path up to and including that segment's `name`, or, when the name is
empty, to the object the preceding segments identify. A `:verb` segment that follows a segment
holding a name and no verb therefore names the same route as that segment with the verb appended:
`/a/:x` and `/a:x` are one route, whose canonical form is `/a:x`. A server MUST rewrite the first
form to the canonical one before resolution ({{resolution}}) and before any check that reads the
path, such as authorization ({{authz}}), a credential's path scope, or a `readers:<path>` matcher,
and MUST treat the two alike wherever a route is named, in a request, a deployment or a declared
call graph. A `:verb` segment after a segment that already holds a verb, or after a verb property,
is a second `:verb` segment and is refused as below. A path whose first segment is a `:verb`, such
as `/:x`, names an unbound verb on the service root ({{resolution}}); the first segment is counted
after the base URL's prefix is removed ({{base-url}}). `pchar-nc` is the `pchar`
production of {{RFC3986}} §3.3 with the colon (`:`) excluded. The leading **`@`** character is
**reserved**: a server uses `@`-prefixed names for internal storage (for example a verb's `shared`
property state) that is NOT a client-addressable object, and MUST reject a client request whose object
path contains a segment beginning with `@` (the reference returns `400 invalid-input`; a server MAY
instead treat it as `404`), so a client can never name internal storage directly and bypass the
declaring property's ACL. (`$`-prefixed names are likewise reserved for system fields,
{{representations}}.) A `name` is never `.` or `..`. A client removes such dot segments before it
sends a request ({{RFC3986}} §5.2.4), so an object named that way could not be addressed. A server
MUST reject an object path with a `.` or `..` segment, whether written literally or percent-encoded
(`%2E`, `%2E%2E`, in either case), with `400 invalid-input`. The rule applies to the decoded segment
and has one exemption, below. It keeps a request from naming one object to an authorization check
and another to storage, as it could if one part of the server removed a dot segment and another kept
it. A server that never receives the request-target as the client sent it, because its platform
hands it a request's path only after removing dot segments, as a runtime that gives the application
an already-parsed URL does, and that takes the path in no other form, such as a header field
carrying the path the client sent, never sees those segments and has one view of the path: it serves
the path as handed to it and is exempt from the rule for the segments its platform removed. A server
that also takes another form of the path applies the rule to that form. An exempt server MUST still
reject a `.` or `..` segment that remains in its path after decoding, such as the name in
`/a/..:noise`, which URL parsing keeps, with `400 invalid-input`, and MUST state in its
documentation that it serves the path as its platform normalized it: a component in front of it that
decides on the path the client sent, such as a proxy that admits requests by path prefix, reads a
different path from the one the server serves ({{security}}).
An object path a verb names is never percent-decoded, so there a literal `.` or `..` segment is
refused and `%2E%2E` is an ordinary name.

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
(a client SHOULD avoid such names). Independent of order, on the verb-property plane
({{verb-properties}}) a segment whose decoded text is `{id}` names the wildcard of a definition
pattern, whether it was sent as `%7Bid%7D` or not. Braces are not URI characters ({{RFC3986}},
Section 2), so `%7Bid%7D` is the spelling a client sends and the one a server writes in a URI
reference to a property of a wildcard definition, such as a value of `$verbs`
({{representations}}). Everywhere else a concrete request path is matched literally against deployed
patterns ({{resolution}}) and never re-interpreted as a pattern: a request on an object named `{id}`
resolves through the wildcard as a request on any other name does, and that object never holds a
definition of its own ({{security}}). Name comparison is case-sensitive.

Because a verb is an object, a `:verb` segment MAY be followed by one `/name` segment that
addresses a property of the verb ({{verb-properties}}). A path that goes further, with another
`/name` segment after a verb property or a second `:verb` segment, is an extension point (E10,
{{extensions}}). Unless an advertised extension defines such a path, a server MUST answer a path
with a second `:verb` segment with `501` (`unsupported-feature`); and it MUST answer a path with a
further `/name` segment after a verb property, once the request has passed authentication and
authorization ({{authz}}), with `404` (`not-found`), never `405`. Examples:

~~~
/animals/dogs/fido             the object 'fido'
/animals/dogs/fido:noise       the verb 'noise' (bare form = invoke)
/animals/dogs/fido/:noise      the same route as the line above
/animals/dogs/fido:noise/code  the 'code' property of the verb
/:bulkImport                   an unbound verb on the service root
~~~

**Order of refusals.** A request whose path carries a `:verb` segment can draw more than one of the
refusals that this section, {{authz}} and {{RESTACT-DELEGATION}} define. When more than one of the
following refusals applies to such a request, a server MUST answer with the earliest in this order;
the order does not rank them against other refusals:

1. an object path with a `.`, `..` or `@`-prefixed segment, refused as above;
2. a second `:verb` segment, refused with `501` as above, whatever the method;
3. `401`: a credential that fails verification, or an owner-gated mutation by the anonymous
   principal on a server with authentication configured ({{authz}});
4. `403` because the request falls outside the bounds of the credential itself, such as the prefix
   of a path-scoped sub-token or the methods that a read-only delegated token admits
   ({{RESTACT-DELEGATION}});
5. a further `/name` segment after a verb property, answered with `404` as above.

A server that answers `OPTIONS` without authenticating the request ({{security}}) applies only
steps 1, 2 and 5 to it.

Verb names follow {{AIP136}}: an **application** verb name SHOULD be a verb optionally followed by a
noun, MUST match the `verb` production above (`lalpha *( ALPHA / DIGIT )`, i.e. `camelCase`), and
SHOULD NOT contain prepositions. The names `get`, `list`, `create`, `update`, `set`, and `delete` are
**reserved for representation accessors** (the "Active Properties (Accessor Verbs)" section of {{RESTACT-OBJECTS}}), and any name that begins with `on`
followed by an uppercase letter (e.g. `onCreate`, `onChange`, `onDelete`, `onEnter`, but not
`onboardUser`) is **reserved for lifecycle hooks** (the "Events, Triggers, and Scheduling" section of {{RESTACT-EVENTS}}); an application verb MUST NOT use a
reserved name, and a server accepts the deployment of a verb under a reserved name only as the
accessor or hook that name denotes, with the kind that role requires: `get` and `list` as
functions, the others as actions. A server MUST validate a verb name at
deployment and reject one outside this grammar with `400`, so an out-of-grammar name can never reach
the discovery document.

An **event** is a named message published on a **topic**, which is usually an object path; {{RESTACT-EVENTS}}
defines how events are published and delivered.

**Names the server keeps.** The names `onCreate`, `onChange`, `onDelete`, and `gap` are reserved for
events the server publishes itself. A server MUST refuse a verb's attempt to publish an event with
one of these names with `403` `forbidden`, whether or not it auto-publishes lifecycle events, so
that on every topic an event carrying one of them came from the server. A verb that wants clients
to refresh what they show publishes an ordinary name; the presentation verbs extension
{{RESTACT-PRESENTATION}} uses `invalidate` for that.

## The three addressing forms

| Form | Identifies | Operated on with |
|------|------------|------------------|
| `/obj` | an object's data | GET, PUT, POST, PATCH, DELETE |
| `/obj:verb` | a verb (bare form) | invocation: POST (action) or GET (function) |
| `/obj:verb/<prop>` | a property of a verb | GET, PUT, DELETE, OPTIONS (per convention) |

# HTTP Method Semantics

## Object data (the noun) {#object-noun}

The standard HTTP methods on an object path have their usual {{RFC9110}} meanings and follow the
standard-method conventions of {{AIP122}}: `GET` retrieves the representation (or, on a collection,
lists members; see {{collections}}); `PUT` writes the object's data; `PATCH` partially updates (see
{{collections}} for field masks); `POST` creates a subordinate resource; `DELETE` removes. `PUT`
**creates or updates**: a server MAY implement it as a full replace (absent members removed) OR as a
**member-wise merge/upsert** (the provided members are written and absent members are retained) —
the reference host merges, so a partial `PUT` does not erase unsent members; a server MUST document
which. `PATCH` and `POST` member-level semantics on a bare object are OPTIONAL: a server that does
not support them on the data plane directly returns `405` (and a client uses `PUT`,
or a verb that serves the method as below). These operations are gated by the object's authorization policy
({{representations}}, the `$policy` system field): `GET` by `read`, `PUT`/`PATCH`/`POST` by `write`
(for every member but `$policy`, which only the owner writes, {{representations}}; a condition an
advertised extension adds for a single member can only narrow this gate),
and `DELETE` by `delete`. A refused write or delete is `403` (`forbidden`) to a caller who may read
the object; one who may not gets the answer an absent object would get ({{non-reader}}).

A server MAY instead serve any of these methods through a verb, where an advertised extension
defines how ({{extensions}}, E7); the policy that extension names then governs the method.

`DELETE` removes only the object's stored data and leaves the verbs bound to its path in place,
unless the server couples the verb and data planes ({{conformance}}).

A `PUT` is one write however many members it carries. The server authorizes and applies it as a
whole, and it is one mutation to anything that observes writes, such as events and lifecycle hooks
(the "Events, Triggers, and Scheduling" section of {{RESTACT-EVENTS}}) and provenance (the "The provenance facet (OPTIONAL, feature `object-provenance`)" section of {{RESTACT-DELEGATION}}). If any member is refused, the server MUST refuse the whole `PUT`
and MUST NOT write any of it.

The body of a `PUT` of object data is JSON when its `Content-Type` is `application/json`,
`text/json` or a media type with the structured syntax suffix `+json` {{RFC6839}}. A server MUST
refuse with `415` (`invalid-input`) a `PUT` whose body is not empty and whose `Content-Type` is
absent or is not exactly one media type, so that an unlabeled body is never applied as JSON. A
server that does not advertise `binary-values` MUST also refuse with `415` (`invalid-input`) a `PUT`
whose body is not empty and whose media type is not one of those JSON types; a server that
advertises it stores such a body as the object's binary value (informative: the "Binary values
(OPTIONAL, feature `binary-values`)" section of {{RESTACT-OBJECTS}}).

## Verb invocation (the bare verb) {#taxonomy}

Invoking a verb uses the bare `:verb` form. The method MUST follow the function/action taxonomy:

* A verb declared as a **function** (no observable side effects) is invoked with `GET` and its
  response MAY be cacheable per {{RFC9111}}. Because a function's output MAY depend on the caller's
  identity ({{caller-identity}}) or on ACL-filtered object data, a server MUST NOT let a function
  response be cached by a SHARED cache and replayed to a different caller: it marks such a response
  `Cache-Control: private` (or `no-store`) and `Vary: Authorization`. A response a server can prove is
  caller-independent MAY be marked publicly cacheable. A weak `ETag` over the output SHOULD be emitted
  so a client revalidates with `If-None-Match`. A server MUST evaluate a precondition on a function
  against the entity tag of its output, as {{RFC9110}}, Section 13 requires of an origin server: a
  matching `If-None-Match` yields `304`, and a failed `If-Match` yields `412`. This holds whether or
  not the server advertises the `conditional-requests` feature token ({{discovery}}). On a server
  that sends no entity tag with a function's output, an `If-None-Match` that lists entity tags never
  matches, and an `If-Match` that lists them fails with `412`. A server MUST NOT permit a `GET` invocation to mutate
  observable state. A server enforces this at runtime over the whole call tree: a function — whether
  the request root or composed beneath one (a function may compose only functions, see
  {{composition}} rule 5) — that attempts an observable side effect (writing object data via the
  `object` capability's `set`/`set-at`, publishing an event, or invoking an action) MUST be refused
  with status `403` and `restact_code` `forbidden-side-effect`, and the mutation MUST NOT occur.
  Because a `GET` always resolves to a function and a function's tree is function-only, a `GET` is
  therefore side-effect-free end to end. A function reads its input from the `?input=` query
  parameter, because a browser cannot attach a body to a `GET` (the Fetch standard forbids it), and
  a server MUST accept it there. A server MAY also accept the input in the request content. The
  input is part of the cache key, so two `GET`s with different `?input=` are distinct cacheable
  resources. A server MUST therefore refuse a function request that carries both an `input` query
  parameter, whatever its value, and content of non-zero length, with `400` (`invalid-input`), and
  the verb does not run. If the content won, a cache keyed on the URL could store a response
  computed from the content under a key that names the query; if the query won, the server would
  discard input the client sent. (Informative: this covers a data method that a `get` or `list`
  accessor serves, as in the "Active Properties (Accessor Verbs)" section of {{RESTACT-OBJECTS}}.)
  A server MUST advertise the `query-input` feature token ({{discovery}}), which names
  this input form, so that a client that checks for the token finds it.
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
PUT    /obj:verb/code       replace code (Content-Type=language;
                            see below for create)
DELETE /obj:verb/code       remove the verb on this object
GET    /obj:verb/policy     read the authorization policy
PUT    /obj:verb/policy     set the authorization policy (omitted
                            actions keep their value)
GET    /obj:verb/meta       read metadata (owner, limits, caps,
                            graph)
~~~

`code`, `policy`, and `meta` are RECOMMENDED, registered conventional property names; they are NOT
mandatory. An implementation MAY expose none, some, all, or additional verb properties, and MAY
restrict the methods available on a property (for example, accepting `PUT …/code` while never
serving `GET …/code`). Reserved property names are managed by the registry in {{iana}};
implementation-defined verb properties are permitted but MUST NOT use a registered name for a
different purpose. A client MUST discover which verb properties the server supports, and the methods
each accepts, with `OPTIONS` on the property's own path ({{discovery}}) rather than assuming them.
Access to each property is governed by the verb's policy ({{authz}}) using property-specific actions
(e.g. `read-code`, `write-code`).

**Deployment history and rollback.** `history` and `rollback` are further registered property
names. A server that does not support the profile that defines them MUST NOT define either name for
any other purpose. (Informative: the profile is the "Deployment history and rollback (OPTIONAL,
feature `verb-history`)" section of {{RESTACT-OBJECTS}}.)

**Conditional management.** A server that does not advertise `verb-conditional-requests` MAY
ignore `If-Match` and `If-None-Match` on the verb-property plane and its deployment profile, and a
client therefore cannot rely on them there. (Informative: per-property entity tags, `If-Match` on
every write and create-only deployment are specified in the "Conditional verb management (OPTIONAL,
feature `verb-conditional-requests`)" section of {{RESTACT-OBJECTS}}.)

# Verb Resolution and Inheritance {#resolution}

When a verb is invoked on an object, the server MUST resolve the verb definition by walking up the
path hierarchy: it searches the target object, then each ancestor in turn up to the root, and uses
the first object on which the verb is defined. The verb executes **with `this` set to the target
object** (the object named before the colon in the request), regardless of which ancestor defined
it. A verb observes `this` only if it imports the object-access capability ({{capabilities}}); a
pure-compute verb that imports nothing does not observe `this`. Resolution depends only on the
deployed definitions, never on the target object's stored data or on whether the caller may read it.
If no definition is found, the server MUST return `404`; a server that advertises the
`verb-not-deployed` feature MUST answer an invocation of that route with `restact_code`
`verb-not-deployed` ({{errors}}). Whether a verb is listed in a caller's discovery
document ({{discovery}}) does not affect resolution: a server MUST NOT answer an invocation of a
deployed verb, direct or composed, as for an absent verb because the caller may not see it. An **unbound** verb (`/:verb`, a path whose first segment is a `:verb`; {{grammar}}) is resolved only at the service root, with
no ancestor walk, and executes with `this` set to the root.

A verb is defined on a **path pattern** whose segments are each either a literal object name or a
single-segment **wildcard** `{id}` that matches any one concrete segment (a *bound* entity verb; see
{{terminology}}). One level of the hierarchy MAY therefore hold more than one matching definition:
for a request on `/counters/2`, both a literal definition on `counters/2` and a wildcard definition
on `counters/{id}` match at the same level. When several definitions match at the same level, the
server MUST select the **most specific** — comparing the candidate patterns segment by segment from
the left: at the first segment where one candidate has a literal and the other a wildcard, the
candidate with the literal is more specific (`counters/2` overrides `counters/{id}`, and
`ws/1/{id}/{id}` overrides `ws/{id}/pages/{id}`). Two distinct patterns of one length that match the
same path always differ in this way at some segment, so the order is total. This holds for the two
segment kinds defined here, a literal and a single-segment wildcard; a new kind of wildcard would need
the rule revisited. This selection MUST NOT depend on the order in which
definitions were created or stored. The ancestor walk still dominates the tiebreak: a definition on a
longer (more deeply nested) path always takes precedence over one on a shorter path, even when the
deeper definition is a wildcard and the shorter one is a literal; specificity orders only the
candidates that match at the same level.

Writing a verb property targets the **specific object** in the request path: `PUT /a/b/c:verb/code`
replaces (or overrides onto `c`) the code of an existing verb, shadowing any inherited definition.
A path with a `{id}` segment targets the definition on that exact pattern ({{grammar}}).
**Creating** a verb requires more than code — its kind, declared call graph, limits, capability
grants, and produced media type ({{deployment}}) — so a server need not let a bare `PUT …:verb/code`
on a not-yet-defined verb create it; it MAY instead require the deployment profile ({{deployment}})
and reject the bare write (`404`), or accept it and default the remaining declarations. A server MUST
document which. `GET /a/b/c:verb/code` returns the *effective* definition (resolving up) and, when
the definition is inherited, SHOULD include a header identifying the defining object.

By convention, an object's *data properties* MAY also be inherited from ancestors; the precise
semantics of data-property inheritance and overriding are implementation-defined in this version.
(Informative: the "Declared Data Properties" section of {{RESTACT-OBJECTS}} specifies a declaration for properties whose value is
shared across instances, write-once, or access-controlled.)

# Representations {#representations}

## Native representation

The native representation of object data is a JSON object {{RFC8259}} whose members are the
object's user-defined data; its media type is `application/restact+json` (a server MAY serve it as
`application/json`). A user-data member VALUE is any JSON value except a top-level `null`: a string, a number,
a boolean, an array or an object (nested `null`s are ordinary data). A server that supports this
advertises `typed-values`; one that does not MAY refuse a non-string member, and returns only
strings. A stored string MUST read back as the same string. A number MUST be finite, and an integer
MUST lie within ±(2^53−1) ({{RFC7493}}), else the write is refused with `400` (`invalid-input`); a
server MUST normalize an integral double to an integer and `-0` to `0`. A `PUT` member replaces the
whole value of its property, and the property remains the unit of authorization: the object's
policy, and any rule an advertised extension sets for a single property, apply to the whole value,
and no such rule applies to a path inside a value. A location
inside a value, for a future sub-path write, is a JSON Pointer {{RFC6901}}. JSON `null` is never a
value: a server MUST NOT store a `null` member, or a string made from it such as `"null"`, as a
property value. A server MUST refuse a `null` member of a `PUT` with `invalid-input` unless an
advertised extension gives it a meaning ({{extensions}}, E5). (Informative: the `put-null-removes`
feature of {{RESTACT-OBJECTS}} reads it as a removal.) User data MUST NOT use
`$`-prefixed or `@`-prefixed member names: `$` names are reserved for the server-managed system
fields below, and `@` names for the server's internal storage. A server **MAY** surface these system fields in the
representation (each `$`-prefixed); they are OPTIONAL, so a minimal server MAY return only the
user-data members. The defined system fields are:

| Field | Meaning |
|-------|---------|
| `$name` | the object's full resource name (path) |
| `$uid` | a stable, server-assigned identifier (survives renames) |
| `$create_time`, `$update_time` | RFC 3339 timestamps (output-only) |
| `$links` | a HATEOAS link object (at minimum a `self` link) |
| `$verbs` | a map of the object's *effective* (post-resolution) verb names — those for which the caller has `execute` permission — to the URL of each verb's `meta` (the defining object's, when inherited) |
| `$owner` | the subject recorded as the object's owner (first-writer-owns), backing the `owner` matcher in object and property authorization. Ownership is **fixed** ({{ownership}}): no write changes it. A `PUT` MAY carry `$owner` only to restate the current owner, which only that owner may do and which changes nothing; any other `$owner` member is refused `403` (`forbidden`). Only an operator act that an advertised extension defines at E1 reassigns it ({{extensions}}), such as the ownership recovery of {{RESTACT-DELEGATION}} |
| `$policy` | OPTIONAL object-level authorization policy (feature `object-policy`): `{ read, write, delete }`, each a list of authorization subjects ({{authz}}). It gates the object as a whole — `read` gates retrieval (a denied read behaves as not-found), `write` gates writes to every member but `$policy` itself (a condition an advertised extension adds for a single member can only narrow it, never widen it), `delete` gates removal (a write or delete refused to a caller who may not read the object is answered as for an absent object, {{non-reader}}). An omitted policy defaults to `read: [public]`, `write: [owner]`, `delete: [owner]`, unless an advertised extension supplies the policy that governs an object with no `$policy` of its own ({{extensions}}, E6). Only the object's owner sets it, as described below (the reference host accepts it as a writable `$`-member on `PUT`); it is not returned in the representation |

Writing an object's `$policy` (setting, replacing or removing it) is the `manage` action
({{authz}}), and only the object's owner holds it. The `write` policy does not grant it, and no
`$policy` can. A server MUST refuse a write that carries a `$policy` member from any other caller
with `403` (`forbidden`), or, to a caller who may not read the object, with the answer for an absent
object ({{non-reader}}), and MUST NOT write any of it. This is the one member the `write` policy
does not gate: the owner needs no `write` grant to write `$policy`, so an owner that its own `write`
list leaves out can still change the policy, while every other member of the same write needs
`write` as usual. Because `$policy` is not part of the representation, a server that implements
`PUT` as a full replace ({{object-noun}}) MUST NOT treat a `PUT` without a `$policy` member as
removing the policy, and MUST apply a `PUT` whose only member is `$policy` to the policy alone,
leaving the object's other members as they are. A write that creates the object makes its caller the owner ({{ownership}}) and so
MAY carry `$policy`. Where an advertised extension lets one object's policy govern other objects,
that extension names the owner who holds this authority over each of them ({{extensions}}, E6).

A server that implements object-level policy advertises the `object-policy` feature. Because `$policy`
is not part of the representation, a server MAY additionally offer a read-back through a metadata channel
(feature `object-policy-read`): `GET /v1/<obj>?meta=policy` returns the object's effective policy as
`{ owner, read, write, delete }` (subject tokens, {{authz}}), so a manager can inspect it before
replacing it; `?meta=policy&raw=1` returns instead only the dimensions explicitly set (unset stay
empty), distinguishing a default-by-omission from an explicit default. The read is gated on **manage
authority**, held by whoever may set the object's `$policy` (above) and by no one else: any other
caller, like a non-existent object, MUST receive a not-found
response (no existence or authorization oracle), consistent with the object read gate. Note that
`$policy` and `$owner`, even on a server that surfaces other system fields, are NOT returned in the
representation (they are authorization metadata, read back only through the gated channel above).
They are nonetheless covered by the object's entity tag ({{consistency-txn}}), so a conditional
write detects a concurrent change to either. The read-back carries no entity tag: a manager that
replaces `$policy` conditionally reads the object, and its `ETag`, before the read-back, and sends
that tag in `If-Match`. A tag read after the read-back could already describe a later policy than
the one being edited.
Servers MAY additionally convey links via the HTTP `Link` header field {{RFC8288}}. Concurrency metadata (e.g.
`ETag`) is carried in HTTP headers rather than the body (see {{consistency-txn}}).

A server that does not advertise `object-policy-inheritance` MUST ignore an `inherit` member of
`$policy` (governance stays per object) and round-trips it as an unknown member.

### Refusing a caller who may not read {#non-reader}

A caller **may read** an object when the object-level `read` decision admits it: the object's own
`$policy`, else the policy an advertised extension makes govern it ({{extensions}}, E6), else the
default, evaluated for the caller's principal and credential exactly as for a data-plane `GET`, which then returns the
object rather than not-found.

When a server refuses a request on an object that exists because the caller lacks the authority it
needs, and the caller may not read that object, the server MUST answer it as it would answer the
same request if no object were stored at that path. The rule covers every write to the object, every
delete of it, and every act on a verb that the server ties to the object, made through any
interface this document or an advertised extension defines. It holds whichever authority is
missing: the object's `write` or `delete` policy, the owner's sole right to set `$policy`
({{representations}}) or to restate `$owner` ({{ownership}}), or a condition an advertised extension adds to that authority. A caller who may read the object receives `forbidden`
(`403`). The rule governs only how a refusal is answered: a request the caller is authorized to make
proceeds whether or not the caller may read the object.

A precondition on such a request ({{consistency-txn}}) is evaluated without the object's entity
tag. A caller who may not read the object has no representation of it, and so no entity tag of it:
the server MUST NOT send that caller the object's `ETag`, and MUST NOT compare an entity tag the
caller sends with the object's tag or with anything else stored with the object. An `If-Match`
from that caller therefore fails with `412` (`precondition-failed`) whatever it carries, `*`
included, and an `If-None-Match` that lists entity tags never matches, so it does not stop the
request. `If-None-Match: *` is evaluated against whether the object exists, as for any caller; that
is all it discloses, and a caller who may write the object is not kept from learning it. Were the
tags compared, a failed precondition, which changes nothing, would let the caller test guesses at
the content of an object it may not read.

For a path that holds no object, the answers are:

* a `DELETE`: not-found, which is `404` with `restact_code` `not-found` at HTTP;
* any other write this document defines: the answer the server gives a write that would create the
  object there, under first-writer-owns ({{ownership}}) and any creation rule an advertised
  extension adds;
* a request an advertised extension defines: the answer that extension gives it at such a path.

Where the request would succeed at a free path, the server cannot give that answer: it would have to
create an object that already exists. The server MUST then refuse the request as not-found, and
MUST NOT create the object or perform the request. The caller learns that the path is taken, as in
any namespace where the first to claim a name holds it, and learns nothing else about the object.

The answer MUST NOT depend on anything stored with the object. Its status, its problem body or error
message, and its header fields MUST be those the server gives the same request at a path that holds
no object, or, in the case of the previous paragraph, those of its not-found answer for such a path.
The server MUST decide the authority it needs over the object (the `write` or `delete` policy, the
owner's right to set `$policy`, or a condition an advertised extension adds to it) before it evaluates a precondition
({{consistency-txn}}) or any check an advertised extension makes on stored state, such as a
compare-and-swap's expected value or a write-once member, checks the object's size limit, or calls a
backend. A caller who lacks that authority and may not read the object then gets no other answer
first, and the response falls in one timing class whatever is stored, apart from the cost of the
authorization decision itself.

A refusal that does not depend on what is stored at the path is not changed by this rule: a
malformed body or a member no client may write there, an unsupported method or media type, a
function's side effect ({{taxonomy}}), an anonymous caller's `401` ({{authz}}), or a bound an
advertised extension sets on the credential itself ({{extensions}}), such as the bounds of the
sub-tokens and delegated tokens of {{RESTACT-DELEGATION}}. A server MUST give such a refusal the same
way whether or not the object exists, so it takes precedence over the answer this rule sets.

The rule holds at every consistency level ({{consistency-txn}}). Where a write is buffered to commit
with the invocation (any write under `atomic-invocation`, or a write an advertised extension
buffers), the answer is the one the call returns, decided by the same authorization check as an unbuffered write.

The rule governs an object that exists. A request to a path that holds no object gets the answers
listed above, from the `DELETE` semantics and from any creation rule an advertised extension adds.

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

If the server does not support the supplied language it MUST return `415` (`unsupported-language`).
On `GET …:verb/code`, the server selects the representation by `Accept` (for a source-only language,
the source representation is the one available).

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
parameters on the upload — `verb` (the route id), `kind`, `calls`, the limits `fuel` (the compute limit, in the server's unit), `mem_mb` and `wall_ms`,
the per-capability grant flags (`compose`/`object`/`event`/`llm`/`webhook`, each `allow` or `deny`, where `deny`
WITHHOLDS an otherwise granted import; a server SHOULD refuse any other value rather than read it as a
grant; {{RESTACT-OBJECTS}}, {{RESTACT-EVENTS}} and {{RESTACT-CONNECTORS}} define
the `object`, `event`, `llm` and `webhook` capabilities), `exec` (the `execute`-action shorthand, below), `produces`, `requires` (the features the verb requires, below), and the source `lang` —
alongside the code body; a server MAY offer an
equivalent manifest form, but MUST document a profile through which every declaration above is
expressible, so a verb's deployment is portable rather than reference-only.

**The `calls` parameter.** `calls` is a comma-separated list of the concrete routes the verb may
compose, each written as the `route` of a discovery entry writes it ({{discovery}}), in canonical
form ({{grammar}}); on a server that advertises `compose-patterns`, an entry MAY instead be a
pattern `*:<verbName>` ({{composition}}). A `,` inside a route is written `%2C`, and a server splits
the list before it decodes an entry. An empty value declares none. A server records each edge's
kind whenever it writes the verb's record with code or declarations, through any interface, a
code replacement (`PUT …:verb/code`) and a rollback included: every edge of a function is a
function call, and an edge of an action is an action call unless its route resolves
({{resolution}}) to a function at that time. A pattern edge of an action is an action call. The
recorded kinds are part of the verb's call graph and change only at such a write.

**Discovering the reference profile (OPTIONAL).** A server MAY serve the reference profile.
Deploying a verb into a running server through its own interface, as this profile does, is the use
this protocol is designed around; the profile is optional so that a server that deploys verbs
another way, such as over the verb-property plane ({{verb-properties}}) or from a build pipeline
outside the protocol, still conforms. A server that advertises the `verb-reference-deployment` feature token ({{discovery}}) MUST accept
verb creation and replacement through the reference profile above (`POST /v1/modules` with those
query parameters and the code as the body). A server that serves `POST /v1/modules` MUST advertise
both `verb-reference-deployment` and `code-management`. The `verb-reference-deployment` token states only that the endpoint exists with
this profile: it authorizes nobody, and every deployment through it remains subject to
authentication, authorization ({{authz}}) and any object-binding gate (the "Object Binding" section of {{RESTACT-OBJECTS}}). A
client that does not see `verb-reference-deployment` MAY still attempt the reference profile; if the server
refuses it as unsupported (for example `404`, `405` or `501`), the client MUST surface that
refusal to its user plainly, as this server not accepting deployment through the reference profile,
and MUST NOT treat it as a transient failure to retry.

**Unrecognized parameters.** A server MUST refuse a deployment through the reference profile that
carries a query parameter it does not recognize, with `400` (`invalid-input`) and a detail that
names the parameter, and deploys nothing; the refusal SHOULD carry an `errors` entry whose `source`
has a `parameter` member naming it ({{errors}}). A server recognizes a parameter only when it
implements the declaration that the parameter carries, as this document, an extension whose feature
token the server advertises ({{extensions}}), or the server's own documentation defines it. A server
never ignores a parameter, so a declaration it does not implement is refused rather than dropped.
One declaration is refused differently: a server that enforces no compute limit it can set per verb
({{limits}}) MUST refuse a deployment that sets one (`fuel` in the reference profile, or its
manifest equivalent) with `501` (`unsupported-feature`) rather than `400`, naming the parameter,
because the compute limit is an optional part of this document rather than an unknown declaration.
It deploys nothing, so no deployer is left believing that a limit applies when it does not.

**Required features.** The reference profile's `requires` parameter declares the feature tokens a
verb requires ({{conformance}}), as a comma-separated list; an empty value declares none. A server
that serves the reference profile MUST accept it. It MUST refuse the deployment, deploying nothing,
with `400` (`invalid-input`) when the value is not a comma-separated list of feature-token names,
and with `501` (`unsupported-feature`), naming the token, when it does not advertise a listed token.
It MUST reflect the list in the verb's discovery entry and `meta` ({{discovery}},
{{verb-properties}}) as the member `requiresFeatures`, and omits the member when none was declared.
A token listed more than once is required once and appears once in `requiresFeatures`, whose order
carries no meaning.
A replacement of the verb's code alone (`PUT …:verb/code`, or a rollback) preserves the list, and a
deployment through a profile that declares the verb's properties re-declares it. While the server
does not advertise a token that a deployed verb requires, it refuses to invoke the verb
({{conformance}}).

**Description (OPTIONAL).** A deployment MAY also declare a **description**: prose, for people and
for models, stating what the verb does and what input it expects. It is documentation, not a
declaration of behavior: it has no effect on invocation, authorization, or any other property, and a
server does not interpret it. A server that accepts one MUST reflect it verbatim in the verb's
discovery entry and `meta` ({{discovery}}, {{verb-properties}}), MAY bound its length, and MUST
refuse a description over that bound rather than truncate it. A replacement of the verb's code alone
(`PUT …:verb/code`, or a rollback, the "Deployment history and rollback (OPTIONAL, feature `verb-history`)" section of {{RESTACT-OBJECTS}}) preserves the description; a deployment through a
profile that declares the verb's properties re-declares it. The reference profile carries it as the
`description` query parameter of `POST /v1/modules`. A description is disclosed wherever discovery
is, to every caller who may see the verb ({{discovery}}), and it is authored by whoever deployed the verb: a client
that presents it to a model SHOULD attribute it to the verb's deployer and treat it as untrusted
input, like any other deployer-authored data.

**Input and output schemas (OPTIONAL, feature `verb-schemas`).** A deployment MAY also declare an
**input schema** and an **output schema**: JSON Schema documents ({{JSON-SCHEMA}},
{{JSON-SCHEMA-VALIDATION}}, draft 2020-12) describing, respectively, the verb's input when that
input is a JSON document (the request body, or a function's `?input=` value, {{taxonomy}}) and
its invocation response when that response is a JSON document. Like a description, a schema is
documentation, not a declaration of behavior: a server does not validate invocations or responses
against it, it has no effect on invocation, authorization, or any other property, and a verb MUST
still treat its input as untrusted. A server that advertises the `verb-schemas` feature token
MUST accept both through the reference profile, as the `input_schema` and `output_schema` query
parameters of `POST /v1/modules`, each carrying the schema's JSON text {{RFC8259}}; an empty value
declares none. It MUST refuse the deployment (`400`, `invalid-input`), deploying nothing, when a
value is not JSON; is neither a JSON object nor a boolean; carries `$schema` other than at its
root, or with a value other than `https://json-schema.org/draft/2020-12/schema`; contains `$id`,
`$anchor`, `$dynamicAnchor`, `$dynamicRef` or `$vocabulary`; or contains a `$ref` that is not `#`
or a JSON Pointer fragment ({{RFC6901}}) resolving, within the same document, to a subschema (a value in a
schema position of a keyword in {{JSON-SCHEMA}}), not to a value under an unknown keyword or a data
keyword. These rules keep a schema self-contained, so a consumer can embed it in another document
(an OpenAPI operation, a tool definition) by rewriting its references mechanically, and so no
consumer is led to fetch a URL the deployer chose. A server SHOULD also refuse a schema that is
invalid against the draft 2020-12 meta-schema, and MAY bound a schema's size and nesting depth,
refusing one over a bound rather than altering it. A server MAY also refuse a schema containing a cycle of `$ref` references that never applies another keyword to a different instance location ({{JSON-SCHEMA}}, Section 9.4.1), which a consumer cannot evaluate. A server reflects each declared schema in the
verb's discovery entry and `meta` ({{discovery}}, {{verb-properties}}) as the member `inputSchema`
or `outputSchema`, with the same JSON value it accepted as I-JSON {{RFC7493}} reads it (member
order and number spelling aside), and omits a member that was not declared. The description's
lifecycle applies to both: a replacement of the verb's code alone (`PUT …:verb/code`, or a
rollback, the "Deployment history and rollback (OPTIONAL, feature `verb-history`)" section of {{RESTACT-OBJECTS}}) preserves them, and a deployment through a profile that declares the
verb's properties re-declares them. A server that does not implement these parameters refuses them
as unrecognized parameters (above), so a client MUST NOT send them to a server that does not
advertise the token expecting them to be honored. Schemas
are disclosed wherever discovery is, to every caller who may see the verb ({{discovery}}), and are authored by
the verb's deployer: a client that presents one to a model SHOULD attribute it to that deployer
and treat it, including every `title` and `description` inside it, as untrusted input.

**Born policy.** A verb created through a deployment profile is born with a policy ({{authz}})
whose owner is the deployer. On a server that does not advertise the `verb-private-default`
feature token ({{discovery}}), the born policy is the fixed default the simple profile states
(`read: public`, `execute: public`, `write: owner`, {{simple-profile}}). On a server that
advertises it, the born policy admits only the `owner` matcher for every action (`read`,
`execute`, `write`), and the owner widens it through `PUT …:verb/policy`. A client can tell the two
apart only through the token. The reference profile's `exec` parameter is a shorthand for the `execute`
action alone. On a server that advertises `verb-private-default`, `exec` MUST accept exactly `public` or `owner`, MUST refuse any other
value, including an empty one, with `400` (`invalid-input`), and sets `execute` to that single
matcher without touching any other action. The born policy governs who may invoke the verb,
read its properties ({{verb-properties}}) and see it in discovery ({{discovery}}).

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
({{exec-identity}}) and MUST be performed by the owner.

Registering at a route with no existing definition on that exact path pattern creates the verb; the
deployer becomes its owner ({{authz}}). A deployer that must not replace an existing verb can make
the registration create-only
(the "Conditional verb management (OPTIONAL, feature `verb-conditional-requests`)" section of {{RESTACT-OBJECTS}}).

# Capability Model {#capabilities}

A verb executes as a WebAssembly component {{WASI}} whose interface declares exactly the host
interfaces it imports. A verb has **no ambient authority**: any host interface it does not import
is unreachable. Host capabilities are organized as **layered interfaces** that an implementation
grants per policy:

* a minimal interface (e.g. structured logging, and a read-only view of the caller's identity —
  {{caller-identity}}) suitable for most verbs;
* a "world" interface providing object-graph access (reading and writing the bound object's data,
  traversing ancestors, listing children, and invoking other verbs) for environment-grade use;
* domain-specific interfaces (e.g. scoped key-value storage, or a typed call the server makes
  through a governed connector object, such as a model completion, the "Model Completion (OPTIONAL, feature `llm-connector`)" section of {{RESTACT-CONNECTORS}}). A verb never gets raw
  network access: an outside service is reached only through an interface that names the
  operation.

On upload, a server MUST reject, with `403` (`disallowed-import`), a component that imports an
interface or a separately tokened method that the server does not permit (for example, raw network
or filesystem access) or does not implement ({{wit-contract}}). A server that implements such an
import but does not advertise its feature token in its current configuration MAY accept the
component; a call through the import then behaves as that feature's own section says. The set of
permitted interfaces
and the policy for granting them are implementation-defined; this document defines only the
declaration-and-granting mechanism and reserves a registry for standard capability interfaces
({{iana}}).

### The guest contract (WIT) {#wit-contract}

The standard host interfaces are defined as a WebAssembly Interface Types (WIT) package,
`rest-act:plugin`, given in {{appendix-wit}} and, for an interface that an extension defines, in
that extension. A verb's imported interfaces ARE its
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
**before upload** whether a component's imported interfaces are all supported (an import the server
does not permit or does not implement is rejected with `403` (`disallowed-import`) at upload, never
a silent link failure). A server MUST
NOT make a breaking change under the same package version; a breaking change requires a new package
version and a new feature token.

## Caller Identity {#caller-identity}

A server MAY expose a read-only view of the **runs-as-caller** principal ({{exec-identity}}) to a
verb, through an `identity` capability interface the verb imports (OPTIONAL feature, token
`caller-identity`):

* `subject() -> option<string>` — an identifier for the authenticated caller, or none when the
  caller is anonymous. It is the caller's **pairwise subject** unless the server discloses the real
  one (both below).
* `subject-kind() -> real | pairwise` — which of the two the server gives verbs (a WIT `enum` of
  those two cases). It depends on the server's setting, never on the caller, so it answers the
  same for an anonymous caller.
  Available where the server advertises the feature token `identity-subject-kind`, which a server
  that advertises `caller-identity` MUST also advertise.
* `is-anonymous() -> bool` — true when there is no authenticated subject.
* `roles() -> list<string>` and `scopes() -> list<string>` — the caller's roles and scopes (from
  the sets the authorization subject matchers consult, {{authz}}); empty when none.
* `groups() -> list<string>` — the caller's group memberships (from the set the `group:`
  authorization subject matcher consults, {{authz}}); empty when none. OPTIONAL: available only
  where the server advertises the feature token `caller-groups`, so a client can probe before
  depending on it.
* `claim(name) -> option<string>` — a single scalar token claim by name, or none if absent or
  withheld (below).

Unlike composition and object-data access, this capability is **ambient**: it conveys no authority
beyond what the caller already holds (the verb executes *as* this caller), so a server SHOULD link it
without a separate grant or attenuation. The principal flows unchanged to composed sub-invocations;
what each frame reads of it is set below.

**The real identity is not disclosed by default.** Conveying no authority is not conveying nothing:
a subject, and a claim such as an email address or a name, is commonly personal data, and a verb's
author is not a party the caller chose to give it to. A server MUST NOT give a verb, through this
interface, the real subject, or a claim other than those the operator lists (below), unless its operator has configured
it to **disclose the real identity** to verbs, as a deployment in which every verb author is trusted with every caller's identity may. That
setting is the server's as a whole. A server so configured MUST advertise the feature token
`identity-real`, and a server that is not MUST NOT, so a client can learn it from discovery ({{discovery}})
before it invokes anything, and a verb that cannot work without the real identity can require the
feature ({{conformance}}) and be refused at deployment instead of misbehaving. A server that
advertises `caller-identity` without `identity-subject-kind` follows an earlier form of this section
and gives verbs the real identity, so a client that reads discovery to learn what verbs are given
checks for `identity-subject-kind` as well.

A server that does not disclose the real identity:

* returns from `subject()` the caller's pairwise subject, and `pairwise` from `subject-kind()`;
* returns none from `claim()`, except for a claim whose name the operator has listed as one that
  does not identify the caller (a tenant identifier, say). The list never holds `sub`; and
* gives the frame originator (below) in the same pairwise form, and gives a value an extension
  exposes at E9 ({{extensions}}) either in that form or in one that identifies no one, as the
  extension sets.

A server that discloses it returns the real subject, `real`, and the caller's claims, apart from
any that another rule withholds ({{authentication}}).

**The pairwise subject** is an opaque identifier that stands for one subject towards one verb
owner. A server computes it from three inputs: the real subject of the frame's runs-as-caller
principal, the owner of the verb that runs in the frame ({{ownership}}; the anonymous identity,
where it is the owner, is one more value, distinct from every subject), and a secret key that only
the server holds. The computation MUST be a keyed pseudorandom function, such as HMAC-SHA-256
{{RFC2104}}, over an encoding of the first two inputs that cannot be read as any other pair, and its
result MUST keep at least 128 bits of the function's output. An unkeyed hash is not enough: a
subject is often guessable, so anyone could confirm a guess or recover an email address from a
list, and a value that did not depend on the owner would let two owners recognize the same caller.
A server SHOULD compute HMAC-SHA-256 under the key over these octets in order: one octet, `0x00`
if the owner is the anonymous identity and `0x01` otherwise; the length in octets of the owner's
subject, as four octets, most significant first; the owner's subject in UTF-8 (for the anonymous identity the length is zero and no octets follow
it); and the caller's
subject in UTF-8. It SHOULD give the 32-octet result in base64url without padding ({{RFC4648}},
Section 5), which is 43 characters. A deployment that moves between two servers that both do so,
and takes the key with it, keeps its identifiers; {{appendix-pairwise}} gives values to test this
computation against. The identifier:

* is the same on every request, on every node of the deployment and across restarts, so a verb can
  key per-caller data on it. The server MUST NOT reveal the key to a verb or a client, and MUST
  NOT replace it except by an operator's act, as after a compromise: replacing it changes every
  identifier;
* differs between two verb owners, and is the same for every verb of one owner, so an owner's verbs
  can share per-caller data;
* consists only of the characters `A`-`Z`, `a`-`z`, `0`-`9`, `-` and `_`, at most 64 of them, so a
  verb can use it as the name of an object ({{grammar}}); and
* is not a subject in the sense of {{authz}}. `$owner` never holds it, and a matcher compares
  what a policy or a `prop:` property names with real subjects only, so naming a pairwise subject
  there never admits the caller it stands for.

Each frame is given the identifier for its own verb's owner, so two verbs of different owners in
one composition tree ({{composition}}) read different identifiers for the same caller. In a frame
that runs as the verb's owner or as a registrant ({{exec-identity}}) the computation is the same,
over that principal's subject. A verb's owner changes only by an operator act defined at E1
({{ownership}}); the identifiers its frames read change with it, and data the verb keyed by the old
ones no longer matches.

A verb therefore treats `subject()` as a key and nothing more, unless `subject-kind()` is `real`.
A verb that compares it with a name it holds from elsewhere (an owner check, a block list of
account names) gets no match from a pairwise subject, and has to read `subject-kind()` to tell that
from a caller who is someone else. A check of who may reach a resource is better left to the
resource's policy, which the server evaluates on the real subject whatever the verb is given. A
verb that has to name its caller for such a policy, in a property that a `prop:` matcher reads
({{authz}}), does not write `subject()` there. It has the server write the real subject, with the
`set-subject` function of the object capability (informative: the "Object Data Access" section of
{{RESTACT-OBJECTS}}). A server that advertises `prop-matchers` and gives verbs both pairwise
subjects and that capability MUST offer the function, and so advertises `object-set-subject`:
without it such a verb has no way to name its caller, and no error tells it so.

**Roles, scopes and groups** are not withheld with the subject: a verb reads them to decide what it
does for the caller, and they name what the caller may do, not who the caller is. A server MAY
nonetheless withhold any of them from verbs, by name, so a verb MUST NOT take the absence of a name
from these lists as proof that the caller lacks it. {{security}} gives the reasons an operator
would.

**The frame originator.** A server MAY additionally expose, through this interface, the **frame
originator** of an authority-switched invocation ({{exec-identity}}), as an OPTIONAL feature (token
`identity-invoker`). This exposure is NOT ambient: a server that offers it MUST require a grant at
deploy time on the reading verb, MUST advertise that grant in the verb's descriptor so callers can
inspect it before invoking, and MUST return none where it has not been granted. The grant decides
whether the verb learns of the originator at all, not in which form: the value is the originator's
pairwise subject for the reading verb's owner unless the server discloses the real identity.

Apart from the explicitly granted frame originator and an identity value that an advertised
extension exposes at E9 ({{extensions}}), such as the delegation actor of {{RESTACT-DELEGATION}}, a
server that implements this interface MUST NOT expose through it any identity other than the request's runs-as-caller principal. A verb still imports
the interface to use it, so it remains visible in the verb's capability manifest.

# Resource Limits {#limits}

A server MUST enforce, per invocation, at minimum a wall-clock time limit and a memory limit, and
MUST terminate a verb that exceeds either. A server SHOULD also enforce a compute limit counted in a
deterministic unit, such as fuel, instructions or interpreter steps, because a wall-clock limit
alone is non-deterministic: the same verb on the same input can finish on one run and be terminated
on the next. The wall-clock limit still bounds a verb that stalls without consuming compute. A verb
terminated for exceeding the wall-clock limit results in `504` (`timeout`), not `408`, which reports
a client that was too slow to send its request ({{RFC9110}}, Section 15.5.9); for memory, `507`; for a compute
limit, `429`. A server that ends any other request because its own deadline for handling it passed answers `504`
(`timeout`) in the same way, or `408` if it was still waiting for the request's content. Servers SHOULD advertise applicable limits in verb metadata and MAY apply per-tenant
quotas; see {{security}} for denial-of-wallet considerations.

The compute unit is implementation-defined. A server that enforces a compute limit MUST count the
compute that verb code consumes in its sandbox in one unit of its own choosing, and the same work
MUST count as the same number of units whatever the timing, load or scheduling. Every compute limit and budget the server advertises
(`maxComputeUnits`, {{discovery}}) or accepts at deployment ({{deployment}}) is a count of that
unit. A count is meaningful only on the server that reports it: a client MUST NOT assume that a
number of units names the same amount of work on another server, and can compare a verb's limit
only with that server's own default (`defaultCapabilities`, {{discovery}}).

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
   is still evaluated against the real caller, and cost still lands on the real caller, except as
   an advertised extension attributes it at E13 ({{extensions}}). Absent such
   an opt-in on the callee itself, this rule is unconditional; a caller can never confer authority
   it does not hold.
3. **Shared budget.** All invocations in a single request tree MUST share one bound: one
   wall-clock deadline for the whole tree and, where the server enforces a compute limit
   ({{limits}}), one compute budget in its unit. A sub-invocation runs within what remains of them
   and MUST NOT receive a fresh deadline or budget. A tree that exceeds the deadline ends with `504`, and one that exhausts the compute
   budget with `429`. This is the primary defense against amplification and denial-of-wallet via
   deep or wide call trees.
   A server MAY, in place of one compute budget for the tree, give each invocation in the tree its
   own fixed compute cap, such as a step cap inside its runner, when all of the following hold: it
   runs the tree's invocations one at a time, so a caller makes no progress while its callee runs;
   it terminates a running invocation when the tree's deadline passes, not only one that next calls
   the server; and it advertises no `maxComputeUnits` ({{discovery}}). The tree's one wall-clock
   deadline still binds, and it bounds the tree's compute to its length on one processor; a
   per-invocation cap only ends an invocation sooner. Such a server answers an invocation its cap
   ends with `429` (`cpu-budget`). It offers no deterministic compute bound for the tree
   ({{limits}}).
4. **Bounds.** A server MUST bound call-tree depth and per-invocation fan-out, and MUST detect
   cycles. Exceeding either bound or detecting a cycle results in `508` (`composition-cycle`): the
   code is the same for all three, so it does not mean that the call tree looped.
5. **Side effects.** Every invoked verb MUST appear in the caller's declared call graph (rule 1); a
   call to an action MUST additionally be declared as an action call (distinguishable from a
   function call). A function MUST NOT invoke an action. A server MUST enforce this: at runtime it
   refuses any attempt by a function to compose an action with status `403` and `restact_code`
   `forbidden-side-effect`; and it SHOULD reject at deploy, with status `400` and `restact_code`
   `invalid-call-graph`, a function whose declared call graph names a verb currently deployed as an
   action — so the call graph a function advertises in discovery stays function-only. The edge's
   kind is the one recorded when the caller's record was last written ({{deployment}}): a server
   MUST also refuse, with `403` and `forbidden-side-effect`, a call over an edge recorded as a
   function call whose target now resolves to an action, until the caller's record is written
   again. Subject to these rules, an action MAY compose actions over edges recorded as action
   calls — for example, a `set` accessor composing child `set` accessors.

**Absent targets.** A server that advertises the `verb-not-deployed` feature MUST report a composed
call whose target resolves to no definition ({{resolution}}) to the calling verb as
`verb-not-deployed`. It checks the declared call graph (rule 1) first, and answers a target whose
object path is not addressable ({{addressing}}) as `not-found`, never as `verb-not-deployed`. The
code describes only the route the calling verb named: when a verb that ran returns
`verb-not-deployed`, or passes it up from a call it made, the server MUST answer that verb's caller
`not-found` instead. A calling verb can therefore treat `verb-not-deployed`, and only that code, as
"no verb is deployed there".

Composition MAY cross servers: invoking a verb on a remote REST:ACT server is itself a REST:ACT
request, and the same rules apply at each server boundary. A cross-server hop starts a fresh budget
and call stack on the remote server, so the intra-server cycle and depth bounds (rules 4–5) do NOT
see a cycle that crosses servers (A→B→A) and the shared bound does NOT propagate across the
hop. A server SHOULD therefore propagate a bounded **hop count** (decremented at each boundary,
refusing at zero) to cap distributed depth, and MAY propagate a budget hint; absent that, the remote
request's own request timeout ({{limits}}) and the caller's per-tenant quota are the backstops against
distributed amplification. A full distributed loop-prevention and budget-propagation mechanism is
left to a future revision.

# Authorization and Identity {#authz}

## Authentication {#authentication}

A server establishes a **principal** for each authenticated request: a subject (`sub`) and the
roles, groups, scopes and other claims that the subject matchers of {{authz}} read. It does so
through one or more authentication mechanisms its operator configures, and this document defines
none of its own. Two are common:

* An OAuth 2.0 {{RFC6749}} bearer token {{RFC6750}}, typically an OIDC {{OIDC}} ID token or access
  token carrying a subject and OPTIONAL scopes and claims (a JWT {{RFC7519}}).
* The authentication of an application the server is mounted in ({{base-url}}): the application's
  own sessions, cookies or API keys, which the application resolves into a subject and claims, so
  a user signed in to the application is not asked to sign in again.

Policy is evaluated on the subject and claims, never on the mechanism that established them, so a
policy reads the same under every mechanism. A principal comes only from the mechanisms the
operator configures, and never from content of a request that no mechanism authenticates, such as
a header field naming a user that a client can set. A header field that a proxy the operator trusts
sets, on a server that is reachable only through that proxy, is a mechanism. An application that
starts an invocation itself, outside any client request (a scheduled job, say), names the principal
it runs as and answers for that choice. A mechanism that turns a request away answers `401`, not a
redirect to a sign-in page. A mechanism that accepts a credential a browser attaches on its own,
such as an application's session cookie, brings the server under the refusal of cross-origin
requests ({{security}}).

**Actor claims.** An `act` claim {{RFC8693}} names a party that acts for the credential's subject.
On a credential that the server did not itself issue under an extension it advertises that gives
the claim a meaning (informative: the "Delegated tokens (OPTIONAL, feature `delegated-tokens`)"
section of {{RESTACT-DELEGATION}}), the claim confers no identity and no authority: the server
authenticates the credential as its subject, exactly as it would without the claim, and MUST NOT
expose the claim to a verb or match a policy on it.

**Subjects are unique.** The `owner`, `sub:<id>` and `prop:<name>` matchers compare the subject
alone, so two identities given one subject own and reach each other's resources. A deployment MUST
give each identity one subject, the same on every request and through every mechanism that reaches
it, and MUST NOT give two identities the same subject: two identities, whether from two issuers or
from two kinds of account in one application (an administrator and a customer, say), never share
a `sub`. Where the identities' own identifiers can coincide, the deployment keeps the mechanisms'
subjects apart: it qualifies them, for instance by issuer or by kind of account (`admin:123`,
`customer:123`), or it reserves a subject prefix for one mechanism and refuses a subject with that
prefix from every other. A server that supports more than one mechanism SHOULD provide a means to
do so.

**Anonymous.** A client request that no mechanism authenticates carries the anonymous principal
({{authz}}), including one the application the server is mounted in leaves unauthenticated. A
server that establishes principals for client requests through any mechanism, an application's
authentication included, has authentication configured in the sense this document uses. An
application that names the principal of invocations it starts itself does not, by that alone.

Requests without acceptable credentials for a protected operation MUST receive `401`;
authenticated requests lacking permission MUST receive `403`, except where this document answers a
refusal as it would answer for an absent resource, so that it does not reveal whether the resource
exists (among them a denied read of an object, {{representations}}, and a refused write, delete or
verb definition by a caller who may not read the object, {{non-reader}}).

## Authorization policy

Authorization is governed by a **policy** attached to an object or verb: a set of allow/deny rules.
Each rule has an effect (`allow` or `deny`; `deny` rules are OPTIONAL, {{simple-profile}}), a set
of subject matchers, and a set of actions.
Subject matchers bind to the subject, roles, groups, scopes and claims that the authentication
mechanism establishes for the principal ({{authentication}}). The table names them as a bearer
token carries them, and any other mechanism gives them the same names and forms:

| Matcher | Matches | Bound to |
|---------|---------|----------|
| `owner` | the resource owner | the principal's `sub` equals the resource's `$owner` (an anonymous principal matches `owner` only when `$owner` is the anonymous identity) |
| `public` | any principal, including anonymous | — |
| `sub:<id>` | a specific subject | the `sub` claim |
| `role:<r>` | a role claim | a member of the `roles` claim (a JSON array of strings) |
| `group:<g>` | a group claim | a member of the `groups` claim (a JSON array of strings) |
| `scope:<s>` | a token bearing OAuth scope `<s>` | a member of the space-delimited `scope` claim ({{RFC6749}}) |
| `claim:<k>=<v>` | a token whose claim `<k>` equals `<v>` | the scalar claim named `<k>` |
| `prop:<name>` | the subject named by THIS object instance's `<name>` property value (OPTIONAL, feature `prop-matchers`) | the principal's `sub` equals the concrete object's stored value for `<name>` (for a value an advertised extension makes inherited, the stored value on the object that holds it) |
| `readers:<path>` | any principal that may `read` the object at `<path>` (OPTIONAL, feature `readers-matchers`; verb policy only) | the object-level `read` decision for the concrete object at `<path>`, evaluated per request |

The bound claim names are fixed so two implementations evaluate a policy identically; a server MAY
map a differently-named identity-provider claim onto these at the authentication boundary, but the
matcher vocabulary above is normative.

**Per-instance matchers.** `prop:<name>` is OPTIONAL (advertised as the `prop-matchers` feature)
and resolves against the concrete object the access targets (for a value an advertised
extension makes inherited, the stored value on the object that holds it), so one declaration on a collection
gates each instance by that instance's own value (e.g. a letter's `body` readable only by the
subject its `for` property names). It is meaningful only where an instance exists: a server
supporting it MUST evaluate it in object-level policy and in any rule an advertised extension sets for a single
property, MUST treat a missing
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
  ({{non-reader}}). A matcher admits the principal only if
  that `GET` would return the object.
* MUST treat an absent object, or one the principal may not read, as a non-match. If the server
  cannot complete the evaluation (for example, its store is unavailable), it MUST fail the request
  with a server error (`5xx`) rather than treat the matcher as either a match or a non-match.
* MUST accept it only in verb policy, and MUST reject it with `400` (`invalid-input`) in object
  policy (`$policy`) and in a rule an advertised extension sets for a single property. This mirrors `prop:` being refused in verb policy.
* MUST treat a `readers:` matcher found in object policy or in such a rule, however it came
  to be stored, as a non-match, and MUST NOT evaluate it. An object's `read` decision under the baseline
  object policy (`$policy`, a policy an advertised extension makes govern it, default) therefore never consults a `readers:`
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
honor an `Idempotency-Key` for the anonymous principal ({{taxonomy}}), and a server that has any
authentication configured gives it no asynchronous operations ({{operations}}).

Actions include `read` (with `read-data` / `read-code` refinements), `write`, `execute`, and
`manage` (changing policy; ownership itself is fixed, {{ownership}}). Evaluation is **deny-overrides with default-deny**: access is
granted only if at least one `allow` rule matches and no `deny` rule matches; with no matching rule,
access is denied.

**Attenuation never escapes a `deny` rule.** An **attenuated principal** is a principal from which
the server has kept only the subject, dropping its roles, groups, scopes, and claims, before running
code or evaluating access under it. In this document a server-initiated invocation under its
registrant ({{exec-identity}}), such as the lifecycle hooks, schedules, and verb subscriptions of
{{RESTACT-EVENTS}}, and a verb that runs as its owner ({{exec-identity}}) run under attenuated
principals. An extension that defines another says so, as {{RESTACT-DELEGATION}} does for a
path-scoped sub-token. On a server that
accepts `deny` rules, dropping those attributes could widen access, because a `deny` rule keyed on a
matcher the attenuated principal no longer carries would stop matching. Such a server MUST treat
every `deny` rule whose matcher depends on a role, group, scope, or claim as matching every
attenuated principal, wherever that principal is evaluated, including the read gates evaluated
against it, so that attenuation only narrows. A server that does not accept `deny` rules
({{simple-profile}}) is unaffected. The delegated tokens of {{RESTACT-DELEGATION}} are not
attenuated in this sense; their bounds are additional denials.

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

**Deny rules (OPTIONAL, feature `policy-deny-rules`).** A server that accepts and enforces `deny`
rules advertises `policy-deny-rules` ({{discovery}}). A client MUST NOT send a canonical policy that
carries a `deny` rule to a server that does not advertise it. Such a server MUST reject the policy
with `400` `invalid-input`, and MUST NOT store it in any form, with or without the `deny` rule, so a
deny-bearing policy is never silently weakened to its `allow` rules. A server that implements only
the deny-free simple subset does not advertise the token. An implementation MAY accept and present
only the simple profile and store canonical rules internally.

## Ownership is fixed {#ownership}

A resource's owner, an object's `$owner` or a verb's policy `owner`, is assigned once, when the
resource is created (first-writer-owns for an object; the deployer for a verb, {{deployment}}),
and is **fixed** thereafter. A server MUST NOT let any request change it, whoever makes it: not the
current owner, not a principal the resource's policy admits for `write` or `manage`, not a
delegated request (such as those of {{RESTACT-DELEGATION}}), and not a verb. Specifically:

* A data-plane write carrying `$owner` is admitted only when the caller is the object's current
  owner (for this rule, and for a `$policy` write, an object with no recorded owner is treated as owned by the anonymous identity) AND the value equals
  that owner; the member then changes nothing. Any other `$owner` member MUST be refused `403`
  (`forbidden`; to a caller who may not read the object, the answer for an absent object,
  {{non-reader}}), and the write
  MUST change nothing. A caller that is not the owner receives that
  refusal whatever value it sends. The exception is a `null` `$owner`. It MUST be refused `400`
  (`invalid-input`) whoever sends it ({{representations}}). That refusal depends on nothing stored, so it takes the place of the `403` ({{non-reader}}).
* A `PUT …:verb/policy` follows {{simple-profile}}: an `owner` equal to the current owner is a
  no-op, and any other `owner` is refused.
* No deployment, replacement, rollback, or verb-property write changes a verb's owner
  ({{deployment}}).

The reason is the authority an owner lends. A lifecycle hook runs under its owner's authority
(the "Events, Triggers, and Scheduling" section of {{RESTACT-EVENTS}}), and a runs-as-owner verb under its owner's ({{exec-identity}}); both resolve the
owner when they run. If ownership could be reassigned, whoever wrote such code could name another
principal as its owner and then trigger it, and that principal's authority would back code it never
chose. The owner-made opt-in rule forbids exactly that. Sharing is unaffected: an owner lends access
through policies ({{authz}}) without moving the owner identity. Deleting a resource lets anyone
create a new one at its path, subject to any creation rule an advertised extension adds, and the
new resource inherits nothing of the old one's ownership or code.

Because nothing can change hands, a resource whose owner can no longer authenticate cannot be
managed by anyone else. A server MAY offer an operator act that an advertised extension defines at
E1 ({{extensions}}), such as the ownership recovery of {{RESTACT-DELEGATION}}; such an act is the
only way an owner changes.

## Execution identity {#exec-identity}

In this version, a verb executes with the **caller's** principal. A verb's effective authority is
the intersection of the caller's permissions on the targets it touches, the capabilities the verb
declared ({{capabilities}}), and the target objects' policies. Consequently a verb can do nothing
the caller could not do directly, and nothing it did not declare. The compute cost of an
invocation is attributed to the caller, unless an advertised extension attributes it otherwise
({{extensions}}, E13).

A **server-initiated** invocation (a trigger or schedule; the "Events, Triggers, and Scheduling" section of {{RESTACT-EVENTS}}) has no request caller and
instead runs with the attenuated authority of the principal who registered it, its **registrant**. The social-media
case — a profile owner's verb running when a visitor interacts — is exactly this: it is a trigger
registered by the owner, so it runs with the *owner's* attenuated authority (never the visitor's),
observes only what the policy exposes about the visitor through the event payload, and is charged to
the owner.

**Runs-as-owner (OPTIONAL, feature `runs-as-owner`).** A server MAY support a deploy-time,
callee-side opt-in (`runs_as=owner`) under which a verb executes with its **owner's** attenuated
authority instead of the caller's — the explicitly gated "set-uid" mechanism. Constraints: the
opt-in MUST be made by the owner at deploy (it is the owner's authority being lent to the code;
because ownership is fixed, {{ownership}}, the owner who opted in is the owner the verb runs as,
unless an operator act defined at E1 withdrew the opt-in, {{extensions}}, E4);
the verb's execute policy MUST still be evaluated against the **real caller** (the flag never
widens who may trigger the verb); the synthesized owner principal MUST be an attenuated principal ({{authz}}), as a
server-initiated registrant is (the owning subject only);
compute cost MUST remain attributed to the real caller (attributing it to the owner would let any
caller drain the owner's quota), except as an advertised extension attributes it at E13, under the
bound that point requires ({{extensions}}); and the descriptor MUST advertise the switch (`runsAs: "owner"`)
so callers know the verb does not act as them. The confused-deputy burden falls on the opted-in
verb: its input is caller-controlled and MUST be treated as untrusted, and a server MUST NOT
surface the real caller's identity to the verb through a forgeable channel (such as the input
payload).

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
  concurrency: a representation carries an `ETag` ({{RFC9110}}, Section 8.8.3), a data-plane write
  (`PUT`, `PATCH` or `DELETE`) MAY carry `If-Match` / `If-None-Match`, and a precondition failure
  results in `412`. A precondition from a caller who may write or delete the object but may not
  read it is evaluated as {{non-reader}} requires. An object's entity tag is a strong tag computed over the RFC 8785 canonical form
  {{RFC8785}} of the caller-readable member map (for a binary value, also over its content and
  content type) together with the object's own stored `$owner` and `$policy` ({{representations}}),
  so it changes when any of them changes, including on a write that sets or removes only `$policy`
  and on an operator reassignment of `$owner` ({{ownership}}). It does not cover a policy that
  governs the object without being stored on it ({{extensions}}, E6). Because `$owner` and
  `$policy` are not part of the representation, the tag MUST NOT disclose anything about either
  beyond whether it changed: a caller MUST NOT be able to confirm a guessed owner or policy from a
  tag, or learn by comparing two objects' tags whether theirs are equal. (Informative: the reference
  host uses a keyed MAC bound to the object's path.) A
  precondition on an action is refused instead, as the paragraph after this list requires. At this level the precondition is **best-effort**: the check and the write are not
  guaranteed to be one atomic compare-and-swap, so two concurrent writers MAY both pass `If-Match` and
  the later write wins (last-writer-wins under the precondition). A guaranteed atomic CAS — where at
  most one of two concurrent conditional writers succeeds — otherwise requires the **transactional**
  level, **unless the server advertises the `atomic-conditional` feature** ({{discovery}}): a server
  advertising that token guarantees that a single-resource `If-Match` check-and-write is performed as
  one atomic compare-and-swap, so at most one of two concurrent conditional writers to the same
  resource succeeds (the other receives `412`) even at the `conditional` level. The same guarantee
  covers a create-only write (`If-None-Match: *`): the existence check and the write are one atomic
  step, so of two concurrent create-only writers to the same resource at most one succeeds and the
  other receives `412`. The `atomic-conditional` feature is optional and advertised, so a server
  that omits it remains conformant at the best-effort behavior described above. (Informative: the
  `object-cas` feature of {{RESTACT-OBJECTS}} exposes the same guarantee to verb code.)
* **atomic-invocation** — additionally, all data a single verb invocation mutates is atomic: it
  commits on a successful return and is discarded on an error return, a trap or a limit failure. A
  verb's error return is its return of an `invocation-error` ({{appendix-wit}}), or a return that an
  advertised extension defines as one, such as a status of `400` or more that a verb sets at E12
  ({{extensions}}).
* **transactional** — additionally, a same-server composition tree ({{composition}}) executes as one
  atomic, serializable transaction (mirroring the single shared budget); a conflict between
  concurrent invocations is resolved by aborting and optionally retrying one, and an unresolved
  conflict fails with `409`.

At every consistency level, a server MUST refuse an action request that carries `If-Match` or
`If-None-Match` with `400` (`invalid-input`) rather than ignore it, and the verb does not run, since
an action's writes are not one step that a precondition could guard. (Informative: this covers a
data method that an accessor action serves, as in the "Active Properties (Accessor Verbs)" section
of {{RESTACT-OBJECTS}}.)

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
(the "Object collection listing" section of {{RESTACT-OBJECTS}}) and the discovery document: `pageSize` and an **opaque** `pageToken`, returning
`nextPageToken` {{AIP158}}; a `filter` expression {{AIP160}}; and an `orderBy` parameter. A `pageToken`
is opaque to the client (a server-defined cursor); a client MUST treat it as such and MUST NOT
construct or mutate one, and a server MAY expire a token (a stale token yields `400 invalid-input`).
For partial reads and writes, servers SHOULD support field masks {{AIP161}}: a `readMask` query
parameter selecting fields on `GET`, and an `updateMask` on `PATCH` (with `*` meaning full
replacement). The object listing (the "Object collection listing" section of {{RESTACT-OBJECTS}}) is the
exception: it spells its field mask `read_mask`.

# Asynchronous Operations {#operations}

A verb whose execution may exceed an interactive time bound MAY be invoked asynchronously.

**Election.** A client requests asynchronous handling with the `Prefer: respond-async` header
{{RFC7240}} on the invocation; a server MAY also elect async on its own for a verb it advertises as
always-asynchronous (the per-verb `asyncOperation` discovery field, {{discovery}}). When async
handling occurs the server responds `202 Accepted` with a `Location` header naming an operation
resource under `/operations/` (a URI reference that resolves under the server's base URL,
{{base-url}}). The body of that response SHOULD be the operation resource in its first state,
carrying `name` as a listing entry does ({{operations-listing}}). A server that does not support
async handling ignores the preference and runs the verb synchronously.

**Resource and states.** The operation resource, following {{AIP151}}, reports at least `done`
(boolean); while running, `done` is false; on completion `done` is true with either a `result` or an
`error` (Problem Details, {{errors}}), plus OPTIONAL `metadata`. A client polls with `GET`. `DELETE`
requests **best-effort cancellation** and returns `200`; a cancelled operation completes `done` with
an `error` whose `restact_code` is `cancelled`.

**Access scoping.** An operation is **owner-scoped**: only the principal that started it may poll or
cancel it. Any other principal — and a non-existent or expired id — MUST receive `404` (absent-
indistinguishable: the id is not a cross-tenant handle, and the response is no existence oracle;
but see Unauthenticated callers below). The
operation id MUST be opaque and SHOULD be unguessable, so a sequential value cannot be used to
enumerate other callers' operations.

**Unauthenticated callers.** Every unauthenticated caller is the same anonymous principal
({{authz}}), so owner scoping cannot keep one such caller's operations from another. On a server
that has any authentication configured, the anonymous principal owns no operations:

* The server MUST NOT create an operation for it: it MUST ignore `Prefer: respond-async` from an
  anonymous caller and run the verb synchronously, as a server without async support does, and it
  MUST NOT elect async on its own for that caller.
* `GET` on an operation MUST return `404`, as for an id the caller does not own. A server that
  offers the listing ({{operations-listing}}) MUST return an empty list.
* `DELETE` on an operation MUST be refused with `401`, as an anonymous caller's other owner-gated
  mutations are ({{authz}}). The server MUST refuse before it looks the id up, so the answer is the
  same for an existing id and an invented one. For this caller the `401` takes the place of the
  `404` that access scoping requires above.

An operation that an anonymous caller started before authentication was configured is
unreachable through these routes. On a server with no authentication configured, the
anonymous principal owns the operations it starts, as above.

**Retention.** Completed operations are retained for a bounded, server-defined window and MAY be
evicted; an evicted id reads as `404`. A server SHOULD retain a completed operation long enough for
the initiating client to retrieve its result at least once.

## Listing operations (OPTIONAL, feature `operations-listing`) {#operations-listing}

A server MAY let a client enumerate its own operations, so that a client that lost a `Location`
can still find the result. A server that does so advertises the `operations-listing` token and
answers `GET /operations` with `200` and a JSON object whose `operations` member is an array with
one entry per operation the server retains for the caller. Each entry has the form of the operation
resource and MUST also carry `name`: the string `operations/` followed by the operation id, so that
the client can poll or cancel it at `/operations/{id}`. A server SHOULD list the entries oldest
first, by when each operation started. An empty array means the caller has no retained operations.

The listing is owner-scoped like the operation resource. It MUST contain only operations the caller
started, and it MUST NOT reveal whether another principal has operations, how many, or their ids.
On a server with any authentication configured, the anonymous principal's listing is empty, as
{{operations}} requires: every unauthenticated caller shares that identity, so a listing
of its operations would hand one unauthenticated caller another's results.

The listing is not a read of an object path, so a credential that confines its bearer to part of
the object tree, such as a path-scoped sub-token of {{RESTACT-DELEGATION}}, does not authorize it.
A server MUST refuse such a request with `403` (`forbidden`).

A server MAY paginate the listing as {{collections}} describes. A response that carries a
`nextPageToken` holds part of the listing; one without it holds every operation the server retains
for the caller. Pagination never widens the owner scoping.

The token adds no member to the discovery document. A client MUST NOT rely on `GET /operations`
unless the token is advertised; a server that does not advertise it answers that request as it
answers any route it does not serve.

# Errors {#errors}

Error responses MUST use Problem Details {{RFC9457}} with media type `application/problem+json`,
except a verb's own response that an advertised extension admits at E12 ({{extensions}}).
REST:ACT defines two extension members: `restact_code`, a stable lower-kebab-case token naming the
error condition, and `restact_verb`, the verb route in question (the path from the colon onward,
e.g. `:summarize`). The defined `restact_code` values and their HTTP status codes are:

| `restact_code` | Status | Meaning |
|---|---|---|
| `timeout` | 504/408 | a deadline passed: `504` when a verb, its call tree or the server's handling of a request ran past it ({{limits}}, {{composition}}); `408` only when the server stopped waiting for the request's content ({{RFC9110}}, Section 15.5.9) |
| `cpu-budget` | 429 | compute budget exhausted, in the server's unit (fuel, instructions or steps) |
| `quota` | 429 | per-tenant quota or rate exceeded |
| `memory-limit` | 507 | memory limit exceeded |
| `composition-cycle` | 508 | composition cycle, or a call tree past the server's depth or per-invocation fan-out bound ({{composition}}) |
| `trap` | 500 | the verb's code faulted while it ran (a WebAssembly trap not caused by one of the limits above, or a call of the HTTP verb interfaces by a verb that does not hold them, {{RESTACT-HTTP-VERBS}}); the server ended the invocation |
| `application-error` | none | a registration's target failed in a way that arose in the verb and that no registered code names, such as an error code of the verb's own choosing. It appears only in a firing outcome (the "Firing outcomes (OPTIONAL, feature `registration-outcomes`)" section of {{RESTACT-EVENTS}}), never as the code of a response |
| `disallowed-import` | 403 | the component imports a capability the server does not permit or does not implement |
| `not-declared` | 403 | undeclared composition target |
| `forbidden` | 403 | caller not authorized for the action |
| `forbidden-side-effect` | 403 | a function attempted a side effect (write/publish/action call), or a verb called an action over an edge recorded as a function call ({{composition}}) |
| `invalid-call-graph` | 400 | a function declared a call to an action at deploy |
| `unauthorized` | 401 | authentication required (or invalid credential) |
| `unsupported-feature` | 501 | optional feature/level not supported |
| `unsupported-consistency` | 501 | operation not admitted at the server's consistency level (e.g. `object-cas` under `atomic-invocation`) |
| `conflict` | 409 | unresolved write conflict (transactional level), another operator act in progress ({{admin-reset}}), or a duplicate of a request still in flight that the server runs at most once (single-flight), such as a retry under the same `Idempotency-Key` ({{taxonomy}}) |
| `precondition-failed` | 412 | an `If-Match`/`If-None-Match` precondition failed, or the expected value of a compare-and-swap did not match (the `object-cas` feature of {{RESTACT-OBJECTS}}) |
| `object-too-large` | 413 | object data exceeds a per-object size/key cap, or the objects one invocation writes exceed a per-invocation cap |
| `payload-too-large` | 413 | the request content exceeds a server size cap |
| `not-found` | 404 | no such verb, object, or operation, or an object the caller may not read ({{representations}}, {{non-reader}}). On a server that advertises `verb-not-deployed`, an invocation or composed call of a route that resolves to no verb is answered with that code instead ({{composition}}) |
| `verb-not-deployed` | 404 | the invoked route, or a composed call's target, resolves to no verb definition ({{resolution}}); no verb ran for that route. Answered only by a server that advertises the `verb-not-deployed` feature, and never passed up from a verb that ran ({{composition}}) |
| `method-not-allowed` | 405 | the method does not match the verb kind, or is unsupported on a bare object |
| `invalid-component` | 400 | the uploaded bytes are not a valid Wasm component |
| `verb-unlinkable` | 500 | a stored verb no longer links against the host; the host never ran it |
| `internal` | 500 | the server failed in a way the request did not cause |
| `unavailable` | 503 | the server cannot serve the request now, because a store or backend failed or a server-wide capacity is full; a later retry may succeed |
| `invalid-source` | 422 | source rejected by the runtime (parse/validation) |
| `unsupported-language` | 415 | the server does not support the source language of uploaded verb code ({{languages}}) |
| `invalid-input` | 400/415/422 | malformed or rejected input; `415` for a request body whose media type the server does not accept |
| `cancelled` | none | the operation ended because a client cancelled it ({{operations}}). It appears only as the code of an operation's `error`, never as the code of a response |

Additional values MAY be registered ({{iana}}). A server MUST NOT answer with an unregistered
`restact_code` for a condition that a registered code names. This rule binds the codes a server
chooses. A code that a verb returns in its `invocation-error` is the verb's own, and a server MAY
answer with it except where this document requires another ({{composition}}, and the codes only
the server attests, below). A code that an
extension defines names its condition only on a server that advertises a feature token that covers
it ({{extensions}}). A client that does not recognize a `restact_code` SHOULD act on the HTTP status
alone.

**Codes only the server attests.** A registered code is **guest-raisable** when its registry entry
says so ({{iana}}). Of the codes in the table above, `invalid-input`, `forbidden`, `not-found` and
`conflict` are guest-raisable, and a code that another document registers is not unless that
document says so. Because a verb may return `conflict`, a `409` with that code does not show that the
server holds a duplicate of the request in flight: a client that retries on it, as a retry under
the same `Idempotency-Key` may, MUST bound its retries, since a verb's own `conflict` can recur on
every attempt. Every other registered code, and every unregistered code that a server uses for a
condition of its own, names a condition that only the server attests. A server SHOULD document the
unregistered codes it uses for conditions of its own. When a verb returns such a code in its
`invocation-error`, a server MUST NOT answer with that code unless the server itself raised a
refusal with that code in the same invocation tree ({{composition}}). A composed call or a call to a
capability interface that the server refuses raises its refusal's code in the tree; a code that a
called verb returns does not. The server MUST answer instead, except for `verb-not-deployed`, which
{{composition}} answers as `not-found`, exactly as it answers a verb that returns `invalid-input`,
so with none of the header fields that the code's own condition carries (such as `WWW-Authenticate`
or `Retry-After`), and with a detail that names the code the verb returned. This holds whatever
capability interfaces the verb imports, and in every answer that carries the invocation's outcome: a
response, an operation's `error` ({{operations}}), and the result that a composed call returns to
its calling verb ({{composition}}). For a verb in a source-only language ({{languages}}), the
server's runtime component is part of the server, and the script it runs is the verb. A code that
the registry does not list and that the server does not use for a condition of its own stays the
verb's own.

For multi-field validation failures, a response MAY include an `errors` array whose entries carry a
`source` object with `pointer` and/or `parameter` members (the convention of {{JSONAPI}}). For gRPC
interoperability a server MAY include a `restact_grpc_code` member carrying the `google.rpc.Code`
name as a string (e.g. `RESOURCE_EXHAUSTED`).

# Operator Reset (OPTIONAL, feature `admin-reset`) {#admin-reset}

A server MAY let a configured operator return it, without a restart, to the state of a fresh start
over empty storage. It advertises the `admin-reset` feature token when the act is available. The
act belongs to the operator, not to the product's users. A server that offers it:

* MUST admit it only for principals that a list of subject matchers ({{authz}}) in server
  configuration admits. A matcher that needs a resource, such as `owner` or `prop:`, admits no one
  there, and a server MAY refuse a list that holds one;
* MUST refuse the anonymous principal with `401` on a server with any authentication configured, as
  for every mutation ({{authz}}), and MUST refuse a principal the list does not admit with `403`
  (`forbidden`);
* MUST refuse with `403` a credential that carries less than its principal's full authority, such
  as the path-scoped and delegated tokens of {{RESTACT-DELEGATION}};
* MUST answer as if the act did not exist when it is not configured, and MUST NOT advertise the
  token then;
* MUST refuse with `409` (`conflict`) a request that arrives while another reset, or another
  operator act that copies or replaces the server's stored state, is in progress. It does not queue
  the request.

**Effect.** The act discards every resource and record that clients created: deployed verbs and
their code, object data, asynchronous operations ({{operations}}), idempotency records
({{taxonomy}}), quota usage, and the state that extensions keep for clients, such as the
registrations and retained events of {{RESTACT-EVENTS}}. The server then creates again what it
creates at startup. The result is the state of a fresh start over empty storage under the same
configuration. The act MUST NOT change that configuration, so discovery advertises the same
features after a reset as before it.

Some state outlives the act, so that a handle issued before it never names something created after
it. An operation id issued after a reset MUST differ from every operation id issued before it. On a
server that delivers events to clients, an event id issued after a reset MUST be greater than every
id issued before it on the same topic, so that a client resuming a stream with its last id (the
"Delivering events to clients (SSE)" section of {{RESTACT-EVENTS}}) receives the events published
since the reset. A stream open at the reset MAY end. An extension can name other state that
outlives the act, such as the webhook replay identities of {{RESTACT-HTTP-VERBS}}, which a reset
keeps so that a delivery accepted before it does not run again.

The act is not atomic. A server SHOULD let invocations already running finish before it discards
state, and a write that races the act MAY survive it. A server that fails partway answers with a
`5xx` problem and MAY leave state partly discarded; repeating the act completes it.

A server that advertises the token MUST accept the act as a `POST` to `/admin/reset`, which needs no
request content, and answers success with `200` and a JSON object whose `reset` member is `true`,
once the startup state is in place. It MAY also offer the act through another operator interface
with the same semantics.

~~~
POST /admin/reset
→ 200 {"reset": true}
~~~

# Discovery {#discovery}

A server MUST support `OPTIONS` on object, verb, and verb-property paths, reporting the methods it
supports at that path in the `Allow` header field ({{RFC9110}}, Section 10.2.1). A verb property the
server does not support is a resource that does not exist, so `OPTIONS` on its path answers `404`
like any other request to it; a client learns a verb's properties by asking about each one. A
conformant server MUST publish a discovery document at `/.well-known/restact`, relative to its base
URL ({{base-url}}), describing the **feature tokens it supports**, its **consistency
level** ({{conformance}}, {{consistency-txn}}), and its **object-binding mode** (`implicit` unless the server couples the planes;
{{conformance}}),
and the verbs available to the caller — their kind (function/action), binding, declared capabilities and call
graph, and accepted source languages; it SHOULD also advertise the limits that apply to each verb
(carried in the verb's `capabilities`, below). The document is a JSON object and, at a minimum,
MUST carry:

* a `service` object with a `version` string (the version of the companion extension the document
  targets), a `features` array (the advertised feature tokens, from the registry in {{iana}}), a
  `consistency` string, an `objectBinding` string naming its object-binding mode whenever that mode
  is not `implicit` (a document without it describes `implicit`; {{conformance}}),
  and a `defaultCapabilities` object: the capability and resource envelope
  applied to verbs that do not override it; and
* a `verbs` array, each entry naming a verb's `route` and a `verb` object giving its `name` and
  `kind` (`function`/`action`) and, where declared, its `binding`, `callGraph`, and a
  `capabilities` object.

**Under a prefix.** For a server whose prefix is empty, the document's URL is the well-known URI
registered in {{iana}}. For a server with a prefix it is `<prefix>/.well-known/restact`, which
{{RFC8615}} does not make a well-known URI: the name is this document's convention, kept so that
one rule gives the document's URL from any base URL. Such a server need not answer at the
`/.well-known/restact` of its origin, and a client MUST NOT look there for it ({{base-url}}).

**Per-caller listing.** The `verbs` array lists a verb only when its policy admits the caller for
`read` or `execute`, or the caller is its owner ({{authz}}), decided against current state. A server
authenticates a discovery request as it does any other request: with no credential the caller is
anonymous, and a credential that fails verification is refused with `401`. The `service` object
does not depend on the caller. A server MUST NOT let a shared cache replay the
document to a different caller: it marks a response computed for an authenticated caller
`Cache-Control: private`, and every response `Vary` with the request header fields it reads identity
from (at least `Authorization`). A verb missing from the document may still be deployed: a client
MUST NOT infer from its absence that none is ({{resolution}}).

A `capabilities` object (a verb's, or the service's `defaultCapabilities`) carries the capability
envelope — `world` (the WIT world the component targets), `interfaces` (the imported capability interface ids), `networkAccess`
(`none`/`outbound`/`full`) and `sideEffects` — and the resource limits ({{limits}}) as optional
members: `maxDurationSeconds` (wall clock, seconds), `maxComputeUnits` (compute budget,
in the server's unit, {{limits}}; absent when the server enforces no compute limit, or only the
per-invocation cap that {{composition}} rule 3 permits a sequential server),
`maxMemoryBytes`, `maxInputBytes` and `maxOutputBytes`. A server SHOULD advertise the limits it
enforces. All members are optional. A client that finds `maxComputeUnits` absent plans against
`maxDurationSeconds` alone, and can still receive `429` (`cpu-budget`) from such a cap.
For a verb in a source-only language ({{languages}}), the runtime component's imports do not
describe the verb, so `interfaces` lists the interfaces the server grants it. These are the
interfaces the server implements that the verb's record does not withhold, less any whose feature
token the server does not advertise.

A server MAY add further fields; clients MUST ignore unknown ones. An extension document MAY define
a member of the `service` object for a feature it defines; its schema is part of the companion
OpenAPI extension, and a client relies on the member only while the server advertises that
feature's token. The full schema (including each optional feature's fields) is defined by the
companion OpenAPI extension ({{iana}}), which extends but does not contradict this minimum.

A server MAY additionally advertise a `service.openapi` member: a URI reference, resolved relative to
the discovery document's own URL, naming an OpenAPI document that describes the server's live surface
(conventionally `/openapi.json` relative to the base URL, so a server under a prefix writes the
reference with its prefix, {{base-url}}). A server that advertises it MUST also advertise the
`openapi-document` feature token, and the referenced document SHOULD carry the companion extension's
`x-restact` (service-wide) and `x-restact-verb` (per-operation) members so a generic OpenAPI client
can recover the REST:ACT semantics. An OpenAPI document gives its paths relative to the URL of a
`servers` entry, so a server with a prefix MUST give the document a `servers` entry whose `url`
names its base URL and MUST write the document's paths without the prefix; a generic OpenAPI client
then forms the URLs {{base-url}} defines. The document is computed for the caller under the same
authentication and caching rules, and MUST NOT reveal more about deployed verbs than that
caller's discovery document does. This lets a client discover the OpenAPI description from the server itself
rather than being handed it out of band; it is a convenience, not a substitute for the discovery
document or `OPTIONS`.

These channels have defined roles: **`OPTIONS`** is authoritative for the capabilities of a
specific path (mandatory, evaluated live); the **`/.well-known/restact`** document is the
service-level manifest and the caller's verb listing (and MAY be cached, as above); the **`$verbs`** representation field
({{representations}}) is a convenience link map into each verb's **`meta`** ({{verb-properties}}),
which is the per-verb authoritative record.

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
  back ends. Servers MUST enforce per-invocation limits ({{limits}}) and a single shared bound
  across composition trees ({{composition}}), and SHOULD enforce per-tenant quotas with
  fail-closed circuit breakers and spending caps applied before dispatch to any metered back end.
* **Autonomous execution.** Server-initiated invocations ({{exec-identity}}), such as the lifecycle
  hooks, subscriptions and schedules of {{RESTACT-EVENTS}}, run without a connected client and are a denial-of-wallet and amplification vector (event storms, runaway
  schedules). A server MUST bound them by the registering principal's quota and the per-invocation
  limits, and SHOULD rate-limit event fan-out and scheduled firings.
* **Metering evasion.** Compute accounting in a deterministic unit correlates imperfectly with
  wall-clock cost, so the wall-clock limit ({{limits}}), which every server enforces, is the
  backstop.
* **Confused deputy.** Granting a verb authority broader than its task risks misuse. The
  runs-as-caller rule ({{exec-identity}}) and capability attenuation ({{composition}}) bound a
  verb to the caller's own authority and its declared capabilities.
* **Tokens that name an actor.** An identity provider that issues a token naming an actor (an
  `act` claim, {{authentication}}) may expect the resource server to bound that actor. A REST:ACT
  server bounds only the actors of tokens it issued itself under an extension, and serves any other
  token that names an actor as a bearer of its subject's full authority. A deployment SHOULD accept
  such tokens only when it intends them as bearers of their subject.
* **Caller identity and personal data.** By default a verb is given a pairwise subject and no
  claims ({{caller-identity}}), so the `identity` interface does not tell a verb's author who its
  callers are. The default has limits, and it covers only what that interface returns.
  It is not anonymity: the identifier is stable, so an owner recognizes a returning caller and can
  build a record of what that caller does. It is scoped to the verb's owner, not its author: a
  principal the verb's policy admits for `write` can replace the code and read the same
  identifiers. Two owners cannot compute each other's identifiers, but a verb that calls another
  owner's verb can pass it its own identifier, and two owners can match anything else both see:
  input the caller supplies, the time of a call, and the caller's roles, scopes, groups and
  operator-listed claims, which together can single a caller out and whose names can be sensitive
  in themselves. An operator for whom that matters SHOULD withhold such names from verbs and list
  no claim that narrows the caller down. Withholding a name does not hide it from a verb that can
  call a verb or read an object whose policy names it, and such a verb can confirm a guessed
  subject the same way. A verb that holds the object capability also acts as the caller in the
  store, and the store records the real subject: a property the verb has the server fill with
  the caller's subject holds it for every reader of the property, the verb included, and an extension may show a reader who created or last
  wrote an object, or name that principal to a hook or in an event. Such a verb can read whatever
  personal data the caller may read. The composition and object capabilities are thus each a way
  to learn who the caller is; both are gated, and both show in the verb's `interfaces`
  ({{discovery}}), which is where a caller or an operator who cares looks. A pairwise subject that a verb stores where a matcher reads it is a string like any other: it
  does not admit the caller it stands for, and it does admit a principal whose real subject is
  that string, such as one who read the identifier and could choose it as an account name. A verb
  names its caller for a matcher only through the object capability's `set-subject`. Anyone who
  obtains the server's key can confirm a guessed subject against every identifier derived with it. A server
  that loses or replaces the key, or whose operator changes whether it discloses the real
  identity, changes what every verb reads from then on, and data that verbs keyed by the earlier
  identifiers no longer matches any caller. An operator SHOULD decide the setting before verbs
  store such data, and SHOULD enable disclosure only where every principal who may deploy a verb
  is trusted with the identity of every caller.
* **Cross-principal interaction.** When a verb runs in response to another principal's action, the
  platform MUST NOT expose that principal's credentials or private data to the verb beyond what its
  policy and the verb's declared capabilities permit.
* **Optional calls.** A verb that calls another verb only when one is deployed (a veto, an extension
  point) must treat only `verb-not-deployed` as absence; `not-found` can come from a deployed verb
  that refused ({{composition}}). A guard must be executable by every caller it guards (an execute
  refusal fails closed), and a calling verb that builds a target route
  from input must validate that input, because a well-formed but wrong route is truthfully answered
  as absent.
* **Existence of unreadable objects.** A caller who may not read an object gets the answer an
  absent object would get from a read ({{representations}}), the policy read-back, and a refused
  write or delete ({{non-reader}}). Three limits remain. Where a request would succeed at a free
  path, the server refuses it as not-found instead, so a caller that may create at a path learns
  whether the path is taken. Where an advertised extension makes a verb's binding imply that its
  object exists, the definition paths the discovery document lists for a caller ({{discovery}}) tell
  that caller the object exists. And the time the authorization decision takes varies with the
  policy that governs the object. (Informative: the "Security Considerations" section of
  {{RESTACT-OBJECTS}} applies these limits to listing and binding.)
* **Entity tags and authorization metadata.** An object's entity tag covers its `$owner` and
  `$policy` ({{consistency-txn}}). A caller who may read the object but not its policy therefore
  learns when its owner or policy changes, though not what changed; the provenance facet of
  {{RESTACT-DELEGATION}}, where advertised, already tells such a caller when any write happened.
  A tag computed as an unkeyed hash of those members would let that caller confirm a guessed
  owner or policy offline, which {{consistency-txn}} rules out. A caller who may write an object
  but not read it is sent no entity tag, and none it sends is compared ({{non-reader}}), so a
  conditional write cannot confirm a guess at the object's content.
* **Verb routes are not secrets.** Discovery lists only the verbs a caller may see, but a caller who
  names a route can still learn whether a verb is deployed there: `OPTIONS` answers without
  credentials, and an invocation is refused rather than answered as absent ({{resolution}}). A verb
  is protected by its policy, not by its name.
* **Listing asynchronous operations.** The listing of {{operations-listing}} is owner-scoped like
  each operation, so it reveals nothing about another principal's operations. On a server with no
  authentication configured, every caller is the same anonymous principal, so the listing gives any
  caller the result of every asynchronous invocation made there; without the listing, a caller
  learns a result only by holding its unguessable id. A deployment that needs results kept apart
  between callers configures authentication, and the anonymous principal's listing is then empty.
  A credential confined to part of the object tree is refused the listing, since an operation has
  no object path to confine it to.
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
* **An object named `{id}`.** On the verb-property plane a segment that decodes to `{id}` names
  the wildcard definition, which serves every sibling ({{grammar}}). A client that builds a
  verb-property path from a name it did not choose refuses the name `{id}`.
* **Binding under authentication.** Under `implicit`, a verb's binding does not depend on owning the
  object it is bound under, so on a server with more than one authenticated principal any caller can
  bind a verb on an ancestor of another principal's objects and act on their requests to it, as can
  a caller who binds an accessor, a lifecycle hook or a property declaration where an advertised
  extension defines them. (Informative: the coupled object-binding modes and the ancestor-creation
  rule of {{RESTACT-OBJECTS}} mitigate this, as its "Security Considerations" section describes.)
  Creating an object below an
  existing one still accepts that ancestor's owner as an authority over it.
* **Policy authority.** If the `write` policy admitted a write of `$policy`, any writer could
  replace the policy and admit itself to `read` and `delete`: a drop box (`read: [owner]`,
  `write: [public]`) would be readable by anyone. Setting `$policy`, and reading it back, therefore
  takes the owner's authority, which no `write` grant confers ({{representations}}).
* **Pushed authority (ownership reassignment).** Code that runs under its owner's authority, a
  lifecycle hook or a runs-as-owner verb, must run only as a principal that chose it. A server that
  let a resource's owner be reassigned would let any principal able to deploy code make another
  principal its owner and then trigger it. Servers MUST keep ownership fixed ({{ownership}}). Only
  an operator act that an extension defines at E1 changes an owner, and E4 lets that act withdraw
  a runs-as-owner opt-in ({{extensions}}). The extension that defines such an act says how the act
  avoids pushing authority, as the "Security Considerations" section of {{RESTACT-DELEGATION}} does.
* **Operator reset.** The act of {{admin-reset}} removes every principal's resources although none
  of their policies admits it: it is the in-band form of discarding the server's storage. A
  deployment SHOULD admit only a dedicated operator subject, since every full credential issued for
  that subject carries the act. A list that admits `public` admits every caller of a server with no
  authentication configured, and every authenticated principal of a server with it. A narrowed
  credential is refused because its bounds say nothing about an act that touches every resource. A
  request that arrives during another operator act is refused rather than queued, so repeated
  requests cannot stack destructive work. The act is not atomic: a write that races it can survive,
  and a reset that fails partway leaves state partly discarded until it is repeated.


* **CORS is not authorization.** Cross-Origin Resource Sharing ({{FETCH}}) decides only whether a
  browser lets a page read a response, never whether the server accepts the request, so a server
  MUST authorize every request it accepts as {{authz}} describes, whatever its CORS policy. A
  REST:ACT client presents a bearer credential that the page attaches itself, so a server SHOULD NOT
  send `Access-Control-Allow-Credentials`, and a server that allows cross-origin reads SHOULD name
  the origins it allows.
* **Input in the request target.** A function's `?input=` is part of the request target, so it can
  reach server and intermediary logs, browser history and the `Referer` header field ({{RFC9110}},
  Section 17.9).
* **Paths a platform normalizes.** A server exempt from the dot-segment rule of {{grammar}}
  serves the path its platform hands it, which can differ from the path the client sent in more
  than dot segments: a URL parser of the kind a Fetch-style runtime ({{FETCH}}) uses also reads
  `\` as `/`. A component in front of such a server that admits, refuses or routes requests by
  path, such as a proxy that admits requests by path prefix or a router that divides an origin
  between applications, can then decide on one path while the server serves another, including
  one outside the prefix the component matched. A component that decides on the normalized path,
  or that refuses a request whose path holds a `.` or `..` segment, literal or percent-encoded, or
  a `\`, is safe in front of any server. Checks inside the server are unaffected: each sees the
  path the server serves.
* **Cross-site requests.** CORS does not keep a request from reaching the server: a browser sends a
  cross-origin `POST` with a form-encoded, multipart or `text/plain` body without a preflight. A
  server SHOULD refuse with `403` (`forbidden`) a cross-origin request whose method is not safe
  ({{RFC9110}}, Section 9.2.1), unless the request's origin is one the server names as allowed, or
  the server allows every origin and the request is one a browser sends only after a successful
  preflight (a method other than `GET`, `HEAD` or `POST`, or a single `Content-Type` other than
  `application/x-www-form-urlencoded`, `multipart/form-data` or `text/plain`). A server that accepts
  a credential the browser attaches on its own (a cookie, HTTP authentication, or an identity a
  fronting proxy derives from one), or that lets an anonymous caller change state, MUST apply this
  refusal. A request is cross-origin when its `Sec-Fetch-Site` header ({{FETCH-METADATA}}) is present
  with a value other than `same-origin` or `none`, or, without that header, when its `Origin` header
  ({{RFC6454}}) names a host and port other than the request's own authority. The origin `null` is
  always cross-origin and never matches an origin the server names as allowed. A request carrying
  neither header did not come from a page and is unaffected, and an `Authorization` header is no
  evidence that a request is same-origin. Comparing the origin with the request's authority is
  meaningful only for a name the server recognizes as its own, so a server SHOULD also refuse a
  request whose `Host` it does not recognize, as a page reached through DNS rebinding presents one.
* **Verb output on the server's origin.** A verb's author declares the media type of its response
  ({{deployment}}), and a browser that renders a response as an active document runs its script as
  the server's origin. A server MUST send `X-Content-Type-Options: nosniff`, and SHOULD send a
  Content-Security-Policy that allows no script, loads no frames and submits no forms, with every
  response whose body is a verb's output, whatever its media type. For example, the policy
  `default-src 'none'; style-src 'unsafe-inline'; img-src http: https:; base-uri 'none'; form-action
  'none'; frame-ancestors 'self'` meets this and still allows inline style, remote images, and
  framing by the server's own pages. A media type is script-capable when its type and subtype,
  ignoring parameters and compared case-insensitively, are `text/html`, `application/xhtml+xml`,
  `image/svg+xml`, `application/xml`, `text/xml`, `text/xsl`, `multipart/x-mixed-replace`, or any
  `+xml` type. A server MUST NOT serve a verb's output of a script-capable type for inline rendering
  on its origin, except `text/html` sent with such a policy. It meets this rule by serving the body
  with `Content-Disposition: attachment`, or by refusing such a type before serving it (a declared
  type, at deployment). A `Content-Type` that is not exactly one media type (for example a list, a
  value with a comma anywhere, or a value without a `/`) MUST be handled as script-capable and not
  `text/html`, so the server fails closed: a browser or an intermediary may read a type in it that
  the server did not.
* **A server that shares its origin.** A server shares its origin when its base URL has a prefix
  ({{base-url}}), and also when it has the empty prefix and its origin serves other content, for
  instance behind a proxy that routes some paths elsewhere. It shares it with the application it
  is mounted in or beside, and with any other server there. A
  browser draws no boundary between the paths of one origin: script that runs in a document served
  from the server's paths reads the application's cookies, storage and pages, and the application's
  pages reach the server as same-origin. The rules above are then what protects the application
  from a verb's author, so such a server MUST send the Content-Security-Policy of the previous item
  with every response whose body is a verb's output, where a server that owns its origin SHOULD.
  It MUST apply that item's rules in the same way to every other response whose body is content a
  client supplied, such as a verb's source, or stored bytes served with the media type they were
  written with (informative: the "Binary values (OPTIONAL, feature `binary-values`)" section of
  {{RESTACT-OBJECTS}}). Those rules govern a response a browser renders as a document. They do not
  stop a page of the application from loading the server's responses as script or style, and a
  policy of the application that
  admits `'self'` admits them, so an application that mounts a server cannot rely on such a policy
  to contain injected markup.
  The `frame-ancestors 'self'` of that example admits the application's pages as well as the
  server's. The cross-site refusal above does not stop a page of the application, including one an
  attacker has injected script into, from calling the server with whatever credential the browser
  attaches, because that page is same-origin: the application is part of what such a server trusts.
  A browser sends the application's cookies to the server's paths, a cookie's `Path` attribute
  being no security boundary, so a server that takes a principal from them accepts a credential the
  browser attaches on its own and MUST apply that refusal.

Authentication and authorization are as described in {{authz}}; transport MUST be protected with
TLS, except a connection over a loopback interface, which never leaves the host: for example, from
a client on the same host, or from a proxy on the same host that terminates TLS for remote clients.

# IANA Considerations {#iana}

This document requests the following registrations (details to be completed in a later revision).

* **Media type** `application/restact+json` for REST:ACT native representations.
* A well-known URI {{RFC8615}} `restact` for the discovery document of a server whose base URL has
  the empty prefix ({{discovery}}).
* A **"REST:ACT Verb Property Names"** registry (initial entries `code`, `policy`, `meta`),
  registration policy Specification Required {{RFC8126}}.
* A **"REST:ACT Capability Interfaces"** registry for standard host interfaces ({{capabilities}}),
  registration policy Specification Required.
* A **"REST:ACT Source Languages"** registry mapping source media types to handling requirements
  ({{languages}}), registration policy Specification Required.
* A **"REST:ACT Feature Tokens"** registry naming the feature tokens a server advertises in
  discovery ({{conformance}}, {{discovery}}), registration policy Specification Required; initial
  entries in `registries/feature-tokens.md`, except the tokens an extension specification defines,
  which that specification registers ({{extensions}}). A token names one independently-observable
  behavior, optional unless this document requires it of every server (the registry lists those as
  its core tokens), names are permanent, and a feature whose contract changes incompatibly takes a
  new token rather than redefining an existing one. This document does not list the tokens itself:
  the registry file lists them, and the companion OpenAPI extension's `featureToken` enum mirrors
  that list.
* A **"REST:ACT Error Codes"** registry for the `restact_code` tokens ({{errors}}), registration
  policy Specification Required, seeded with the values in the {{errors}} table (including
  `forbidden-side-effect`, `invalid-call-graph`, and the `invalid-input`/`unsupported-feature`
  conditions). Each entry gives the code's HTTP status, or none for a code that appears only in an
  operation's `error` (`cancelled`), and whether the code is guest-raisable ({{errors}}): `yes`
  for `invalid-input`, `forbidden`, `not-found` and `conflict`, and `no` for every other code this
  document registers, which is also the value of an entry that does not state one. An extension
  specification registers the codes it defines ({{extensions}}).
* The reserved object paths `tokens/sub`, and `tokens/grants` and `tokens/exchange` with
  everything beneath each, under `/v1/`, the reserved path `/mcp`, and the reserved `aud` value
  `restact-delegated` ({{extensions}}).

If no registrations are ultimately required, this section will state that this document has no IANA
actions.

--- back

# Guest Contract (WIT package `rest-act:plugin`) {#appendix-wit}

This appendix is normative. The standard host interfaces a verb may import are defined by the WIT
package `rest-act:plugin@0.1.0`. The full WIT text is the authoritative artifact (carried in the
reference distribution as `wit/*.wit`); this appendix summarizes its interfaces and worlds, which a
component targets to declare its capability manifest. An interface that an extension defines is
named here so that the package is listed whole; that extension gives its functions and the feature
token of each. The package comprises:

* `types` — shared types (`payload = list<u8>`, the structured `invocation-error`, `log-level`).
* `host` — the ambient minimal interface: `log(level, message)`. Always granted.
* `identity` — the ambient read-only caller view (feature `caller-identity`):
  `subject`/`is-anonymous`/`roles`/`scopes`/`claim`, plus the separately-advertised `subject-kind`
  (feature `identity-subject-kind`, advertised wherever `caller-identity` is), `groups`
  (feature `caller-groups`), `invoker` (feature `identity-invoker`, which needs a grant at deploy,
  {{caller-identity}}) and `actor` (feature `identity-actor`, the "Delegated tokens (OPTIONAL,
  feature `delegated-tokens`)" section of {{RESTACT-DELEGATION}}). Ungated apart from `invoker`;
  grants no authority. Unless the server advertises `identity-real`, every subject it returns is
  pairwise ({{caller-identity}}) and `actor` returns a string that identifies no actor.
* `compose` — `invoke(verb, input) -> result<payload, invocation-error>` (feature `composition`,
  gated; deny-by-default per the declared call graph and {{composition}}).
* `object` — the object-data capability (feature `object-data-access`, gated). The "Object Data
  Access" section of {{RESTACT-OBJECTS}} defines its functions and the feature token of each.
* `event` — event publication (feature `event-subscriptions`, gated), defined in the "Publishing
  events" section of {{RESTACT-EVENTS}}.
* `llm` — model completion (feature `llm-connector`, gated), defined in {{RESTACT-CONNECTORS}}.
* `webhook` — signed webhook delivery (feature `webhook-connector`, gated), defined in
  {{RESTACT-CONNECTORS}}.

Worlds compose these for a component to target, exactly as in `wit/*.wit`:

* `plugin` — `host` only (the frozen base world, `world.wit`).
* `plugin-compose` — `plugin` plus `compose`.
* `plugin-identity` — `plugin` plus `identity`.
* `plugin-object` / `plugin-object-compose` — the object worlds; each adds `object` AND the ambient
  `identity` view (`plugin-object-compose` also has `compose`).
* `plugin-object-event` / `plugin-object-compose-event` — add `event` to the two object worlds.
* `plugin-llm` / `plugin-object-llm` / `plugin-object-compose-event-llm` — add `llm` to `plugin`,
  `plugin-object` and `plugin-object-compose-event` respectively.
* `plugin-webhook` / `plugin-object-webhook` / `plugin-object-compose-event-llm-webhook` — add
  `webhook` to `plugin`, `plugin-object` and `plugin-object-compose-event-llm` respectively; the
  last is the superset of every world above.

The ambient `identity` interface is thus reachable from the `plugin-identity` and object worlds, not
from bare `plugin`/`plugin-compose`, and the `event` capability extends only the two object worlds. New
capabilities are added as new interfaces and new worlds in the SAME package WITHOUT changing an
existing interface ({{wit-contract}}); a server links the superset of worlds it supports and advertises
the corresponding feature tokens.

# Pairwise Subject Test Values {#appendix-pairwise}

This appendix is informative. Its values follow the computation that {{caller-identity}}
recommends, and they apply only to a server that follows it: a server that derives its pairwise
subjects in another way that section permits gives other values. The key is the 32 octets `00` to
`1f`. Each `input` is the octets given to HMAC-SHA-256, in hexadecimal, and each `result` is the
pairwise subject. Where the verb's owner is the anonymous identity there is no owner subject, and
the case says so in place of one.

~~~
key     000102030405060708090a0b0c0d0e0f
        101112131415161718191a1b1c1d1e1f

owner   "alice"
caller  "bob"
input   0100000005616c696365626f62
result  mN5gVFaiHAz05FHnLW0oCRxgV1d1tFrTibRU-qTTVSo

owner   none (the anonymous identity)
caller  "bob"
input   0000000000626f62
result  wDoOvxNbfo7EtGppVy8m3acZp33uwI7AowxkEgcEwAI

owner   "alic"
caller  "ebob"
input   0100000004616c696365626f62
result  pTiGXPodnrjVEPH8hzB_7DNWIMS58_L9CGCR4vl0bDY

owner   U+00E9 (one character, two octets in UTF-8)
caller  "bob"
input   0100000002c3a9626f62
result  stg_dLgmRKdFb9ALJOAynB8y5YKlpLChAfmCPXXvTV8
~~~

The first and third cases join to the same text, `alicebob`; the length of the owner's subject
keeps their inputs, and so their results, apart. The fourth has an owner subject whose length in
octets differs from its length in characters.

# Implementation Status and Experience

A reference implementation (a Rust host on the Wasmtime engine) and a security-focused tracer-bullet
have demonstrated the core execution and safety model: capability-denied execution, enforced
wall-clock / compute / memory limits, an upload pipeline with import allow-listing and content
addressing, and host-mediated composition with a declared call graph, cycle detection, and a shared
budget. Observed behavior informed the kinds of limit {{limits}} requires and recommends. The
reference meters compute in Wasmtime fuel. A host without fuel metering, such as one on Node, can
rely on the wall-clock limit for compute, and meter interpreter steps where its runner counts them. The
values are each server's own and are advertised per verb in discovery ({{discovery}}).

# Acknowledgments

The protocol draws on OData Actions/Functions {{ODATA}}, the Google API Design Guide {{AIP136}},
JSON:API {{JSONAPI}}, and the WebAssembly Component Model and WASI {{WASI}}.

This document owes a particular debt to Roy T. Fielding's dissertation {{FIELDING}}. It defines the
REST architectural style that REST:ACT extends, and its classification of mobile-code styles is the
one used here to describe verb upload.
