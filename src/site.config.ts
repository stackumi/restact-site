/**
 * Site-wide configuration: the one place pages, layouts and the check script read from.
 *
 * INDEXABLE is the single switch for search-engine visibility. While it is false the site emits
 * `<meta name="robots" content="noindex, nofollow">` on every page and `/robots.txt` disallows
 * everything. Flip it to true at launch (see README, "Going public").
 */
export const INDEXABLE = false;

export const SITE = {
  name: 'REST:ACT',
  tagline: 'A web users and their agents can program',
  description:
    'REST:ACT is an HTTP protocol that lets users, and the agents acting for them, add code to the servers they use: a sandboxed WebAssembly verb on a path, called with an ordinary GET or POST.',
};

/**
 * The draft the protocol is specified in, written in Internet-Draft format and not yet submitted.
 * `title` is the one the home page shows; the draft in restact-specs still carries its old title.
 */
export const DRAFT = {
  docname: 'draft-byrd-restact-protocol-00',
  title: 'The REST:ACT Protocol: APIs Their Clients Can Build On',
  status: 'Written as an Internet-Draft, not yet submitted',
};

export const GITHUB = {
  specs: 'https://github.com/stackumi/restact-specs',
  restactd: 'https://github.com/stackumi/restactd',
  /** `restact mcp`, the MCP bridge in the restact command line (formerly verbsmith). */
  mcp: 'https://github.com/stackumi/restactd/blob/main/cli/docs/mcp/README.md',
  sdk: 'https://github.com/stackumi/restactd/tree/main/sdk/rust',
  plugins: 'https://github.com/stackumi/restactd/blob/main/plugins/README.md',
};

/** The restactd documentation site. A custom domain later is a change to this one line. */
export const DOCS_SITE_URL = 'https://stackumi.github.io/restactd';
const DOCS = DOCS_SITE_URL;
export const RESTACTD_DOCS = {
  home: `${DOCS}/`,
  introduction: `${DOCS}/start/introduction/`,
  install: `${DOCS}/start/install/`,
  quickstart: `${DOCS}/start/quickstart/`,
  tutorial: `${DOCS}/start/tutorial/`,
  concepts: `${DOCS}/concepts/overview/`,
  verbsAndObjects: `${DOCS}/concepts/verbs-and-objects/`,
  capabilities: `${DOCS}/concepts/capabilities-and-budgets/`,
  identity: `${DOCS}/concepts/identity-and-authority/`,
  discovery: `${DOCS}/concepts/discovery/`,
  authoringVerbs: `${DOCS}/guides/authoring-verbs/`,
  javascript: `${DOCS}/guides/javascript/`,
  python: `${DOCS}/guides/python/`,
  rust: `${DOCS}/guides/rust/`,
  composition: `${DOCS}/guides/composition/`,
  authentication: `${DOCS}/guides/authentication/`,
  aiAgents: `${DOCS}/guides/ai-agents/`,
  buildingApplications: `${DOCS}/guides/embedding/`,
  docker: `${DOCS}/operate/docker/`,
  storage: `${DOCS}/operate/storage/`,
  production: `${DOCS}/operate/production/`,
  httpApi: `${DOCS}/reference/http-api/`,
  cli: `${DOCS}/reference/cli/`,
  configuration: `${DOCS}/reference/configuration/`,
  features: `${DOCS}/reference/features/`,
  errors: `${DOCS}/reference/errors/`,
  wit: `${DOCS}/reference/wit/`,
  conformance: `${DOCS}/reference/conformance/`,
  architecture: `${DOCS}/architecture/overview/`,
  securityModel: `${DOCS}/architecture/security-model/`,
  requestLifecycle: `${DOCS}/architecture/request-lifecycle/`,
  status: `${DOCS}/project/status/`,
  limits: `${DOCS}/project/limits/`,
};

export interface NavLink {
  label: string;
  href: string;
}

/** The header navigation, in order. A link is current when the page path starts with its href. */
export const NAV: NavLink[] = [
  { label: 'How it works', href: '/how-it-works/' },
  { label: 'Specification', href: '/spec/' },
  { label: 'Get started', href: '/start/' },
  { label: 'restactd', href: '/restactd/' },
  { label: 'Presentation verbs', href: '/presentation-verbs/' },
  { label: 'Security', href: '/security/' },
  { label: 'Compare', href: '/compare/' },
];

/**
 * The documentation section nav (left column of the Docs layout). The order of the items here,
 * flattened, is also the previous/next order. Add a page by adding one entry in the right group.
 */
export interface NavGroup {
  title: string;
  items: NavLink[];
}
export const DOCS_NAV: NavGroup[] = [
  {
    title: 'Protocol',
    items: [
      { label: 'How it works', href: '/how-it-works/' },
      { label: 'Security', href: '/security/' },
      { label: 'Compared with other approaches', href: '/compare/' },
      { label: 'Presentation verbs', href: '/presentation-verbs/' },
    ],
  },
  {
    title: 'Build',
    items: [
      { label: 'Get started', href: '/start/' },
      { label: 'restactd, the reference server', href: '/restactd/' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { label: 'Specification', href: '/spec/' },
      { label: 'The Internet-Draft', href: '/spec/draft/' },
      { label: 'Presentation verbs, normative', href: '/spec/presentation-verbs/' },
      { label: 'Registries', href: '/spec/registries/' },
    ],
  },
];

/** localStorage key holding the chosen theme: "light" or "dark". Absent means light; dark is opt-in. */
export const THEME_KEY = 'restact-theme';
