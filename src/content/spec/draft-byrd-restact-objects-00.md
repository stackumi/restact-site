---
title: "REST:ACT Objects and Data"
abbrev: "REST:ACT Objects"
docname: draft-byrd-restact-objects-00
category: exp
submissiontype: independent
ipr: trust200902
area: "Applications"
keyword:
  - REST
  - WebAssembly
  - object data
  - authorization
  - capability security
stand_alone: yes
pi: [toc, sortrefs, symrefs, comments]
author:
  -
    ins: N. Byrd
normative:
  RFC9110:
  RFC8785:
  RFC6839:
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
  RFC7396:
  AIP136:
    title: "AIP-136: Custom Methods (Google API Improvement Proposals)"
    target: https://google.aip.dev/136
  AIP158:
    title: "AIP-158: Pagination"
    target: https://google.aip.dev/158
  AIP160:
    title: "AIP-160: Filtering"
    target: https://google.aip.dev/160
  AIP161:
    title: "AIP-161: Field Masks"
    target: https://google.aip.dev/161
  JSONAPI:
    title: "JSON:API v1.1"
    target: https://jsonapi.org/format/

--- abstract

This document specifies an optional extension to REST:ACT, the protocol for invoking sandboxed
verbs over HTTP. It defines what a server may do with the data stored at an object path beyond
reading and writing it whole. A client can list and query the objects under a path and remove a single
property. An object can declare how each of its properties is stored and who may
read or change it. An object's
policy can be inherited from an ancestor, and an object can own the verbs bound to it. A verb can
read and write object data through the `object` capability, and an accessor verb can serve the data
plane for its object. The document also defines deployment history, rollback and conditional
requests on verb management, and a JSON:API representation. A server advertises each feature with
its own token.

--- middle

# Introduction {#objects-introduction}

REST:ACT {{RESTACT}} lets a server store data at an object path and serve it with the ordinary HTTP
methods: `GET` reads the object, `PUT` writes it, and `DELETE` removes it, each gated by the
object's `$policy`. That is enough for a server that keeps object data.
This document defines the optional features that build on it:

* the object collection listing and its query parameters ({{object-listing}});
* the object-binding modes, under which an object owns the verbs bound to it, and the rule that
  guards creating an object below another principal's ({{object-binding}});
* policy inherited from a governing ancestor, and governed creation
  ({{object-policy-inheritance}});
* a JSON:API representation ({{optional-json-api-representation}});
* deployment history and rollback of a verb's code ({{verb-history}}), and conditional requests on
  verb management ({{verb-conditional}});
* the `object` capability, through which a verb reads and writes object data
  ({{object-data}});
* accessor verbs, which serve data-plane methods for an object ({{active-properties}});
* declared data properties, and the removal of a property by a `null` member of a `PUT`
  ({{data-properties}}).

Each is optional, and a server advertises each one it implements with its own feature token
({{objects-relationship}}).

## Relationship to REST:ACT {#objects-relationship}

This document is a REST:ACT extension, as described in the "Extension specifications" section of
{{RESTACT}}. The server requirements of each section bind only a server that advertises a token
that section names, as listed here. A requirement that also names a feature or mechanism of another document, such as a lifecycle hook
or a delegated credential, binds a server that this document binds when that server also offers
that feature or mechanism. A server
that offers a feature with a token advertises the token, and a requirement on a mechanism no token
covers, such as a lifecycle hook outside the data-plane CRUD subset, binds every server that offers
the mechanism (the "Extension specifications" section of {{RESTACT}}). A client does not assume any
behavior of this document from a server that does not advertise its token. A requirement this
document places on a client, or on the author of a verb, binds every client or verb author that
uses the feature or mechanism the requirement concerns.

| Feature tokens | Section |
|---|---|
| `object-listing`, `object-query`, `object-listing-prefix` | {{object-listing}} |
| `object-binding`, `ancestor-creation-guard` | {{object-binding}} |
| `object-policy-inheritance`, `governed-creation` | {{object-policy-inheritance}} |
| `jsonapi` | {{optional-json-api-representation}} |
| `verb-history` | {{verb-history}} |
| `verb-conditional-requests` | {{verb-conditional}} |
| `object-data-access`, `object-cas`, `verb-object-query`, `object-self-path`, `object-remove`, `object-set-subject`, `object-binary`, `object-binary-write` | {{object-data}} |
| `active-properties`, `set-list-accessors`, `bare-path-accessor-dispatch` | {{active-properties}} |
| `data-properties`, `property-inheritance`, `property-defaults`, `put-null-removes` | {{data-properties}} |
| `binary-values` | {{binary-values}} |

Most of these features only add requirements. Four of their tokens change a rule of {{RESTACT}},
each at the extension point that the "Extension specifications" section of {{RESTACT}} names for it, and
only while the token is advertised:

* `put-null-removes` gives a `null` member of a `PUT` a meaning: it removes the property (E5).
* `object-policy-inheritance` supplies the policy of an object that stores no `$policy` of its own:
  that of its nearest governing anchor (E6).
* `active-properties` and `bare-path-accessor-dispatch` serve data-plane methods through accessor
  verbs, whose `execute` policy then governs the method (E7).

A credential's own bounds, wherever this document checks them, are the bounds that an advertised
extension sets on the credential. Such bounds only narrow what the credential may do, which the
"Extension specifications" section of {{RESTACT}} lets any extension do.

{::boilerplate bcp14-tagged}

# Object collection listing {#object-listing}

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
a `key=value` literal matches a stored string byte-for-byte, and any other stored value whose canonical
form {{RFC8785}} equals the literal parsed as JSON (so `n=3` matches `"3"` and `3`).
`read_mask` is a comma-separated set of property names whose values are projected into a `values`
member on each entry. Both MUST operate over only the caller-readable members: a property the caller
cannot read MUST NOT match a `filter` and MUST NOT be projected by `read_mask`, so neither parameter
reveals a value the caller could not already read with `GET` on the object. A malformed `filter`
SHOULD be rejected with a `400` problem (`invalid-filter`) rather than answered with an empty
result. The field mask is spelled `read_mask` on this listing, not the `readMask` of the
"Collections: Listing, Pagination, Filtering, Field Masks" section of {{RESTACT}}.

A server that advertises the `object-listing-prefix` token accepts a `prefix` parameter on the
listing. Its value, decoded as `application/x-www-form-urlencoded` (so `+` is a space and `%2B` a
literal `+`), is either empty, which is the same as no `prefix`, or ends in `/`. The server MUST then
list only objects whose path begins with that value, compared code point by code point,
case-sensitive and with no normalization: `ws/1/` lists every object below `ws/1` and not `ws/1`
itself. The prefix only narrows the listing; authorization, `filter`, `read_mask`, pagination and
any page-size limit apply exactly as without it. A server MUST reject with a `400` problem
(`invalid-input`) a non-empty prefix that does not end in `/`, and a prefix that no object path can
begin with: one that begins with `/`, contains `//`, or has a segment beginning with `@`. It MAY
reject a prefix holding a character it cannot store in the same way. The trailing `/` keeps a timed
probe to whole path segments ({{objects-security}}). A `pageToken` is bound to the prefix it was issued
under, and the server MUST reject it with a `400` problem (`invalid-input`) when it arrives with a
different prefix or none. A server that does not advertise the token may ignore the parameter, so a
client MUST NOT send it unless the token is advertised.

# Object Binding {#object-binding}

A verb is always *bound to* an object — the object named before the colon in its definition path. How
that binding relates to the **existence** of the object varies by deployment: in a function-as-a-
service style, a verb is a free-standing program and the object is merely an addressing handle; in an
object-oriented style (the MOO lineage, after which the "The simple (MOO-style) profile" section of {{RESTACT}} is named), the
object is a first-class entity that must exist before a verb can be defined on it, and it *owns* its
verbs. Rather than prescribe one, this
document defines a vocabulary of **object-binding modes** and requires a server to advertise the one
it enforces in discovery, as the `objectBinding` member of the discovery document's `service`
object, which a server omits for `implicit` (the "Discovery" section of {{RESTACT}}). This is server policy, not a per-verb declaration; a server
MUST NOT advertise a mode it does not enforce.

