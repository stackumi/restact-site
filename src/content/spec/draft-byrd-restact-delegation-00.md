---
title: "REST:ACT Identity and Delegation"
abbrev: "REST:ACT Delegation"
docname: draft-byrd-restact-delegation-00
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
  RFC7636:
  RFC8693:
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
informative:
  RFC8252:
  RFC9700:
  HTMLIFRAME:
    title: "HTML: the iframe element (WHATWG Living Standard)"
    target: https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element
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

--- abstract

This document specifies an optional extension to REST:ACT, the protocol for invoking sandboxed
verbs over HTTP. It defines credentials and acts that change whose authority a request carries: an
operator act that reassigns ownership, read-only sub-tokens confined to one object-path prefix, and
grants under which one principal acts for another within bounds, with both identities visible. It
also defines how a verb reads the delegation actor and how a client reads who created and last
changed an object. A server advertises each feature with its own token.

--- middle

# Introduction {#delegation-introduction}

In REST:ACT {{RESTACT}} a request carries its principal's whole authority, and a resource's owner
never changes. This document defines optional features, each under its own feature token, that
change one of those facts or record who acted:

* an operator act that reassigns the owner of resources a former owner can no longer manage
  ({{admin-reown}});
* path-scoped sub-tokens, read-only credentials confined to one object-path prefix
  ({{path-scoped-tokens}});
* delegated tokens, with which an actor acts for a subject within the bounds of a grant the subject
  made, together with the delegation actor in the `identity` interface ({{delegated-tokens}});
* client actors, programs with no principal of their own that a grant names as its actor
  ({{client-actors}});
* the provenance facet, which says who created and last changed an object ({{provenance-facet}}).

