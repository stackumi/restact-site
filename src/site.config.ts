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

/** The Internet-Draft the protocol is specified in. */
export const DRAFT = {
  docname: 'draft-byrd-restact-protocol-00',
  title: 'The REST:ACT Protocol: Invoking Sandboxed Functionality over REST',
  status: 'Individual Internet-Draft, Experimental',
};

export const GITHUB = {
  specs: 'https://github.com/stackumi/restact-specs',
  restactd: 'https://github.com/stackumi/restactd',
  conformance: 'https://github.com/stackumi/restactd/blob/main/conformance/README.md',
  verbsmith: 'https://github.com/stackumi/restactd/blob/main/mcp/README.md',
  sdk: 'https://github.com/stackumi/restactd/tree/main/sdk/rust',
  plugins: 'https://github.com/stackumi/restactd/blob/main/plugins/README.md',
};

/** restactd documentation, rendered by GitHub. */
const DOCS = `${GITHUB.restactd}/blob/main/docs`;
export const RESTACTD_DOCS = {
  gettingStarted: `${DOCS}/getting-started.md`,
  authoringVerbs: `${DOCS}/authoring-verbs.md`,
  httpApi: `${DOCS}/http-api.md`,
  configuration: `${DOCS}/configuration.md`,
  buildingApplications: `${DOCS}/building-applications.md`,
  architecture: `${DOCS}/architecture.md`,
};

export interface NavLink {
  label: string;
  href: string;
}

/** The header navigation, in order. A link is current when the page path starts with its href. */
export const NAV: NavLink[] = [
  { label: 'How it works', href: '/how-it-works/' },
  { label: 'Specification', href: '/spec/' },
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
    items: [{ label: 'Get started', href: '/start/' }],
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

/** Footer columns. External links open in the same tab; the site has no tracking to protect. */
export const FOOTER: NavGroup[] = [
  {
    title: 'Protocol',
    items: [
      { label: 'How it works', href: '/how-it-works/' },
      { label: 'Specification', href: '/spec/' },
      { label: 'Presentation verbs', href: '/presentation-verbs/' },
      { label: 'Security', href: '/security/' },
      { label: 'Compare', href: '/compare/' },
    ],
  },
  {
    title: 'Build',
    items: [
      { label: 'Get started', href: '/start/' },
      { label: 'Authoring verbs', href: RESTACTD_DOCS.authoringVerbs },
      { label: 'HTTP API', href: RESTACTD_DOCS.httpApi },
      { label: 'Configuration', href: RESTACTD_DOCS.configuration },
      { label: 'Building applications', href: RESTACTD_DOCS.buildingApplications },
      { label: 'Architecture', href: RESTACTD_DOCS.architecture },
    ],
  },
  {
    title: 'Source',
    items: [
      { label: 'restact-specs', href: GITHUB.specs },
      { label: 'restactd', href: GITHUB.restactd },
    ],
  },
];

/** localStorage key holding the chosen theme: "dark" or "light". Absent means follow the OS. */
export const THEME_KEY = 'restact-theme';