The modes are:

* **`implicit`** — the object and the verb plane are independent. Deploying a verb neither requires
  nor creates the object it binds to, and an object's stored data is independent of the verbs defined
  on it. It is the mode {{RESTACT}} defines and assumes, and a server whose discovery document
  names no mode uses it (the "Conformance and Feature Discovery" section of {{RESTACT}}). Which mode a server uses by default, and when
  it warns its operator, follows the "Conformance and Feature Discovery" section of {{RESTACT}},
  which binds every server that supports `strict`.
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
server MUST refuse it with `409` (`object-binding`), since it owns no object, rather than treat it
as exempt. Existence is tested against
the server's object registry, not against the caller's read authorization: an object the caller may not
read still exists for this test, so a coupled mode never creates it again or binds a verb to it for
that caller. Only the answer such a caller receives differs ({{objects-non-reader}}).

Under a coupled mode, because the object owns its verbs, a server MUST require that the caller is
authorized to **write** the object before defining, replacing, or removing a verb on an object that
already exists — whether the verb is created by upload or by writing its `code`/`policy` property
(the "Verb properties (the program itself)" section of {{RESTACT}}). Defining a verb on an object owned by another principal MUST be refused
(`403`, or, to a caller who may not read the object, the answer an absent object would get,
{{objects-non-reader}}), and the existence rule above applies equally to these property writes (a `strict` server MUST
NOT let `PUT …:verb/code` shadow a verb onto a non-existent object). Creating the first verb on a
not-yet-existing object under `auto-create` makes the caller its owner. This keeps every verb on an
object within the authority of that object's owner, so the cascading `DELETE` below can never remove a
verb the caller could not have removed directly.

**Ancestor creation.** Under a coupled mode, or on a server that advertises
`object-policy-inheritance`, an object's ancestors carry authority over it: definitions bound on
an ancestor resolve for it (the "Verb Resolution and Inheritance" section of {{RESTACT}}), lifecycle hooks bound there observe its writes
(the "Events, Triggers, and Scheduling" section of {{RESTACT-EVENTS}}), and a governing anchor governs its policy ({{object-policy-inheritance}}). Such a
server, when it has authentication configured, MUST refuse a write that would create an object
while any object stored below the new object's path is owned by a principal other than the
principal the write would record as the new object's owner, with `409` (`ancestor-claim`). For
this rule, an object with no recorded owner and an object owned by the anonymous identity are each
foreign to every writer. (The "Ownership is fixed" section of {{RESTACT}} treats the first as owned
by the anonymous identity only for its own rule and for a `$policy` write.) The refusal MUST NOT identify the object below or its
owner, and SHOULD state that resubmitting the request unchanged will not succeed. A server
evaluates this rule after every other check that would refuse the write (authentication, the
creation rule of a governing anchor, and write authorization); a write refused for another
reason receives that refusal. A server MAY bound the work it spends on this check. A creating
write whose check reaches the bound is refused as if such an object existed, and the refusal's
status, code and detail MUST NOT reveal which of the two occurred. The rule applies to every
interface that can create an object, including a verb's object writes and the object an
`auto-create` deployment would create; a deployment whose object creation the rule refuses MUST
itself be refused. For a write a verb performs, a server reports the refusal to the verb as that
write's error with this code where it can decide it at the write; a refusal it can decide only
when the invocation's writes commit discards them as the "Consistency" section of {{RESTACT}} specifies. A server MAY
exempt the operator subjects named in its configuration, under the restrictions of
the "Operator ownership recovery (OPTIONAL, feature `admin-reown`)" section of {{RESTACT-DELEGATION}} (never a role, group, scope, claim, `public` or `owner` matcher, never the
anonymous identity, a path-scoped sub-token or a delegated request), for requests whose write the
server performs itself rather than through a verb (including an accessor) or hook, and MUST NOT
extend that exemption to a write performed by a verb or hook. The rule governs creation only: it
does not remove, re-own or refuse objects or verbs that already exist, and does not restrict
creating an object below an existing one. A server with authentication configured that enforces
it advertises the `ancestor-creation-guard` feature token, and MUST do so whenever its advertised
object-binding mode is `auto-create` or `strict`, or it advertises `object-policy-inheritance`.

Object **deletion** is symmetric with the mode. Under a coupled mode, `DELETE` on an object removes
the object together with the verbs bound *exactly* to it (not those merely inherited from an ancestor
or matched through a `{id}` pattern, which belong to other objects) and any object-scoped state those
verbs declared; under `implicit`, `DELETE` removes only the object's stored data and leaves its verbs
in place. The cascade MUST be **fail-closed**: a server MUST refuse the object `DELETE` (rather than
remove anything) unless the caller is authorized to delete *every* verb the cascade would remove — the
same authority a direct `DELETE /obj:verb/code` requires — so the cascade can never remove a verb the
caller could not have removed directly. A coupled `DELETE` also removes every definition whose
binding path's deepest concrete ancestor is the deleted object, under the same fail-closed precheck.
Removing a verb (`DELETE /obj:verb/code`) never deletes the object in any mode.

The mode governs **deployment and deletion** only; it does not change **invocation**. A deployed verb
is still invoked on any concrete object the resolution rules (the "Verb Resolution and Inheritance" section of {{RESTACT}}) match — including an
entity instance that does not yet hold data — and the verb's own writes bring that instance into
existence, exactly as under `implicit`.

# Prefix-inherited object policy {#object-policy-inheritance}

A server MAY additionally support **prefix inheritance** of object policy, advertised as the
`object-policy-inheritance` feature. When supported, `$policy` accepts an OPTIONAL boolean member
`inherit`; a policy with `inherit: true` is a **governing anchor**. The effective policy for an
object is resolved as: (1) if the object stores its own `$policy` (including an empty `{}`), that
policy governs, with `owner`/`prop:` matchers resolving against the object's own `$owner`/members;
(2) otherwise, the nearest strict ancestor (by path hierarchy, nearest first) whose stored `$policy`
is a governing anchor supplies the WHOLE effective policy, with its `owner`/`prop:` matchers
resolving against the ANCHOR's `$owner`/members — an unmarked ancestor policy governs only its own
object and is skipped in this walk; (3) otherwise the omitted-policy defaults apply. A server that
does not advertise the feature ignores the `inherit` member, as the "Native representation" section
of {{RESTACT}} requires.

Under a governing anchor the effective policy governs descendants **absolutely**: a descendant's own
`$owner` receives no exemption (so revoking a subject at the anchor revokes it everywhere beneath).
Two rules protect the tree: **creation** — a first write that would create a new object under a
governing anchor MUST be admitted by the anchor's `write` policy before first-writer-owns assigns
`$owner` (a denied create behaves as not-found when the creator also cannot read the location, else
as forbidden); and **descendant-policy management** — writing a descendant's own `$policy` (including
the `{}` opt-out) under a governing anchor is a **manage** act that MUST require the anchor's owner,
in place of the descendant's own (the "Native representation" section of {{RESTACT}}). Creating an object is also subject to the ancestor-creation rule
({{object-binding}}). An object's own declared-member ACLs, and the rule that ownership is fixed
(the "Ownership is fixed" section of {{RESTACT}}), are unchanged by inheritance. When the feature is enabled, `?meta=policy` gains an additive
`source` member — `"self"`, `"default"`, or the governing anchor's path — reporting where the
effective policy came from; the `raw=1` view is unchanged (the object's own stored record, including
an `inherit` marker if present). An object's entity tag covers only its own stored `$policy` (the
"Consistency" section of {{RESTACT}}): changing a governing anchor's policy changes the anchor's tag
and not the tags of the descendants it governs, so a client that rewrites a descendant's policy from
its inherited view cannot make that write conditional on the anchor's.

**Governed creation (OPTIONAL, feature `governed-creation`).** The creation rule above governs only
paths a governing anchor reaches; where none does, first-writer-owns applies and the omitted-policy
defaults (the "Native representation" section of {{RESTACT}}) make the new object world-readable and owned by whoever wrote first. On a
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
that already exist, and does not change reads, deletes, ownership (the "Ownership is fixed" section of {{RESTACT}}), or policy management.

