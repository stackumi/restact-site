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
  conformance: { gist: 'The mandatory core, how everything else is advertised as an optional feature, and what extension drafts add.', tag: 'core' },
  addressing: { gist: 'The path grammar in ABNF, with the colon as verb separator, and the three addressing forms.', tag: 'core' },
  'http-method-semantics': {
    gist: 'The standard methods on object data, the function and action rule for verbs, and verb properties.',
    tag: 'core + optional',
  },
  resolution: { gist: 'The search walks from the target object up to the root, and the first definition runs.', tag: 'core' },
  representations: {
    gist: 'Native JSON and its system fields, object policy, verb source and executable, and deployment.',
    tag: 'optional',
  },
  capabilities: { gist: 'Layered host interfaces, deny by default; the guest contract and the read-only caller identity.', tag: 'core + optional' },
  limits: { gist: 'Wall-clock and memory limits per invocation, and a recommended compute limit, answered with 504, 507 and 429.', tag: 'core' },
  composition: { gist: 'One verb calls another through the host, under a declared call graph and a shared budget.', tag: 'optional' },
  authz: {
    gist: 'Authentication mechanisms, policy matchers, the simple profile, fixed ownership and the execution identity.',
    tag: 'core + optional',
  },
  'consistency-txn': { gist: 'Consistency levels from eventual to transactional, advertised and never over-claimed.', tag: 'optional' },
  collections: { gist: 'Pagination, filter, order and field masks on collection reads.', tag: 'optional' },
  operations: { gist: 'Prefer: respond-async returns 202 and an operation resource the client polls.', tag: 'optional' },
  'admin-reset': { gist: 'An operator-authenticated reset of a server’s stored state, advertised as its own feature.', tag: 'optional' },
  errors: { gist: 'RFC 9457 Problem Details, with the restact_code and restact_verb members.', tag: 'core' },
  discovery: { gist: 'OPTIONS on object, verb and property paths, and the document at /.well-known/restact.', tag: 'core' },
  security: { gist: 'Hostile uploads, denial of wallet, side channels, confused deputies, cross-site requests and operator reset.', tag: 'core + optional' },
  iana: { gist: 'The media type, the well-known URI, the registries and the reserved paths the draft requests.', tag: 'registry' },
  'appendix-wit': { gist: 'The rest-act:plugin@0.1.0 interfaces and worlds a component targets.', tag: 'core + optional' },
  'appendix-pairwise': { gist: 'Test values for computing the pairwise subject a verb reads by default.', tag: 'informative' },
  'implementation-status-and-experience': { gist: 'What the reference implementation has demonstrated so far.', tag: 'informative' },
};

/** Sections of the draft that get no tile on the map. */
export const UNMAPPED = new Set(['abstract', 'acknowledgments']);
