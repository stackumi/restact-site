---
title: "REST:ACT Events"
abbrev: "REST:ACT Events"
docname: draft-byrd-restact-events-00
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
  RFC8259:
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
verbs over HTTP. It defines how a server runs a verb that no client request started: a lifecycle
hook when an object is created, changed or deleted, a subscription when an event is published on a
topic, and a schedule at a set time. It defines how a verb publishes an event, how a server delivers
a topic's events to clients over Server-Sent Events, and how a server reports which objects a
rendered view read, so that a client can refresh only the views an event affects. A server
advertises each feature with its own token.

--- middle

# Introduction {#events-introduction}

REST:ACT {{RESTACT}} runs a verb when a client invokes it. This document defines the optional
features under which a server also runs verbs on its own, and publishes and delivers events:

* lifecycle hooks, subscriptions and schedules, each run under the authority of the principal that
  registered it ({{events}});
* the event-publish capability, through which a verb publishes an event on a topic, and the events
  the server publishes itself ({{event-publish}});
* the read set, which tells a client which objects a rendered view depends on
  ({{read-set-headers}});
* delivery of a topic's events to clients over Server-Sent Events ({{event-sse}});
* verb subscriptions, which deliver a topic's events to a verb ({{verb-subscriptions}});
* schedules, which run a verb on a recurrence ({{schedules}});
* the rules that subscriptions and schedules share as registered resources, and how a server
  reports how their firings ended ({{registrations}}, {{registration-outcomes}}).

Each is optional, and a server advertises each one it implements with its own feature token
({{events-relationship}}).

## Relationship to REST:ACT {#events-relationship}

This document is a REST:ACT extension, as described in the "Extension specifications" section of
{{RESTACT}}. That section says whom this document binds: a server that offers a mechanism one of
these feature tokens covers advertises the token and is bound by what this document requires of
that mechanism, and a requirement on a mechanism no token covers, such as a lifecycle hook outside
the data-plane CRUD subset, binds every server that offers the mechanism. The tokens are
`lifecycle-hooks`, `event-subscriptions`, `verb-subscriptions`, `verb-subscriptions-read-gate`,
`schedules`, `registration-outcomes`, `targeted-invalidation` and `admin-checkpoint`. The token
`events` is registered and reserved; no server advertises it. A requirement that also names a
feature or mechanism of another
document, such as a delegated credential or a presentation verb, binds a server that this document
binds when that server also offers that feature or mechanism. A client does not assume any behavior of this document from a server that does not
advertise its token.

| Feature tokens | Section |
|---|---|
| `lifecycle-hooks` (data-plane CRUD subset) | {{events}} |
| `schedules` | {{events}}, {{schedules}}, {{registrations}} |
| `event-subscriptions` | {{event-publish}}, {{event-sse}} |
| `admin-checkpoint` | {{event-publish}} (reserved host topics) |
| `targeted-invalidation` | {{event-publish}}, {{read-set-headers}}, {{event-sse}} |
| `verb-subscriptions`, `verb-subscriptions-read-gate` | {{verb-subscriptions}}, {{registrations}} |
| `registration-outcomes` | {{registration-outcomes}} |
| `events` | none: registered and reserved |

Every invocation this document starts without a request caller (a lifecycle hook, a subscription
delivery or a scheduled firing) runs under the authority of the principal that registered it,
attenuated as the "Execution identity" section of {{RESTACT}} sets for such invocations, the
extension point that the "Extension specifications" section of {{RESTACT}} names E2.

{::boilerplate bcp14-tagged}

# Events, Triggers, and Scheduling {#events}

Beyond client-initiated invocation, a server MAY support **server-initiated** invocation, running a
verb in response to an event or a schedule. This entire section is OPTIONAL; a server that does not
support it remains conformant. A server **supports eventing** when it publishes events by any means
this document defines (the event-publish capability, auto-publishing, or a reserved host topic) or
delivers them to clients or verbs.

An **event** is a message with a name and payload, associated with a **topic**, where a topic is an
object path: events concerning `/rooms/tavern` are published on that path. A verb MAY publish an
event through a host capability (the "Capability Model" section of {{RESTACT}}); publishing is the only new primitive —
everything that *handles* an event is an ordinary verb. There are three handling mechanisms, each
reusing existing constructs:

* **Lifecycle hooks** are reserved verb names that begin with `on` followed by an uppercase
  letter (for example `onCreate`, `onDelete`, `onChange`, `onEnter`). When a server performs the corresponding operation on an
  object, it invokes that object's hook verb if one is defined, resolved up the inheritance chain
  (the "Verb Resolution and Inheritance" section of {{RESTACT}}) — exactly as accessor verbs (the "Active Properties (Accessor Verbs)" section of {{RESTACT-OBJECTS}}) mediate data access. A server
  MAY support the **data-plane CRUD subset** of lifecycle hooks independently of the rest of this
  section, advertised by the `lifecycle-hooks` feature token. A server that advertises it MUST treat
  `onCreate`, `onChange`, and `onDelete` as reserved verb names that MUST be actions (the "Verb invocation (the bare verb)" section of {{RESTACT}}), and
  MUST, after a data-plane mutation on an object path commits, invoke that object's matching hook if
  one resolves and its registrant may read the object (below): `PUT` fires `onCreate` when the
  object did not previously exist and `onChange` when it did, and `DELETE` fires `onDelete` (after
  the delete). The hook runs through the ordinary invocation
  path under **registrant authority**: as the principal who registered the hook (its owner), charged to
  that owner's quota and bound by the same limits and the hook's own `execute` policy — NOT as the
  caller who triggered it. The triggering caller's identity is conveyed to the hook only as
  informational input, granting no authority; this prevents a hook that auto-fires on a third party's
  write from acting with that writer's identity (reading the writer's data or claims and exfiltrating
  them). Where the input names that caller, it MUST give the real subject of the principal the
  write ran as, and never a pairwise subject (the "Caller Identity" section of {{RESTACT}}),
  whatever the hook reads from the `identity` interface ({{events-security}}). A server MAY leave
  the identity out of the input, so a hook MUST NOT take its absence to mean an anonymous writer.
  Firing is **best-effort**: a hook error or trap does not roll back or fail the mutation (the
  mutation is the client's authoritative intent). A hook paused by an operator's ownership recovery
  is not invoked (the "Operator ownership recovery (OPTIONAL, feature `admin-reown`)" section of {{RESTACT-DELEGATION}}). Nor is a hook whose registrant may not read the object: before
  it invokes a hook, on every mutation that fires one, a server MUST evaluate whether the hook's
  registrant, attenuated as for any server-initiated invocation, is authorized to read the object
  (the "Authorization and Identity" section of {{RESTACT}}). For `onCreate` and `onChange` the gate is evaluated against the object as the
  mutation left it. For `onDelete` it is evaluated against the authorization the object had
  immediately before its removal, as for a deletion delivered to a subtree subscription over SSE
  ({{event-sse}}). If the
  registrant may not read the object, or the server cannot establish that it may, the server MUST
  NOT invoke the hook, and MUST NOT invoke a hook resolved further up the inheritance chain in its
  place. Such a skip is final, is not charged to the registrant, and MUST NOT be observable to the
  registrant. A server SHOULD record it in an operator-facing log; that record MUST NOT carry the
  hook's payload or the triggering principal, and SHOULD name the hook by its deployed route rather
  than by the mutated object's path. Without this gate a hook
  defined on an ancestor would learn the path, time, and author of every mutation beneath it,
  including mutations of objects whose own policy shuts the hook's owner out. A server MUST bound a
  hook→write→hook chain (e.g. a maximum hook-firing depth). To bound fan-out further, a server MAY
  restrict this subset to fire only on the data plane and not on accessor-mediated or
  capability-mediated writes.
* **Subscriptions** bind a topic to a target verb. A subscription is an ordinary resource, created
  and removed with the standard methods; a server that supports eventing invokes the target verb
  when a matching event is published. A subscription is **read-gated** like an SSE stream
  ({{event-sse}}), against the registering principal, both when it is created and at every delivery
  ({{verb-subscriptions}}).
* **Schedules** bind a time or recurrence to a target verb in the same way, providing timer and
  heartbeat behavior ({{schedules}}).

A server-initiated invocation has no request caller; it executes with the **authority of the
principal that registered** the trigger or schedule, captured at registration time and attenuated
as the "Execution identity" section of {{RESTACT}} sets for server-initiated invocations, with cost attributed to that principal. Each firing is a
distinct invocation, atomic where the server's consistency level provides it (the "Consistency" section of {{RESTACT}}),
bounded by the usual limits (the "Resource Limits" section of {{RESTACT}}) and, for fan-out, by the composition rules
(the "Composition" section of {{RESTACT}}).

**Replacing a hook's code.** Replacing the code of a lifecycle hook, which runs under its owner's
authority, MUST be performed by the owner, through every interface (`PUT …:verb/code`, rollback, and
re-registration): an authenticated non-owner receives `403`, whatever `$policy` grants (an
unauthenticated caller receives `401`, and where the "Verb declaration (deployment profile)" section
of {{RESTACT}} refuses a non-owner re-registration carrying `exec` with `400`, that refusal comes
first). This rule applies to every server advertising `lifecycle-hooks` and is not
gated on any delegation token.

## Publishing events {#event-publish}

The **event-publish capability** is a gated host capability (the "Capability Model" section of {{RESTACT}}), granted to a verb the
same way as composition and object-data access (deny-by-default; a deployment MAY withhold it from a
verb that declares it). It exposes one operation,
`publish(topic, name, data) -> result<_, invocation-error>`, which appends an
event (a name and a payload) to the named topic's event log. The topic MUST be a
client-addressable object path. Because publishing is an observable side effect, a **function MUST
NOT publish** (the "Verb invocation (the bare verb)" section of {{RESTACT}}); a server MUST refuse a publish attempt by a function with `403`
`forbidden-side-effect`. A server MAY additionally **auto-publish** a system event to an object's
topic when that object is mutated through the data plane, so subscribers observe mutations without a
guest hook. A server that auto-publishes these system events MUST name them after the corresponding
lifecycle hooks: `onCreate`, `onChange`, and `onDelete`. A server that supports the publish
capability advertises it in discovery (the "Discovery" section of {{RESTACT}}); a deployment MAY disable eventing entirely,
in which case the capability and the SSE surface ({{event-sse}}) are both withdrawn and the
discovery token is omitted.

**Names and payloads.** An event name MUST be non-empty and MUST NOT contain a control character
(U+0000 through U+001F, or U+007F), because it travels as a line of the SSE framing
({{event-sse}}); a server MAY also bound its length, and documents the bound if it does. The `data`
argument MUST be empty or the text of a single JSON object {{RFC8259}}; empty `data` stands for the
empty object. That object MUST NOT have a top-level member whose name begins with `$`, since those
names belong to the server (below). A server MUST fail a publish that breaks any of these rules
with `invalid-input` and MUST NOT retain or deliver the event; a verb that returns that error
surfaces as `422` (the "Errors" section of {{RESTACT}}).

**The publisher.** A server that supports eventing MUST add a `$publisher` member to the payload of
every event it publishes. The server sets it; it is never taken from the publisher:

* `{"kind": "host"}` for an event the server publishes itself: an auto-published lifecycle event,
  an event on a reserved host topic (below), and the gap signal of {{event-sse}};
* `{"kind": "verb", "verb": "<route>"}` for an event a verb publishes, where `<route>` is the route
  of the verb definition whose invocation called `publish`, as deployed (its definition pattern,
  the "Verb Resolution and Inheritance" section of {{RESTACT}}). It is never the concrete path the verb was invoked on, which could name an
  object the topic's readers may not read. `<route>` travels as a JSON string: a server MUST
  encode it with JSON's string escapes, never paste it into the payload text, because an object
  path may contain `"` and `\`, and a pasted route could add members to `$publisher`, a second
  `kind` among them.

Apart from adding `$publisher`, the server MUST leave the payload as the publisher wrote it. A
client MUST ignore members of `$publisher` it does not recognize, and MUST treat an event that has
no `$publisher` member as unattested. The member identifies code, not a principal: it does not name
the principal that invoked the verb, which a verb can put in its own payload if it chooses. A verb
that publishes to a topic others can read therefore discloses its deployed route to them.
`$publisher` tells a client that receives an event from the server who published it; it is not a
credential. Input a verb receives, such as a hook's payload or a subscription delivery
({{verb-subscriptions}}), can be supplied by any caller permitted to invoke that verb directly.

**Reserved host topics.** A server MAY publish its own operational lifecycle events — a checkpoint
starting and finishing, for instance — on topics in a **reserved namespace** of its own. Such a
topic is deliberately NOT a client-addressable object path: it is distinguished by a syntactic form
that the path grammar cannot produce, or one that the "Addressing" section of {{RESTACT}} reserves
and refuses in every client request, so that the rule above ("the topic MUST be a
client-addressable object path") makes the namespace unspeakable by a verb's `publish` and by the
data plane alike. That is what keeps it a one-way channel — by construction, rather than by an ACL
that could be misconfigured. For example, a server can use paths whose first segment begins with
`@`, which that section reserves; the reference implementation publishes checkpoint events on
`@host/checkpoint`.

Because a reserved host topic has no backing object, the read gate of {{event-sse}} — the same
authorization as reading the object — has nothing to evaluate. A server MUST NOT treat that as
open: it MUST require an authenticated principal to subscribe to a reserved host topic, on any
deployment where authentication is configured at all. Verb subscriptions ({{verb-subscriptions}})
MAY bind a target verb to a reserved host topic and fire under registrant authority exactly as for
any other topic; the same rule is their read gate, applied to the registering principal at
registration and again at every delivery. Both are read-side carve-ins only; neither creates a way
to publish into the namespace. A server that reserves such a namespace MUST document the reserved
form and the topics it publishes.

A server that advertises the **`targeted-invalidation`** feature (the "Discovery" section of {{RESTACT}}) MUST auto-publish
the lifecycle event on every committed object mutation — a data-plane `PUT`/`DELETE` AND a verb's
object capability (`set`/`set-at`, `set-subject`/`set-subject-at`, `remove`/`remove-at`, and delete where a deployment profile
exposes one) alike, closing the base rule's data-plane-only scope for such a server. Its auto-published payload MUST be a JSON
object carrying at least an `object` member (the mutated object's path — the target this feature
turns on); a `subject` member (the triggering principal) MAY also be present. Where it is, its
value MUST be the real subject of the principal the write ran as, the same for every recipient, a
verb that the event is delivered to included ({{verb-subscriptions}}); it is never a pairwise
subject (the "Caller Identity" section of {{RESTACT}}; {{events-security}}). The event name is
carried on the transport as usual ({{event-sse}}), never inside this payload as a separate
requirement. The payload MAY carry an `actor` member, and MUST carry one for a mutation made under
delegation (the "Delegated tokens (OPTIONAL, feature `delegated-tokens`)" section of {{RESTACT-DELEGATION}}) on a server advertising `delegated-tokens` and
`targeted-invalidation`.

**Removals.** A removal of a property that was set, whether by a `null` member of a data-plane `PUT`
(the "Extension specifications" section of {{RESTACT}}, E5; informative: the "Declared Data Properties" section of
{{RESTACT-OBJECTS}}) or by `remove` or `remove-at` (the "Object Data Access" section of {{RESTACT-OBJECTS}}), is a change of the object. Where
a server fires a lifecycle hook or auto-publishes a lifecycle event for the write, the removal is
`onChange`, never `onCreate` or `onDelete`, and the hook gates of {{events}} apply unchanged. A
removal never deletes the object, even when it removes the last data member, so it never fires
`onDelete`. Its event carries the members of any other change event, and like those it does not
name the property; a subscriber that needs to know what changed reads the object again. A `remove`
or `remove-at` that finds the property not set changes nothing and is not by itself a mutation of
the object, while a data-plane `PUT` stays a write whatever its `null` members find
(the "Object data (the noun)" section of {{RESTACT}}).

### The read set of an invocation {#read-set-headers}

The `targeted-invalidation` feature has a second, response-side half: scoped delivery is only useful
to a client that knows **which objects a rendered view actually depends on**. A server that
advertises the feature MUST report that dependency set on the response to an invocation whose
representation is `application/vnd.restact.ui+json` (presentation verbs, {{RESTACT-PRESENTATION}}),
using the response header

~~~
Restact-Read-Set: <path>[, <path>]*
~~~

whose value is a comma-separated list of object paths (the "Addressing" section of {{RESTACT}}). The set is
**server-observed, not verb-declared**: it names the object paths the invocation read through the
object-data capability (the "Object Data Access" section of {{RESTACT-OBJECTS}}), including reads served by a page-granular query. A verb
declares nothing and needs no change to be covered; a server MUST NOT populate this header from any
value the verb or the request supplied, because a client uses it to decide what to re-fetch.

The header is host-asserted metadata and MUST be carried as a response header, never injected into
the verb-authored representation: the document is untrusted verb output, and a client MUST NOT read
invalidation scoping out of it.

**Disclosure filter, applied first.** The emitted set MUST contain only paths the **requesting
principal** could itself read directly — the same existence-and-read gate a data-plane `GET` on that
path would apply, evaluated against the requester, not against a switched execution principal
(the "Execution identity" section of {{RESTACT}}). A view running under `runs_as=owner` or registrant authority may legitimately
read objects its caller cannot; reporting those paths would disclose their existence and full path
to that caller. Such a caller's view is therefore under-invalidated on exactly those objects and
refreshes on the coarser ladder instead: the view may go stale, but no path is disclosed.

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
(the "Security Considerations" section of {{RESTACT}}) MUST expose them via `Access-Control-Expose-Headers` alongside the other REST:ACT
response headers it exposes. A server that does not advertise `targeted-invalidation` emits neither
header (the "Extension specifications" section of {{RESTACT}}), and a client that does not see the
token MUST NOT rely on them.

## Delivering events to clients (SSE) {#event-sse}

Delivery of events to *clients* (rather than to verbs) is a transport concern. A server that supports
eventing SHOULD support Server-Sent Events (the WHATWG/W3C `text/event-stream` mechanism): a `GET` on a topic's object path
with `Accept: text/event-stream` opens a live stream of that topic's events instead of returning the
object's representation (content negotiation on the data-plane `GET`). The stream is **read-gated by
the same authorization as reading the object** (the "Authorization and Identity" section of {{RESTACT}}): a client that could not `GET` the
object's representation MUST NOT receive its events. A server MUST evaluate that gate when the
stream opens and again for each event it delivers afterwards; the retained events it sends as the
stream opens, all published before that evaluation, MAY rely on it. Each of the topic's OWN events carries a
monotonic id; a client MAY request **replay** of the topic's own retained events it missed by sending
`Last-Event-ID` (or an equivalent query parameter), and the server resumes after that id. A
subscriber that sends no cursor is making no claim about what it has already seen: a server MAY
begin the stream with the topic's retained events, and MAY instead begin at the live tail. A client
that requires only new events MUST therefore be prepared to receive retained ones it has already
observed, and SHOULD coalesce or discard them rather than treating each as a distinct change.
Retention is bounded and server-defined; a server MAY drop the oldest events and SHOULD signal a gap to a
lagging subscriber. A server MAY bound the number and lifetime of concurrent subscriptions.

**Delivery floor.** A server MUST NOT deliver an event published before the most recent of the
following on the topic's object, however the event reaches the delivery: by a replay with or
without a cursor, by a catch-up after a lost connection or a restart, as an arrival from another
node, as an event a verb published that the server held or deferred until the invocation returned,
as a retained event a subscription drains after a restart, or as a subtree frame. Any such
delivery made after the step that accepted the event is held to the floor exactly as a replay is, so
that the read gate a subscriber passes today never admits an event published under a different
object, or under an authorization the server has since changed. A reader admitted by a change the
floor records does not receive an event published before it. The floor is the most recent of:

* the object's deletion: an event published while an earlier object existed at the path is never
  sent to a subscriber of a later one;
* a write that sets, replaces or removes the object's own `$policy`, or that reassigns its
  `$owner`;
* a write that changes a property that a `prop:` matcher reads in a rule of the object's own
  `$policy` that covers `read` (the "Authorization policy" section of {{RESTACT}}), including, for
  an inherited value, a write to the object that holds it;
* on a server that advertises `object-policy-inheritance` ({{RESTACT-OBJECTS}}), a write or
  deletion that sets, replaces or removes the `$policy`, or reassigns the `$owner`, of an ancestor
  that was the object's governing anchor before the change or is after it, and a write that changes
  a member of the governing anchor that a `prop:` matcher reads in a rule of the anchor's `$policy`
  that covers `read`.

"Before" is the topic's own event order: the floor falls after every event the server accepted for
the topic before the change committed, and before every event it accepts after. The floor applies
whether the change widened or narrowed access: a server cannot tell which subscribers a change
admitted and which it shut out, so every such change ends the history a replay or a late delivery
may cross. A server MUST NOT count an event the floor hides in a gap's `missed`, and resumes a cursor older than the
floor from the floor. When the floor hides retained events from a subscriber that sent a cursor,
the server SHOULD signal a gap without a `missed` member, unless the replay starts at a later
object's `onCreate`, which needs no gap signal for what came before it. A server MUST establish the
floor before the deletion or authorization change takes effect, so that no replay or late delivery
after the change crosses it; a server that cannot record it refuses the change with `503` (`unavailable`)
rather than making it without one.

An event a verb published is compared with the floor at the point its invocation began, not when
the server releases it: a floor established after the invocation began holds back every event the
invocation published, including a change the invocation itself commits.

An event the floor hides from a late delivery is dropped and not counted. Where the delivery has a
gap signal, the server SHOULD send one gap per run of hidden events, without a `missed` member, and
only to a subscriber that passes the read gate for the topic; a reader that has lost read receives
nothing. No gap is sent for an event hidden by the deletion term, which belongs to an earlier
object. A subtree frame has no gap signal and is dropped silently, and a verb subscription skips the
delivery as one the read gate refuses. The per-event read gate above still applies to every delivery
the floor admits. An event delivered in the same step that accepts it needs no floor check.

**Deletion ends a topic's history.** Each event on an object's topic belongs to the object that
existed at that path when the event was produced, and the floor's deletion term binds live delivery
too: once the object is deleted, a server MUST NOT deliver any of its events to a subscriber of a
later object at the same path, live or otherwise. A server MAY meet this by purging the topic's
retained events at the deletion, by recording a deletion boundary among them, or by an incarnation
identifier. An event produced at the path while no object existed there belongs to no object; a
server SHOULD NOT deliver it to a subscriber of a later object, and a replay that starts at that
object's `onCreate` does not.

Each frame's data is the event's payload: a JSON object carrying the `$publisher` member of
{{event-publish}}. A server signals a gap with an event named `gap`, whose payload carries
`$publisher` with `kind` `host` and MAY carry a `missed` member giving the number of events the
subscriber did not receive.

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
the gate must describe the authority over that past state, not the object's absence. A late
subtree frame is also held to the delivery floor of the object it reports; the deletion term does
not hide a deletion's own frame from a subtree subscriber that passes the gate for it.

A topic's own `onDelete` event on a stream opened on the topic itself is gated the same way: a server
MUST evaluate the gate against the authorization the object had immediately before its removal. A
subscriber that could have read the object just before the deletion receives the event, and one that
could not does not, as for every other delivery of `onDelete`. If the server cannot establish that
authorization, it MUST NOT deliver the event.

## Verb subscriptions (OPTIONAL, feature `verb-subscriptions`) {#verb-subscriptions}

A **verb subscription** binds a topic to a target verb ({{events}}): when an event is published on
the topic, the server invokes the target as a server-initiated invocation under the authority of the
principal that registered the subscription (its registrant), attenuated as {{events}} requires
and billed to that principal. A server that supports verb subscriptions advertises the
`verb-subscriptions` feature token (the "Discovery" section of {{RESTACT}}). Delivering an event to a verb discloses it exactly
as delivering it to a client does, so a verb subscription is read-gated by the same authorization as
an SSE stream ({{event-sse}}), evaluated at two points.

**The registrant is the principal checked.** The read gate is evaluated against the registrant's
authority as it is attenuated for server-initiated execution (that attenuation keeps only the
subject, so a grant the registrant holds only through a role, group, scope, or claim does not admit
it). It is NOT evaluated against the execution identity the target verb runs under: a target that
runs as its owner (the "Execution identity" section of {{RESTACT}}) does not widen what the registrant may subscribe to, and the
server MUST NOT admit a registration or a delivery because the target's owner could read the topic.
The registrant chooses where the topic's events go, so the registrant's authority is what bounds
them; a target's execution identity can also change after registration (a redeploy, or a more
specific definition that later shadows a wildcard one, the "Verb Resolution and Inheritance" section of {{RESTACT}}).

**Attenuation never escapes a `deny` rule.** The attenuated registrant is subject to the rule of
the "Authorization and Identity" section of {{RESTACT}}: on a server that accepts `deny` rules, a `deny` keyed on a role, group, scope, or claim
matches it, at registration and at every delivery.

**At registration.** A server MUST refuse to create a subscription whose topic object the requesting
principal is not authorized to read (the "Authorization and Identity" section of {{RESTACT}}), and MUST give an absent topic and an unreadable
topic the same refusal: `404` `not-found`, the refusal a `GET` of the topic gives the same principal
(the "Refusing a caller who may not read" section of {{RESTACT}}). A subscription to a topic that does not exist yet is therefore refused; the topic object
is created first. When the requester is authorized to read the topic but the attenuated registrant
authority is not, the server MUST refuse the registration, and SHOULD do so with `403` `forbidden`,
since that refusal discloses nothing the requester could not already learn by reading the topic. A reserved host topic
({{event-publish}}) has no backing object; it is subscribable only by an authenticated principal on
a deployment where authentication is configured, as for SSE.

**At every delivery.** Before it invokes the target for an event, a server MUST evaluate the read
gate again, against the registrant and the authorization in force when the delivery is made — not
the authorization in force when the subscription was registered. A policy change, the revocation or
granting of a read, a change to the topic's governing context (the "Prefix-inherited object policy" section of {{RESTACT-OBJECTS}}), and
the topic's deletion therefore take effect at the next delivery, in both directions. For a deletion
event on the topic, the gate is evaluated against the authorization the topic had immediately before
its removal, exactly as for a subtree deletion over SSE ({{event-sse}}); if the server cannot
establish that authorization, it MUST NOT deliver. A subscription binds a path, not an object
identity: events for an object later re-created at the same path are gated by that object's own
authorization. The rule of {{event-sse}} that deletion ends a topic's history binds these
deliveries too, including a catch-up after a lost connection and a restart's drain of retained
events, and so does the delivery floor.

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

### The subscription resource {#subscription-resource}

A subscription is a registration ({{registrations}}) in the collection `/v1/subscriptions`. The
body of a request creating one is a JSON object with these members and no others:

* `target` (string, REQUIRED): the route of the action to invoke ({{registrations}}).
* `topic` (string, REQUIRED): an object path (the "Addressing" section of {{RESTACT}}) or a
  reserved host topic ({{event-publish}}). A server MUST refuse any other value with `400`
  `invalid-input`; for a topic it accepts, the read gate at registration (above) applies.
* `event` (string, OPTIONAL): an event name. When it is present, only events of that name are
  delivered; when it is absent, every event on the topic is.

An event matches a subscription when it is published on the subscription's topic itself, not on a
descendant of it, and has the subscription's `event` name if one was given. The representation of a
subscription carries the members {{registrations}} gives every registration, with `topic`, and
`event` when one was given.

**The input of a delivery.** A server MUST pass the target, as its input, a JSON object with
these members:

| Member | Value |
|---|---|
| `event` | the event's name |
| `topic` | the topic the event was published on |
| `data` | a JSON string holding the text of the event's payload, `$publisher` member included ({{event-publish}}) |
| `seq` | the event's id: the value an SSE stream gives the event in its `id` field ({{event-sse}}) |
| `subscription` | the subscription's `id` |

The payload travels as text and unchanged, so the target receives exactly what an SSE client of the
topic does. The input is informational: any principal that may invoke the target directly can
supply the same input, so a target can rely on `$publisher` only when its execute policy admits no
such caller.

## Schedules (OPTIONAL, feature `schedules`) {#schedules}

A **schedule** binds a recurrence to a target action ({{events}}): each time the schedule falls
due, the server invokes the target as a server-initiated invocation under the authority of the
principal that registered it (the **registrant**), attenuated as {{events}} requires and billed to
that principal. A schedule is a registration ({{registrations}}) in the collection
`/v1/schedules`. A server that supports schedules advertises the `schedules` feature token (the
"Discovery" section of {{RESTACT}}).

**The create request.** Its body is a JSON object with these members and no others:

* `target` (string, REQUIRED): the route of the action to invoke ({{registrations}}).
* `intervalSeconds` (integer, REQUIRED): the period in seconds. A server MUST refuse with `400`
  `invalid-input` a period shorter than its floor, the shortest period it accepts. The floor is
  server-defined and SHOULD be documented; it bounds how fast one registration can spend its
  registrant's resources.

**The representation** carries the members {{registrations}} gives every registration, with
`intervalSeconds` as registered, and:

* `lastFiredAt` (integer): the time of the schedule's latest firing, which is that firing's
  `firedAt` (below). It is absent until the schedule first fires.
* `nextFireAt` (integer): the time the schedule next falls due. It is a due time, not a promise:
  the schedule fires at or after it, and it is in the past while a due firing waits.

**When a schedule fires.** A schedule falls due one interval after it is created, and then one
interval after each firing's `firedAt`. A server MUST NOT fire a schedule before it is due, SHOULD
fire it promptly once it is, and MAY fire it later, for example under load or while an earlier
firing of the same schedule is still running. Firing is **at most once**:

* A due time yields at most one firing, even on a server of several nodes, and a firing is never
  retried, whether its target fails or the server stops while it runs. The next firing is the one
  for the next due time.
* When one or more due times pass while the server cannot fire the schedule (it is stopped, or the
  firing waits), the server fires the schedule once, not once per due time missed, and the
  schedule next falls due one interval after that firing.

**The input of a firing.** A server MUST pass the target, as its input, a JSON object with these
members:

| Member | Value |
|---|---|
| `event` | the string `schedule` |
| `schedule` | the schedule's `id` |
| `target` | the schedule's `target` |
| `firedAt` | the time the server took this firing, which becomes the schedule's `lastFiredAt` |
| `dueAt` | the due time this firing serves, never later than `firedAt`; for a firing that covers several due times, the earliest |

A target that must tell a late firing from a punctual one compares `firedAt` with `dueAt`. The
input is informational ({{registrations}}).

## Registration resources {#registrations}

Subscriptions ({{verb-subscriptions}}) and schedules ({{schedules}}) are **registrations**: each
binds a trigger to a target action, is created and removed with the standard methods, and fires as
a server-initiated invocation ({{events}}). A server that advertises `schedules` serves these
requests:

| Request | Result |
|---|---|
| `POST /v1/schedules` | `201` with the new schedule's representation, and a `Location` header naming its item `/v1/schedules/{id}` (a URI reference that resolves under the server's base URL: the "Base URL" section of {{RESTACT}}) |
| `GET /v1/schedules` | `200`, the caller's own schedules, in a body `{"schedules":[…]}` |
| `GET /v1/schedules/{id}` | `200` with the representation, or `404` `not-found` when the schedule is absent or is not the caller's: one answer for both |
| `DELETE /v1/schedules/{id}` | `204`; the schedule is removed. Absent, or another's: `404` as for `GET`. |

A server that advertises `verb-subscriptions` serves the same four requests on `/v1/subscriptions`,
with a list body `{"subscriptions":[…]}`. Both collections follow these rules:

* **Owned by the registrant.** The principal that creates a registration is its registrant. Only
  the registrant can list, read or delete it; any other principal, and an id that does not exist,
  gets the same `404`, so an id is no existence oracle. An id is opaque and SHOULD be unguessable.
* **No anonymous registrations.** On a deployment where authentication is configured, a server
  MUST refuse an anonymous caller's create or delete with `401` (the "Authorization and Identity"
  section of {{RESTACT}}), and the anonymous principal owns no registration: its list is empty and
  every item answers `404`.
* **No sub-tokens.** A server MUST refuse a path-scoped sub-token (the "Path-scoped sub-tokens
  (OPTIONAL, feature `path-scoped-tokens`)" section of {{RESTACT-DELEGATION}}) with `403`
  `forbidden` on every request in this section: each firing would run with the authority of the
  principal that minted the token, not with the token's own, and would outlive it. A request made
  under delegation is bound by the "Delegated tokens (OPTIONAL, feature `delegated-tokens`)"
  section of {{RESTACT-DELEGATION}}, which also governs the firings of a registration it creates.
* **Immutable.** A registration has no update. A server MUST answer `PUT` and `PATCH` on a
  registration with `405` (`method-not-allowed`) and an `Allow` field that names `GET` and `DELETE`
  and names neither `PUT` nor `PATCH` (it MAY name others the resource supports, such as `HEAD` and
  `OPTIONS`); a client changes a registration by deleting it and creating another.
* **Strict create bodies.** A server MUST refuse with `400` `invalid-input`, creating nothing, a
  create body that is not a JSON object {{RFC8259}}, that lacks a REQUIRED member, that has a member
  whose value is not of the type its definition gives (`null` included), or that has a member this
  document does not define for that resource. A member of the representation that the server
  writes, such as `id` or `createdAt`, is not a member of the request, and neither is a member
  defined by an optional feature the server does not advertise. A client can therefore send a
  member that a later feature adds: a server that does not know it refuses the request rather than
  creating a registration that ignores it. An integer member is a JSON number written without a
  fraction or an exponent.
* **The target.** `target` is a verb route (the "Addressing" section of {{RESTACT}}). A firing is a
  side effect, so the target is an action (the "Verb invocation (the bare verb)" section of
  {{RESTACT}}): a server MUST refuse with `400` `invalid-input` a target whose object part is not an
  addressable object path, one that resolves to no verb (the "Verb Resolution and Inheritance"
  section of {{RESTACT}}), and one that resolves to a function. A server SHOULD refuse with `403`
  `forbidden` a target whose execute policy does not admit the registrant as attenuated for a
  server-initiated invocation ({{events}}), since no firing of it could run. A registration binds a
  route, not a verb definition: each firing resolves the route again and is authorized against the
  target's execute policy in force at that firing.
* **A bound per principal.** A server SHOULD bound the number of registrations of each kind that
  one principal holds, and refuses a create beyond the bound with `429` `quota`. That response
  carries no `Retry-After`: the bound does not lapse with time, only when the principal deletes a
  registration.
* **Times.** Every time in a representation or a firing's input is an integer number of seconds
  since 1970-01-01T00:00:00Z, leap seconds not counted (Unix time).
* **The representation.** Every registration's representation carries `id` (string), the last
  segment of its item path; `target` as registered; `createdAt` (integer), the time it was created;
  and the members its own section adds. It MAY carry other members, and a client MUST ignore a
  member it does not recognize.
* **Firing.** Each firing is a distinct invocation of the target as an action, through the server's
  ordinary invocation path, under the registrant's attenuated authority, billed to the registrant
  and bound by the usual limits ({{events}}; the "Resource Limits" section of {{RESTACT}}). The
  input its section defines is informational: any principal that may invoke the target directly
  can supply the same input. A firing that fails is not retried; how it ended is recorded only
  where the server advertises firing outcomes ({{registration-outcomes}}).
* **Removal.** Once a `DELETE` of a registration answers `204`, the server MUST NOT start another
  firing of it, on any node and after any restart. A firing already started MAY finish.
* **Switched off.** A server that implements one of these resources but does not advertise its
  feature token, for example because an operator has switched the feature off, MUST refuse a create
  with `501` `unsupported-feature` and MUST NOT fire a registration of that kind.

### Firing outcomes (OPTIONAL, feature `registration-outcomes`) {#registration-outcomes}

A server that advertises the `registration-outcomes` feature token (the "Discovery" section of
{{RESTACT}}), which it does only alongside `schedules` or `verb-subscriptions`, records how the
latest firing of each schedule and subscription it serves ended, in three members of the
registration's representation:

* `lastOutcome` (string): `ok` when the target ran and succeeded; `error` when the server took the
  firing and it failed, because the target returned an error, trapped or exceeded a limit, or
  because the server could not run it; `skipped` when the server took the firing but did not invoke
  the target, because the registrant was over its quota or because the delegation grant the
  registration follows did not allow it (the "Delegated tokens (OPTIONAL, feature
  `delegated-tokens`)" section of {{RESTACT-DELEGATION}}). Absent until the first outcome.
* `lastError` (object): `{"code": <string>, "at": <integer>}` for the latest firing that ended
  `error` or `skipped`, where `at` is the time the server took that firing (for a schedule, its
  `firedAt`); for consecutive `skipped` firings with the same code, `at` MAY stay at the first of
  them. Absent until a firing ends `error` or `skipped`. A later `ok` does not clear it: a
  server MUST keep `lastError` until a later `error` or `skipped` firing replaces it, so the
  registrant can see when and how the target last failed.
* `consecutiveFailures` (integer): the number of firings that ended `error` since the latest `ok`.
  An `ok` resets it to 0 and a `skipped` leaves it unchanged. A client MUST read an absent member
  as 0.

**The code.** `code` names the failure from a closed vocabulary, the values of the "REST:ACT Error
Codes" registry (the "Errors" section of {{RESTACT}}). When the code the server would give the same
failure on a direct invocation is a registered value, `code` is that value; a skip records `quota`
or `delegation-bound`. Otherwise `code` is `application-error` for a failure that arose in the verb,
such as an error code of the verb's own choosing, and `internal` for any other failure, such as a
fault in the server itself. Both are core codes; `application-error` appears only in a firing
outcome, never in a response. A server MUST NOT store or return any other text about a failure: not
the error's message or detail, not an unregistered code the target chose, and not the target's
output. The registrant is not always the target's author (the target can be another principal's
verb, or run as its owner, the "Execution identity" section of {{RESTACT}}), and an error's text can
carry data the registrant may not read, or the server's own internals; a code from a closed list
carries neither.

**Firings only.** A delivery the read gate refuses ({{verb-subscriptions}}) is not a firing and MUST
NOT change any of these members, since a change would tell the registrant that a topic it may not
read had an event. Nor does an event the server drops before taking a firing for it, such as one
inside a minimum interval between deliveries, change them. When firings of one registration
overlap, a server SHOULD NOT let the outcome of one replace the outcome of a firing it took later.
A server that shares registrations across nodes and writes nothing for an `ok` that follows an
`ok` cannot always tell; the next firing's outcome corrects the members.

**Read-only.** Only the server writes these members. A create request carrying one is refused like
any member the request does not define ({{registrations}}), and no request sets them.

# Security Considerations {#events-security}

* **Autonomous execution.** Hooks, subscriptions and schedules run without a connected client, so
  an event storm or a runaway schedule spends its registrant's resources. The
  "Security Considerations" section of {{RESTACT}} bounds every server-initiated invocation by its
  registrant's quota and the per-invocation limits.
* **Disclosure through subscriptions.** An event carries metadata (that an object exists, when it
  changed, and who changed it) and may carry content a verb published. A verb subscription is a
  standing delivery channel with no lifetime bound, so a server MUST read-gate it against its
  registrant at registration and at every delivery ({{verb-subscriptions}}); a gate at registration
  alone would let a revoked reader keep receiving a topic's events indefinitely, and a gate keyed to
  the target verb's execution identity would let any principal route a topic into a runs-as-owner
  verb whose owner can read it. A lifecycle hook is the same kind of channel, which is why it is
  read-gated against its registrant ({{events}}).
* **Who changed an object.** A lifecycle hook's input and a lifecycle event can name the principal
  a write ran as, and an event names its actor under delegation. These are real identifiers, as
  the provenance facet (the "The provenance facet (OPTIONAL, feature `object-provenance`)" section of {{RESTACT-DELEGATION}})
  holds them, and each is released on the authority of a principal that may read the object: a
  client's own, or the registrant's of a hook or a subscription. The pairwise subject of
  the "Caller Identity" section of {{RESTACT}} is not used for them. It keeps a verb's author
  from learning who the verb's callers are. Whoever changes an object is not a caller of the hook
  or of the verb an event reaches, and the store names principals by real subject throughout, as
  in the policy that admitted the write. If a server named the writer by a pairwise subject to
  some recipients, an owner who also learned the real one, from the facet or as a client of the
  same event, would hold two names for one act and could pick the writer out among the callers of
  its own verbs. So a hook or an event names the writer by real subject or not at all. Three
  things follow. The code that receives the subject needs no capability, so a verb's `interfaces`
  do not show that it learns who writes an object. A registrant who subscribes another owner's
  verb gives that verb whatever the events carry, the writer's subject included; if the registrant
  is the writer, the verb reads the registrant's pairwise subject in the same frame and can pair
  the two. And `actor()` does not name the actor of a delegated write to a hook unless the server
  discloses the real identity (the "Delegated tokens (OPTIONAL, feature `delegated-tokens`)"
  section of {{RESTACT-DELEGATION}}); the hook's owner learns who it is as any reader of the object
  does, from the event or the provenance facet. An operator who does not want a reader to learn who changes an
  object leaves the identity out of hook input and the `subject` member out of payloads, and does
  not offer the provenance facet; the `actor` of a delegated write stays in the event.
* **Late delivery after a revocation.** Retained events outlive the authorization they were
  published under, so replay discloses the history of a topic, not only its current state, and so
  does any delivery made after the step that accepted the event: an arrival from another node, a
  held or deferred publish, a restart's drain. The per-event read gate alone would not stop these,
  because it is evaluated at delivery time. The delivery floor ({{event-sse}}) cuts that history at
  a deletion and at every change the server makes to what governs a read of the object: its own or
  its governing policy and owner, and a property that a `prop:` matcher in that policy reads. A
  reader admitted by such a change does not receive an event published before it. The floor cannot
  see a change made elsewhere: a role, group, scope or claim that an identity provider removes from
  a subscriber and later restores, or a change to the server's default policy. Nor does it cover a
  change that concerns the subscriber rather than the object, such as issuing or revoking a
  delegation grant. A subscriber denied and later re-admitted in either way can receive events
  published in between; a deployment that relies on such revocations SHOULD keep retention short,
  since a subscriber that sends an old cursor can replay whatever is retained since the last change
  the floor records. The gap a floor causes carries no content or count, but tells a re-admitted
  subscriber that the topic had events it does not receive.
* **Forged events.** Publishing needs no authority over the topic, so any verb that may publish can
  reach any topic it can address, and the topic's readers act on what arrives. A server therefore
  keeps the lifecycle and gap names to itself (the "Grammar" section of {{RESTACT}}) and attests the
  publisher of every event ({{event-publish}}). A client that acts on an event's content checks `$publisher` first, and a
  verb that consumes events through its input remembers that its input can come from any caller
  its execute policy admits.
* **Firing outcomes.** The outcome of a firing is shown to the registrant, who is not always the
  target's author and may not read what the target read. A server therefore records a code from
  a closed list, never the target's text, and records nothing for a delivery the read gate
  refuses ({{registration-outcomes}}).

The security considerations of {{RESTACT}} apply.

# IANA Considerations {#events-iana}

This document requests the following registrations in registries that {{RESTACT}} creates. It
creates no registry.

* In the "REST:ACT Feature Tokens" registry: the tokens in the table of {{events-relationship}},
  with `events` registered as reserved.
* In the "REST:ACT Capability Interfaces" registry: `rest-act:plugin/event` ({{event-publish}}).