# Optional JSON:API representation {#optional-json-api-representation}

A server MAY offer the JSON:API media type {{JSONAPI}} (`application/vnd.api+json`) as a
content-negotiated alternative representation, in which child and verb paths are expressed as
`relationships` links. When serving JSON:API, a server MUST NOT use JSON:API's colon-prefixed
extension-member mechanism, as `:` is reserved by {{RESTACT}} as the verb separator.

# Deployment history and rollback (OPTIONAL, feature `verb-history`) {#verb-history}

This profile adds two properties to a verb (the "Verb properties (the program itself)" section of
{{RESTACT}}):

~~~
GET    /obj:verb/history    read deployment history
POST   /obj:verb/rollback   roll code back to a prior deployment
~~~

Because every code replacement (the "Verb properties (the program itself)" section of {{RESTACT}}) simply overwrites a verb's registration, an
implementation that retains no further record makes a bad redeploy unrecoverable in place and
attributes no deployer identity distinct from the (possibly unchanged) owner. A server MAY support
this OPTIONAL profile, advertised via the `verb-history` feature token (the "Discovery" section of {{RESTACT}}), to make
deployment reversible without a client round-trip of code bytes.

**History.** A server supporting this profile MUST maintain, per verb registration, a bounded,
newest-first history of the deployments a code replacement has SUPERSEDED, and MUST expose it via
`GET …:verb/history`. Each entry MUST identify the superseded version's full **hash triple** — the
executable's content address, and, for a source-language verb (the "Verb code: source and executable" section of {{RESTACT}}), the source's content
address together with its media type — and SHOULD additionally record the deployer's identity, when
the code landed, and when it was superseded. A history entry MUST NOT be pushed when a property
write does not change the effective hash triple (for example, a policy-only replacement of
`policy`): pushing on every unrelated write would make the history record cost unbounded in the
number of touches rather than the number of code changes. The response MUST NOT include the code's
bytes; access is governed by the verb's `write` action (the "Authorization and Identity" section of {{RESTACT}}), since a principal entitled to
replace the code is already entitled to see its lineage, while a principal that may merely `execute`
the verb MUST NOT. A server MAY bound the retained history to a fixed depth per registration,
discarding the oldest entries first, and MUST document that bound.

The `history` response is a JSON object. Its members `sha256`, `sourceSha256` and
`sourceMediaType` give the current version's hash triple, and its `history` member is the array
of entries, newest first. An entry is a JSON object whose `sha256` is the executable's content
address and, for a source-language verb, whose `sourceSha256` and `sourceMediaType` are the
source's content address and media type. For a verb with no source, the response and each entry
omit both members. A content address is the SHA-256 digest of the bytes, written as 64 lowercase
hexadecimal digits. An entry MAY carry
`kind` (`function` or `action`), `deployedBy` (the deployer's subject) and `supersededAtUnix` (when
it was superseded, in seconds since the Unix epoch), and the object MAY carry `kind`,
`deployedBy` and `codeDeployedAtUnix` for the current version. A client ignores a member it does
not recognize.

**Rollback.** A server supporting this profile SHOULD expose `POST …:verb/rollback` to rebind a
verb's code to a version named in its own history. The request body MUST supply an **expected echo**
of the target entry's full hash triple: a JSON object holding the entry's `sha256` and, exactly
when the entry has them, its `sourceSha256` and `sourceMediaType`, with the values the `history`
response gave. The server MUST refuse the request (`409`) if no entry in
the CURRENT history matches the echo exactly — a stale echo (superseded again since the client last
read `history`, or naming an entry evicted by the retention bound) MUST be refused rather than
silently applied to a different version, so a concurrent redeploy cannot be raced into a rollback the
client did not intend. A rollback of a **wasm** verb rebinds `code` to the named executable
directly. A rollback of a **source-language** verb MUST re-run source deployment (the "Verb code: source and executable" section of {{RESTACT}})
against the server's CURRENT runtime registered for the entry's source media type, using the
entry's stored source — it MUST NOT reinstate whatever runtime component was current when that
source was originally deployed, since a source-language verb's semantic identity is its source, and
the runtime is host-provided infrastructure a server may have since upgraded. If either the target
executable or source cannot be retrieved, the server MUST fail the request rather than silently no-op.
Because a rollback IS a code replacement, it is authorized identically to `PUT …:verb/code`
(the "Verb properties (the program itself)" section of {{RESTACT}}) — including the runs-as-owner and, where supported, invoker-grant
(the "Caller Identity" section of {{RESTACT}}) restriction to the owner, and the lifecycle-hook restriction to the
owner (the "Events, Triggers, and Scheduling" section of {{RESTACT-EVENTS}}) — except that, under a coupled object-binding mode
({{object-binding}}), a server MUST exempt rollback from that mode's ancestor-ownership
requirement, since a rollback can only rebind code to a hash triple already recorded in the
route's own history, named by an exact expected echo, and therefore never introduces code the
caller was not already authorized to install. It MUST itself push the ROLLED-BACK-FROM
version into history, so that rolling forward again is simply another rollback. A rollback MUST NOT
change the verb's owner or policy, and MUST NOT accept parameters that would.

# Conditional verb management (OPTIONAL, feature `verb-conditional-requests`) {#verb-conditional}

A server MAY support conditional requests on the verb-property plane (the "Verb properties (the program itself)" section of {{RESTACT}}) and its
deployment profile (the "Verb declaration (deployment profile)" section of {{RESTACT}}), advertised via the `verb-conditional-requests` feature token
(the "Discovery" section of {{RESTACT}}). It lets a client change a verb without silently overwriting a concurrent change,
and create a verb without silently replacing one a concurrent deployer created. A server that does
not advertise the token need not honour these preconditions (the "Verb properties (the program
itself)" section of {{RESTACT}}). (Informative:
the reference host honours `If-Match` on `PUT …:verb/code` whether or not it advertises the token.)

**Per-property validators.** A server supporting this profile MUST give each mutable verb property
its own strong entity tag ({{RFC9110}}, Section 8.8.3): `code`, whose tag is the one `GET …:verb/code` returns for
the verb's source representation (or its executable, for a verb with no source representation,
the "Verb code: source and executable" section of {{RESTACT}}); `policy`; and, where the server exposes it, `props` (in the
representation of {{data-properties}}). A `GET` of
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
the server MUST respond `412` (`precondition-failed`, the "Errors" section of {{RESTACT}}) and change nothing. Each
precondition is compared against the property as a `GET` at the request's own path would serve it
(the "Verb Resolution and Inheritance" section of {{RESTACT}}).

**Create-only deployment.** A server supporting this profile MUST honour `If-None-Match: *` on its
deployment profile (`POST /v1/modules` in the reference profile). If the request would otherwise be
a replacement (the "Verb declaration (deployment profile)" section of {{RESTACT}}), because a definition exists on the same path pattern and verb name,
the server MUST respond `412` and change nothing, unless the deployer could not have replaced the
existing verb, in which case that refusal (`401`/`403`) comes first (Evaluation, below). Path
patterns are compared as for replacement (the "Verb declaration (deployment profile)" section of {{RESTACT}}); a server that accepts other spellings of
a pattern MUST canonicalize them identically for both comparisons. The existence check and the creation MUST be one atomic step: of
concurrent create-only requests for the same pattern and verb name, at most one succeeds, and every
other receives `412`. `If-None-Match: *` is the only precondition the deployment profile accepts
under this profile; a server MUST refuse any other `If-None-Match` value, and any `If-Match`, with
`400` (`invalid-input`) rather than ignore it. This deliberately fails loud where an unsupported
precondition is commonly ignored: a client that expected a conditional replacement must not
silently replace. A conditional replacement uses `If-Match` on `PUT …:verb/code`.

**Evaluation.** Authentication, authorization (the "Authorization and Identity" section of {{RESTACT}}) and any object-binding refusal
({{object-binding}}) MUST be decided before these preconditions are evaluated, so a caller without
authority for the write receives that refusal and learns nothing from the tag comparison. Other
failures are ordered as {{RFC9110}}, Section 13.2.1 allows: a server MAY answer `412` before it
validates the request content, for example for a stale `If-Match` on a `PUT …:verb/code` whose body
is also invalid, or a create-only deployment whose module it has not yet compiled. Apart from create-only, a precondition here carries
at least the best-effort semantics of the `conditional` level (the "Consistency" section of {{RESTACT}}). A server SHOULD
evaluate it in the same serialized step as the write, so that at most one of two concurrent
conditional writers to the same property succeeds.

