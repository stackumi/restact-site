# REST:ACT Source Languages registry

A verb has a **source representation** (in some programming language) and an **executable
representation** (a WebAssembly component). This registry maps the source media type supplied on
`PUT …:verb/code` (via `Content-Type`) to its handling requirements (draft §Verb code,
[ADR-0010](https://github.com/stackumi/restactd/blob/main/spec/decisions/0010-language-agnostic-via-mime.md)). The `x-restact-verb.sourceMediaType`
field references this registry.

- Registration policy: **Specification Required** (see [`README.md`](README.md)).
- A server MUST be able to produce and execute the **`application/wasm`** representation. Support
  for any other source language is **OPTIONAL** and advertised via discovery; a server that does
  not support a supplied language MUST return `415`.
- A non-`application/wasm` language is handled one of two ways, both keeping the executable a
  WebAssembly component that targets a frozen `rest-act:plugin@0.1.0` world:
  - **compiled/transpiled** to a WebAssembly component at upload time, storing both
    representations (the component MUST target `plugin` / `plugin-compose` / `plugin-object` /
    `plugin-object-compose`); or
  - **interpreted by a host-provided runtime** that itself targets a frozen
    `rest-act:plugin@0.1.0` world — the server stores only the source representation and runs it
    through a shared interpreter component at invoke time (no per-upload compilation). The reference
    host interprets `text/javascript` this way ([ADR-0024](https://github.com/stackumi/restactd/blob/main/spec/decisions/0024-js-scripting-embed-interpret.md)).
- **Intrinsics are part of the registration.** A server advertising a source language MUST provide
  that language's **standard intrinsics** — its built-in objects, standard library, and dynamic
  code-evaluation facility — with their ordinary language semantics, for whichever edition of the
  language the server's runtime implements. Confinement comes from **withholding host capability
  interfaces and enforcing resource limits**, never from removing or stubbing language intrinsics: a
  verb that cannot reach outside the sandbox can do no more harm through dynamic evaluation than
  through the same code written inline, and dynamically produced code is metered and bounded exactly
  as its enclosing verb is. A server that does restrict intrinsics MUST NOT advertise the language,
  because a verb author has no other channel through which to discover the restriction. Which
  edition of a language a runtime implements is server-defined and SHOULD be documented.

## Registered languages

| Media type | Handling | Support | Status | Reference |
|---|---|---|---|---|
| `application/wasm` | Executed directly; the canonical executable representation. | **REQUIRED** | provisional | draft §Verb code |
| `text/javascript` | Stored as the source representation and **interpreted** at invoke time by the host's embedded QuickJS runner — a shared component targeting a frozen `rest-act:plugin@0.1.0` world; no per-upload compilation ([ADR-0024](https://github.com/stackumi/restactd/blob/main/spec/decisions/0024-js-scripting-embed-interpret.md)). Per the intrinsics rule above, an advertising server provides the ECMAScript standard intrinsics with ordinary ECMAScript semantics, **including `eval` and the `Function` constructor** — so a verb may evaluate source it computes or reads from object data, under its own fuel, memory and wall-clock limits and reaching no capability its own grants do not carry. The implemented ECMAScript edition is server-defined. | OPTIONAL | provisional | draft §Verb code |
| `text/x-python` | Stored as the source representation and **interpreted** at invoke time by the host's embedded monty runner — a shared component targeting a frozen `rest-act:plugin@0.1.0` world; no per-upload compilation ([ADR-0025](https://github.com/stackumi/restactd/blob/main/spec/decisions/0025-python-scripting-tier-monty.md)). | OPTIONAL | provisional | draft §Verb code |
| `text/x-rust` | Tier-1 guest SDK language. **Server-side compilation is DEFERRED** — the reference does not accept `text/x-rust` *source* at upload; the SDK compiles a Rust verb to a `wasm32-wasip2` component **client-side**, uploaded as `application/wasm`. | OPTIONAL | reserved | [`sdk/`](https://github.com/stackumi/restactd/tree/main/sdk) |

## Notes

- The executable representation is always a WebAssembly component, so capability confinement and
  resource limits apply identically regardless of source language.
- Memory-unsafe source languages (e.g. C/C++ compiled to WebAssembly) do not gain memory safety
  within the verb's own linear memory; see draft §Security Considerations.
- There is no IANA-registered `text/python`; `text/x-python` follows the same `x-` convention as the
  registry's `text/x-rust` entry.
