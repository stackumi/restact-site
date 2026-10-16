/**
 * The registered UI catalog node types, read at build time from the vendored registry
 * (src/content/spec/registries/ui-catalog-nodes.md, see scripts/sync-spec.mjs), then grouped for
 * reading. The grouping is editorial; the list and the count come from the registry, and a type
 * the grouping does not know falls into "Other".
 */
const files = import.meta.glob('../content/spec/registries/ui-catalog-nodes.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const source = Object.values(files)[0] ?? '';

/** Rows of the "Registered node types" table: | `name` | v0.x | status |. */
export const nodeTypes: string[] = [...source.matchAll(/^\| `(\w+)` \| v[\d.]+ \| \w+ \|/gm)].map((m) => m[1]);
if (nodeTypes.length === 0) throw new Error('ui-catalog: no node types found in the vendored registry');

const FAMILIES: { title: string; nodes: string[] }[] = [
  { title: 'Layout', nodes: ['page', 'section', 'grid', 'columns', 'tabs', 'accordion', 'divider', 'toolbar', 'menu'] },
  { title: 'Content', nodes: ['text', 'heading', 'quote', 'code', 'callout', 'badge', 'image', 'slideshow', 'field', 'fieldList', 'list', 'card'] },
  { title: 'Data', nodes: ['table', 'dataGrid', 'stat', 'barChart', 'chartView', 'progress', 'meter', 'calendar', 'board', 'pageTree', 'diffView'] },
  { title: 'Input and actions', nodes: ['form', 'action', 'upload', 'todo', 'cell'] },
  { title: 'Links and embedding', nodes: ['link', 'externalLink', 'viewEmbed', 'sandboxIframe'] },
];

const known = new Set(FAMILIES.flatMap((f) => f.nodes));
const other = nodeTypes.filter((n) => !known.has(n));

export const families = [
  ...FAMILIES.map((f) => ({ title: f.title, nodes: f.nodes.filter((n) => nodeTypes.includes(n)) })),
  ...(other.length ? [{ title: 'Other', nodes: other }] : []),
];
export const nodeCount = nodeTypes.length;