# Object Data Access {#object-data}

The "world" tier of the "Capability Model" section of {{RESTACT}} is an OPTIONAL feature (token `object-data-access`). Its first increment lets
a verb read and write the **declared data properties** ({{data-properties}}) of the object it is
bound to, through a gated `object` capability interface the verb imports:

* `path() -> option<string>` returns the path of the bound object itself (OPTIONAL feature, token
  `object-self-path`). The value MUST be the **concrete** object the verb was invoked on, never the
  route pattern the verb was deployed at: a verb deployed at `ws/{id}/pages/{id}:render` and invoked
  on `ws/w1/pages/p3` MUST read `ws/w1/pages/p3`. It MUST be none when, and only when, there is no
  bound object — an `unbound` verb (the "Verb Resolution and Inheritance" section of {{RESTACT}}), or a verb the server has not granted the `object`
  capability. It is a property of the INVOCATION: a server MUST NOT vary it with the runs-as-caller
  principal (so a verb executing under runs-as-owner reads the object it was addressed at, not its
  owner's), and under composition each frame MUST observe its OWN bound object rather than its
  caller's. Where a server dispatches an invocation the caller did not name — a representation
  accessor ({{active-properties}}) or a lifecycle hook (the "Events, Triggers, and Scheduling" section of {{RESTACT-EVENTS}}) — the value is the concrete
  object dispatched for, respectively the requested object and the mutated one. It is a pure read
  disclosing only what the caller supplied in the request URL, so it grants no authority and a
  `function` verb MAY call it.
* `get(name) -> option<property-value>` reads a property of the bound object. A property the caller is not
  permitted to read (per its ACL, {{data-properties}}) is indistinguishable from an absent one
  (both return none). A value is a `property-value`: `text` carries a stored string raw, and `json`
  carries any other JSON value as JSON text in the RFC 8785 canonical form {{RFC8785}} (feature
  `typed-values`; top-level `null` is not a value). A write of `json` whose text is invalid, breaks
  the number rule (the "Representations" section of {{RESTACT}}) or is `null` fails with `invalid-input`, and a `json` that
  parses to a string is stored as that string. The same type is used by `set`, `get-at`, `set-at`
  and `set-at-if` (including its `expected`), and in the `query` row.
* `set(name, value) -> result<_, invocation-error>` writes a property of the bound object. A write the caller
  is not permitted to make returns `forbidden`; when the caller may not read the object it returns
  what a write to an absent object would (`not-found`, or the creation refusal, {{objects-non-reader}}). A
  write to an already-set write-once (`final`) property returns `property-final`.
* `get-at(path, name) -> option<property-value>` reads a property of another object (an ancestor on the
  inheritance chain, or any other path), gated by that object's `read` policy and the property's read ACL — both must allow. As with
  `get`, a read-denied property is indistinguishable from an absent one.
* `set-at(path, name, value) -> result<_, invocation-error>` writes a property of another object by path. The
  write is permitted only where the **runs-as-caller** principal could have written it directly (the
  cross-object write-policy intersection), so a verb is never a confused deputy; the same
  `forbidden`/`not-found`/`property-final` rules as `set` apply, and the
  reserved (`@`/`$`) namespaces and `shared`-scoped properties are refused.
* `set-at-if(path, name, value, expected) -> result<_, invocation-error>` writes a property of another object
  by path only if its stored value equals `expected`; otherwise it fails with `precondition-failed`
  and writes nothing (OPTIONAL feature, token `object-cas`). It is authorized, and refused, as a
  `set-at` of the same `path` and `name` is, except where its `expected` is not compared (below).
  `expected` is compared with the stored value by stored form: a string byte-for-byte, any other
  value by its canonical form, and a string never equals a non-string. An `expected` of none
  matches a property that is not set. The comparison is made only for a principal who may read the
  property. Where an object is stored at `path` and a `get-at` of the same `path` and `name` would
  withhold the property from the principal for want of read authority (the object's `read` policy,
  the property's read `acl`, or any other bound on what the principal or its credential may read),
  the server MUST NOT compare `expected` with the stored value or with anything else stored with
  the object: once the authority the write needs is decided, and before `final` or any other check
  on stored state, the call MUST fail with `precondition-failed` and write nothing, whatever
  `expected` is, none included. The server MUST decide whether the principal may read on the state
  the comparison would be made against, in one atomic step with it. Were the comparison made, a
  failed call, which changes nothing, would let a principal who may write a property and may not
  read it test guesses at its value, and `get-at` does not tell that principal even whether the
  property is set. This failure does not clear on a retry, so a verb's compare-and-swap loop needs
  a bound, and a verb that must compare-and-swap for such a principal needs to run under an
  authority that may read the property. At a path that holds no object nothing is stored, and
  `expected` is evaluated as for any caller; that discloses only whether an object exists there,
  which a principal who may write it is not kept from learning
  (the "Refusing a caller who may not read" section of {{RESTACT}}).
* `set-subject(name) -> result<_, invocation-error>` and `set-subject-at(path, name) -> result<_, invocation-error>`
  write, as the value of a property of the bound object or of the object at `path`, the subject of
  the frame's **runs-as-caller** principal (OPTIONAL feature, token `object-set-subject`). The
  value is the real subject, the string that the `owner`, `sub:` and `prop:` matchers compare (the
  "Authorization policy" section of {{RESTACT}}), whatever form the `identity` interface gives the
  verb (the "Caller Identity" section of {{RESTACT}}). A verb uses it to name its caller in a
  property that a `prop:<name>` matcher reads, which a pairwise subject cannot do. In a frame that
  runs as the verb's owner or as a registrant (the "Execution identity" section of {{RESTACT}}),
  the principal is that owner or registrant, not whoever invoked the verb, and no function writes
  the real subject of the frame originator. Each call is authorized, refused and committed exactly
  as a `set` or a `set-at` of the same property with a string would be, whoever the principal is,
  and a `function` verb that calls either gets `forbidden-side-effect`. Only a call that would
  otherwise succeed depends on the subject: for the anonymous principal, which has none, it fails
  with `forbidden` and writes nothing. The
  functions return nothing of the subject, but the property then holds it, and whoever may read the
  property reads it, the verb's own later `get` included: the functions add a convenient way to
  learn the caller's real subject to the ways this capability already gives (the "Security
  Considerations" section of {{RESTACT}}), and no protection against a verb that wants it.
* `remove(name) -> result<_, invocation-error>` removes a property of the bound object (OPTIONAL feature, token
  `object-remove`). Afterwards the property reads as one that was never set: absent, or, for an
  `inherit` property, the inherited value or the declared `default` ({{data-properties}}). It is
  authorized exactly as a `set` of the same name, and a `shared`-scoped property is removed from the
  state of its declaration, where `set` writes it. Removing a property that is not set succeeds and
  changes nothing.
* `remove-at(path, name) -> result<_, invocation-error>` removes a property of another object by path (token
  `object-remove`), under the same cross-object write-policy intersection as `set-at`: it is
  permitted only where the **runs-as-caller** principal could have written that property directly,
  so a verb is never a confused deputy. It returns `not-found` when no object is stored at `path`,
  since a removal never creates an object, and it refuses the reserved (`@`/`$`) namespaces and
  `shared`-scoped properties as `set-at` does. A `remove-at` of the verb's own bound object is
  equivalent to `remove`.
* `shape() -> object-shape` and `shape-at(path) -> object-shape` enumerate an object's shape — the
  `properties` it exposes (readable property names), its direct `children` (readable child object
  paths), and the `verbs` invokable on it — each ACL-filtered against the runs-as-caller principal
  (verb names follow the runs-as-caller principal's discovery listing (the "Discovery" section of {{RESTACT}})). `shape` reflects committed state.
* `get-bytes() -> option<tuple<string, list<u8>>>` and `get-bytes-at(path) -> option<tuple<string,
  list<u8>>>` read the binary value ({{binary-values}}) of the bound object or of the object at
  `path`, as its media type and its bytes (OPTIONAL feature, token `object-binary`). Each is gated by
  the `read` policy of the object it reads, as a `GET` of that object by the **runs-as-caller**
  principal would be. An absent object, an object with no binary value, an object the caller may not
  read and a path that does not address an object all return none, so the call is no existence
  oracle. An unbound verb's `get-bytes`, and either call by a verb the server has not granted the
  `object` capability, also return none. Both see the invocation's own earlier `set-bytes` and
  `set-bytes-at`. A server that fails to read a stored value MUST fail the invocation rather than
  return none. A server MAY fail the invocation with `memory-limit` when the value is larger than a
  bound it sets for the frame's memory. Both are pure reads, so a `function` verb MAY call them.
* `set-bytes(content-type, data) -> result<_, invocation-error>` and `set-bytes-at(path, content-type, data) ->
  result<_, invocation-error>` write the binary value of the bound object or of the object at `path` (OPTIONAL
  feature, token `object-binary-write`). Each is authorized exactly as a binary `PUT` of that object
  by the **runs-as-caller** principal would be ({{binary-values}}), and `set-bytes-at` under the same
  cross-object write-policy intersection as `set-at`, so a verb is never a confused deputy.
  A `content-type` that is not exactly one media type, that contains a control character, or that
  is one of the JSON media types of {{binary-values}} fails with `invalid-input`; an empty one
  stores `application/octet-stream`. A `set-bytes-at` whose path does not address an object, such
  as an empty path or one in the reserved `@` namespace, fails with `forbidden`. A value over the
  server's size cap fails with `object-too-large` and a refused write with `forbidden`; when the
  caller may not read an existing object, the result is what the same call gets with nothing stored
  there ({{objects-non-reader}}). The object's properties are left as they are. `set-bytes` commits
  with the verb's own bound-object writes and `set-bytes-at` commits as `set-at` does, and a
  `set-bytes-at` of the bound object is equivalent to `set-bytes`. A `function` verb that calls either
  gets `forbidden-side-effect`. A server that advertises `object-binary` or `object-binary-write` MUST
  also advertise `binary-values`.
* `query(prefix, order-by, descending, predicate, limit, cursor) -> query-page` reads a PAGE of the
  objects under a path prefix — each row carrying the object's path and its caller-**readable**
  property map — in ONE call, rather than one `get-at` per property per object (OPTIONAL feature,
  token `verb-object-query`). Rows order by the named property's type first (strings and absent, then numbers,
  booleans, arrays, objects), then within a type: strings bytewise, with an absent property
  ordering as the empty string, numbers numerically, `false`
  before `true`, arrays and objects unordered, with the path breaking ties (`order-by` absent = path
  order). `predicate` is a single `key == literal` equality, the
  literal being a string that matches a stored string byte-for-byte and any other stored value whose
  canonical form equals the literal parsed as JSON, applied to the **readable** value, so a property the caller may not read never matches and the filter is no
  information-leak oracle; `cursor` is an opaque keyset continuation the caller threads back
  unmodified. A server MUST bound the page: it MUST clamp `limit` to a server-chosen maximum and
  MUST NOT interpret any `limit` as unbounded, so a guest cannot force an unbounded result set into
  its runtime. A page MAY be shorter than `limit` while further rows remain, so a caller MUST drive
  pagination off the returned cursor rather than off a short page. Every row is filtered by exactly
  the gate `get-at` applies — the query is an access *accelerator*, never a widening of authority —
  and it is a pure read, so a `function` verb MAY call it.

Access is evaluated against the **runs-as-caller** principal (the "Authorization and Identity" section of {{RESTACT}}): a verb can read or write a
property only where the caller could on the data plane — where the object's own policy allows it **and** the property's ACL allows it. The capability is gated
exactly like composition — a server MUST link it only for components that import it, and a server
that does not implement `object-data-access` MUST refuse at upload a component that imports the
`object` interface, with `403` (`disallowed-import`), as it refuses any import it does not implement
(the "Capability Model" section of {{RESTACT}}). Property storage
semantics (scope `instance`/`shared`, `final`, ACL) are those of {{data-properties}}; a value is a
`property-value` as above.

The interface is `object` in the WIT package `rest-act:plugin` (the "Guest Contract (WIT package
`rest-act:plugin`)" appendix of {{RESTACT}}). Its types and functions are the following. Each function is bound to the feature
token given for it above, and `object-data-access` covers those for which no other token is given.
The error of a `result` is the package's `invocation-error`, whose `code` is a registered
`restact_code` (the "Errors" section of {{RESTACT}}).

~~~ wit
interface object {
    use types.{invocation-error};

    variant property-value { text(string), json(string) }

    record object-shape {
        properties: list<string>,
        children: list<string>,
        verbs: list<string>,
    }

    record query-cursor { order-value: string, path: string }

    record query-object {
        path: string,
        properties: list<tuple<string, property-value>>,
        order-value: property-value,
    }

    record query-page {
        objects: list<query-object>,
        cursor: option<query-cursor>,
    }

    path: func() -> option<string>;
    get: func(name: string) -> option<property-value>;
    set: func(name: string, value: property-value)
        -> result<_, invocation-error>;
    get-at: func(path: string, name: string)
        -> option<property-value>;
    set-at: func(path: string, name: string,
                 value: property-value)
        -> result<_, invocation-error>;
    set-at-if: func(path: string, name: string,
                    value: property-value,
                    expected: option<property-value>)
        -> result<_, invocation-error>;
    set-subject: func(name: string)
        -> result<_, invocation-error>;
    set-subject-at: func(path: string, name: string)
        -> result<_, invocation-error>;
    remove: func(name: string) -> result<_, invocation-error>;
    remove-at: func(path: string, name: string)
        -> result<_, invocation-error>;
    shape: func() -> object-shape;
    shape-at: func(path: string) -> object-shape;
    get-bytes: func() -> option<tuple<string, list<u8>>>;
    get-bytes-at: func(path: string)
        -> option<tuple<string, list<u8>>>;
    set-bytes: func(content-type: string, data: list<u8>)
        -> result<_, invocation-error>;
    set-bytes-at: func(path: string, content-type: string,
                       data: list<u8>)
        -> result<_, invocation-error>;
    query: func(prefix: string, order-by: option<string>,
                descending: bool,
                predicate: option<tuple<string, string>>,
                limit: u32, cursor: option<query-cursor>)
        -> query-page;
}
~~~

In a `query-object`, `properties` is sorted by name, and `order-value` is the value the row was
ordered on: the `order-by` property, or the path as `text` when `order-by` is none, and `text("")`
when the property is absent. A `query-cursor` is opaque to the verb, which passes back the one it
received unchanged.

Whether mutations are durable, and their consistency across a composition tree, follow the server's
advertised consistency level (the "Consistency" section of {{RESTACT}}). At every level, a verb's writes
to its own bound object are buffered and committed only when the invocation succeeds; a server
advertising only `conditional` MAY apply that commit property by property, last-writer-wins
against concurrent writers, rather than as one atomic step. A `set-at` write
to a foreign object commits at the call rather than as part of the verb's bound-object transaction —
so on a server advertising only `conditional`, a foreign `set-at` is NOT rolled back if the invoking
verb later traps; only the verb's OWN bound-object writes (buffered and committed on success) are
atomic with the invocation. A precondition on an action request is therefore refused (the
"Consistency" section of {{RESTACT}}). A verb that needs a lost-update-free write makes it through
its object capability instead (`object-cas`). A server providing a transactional consistency level
MAY make the whole tree atomic.

A server that advertises both `atomic-conditional` (the "Consistency" section of {{RESTACT}}) and
`object-cas` exposes the atomic compare-and-swap of `atomic-conditional` to verb code as a
per-property compare-and-swap on the object capability, a write conditioned on the property's current value, so a verb can run a
read-modify-write loop that loses no update. At the `atomic-invocation` level (the "Consistency"
section of {{RESTACT}}) a server MUST NOT admit the `object-cas` compare-and-swap within an
invocation — the call MUST fail without writing — and MUST NOT advertise the `object-cas` feature:
a compare-and-swap commits against committed state synchronously and therefore cannot join a
buffered frame. A server MAY re-admit it at the `atomic-invocation` level only by committing the
compare-and-swap atomically with the invocation's write set.

A server MUST evaluate a `remove` or `remove-at` call in the following order and return the error
of the first step that fails. A call that fails removes nothing.

1. The verb has been granted the `object` capability; else `forbidden`.
2. The verb is not a `function` (the "Verb invocation (the bare verb)" section of {{RESTACT}}); else `forbidden-side-effect`.
3. The name, and for `remove-at` the path, pass the checks `set` and `set-at` make, with the same
   `forbidden` refusals: no name in the reserved `@` or `$` namespaces, so no verb removes `$policy`
   or `$owner`; no path that is not client-addressable (the "Addressing" section of {{RESTACT}}); no member the server
   reserves at that path, such as `value` and `version` on a secrets-mount path (informative example: the "The mediated secrets mount (OPTIONAL, feature `secrets-management`)" section of {{RESTACT-CONNECTORS}});
   and, for `remove-at`, no `shared`-scoped name. The credential's own bounds
   ({{objects-relationship}}) are checked at this step too: they do not depend
   on what is stored, so their refusal is the same whether or not an object exists (the "Refusing a caller who may not read" section of {{RESTACT}}).
4. For an `instance`-scoped or undeclared name (an undeclared name is `instance`-scoped,
   {{data-properties}}), an object is stored at the target, as the
   invocation sees it with its own buffered writes applied; else `not-found`. The target is the
   bound object for `remove` and `path` for `remove-at`, even when the property is declared on
   another object. A `remove` of a `shared`-scoped name skips this step, since the state of a
   declaration is not an object and need not exist.
5. The caller has the authority a `set` of the same name needs: the object's `write` policy and the
   property's write `acl` ({{data-properties}}), or, for a `shared`-scoped name, that `acl` alone,
   as for `set`. A refused caller who may read the object gets `forbidden`, and one who may not
   gets `not-found` ({{objects-non-reader}}).
6. A `final` property that is set gives `property-final`.
7. The removal is recorded with the invocation's writes (the "Consistency" section of {{RESTACT}}): a `remove` with the
   bound object's buffered writes, and a `remove-at` at the call, as a `set-at` commits. Whether the
   property is set is decided against the state the removal commits to. A property that is not set
   there is left alone, and the call still succeeds.

Authority is decided before `final` and before the property's presence, so a caller who lacks it
learns neither. The two functions are bound to the `object-remove` feature token
(the "The guest contract (WIT)" section of {{RESTACT}}). A server that advertises `object-data-access` but not `object-remove` MUST
refuse at upload a component that imports either function, with `403` (`disallowed-import`), as it
refuses any import it does not support.

# Refusing a caller who may not read {#objects-non-reader}

The non-reader rule (the "Refusing a caller who may not read" section of {{RESTACT}}) covers the
requests this document defines: the `object` capability's `set`, `set-at`, `set-at-if`, `set-subject`, `set-subject-at`, `remove` and
`remove-at` ({{object-data}}); a `PUT` with `null` members ({{data-properties}}); a refusal by a
declared member's `acl` ({{data-properties}}); and, under a coupled object-binding mode
({{object-binding}}), defining, replacing or removing a verb bound to the object, a coupled
`DELETE`'s authority over the verbs it would remove, and a coupled mode's authority over the
object's verbs.

The rule governs only how a refusal is answered, so it does not refuse a `set-at-if` by a principal
who may write a property and may not read it. That call fails with `precondition-failed` without
comparing its `expected` ({{object-data}}), as an `If-Match` from such a caller fails without the
object's entity tag (the "Refusing a caller who may not read" section of {{RESTACT}}).

For a path that holds no object, the answers to these requests are:

* a `remove` or `remove-at` of an `instance`-scoped or undeclared property gets an
  `invocation-error` with code `not-found`, since a removal never creates an object. A data-plane
  `PUT` with `null` members is a write and gets the answer of the next item;
* a write that would create the object gets the answer of the creation rules
  ({{object-policy-inheritance}}). Those rules refuse it as not-found where a governing anchor's
  `write` policy refuses the caller and its `read` policy does too, as `forbidden` (`403`) where that
  anchor's `read` policy admits the caller, and, on a server advertising `governed-creation`, with
  that feature's `403` where no anchor reaches the path and the write does not carry a `$policy` of
  its own. At the verb tier the same refusal is an `invocation-error` with code `not-found` or
  `forbidden`;
* under `strict`, a verb definition or a write to a verb's `code` or `policy` property gets `409`
  (`object-binding`).

A request that would succeed at a free path, and that the non-reader rule therefore refuses as
not-found, includes a write the creation rules admit (no governing anchor reaches the path and
first-writer-owns applies, or an anchor's `write` policy admits the caller) and a deploy under
`auto-create`, which creates the object. The server MUST NOT define the verb.

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
is ordinary composition (the "Composition" section of {{RESTACT}}); the shared budget, cycle detection, depth and fan-out
bounds, and authority attenuation all apply unchanged.

A `get` or `list` accessor is a function (no observable side effects), so it is safe and cacheable
per the "Verb invocation (the bare verb)" section of {{RESTACT}}; `set`, `update`, `create`, and `delete` accessors are side-effecting (actions). A
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
four behaves unchanged). The accessor's result and errors propagate to the outer response. A data method that a `set`,
`update`, `create` or `delete` accessor serves is an action, so a server MUST refuse it with `400`
(`invalid-input`) when it carries `If-Match` or `If-None-Match`, and the accessor does not run
(the "Consistency" section of {{RESTACT}}). A `get` or `list` accessor is a function, and a precondition on it is evaluated
against its output tag, as for any function (the "Verb invocation (the bare verb)" section of {{RESTACT}}). Because the dispatched verb is
invoked through the ordinary invocation path, its own `execute` policy governs the request — so an
accessor's policy is the object-level authorization for that operation, layered above the baseline
object policy (the "Representations" section of {{RESTACT}}) that applies when no accessor is defined. Accessor verbs resolve
up the inheritance chain (the "Verb Resolution and Inheritance" section of {{RESTACT}}), so a base type MAY define default accessors that a subtype
overrides and MAY invoke explicitly (a "super" call). A server MAY use a `readMask` (the "Collections: Listing, Pagination, Filtering, Field Masks" section of {{RESTACT}})
to limit which child accessors a `get` composes.

Whether a request to an object's data path (for example, `GET /pet/dog`) is served from storage or
dispatched to a defined accessor verb is a server-selected behavior: a server MAY dispatch by default,
MAY serve stored representations by default, or MAY make it configurable, and a server that dispatches
MUST advertise it in discovery (the "Discovery" section of {{RESTACT}}): the `bare-path-accessor-dispatch` feature, and
`true` as the `accessorDispatch` member of the discovery document's `service` object while
dispatch is enabled (a document without the member describes a server that does not dispatch). When dispatch is enabled but no accessor is defined for the request, the
server serves the stored representation unchanged. A bare-path request names no verb, so it is never
answered `verb-not-deployed`; an explicit accessor invocation such as `GET /pet/dog:get` is an
ordinary invocation. Whether an accessor wraps underlying storage or
computes a purely virtual representation is determined solely by the capabilities granted to the verb
(the "Capability Model" section of {{RESTACT}}); neither {{RESTACT}} nor this document defines a
separate mechanism for it.

A server MAY mediate any of the data-plane methods on an object (the "Object data (the noun)"
section of {{RESTACT}}) through a defined accessor verb, in which case the accessor's `execute`
policy governs.

A request that a server dispatches to an accessor verb passes its body to the verb as it arrived,
`null` members included; the rules for `null` members ({{data-properties}}) govern only the
server's own handling of `PUT`.

# Declared Data Properties {#data-properties}

This OPTIONAL feature (token `data-properties`) lets an object **declare** named data properties with
storage and access semantics, so that shared or sensitive state is defined deliberately rather than
emerging by accident. A server that does not implement it treats all object state as undeclared (see
below). A server that does SHOULD advertise `data-properties` in discovery, and MAY advertise each
object's declarations.

A **declaration** has a `name` (a data-property name; user data MUST NOT use a `$`-prefixed name,
which is reserved for system fields, or an `@`-prefixed name, which is reserved for the server's
internal storage), an optional advisory `type`, an optional `default` value, and
the following modifiers:

- **`scope`** — `instance` (default) or `shared`. An `instance` property's value is stored on the
  concrete object the verb is invoked on, so sibling instances under one bound-verb definition (for
  example `counters/{id}`) have independent values. A `shared` property's value is stored on the
  object the property is **declared on** (the definition object — the resolution ancestor reached by
  the inheritance walk, the "Verb Resolution and Inheritance" section of {{RESTACT}}), so every instance observes and updates one common value. A
  global counter is a `shared` property; the absence of a declaration MUST NOT be treated as shared.

- **`final`** — when true, the property is write-once: a write to a value that is already set, and a
  removal of a value that is already set (by a `null` member of a `PUT` under `put-null-removes`, as
  this section describes, or by `remove` or `remove-at`, {{object-data}}), MUST fail with
  `property-final` (409) and MUST NOT mutate state. Removing a `final` property that is not set
  changes nothing. The refusal does not depend on the value offered: a write of the value already
  stored is refused like any other, so `property-final` tells a principal who may write the
  property and may not read it that it is set, and nothing about its value.

- **`inherit`** — when true (default false), value inheritance is enabled: reading a concrete object
  that has no locally-stored value for the property returns the value stored on the **nearest
  ancestor** object on the inheritance chain (the "Verb Resolution and Inheritance" section of {{RESTACT}}), and if no ancestor holds one, the
  declared `default`. When false the property never inherits a value (an absent value reads as absent),
  preserving plain stored-representation behavior. Inheritance and the declared `default` apply only to an object that
  exists, that is, one holding stored data of its own: an object that does not exist yields neither,
  whether it is read through the object data plane (`not-found`) or through a verb's object-data
  capability (the value is absent), so a verb invoked on a path where no object exists reads no
  inherited value. Within one invocation, the writes the invocation has made and not yet committed
  count toward existence, so once a verb has written to the object it is bound to, its reads of
  that object inherit. `inherit` applies only to `instance` scope — a
  `shared` property already resolves to a single value — and a server SHOULD reject `inherit` on a
  `shared` declaration. Inheritance MUST be applied identically whether the property is read through
  the object data plane or through a verb's object-data capability (the "Capability Model" section of {{RESTACT}}), and is gated by
  the property's read `acl` exactly as a local read is, so it never reveals more than a direct read.
  For an inherited value that `acl` is evaluated against the ancestor that holds the value, not the
  object being read: `owner` matches that ancestor's `$owner` and `prop:` reads that ancestor's
  stored values (the "Authorization and Identity" section of {{RESTACT}}), so a value reaches a principal through a descendant only if the
  principal could read it on the ancestor directly.

- **`acl`** — an optional `{ read, write }` pair, each a list of authorization subjects (the "Authorization and Identity" section of {{RESTACT}}:
  `public`, `owner`, `sub:`, `role:`, `group:`, `scope:`, `claim:`). A read or write is permitted only if the
  caller (the runs-as-caller principal, the "Authorization and Identity" section of {{RESTACT}}) matches a listed subject; an omitted list defaults
  to `read: [public]`, `write: [owner]`. The property ACL is evaluated **in addition to** the object's own policy
  (`$policy`, the "Representations" section of {{RESTACT}}, or the policy it inherits from a governing anchor) and, for an
  access made through a verb, the verb's own `execute` policy. It can only further restrict, never widen:
  a read needs both the object's `read` and the property's `read`; a write needs both the object's
  `write` and the property's `write` (a write that creates the object, or the first write to an
  existing object with no recorded owner, passes the object-level gate exactly as it would for an
  undeclared member); and a server MUST NOT let a property ACL admit a principal the object's policy
  refuses. A `shared` property is state of its declaration, not of an object: its writes are gated by
  its ACL and `final`; a read of it through an object path additionally needs that object's `read`. A denied read behaves as if the property is
  absent; a denied write MUST fail with `forbidden` (403), or as for an absent object when the caller
  may not read the object ({{objects-non-reader}}), and MUST NOT mutate state. This version
  defines exactly the two property actions `read` and `write`; finer per-property actions (e.g. a
  separate `manage`, or distinct code-vs-value actions) are a reserved increment, and a server MUST
  reject an `acl` naming an unknown action with `400 invalid-input` rather than silently ignoring it.

An **undeclared** property is equivalent to `{ scope: instance, final: false, acl: { read:
[public], write: [public] } }` — i.e. governed by the object's own policy alone, the pre-existing behavior — so adding
this feature is backward-compatible. A write refused under `final` or `acl` MUST abort the
invocation, discarding any other state changes it made (an `atomic-invocation` server, the "Consistency" section of {{RESTACT}},
already guarantees this). Concurrent writers of a `shared` property MUST NOT lose updates; a server
MAY serialize them or use the optimistic-concurrency / transactional mechanisms of
the "Consistency" section of {{RESTACT}}.

How declarations are submitted is server-defined: a server MAY derive them from the object's
schema, or accept them through a `props` verb property (the "Verb properties (the program itself)"
section of {{RESTACT}}). A server that exposes `props` serves and accepts it as a JSON object whose
`dataProperties` member is an array of declarations. A declaration is a JSON object with the
members `name`, `scope`, `final`, `type`, `default`, `inherit` and `acl` described above, of which
only `name` is required; `acl` holds `read` and `write`. A `PUT` of `props` replaces every
declaration of the verb, and a server MUST refuse with `400` (`invalid-input`), changing nothing,
a body with any other member at any of these levels, other than one that a feature the server
advertises defines.

**Removing a property (OPTIONAL, feature `put-null-removes`).** On a server that advertises
`put-null-removes`, a `PUT` body member whose value is JSON `null` removes that property, the
meaning a JSON merge patch gives `null` {{RFC7396}}; every other member keeps its rule
(the "Representations" section of {{RESTACT}}). The property then reads as one that was never set: absent, or, for an
`inherit` property, the inherited value or the declared `default` ({{data-properties}}). A `null`
member is authorized exactly as a write of that member would be, by the object's `write` policy,
the member's `acl` and the credential's own bounds ({{objects-relationship}}),
and it gets any refusal such a write would get. A `null` for a `final` member that is set MUST be
refused with `409` (`property-final`). The server MUST decide that authority before it checks
`final` or a precondition (the "Consistency" section of {{RESTACT}}), and the "Refusing a caller who may not read" section of {{RESTACT}} applies unchanged.

A `PUT` that mixes sets and removals is one write, under the rule of the "Object data (the noun)"
section of {{RESTACT}}. A `null` for a property that is not set changes nothing for that property, but the `PUT` around it is still a write: it needs write authority, as a `PUT` that
changes no value does, and once admitted it is handled as such a `PUT` is. A `PUT` whose members
are all `null`, sent to a path that holds no object, creates an empty object as `PUT {}` would,
under the same creation rules ({{object-policy-inheritance}}, {{object-binding}}) and with the same
answers to a caller who may not create it ({{objects-non-reader}}). A removal never deletes the object, even
when it removes the last data member: the object keeps its `$owner`, and only `DELETE` deletes it.
The rules for a `null` system field follow. A server that does not advertise `put-null-removes`
refuses every `null` member, as the "Native representation" section of {{RESTACT}} requires.

**A `null` system field (feature `put-null-removes`).** On a server that advertises
`put-null-removes`, `"$policy": null` in a `PUT` removes the object's own policy, and the object
falls back to its governing anchor's policy ({{object-policy-inheritance}}) or to the
omitted-policy defaults of the "Native representation" section of {{RESTACT}}. Since that can widen access, the removal needs exactly the authority that writing `$policy`
needs there. Removing a governing anchor's own policy changes, in the same way, the effective policy
of every descendant that stores no policy of its own. A server MUST refuse the removal where it
requires an object to carry a policy of its own, since the removal would leave an object the server
would not let anyone create. On a server advertising `governed-creation`, that requirement covers a
path no governing anchor reaches, and the refusal there is that feature's `403`. (Informative:
{{RESTACT-CONNECTORS}} names two more such places.)

