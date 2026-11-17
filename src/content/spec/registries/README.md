# REST:ACT registries

The IANA-style registries requested in the IANA Considerations of the protocol draft
([`../draft-byrd-restact-protocol-00.md`](../draft-byrd-restact-protocol-00.md) §IANA Considerations) and of REST:ACT
Presentation Verbs ([`../draft-byrd-restact-presentation-00.md`](../draft-byrd-restact-presentation-00.md)
§IANA Considerations), which requests the UI Catalog Node Types registry, and of REST:ACT Connectors
([`../draft-byrd-restact-connectors-00.md`](../draft-byrd-restact-connectors-00.md) §IANA
Considerations), which requests the LLM Providers registry, and of REST:ACT HTTP Verbs
([`../draft-byrd-restact-http-verbs-00.md`](../draft-byrd-restact-http-verbs-00.md) §IANA
Considerations), which requests the Webhook Schemes registry. REST:ACT Objects and Data
([`../draft-byrd-restact-objects-00.md`](../draft-byrd-restact-objects-00.md) §IANA Considerations)
requests no registry of its own and registers its values in these, as do REST:ACT Events
([`../draft-byrd-restact-events-00.md`](../draft-byrd-restact-events-00.md) §IANA Considerations) and the
REST:ACT Model Context Protocol Facet
([`../draft-byrd-restact-mcp-00.md`](../draft-byrd-restact-mcp-00.md) §IANA Considerations). They are maintained here
in the repository ahead of any formal IANA action; on publication these tables become the initial
contents of the corresponding IANA registries.

| Registry | File | Referenced by |
|---|---|---|
| REST:ACT Verb Property Names | [`verb-property-names.md`](verb-property-names.md) | draft §Verb properties; `x-restact-verb.properties` |
| REST:ACT Capability Interfaces | [`capability-interfaces.md`](capability-interfaces.md) | draft §Capability Model; `x-restact-verb.capabilities.interfaces`; the `wit/` package |
| REST:ACT Source Languages | [`source-languages.md`](source-languages.md) | draft §Verb code; `x-restact-verb.sourceMediaType` |
| REST:ACT UI Catalog Node Types | [`ui-catalog-nodes.md`](ui-catalog-nodes.md) | [`../draft-byrd-restact-presentation-00.md`](../draft-byrd-restact-presentation-00.md); `application/vnd.restact.ui+json` documents |
| REST:ACT LLM Providers | [`llm-providers.md`](llm-providers.md) | [draft-byrd-restact-connectors-00](../draft-byrd-restact-connectors-00.md) §IANA Considerations; [ADR-0095](https://github.com/stackumi/restactd/blob/main/spec/decisions/0095-typed-connectors-llm.md); a `kind:"llm"` connector object's `provider` member |
| REST:ACT Webhook Schemes | [`webhook-schemes.md`](webhook-schemes.md) | [draft-byrd-restact-http-verbs-00](../draft-byrd-restact-http-verbs-00.md) §IANA Considerations; the `verify` deployment parameter |
| REST:ACT Feature Tokens | [`feature-tokens.md`](feature-tokens.md) | draft §Conformance and Feature Discovery, §Discovery; `service.features`; the `featureToken` enum in [`openapi/x-restact-extension.schema.json`](https://github.com/stackumi/restactd/blob/main/openapi/x-restact-extension.schema.json) |

## Registration policy

All registries use **Specification Required** ([RFC 8126](https://www.rfc-editor.org/info/rfc8126)):
a registration must reference a stable, publicly available specification reviewed by a designated
expert. Until the protocol is published, the change controller is the REST:ACT project; entries are
added by pull request against these files with the reviewing rationale recorded in the PR.

Each entry carries at minimum a **name**, a **status**, a one-line **description**, and a
**reference**. Both statuses are draft-era states, distinguished by whether the entry is in service:
**`provisional`** = defined and implemented by the reference host; **`reserved`** = the name is held
by a specification but not in service (a planned interface, a deferred language, a superseded
token). On publication the surviving entries become the initial IANA registry contents. User-defined names
outside a registry are permitted where the spec allows them, but MUST NOT reuse a registered name
for a different purpose.

## The Reference cell

Where a registry table has a Reference column, its cell names the document that defines the entry
first. An entry that the core protocol draft defines is cited as `draft §<Heading>`. An entry that
another draft defines links that draft under its docname, as in
`[draft-byrd-restact-presentation-00](../draft-byrd-restact-presentation-00.md) §IANA Considerations`,
or links the draft alone where no one section defines the entry. `<Heading>` is the heading of the
defining section, written in full or shortened to the heading without a trailing parenthetical, or
to the text before its first colon or comma. For example, `draft §Verb code` cites the section
"Verb code: source and executable", and `draft §Deployment history and rollback` cites "Deployment
history and rollback (OPTIONAL, feature `verb-history`)". Two sections of one document are written
`draft §A, §B`. Any ADR that records the decision behind the entry follows, after a semicolon.
A row whose defining section is not written yet cites `none yet (stackumi/restact#<issue>)` in its
place, naming the issue that tracks the section.

A registry file here also holds the entries that extensions register into it, so one table lists
every value, whichever document defines it; the REST:ACT Error Codes registry has no file yet, and
each draft lists the codes it registers.
`.github/scripts/check-xrefs.py` resolves each `§` citation against the drafts' headings. It
fails when one matches no heading or more than one, or when a Reference cell cites no draft section.
