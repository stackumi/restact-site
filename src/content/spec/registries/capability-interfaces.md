# REST:ACT Capability Interfaces registry

A *capability interface* is a host interface a verb's WebAssembly component may import. A verb has
**no ambient authority**: any interface it does not import is unreachable (draft §Capability Model,
[ADR-0009](https://github.com/stackumi/restactd/blob/main/spec/decisions/0009-layered-capability-interfaces.md)). This registry names the standard
interfaces; on upload a server MUST reject a component importing an interface it does not permit
(`403`, `restact_code=disallowed-import`).

- Registration policy: **Specification Required** (see [`README.md`](README.md)).
- Identifiers are WIT interface ids of the form `namespace:package/interface` with an OPTIONAL
  `@major.minor.patch` version suffix.
- The interfaces in the frozen [`wit/world.wit`](https://github.com/stackumi/restactd/blob/main/wit/world.wit) (`rest-act:plugin@0.1.0`)
  are the normative source for the v1 entries below; the `x-restact-verb.capabilities.interfaces`
  field references this registry.

## Registered interfaces (v1)

| Interface | World | Authority granted | Status | Reference |
|---|---|---|---|---|
| `rest-act:plugin/host` | `plugin`, `plugin-compose` | Structured logging (`log`) only. The minimal ambient capability granted to every verb. | provisional | `wit/world.wit`; draft §Capability Model |
| `rest-act:plugin/compose` | `plugin-compose`, `plugin-object-compose` | Invoke another verb (`invoke`). **Gated**: linked only for components targeting a compose world, and enforced at runtime against the declared call graph, shared budget, depth/fan-out/cycle bounds, and authority attenuation (draft §Composition). | provisional | `wit/world.wit`; draft §Composition |
| `rest-act:plugin/object` | `plugin-object`, `plugin-object-compose` | Object-graph data access: read (`get`) / write (`set`) the bound object's declared data properties, read another object's by path (`get-at`), **write another object's by path (`set-at` — cross-object write-policy intersection)**, **conditionally write a property by compare-and-swap (`set-at-if` — write iff the property's current committed value equals an expected value, atomic under the object write lock, `precondition-failed` on mismatch; ADR-0061, feature `object-cas`)**, **introspect an object's shape (`shape`/`shape-at`: readable properties + readable direct children + invokable verbs)**, and **read a PAGE of objects under a path prefix (`query` — ordered, optionally equality-filtered, ACL-filtered, keyset-paginated, with a host-enforced per-call page cap; ADR-0071, feature `verb-object-query`)**, and **learn the CONCRETE path of the object it is bound to (`path` — the invoked object, never the deployed route pattern; `none` for an `unbound` verb; a pure read, so `function` verbs may call it; ADR-0080, feature `object-self-path`)** — ACL- and scope-aware (`instance`/`shared`, `final`). **Gated**: linked only for components targeting an object world, enforced at runtime against the per-property ACL (vs. the runs-as-caller principal) and capability attenuation (ADR-0023, ADR-0033, ADR-0061, ADR-0071, ADR-0080). | provisional | `wit/object.wit`; draft §Object Data Access |
| `rest-act:plugin/identity` | `plugin-identity`, `plugin-object`, `plugin-object-compose` | Read-only view of the runs-as-caller principal: `subject`, `is-anonymous`, `roles`, `scopes`, `claim(name)`. **Ambient** (like `host`): linked with no grant, no attenuation, and no ACL — it reveals no authority the verb does not already hold, since it runs *as* this caller (ADR-0027). Imported per-verb, so it still appears in the manifest. | provisional | `wit/identity.wit`; draft §Caller Identity |
| `rest-act:plugin/types` | all | No functions; shared type definitions (`payload`, `invocation-error`, `log-level`). Not authority-granting. | provisional | `wit/world.wit` |

## Reserved / planned

The following interfaces are reserved for later versions and are added here as separate,
individually-gated interfaces so that a verb's imported set remains an exact, auditable capability
manifest. A reserved interface is **not yet** part of `rest-act:plugin@0.1.0`; when one ships it is
added **additively within** the same frozen package (the `object`/`identity`/`event` idiom —
`world.wit` byte-unchanged, a new `*.wit` file and new worlds), and its row moves to the table above.

| Interface (planned) | Intended authority | Status |
|---|---|---|
| `rest-act:plugin/object` — *binary values* | `set-at` (arbitrary-path writes; cross-object write-policy intersection) and `shape`/`shape-at` (enumerate children/properties/verbs) **shipped** (provisional, above; ADR-0033). Remaining reserved: binary (non-UTF-8) property values — new `*-bytes` methods + a binary storage encoding (ADR-0023/ADR-0033). | reserved |
| `rest-act:plugin/event` | Publish events to a topic (`publish(topic, name, data)`), gated; SSE delivery + lifecycle hooks consume them. **Shipped** (provisional; ADR-0039, feature `event-subscriptions`). Reserved within the interface: a guest-readable subscription/schedule binding API. | provisional |
| `rest-act:plugin/kv` | Scoped key-value storage. | reserved |
| `rest-act:plugin/egress` | **Re-dispositioned as a framework name, not an interface** ([ADR-0095](https://github.com/stackumi/restactd/blob/main/spec/decisions/0095-typed-connectors-llm.md) D1, accepted 2026-09-02): no interface named `egress` will ship, and verb-callable allow-listed raw HTTP is withdrawn as a planned authority. The name now denotes the *typed-connector framework* — a family of individually gated interfaces (one per kind of outside thing), each executed by the host through a governed connector object with `read` as the use-grant, the ADR-0094 egress rules, a host-known purity class, and a metering tier. A framework name, not a linkable interface — it never leaves this table. First member: `rest-act:plugin/llm` below. | reserved |
| `rest-act:plugin/llm` | One bounded, synchronous, text-only model completion (`complete`) through a `kind:"llm"` connector object named by path, carrying its own explicit `$policy` (`read` in that list is the use-grant; an inherited tier never is). **Gated** like `compose`/`object`/`event`; **effectful** (actions only; deploy refuses a `function` importing it); host-capped per invocation tree; the wire protocol is a registered, versioned `provider` row ([`llm-providers.md`](llm-providers.md)); credential spliced host-side in the server process only (ADR-0094, never guest-visible; refused under process isolation in v1); reserve-then-reconcile against the connector's budget root as the budget's owner through the ordinary policy gate. **Shipped** (provisional; [ADR-0095](https://github.com/stackumi/restactd/blob/main/spec/decisions/0095-typed-connectors-llm.md), accepted 2026-09-02; feature `llm-connector`). | provisional |

> Implementation note: the reference host's upload allow-list (`ALLOWED_IMPORT_PREFIXES` in
> [`host/src/wasm_exec.rs`](https://github.com/stackumi/restactd/blob/main/host/src/wasm_exec.rs)) permits `rest-act:plugin/` plus the authority-free WASI interfaces Rust's
> std pulls in (linked but populated empty). Authority-granting WASI interfaces (`wasi:sockets`,
> `wasi:http`, real `wasi:filesystem`) are absent, so a component importing them is rejected.
