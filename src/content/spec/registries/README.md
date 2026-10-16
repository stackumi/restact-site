# REST:ACT registries

The IANA-style registries requested by the Internet-Draft's IANA Considerations
([`../draft-byrd-restact-protocol-00.md`](../draft-byrd-restact-protocol-00.md) §IANA). They are
maintained here in the repository ahead of any formal IANA action; on publication these tables
become the initial contents of the corresponding IANA registries.

| Registry | File | Referenced by |
|---|---|---|
| REST:ACT Verb Property Names | [`verb-property-names.md`](verb-property-names.md) | draft §Verb properties; `x-restact-verb.properties` |
| REST:ACT Capability Interfaces | [`capability-interfaces.md`](capability-interfaces.md) | draft §Capability Model; `x-restact-verb.capabilities.interfaces`; the frozen `wit/world.wit` |
| REST:ACT Source Languages | [`source-languages.md`](source-languages.md) | draft §Verb code; `x-restact-verb.sourceMediaType` |
| REST:ACT UI Catalog Node Types | [`ui-catalog-nodes.md`](ui-catalog-nodes.md) | [`../presentation-verbs.md`](../presentation-verbs.md); `application/vnd.restact.ui+json` documents |
| REST:ACT LLM Providers | [`llm-providers.md`](llm-providers.md) | [ADR-0095](https://github.com/stackumi/restactd/blob/main/spec/decisions/0095-typed-connectors-llm.md); a `kind:"llm"` connector object's `provider` member (accepted 2026-09-02) |
| REST:ACT Feature Tokens | [`feature-tokens.md`](feature-tokens.md) | draft §Conformance, §Discovery; `service.features`; the `featureToken` enum in [`openapi/x-restact-extension.schema.json`](https://github.com/stackumi/restactd/blob/main/openapi/x-restact-extension.schema.json) |

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
