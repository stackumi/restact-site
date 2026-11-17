---
title: "REST:ACT Model Context Protocol Facet"
abbrev: "REST:ACT MCP Facet"
docname: draft-byrd-restact-mcp-00
category: exp
submissiontype: independent
ipr: trust200902
area: "Applications"
keyword:
  - REST
  - WebAssembly
  - capability security
  - Model Context Protocol
  - agents
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
  MCP:
    title: "Model Context Protocol Specification, Revision 2025-06-18"
    date: 2025-06-18
    target: https://modelcontextprotocol.io/specification/2025-06-18
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

--- abstract

This document specifies an optional extension to REST:ACT, the protocol for invoking sandboxed
verbs over HTTP. It defines the MCP facet: a fixed set of four Model Context Protocol tools through
which an MCP client invokes a verb, lists the verbs available to it, and lists and reads objects.
Each tool has the outcome of the equivalent HTTP request made by the same principal. A server
advertises the facet with the `mcp-facet` feature token.

--- middle

# Introduction {#mcp-introduction}

A program that speaks the Model Context Protocol {{MCP}}, such as an agent, calls tools that a
server lists for it. REST:ACT {{RESTACT}} already gives a server verbs to invoke and objects to
read, each governed by policy. This document defines one fixed way to offer them to an MCP client,
so that such a client reaches any server that advertises the `mcp-facet` feature token with the
same four tools, under the authority its credential has over HTTP.