The server decides these refusals after the authority decision, so a caller without that authority
gets only the authority answer ({{objects-non-reader}}), and it decides them on the path and on the policy
the write would leave, whatever is stored there. At a path that holds no object there is no policy
to remove: a `PUT` whose only member is `"$policy": null` is `PUT {}` and gets that request's answer
there, and a `null` `$policy` never counts as a creating write's own `$policy`
({{object-policy-inheritance}}).

`put-null-removes` does not change the answer to `"$owner": null`: the "Ownership is fixed" section
of {{RESTACT}} refuses it with `400` (`invalid-input`) on every server, in place of the `403` it
gives other `$owner` members, since ownership is fixed and no request removes it. On a server that
advertises `put-null-removes`, a `null` for any other `$`-prefixed name MUST be refused with `400`
(`invalid-input`).

A removal of a property, whether a `null` member of a data-plane `PUT` (the "Native representation" section of
{{RESTACT}}, at extension point E5) or a call
to the `object` capability's `remove` or `remove-at` ({{object-data}}), is a write. It joins the
write set exactly as a write of the same property would: a `remove` commits with the invocation's
other writes to its bound object, a `remove-at` commits at the call as a `set-at` does, and at
`atomic-invocation` both join the invocation's write set, which commits on return or is discarded
as a whole. Unlike the compare-and-swap, `remove` and `remove-at` are admitted at every level. The
invocation's own later reads see a removal and answer as for a property that was never set, and
of a `set` and a `remove` of the same property, the later call wins. Where a `set` and a later
`remove` of the same property are buffered in one write set at a path that holds no object, nothing
is written there for that property. Unless another buffered write leaves a property or a binary
value set at that path, the invocation's later calls see no object there, as if neither call had
been made, and its commit creates none. A removal is decided against
the state it commits to: a property that is not set there is left alone, a server that re-checks a
buffered write at commit re-checks a removal the same way, and an object deleted while the
invocation ran is not a refusal, since there is nothing left to remove.

