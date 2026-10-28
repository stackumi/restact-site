# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three audiences, weighted equally. The site routes each to its own path rather than picking one:

- **Protocol reviewers**: IETF participants, HTTP and API-standards people, security reviewers. They read the
  draft to judge its rigour and send critique.
- **API platform builders**: teams who run APIs or hosts and might implement or embed REST:ACT. They need to know
  what it costs an operator and why an operator would let clients upload code.
- **Agent-tooling developers**: people building coding agents and MCP tooling who would deploy and call verbs.
  They want something they can run quickly.

## Product Purpose

restact.org and restact.dev are the proposal site for REST:ACT: they introduce the protocol and document it. The
protocol is specified in `draft-byrd-restact-protocol-00`, written in Internet-Draft format (intended category
Experimental, independent stream) and not yet submitted to the IETF.

Success over the next few months:

- people read the draft and send feedback on it;
- someone other than restactd implements the protocol, or runs the conformance suite against a server;
- developers run restactd and deploy verbs.

## Positioning

REST:ACT is an HTTP protocol that lets an API's users, and the agents acting for them, add code to the server at
runtime. A client uploads a small WebAssembly component, a **verb**, to a path in the server's object tree
(`/v1/notes/42:wordCount`), and anyone allowed to can call it with an ordinary GET or POST. A verb runs as the
caller, reaches only the host interfaces it imports, and is metered on wall-clock time, compute and memory.

What neighbours cannot claim: MCP standardizes calling tools a server's author exposes, while REST:ACT
standardizes installing a new verb. Serverless and Wasm platforms run code the application's own developers deploy;
in REST:ACT the API's clients deploy it, it runs as each caller, and it is charged to that caller.

## Operating Context

- Readers arrive mostly from links (GitHub, discussion threads) and move between the explanatory pages, the
  specification hub and the rendered draft.
- The normative text lives in `stackumi/restact-specs` and is vendored into `src/content/spec/`; `SOURCE.json`
  records the source commit. The site renders it; it does not author it.
- The reference server is restactd (Rust, Wasmtime), in `stackumi/restactd`. Its own documentation is a separate
  site (`DOCS_SITE_URL` in `src/site.config.ts`); this site links to it rather than duplicating it.
- Related tools: restact-conformance (black-box tests), verbsmith (exposes a host's verbs as MCP tools),
  restact-sdk (Rust crate for verbs), agent plugins for coding agents.

## Capabilities and Constraints

- Static Astro site, no adapter and no server runtime; deployed on Cloudflare (`wrangler.jsonc`).
- Not public yet: `INDEXABLE = false` keeps every page `noindex` until launch.
- `scripts/check-site.mjs` gates every build: banned words in prose, no email addresses, one `<h1>` per page, no
  duplicate ids, no broken internal links or anchors, and kramdown leftovers on `/spec/` pages.
- The specification text is verbatim and not ours to change; `SpecBody.astro` marks it so checks skip it.
- Status must always be stated truthfully: written as an Internet-Draft, not yet submitted, one implementation.
- **Open decisions:**
  - where feedback on the proposal goes (restact-specs issues, Discussions, or something else);
  - the public author identity (the draft card currently reads "N. Byrd");
  - whether the draft is offered as plain text or XML in addition to the rendered page.

## Brand Commitments

- The name is **REST:ACT**, with the colon; domains restact.org and restact.dev.
- Voice: plain and declarative, the register of the existing docs pages (`how-it-works.mdx`, `security.mdx`,
  `compare.mdx`). The owner has said the home page reads like a marketing site and its copy reads as AI-written;
  the site must not sound like a product launch or a pitch.
- Reference sites the owner pointed to for the overall register: a2a-protocol.org, webassembly.org, webmcp.dev.

## Evidence on Hand

- The draft and its companion documents (presentation verbs, registries), rendered under `/spec/`.
- Interactive explanations: `AnatomyDemo.astro` (four requests against `notes/42`), `ResolutionWalk.astro`.
- Real behaviour from restactd: status codes 408/429/507, default limits, the `/.well-known/restact` document,
  verbatim shell sessions.
- restactd, restact-conformance, verbsmith, restact-sdk and the agent plugins exist and are linked.
- **Absent, never to be invented:** adopters, users, testimonials, benchmarks, other implementations, IETF
  submission or working-group adoption.

## Product Principles

1. Show the mechanism before the argument: real URLs, requests and responses carry the explanation.
2. Keep normative and explanatory text visibly apart, and point each explanation at the draft sections it rests on.
3. State the status plainly once per page where it matters, without overclaiming or apologising.
4. Each audience gets a clear next step: read and critique the draft, implement or test against it, or run restactd.
5. Expect to be argued with: make the draft easy to cite, link to and respond to.