The decision record for this document is
[ADR-0093](https://github.com/stackumi/restactd/blob/main/spec/decisions/0093-remote-mcp-facet.md)
in the reference implementation.

## Relationship to REST:ACT {#mcp-relationship}

This document is a REST:ACT extension, as described in the "Extension specifications" section of
{{RESTACT}}. Its server requirements bind only a server that advertises `mcp-facet`. A requirement
that also names a feature or mechanism of another document, such as the refusal of a path-scoped
sub-token, binds a server that this document binds when that server also offers that feature or
mechanism. A client does not assume any behavior of this document from a server that does not
advertise its token.

This document uses one of the extension points that section names, E11: {{mcp-facet}} answers a
refusal at `/mcp` in an MCP message, a tool error that carries the Problem Details object or a
JSON-RPC error, where {{RESTACT}} requires an HTTP status and a Problem Details response. It
relaxes no other requirement of {{RESTACT}}. For a cross-origin `POST` to `/mcp`, {{mcp-facet}}
makes mandatory a refusal that {{RESTACT}} recommends.

{{RESTACT}} reserves the path `/mcp` for this endpoint, on every server.

{::boilerplate bcp14-tagged}

# Model Context Protocol Facet (OPTIONAL, feature `mcp-facet`) {#mcp-facet}

A server MAY expose its verbs and objects to Model Context Protocol {{MCP}} clients through a fixed
set of tools. A server that does so advertises the `mcp-facet` feature token and serves the MCP
Streamable HTTP transport at `/mcp`, under the same base URL as the rest of its interface
(the "Base URL" section of {{RESTACT}}). It MUST NOT
negotiate a revision earlier than the one {{MCP}} specifies, the first with structured tool results;
which later revisions it offers is its choice. The token adds no member to the discovery document.
The facet is another way to reach the interface {{RESTACT}} defines, as the OpenAPI document of
the "Discovery" section of {{RESTACT}} is another way to describe it, and grants no authority of its own. {{RESTACT}}
requires a server that serves the endpoint to advertise the token and forbids any other use of
`/mcp`, so a server on which the facet is off answers requests to `/mcp` as for a path it does not
serve.

**Requests.** The facet sends no server-initiated messages, so a server answers `GET /mcp` with
`405`. A server MUST authenticate each `tools/call` request on its own, as it does an HTTP request
(the "Authorization and Identity" section of {{RESTACT}}), and run the call as the resulting principal; the anonymous principal is treated as on
the HTTP interface. A server MUST NOT carry an authentication or authorization decision from one
request to another, and SHOULD keep no session state between requests. Because the tool list does
not depend on the caller, a server MAY answer `initialize` and `tools/list` without authenticating
them. A server MUST refuse a call whose credential fails verification, with a tool error carrying a
`401` problem or with an HTTP `401` response. It MUST refuse, for every tool, a credential that
carries less than its principal's full authority, such as the path-scoped and delegated tokens of
{{RESTACT-DELEGATION}}, with a tool error carrying a `403` problem.

**Tools.** `tools/list` MUST return these four tools, the same for every caller and connection. Each
tool's input schema admits only the members listed for it.

* `invoke_verb` takes `route`, the route of one verb with every path segment concrete
  (`<object path>:<verb>`, the object path empty for an unbound verb, never a `{id}` pattern), and
  an optional object `input`. The server resolves the route as for an HTTP invocation
  (the "Verb Resolution and Inheritance" section of {{RESTACT}}) and invokes a function as `GET` and an action as `POST` would, with `input` as
  the verb's input.
* `list_verbs` takes no arguments and returns `{"verbs": [...]}`: the `verbs` array of the caller's
  discovery document (the "Discovery" section of {{RESTACT}}).
* `list_objects` takes an optional `prefix`, `pageSize` and `pageToken`. On a server that
  advertises the `object-listing` feature it returns the object listing `GET /v1` would return the
  caller, limited to objects whose path begins with `prefix`; a page MAY hold fewer entries than
  `pageSize`, or none, while a `nextPageToken` remains. On a server that does not, it answers with
  a tool error carrying a `501` (`unsupported-feature`) problem. (Informative: the listing is the
  "Object collection listing" section of {{RESTACT-OBJECTS}}.)
* `get_object` takes `path` and returns the object's stored representation (the "Representations" section of {{RESTACT}}),
  as a `GET` of its path served from storage would. It runs no verb. (Informative: an accessor verb
  of {{RESTACT-OBJECTS}} is reached through `invoke_verb`.)

A server MUST NOT list a tool per verb or per route. Further tools, such as tools that write object
data or deploy verbs, and other MCP features such as resources and prompts, come only with a
feature token of their own.

**Parity.** Each tool's outcome MUST be that of the equivalent HTTP request made by the same
principal: the same policies decide it and the same quotas are charged. A successful result whose
content is JSON is returned as the tool's structured content where the negotiated revision admits
that value there, and other content whose bytes are valid UTF-8 as text. Content whose bytes are not
valid UTF-8 is never turned into text: it is returned base64-encoded, as an image content item for an
`image/*` media type, an audio content item for an `audio/*` media type, and otherwise an embedded
resource whose `uri` is the URI of the equivalent HTTP request. Its `mimeType` is the response's media
type, or `application/octet-stream` when the response has none. A server MAY return content of a media
type that is not textual the same way when its bytes are valid UTF-8. A refusal is a tool error (`isError` true) whose
structured content is the Problem Details object (the "Errors" section of {{RESTACT}}) that the HTTP request would have
received. A verb's own response that an advertised extension admits at E12 of the "Extension
specifications" section of {{RESTACT}} is returned as that extension sets. A server MAY refuse
arguments that do not match a tool's input schema, with a tool error
carrying a `400` (`invalid-input`) problem or with the JSON-RPC invalid-parameters error. A server
MUST NOT rewrite a verb's output.

**Origin.** A server MUST refuse with `403` (`forbidden`) a cross-origin `POST` to `/mcp`
(the "Security Considerations" section of {{RESTACT}}) unless its origin is one the server names as allowed, or the server allows every
origin and the request is one a browser sends only after a successful preflight. It SHOULD refuse
any other cross-origin request to `/mcp` the same way, and SHOULD refuse a request whose `Host` it
does not recognize.

# Security Considerations {#mcp-security}

The facet authenticates every call on its own and carries no
decision from one request to the next, so a credential that stops verifying stops working at the
next call. Without its origin rule, any web page a user opens could call tools on a server that
admits callers without a credential, such as one on the user's own machine. Verb output, object
values and the descriptors `list_verbs` returns are written by other principals, possibly by an
attacker who uploaded a verb, and can carry text aimed at a model. A fixed tool list keeps that
text out of tool names and descriptions, which a client shows its model as instructions; a tool
per verb or route would put it there. A client SHOULD treat every tool result as untrusted data.

The security considerations of {{RESTACT}} apply.

# IANA Considerations {#mcp-iana}

This document requests one registration in a registry that {{RESTACT}} creates: `mcp-facet`
({{mcp-facet}}) in the "REST:ACT Feature Tokens" registry.