# Binary values (OPTIONAL, feature `binary-values`) {#binary-values}

A server that advertises `binary-values` lets an object hold a **binary value**: bytes stored as a
client wrote them, with the media type they were written with, beside the object's properties
({{data-properties}}).

A `PUT /v1/<obj>` whose body is not empty and whose `Content-Type` is a single media type other than
`application/json`, `text/json`, and a type with the structured syntax suffix `+json` {{RFC6839}}
writes the body as the object's binary value, with that media type. A body with one of those JSON
media types keeps the meaning that the "Object data (the noun)" section of {{RESTACT}} gives it.
That section also has a server refuse with `415` (`invalid-input`) a `PUT` whose body is not empty
and whose `Content-Type` is absent or is not exactly one media type, and has a server that does not
advertise `binary-values` refuse a body of any other media type the same way. A server MUST refuse
with `422` (`invalid-input`) a binary write whose `Content-Type` contains a control character.

A binary write is authorized exactly as any other write of the object (the "Object data (the noun)"
section of {{RESTACT}}): by the object's `write` policy, and, for a caller who may not read an
existing object, with the answer an absent object would get. Property ACLs do not apply to it. It
replaces the object's binary value and leaves the object's properties as they are, and a `PUT` with
a JSON body leaves the binary value in place. Like any other `PUT`, a binary write counts as one
write for everything that observes writes, such as events and lifecycle hooks. A server MAY cap the
size of a
binary value, and MUST refuse a larger one with `413` (`object-too-large`).

