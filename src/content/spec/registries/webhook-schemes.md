# REST:ACT Webhook Schemes registry

A verb deployed with `verify=<scheme>` (REST:ACT HTTP Verbs,
[`../draft-byrd-restact-http-verbs-00.md`](../draft-byrd-restact-http-verbs-00.md) §Webhook
verification) runs only for a request whose signature the server verified, before the verb ran,
under the named scheme and a key from the secrets mount. A scheme fixes the header fields the
server reads, the content it signs, the grammar of each field and the key's encoding, so a key and
a delivery that verify on one server verify on every server that implements the scheme. The
verb never holds the key and never computes with it.

- Registration policy: **Specification Required** (see [`README.md`](README.md)). A provider's own
  published documentation of its signing method meets the policy.
- Names are lower-kebab-case and name the method a scheme describes, usually after its provider.
  A name that another registry already uses for a primitive is avoided: the IANA HTTP Signature
  Algorithms registry of RFC 9421 holds `hmac-sha256`, so no scheme takes that name.
- **Registration rule.** A new row is a pull request against this file carrying: (1) a citation of
  the provider's specification pinned to a version or commit; (2) the signed content; (3) the header
  fields with the grammar of each, including
  the case of hexadecimal digits and the handling of unknown keys or entries; (4) whether the
  scheme carries a timestamp (every scheme that does uses the fixed tolerance of 300 seconds in
  both directions); (5) the minimum retention of a delivery's identity for replay protection;
  (6) the key's encoding and, as information only, the key sizes the provider issues; (7) test
  vectors with their source and licence, a vector computed for the row rather than published by the
  provider marked as such; (8) how the scheme's handshakes, if any, are handled. Every scheme of
  this version is HMAC-SHA256 compared as decoded bytes in constant time; a scheme with another
  primitive needs a revision of the draft, not only a row.
- **Permanence.** A name MUST NOT be reused for a different method. A changed signing method is a
  new row. A server MAY decline to implement a registered scheme, and then refuses `verify` naming
  it; the row stays registered so the name is never reassigned.
- Status follows the sibling registries: **`provisional`** = defined and implemented by the
  reference host; **`reserved`** = registered by a specification, not yet implemented.

## Registered schemes

