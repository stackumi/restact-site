---
title: "REST:ACT HTTP Verbs"
abbrev: "REST:ACT HTTP Verbs"
docname: draft-byrd-restact-http-verbs-00
category: exp
submissiontype: independent
ipr: trust200902
area: "Applications"
keyword:
  - REST
  - WebAssembly
  - webhooks
  - capability security
stand_alone: yes
pi: [toc, sortrefs, symrefs, comments]
author:
  -
    ins: N. Byrd
normative:
  RFC2104:
  RFC3986:
  RFC4648:
  RFC6234:
  RFC6266:
  RFC8187:
  RFC8259:
  RFC9110:
  RFC9111:
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
  UNICODE:
    title: "The Unicode Standard"
    author:
      -
        org: The Unicode Consortium
    target: https://www.unicode.org/versions/latest/
  WHATWG-URL:
    title: "URL (WHATWG Living Standard)"
    target: https://url.spec.whatwg.org/
informative:
  RFC7240:
  RFC8126:
  RFC9421:
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
  GITHUB-WEBHOOKS:
    title: "Validating webhook deliveries (GitHub Docs)"
    target: https://github.com/github/docs/blob/44442041dd7f/content/webhooks/using-webhooks/validating-webhook-deliveries.md
  STRIPE-WEBHOOKS:
    title: "Receive Stripe events in your webhook endpoint: verify webhook signatures (Stripe Documentation)"
    date: 2026-10-27
    target: https://web.archive.org/web/20261027051205/https://docs.stripe.com/webhooks
  SLACK-SIGNING:
    title: "Verifying requests from Slack (Slack Developer Docs)"
    date: 2026-10-06
    target: https://web.archive.org/web/20261006064553/https://docs.slack.dev/authentication/verifying-requests-from-slack/
  STANDARD-WEBHOOKS:
    title: "Standard Webhooks Specification"
    target: https://github.com/standard-webhooks/standard-webhooks/blob/ab6844147ce9cdb0d2dbf2e60d1ea85001fd2554/spec/standard-webhooks.md

--- abstract

This document specifies an optional extension to REST:ACT, the protocol for invoking sandboxed
verbs over HTTP. Under it a verb can read the request header fields it declares and set its own
response status, a small set of response header fields and its content type, within limits that
keep the server's own refusals, caching and origin-wide state out of a verb's reach. A second,
separately advertised feature lets a deployer gate a verb behind webhook signature verification
that the server performs before the verb runs, with replay protection and a cost account of its
own. A server advertises each feature with its own token.

--- middle

# Introduction {#http-introduction}

A REST:ACT {{RESTACT}} verb answers with a body. The server chooses the status, the header fields
and, from the verb's declaration, the content type: a successful invocation answers `200`, and a
refusal is a Problem Details document that the server writes. That is enough for a verb that
computes a value. It is not enough for a verb that implements an HTTP resource of its own, such as
one that answers `201 Created` with a `Location`, offers a download under a file name, redirects a
browser after a form post, or receives a webhook, whose sender reads only the status and whose
authenticity rests on a signature in a header field.

This document defines two optional features:

* **HTTP verbs** ({{http-guest}} through {{http-codes}}): a verb deployed with the `http`
  declaration reads the request header fields it declared and sets its own status, a closed set of
  response header fields and a content type from the set it declared.
* **Webhook verification** ({{http-webhooks}}): a verb deployed with `verify` runs only for a
  request whose signature the server has verified under a registered scheme, once per signed
  delivery, and the compute cost of the delivery is charged to an account of the verb's owner
  rather than to the anonymous sender.

The threat model is that of {{RESTACT}}: the verb, its declarations and every request are
possibly hostile. Every rule below exists so that a verb that controls its own response still
cannot speak for the server, change state that outlives its own response, or reach a credential
that the caller's request carried.

## Relationship to REST:ACT {#http-relationship}

This document is a REST:ACT extension, as described in the "Extension specifications" section of
{{RESTACT}}. Its server requirements bind a server that advertises the token that covers the
mechanism they constrain: `verb-http-handler` for {{http-guest}} through {{http-codes}}, and
`webhook-verification` for {{http-webhooks}}. The rules in {{http-features}} for a verb that a
server holds while it does not advertise the token covering it constrain a mechanism that neither
token covers, and bind every server that holds such a verb. A requirement that also names a feature
of another document, such as an accessor verb, binds a server that this document binds when that
server also offers that feature. A client does not assume any behavior of this document from a
server that does not advertise its token.

| Feature tokens | Section |
|---|---|
| `verb-http-handler` | {{http-guest}}, {{http-deploy}}, {{http-request}}, {{http-response}}, {{http-entries}}, {{http-discovery}}, {{http-codes}} |
| `webhook-verification` | {{http-webhooks}} |

This document relaxes requirements of {{RESTACT}} at two of the extension points that the
"Extension specifications" section of {{RESTACT}} names, and only while the token is advertised:

* E12, a verb's own response: an HTTP verb sets its status and content, and a status of `400` or
  more carries the verb's own content rather than Problem Details ({{http-response}}), including
  in the tool result of the Model Context Protocol facet of {{RESTACT-MCP}} ({{http-entries}});
* E13, cost attribution: the compute cost of a verified delivery is attributed to the verb owner's
  webhook account ({{http-webhook-cost}}).

It also relies on two rules of {{RESTACT}} without relaxing them: the "Consistency" section of
{{RESTACT}} counts as a verb's error return any return that an advertised extension defines as one,
and this document defines a status of `400` or more as one, at every consistency level
({{http-commit}}); and the
"Verb declaration (deployment profile)" section of {{RESTACT}} requires a server to refuse a
deployment parameter it does not recognize, so a server that does not implement this document
refuses `verify` rather than deploying an unverified receiver.

{::boilerplate bcp14-tagged}

# Terminology {#http-terminology}

The terms of {{RESTACT}} apply. This document also uses:

HTTP verb:
: A verb deployed with the `http` declaration ({{http-deploy}}).

Route entry:
: An invocation that a request to a verb's route, `<object path>:<verb>`, starts, as the "Verb
  invocation (the bare verb)" section of {{RESTACT}} defines it. Its root frame is the only frame
  that sees the request.

Synthetic request:
: What every other frame sees in place of the request: no header fields, no query, and a method
  ({{http-request}}).

Verify-gated verb:
: A verb deployed with `verify` naming a webhook scheme ({{http-verify-deploy}}).

Scheme:
: A registered rule for verifying a webhook signature: the header fields it reads, the content it
  signs and the key it uses ({{http-schemes}}).

Verified delivery:
: A request to a verify-gated verb's own route whose signature the server verified under the
  verb's scheme and key before the verb ran ({{http-verify-order}}).

Webhook account:
: The account to which a server attributes the cost of verified deliveries, one for each principal
  that owns a verify-gated verb ({{http-webhook-cost}}).

# Feature tokens and absent servers {#http-features}

A server that offers HTTP verbs MUST advertise `verb-http-handler`. A server that offers webhook
verification MUST advertise `webhook-verification`, and MUST NOT advertise it unless it also
advertises `verb-http-handler` and `secrets-management` (the "The mediated secrets mount (OPTIONAL,
feature `secrets-management`)" section of {{RESTACT-CONNECTORS}}). `verb-http-handler` depends on
no other feature.

While a server does not advertise a token, it emits no discovery member, deployment parameter,
response header field or code that the token covers. In particular:

* A component that imports the `request` or `response` interface is refused at upload, as the
  "The guest contract (WIT)" section of {{RESTACT}} requires for an import the server does not
  grant.
* A deployment that carries a parameter of {{http-deploy}} is refused as carrying an unrecognized
  parameter (`400`, `invalid-input`, naming the parameter), as the "Verb declaration (deployment
  profile)" section of {{RESTACT}} requires, so a server never deploys an unverified receiver
  because it ignored `verify`.
* A server MUST NOT invoke an HTTP verb that it holds while it does not advertise
  `verb-http-handler`, or a verify-gated verb that it holds while it does not advertise
  `webhook-verification`. It answers every invocation of such a verb, through every entry, with
  `501` (`unsupported-feature`) naming the missing token, before the verb runs, and omits the verb
  from its discovery document and from the OpenAPI document of the "Discovery" section of
  {{RESTACT}}. A verify-gated verb therefore never runs unverified, and an HTTP verb never runs as
  a verb whose response the server would serve without the rules of this document.

A client SHOULD check discovery for a token before it sends a parameter that the token covers.

# The guest contract {#http-guest}