A `GET` of an object that holds a binary value returns that value: the stored bytes unchanged, with
the stored media type as the `Content-Type` and a strong entity tag that changes whenever the bytes
change; a matching `If-None-Match` returns `304`. The object's properties are not part of that
response, and a verb reads them through the `object` capability ({{object-data}}). Such a response
is content a client supplied, so a server MUST send it with the headers, and the handling of
script-capable media types, that the "Security Considerations" section of {{RESTACT}} requires for a
verb's output. A server MUST NOT answer `404` for an object whose stored binary value the server
fails to read: a
store failure is `503` (`unavailable`), and a stored value whose bytes are missing or no longer match
what was written is a server error (`500`).

# Security Considerations {#objects-security}

* **Listing by prefix.** A listing narrowed by a client-chosen prefix ({{object-listing}}) still
  reads, and then drops, each object in range that the caller cannot read, so its response time
  grows with the number of such objects. Were any string accepted as a prefix, a caller could extend
  it one character at a time toward whichever request ran slow and recover the names of paths it
  cannot read. Requiring the prefix to end in `/` limits each probe to one whole guessed path
  segment; timing still reveals whether unreadable objects sit below a guessed name, and roughly how
  many. A server exposing the listing to untrusted callers SHOULD require authentication and SHOULD
  rate-limit it.