| Scheme | Provider specification (pinned) | Signed content | Header grammar | Tolerance | Retention | Key size (informative) | Test vectors (source, licence) | Handshakes | Status | Reference |
|---|---|---|---|---|---|---|---|---|---|---|
| `github` | [GitHub Docs, "Validating webhook deliveries"](https://github.com/github/docs/blob/44442041dd7fe7047d74f324744ffaf4dd8f7946/content/webhooks/using-webhooks/validating-webhook-deliveries.md) at commit `44442041` | the request content | `X-Hub-Signature-256: sha256=<64 lowercase hex>` | none: the scheme signs no timestamp | 72 hours from first acceptance | any; the key is the stored value as bytes | key `It's a Secret to Everybody`, content `Hello, World!`, expected `sha256=757107ea0eb2509fc211221cce984b8a37570b6d7586c22c46f4379c8b043e17` (GitHub Docs, CC-BY-4.0) | none | reserved | [draft-byrd-restact-http-verbs-00](../draft-byrd-restact-http-verbs-00.md) §Scheme rules |
| `stripe` | [Stripe documentation, webhook signatures](https://web.archive.org/web/20261027051205/https://docs.stripe.com/webhooks) (archived 2026-10-27); signing behaviour as in [stripe-node `src/Webhooks.ts`](https://github.com/stripe/stripe-node/blob/6d5ed967d602224ac3056dc3f0befbb55487ee50/src/Webhooks.ts) at commit `6d5ed967` | `t` value as received, `.`, the request content | `Stripe-Signature`: `,`-separated `key=value` elements, split at the first `=`; exactly one `t` (timestamp); at least one `v1`; any `v1` may match, and one that is not 64 lowercase hex never matches; other keys, `v0` included, ignored; an element without `=` is malformed | 300 s, both directions | until `t` + 300 s | Stripe issues `whsec_`-prefixed secrets; the key is the stored value as bytes, prefix included | no fixed published vector. Generated for this registry with the algorithm of stripe-node's `generateTestHeaderString`: key `whsec_test_secret_0123`, `t=1614265330`, content `{"id":"evt_1"}`, expected `v1=70251bb3b7e9c02f5c90b83339e0d0a46a6c42dffa55bf643a3d8678c99400cb` (generated, CC BY 4.0) | none | reserved | [draft-byrd-restact-http-verbs-00](../draft-byrd-restact-http-verbs-00.md) §Scheme rules |
| `slack` | [Slack Developer Docs, "Verifying requests from Slack"](https://web.archive.org/web/20261006064553/https://docs.slack.dev/authentication/verifying-requests-from-slack/) (archived 2026-10-06); behaviour as in [python-slack-sdk `slack_sdk/signature/__init__.py`](https://github.com/slackapi/python-slack-sdk/blob/37ffb82dca7b02f6d589de468f364707613238e4/slack_sdk/signature/__init__.py) at commit `37ffb82d` | `v0:`, the timestamp as received, `:`, the request content | `X-Slack-Request-Timestamp: <decimal seconds>`, then `X-Slack-Signature: v0=<64 lowercase hex>` | 300 s, both directions | until the timestamp + 300 s | 32-character signing secret; the key is the stored value as bytes | key `8f742231b10e8888abcd99yyyzzz85a5`, timestamp `1531420618`, content `token=xyzz0WbapA4vBCDEFasx0q6G&team_id=T1DC2JH3J&team_domain=testteamnow&channel_id=G8PSS9T3V&channel_name=foobar&user_id=U2CERLKJA&user_name=roadrunner&command=%2Fwebhook-collect&text=&response_url=https%3A%2F%2Fhooks.slack.com%2Fcommands%2FT1DC2JH3J%2F397700885554%2F96rGlfmibIGlgcZRskXaIFfN&trigger_id=398738663015.47445629121.803a0bc887a14d10d2c447fce8b6703c`, expected `v0=a2114d57b48eac39b9ad189dd8316235a7b4a8d21a10bd27519666489c69b503` (the docs carry no open licence; the same values are in python-slack-sdk's tests, MIT) | `url_verification` arrives signed and is passed to the verb, which answers the challenge | reserved | [draft-byrd-restact-http-verbs-00](../draft-byrd-restact-http-verbs-00.md) §Scheme rules |
| `standard-webhooks` | [Standard Webhooks specification](https://github.com/standard-webhooks/standard-webhooks/blob/ab6844147ce9cdb0d2dbf2e60d1ea85001fd2554/spec/standard-webhooks.md) at commit `ab684414` | `webhook-id` value, `.`, the timestamp as received, `.`, the request content | `webhook-timestamp: <decimal seconds>`, `webhook-id: <message id>`, then `webhook-signature`: entries separated by single spaces, each `<version>,<signature>`; an entry without `,`, a bare `v1` included, and an entry of another version are ignored; no `v1` entry is malformed; a `v1` signature that is not padded base64 of 32 bytes never matches. The `svix-*` fields are not read | 300 s, both directions | until the timestamp + 300 s | the stored value is `whsec_` plus padded base64 (RFC 4648 §4), or that base64 alone, and the key is the decoded bytes; the specification issues 24 to 64 bytes | key `whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw`, id `msg_p5jXN8AQM9LWM0D4loKWxJek`, timestamp `1614265330`, content `{"test": 2432232314}`, expected `v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=` (Standard Webhooks library tests, MIT) | endpoint verification is not supported: it would MAC content the sender chose | reserved | [draft-byrd-restact-http-verbs-00](../draft-byrd-restact-http-verbs-00.md) §Scheme rules |

## Grammar test vectors

These vectors fix how a server reads each scheme's header fields where the draft states a rule
that two readings could split on. They were computed for this registry, not published by the
providers (CC BY 4.0, as the rest of this repository). Each uses its row's key, content and other
fields unless it says otherwise, with a server clock equal to the row's timestamp, or 1614265330
for `github`. A result is the reason the draft's "Failures and audit" section records, the first
that applies; "verifies" means the signature matches.

| Scheme | Input | Result |
|---|---|---|
| `github` | no `X-Hub-Signature-256` field, with `X-Hub-Signature: sha1=abc` present | `missing-header` |
| `github` | `sha256=` followed by the row's hex in uppercase, or by its first 63 digits, or `SHA256=` followed by the row's hex | `malformed-header` |
| `github` | `X-Hub-Signature-256` on two field lines, each holding the row's value | `malformed-header` |
| `github` | the row's delivery again, within 72 hours after the first was accepted | `replay`: `200` with `Restact-Webhook-Replay: 1`, and the verb does not run |
| `slack` | `X-Slack-Request-Timestamp: not-a-number`, and no `X-Slack-Signature` | `missing-header` |
| `slack` | `X-Slack-Request-Timestamp: 12ab` with the row's signature | `malformed-header` |
| `slack` | `X-Slack-Signature: v0=` followed by the row's hex in uppercase | `malformed-header` |
| `slack` | a timestamp of `+1531420618`, `-1`, `1.5`, or twenty digits (`00000000000000000000`) | `malformed-header` |
| `slack` | a timestamp of nineteen nines (`9999999999999999999`) | `future-timestamp` |
| `slack` | the row's fields with the clock at 1531420918, 300 seconds after the timestamp | verifies |
| `slack` | the row's fields with the clock at 1531420919, or at 1531420317 | `stale-timestamp`, or `future-timestamp` |
| `slack` | a timestamp of `1531420619` with the row's signature | `mismatch` |
| `stripe` | `t=1614265330,v1=<the row's hex>,` (an empty element after the last comma) | `malformed-header` |
| `stripe` | `t=,v1=<the row's hex>` | `malformed-header` |
| `stripe` | `t=1614265330,v1=zz`, or `v1=` followed by the row's hex in uppercase | `mismatch` |
| `stripe` | `t=1614265330,v0=deadbeef,v1=<the row's hex>,scheme=x,v2=zz` | verifies |
| `stripe` | `t=1614265330,v1=<the row's hex>,note=a=b` | verifies |
| `stripe` | `t=01614265330,v1=187d843e0bf2aef8938a9753a7e0a200ba04d5bf656333f69877bd906a449da2` | verifies: the timestamp is signed as received |
| `stripe` | `t=1614265330,v1=187d843e0bf2aef8938a9753a7e0a200ba04d5bf656333f69877bd906a449da2` | `mismatch` |
| `stripe` | `t=1614265330,v1=ea6ffc3529dc2b04c10bb47f7798868eb1d1687a0ba95aa40927e9d6dfa5087a`, the MAC under the row's key without its `whsec_` prefix | `mismatch`: the key is the stored value, `whsec_` included |
| `standard-webhooks` | `webhook-signature: v1` | `malformed-header` |
| `standard-webhooks` | `webhook-signature: v2,abcd` | `malformed-header` |
| `standard-webhooks` | `webhook-signature: v2,xxxx  v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE= v0,yyyy` (two spaces before `v1`, so an empty entry lies between) | verifies |
| `standard-webhooks` | `v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE` (unpadded), or `v1,g0hM9SsE-OTPJTGt_tmIKtSyZlE3uFJELVlNIOLJ1OE=` (URL-safe alphabet) | `mismatch` |
| `standard-webhooks` | the row's values in `svix-id`, `svix-timestamp` and `svix-signature` only | `missing-header` |
| `standard-webhooks` | the key `whsec_!!!!not base64!!!!`, or the 16-byte key `whsec_AQEBAQEBAQEBAQEBAQEBAQ` written without its `==` padding | `key-too-short` (a `503` to the sender) |
| every scheme | a key of 15 bytes, with a signature computed under it | `key-too-short` (a `503` to the sender) |
| `github`, `slack` | a signature field holding a byte other than visible ASCII, space or tab | `malformed-header` |

## Notes

- **The key floor is fixed.** A server refuses a key shorter than 16 bytes and accepts every longer
  one, whatever the provider's own guidance, so a key that verifies on one server verifies on all.
  Svix's documented example key is 18 bytes, below the Standard Webhooks range and above the floor.
- **Handshakes that MAC sender-chosen content are refused by design.** Standard Webhooks endpoint
  verification and Zoom's CRC challenge ask the receiver to compute with its key over a value the
  sender picks, which would make the key a signing key for anyone who can start the handshake. A
  scheme whose provider requires such a handshake can be registered only with the handshake marked
  unsupported.
- **No scheme signs the target URL.** That is why a verify-gated verb runs only at its own
  concrete route and never through composition, hooks, registrations or accessor dispatch.
- **Retention is a minimum.** A server MAY keep delivery identities longer. GitHub signs no
  timestamp and a redelivery carries the same signature, so the `github` row's 72 hours bounds how
  long a captured delivery is refused; after it, the delivery would verify again.
- **A generic scheme is a future name.** A scheme in which the deployer chooses the header field,
  encoding and signed content (for example `generic-hmac`) is not registered; it would need its own
  parameters and its own row.