A server that advertises `verb-http-handler` adds two gated interfaces to the WIT package
`rest-act:plugin`, `request` and `response`, and four worlds that add both to a world of the
package, as the "The guest contract (WIT)" section of {{RESTACT}} provides for a new capability. A
verb keeps its `invoke` export, and its returned payload is the response body. The interfaces, as
the package carries them:

~~~ wit
interface request {
    use types.{invocation-error};

    /// The method of the request that started this frame, or the
    /// method of the synthetic request every other frame sees.
    method: func() -> string;

    /// The value of a request header field that the verb declared
    /// in `request_headers`, matched case-insensitively; none when
    /// the request does not carry it. An undeclared name is an
    /// error (`invalid-input`) that names `request_headers`.
    header: func(name: string)
        -> result<option<string>, invocation-error>;
}

interface response {
    use types.{invocation-error};

    /// Set the response status. Refused (`invalid-verb-response`)
    /// when the status is outside what this verb may answer.
    set-status: func(status: u16) -> result<_, invocation-error>;

    /// Set a response header field from the allowed set.
    set-header: func(name: string, value: string)
        -> result<_, invocation-error>;

    /// Set the content type, one of the verb's declared types.
    set-content-type: func(value: string)
        -> result<_, invocation-error>;
}

world plugin-http-handler {
    include plugin;
    import request;
    import response;
}
~~~

The other four worlds take the same form, each named for the world it extends with the suffix
`-http-handler`: `plugin-object-http-handler`, `plugin-object-compose-event-http-handler`,
`plugin-object-compose-event-llm-http-handler` and, on a server that advertises
`webhook-connector` ({{RESTACT-CONNECTORS}}), `plugin-object-compose-event-llm-webhook-http-handler`,
the last being the superset. No other world of the package gains a counterpart. An author whose
verb needs another combination builds it against the smallest of the five that includes it, and the component imports only the interfaces it uses. A
verb's descriptor (the "Discovery" section of {{RESTACT}}) lists among its `interfaces` each of
`request` and `response` that it imports, and names as its `world` the `-http-handler` world named
for the world it would name without them, or that world itself when none of the five is named for
it.

A component's imports do not make it an HTTP verb; its deployment does ({{http-deploy}}). A server
MUST refuse, with `400` (`invalid-input`) naming the `http` parameter, the deployment of a component
that imports `request` or `response` without the `http` declaration. A verb in a source-only
language runs in the server's shared runtime component, whose imports do not describe the verb
(the "Verb code: source and executable" section of {{RESTACT}}), so for it the declaration alone
decides, and the server enforces it at the host boundary. Such a verb deployed without the `http`
declaration holds neither interface: its call of any function of `request` or `response`,
including `method()`, ends the invocation, and the server answers `500` (`trap`): the fault is in
the verb's code, not in the request.

**Setters.** Each setter validates its argument when it is called, against the rules of
{{http-response}} that the argument alone decides, and the server validates the assembled response
when the verb returns, against the rules that depend on more than one part of it (a `Location`
with its status, a body with `204`). A later call of a setter replaces the value an earlier call
set. A setter that the server refuses returns an error whose code is `invalid-verb-response`, and
the refusal is sticky: once a setter has been refused, the invocation's outcome is `500`
(`invalid-verb-response`), with a detail that repeats the first refusal, whatever the verb then
sets or returns, unless the invocation ends in a trap or a limit failure, whose outcome is then
that one. A setter called by a frame of a verb that is not an HTTP verb is refused the same way.

**Frames.** Each frame of an invocation tree keeps its own response state. Only the state of the
root frame of a route entry becomes the HTTP response; the outcome of any other frame is used as
{{http-entries}} sets. A verb that returns an `invocation-error`, traps or exceeds a limit
discards what it set, and the server answers as {{RESTACT}} sets for that outcome.

# Deployment parameters {#http-deploy}