* **Declaration is not a grant.** A data-property declaration can only narrow access to the objects
  its route reaches. Were a property ACL able to admit a principal the object's policy refuses, any
  principal able to declare a property on a verb whose route reaches another principal's object could
  open it. Declarations can still narrow, hide (a read ACL), make a member write-once (`final`), or
  supply values (`inherit`, `default`) across every object their route reaches, so who may declare is
  itself an authority: under a coupled object-binding mode ({{object-binding}}) only the owner of the
  route's deepest concrete ancestor may.
* **Existence of unreadable objects.** The limits in the "Security Considerations" section of
  {{RESTACT}} apply here. A caller who may not read an object gets the answer an absent object would
  get from the listing ({{object-listing}}) and from a refused coupled-mode verb definition
  ({{objects-non-reader}}). A request that succeeds at a free path includes a write the creation
  rules admit ({{object-policy-inheritance}}) and a deploy under `auto-create` ({{object-binding}}).
  Under a coupled object-binding mode the discovery document lists the definition path of each verb
  the caller may see, so an object with such a verb bound to it is known to that caller to exist.
* **Binding under authentication.** Under `implicit`, a principal can bind a verb on an ancestor
  of another principal's objects and act on requests to them. The coupled object-binding modes tie
  each binding to ownership of the bound object, and the ancestor-creation rule keeps a principal
  from creating an ancestor above objects it does not own ({{object-binding}}).
* **Size of an object a writer may not read.** A server's per-object size cap is checked against
  the object as the write would leave it, with the stored members and the new value. A principal who may
  write an object but may not read it, such as a drop box with `write` open to the public and `read`
  kept to the owner, can therefore vary the size of what it writes until the answer turns from
  success to `object-too-large`, and so learn roughly how much is stored. The rule of the "Refusing
  a caller who may not read" section of {{RESTACT}} governs refusals for want of authority. This
  writer has the authority, and `object-too-large` is decided after it, so the rule does not apply.
  The cap is not relaxed for it, since checking only the new value would let the
  stored object grow past the cap. A deployment where that size is sensitive keeps such objects
  apart from the ones untrusted principals write, for example one object per writer.

The security considerations of {{RESTACT}} apply.

# IANA Considerations {#objects-iana}

This document requests the following registrations in registries that {{RESTACT}} creates. It
creates no registry.

* In the "REST:ACT Feature Tokens" registry: the tokens in the table of {{objects-relationship}}.
* In the "REST:ACT Error Codes" registry: the codes in the table below.
* In the "REST:ACT Verb Property Names" registry: `props` ({{data-properties}}), and `history` and
  `rollback` ({{verb-history}}).
* In the "REST:ACT Capability Interfaces" registry: `rest-act:plugin/object` ({{object-data}}).

The error codes this document defines, with the HTTP status of each, are:

| `restact_code` | Status | Meaning |
|---|---|---|
| `object-binding` | 409 | a coupled object-binding mode ({{object-binding}}) refused the deploy/bind: the object is absent, the caller may not read it, or the verb's path begins with a wildcard ({{objects-non-reader}}) |
| `invalid-filter` | 400 | a malformed collection/listing `filter` ({{object-listing}}) |
| `ancestor-claim` | 409 | the object was not created because objects stored below its path might be owned by another principal ({{object-binding}}) |
| `property-final` | 409 | write to a write-once (`final`) data property, or removal of one that is set |
