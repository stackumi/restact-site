# REST:ACT Verb Property Names registry

A *verb property* is a facet of a verb addressed as `/{object}:{verb}/{property}` and operated on
with ordinary HTTP methods (draft §Verb properties, [ADR-0006](https://github.com/stackumi/restactd/blob/main/spec/decisions/0006-verbs-are-objects-with-properties.md)).
Because a verb is itself an object, these are the named, HTTP-addressable parts of its program and
metadata. This registry reserves the well-known property names.

- Registration policy: **Specification Required** (see [`README.md`](README.md)).
- Conventions: names are `lower-kebab-case`. Support is **OPTIONAL and per-property**: a server MAY
  expose none, some, all, or additional properties, and MAY restrict the methods on a property (for
  example, accept `PUT …/code` but never serve `GET …/code`). A client discovers what is supported
  via `OPTIONS` and the discovery document, never by assumption.
- User-defined verb properties are permitted but MUST NOT reuse a registered name for a different
  purpose.

## Registered names

| Name | Typical methods | Governing action(s) | Description | Status | Reference |
|---|---|---|---|---|---|
| `code` | `GET`, `PUT`, `DELETE` | `read-code` (`GET`), `write-code` (`PUT`), `manage` (`DELETE`) | The verb's program. `PUT` sets it (the `Content-Type` declares the source language); `GET` returns a representation selected by `Accept` (source or the `application/wasm` executable). `DELETE` removes the verb on that object — deletion is registration lifecycle, not content, so it is governed by `manage` (owner-only) rather than `write-code`: `write-code` grants CONTENT replacement (a redeploy grant), never the right to remove or recreate the registration itself (ADR-0060). | provisional | draft §Verb code; draft §Verb declaration (deployment profile) |
| `policy` | `GET`, `PUT` | `read`, `manage` | The authorization policy governing the verb (canonical rules or the simple MOO-style profile). | provisional | draft §Authorization |
| `meta` | `GET` | `read` | The per-verb authoritative declaration record: kind (function/action), binding, declared capabilities and call graph, applicable limits, accepted source languages, and consistency requirement. Field-for-field the `x-restact-verb` descriptor. | provisional | draft §Discovery; [`openapi/`](https://github.com/stackumi/restactd/tree/main/openapi) |
| `props` | `GET`, `PUT` | `read`, `write` | The declared **data properties** on the verb's object (the Declared Data Properties feature): each `name` with its `scope` (`instance`/`shared`), `final` flag, and `acl`. The reference host's submission surface for the `data-properties` feature; a server MAY instead derive declarations from an object schema. | provisional | draft §Declared Data Properties |
| `history` | `GET` | `write` | Deployment history (the `verb-history` feature): the verb's current hash triple (`sha256`/`source_sha256`/`source_media_type`), `owner`, `deployed_by`, first-deployed and code-deployed timestamps, and a bounded newest-first ring of superseded versions — never blob bytes. Gated on `write` (not `read`): anyone entitled to replace the code may see its lineage; an execute-only principal may not. | provisional | draft §Verb properties (deployment history); [ADR-0089](https://github.com/stackumi/restactd/blob/main/spec/decisions/0089-verb-deployment-history.md) |
| `rollback` | `POST` | `write` | Roll the verb's code back to a prior deployment (the `verb-history` feature), named by an expected echo of its full hash triple — a stale echo (no longer in the ring) refuses, 409-class. A wasm verb rebinds the prior blob; a source-language verb re-runs source-deploy against the CURRENT runner for its media type. Gated exactly like a code replacement (`write`, with the same owner-only refusal on a `runs-as-owner`- or invoker-granted registration); never changes `owner` or `policy`. | provisional | draft §Verb properties (deployment history); [ADR-0089](https://github.com/stackumi/restactd/blob/main/spec/decisions/0089-verb-deployment-history.md) |

## Notes

- `meta` is the per-verb counterpart of the service-level `/.well-known/restact` document and the
  `$verbs` representation field links into it.
- Verb **names** (the `:verb` token itself) are governed separately: application verb names follow
  AIP-136, the data-method names `get`/`list`/`create`/`update`/`set`/`delete` are reserved as
  accessors (draft §Active Properties), and names beginning with `on` are reserved as lifecycle
  hooks (draft §Events). Those are not verb-*property* names and are not registered here.