The decision records for this document are
[ADR-0092](https://github.com/stackumi/restactd/blob/main/spec/decisions/0092-path-scoped-sub-tokens.md),
[ADR-0109](https://github.com/stackumi/restactd/blob/main/spec/decisions/0109-delegated-tokens.md),
[ADR-0111](https://github.com/stackumi/restactd/blob/main/spec/decisions/0111-ownership-is-fixed-admin-reown.md)
and [ADR-0131](https://github.com/stackumi/restactd/blob/main/spec/decisions/0131-offline-reown.md)
in the reference implementation.

## Relationship to REST:ACT {#delegation-relationship}

This document is a REST:ACT extension, as described in the "Extension specifications" section of
{{RESTACT}}. That section says whom this document binds: a server that offers a mechanism one of
these feature tokens covers advertises the token and is bound by what this document requires of
that mechanism. The tokens are `admin-reown`, `path-scoped-tokens`, `delegated-tokens`,
`delegated-client-actors`, `identity-actor` and `object-provenance`. The token
`delegated-prefixes` is registered and reserved for a later amendment ({{delegation-iana}}); no
server advertises it yet.

| Feature token | Section |
|---|---|
| `admin-reown` | {{admin-reown}} |
| `path-scoped-tokens` | {{path-scoped-tokens}} |
| `delegated-tokens` | {{delegated-tokens}} |
| `identity-actor` | {{delegated-tokens}} (the delegation actor in the `identity` interface) |
| `delegated-client-actors` | {{client-actors}} |
| `object-provenance` | {{provenance-facet}} |
| `delegated-prefixes` | none: reserved for a later amendment |

That section makes one exception for this document: the rules of {{delegated-tokens}} for a server
that implements delegated tokens but does not advertise `delegated-tokens`, because it cannot sign or
because its operator has switched delegation off, bind that server too. A server
that implements none of this document is still bound by the core's reservation of the paths
`tokens/sub`, and of `tokens/grants` and `tokens/exchange` and everything beneath each, under
`/v1/`, and of the `aud` value `restact-delegated`.

Path-scoped sub-tokens, delegated tokens and client actors are bearer credentials or are carried
on them. A server that accepts no bearer credential, for instance one that establishes principals
only through the authentication of an application it is mounted in or a trusted proxy's header
field (the "Authentication" section of {{RESTACT}}), does not offer them and does not advertise
`path-scoped-tokens`, `delegated-tokens`, `identity-actor` or `delegated-client-actors`.

This document uses three of the extension points that section names. E1 is the operator act of
{{admin-reown}}, and E4 is that act's withdrawal of a runs-as-owner opt-in. E9 covers the delegation
actor that the `identity` interface exposes ({{delegated-tokens}}). The bounds of a sub-token and of
a delegated token need no extension point: they only narrow what a credential may do, as that
section lets any extension do. Their refusals take precedence over the answer the core gives a
caller who may not read (the "Refusing a caller who may not read" section of {{RESTACT}}).

A requirement that also names a feature or mechanism of another document, such as a lifecycle
hook, a schedule, a secrets mount or deployment history, binds a server that this document binds
when that server also offers that feature or mechanism. A server that offers a feature with a token advertises the token, and a
requirement on a mechanism no token covers, such as a lifecycle hook outside the data-plane CRUD
subset, binds every server that offers the mechanism (the "Extension specifications" section of
{{RESTACT}}). A client does not assume any behavior of this document from a server that does not
advertise its token.

{::boilerplate bcp14-tagged}

# Operator ownership recovery (OPTIONAL, feature `admin-reown`) {#admin-reown}

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
  (the "Execution identity" section of {{RESTACT}}) and any other owner-made grant of authority or visibility the verb carries,
  and MUST pause the verb if it is a lifecycle hook. Nothing then runs with the new owner's
  authority until the new owner opts in with their own credential;
* MUST NOT move registrations (schedules and subscriptions, the "Events, Triggers, and Scheduling" section of {{RESTACT-EVENTS}}), which run under their
  registrant's authority; MUST NOT fire lifecycle hooks or publish events for the change of owner
  itself; and SHOULD NOT move a slot of a secrets mount (the "The mediated secrets mount (OPTIONAL, feature `secrets-management`)" section of {{RESTACT-CONNECTORS}}), whose credential the
  old owner supplied.

**A paused hook** is not invoked when its event occurs; the server records the skip in its operator
log, and it does not resolve past the paused hook to an ancestor's. Every other invocation of the
verb (a direct call, a schedule or subscription that targets it, a composition) is unaffected,
because none of them runs under the owner's authority. While the hook is paused, its `meta`
(the "Verb properties (the program itself)" section of {{RESTACT}}) carries `paused: true`; the
member is absent otherwise. Only its owner replacing its code resumes it: `PUT …:verb/code`, a rollback
(the "Deployment history and rollback (OPTIONAL, feature `verb-history`)" section of {{RESTACT-OBJECTS}}), or a re-registration (the "Verb declaration (deployment profile)" section of {{RESTACT}}). A `policy` or other property write
leaves it paused. A runs-as-owner opt-in is restored only the way it was first made, by the owner
at deploy.

The reference host's wire form follows. A server MAY offer the act through another operator
interface with the same semantics.

~~~
POST /admin/reown                 Content-Type: application/json
{"from": "<subject>", "to": "<subject>", "path": "<object path>",
 "subtree": false, "dryRun": false}
→ 200 {"from", "to", "path", "subtree", "dryRun",
       "verbs": [{"route", "runsAsCleared", "invokerCleared",
                  "paused"}],
       "objects": <count>, "skipped": {"secretSlots": <count>}}
~~~

`dryRun` reports what the act would move and changes nothing. `skipped.secretSlots` counts the
slots of a secrets mount that the act left with their old owner. Each resource moves atomically; the
act as a whole need not. Because it selects only what `from` still owns, repeating an act completes
a partial one.

**Pairwise subjects.** A verb's frames read pairwise subjects computed for its owner (the "Caller
Identity" section of {{RESTACT}}). Reassigning the verb changes them, and data the verb keyed by the
earlier ones no longer matches any caller.

# Path-scoped sub-tokens (OPTIONAL, feature `path-scoped-tokens`) {#path-scoped-tokens}

Every bearer credential defined so far carries its principal's COMPLETE authority. A server MAY
additionally support minting a deliberately attenuated sub-credential: confined to one object-path
prefix, read-only, and short-lived. This is a NARROWING primitive — a sub-token MUST NOT confer any
right its minting principal does not already hold (the "Authorization and Identity" section of {{RESTACT}}) — suited to delegating a minimal,
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
data-plane read of that path would apply (the "Object data (the noun)" section of {{RESTACT}}) — and MUST refuse `403` when it cannot;
this is the load-bearing attenuation check, since everything downstream depends on the minted token
never exceeding it. The minted token MUST be read-only (this profile defines no write-capable
sub-token). `ttl_seconds`, when supplied, MUST be honored up to a server-defined ceiling and MUST be
CLAMPED (never refused) when the request exceeds it; a server SHOULD default to a short TTL (on the
order of minutes) when the field is absent and MUST advertise both the default and the ceiling, as
the `subTokenTtl` member `{defaultSeconds, maxSeconds}` of the `service` object of its discovery
document (the "Discovery" section of {{RESTACT}}), since they are otherwise unobservable to a
client. The endpoint MUST be rate-limited per authenticated principal, refusing excess mint attempts
with `429` — minting is cheap to request but each attempt costs a signature, so an unbounded mint
surface is a denial-of-wallet vector in its own right, independent of what is ultimately minted.

**Recognizing a sub-token.** The mint response's `token` MUST be structurally distinguishable from an
ordinary bearer issued by the same server (for example, via a reserved `aud` claim on a JWT-shaped
token) — every downstream authorization gate consulting it needs to know, without ambiguity, that it
is confined. A path-scoped sub-token runs under an **attenuated principal** (the "Authorization and
Identity" section of {{RESTACT}}): the server keeps only the minting principal's `sub`, for the
`owner`, `sub:<id>` and `prop:<name>` matchers and for provenance and logging, and drops its roles,
groups, scopes and claims. A resource readable only through a `role:`, `group:`, `scope:` or
`claim:` matcher is therefore unreadable through a sub-token even though the minting principal
could read it directly. The rule on `deny` rules in that section applies to the sub-token.

**Enforcement.** For any request authenticated as a sub-token, a server MUST apply the following as
ADDITIONAL denials layered on top of its ordinary authorization evaluation — this profile can only
ever turn an `allow` into a `deny`, never the reverse:

1. A read of an object path that is not within the token's `prefix` MUST be refused `403`
   `forbidden`.
2. Any write, delete, manage, or verb-deployment action MUST be refused `403` `forbidden`,
   unconditionally — independent of what the underlying `$policy` or verb policy would otherwise
   permit. Minting a FURTHER sub-token from a sub-token MUST likewise be refused `403` `forbidden`
   (a non-read action against `POST /v1/tokens/sub` itself), foreclosing scope-laundering and
   unbounded delegation depth. On a server that advertises `delegated-tokens`, a sub-token MUST
   also be refused `403` `delegation-bound` on the grants API and as the exchange's `actor_token`
   ({{delegated-tokens}}); on a server that does not, those routes answer `404` to every caller. A
   principal that is the actor of a live grant it has exchanged MUST NOT mint a sub-token.
3. A read within `prefix` is authorized exactly as the minting principal's own read would be
   (subject to the narrowing in "Recognizing a sub-token" above) — no NEW grant is created.

Expiry is enforced exactly as for any other bearer of the same underlying credential mechanism; a
sub-token past its `exp` MUST be refused like any other expired bearer.

**Reach of the denials.** These denials apply to every authorization decision the server makes for
a request authenticated by a sub-token and for the work it causes, whichever document defines that
decision. They only narrow what the request may do, as the "Extension specifications" section of
{{RESTACT}} lets any extension do.

**Reachability from an opaque origin.** The primary motivating consumer is a sandboxed, opaque-origin
browsing context ({{HTMLIFRAME}}, `sandbox="allow-scripts"` without `allow-same-origin`) whose fetches to
the server are cross-origin with `Origin: null`. A server that also implements CORS (the "Security Considerations" section of {{RESTACT}}) MAY
extend its allowed-origin policy so that a request presenting a sub-token succeeds from `Origin: null`
for reads within scope, WITHOUT reflecting credentials — this does not create a new server-side
authorization (the "Security Considerations" section of {{RESTACT}}: CORS governs only whether a browser lets a page read a response, never
whether the server accepts the request), and remains fully subject to the enforcement rules above.

**Discovery.** A server supporting this profile MUST advertise `path-scoped-tokens` in its feature list
(the "Discovery" section of {{RESTACT}}); a client MUST NOT assume the mint endpoint exists absent that token.

The discovery document (the "Discovery" section of {{RESTACT}}) lists no verbs to a request
authenticated by a sub-token.

# Delegated tokens (OPTIONAL, feature `delegated-tokens`) {#delegated-tokens}

Every credential defined so far is either a principal's COMPLETE authority or, for a sub-token
({{path-scoped-tokens}}), a read-only view of one subtree. A server MAY additionally let one
principal (the **subject**) authorize another (the **actor**) to act for them, within bounds,
while BOTH identities stay visible. The subject creates a durable **grant**; the actor presents
proof of itself and receives a short-lived **delegated token** that authenticates as the subject,
bounded by the grant.

**Four independent tokens.**

* `delegated-tokens`: the grant, the grants API, the exchange, the delegated token, the bounds
  and their reach, the refused surfaces, traces, and secret values (this section).
* `delegated-client-actors`: an actor that is a program with no principal of its own
  ({{client-actors}}). A server advertising it MUST advertise `delegated-tokens`.
* `identity-actor`: the delegation actor in the `identity` interface, described at the end of this
  section, and in every frame the bounds reach. A server advertises it only alongside `delegated-tokens`.
* `object-provenance`: the `?meta=provenance` facet ({{provenance-facet}}). It is usable without
  delegation.

A fifth token, `delegated-prefixes`, is named for a later amendment that lets a grant carry a
workspace list. It is NOT defined here; its absence tells a client that `prefixes` is refused.

**The grant.** A grant is a server-held record with these fields:

| Field | Meaning |
|---|---|
| `id` | opaque, at least 128 random bits. An identifier, not a credential: exchanging needs the actor's proof. |
| `subject` | the creating principal's subject. Immutable. |
| `actor` | `{"kind": "principal", "sub": "<subject>"}`, or `{"kind": "client", "id": "client:<random>", "label": "<text>"}` ({{client-actors}}). Immutable. |
| `read_only` | boolean. `true` when a request omits it. |
| `snapshot` | the creating credential's roles, groups, scopes and scalar claims, captured at creation and re-captured at every `PATCH`. NEVER returned on the wire. |
| `created_at`, `expires_at` | `expires_at` MUST NOT exceed `created_at` plus the advertised `grantTtl.maxSeconds` |
| `label` | optional display text, at most 200 characters |
| `last_used_at` | the time of the last successful exchange (SHOULD) |
| `exchanged_at` | the time of the grant's first successful exchange. Server-held: set once, never changed or cleared (a `PATCH` keeps it), NEVER returned on the wire. A principal is bound as an actor only once this is set. |
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

**The grants API.** Its routes, and the exchange's, live under the object paths that the core
reserves for this section: `tokens/grants` and `tokens/exchange`, and every path beneath each, under
`/v1/` (the "Extension specifications" section of {{RESTACT}}). The wire uses snake_case, as
`POST /v1/tokens/sub` does.

| Request | Result |
|---|---|
| `POST /v1/tokens/grants` | `201` with the grant. Body: exactly one of `actor`, a JSON string naming the actor's subject (a server MAY bound its length), and `client`, an object ({{client-actors}}); then `read_only?`, `ttl_seconds?` (CLAMPED to `grantTtl.maxSeconds`, never refused) and `label?`. A body that names both `actor` and `client`, or neither, is refused `400`. |
| `GET /v1/tokens/grants` | `200`, the caller's own live grants, newest first, paginated as the "Collections: Listing, Pagination, Filtering, Field Masks" section of {{RESTACT}} defines (`pageSize`, `pageToken`, `nextPageToken`) in a body `{"grants":[…],"nextPageToken"?:"…"}` |
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

The two `urn:restact:` token-type URIs are provisional, and no registry holds them yet
({{delegation-iana}}).

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
{ "access_token": "…",
  "issued_token_type":
    "urn:ietf:params:oauth:token-type:access_token",
  "token_type": "Bearer", "expires_in": 900, "subject": "alice",
  "grant_secret": "…" }
~~~

`subject` is the grant's subject; **the actor MUST check it** against the user it is serving before
using the token. `grant_secret` is present for a client actor only. Errors are Problem Details
(the "Errors" section of {{RESTACT}}) with one added member, `error`, carrying the RFC 6749 §5.2 code (`invalid_request`,
`invalid_grant`); status codes follow the error table of the "Errors" section of {{RESTACT}}, so an `invalid_grant` is `401`.

A successful exchange MUST record `exchanged_at`, if it is unset, before it returns the token. The write MUST be conditional on the grant still being stored and live, so it never revives a revoked grant, and on a multi-node backend it MUST be committed to the shared store. If the grant is no longer stored and live when the write is made, the exchange MUST issue no token and answer as step 4 does. If the write cannot be committed for another reason, such as a store failure, the exchange MUST fail with `503` (`restact_code` `unavailable`, which the "Errors" section of {{RESTACT}} registers) and issue no token.

**The delegated token and the delegated principal.** The token is signed with the server's ordinary
bearer key and MUST carry NO `kid` header (a `kid` would route it to an external identity
provider's verifier). Its claims: `aud` containing the reserved value `restact-delegated`; `sub`
the grant's subject; `act` `{"sub": <actor id>}`; `grant` the grant id; `iat`; and `exp` no later
than the lesser of now plus `tokenTtl.maxSeconds` and the grant's `expires_at`. A refresh is a
fresh exchange.

* A server treats a credential as delegated only if it issued it through the exchange. An `act`
  claim on any other credential MUST be ignored.
* A request that carries a bearer whose `aud` contains `restact-delegated` together with an
  identity any other mechanism establishes (a trusted identity header, or the session of an
  application the server is mounted in) MUST be refused `401`, so that other identity cannot
  silently drop the grant's bounds. Reading `aud` for this refusal needs no verification, because
  it can only refuse.
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

**Delegated requests (OPTIONAL, feature `delegated-tokens`).** A request authenticated by a
delegated token runs as its **subject**, bounded by the grant: the bounds are
additional denials only, and they follow every frame the request causes. The compute cost of such a
request is attributed to its real caller, the subject.

**The bounds: additional denials only.** Like a sub-token's, the bounds can turn an allow into a
deny, never the reverse. A request the delegated principal could not make is refused exactly as the
subject's own would be (the **ceiling**). A `read_only` grant additionally admits ONLY `GET` and
`HEAD` of stored representations and facets, and `GET` invocations of functions; it refuses every
other method with `403` `delegation-bound`, decided from the request and the grant alone, before
policy or existence is consulted, so the refusal is no existence oracle. Inside a frame, the guest
sees the same error a policy denial gives it, with no new error case. Read-only blocks changes
only: it does not block what a read or a function reaches without changing anything.

**Reach of the bounds.** The bounds apply to every authorization decision the server makes for a
delegated request and for the work it causes, whichever document defines that decision. They only
narrow what the request may do, as the "Extension specifications" section of {{RESTACT}} lets any
extension do.

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
  its owner's authority, MUST be performed by the owner. This applies to every caller, and it is the rule on replacing a
  hook's code that the "Events, Triggers, and Scheduling" section of {{RESTACT-EVENTS}} states.

**The `boundVia` member (feature `delegated-tokens`).** While a verb is stamped as elevated under a
delegation, its `meta` (the "Verb properties (the program itself)" section of {{RESTACT}}) MUST
carry `boundVia`, the actor's identifier, and MUST NOT carry the grant id. A verb that is not
stamped carries no `boundVia`.

**Never-delegable acts, and refused surfaces.** A delegated principal MUST be refused `403`
`delegation-bound` for every method of the grants API, use as the exchange's `actor_token`,
client-actor redemption, and sub-token minting. (A credential in the exchange request's
`Authorization` header is refused earlier, `400` `invalid_request`, by the exchange's first
refusal.) A **principal that is the actor
of any live grant it has exchanged** MUST likewise be refused when it creates or renews a grant or mints a sub-token,
EVEN WITH ITS OWN ORDINARY BEARER; its reading, listing and revoking of its own grants stay
allowed. A server MUST also refuse a delegated principal, `403` `delegation-bound`, on the surfaces
whose bounds cannot be shown to hold: SSE subscriptions, the MCP facet ({{RESTACT-MCP}}), embedder custom
routes, and the administrative routes. Native (embedder) verbs are not refused; they are invoked
through the ordinary verb path and a server MUST NOT hand them the raw delegated bearer.

**Traces.**

* An object created under delegation is owned by the subject.
* A deployment or rollback made under delegation SHOULD record `deployedVia` (the actor id) beside
  `deployedBy` (the "Deployment history and rollback (OPTIONAL, feature `verb-history`)" section of {{RESTACT-OBJECTS}}).
  A server records the stamp's grant with each history entry of a stamped verb, so that a rollback
  can re-apply it, and MUST NOT expose it: the grant id MUST NOT appear in a history
  representation.
* The auto-published event payload carries the `actor` member that the "Publishing events" section
  of {{RESTACT-EVENTS}} requires for a mutation made under delegation; event names are unchanged.

**Secret values stay the user's to type.** On a server that also advertises `secrets-management`
({{RESTACT-CONNECTORS}}), a delegated `PUT` carrying a `value` member on a mount path MUST be refused `403` `delegation-bound`.
Creating the reference (metadata, no value) is allowed.

**Discovery and configuration.** A server MUST advertise `delegated-tokens` only when it can sign
and the operator has not switched delegation off. It MUST publish, as the `delegation` member of
the `service` object of its discovery document (the "Discovery" section of {{RESTACT}}),
`tokenTtl {defaultSeconds, maxSeconds}`, `grantTtl {defaultSeconds, maxSeconds}` and
`revocationLatencySeconds`; the reference values are 900/900, 3600/2,592,000 and 0.

**Until it advertises the token, every route in this section answers `404` and authentication
refuses every delegated token with `401`**, so no grant or client secret can be minted before its
enforcement exists. The paths `tokens/grants` and `tokens/exchange`, and everything beneath each,
under `/v1/` are reserved on every server, whether or not it advertises delegation, as
`/v1/tokens/sub` is (the "Extension specifications" section of {{RESTACT}}). A server that switches delegation off MUST fail closed: every grant is not
live, and a server that boots with delegation off MUST revoke every stored grant before serving a
request, so that switching it back on revives nothing. If that revocation cannot be committed the
server MUST refuse to boot. On a multi-node backend the revocation is made in the shared store, and
a node running with delegation off treats every grant as not live, even one another node created
after it booted. A pending asynchronous operation started under delegation is not resumed. The
rules of this paragraph bind a server that implements delegated tokens whether or not it advertises
`delegated-tokens`.

**The delegation actor.** A server MAY expose, through the `identity` interface (the "Caller
Identity" section of {{RESTACT}}), the **delegation actor** of the invocation, as an OPTIONAL
feature (token `identity-actor`). This value is ambient. It is read with
`actor() -> option<string>`, whose value is the actor's identifier: the actor's subject for a
principal actor, or the server-assigned `client:` identifier for a client actor
({{client-actors}}). It is returned in every frame whose work runs under a delegation's bounds,
authority-switched frames and hooks included, and in every frame of code installed under a delegation, whoever triggered it,
and none otherwise. It discloses the actor's identifier only — never the delegating subject, nor any
role, scope, group, or claim — and it reaches another owner's authority-switched frames and hooks
when delegated work reaches them. On a server that does not disclose the real identity (the
"Caller Identity" section of {{RESTACT}}), the value identifies no actor. It is the string
`delegated`, for every actor and in every frame, so a verb learns that a delegation bounds the
frame and nothing more. Whether `actor()` returns a value is the same on every server, so a verb
that decides by that alone behaves alike on each. A verb that compares the value with an
identifier it holds, or keys data by it, reads `subject-kind()` first: where that answers
`pairwise` the value is this string and names no one, so a list of actors to refuse matches
nothing and every actor shares one key. Through `actor()` such a server gives no pairwise form of
an actor's identifier, for a client actor or a principal actor ({{delegation-security}}).

**Error code.** This document defines one `restact_code` value, in the form of the error table of
the "Errors" section of {{RESTACT}}, and registers it ({{delegation-iana}}). A server uses it only
at the places that {{delegated-tokens}} and {{path-scoped-tokens}} name.

| `restact_code` | Status | Meaning |
|---|---|---|
| `delegation-bound` | 403 | the credential or the code is bound by delegation ({{delegated-tokens}}): a delegated token or a sub-token on the grants API, as the exchange's `actor_token` or at redemption; a delegated request on a refused surface, outside its grant's bounds, minting a sub-token or writing a secret value; the actor of a live grant it has exchanged creating or renewing a grant or minting a sub-token; or an authority switch into a verb whose stamp's grant no longer allows it. A sub-token's own confinement ({{path-scoped-tokens}}) is `forbidden`. |

# Client actors (OPTIONAL, feature `delegated-client-actors`) {#client-actors}

A **client actor** is a program on the user's machine with no principal of its own. The sign-in
page and the program are clients of the grants API, and the requirements below on each bind it as a
client (the "Conformance and Feature Discovery" section of {{RESTACT}}). The flow follows
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

# The provenance facet (OPTIONAL, feature `object-provenance`) {#provenance-facet}

`GET /v1/<obj>?meta=provenance` returns `{"created":{"subject","actor"?,"at"},"updated":{…}}` for
the object. It covers every committed mutation of the object (data-plane and capability writes,
blob writes, `$policy` and `$owner` writes), committed atomically with the write it describes. An
ownership reassignment ({{admin-reown}}) is an `$owner` write: it sets `updated` to the operator's
subject with no `actor` (or, for a reassignment the server makes outside any request, to a subject
the server reserves for that purpose), and leaves `created` as it was.
`subject` is the principal the write ran as; `actor` appears only for a write made under delegation;
no grant id ever appears. An object last written before the feature existed returns no `created` or
`updated` member. The facet is read-gated by the object's own `read` and answers `404` or `403`
exactly as a `GET` of the object would; it is never part of the object's representation.

# Security Considerations {#delegation-security}

* **Delegation.** A grant ({{delegated-tokens}}) lends a user's authority to an actor. Revocation
  stops delegated tokens, the schedules, subscriptions and elevated code installed under the grant,
  but NOT the data the actor wrote, the shares it made (a share never transfers ownership: see the
  "Ownership is fixed" section of {{RESTACT}}), the ordinary verbs it deployed,
  or the connector wiring ({{RESTACT-CONNECTORS}}) it created. A role snapshot goes stale until the grant is renewed. A server accepting cookie-borne
  sessions on the grants API MUST apply its cross-site request forgery defense there, because a
  forged grant creation hands the forger a credential.
* **Operator recovery.** An operator recovery act MUST withdraw the runs-as-owner opt-in and pause
  the hooks on what it moves ({{admin-reown}}), so a reassignment by the operator does not push
  authority as an owner's reassignment would (the "Pushed authority (ownership reassignment)" bullet
  of the "Security Considerations" section of {{RESTACT}}).
* **The actor's identifier.** Delegation keeps the actor visible. Its identifier appears in the
  event for what it writes, where {{RESTACT-EVENTS}} requires or the server includes the member,
  in the provenance facet ({{provenance-facet}}), in the `boundVia` of a verb its write stamps
  ({{delegated-tokens}}), and in the grant its subject reads. A pairwise form of it, like the
  pairwise subject of the "Caller Identity" section of {{RESTACT}}, would therefore not stay
  apart from the real one. An owner whose lifecycle hook ran for a delegated write and who read
  the same write's event, or who read the `boundVia` of a stamped verb of its own, would hold both
  forms. A client actor's identifier belongs to one user's grant. Where the event or the facet
  names that user beside it, the owner would then know the user behind every later delegated call
  that carried the same pairwise actor, and with it the user's own pairwise subject, which is what
  that subject exists to prevent. A server that does not disclose the real identity therefore
  gives a verb only the fact that a delegation bounds the frame ({{delegated-tokens}}). Three
  limits remain. That fact narrows who a caller is: an owner who sees few delegated calls, and
  reads events that name the user and actor of delegated writes, can match them by number or by
  time, and an operator who minds does not offer `identity-actor`. An actor is told the subject it
  acts for when it exchanges the grant, so an actor that owns a verb and invokes it with the
  delegated token reads that subject's pairwise form for itself and holds both; a user is not
  pseudonymous to an actor it delegates to. And the identifiers on the data plane stay: whoever
  may read what an actor wrote learns the actor wherever the event or the facet names it, and two
  owners who both read a `client:` identifier can tell that one user's agent wrote to both.

The security considerations of {{RESTACT}} apply.

# IANA Considerations {#delegation-iana}

This document requests the following registrations in registries that {{RESTACT}} creates. It
creates no registry.

* In the "REST:ACT Feature Tokens" registry: the tokens in the table of
  {{delegation-relationship}}, with `delegated-prefixes` registered as reserved.
* In the "REST:ACT Error Codes" registry: `delegation-bound` ({{delegated-tokens}}).

The object paths `tokens/sub`, and `tokens/grants` and `tokens/exchange` with everything beneath
each, under `/v1/`, and the `aud` value `restact-delegated`, are reserved by {{RESTACT}} (its "Extension
specifications" section) for the meanings this document gives them.

This document also defines two provisional token-type URIs,
`urn:restact:params:oauth:token-type:grant` and `urn:restact:params:oauth:token-type:grant-secret`
({{delegated-tokens}}). No registry that {{RESTACT}} creates holds them.
