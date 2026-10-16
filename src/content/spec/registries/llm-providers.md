# REST:ACT LLM Providers registry

A typed `rest-act:plugin/llm` connector ([ADR-0095](https://github.com/stackumi/restactd/blob/main/spec/decisions/0095-typed-connectors-llm.md))
names the wire protocol the host speaks to its destination through a **registered, versioned
`provider` identifier**. The host implements each registered row as a fixed adapter — request
serialization from the interface's `completion-request`, response parsing into `completion`, usage
extraction for Tier-2 metering, and `stop-reason` normalization — and the verb never sees the wire.
This registry exists so that vendor wire formats, which change under a fixed marketing name, are
bound into the standard only as **pinned, versioned shapes**: a changed wire shape is a new row,
never an edit to an existing one.

- Registration policy: **Specification Required** (see [`README.md`](README.md)).
- Identifiers are `<provider-family>/v<n>`: a lower-kebab-case family name and a registry-assigned
  integer version. The version is the **registry's**, not the vendor's — the vendor's own API-version
  marker is pinned *inside* the row.
- **Registration rule.** A new row, or a new `/v<n>` of an existing family, is a pull request
  against this file carrying: (1) a citation of the vendor's published wire specification at the
  pinned API version; (2) the request path under the connector's `destination`; (3) the
  authentication slot the mediated credential splices into (a header name; never a URL component —
  ADR-0094 D4.4); (4) the mapping from the response's usage block to `input-tokens` /
  `output-tokens` / `cache-read-tokens`; (5) the mapping from the vendor's stop reason to the
  interface's normalized `end` / `max-tokens` / `stop-sequence` / `other`. No ADR is required for a
  row; the ADR owns the interface, the registry owns the wires.
- **Permanence.** An identifier MUST NOT be reused for a different wire shape. A host MAY retire its
  adapter for a registered row (refusing connectors that name it with `llm-provider-unsupported`);
  the row stays registered so the name is never reassigned.
- Status follows the sibling registries: **`provisional`** = defined and implemented by the
  reference host; **`reserved`** = registered by a specification, not yet implemented.

## Registered providers

| Provider | Wire shape (pinned) | Request path | Credential slot | Usage mapping | Stop-reason mapping | Status | Reference |
|---|---|---|---|---|---|---|---|
| `anthropic-messages/v1` | The Anthropic Messages API, request header `anthropic-version: 2023-06-01`; request body `{model, system?, messages[{role, content}], max_tokens, temperature?}`; response body `{content[{type:"text", text}], model, stop_reason, usage}`. Text content blocks only; any non-text block in a response is dropped from `text` and noted as a truncation. | `POST /v1/messages` (under the connector's `pathPrefixes[0]` when present) | `x-api-key` header | `usage.input_tokens` → `input-tokens`; `usage.output_tokens` → `output-tokens`; `usage.cache_read_input_tokens` (absent ⇒ 0) → `cache-read-tokens` | `end_turn` → `end`; `max_tokens` → `max-tokens`; `stop_sequence` → `stop-sequence`; anything else → `other` | provisional | [ADR-0095](https://github.com/stackumi/restactd/blob/main/spec/decisions/0095-typed-connectors-llm.md) D3 |

## Notes

- **Absence is meaningful.** A connector naming an unregistered or unversioned `provider` is refused
  at call time (`egress-connector-invalid`); a host never guesses a wire shape from a family name.
- **The expected second registration** is an OpenAI-compatible chat-completions row (it covers the
  widest set of gateways); it is deliberately not pre-registered here — it lands as its own
  registration PR with the five items above.
