/**
 * Hand-written gists and conformance tags for the section map on /spec/, keyed by the draft's
 * section anchors. Section numbers and titles come from the vendored draft at build time; a
 * top-level section with no entry here fails the build, so a changed draft gets a human read.
 *
 * Tags follow "Conformance and Feature Discovery" (draft section 4). `core` means the section is
 * one of the things a conformant server MUST implement: addressing and invocation, capability
 * confinement, per-invocation limits, runs-as-caller, Problem Details errors and the discovery
 * document. `optional` means the section describes only features the draft lists as OPTIONAL.
 * `core + optional` means it mixes both. `informative` and `registry` mark sections that state no
 * server requirement of their own.
 */
export type Tag = 'core' | 'optional' | 'core + optional' | 'informative' | 'registry';

export const SECTION_MAP: Record<string, { gist: string; tag: Tag }> = {
  introduction: {
    gist: 'Verbs added to the REST nouns: sandboxed uploads invoked over ordinary HTTP. Design goals.',
    tag: 'informative',
  },
  terminology: { gist: 'The BCP 14 key words and the terms used throughout: object, verb, principal, capability.', tag: 'informative' },
  'protocol-overview': { gist: 'A tree of objects, each with data and verbs, and single inheritance down the path.', tag: 'informative' },
  conformance: { gist: 'The mandatory core, and how everything else is advertised as an optional feature.', tag: 'core' },
  addressing: { gist: 'The path grammar in ABNF, with the colon as verb separator, and the three addressing forms.', tag: 'core' },
  'http-method-semantics': {
    gist: 'The standard methods on object data, the function and action rule for verbs, and verb properties.',
    tag: 'core + optional',
  },
  resolution: { gist: 'The search walks from the target object up to the root, and the first definition runs.', tag: 'core' },
  'object-binding': { gist: 'A verb binds to an object; a deployment keeps the planes independent or couples them.', tag: 'optional' },
  representations: {
    gist: 'Native JSON and its system fields, object policy, verb source and executable, deployment, history.',
    tag: 'optional',
  },
  capabilities: { gist: 'Layered host interfaces, deny by default; object data access and caller identity.', tag: 'core + optional' },
  limits: { gist: 'Wall-clock, compute and memory limits per invocation, answered with 408, 429 and 507.', tag: 'core' },
  composition: { gist: 'One verb calls another through the host, under a declared call graph and a shared budget.', tag: 'optional' },
  'active-properties': { gist: 'Reserved verb names let code mediate reads and writes of an object’s representation.', tag: 'optional' },
  'data-properties': { gist: 'An object declares data properties with scope, final and per-property access rules.', tag: 'optional' },
  authz: {
    gist: 'Bearer tokens, policy matchers, ownership, the execution identity, scoped and delegated tokens.',
    tag: 'core + optional',
  },
  'consistency-txn': { gist: 'Consistency levels from eventual to transactional, advertised and never over-claimed.', tag: 'optional' },
  collections: { gist: 'Pagination, filter, order and field masks on collection reads.', tag: 'optional' },
  operations: { gist: 'Prefer: respond-async returns 202 and an operation resource the client polls.', tag: 'optional' },
  events: { gist: 'Server-initiated invocation: lifecycle hooks, schedules, SSE delivery and verb subscriptions.', tag: 'optional' },
  errors: { gist: 'RFC 9457 Problem Details, with the restact_code and restact_verb members.', tag: 'core' },
  discovery: { gist: 'OPTIONS on every path, and the document at /.well-known/restact.', tag: 'core' },
  'relationship-to-google-aip-and-jsonapi': {
    gist: 'How the protocol extends the Google API Design Guide, and what it borrows from JSON:API.',
    tag: 'informative',
  },
  security: { gist: 'Hostile uploads, denial of wallet, side channels, confused deputies and delegation.', tag: 'core + optional' },
  iana: { gist: 'The media types, the well-known URI and the registries the draft requests.', tag: 'registry' },
  'appendix-wit': { gist: 'The rest-act:plugin@0.1.0 interfaces and worlds a component targets.', tag: 'core + optional' },
  'implementation-status-and-experience': { gist: 'What the reference implementation has demonstrated so far.', tag: 'informative' },
};

/** Sections of the draft that get no tile on the map. */
export const UNMAPPED = new Set(['abstract', 'acknowledgments']);
