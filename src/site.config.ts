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
  /** The default meta description: under 160 characters, so search results show it whole. */
  description:
    'REST:ACT is an HTTP protocol that lets an API’s clients add their own code to the server: a sandboxed WebAssembly verb on a path, called with GET or POST.',
  /** The link-preview image (public/og.png, made from scripts/og/og-image.html). */
  image: { path: '/og.png', width: 1200, height: 630, alt: 'REST:ACT: APIs their clients can build on. An open-source protocol and reference server.' },
};

/**
 * The draft the protocol is specified in, written in Internet-Draft format and not yet submitted.
 * `title` is the home page's title. The draft in stackumi/restact keeps its own descriptive title
 * ("The REST:ACT Protocol: Invoking Sandboxed Functionality over REST") on purpose, and the draft's
 * page uses that one.
 */
export const DRAFT = {
  docname: 'draft-byrd-restact-protocol-00',
  title: 'The REST:ACT Protocol: APIs Their Clients Can Build On',
  status: 'Written as an Internet-Draft, not yet submitted',
};

export const GITHUB = {
  specs: 'https://github.com/stackumi/restact',
  restactd: 'https://github.com/stackumi/restactd',
  /** `restact mcp`, the MCP bridge in the restact command line (formerly verbsmith). */
  mcp: 'https://github.com/stackumi/restactd/blob/main/cli/docs/mcp/README.md',
  sdk: 'https://github.com/stackumi/restactd/tree/main/sdk/rust',
  plugins: 'https://github.com/stackumi/restactd/blob/main/plugins/README.md',
};

/**
 * The restactd documentation: built in the restactd repository and vendored into public/docs/ by
 * `pnpm sync:docs`, so it is served from this site at /docs (stackumi/restactd#901).
 */
export const DOCS_SITE_URL = '/docs';
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
  { label: 'Docs', href: '/docs/' },
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