A server that advertises `verb-http-handler` and serves the reference deployment profile (the "Verb
declaration (deployment profile)" section of {{RESTACT}}) MUST accept the following query
parameters of `POST /v1/modules`, and MUST provide an equivalent in every deployment interface it
offers:

* `http`: `true` declares the verb an HTTP verb; `false`, or the parameter's absence, declares
  it not one.
* `request_headers`: the request header fields the verb reads, as a comma-separated list of field
  names ({{RFC9110}}, Section 5.1), each matched case-insensitively. At most 16 names, each
  inside the server's ceiling and outside the fixed deny ({{http-request}}). An empty value
  declares none.
* `http_produces`: the media types the verb may set besides its `produces` type, as a
  comma-separated list. Each MUST be exactly one media type, with no comma and no control
  character, and MUST NOT be one that only the server writes ({{http-content-type}}). At most 16
  types.
* `redirects`: the verb's redirect grant ({{http-location}}): `none` (the default),
  `same-origin` or `listed-origins`.
* `verify` and `verify_secret`: webhook verification, under `webhook-verification` only
  ({{http-verify-deploy}}).

A server MUST refuse a deployment, deploying nothing, with `400` (`invalid-input`) and a detail
that names the parameter, when `request_headers`, `http_produces` or `redirects` is present without
`http=true`, when a value breaks the rule above, or when the verb's name is one of the accessor
names that the "Active Properties (Accessor Verbs)" section of {{RESTACT-OBJECTS}} reserves and
`redirects` is other than `none`. A name outside the server's ceiling is refused with the detail
"not in this server's request-header allowlist", the same words wherever that refusal appears; a
name on the fixed deny is refused in the same words, so the refusal does not tell the deployer
which names the server reads identity from. A server MUST also refuse, with `400`
(`invalid-call-graph`), the deployment of an HTTP verb, function or action, whose declared calls
include a call to an action or, on a server that supports the pattern form, a `*:` pattern
({{http-entries}}).

These are declarations of the verb ({{RESTACT}}'s "Verb declaration (deployment profile)"
section): a replacement of the verb's code alone (`PUT …:verb/code`, or a rollback) preserves
them, and a deployment through a profile re-declares them, except `verify` and `verify_secret`,
which {{http-verify-deploy}} keeps.

# Request access {#http-request}

**The ceiling and the deny.** A server MUST keep a **ceiling**: the set of request header field
names that a deployment may declare. Its operator sets it; this document fixes no members of it.
A server MUST also keep a **fixed deny**: names that no deployment may declare and no operator may
add to the ceiling. The fixed deny MUST include at least:

* `Authorization`, `Proxy-Authorization`, `Cookie` and `Cookie2`;
* every header field from which the server reads the caller's identity or the caller's roles,
  groups, scopes or claims, as its configuration names them;
* every header field that the server knows a proxy in front of it injects to carry a credential or
  an identity assertion. (Informative: such fields include `X-Forwarded-Access-Token`,
  `X-Auth-Request-Access-Token`, `X-Pomerium-Jwt-Assertion`, `Cf-Access-Jwt-Assertion`,
  `X-Amzn-Oidc-Accesstoken`, `X-Amzn-Oidc-Data`, `X-Goog-Iap-Jwt-Assertion`,
  `X-Ms-Token-Aad-Access-Token`, `X-Forwarded-Client-Cert` and `X-Client-Cert`.);
* the connection-specific fields ({{RFC9110}}, Section 7.6.1).

A server MUST refuse to start when its operator adds to the ceiling a name on the fixed deny. A
name in the server's own default ceiling that is on the fixed deny is not part of the ceiling. The
ceiling is
the primary control, because no list of names can cover every proxy's credential fields; the fixed
deny is a backstop. A server MUST NOT accept a prefix or a pattern in either: names are exact.

**Which frame sees the request.** Only the root frame of a route entry sees the request: its
`method()` is the request's method, and `header(name)` returns the declared field's value. Every
other frame sees the synthetic request: no header fields (`header(name)` returns none for a
declared name), no query, and a `method()` that is the HTTP method of the request when the frame
is an accessor that a data-plane request dispatched to, and otherwise the method the verb's kind
requires: `GET` for a function and `POST` for an action. The other frames include every composed
call, every lifecycle hook (including one that a write inside an HTTP request fires), every
subscription delivery and scheduled firing, the Model Context Protocol facet's `invoke_verb`
(which invokes a function as `GET` and an action as `POST` would), and every invocation that a
server's own extension mechanisms start. A server MUST derive what a frame sees from the frame
itself, never from state shared by the frames of one request.

**Values.** For a declared name, a server MUST:

* return the value with surrounding whitespace removed;
* combine the field lines of a field whose definition admits a comma-separated list ({{RFC9110}},
  Section 5.3), and refuse the request with `400` (`invalid-input`) when a field that is not a list
  occurs on more than one field line. Every field a registered scheme names ({{http-schemes}}), and
  every field whose definition the server does not know, is not a list. A server that receives
  header fields only after its platform has combined their field lines, as the Fetch API combines
  them with a comma and a space, cannot apply this refusal, and passes such a field's combined
  value; a verb on that server can therefore read the lines of a repeated field joined by `, `.
  Step 4 of {{http-verify-order}} still refuses a repeated field that a scheme names;
* refuse the request with `400` (`invalid-input`) when a value holds a character other than visible
  ASCII, space and horizontal tab, rather than drop it, so a verb never reads "absent" for a field
  the request carried.

`header(name)` for a name the verb did not declare returns an error (`invalid-input`) naming the
`request_headers` parameter, never none.

**A lowered ceiling.** When an operator removes from the ceiling a name that a deployed verb
declared, or the fixed deny comes to include it, a server MUST NOT serve the field as absent. It
answers each route entry of the verb with `501` (`unsupported-feature`) before the verb runs. The
detail names the field and the configuration that removed it, except a field on the fixed deny,
which the detail does not name; the server SHOULD tell its operator which verbs and fields are
affected when it starts. A server SHOULD keep listing such a verb in its discovery document and its
OpenAPI document, with its descriptor unchanged. A client tells that its route entry will answer
`501` by a name in the verb's `httpVerb.requestHeaders` that `service.httpVerbs.requestHeaders`
does not hold ({{http-discovery}}).

**Query.** A verb reads no query parameter through these interfaces. A function's `?input=` is its
input, as for any verb.

**Caching.** A server SHOULD list the declared names in the `Vary` field of a function's response,
in addition to the fields {{RESTACT}} requires there.

# Response control {#http-response}

## Status {#http-status}

A server MUST admit the following statuses from an HTTP verb, which are the **baseline**:

| Verb kind | Baseline |
|---|---|
| function | `200`, `204`, `302` (under a redirect grant), `400`, `403`, `404`, `409`, `410`, `415`, `422` |
| action | `200`, `201`, `202`, `204`, `303` (under a redirect grant), `400`, `403`, `404`, `409`, `410`, `415`, `422` |

A verb whose name is a reserved accessor name (the "Active Properties (Accessor Verbs)" section of
{{RESTACT-OBJECTS}}) has the baseline of its kind with no `3xx` status, `201` only for `create`, and
`204` only for `create`, `update`, `set` and `delete`, whatever entry invoked it.

A server MUST refuse every other status, with `500` (`invalid-verb-response`), unless another
feature token that the server advertises admits the status for the verb. The following statuses
are refused for the reasons given, and a document that defines a token admitting one MUST state how
it answers that reason:

* any `1xx`, and `101` with `Upgrade` above all: a proxy may switch the connection to a tunnel,
  past every check it applies to later requests on it;
* `401` and `407`: a challenge the server did not issue, which can lead a client to drop or
  replace its credential;
* `408`, `421` and `425`: clients repeat the request on their own, which repeats an action;
* `429` and every `5xx`: they claim the server's own quota or failure, and clients back off, retry
  or report a server fault on the verb's word;
* `304` and `412`: they answer a precondition that the server evaluates ({{http-caching}});
* `301`, `307` and `308`: a browser caches `301` and `308` beyond the verb's life, and `307` and
  `308` repeat the method and body at the target with the caller's credential;
* `302` from an action, and `303` from a function: some clients keep `POST` on `302`, so an action
  redirects with `303`, and a function, already a `GET`, with `302`. The refusal's detail says
  which applies;
* `206` and `416`: range responses that the server did not evaluate;
* any value outside `100` to `599`.

A response with status `204` MUST have an empty body; a verb that sets a body with it is refused
(`invalid-verb-response`), and the body is never cut silently. A `202` from a verb never carries
`Location`. A `302` or `303` requires a redirect grant and a `Location` ({{http-location}}).

When no status is set, the status is `200`.

## Response header fields {#http-headers}

A verb MAY set only the following response header fields, each at most once. A server MUST refuse
any other name (`invalid-verb-response`), compared case-insensitively:

* **`Content-Disposition`** ({{RFC6266}}). A server MUST parse the value into a disposition type,
  `inline` or `attachment`, and an optional file name given by `filename` or by `filename*`
  ({{RFC8187}}), and MUST send a value it builds itself from those parts, never the verb's text.
  It MUST refuse any other parameter, and a file name that, decoded, is longer than 255 bytes of
  UTF-8 or holds `/`, `\`, `"`, `%`, a code point of general category Cc, Cf, Cn, Co, Zl or Zp
  ({{UNICODE}}), or one of category Zs other than U+0020. It checks the decoded name, not the
  encoded value. A format character such as U+202E RIGHT-TO-LEFT OVERRIDE can make a download
  dialog show the executable `invoice<U+202E>gpj.exe` as `invoiceexe.jpg`; U+200B, U+FEFF and
  wide spaces can make names that look the same differ or hide an extension. Category Cn, which
  holds the noncharacters, also holds every code point the server's Unicode version leaves
  unassigned, so a server with an older version refuses a character that a newer one would
  classify, never passes it. The rules of the "Security Considerations" section of {{RESTACT}}
  for verb output on the server's origin apply after this field and take precedence, so a
  script-capable type stays `attachment` whatever the verb set.
* **`Cache-Control`**, from a function only, as a comma-separated list of the directives
  `no-store` and `must-revalidate`, which the server adds to its own ({{http-caching}}). A server
  MUST refuse any other directive, and the refusal's detail lists the two allowed directives and
  does not repeat the verb's value.
* **`Content-Language`**, a list of language tags ({{RFC9110}}, Section 8.5).
* **`Location`**, with `201`, `302` or `303` only, under the rules of {{http-location}}.

Only a feature token that a server advertises can admit a further field. A token that admits
further fields MUST NOT admit `Set-Cookie`, `Clear-Site-Data`, `Strict-Transport-Security`,
`Alt-Svc`, `NEL`, `Report-To`, `Reporting-Endpoints`, `Refresh`, `WWW-Authenticate`,
`Proxy-Authenticate`, `Access-Control-*`, `X-Accel-*`, `X-Sendfile`, framing or connection fields
(such as `Content-Length`, `Transfer-Encoding`, `Connection`, `Upgrade` and `Keep-Alive`), or
`Restact-*`.

A field value MUST consist of visible ASCII, space and horizontal tab, with no line folding, and
the fields a verb sets MUST together be at most 8192 bytes, names and values. Any breach is refused
(`invalid-verb-response`). The detail of a refusal names the rule and the field name, and never
repeats a field value.

## The Location field {#http-location}

A `Location` that a verb sets is either a path on the server's origin or, under the
`listed-origins` grant, an absolute URL on an origin the server lists. A server MUST accept a
`Location` only when one of the following holds, and refuse it (`invalid-verb-response`)
otherwise:

1. **A path.** The value matches the `path-absolute` rule of {{RFC3986}}, optionally followed by
   `?` and a query and by `#` and a fragment, each as {{RFC3986}} defines them; its second
   character, when it has one, is not `/`; it holds no `\`, no space or control character, and no
   `%2F` or `%5C` in either case; and it is at most 2048 bytes. The server then resolves it with
   the URL parser of {{WHATWG-URL}} against the request's own origin or, when the server does not
   know its public origin, as behind a proxy that ends TLS, any fixed `https` origin of its
   choosing. It accepts the value only when the result has that origin and its path, as serialized,
   does not begin with `//`. Every such origin gives the same result for a value of this form.
   Browsers remove tab and newline and read `\` as `/` before resolving, so the check of the text
   alone is not enough, and the resolution alone is not enough for clients that do not use that
   parser.
2. **A listed origin.** The verb holds the `listed-origins` grant; the value matches
   `absolute-URI` of {{RFC3986}}, optionally followed by `#` and a fragment, with the scheme
   `https`, an authority and no `userinfo`, and holds no `\`, space or control character and no
   `%2F` or `%5C`; it is at most 2048 bytes; and the origin that
   {{WHATWG-URL}} gives for it equals, as serialized, one of the origins the server's operator
   listed. The list holds origins only, compared exactly, with no pattern.

On a server whose base URL has a path prefix (the "Base URL" section of {{RESTACT}}), a path that
names one of the server's resources includes the prefix. A verb learns the prefix only from its
deployer, since no interface carries it. A verb written for a server without a prefix that answers
`201` with `Location: /orders/1` names, on a server whose base URL is `https://h.example/restact`,
a path outside that server's resources; form 1 still accepts it, because it is on the origin.

A server MUST check the origin of the `Location` value it sends: when it sends a normalized form of
the verb's value, such as one with its dot segments removed, it checks that form. It MUST NOT send a
value that begins with two slashes.

A `302` or `303` needs a grant: `same-origin` admits form 1, and `listed-origins` admits forms 1
and 2. The default grant, `none`, admits no redirect. A `201` admits form 1 under every grant, and
form 2 under `listed-origins`. There is no server-wide switch for redirects; the operator's control
is the list of origins, which is empty unless the operator fills it.

Test vectors. Form 1 values are resolved against `https://h.example`, and the grant "listed" is
`listed-origins` with `https://partner.example` on the operator's list. The last vector passes the
origin check of {{WHATWG-URL}}, which reads `\` as `/`, while some other URL parsers send it to
`evil.example`:

| Location | Grant | Result |
|---|---|---|
| `/a/b` | any | accepted |
| `/a/b?c=d#e` | any | accepted |
| `//evil.example/` | any | refused (second character is `/`) |
| `/.//evil.example/` | any | refused (resolved, its path begins with `//`) |
| `/\evil.example/` | any | refused (`\`) |
| `/%5Cevil.example/` | any | refused (`%5C`) |
| `/%2F%2Fevil.example/` | any | refused (`%2F`) |
| `/` TAB `/evil.example/` | any | refused (control character) |
| `/` LF `/evil.example/` | any | refused (control character) |
| `https:evil.example` | any | refused (not a path; no authority) |
| `javascript:alert(1)` | any | refused |
| `evil.example/x` | any | refused (not `path-absolute`) |
| `https://partner.example/cb` | `same-origin` | refused |
| `https://partner.example/cb` | listed | accepted |
| `https://user@partner.example/cb` | listed | refused (`userinfo`) |
| `https://partner.example\@evil.example/cb` | listed | refused (`\`) |

## Content type and body {#http-content-type}

A verb's content type is its `produces` type unless it sets another. A type it sets MUST be one of
its declared types, the `produces` type and those of `http_produces`, compared by type and subtype
case-insensitively; it MAY carry parameters, such as `charset`. A value that is not exactly one
media type, or holds a control character, is refused (`invalid-verb-response`).

The media types `application/problem+json`, `application/problem+xml` and `text/event-stream` are
the server's: a server MUST refuse to deploy an HTTP verb that declares one of them, so that a
Problem Details document in a response is always the server's refusal. A server's limits on the
size of a verb's output, and every rule of {{RESTACT}} for a verb's output on the server's origin,
apply to an HTTP verb's response unchanged and run after the rules of this document.

## Caching and validators {#http-caching}

A function's response keeps the rules of the "Verb invocation (the bare verb)" section of
{{RESTACT}}: the server marks it `Cache-Control: private` (or `no-store`) and `Vary:
Authorization` ({{RFC9111}}), whatever the verb set, and for an HTTP verb it also marks the
response `no-cache`, so a cache serves it only after the server has validated it for the request
at hand. A directive that a verb sets only adds to the server's own,
and no directive a verb sets is proof that a response is independent of the caller. A server MUST
mark an action's response `Cache-Control: no-store`.

A server emits a validator for a function's response, and evaluates `If-None-Match` and `If-Match`
against it, only when the status is `200`. For any other status it ignores both fields and sends the
verb's response. For a status that is not `2xx` that is the rule of {{RFC9110}}, Section 13.2.1. A
`204` carries no representation for a precondition to compare, so the rule of the "Verb invocation
(the bare verb)" section of {{RESTACT}} for a function that sends no entity tag does not apply to
it, as E12 of the "Extension specifications" section of {{RESTACT}} permits. The validator covers
the body and the values of `Content-Type`, `Content-Language` and `Content-Disposition`, so two
responses with the same body and different header fields never share one. A verb cannot set `ETag`
or `Last-Modified`.

A server that lets cross-origin scripts read response header fields SHOULD expose
`Content-Disposition` and `Location`, and MUST NOT vary the exposed list with the verb.

## The commit predicate {#http-commit}

A status of `400` or more that an HTTP verb sets is an error return of the verb, as the
"Consistency" section of {{RESTACT}} provides. A server MUST handle it as it handles the verb's
return of an `invocation-error`, at every consistency level and on every entry: it discards every
write of the frame that set it and of the frames beneath it, stores no result under an
`Idempotency-Key`, publishes no event the frame published, fires no lifecycle hook for a discarded
write, and releases a webhook replay claim ({{http-replay}}). A server that otherwise keeps a
verb's writes before the verb returns, as the `eventual` and `conditional` levels permit, MUST NOT
do so for an HTTP verb's frame or any frame beneath it. Likewise, a server holds the events that an
HTTP verb's frame publishes until the frame returns, and publishes them, in the order of the calls,
only when the frame's writes commit. It still checks each event when the verb calls `publish` (the
"Publishing events" section of {{RESTACT-EVENTS}}), so the verb learns of a refused event at once.
A server MUST NOT publish such an event across a delivery floor (the "Delivering events to clients
(SSE)" section of {{RESTACT-EVENTS}}) that a change established after the invocation began,
including a change the invocation itself commits; it drops the event instead. A status below `400`
is a successful return, and the frame's writes commit as for any successful return. A verb can
therefore never tell its caller that a request failed while the request's writes persist.

A server that cannot include a conditional write, such as the compare-and-swap of `object-cas`
(the "Object Data Access" section of {{RESTACT-OBJECTS}}), in the commit of an HTTP verb's frame
MUST refuse it in that frame, without writing, rather than commit it before the frame returns.

# Other entries {#http-entries}

**Calls to actions.** In this version an HTTP verb calls functions only, on every server. A server
MUST refuse a call from an HTTP verb's frame to an action at run time with `403`
(`forbidden-side-effect`), as the "Composition" section of {{RESTACT}} requires for a function's
call to an action, and refuses the deployment that declares one ({{http-deploy}}). A function
neither writes nor publishes (the "Verb invocation (the bare verb)" section of {{RESTACT}}), so no
frame beneath an HTTP verb's frame holds a write that could commit before the HTTP verb's status is
known ({{http-commit}}). A later document can lift this refusal, under a feature token of its own,
for a server that holds the writes of a composed action until the frame that called it returns.

**Composition.** A composed call to an HTTP verb returns to the calling verb a success holding the
body when the status is below `400`, and otherwise an `invocation-error` whose code is fixed by the
status and whose message names the status:

| Status | Code |
|---|---|
| `400`, `415`, `422` | `invalid-input` |
| `403` | `forbidden` |
| `404`, `410` | `not-found` |
| `409` | `conflict` |

Response header fields and the content type are not passed to the calling verb. A refusal that the
server raises for the called verb, such as `invalid-verb-response`, reaches the calling verb as the
"Errors" section of {{RESTACT}} sets for a refusal raised in the tree.

**Idempotency.** When a server returns an action's original result for a repeated `Idempotency-Key`
("Verb invocation (the bare verb)" section of {{RESTACT}}), the result of an HTTP verb is its
status, the header fields as the server validated and built them, its content type and its body,
and the verb does not run again. A verify-gated verb takes no `Idempotency-Key` ({{http-replay}}).

**Asynchronous handling.** A server MUST ignore `Prefer: respond-async` ({{RFC7240}}) on an
invocation of an HTTP verb and run it synchronously, as the "Asynchronous Operations" section of
{{RESTACT}} permits. A `202` from such a verb is the verb's own: it never carries `Location`. A
client SHOULD treat a `202` as an asynchronous operation of the server only when it sent `Prefer:
respond-async` and the response carries a `Location`.

**Accessors.** An HTTP verb MAY serve as an accessor verb (the "Active Properties (Accessor Verbs)"
section of {{RESTACT-OBJECTS}}). Under a data-plane request that a server dispatches to it, it sees
the synthetic request with the request's own method, its statuses are those {{http-status}} sets
for its name, and the commit predicate applies.

**Registrations.** An HTTP verb that runs as a lifecycle hook, a subscription delivery or a
scheduled firing (the "Events, Triggers, and Scheduling" section of {{RESTACT-EVENTS}}) sees the
synthetic request. A status of `400` or more is a failure of the firing, with the code that the
composition table gives.

**The Model Context Protocol facet.** On a server that also advertises `mcp-facet`
({{RESTACT-MCP}}), `invoke_verb` of an HTTP verb returns the verb's own response, as E12 of the
"Extension specifications" section of {{RESTACT}} permits. Whatever the status, the result's
structured content is an object that the server writes, never the verb's body in its place:

* `status`, the status, as a number, always present;
* `location`, the `Location` value the server sent, when the response carries one;
* `body`, the verb's body, unchanged, when it has one and its bytes are valid UTF-8: its JSON value
  where the content is JSON, and otherwise the content as text.

A body whose bytes are not valid UTF-8 is never turned into text, and `body` is then absent. The
server carries it, base64-encoded, in a content item of its own after the first: an image content
item for an `image/*` media type, an audio content item for an `audio/*` media type, and otherwise
an embedded resource whose `uri` is the URI of the invoked route. Its `mimeType` is the response's
media type, or `application/octet-stream` when the response has none.

A status below `400` is a successful result, and a status of `400` or more is a tool error. The
result's first content item is text that begins "the verb answered NNN", with NNN the status,
followed by "; Location: " and the value when the response carries one, and for a status of `400`
or more by "; its content follows (the verb's own, not a refusal of the server)"; a body that is
valid UTF-8 follows as text. A body cannot stand in for the status the server reports, and a verb's error never takes
the shape of a refusal of the server. The result's `_meta` also carries the member
`restact/http-response`, an object with `status` and, when the response carries them, `location`
and `contentType`.

# Which rules are fixed {#http-rule-kinds}

Each rule of this document is one of three kinds. A **fixed** rule is the same on every server. A
**portable minimum** sets what every server meets, and a server chooses beyond it. A **reference
default** is how the reference implementation sets a value that this document leaves to the
server; it is informative.

| Rule | Kind | Value |
|---|---|---|
| Status baseline and the refused statuses | fixed | {{http-status}} |
| Response header fields a verb may set, and their parsing | fixed | {{http-headers}} |
| Response header bytes | fixed | at most 8192 |
| `Location` grammar and length | fixed | {{http-location}}; 2048 bytes |
| File name length | fixed | 255 bytes |
| Declared request header names per verb | fixed | at most 16 |
| Declared media types in `http_produces` per verb | fixed | at most 16 |
| The fixed deny | portable minimum | the categories of {{http-request}} |
| The ceiling | server's own | reference default in {{http-reference-defaults}} |
| Redirect origins | server's own | empty by default |
| `private, no-cache` on a function's response; no verb directive as proof of caller independence | fixed | {{http-caching}} |
| Commit predicate and composition table | fixed | {{http-commit}}, {{http-entries}} |
| Timestamp tolerance | fixed | 300 seconds, both directions |
| Key floor | fixed, exact | 16 bytes |
| Replay retention | portable minimum | {{http-replay}} |
| Content a server verifies | server's own | reference default 12 MiB, `413` above it |
| Webhook account size | server's own, always finite | reference default in {{http-reference-defaults}} |

# Discovery {#http-discovery}

A server that advertises `verb-http-handler` MUST carry in its discovery document's `service`
object the member `httpVerbs`, an object with:

* `requestHeaders`: the ceiling, as an array of lowercase field names. It never lists a name on the
  fixed deny;
* `webhookSchemes`: the schemes the server implements, as an array of registered scheme names,
  present only while the server advertises `webhook-verification`.

An HTTP verb's descriptor (the `verb` object of its discovery entry, and its `meta`) MUST carry the
member `httpVerb`, an object with:

* `requestHeaders`: the declared names, lowercase;
* `produces`: every type the verb may set, the `produces` type first;
* `redirects`: the grant;
* `verify`: for a verify-gated verb only, an object whose `scheme` member names the scheme. It
  never names the secret reference.

The companion OpenAPI extension that the "Discovery" section of {{RESTACT}} names carries these
members. A server's OpenAPI document SHOULD describe an HTTP verb's operation with the statuses its
grant and kind admit and with its declared request header fields as header parameters.

A client that offers verbs to a language model as tools SHOULD NOT offer a verify-gated verb, and
SHOULD show it as reachable only by a signed delivery.

Such a client SHOULD likewise not offer, or SHOULD mark as unavailable, an HTTP verb that declares
a request header field the server's `service.httpVerbs.requestHeaders` does not list.

# Codes {#http-codes}

This document defines these codes. Neither is guest-raisable (the "Errors" section of
{{RESTACT}}):

| Code | Status | Covered by | Meaning |
|---|---|---|---|
| `invalid-verb-response` | 500 | `verb-http-handler` | the verb set a status, header field, content type or body that the rules of {{http-response}} refuse, or called a setter while it is not an HTTP verb; the server discarded what it set and its writes |
| `signature-invalid` | 403 | `webhook-verification` | a request to a verify-gated verb's route did not carry a signature that the server verified ({{http-verify-failures}}) |

A webhook delivery also meets `conflict` (`409`) for a duplicate in flight ({{http-replay}}),
`quota` (`429`) for an exhausted webhook account ({{http-webhook-cost}}), `unavailable` (`503`) for
a failure on the receiving side ({{http-verify-failures}}), and, at deployment, the `secret-*`
codes of the "Codes of the mediated call" section of {{RESTACT-CONNECTORS}}.

# Webhook verification (OPTIONAL, feature `webhook-verification`) {#http-webhooks}

A webhook sender calls a URL anonymously and signs what it sends with a key it shares with the
receiver. A verb could check that signature in its own code, but that would put a primitive for
testing guesses at the key inside untrusted code, and every entry other than the route would
bypass the check. Under this feature the server checks the signature before the verb runs, at the
route only, and the verb never holds the key or a way to compute with it.

## Declaring verification {#http-verify-deploy}

A server that advertises `webhook-verification` MUST accept these deployment parameters:

* `verify`: the name of a scheme the server implements ({{http-schemes}}), or `none`;
* `verify_secret`: the path of the secret reference that holds the key, under the secrets mount
  (the "The mediated secrets mount (OPTIONAL, feature `secrets-management`)" section of
  {{RESTACT-CONNECTORS}}).

A server MUST refuse a deployment that sets `verify` to a scheme, deploying nothing, with `400`
(`invalid-input`) and a detail naming the rule, unless all of the following hold. These are
invariants of the verb's record, and a server checks them on every write of it, a write of its
policy (`PUT …:verb/policy`) included:

* the deployment carries `http=true` and `verify_secret`;
* the verb is an action;
* its route is concrete: every segment of its object path is literal, with no pattern;
* its name is not one that the "Grammar" section of {{RESTACT}} or the "Active Properties
  (Accessor Verbs)" section of {{RESTACT-OBJECTS}} reserves, since a request to a route never
  reaches a hook or a dispatched accessor;
* its redirect grant is `none`;
* its `execute` policy admits the anonymous principal, because a sender calls anonymously and the
  signature is its authentication. The refusal's detail says so: "a webhook sender calls
  anonymously; deploy with exec=public (the signature check is its authentication)";
* its owner is not the anonymous principal.

A server MUST also refuse with the code that the "Codes of the mediated call" section of
{{RESTACT-CONNECTORS}} gives for the condition, checking in this order and answering only the first
that applies: a `verify_secret` that is not under the mount (`secret-not-mount`); a reference that
the deployer may not read, or that does not exist, answered alike (`secret-denied`); a reference
whose `verifiers` member does not list the route and the deployer ({{http-verifiers}};
`secret-not-bound`); and, where it can resolve the key at deployment, a key shorter than 16 bytes
(`secret-too-short`). Because `read` is checked before the binding, a deployer learns nothing about
the `verifiers` member of a reference it may not read, or whether such a reference exists.

**Owner only.** The verb's owner is the principal that accepted the cost of its deliveries
({{http-webhook-cost}}). A server MUST therefore refuse with `403` (`forbidden`) a deployment that
sets `verify` on an existing verb, a replacement of a verify-gated verb that keeps `verify`
(through any deployment interface, `PUT …:verb/code`, or a rollback), and a deployment with
`verify=none`, unless the deployer is the verb's owner.

A server records with a verify-gated verb the principal whose deployment last set or kept
`verify`. While the verb's owner is not that principal, as after an operator act that reassigns
the owner (E1 of the "Extension specifications" section of {{RESTACT}}), the server refuses every
delivery at step 5 of {{http-verify-order}} until the owner deploys the verb with `verify` itself,
so the acceptance of the cost never passes to a principal that did not make it.

**Replacement keeps the gate.** A replacement through a deployment profile that omits `verify`
keeps the verb's scheme, its secret reference and its `http` declaration; only `verify=none`
clears them. The server re-checks every invariant above, and the binding, on the record it carries
over, and SHOULD name the declarations it kept in its response. A server MUST refuse with `400`
(`invalid-input`) a deployment with `verify=none` that clears the gate of a verb that runs as its
owner, unless the deployment states `runs_as`. When the deployment states `runs_as=owner` and the
verb's `execute` policy admits the anonymous principal, the server SHOULD warn the deployer that
anyone may now run it as its owner.

**Model completion.** A server MUST withhold the `llm` capability (the "Model Completion
(OPTIONAL, feature `llm-connector`)" section of {{RESTACT-CONNECTORS}}) from a verify-gated verb
unless the deployment grants it with `llm=allow`, and SHOULD warn the deployer that the spend
policy is then everyone who can make the provider send a signed delivery. A server MAY refuse, with
`400` (`invalid-input`) naming `llm`, a deployment that grants `llm=allow` to a verify-gated verb,
and a deployment that sets `verify` on a verb that holds that grant.

**Webhook delivery.** In the same way, a server MUST withhold the `webhook` capability (the "Webhook
Delivery (OPTIONAL, feature `webhook-connector`)" section of {{RESTACT-CONNECTORS}}) from a
verify-gated verb unless the deployment grants it with `webhook=allow`, and SHOULD warn the deployer
that anyone who can make the provider send a signed delivery can then cause the verb's outbound
deliveries. A server MAY refuse such a grant, and the setting of `verify` on a verb that holds it,
as for `llm`.

**Shared secrets.** When the reference's `verifiers` member lists more than one route, a server
MUST warn the deployer in its response to the deployment that a delivery signed with that secret is
accepted once at each listed route, so a delivery captured at one route can run once at another,
and that one secret per route avoids this. A server whose response to a deployment is a JSON object
SHOULD carry each warning as a string in its member `warnings`, an array.

## The verifiers member {#http-verifiers}

A secret reference under the mount carries the routes allowed to verify with it in its member
`verifiers`, a string holding the JSON {{RFC8259}} text of an array of objects, each with the
members `route`, the verb's route written as its discovery entry writes it, and `owner`, the
subject of the principal that deploys it. The reference's owner writes it under the reference's
own policy, like its `connectors` member. A server compares both members byte for byte, with no
normalization, and treats a member that does not parse as listing nothing.

Because only the verb's owner deploys or replaces a verify-gated verb ({{http-verify-deploy}}),
`owner` names the verb's owner. An entry for a route therefore binds the secret to that route only
while the same principal owns the verb there: a verb that another principal later deploys at the
route does not inherit the binding.

## Verifying a delivery {#http-verify-order}

For a request to a verify-gated verb, a server MUST take these steps, in this order, before the
verb runs. Each step's failure ends the request with the answer given.

1. **Size.** The content is no larger than the server verifies; otherwise `413`
   (`payload-too-large`). The server reads the whole content before step 6 and never passes a
   verb content it has not verified.
2. **Route.** The request's target is the verb's own route: the object path the request names is
   the path the verb is defined at, and does not reach the verb by inheritance (the "Verb
   Resolution and Inheritance" section of {{RESTACT}}), since no scheme signs the target. Otherwise
   `403` (`forbidden`) with the detail "this verb accepts only signed deliveries at its own route".
3. **Authorization.** The server authenticates the request and evaluates the verb's `execute`
   policy against the real caller, as for any invocation.
4. **Header fields.** First, every field the scheme names is present (`missing-header`); then each
   is on exactly one field line and has the form the scheme gives (`malformed-header`); then the
   timestamp, where the scheme has one, is within 300 seconds of the server's clock in either
   direction (`stale-timestamp`, `future-timestamp`). Otherwise `403` (`signature-invalid`) with
   the first reason that applies ({{http-verify-failures}}). A server that receives header fields
   only after its platform has combined their field lines, as the Fetch API combines them with a
   comma and a space, treats a field the scheme names as on more than one field line when its
   value, before surrounding whitespace is removed, contains a comma followed by a space. No
   registered scheme's field holds that sequence on one line.
5. **Key.** The verb's owner is the principal that accepted its deliveries
   ({{http-verify-deploy}}), the reference is under the mount, its `verifiers` member lists the
   route and the verb's owner, the verb's owner may read the reference, the key resolves, and it
   is at least 16 bytes. The server evaluates the reference's `read` for the owner as an
   attenuated principal (the "Authorization policy" section of {{RESTACT}}): its subject alone,
   with no roles, groups, scopes or claims, and a `deny` rule keyed on a dropped attribute still
   applying as that section requires. Every server reaches the same answer this way, including one
   that authenticates principals per request and so knows the owner's attributes only while the
   owner is the caller. An owner whose `read` comes only through a role or group grants it to its
   subject.
   A server checks the listing and the owner's `read` on every delivery, so revoking either stops
   deliveries at once. Otherwise `503` (`unavailable`), the same answer for every one of these
   conditions.
6. **Signature.** The server computes HMAC-SHA256 ({{RFC2104}}, {{RFC6234}}) with the key over the
   scheme's signed content, decodes each candidate signature in the header field, and compares the
   decoded bytes with the computed MAC in constant time over their full length. Otherwise `403`
   (`signature-invalid`), "does not match".
7. **Replay.** The server claims the delivery ({{http-replay}}).
8. **Cost.** The verb owner's webhook account admits the delivery ({{http-webhook-cost}});
   otherwise `429` (`quota`), and the server releases the claim.
9. **Invocation.** The verb runs as the root of a verified delivery.

A server MUST NOT compute with the key in any way except step 6, and MUST NOT let the key or any
value derived from it reach a verb, a response, a log or an audit record. It MUST compare decoded
bytes, never header text. Steps 1 to 8 do not depend on the executor that runs the verb, so a
server that runs verbs in more than one way verifies identically for each. A server reads the
fields a scheme names from the request whatever its ceiling and fixed deny hold ({{http-request}});
those govern only what a verb may read, so a ceiling without a scheme's fields neither disables
verification nor lets a verb read them.

## Scheme rules {#http-schemes}

Every scheme of this version is HMAC-SHA256 over content that includes the request's content as
received, byte for byte. A **timestamp** is the decimal number of seconds since 1970-01-01T00:00:00Z
without leap seconds, written with ASCII digits only, at most 19 of them. A **hex MAC** is exactly 64
lowercase hexadecimal digits. Unless a scheme says otherwise, the key is the reference's value as
stored, as bytes.

`github` {{GITHUB-WEBHOOKS}}:
: The field `X-Hub-Signature-256` holds `sha256=` followed by a hex MAC. The signed content is the
  request's content. The scheme has no timestamp.

`stripe` {{STRIPE-WEBHOOKS}}:
: The field `Stripe-Signature` holds elements separated by `,`, each a key, `=` and a value, split
  at the first `=`. An element without `=`, a field with no element `t` or with more than one, and
  a field with no element `v1` are malformed. The value of `t` is a timestamp. An element whose key
  is not `t` or `v1`, a `v0` element included, is ignored. A `v1` value is a candidate signature;
  one that is not a hex MAC never matches, and the delivery verifies when any candidate matches.
  The signed content is the value of `t` as received, `.`, and the request's content.

`slack` {{SLACK-SIGNING}}:
: The field `X-Slack-Request-Timestamp` holds a timestamp, and `X-Slack-Signature` holds `v0=`
  followed by a hex MAC. The signed content is `v0:`, the timestamp as received, `:`, and the
  request's content.

`standard-webhooks` {{STANDARD-WEBHOOKS}}:
: The field `webhook-timestamp` holds a timestamp; `webhook-id` holds the message identifier; and
  `webhook-signature` holds entries separated by single spaces, each a version, `,`, and a
  signature. An entry whose version is not `v1`, an empty entry included, is ignored, and a field
  with no `v1` entry is malformed. A `v1` signature is the padded base64 encoding ({{RFC4648}},
  Section 4) of 32 bytes; one in any other form never matches. The signed content is the
  `webhook-id` value, `.`, the timestamp as received, `.`, and the request's content. The
  reference's value is `whsec_` followed by the base64 encoding ({{RFC4648}}, Section 4) of the
  key, or that encoding alone, and the key is the decoded bytes; a value that does not decode is
  handled as a key below the floor. The fields `svix-id`, `svix-timestamp` and `svix-signature`
  are not read.

**The key floor.** A server MUST refuse a key shorter than 16 bytes, and MUST NOT refuse a longer
one for its length, so a key that verifies on one server verifies on all.

**Registry.** Every scheme is an entry of the REST:ACT Webhook Schemes registry ({{http-iana}}). A
server MUST NOT accept a `verify` value that names no entry it implements.

## Replay {#http-replay}

A delivery's identity is the verb's route, the reference path and the MAC that the server
computed in step 6, never a header field the scheme does not sign. The route is the verb's route as
defined, not the text of the request target. A server MUST NOT run an accepted delivery a second
time while it retains its identity, and MUST retain it at least:

* for a scheme with a timestamp, until the delivery's timestamp is more than 300 seconds in the
  past, after which step 4 refuses the delivery; a server on more than one node retains it until
  step 4 would refuse it on every node, allowing for the difference between their clocks;
* for `github`, for 72 hours after the server accepted it.

A server MAY retain an identity longer. A server that runs on more than one node over shared
storage MUST share these identities among its nodes, and a server MUST keep them across a restart
and across an operator reset (the "Operator Reset (OPTIONAL, feature `admin-reset`)" section of
{{RESTACT}}), since a reset discards the verbs but not the secrets or the senders that sign with
them.

**Claims.** A server claims a delivery's identity before the verb runs. While the first delivery is
in flight, a server MUST answer a second with the same identity at once with `409` (`conflict`),
without waiting for the first. When the first delivery's invocation commits, the claim becomes an
accepted delivery, and a server answers a later delivery with that identity with `200`, an empty
body and the header field `Restact-Webhook-Replay: 1`, without running the verb. When the first
delivery's outcome is an error return, a status of `400` or more included ({{http-commit}}), a
refusal of the server, or a request that ended before the verb began to run, the server releases
the claim, so the sender can deliver it again. A server MUST NOT release a claim while the verb may
still commit, or when it cannot tell whether the verb committed. A claim that a server cannot
release, because the process holding it ended, MAY lapse, but not while the first delivery could
still be running.

**Capacity.** When a server cannot record another identity, for the route's owner or at all, it
MUST answer `503` (`unavailable`) and MUST NOT discard an identity it is required to retain.

**Anti-replay, not deduplication.** A sender whose scheme signs a timestamp signs again with a new
timestamp when it retries, and some senders send the same event more than once by design, so a
delivery's identity does not identify the event it carries. A verb that must act once per event
deduplicates on the event identifier inside the content. A sender that redelivers the same signed
content, as `github` does, presents the same identity, so the server answers it as a replay unless
the first delivery was released.

**Idempotency-Key.** A server MUST ignore `Idempotency-Key` on a request to a verify-gated verb;
the replay guard is its deduplication.

The header field `Restact-Webhook-Replay` is this document's, and the "Extension specifications"
section of {{RESTACT}} reserves it: a server MUST NOT emit it unless it advertises
`webhook-verification`, and a verb cannot set it ({{http-headers}}).

## The entry gate {#http-entry-gate}

A server MUST run a verify-gated verb only as the root frame of a verified delivery. Every other
entry is refused before the verb runs: a composed call, a lifecycle hook, a subscription delivery,
a scheduled firing, accessor dispatch, and every invocation that a server's own extension
mechanisms start, each with `403` (`forbidden`) and the detail "this verb accepts only signed
deliveries at its own route". The Model Context Protocol facet's `invoke_verb` answers as the HTTP
request it stands for would, which carries no signature, so it is refused at step 4 at the latest:
`403` (`signature-invalid`), reason `missing-header`, unless an earlier step refuses it first. A server MAY refuse at deployment a declared call, and at registration a
subscription or schedule, that names a verify-gated verb; that refusal is an aid to the deployer,
not the control.

## Cost of a delivery {#http-webhook-cost}

The compute cost of a verified delivery's invocation, and of the call tree beneath it, is
attributed to the webhook account of the verb's owner, the extension point E13 of the "Extension
specifications" section of {{RESTACT}}. The owner accepted the cost by its own deployment of the
verb with `verify`, and {{http-verify-deploy}} requires every deployment and replacement that sets
or keeps `verify` to be the owner's own. The cost is what the invocation and the call tree beneath
it consume while they run: execution, composed calls, outbound calls, log output, concurrent
invocations, and the bytes of content they store. A count of objects that a server keeps per owner
is not part of it: an object that the delivery creates counts for its own `$owner`.

A server MUST keep one webhook account for each principal that owns a verify-gated verb, shared by
all of that principal's verify-gated verbs. It MUST NOT attribute a delivery's cost to the caller,
to the anonymous principal, to an account per route, or to the account that the owner's own
requests draw on. A webhook account is not a principal: no credential authenticates as it, and no
request, policy or registration names it. A server MUST bound each webhook account with finite
limits separate from those of the owner's own account, so that a delivery's own call tree cannot
exhaust the quota that the owner's own requests draw on. The bound is finite on every server,
including one that sets no limit on any principal's own account; its size is the server's choice.
A `429` for an exhausted webhook account says so in its detail.

A reaction that a delivery's writes or events cause, such as a lifecycle hook or a subscription
delivery, is a separate invocation, and its cost is attributed as {{RESTACT-EVENTS}} sets, to its
registrant. A reaction that the verb's owner registered therefore draws on the owner's own account.

Besides the attribution of cost, this document only narrows the delivery's authority, relaxing
nothing of the "Execution identity" section of {{RESTACT}}: a server MUST run a verified delivery
with the authority that section sets for the anonymous caller, which is the owner's when the verb
runs as its owner, even when the request also carries a valid credential. The server still
authenticates that credential, and evaluates the verb's `execute` policy against the principal it
authenticates.

## Failures and audit {#http-verify-failures}

**On the wire.** A server answers a delivery that step 4 or step 6 refuses with `403`
(`signature-invalid`), with no `WWW-Authenticate` field, since no registered authentication scheme
describes a webhook signature. Its detail is "this route accepts only signed deliveries" followed by
one reason: `missing-header`, `malformed-header`, `stale-timestamp` or `future-timestamp` for step
4, the first that applies, or "does not match" for step 6. Those reasons describe only the request,
which the sender wrote. A failure on the receiving side (step 5) is `503` (`unavailable`) with the
same detail for every condition, so an anonymous sender does not learn whether a reference exists,
who may read it, or how long its key is.

**Audit.** A server SHOULD record every refusal of a delivery with the route, the scheme and exactly
one reason from this closed set, and never the signature, the key, the key's length or the
content:

| Reason | Meaning |
|---|---|
| `too-large` | the content is larger than the server verifies (step 1) |
| `wrong-route` | the request reached the verb other than at its own route (step 2) |
| `missing-header` | a field the scheme names is absent |
| `malformed-header` | a field is present more than once or does not have the scheme's form |
| `stale-timestamp` | the timestamp is more than 300 seconds in the past |
| `future-timestamp` | the timestamp is more than 300 seconds in the future |
| `mismatch` | no candidate signature matches |
| `not-bound` | the reference's `verifiers` member does not list the route and the verb's owner, or the reference is not under the mount |
| `secret-denied` | the verb's owner may not read the reference |
| `secret-unavailable` | the key did not resolve |
| `key-too-short` | the key is shorter than 16 bytes |
| `owner-changed` | the verb's owner is not the principal that accepted its deliveries |
| `replay` | the delivery was accepted before |
| `in-flight` | a delivery with the same identity is running |
| `guard-full` | the server cannot record another identity |
| `quota` | the owner's webhook account did not admit the delivery (step 8) |
| `rate-limited` | the server limited work it does for deliveries, such as refreshing a key after a mismatch, without refusing a delivery whose signature verifies against the key the server holds |

## Handshakes {#http-handshakes}

Some senders confirm an endpoint by asking the receiver to compute a value with the key over
content the sender chooses. A server MUST NOT compute with a verification key over content that it
has not received signed by that key, since that would make the key a signing key for whoever can
start the handshake. Standard Webhooks endpoint verification and the like are therefore not
supported by this version. A handshake whose request arrives signed, such as Slack's
`url_verification`, is an ordinary delivery: the verb receives it and answers the challenge.

# Security Considerations {#http-security}

The considerations of {{RESTACT}} apply. This section names the risks this document's rules
answer, and the ones it leaves.

* **Header fields that a proxy acts on.** Some front proxies act on response header fields from
  the server behind them: an internal redirect, a file read on the proxy's host, a dropped header.
  A server cannot know which fields its operator's proxy honors, which is why the fields a verb may
  set are a closed list of four and a custom `x-` field is never one of them.
* **Connection takeover.** A `101` or other `1xx` status from a backend can make a proxy turn the
  connection into a tunnel, and later requests on it then pass none of the proxy's checks,
  including the removal of a client's copy of an identity header. No verb sets a `1xx` status.
* **Origin-wide, lasting state.** `Set-Cookie`, `Clear-Site-Data`, `Strict-Transport-Security`,
  `Alt-Svc`, `NEL` and the reporting fields change a browser's state for the whole origin, or a
  registrable domain, beyond the response. No verb sets them.
* **Redirects.** `307` and `308` repeat a request's method and body at another URL with the
  caller's credential, which runs a write the caller never chose, outside the redirecting verb's
  declared calls and budget; a `302` keeps the method of a `PUT` or `DELETE` in many clients.
  Hence the per-kind redirect statuses, no `3xx` from accessors, and the `Location` rules. Every
  redirect a deployment can produce is visible in its descriptor's grant. A client that attaches a
  credential to a request SHOULD NOT follow a redirect from a verb's response to another origin.
  A verb that answers `text/html` can still move a browser with markup when the server's content
  policy for verb output allows it; the policy of the "Security Considerations" section of
  {{RESTACT}} that admits no script reduces that.
* **Credentials that proxies inject.** A proxy that authenticates users often forwards the user's
  access token or identity assertion in a header field. A verb able to read that field could carry
  the token to its author. The operator's ceiling, not a list of names, is what keeps such fields
  out of reach; the fixed deny catches the ones a server knows.
* **Verification oracles.** A verb that could test a MAC under a key, or a handshake that MACs
  sender-chosen content, would turn the right to use a key into a way to learn or use it. Neither
  exists here, and the failures that depend on the receiver's configuration share one answer.
  The `503` for those failures still shows a sender that the route's binding is broken.
* **Replay.** GitHub's delivery identifier is not signed, and GitHub signs no timestamp, so the
  server keys replay on signed material and keeps a `github` delivery for 72 hours. GitHub keeps
  the identifier and the signed content the same when it redelivers, so a redelivery of an accepted
  delivery is answered as a replay. A delivery captured at one route can run once at each other
  route whose `verifiers` lists the same secret, which is why a deployment that creates that
  situation is warned. A server that lost its record of deliveries on a restart would accept every
  one of them again, which is why {{http-replay}} requires the record to survive a restart.
* **Released deliveries.** A delivery that the verb answers with `400` or more, or on which it
  traps or exceeds a limit, is released so that its sender can deliver it again, unless the server
  cannot tell whether the verb committed. Anyone holding a copy can then deliver it again, without
  limit while its timestamp is within the window, and at any time for `github`, which has none, and
  every run is charged to the owner's webhook account. The account bounds that spend. A verb SHOULD
  answer a delivery it has decided not to act on with a `2xx` status, and keep `4xx` for one
  it wants the sender to retry.
* **Work before verification.** A server reads, and computes a MAC over, up to the whole content it
  verifies before it knows that a delivery is genuine, so an anonymous sender can make it hash that
  much for each request. The bound is the size of content the server verifies, which a server keeps
  no larger than its limit on request content, and every check that needs no key, such as the
  presence, form and age of the signature fields, comes first. A server does not refuse a delivery
  to save that work, since a flood would then refuse genuine deliveries too; an operator who needs
  a tighter bound sets the verified size lower or limits request rates in front of the server.
* **The route is unsigned.** No registered scheme signs the target URL, so a verify-gated verb
  runs only at the exact path it is defined at, and never as a composed call, hook, firing or
  accessor.
* **Content from senders.** A delivery's content comes from a third party, and anyone who can make
  the provider send one, for example by opening an issue on a public repository, controls part of
  it. A verb that passes it to a language model passes text aimed at the model, which is why
  model completion is withheld from a verify-gated verb unless granted. The detail of a verb's
  `4xx` response is the verb's text; a client presents it as the verb's, never as the server's.
* **Cost.** The same people can make a provider send deliveries, and so spend the owner's compute.
  The webhook account bounds, per owner and on every server, what deliveries' own call trees
  spend, and keeps it off the owner's own quota. A hook or subscription that the owner registers
  on what a receiver writes or publishes is billed to the owner's own account, at the rate the
  senders choose.
* **A failure after writes.** A verb that answered `4xx` after writing would tell its caller that
  nothing happened while its writes persisted; the commit predicate discards them.
* **Caching across users.** A `max-age` on a private response can be served to another user of the
  same browser profile without a request reaching the server, where identity travels in a cookie
  or a proxy-injected field. A verb cannot set one.
* **File names.** A verb can offer a download under any name on the server's origin, such as
  `setup.exe`. The server builds the field itself and the hardening of {{RESTACT}} keeps
  script-capable types as downloads, but the name is the verb's.
* **Size.** A server that verifies less content than a provider may send refuses those deliveries
  with `413`; GitHub, for example, sends up to 25 MB.

# IANA Considerations {#http-iana}

This document requests the following registrations in registries that {{RESTACT}} creates, and one
new registry.

* In the "REST:ACT Feature Tokens" registry: `verb-http-handler` ({{http-features}}) and
  `webhook-verification` ({{http-webhooks}}).
* In the "REST:ACT Capability Interfaces" registry: `rest-act:plugin/request` and
  `rest-act:plugin/response` ({{http-guest}}), both under `verb-http-handler`.
* In the "REST:ACT Error Codes" registry: the codes of {{http-codes}}, neither guest-raisable. The
  entries for `secret-not-mount`, `secret-not-bound`, `secret-denied` and `secret-too-short` that
  {{RESTACT-CONNECTORS}} registers also list `webhook-verification`.

**The REST:ACT Webhook Schemes registry.** This document creates the "REST:ACT Webhook Schemes"
registry, with the registration policy Specification Required {{RFC8126}}. A provider's own
published documentation of its signing method meets that policy. Each entry gives:

* the scheme's name, lower-kebab-case, permanent, and never reused for a different method;
* a citation of the provider's specification, pinned to a version or commit;
* the signed content, the header fields and the grammar of each,
  including the case of hexadecimal digits and the handling of unknown keys and entries;
* whether the scheme carries a timestamp; every scheme with one uses the fixed tolerance of 300
  seconds in both directions;
* the minimum retention of a delivery's identity ({{http-replay}});
* the key's encoding and, as information only, the key sizes the provider issues;
* test vectors, with their source and licence; a vector computed for the entry rather than
  published by the provider says so;
* how the scheme's handshakes, if any, are handled ({{http-handshakes}});
* a status and a reference.

A name that only an existing registration elsewhere would explain is avoided: the IANA "HTTP
Signature Algorithms" registry of {{RFC9421}} already holds `hmac-sha256`, so a scheme is named
after the method it describes, not after its primitive. The initial entries are `github`,
`stripe`, `slack` and `standard-webhooks` ({{http-schemes}}), in `registries/webhook-schemes.md`.

--- back

# Reference-host defaults (informative) {#http-reference-defaults}

The reference implementation gives its operator four settings for these features:

* a switch for HTTP verbs, and with them webhook verification. Off, the server advertises neither
  token and treats stored HTTP verbs as {{http-features}} requires;
* a switch that turns webhook verification alone off;
* names to add to the ceiling;
* the origins of the `listed-origins` grant.

Each switch accepts only a recognized boolean, and the server refuses to start on any other value.
The default ceiling is `accept`, `accept-language`, `content-type`, `x-hub-signature-256`,
`x-github-event`, `x-github-delivery`, `x-github-hook-id`, `stripe-signature`,
`x-slack-signature`, `x-slack-request-timestamp`, `x-slack-retry-num`, `webhook-id`,
`webhook-timestamp` and `webhook-signature`. `user-agent`, the forwarding fields and `referer`
are left out: no use of this version needs them, the first is a fingerprinting surface, the
forwarding fields are spoofable unless a proxy overwrites them, and `referer` can carry a token
from the previous page. The fixed deny includes the proxy fields listed in {{http-request}}.

The server verifies at most 12 MiB of content. It keeps a delivery's identity until the delivery's
signed timestamp is 360 seconds old, the minimum plus a minute for the difference between a node's
clock and its store's, and a `github` delivery's for 72 hours from acceptance. It offers webhook
verification only over a store that survives a restart, and not over its in-memory store. It sizes
each limit of a webhook account as the owner's own where the operator sets
that limit, so an owner's total compute is at most twice its own limit, and otherwise as a finite
default of its own, over the operator's quota window or else a day: 65536 calls, and
13107200000000 units of fuel, 65536 times the default budget of one invocation, so the count of
calls binds first. Storage and outbound calls take no default of their own; each delivery's own
limits, times the calls the account admits, bound them. Its JavaScript and Python runners let a
script's `handle` function return `{status, headers, body}`, which the runner applies through the
setters.
