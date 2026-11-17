import type { APIRoute } from 'astro';
import { DRAFT_FILE, SPECS_REPO } from '../lib/specmd';
import { DRAFT, GITHUB, RESTACTD_DOCS } from '../site.config';

// /llms.txt (llmstxt.org): a reading list for language models and the tools that feed them. The
// summary repeats the home page's abstract; the notes are short forms of each page's description.
// The draft's Markdown source is linked raw, since a model reads it more reliably than HTML.
const raw = `${SPECS_REPO.replace('https://github.com/', 'https://raw.githubusercontent.com/')}/main/${DRAFT_FILE}`;

export const GET: APIRoute = ({ site }) => {
  const u = (p: string) => new URL(p, site).href;
  const body = `# REST:ACT

> REST:ACT is an HTTP protocol that lets the clients of an API add their own code to the server, within the permissions the server grants them. A client uploads a small program, called a verb, to a path in the server's object tree, and anyone the server allows can call it with GET or POST.

A verb is a WebAssembly component. By default it runs with the caller's permissions, can use only the host interfaces it imports, and stops when it reaches its time or memory limit. The protocol is specified in ${DRAFT.docname}, written as an Internet-Draft and not yet submitted to the IETF; it is not a standard. restactd is the reference server.

## Specification

- [The draft](${u('/spec/draft/')}): the normative text, "${DRAFT.title}"
- [The draft's Markdown source](${raw}): the same text, as written
- [Specification overview](${u('/spec/')}): the draft section by section, feature tokens, the guest contract, and tests
- [Objects and data](${u('/spec/objects/')}): the extension draft for object listing and queries, property access, policy inheritance, accessor verbs and deployment history
- [Events](${u('/spec/events/')}): the extension draft for lifecycle hooks, subscriptions, schedules and delivery over Server-Sent Events
- [Identity and delegation](${u('/spec/delegation/')}): the extension draft for ownership reassignment, path-scoped sub-tokens and grants
- [Connectors](${u('/spec/connectors/')}): the extension draft for the secrets mount, mediated outbound calls, model completion and webhook delivery
- [Model Context Protocol facet](${u('/spec/mcp/')}): the extension draft for the four MCP tools
- [HTTP verbs](${u('/spec/http-verbs/')}): the extension draft for request headers, response status and headers, and webhook signature verification
- [Presentation verbs and their media type](${u('/spec/presentation-verbs/')}): application/vnd.restact.ui+json, the extension draft, normative
- [Registries](${u('/spec/registries/')}): the registries the draft requests

## Explanations

- [How REST:ACT works](${u('/how-it-works/')}): objects, data and verbs, addressing, and what a verb can reach
- [Security model](${u('/security/')}): the four rules, whose authority a verb carries, and resource limits
- [Compared with other approaches](${u('/compare/')}): REST and OpenAPI, RPC, GraphQL, serverless and Wasm platforms, MCP
- [Presentation verbs](${u('/presentation-verbs/')}): a verb that returns a screen as data

## Reference server

- [restactd](${u('/restactd/')}): the reference server, in Rust on Wasmtime
- [Get started](${u('/start/')}): run restactd and deploy a first verb
- [restactd documentation](${u(RESTACTD_DOCS.home)}): served under /docs, with its own llms.txt

## Optional

- [The specification repository on GitHub](${GITHUB.specs}): the draft, its companion documents and the registries
- [restactd on GitHub](${GITHUB.restactd}): the server, the SDK, the command line and the conformance suite
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
