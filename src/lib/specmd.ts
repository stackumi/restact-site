/**
 * Renders the vendored specification sources (src/content/spec/, see scripts/sync-spec.mjs) to HTML
 * at build time. Nothing here runs in the browser.
 *
 *   renderDraft()    the Internet-Draft, a kramdown-rfc file: front matter, `--- abstract|middle|back`,
 *                    {#anchor} headings, {{xref}} references, definition lists, the BCP 14 boilerplate
 *   renderPlain()    plain Markdown (presentation-verbs.md and the registries)
 *   featureTokens()  the rows of registries/feature-tokens.md
 *   witSummary()     the interface and world lists of the draft's WIT appendix
 *
 * Output is a list of segments so a page can draw code with the shared CodeBlock component: an
 * `html` segment is trusted markup built here from the vendored files, a `code` segment is a fenced
 * block. The only dependency is `marked`.
 */
import { Marked, type Tokens } from 'marked';

export type Segment = { html: string } | { code: string; lang?: string; label?: string };
export interface Heading {
  depth: number;
  slug: string;
  text: string;
}
export interface Rendered {
  segments: Segment[];
  headings: Heading[];
}
export interface SectionInfo {
  id: string;
  /** "6", "6.2", "A", "A.1"; empty for unnumbered sections */
  num: string;
  /** The label an xref shows: "Section 6", "Appendix A" */
  label: string;
  /** Heading depth in the source: 1 for a top-level section */
  depth: number;
  part: 'abstract' | 'middle' | 'back';
  title: string;
  /** The heading as written, with Markdown but without the {#id} */
  raw: string;
}

const files = import.meta.glob('../content/spec/**/*', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
/** A vendored file by its path under src/content/spec/, e.g. "registries/feature-tokens.md". */
export const readSpec = (name: string): string => {
  const text = files[`../content/spec/${name}`];
  if (text === undefined) throw new Error(`specmd: src/content/spec/${name} is missing; run \`pnpm sync:spec\``);
  return text;
};
export const DRAFT_FILE = 'draft-byrd-restact-protocol-00.md';
export const DRAFT_PATH = '/spec/draft/';
export const PV_PATH = '/spec/presentation-verbs/';
export const REGISTRIES_PATH = '/spec/registries/';
export const SPECS_REPO = 'https://github.com/stackumi/restact-specs';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Markdown inline syntax removed, for ids, TOC entries and tooltips. */
export const plain = (s: string) =>
  s
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\{\{[^}]*\}\}/g, '')
    .trim();

/** GitHub-style heading slug, so links written for GitHub's rendering keep working. */
export const slugify = (s: string) =>
  plain(s)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');

// --------------------------------------------------------------------------------------------
// Front matter and references (the draft is kramdown-rfc: YAML up to the `--- abstract` line)
// --------------------------------------------------------------------------------------------

export interface Ref {
  key: string;
  title: string;
  target: string;
  kind: 'normative' | 'informative';
}

/** Titles of the RFCs the draft cites. kramdown-rfc would fetch these from the RFC index. */
const RFC_TITLES: Record<string, string> = {
  RFC2119: 'Key words for use in RFCs to Indicate Requirement Levels',
  RFC3986: 'Uniform Resource Identifier (URI): Generic Syntax',
  RFC5234: 'Augmented BNF for Syntax Specifications: ABNF',
  RFC6749: 'The OAuth 2.0 Authorization Framework',
  RFC6750: 'The OAuth 2.0 Authorization Framework: Bearer Token Usage',
  RFC7232: 'Hypertext Transfer Protocol (HTTP/1.1): Conditional Requests',
  RFC7240: 'Prefer Header for HTTP',
  RFC7519: 'JSON Web Token (JWT)',
  RFC7636: 'Proof Key for Code Exchange by OAuth Public Clients',
  RFC8126: 'Guidelines for Writing an IANA Considerations Section in RFCs',
  RFC8174: 'Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words',
  RFC8252: 'OAuth 2.0 for Native Apps',
  RFC8259: 'The JavaScript Object Notation (JSON) Data Interchange Format',
  RFC8288: 'Web Linking',
  RFC8615: 'Well-Known Uniform Resource Identifiers (URIs)',
  RFC8693: 'OAuth 2.0 Token Exchange',
  RFC9110: 'HTTP Semantics',
  RFC9111: 'HTTP Caching',
  RFC9457: 'Problem Details for HTTP APIs',
  RFC9700: 'Best Current Practice for OAuth 2.0 Security',
};

const rfcUrl = (key: string) => `https://www.rfc-editor.org/rfc/rfc${key.replace(/\D/g, '')}`;

export interface FrontMatter {
  title: string;
  docname: string;
  category: string;
  stream: string;
  area: string;
  keywords: string[];
  author: string;
  refs: Ref[];
}

function parseFront(text: string): FrontMatter {
  const lines = text.split('\n');
  const one = (k: string) => (text.match(new RegExp(`^${k}:\\s*"?(.*?)"?\\s*$`, 'm')) ?? [])[1] ?? '';
  const category: Record<string, string> = { exp: 'Experimental', std: 'Standards Track', info: 'Informational', bcp: 'Best Current Practice' };
  const stream: Record<string, string> = { independent: 'Independent Submission', IETF: 'IETF', IAB: 'IAB', IRTF: 'IRTF' };
  const keywords: string[] = [];
  const refs: Ref[] = [];
  let block = '';
  let cur: Ref | null = null;
  for (const line of lines) {
    if (/^\S/.test(line)) {
      block = line.replace(/:.*$/, '');
      cur = null;
      continue;
    }
    if (block === 'keyword') {
      const m = line.match(/^\s+-\s+(.*)$/);
      if (m) keywords.push(m[1]);
    } else if (block === 'normative' || block === 'informative') {
      const m = line.match(/^ {2}([A-Za-z0-9_-]+):\s*$/);
      if (m) {
        cur = { key: m[1], title: '', target: '', kind: block };
        refs.push(cur);
      } else if (cur) {
        const t = line.match(/^ {4}title:\s*"(.*)"\s*$/);
        const g = line.match(/^ {4}target:\s*(\S+)\s*$/);
        if (t) cur.title = t[1];
        if (g) cur.target = g[1];
      }
    }
  }
  // The BCP 14 boilerplate cites these two; kramdown-rfc adds them as normative references.
  for (const key of ['RFC2119', 'RFC8174']) if (!refs.some((r) => r.key === key)) refs.unshift({ key, title: '', target: '', kind: 'normative' });
  for (const r of refs) {
    if (/^RFC\d+$/.test(r.key)) {
      r.target ||= rfcUrl(r.key);
      r.title ||= RFC_TITLES[r.key] ?? '';
    }
    if (!r.title || !r.target) throw new Error(`specmd: reference ${r.key} has no title or target`);
  }
  return {
    title: one('title'),
    docname: one('docname'),
    category: category[one('category')] ?? one('category'),
    stream: stream[one('submissiontype')] ?? one('submissiontype'),
    area: one('area'),
    keywords,
    author: (text.match(/^\s+ins:\s*(.+?)\s*$/m) ?? [])[1] ?? '',
    refs,
  };
}

// --------------------------------------------------------------------------------------------
// Link policy
// --------------------------------------------------------------------------------------------

/** Rewrites a link found in a vendored file. Returns null to drop the link and keep its text. */
export function rewriteHref(href: string, opts: { file?: string; idPrefix?: string } = {}): string | null {
  if (href.startsWith('#')) return opts.idPrefix ? `#${opts.idPrefix}${href.slice(1)}` : href;
  if (/^https?:/.test(href)) {
    // The reference host's decision records and spec directory are not public pages yet.
    if (/^https:\/\/github\.com\/stackumi\/restactd\/(?:blob|tree)\/main\/spec(?:\/|$)/.test(href)) return null;
    return href;
  }
  // Resolve against the vendored file's own place in the restact-specs repository.
  const [rel, frag] = href.split('#');
  const from = opts.file ?? DRAFT_FILE;
  let abs: string;
  try {
    abs = new URL(rel, `x:/${from}`).pathname.replace(/^\//, '');
  } catch {
    abs = '';
  }
  if (abs) {
    const fragPart = frag ? `#${frag}` : '';
    if (abs === DRAFT_FILE) return DRAFT_PATH + fragPart;
    if (abs === 'presentation-verbs.md') return PV_PATH + fragPart;
    if (abs === 'registries/README.md') return `${REGISTRIES_PATH}#registries`;
    const reg = abs.match(/^registries\/(.+)\.md$/);
    if (reg && REGISTRY_FILES.some((r) => r.slug === reg[1])) return `${REGISTRIES_PATH}#${reg[1]}${frag ? `-${frag}` : ''}`;
    // Anything else in the repository (fixtures, concepts.md, the root README) stays on GitHub.
    const dir = /\/$/.test(rel) || !/\.[A-Za-z0-9]+$/.test(abs);
    return `${SPECS_REPO}/${dir ? 'tree' : 'blob'}/main/${abs.replace(/\/$/, '')}${fragPart}`;
  }
  console.warn(`specmd: dropped link ${href} in ${opts.file ?? 'a vendored file'}`);
  return null;
}

/** The text a link to a vendored file shows when the source wrote the file name as a code span. */
const DOC_LABELS: Record<string, string> = {
  [DRAFT_FILE]: 'draft',
  'presentation-verbs.md': 'Presentation verbs',
  'registries/README.md': 'Registries',
  'registries/feature-tokens.md': 'Feature Tokens',
  'registries/capability-interfaces.md': 'Capability Interfaces',
  'registries/source-languages.md': 'Source Languages',
  'registries/verb-property-names.md': 'Verb Property Names',
  'registries/ui-catalog-nodes.md': 'UI Catalog Nodes',
  'registries/llm-providers.md': 'LLM Providers',
};
function docLabel(codeText: string, hrefPath: string, from: string): string | null {
  if (hrefPath !== codeText) return null;
  try {
    return DOC_LABELS[new URL(hrefPath, `x:/${from}`).pathname.replace(/^\//, '')] ?? null;
  } catch {
    return null;
  }
}

export const REGISTRY_FILES = [
  { slug: 'feature-tokens', file: 'registries/feature-tokens.md' },
  { slug: 'capability-interfaces', file: 'registries/capability-interfaces.md' },
  { slug: 'source-languages', file: 'registries/source-languages.md' },
  { slug: 'verb-property-names', file: 'registries/verb-property-names.md' },
  { slug: 'ui-catalog-nodes', file: 'registries/ui-catalog-nodes.md' },
  { slug: 'llm-providers', file: 'registries/llm-providers.md' },
];

// --------------------------------------------------------------------------------------------
// The draft: pre-pass (numbering, anchors), then Markdown
// --------------------------------------------------------------------------------------------

type HeadingPlan = SectionInfo;

const fenceOpen = (l: string) => l.match(/^\s*(~{3,}|`{3,})\s*([\w+-]*)/);

function prepareDraft(src: string) {
  const split = src.indexOf('\n--- abstract');
  if (!src.startsWith('---\n') || split < 0) throw new Error('specmd: draft front matter not found');
  const front = parseFront(src.slice(4, split));
  const body = src.slice(split + 1).split('\n');

  const plan: HeadingPlan[] = [];
  const out: string[] = [];
  const counters: number[] = [];
  const used = new Set<string>();
  let part: 'abstract' | 'middle' | 'back' = 'abstract';
  let fence: string | null = null;

  const letter = (n: number) => String.fromCharCode(64 + n);
  const push = (depth: number, raw: string, id: string | undefined) => {
    // kramdown-rfc nesting: a heading deeper than one level below the last numbered one counts as
    // the next level down (a "###" straight under a "#" is the section's first subsection).
    if (part !== 'abstract') depth = Math.min(depth, counters.length + 1);
    const title = plain(raw);
    let num = '';
    let label = '';
    const unnumbered = part === 'abstract' || (part === 'back' && depth === 1 && /^Acknowledg/i.test(raw));
    if (!unnumbered) {
      counters.length = depth;
      counters[depth - 1] = (counters[depth - 1] ?? 0) + 1;
      num = counters.map((n, i) => (i === 0 && part === 'back' ? letter(n) : String(n))).join('.');
      label = `${part === 'back' ? 'Appendix' : 'Section'} ${num}`;
    }
    let slug = id ?? slugify(raw);
    if (!id) for (let n = 2; used.has(slug); n++) slug = `${slugify(raw)}-${n}`;
    used.add(slug);
    plan.push({ id: slug, num, label, depth, part, title, raw });
    out.push(`${'#'.repeat(depth)} ${raw}`);
  };

  for (const line of body) {
    if (fence) {
      out.push(line);
      if (line.trim().startsWith(fence)) fence = null;
      continue;
    }
    const f = fenceOpen(line);
    if (f) {
      fence = f[1];
      out.push(line);
      continue;
    }
    const p = line.match(/^--- (abstract|middle|back)\s*$/);
    if (p) {
      part = p[1] as typeof part;
      counters.length = 0;
      if (part === 'abstract') push(1, 'Abstract', 'abstract');
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*?)(?:\s+\{#([\w-]+)\})?\s*$/);
    if (h) {
      push(h[1].length, h[2], h[3]);
      continue;
    }
    out.push(line.replace(/^\{::boilerplate bcp14-tagged\}\s*$/, '@@BCP14@@'));
  }
  return { front, plan, markdown: out.join('\n') };
}

const BCP14_BOILERPLATE =
  '<p>The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 [<a href="https://www.rfc-editor.org/rfc/rfc2119">RFC2119</a>] [<a href="https://www.rfc-editor.org/rfc/rfc8174">RFC8174</a>] when, and only when, they appear in all capitals, as shown here.</p>'.replace(
    /"([A-Z ]+)"/g,
    '&quot;$1&quot;',
  );

// --------------------------------------------------------------------------------------------
// Markdown engine
// --------------------------------------------------------------------------------------------

interface EngineOpts {
  file: string;
  /** prefix for generated heading ids and in-page links */
  idPrefix?: string;
  /** source heading depth 1 becomes this HTML depth */
  baseDepth?: number;
  /** draft mode: headings come from the pre-pass plan */
  plan?: HeadingPlan[];
  refs?: Ref[];
  sections?: Map<string, SectionInfo>;
  /** id for the first heading (a registry's own anchor) */
  rootId?: string;
  /** prefix for section references, when the output is shown on another page than the draft */
  xrefBase?: string;
}

const KEYWORDS = /\b(MUST NOT|MUST|SHALL NOT|SHALL|SHOULD NOT|SHOULD|NOT RECOMMENDED|RECOMMENDED|REQUIRED|MAY|OPTIONAL)\b/g;

/** Wraps BCP 14 keywords in running text; code, headings and attributes are left alone. */
function markKeywords(html: string): string {
  let skip = 0;
  return html.replace(/(<[^>]*>)|([^<]+)/g, (_m, tag: string | undefined, text: string | undefined) => {
    if (tag) {
      if (/^<(code|pre|h[1-6])\b/i.test(tag)) skip++;
      else if (/^<\/(code|pre|h[1-6])\b/i.test(tag)) skip = Math.max(0, skip - 1);
      return tag;
    }
    return skip ? text! : text!.replace(KEYWORDS, '<span class="kw">$1</span>');
  });
}

const httpLike = (code: string) => /^(?:GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s+\S|^HTTP\/\d/.test(code);

function engine(opts: EngineOpts) {
  const marked = new Marked({ gfm: true });
  const codes: { code: string; lang?: string; label?: string }[] = [];
  const headings: Heading[] = [];
  const ids = new Set<string>();
  let planAt = 0;

  marked.use({
    extensions: [
      {
        name: 'xref',
        level: 'inline',
        start: (src: string) => src.indexOf('{{'),
        tokenizer(src: string) {
          const m = /^\{\{([A-Za-z0-9_.-]+)\}\}/.exec(src);
          if (m) return { type: 'xref', raw: m[0], key: m[1] };
        },
        renderer(tok) {
          const key = (tok as unknown as { key: string }).key;
          const sec = opts.sections?.get(key);
          if (sec) return `<a href="${opts.xrefBase ?? ''}#${sec.id}" title="${esc(sec.title)}">${sec.label}</a>`;
          const ref = opts.refs?.find((r) => r.key === key);
          if (ref) return `[<a href="${esc(ref.target)}">${esc(key)}</a>]`;
          if (/^RFC\d+$/.test(key)) return `[<a href="${rfcUrl(key)}">${key}</a>]`;
          throw new Error(`specmd: unresolved reference {{${key}}} in ${opts.file}`);
        },
      },
      {
        name: 'dl',
        level: 'block',
        start(src: string) {
          const m = /(^|\n)[^\n]+:\n: /.exec(src);
          return m ? m.index + m[1].length : undefined;
        },
        tokenizer(src: string) {
          const lines = src.split('\n');
          const isTerm = (i: number) => !!lines[i] && /:$/.test(lines[i]) && !!lines[i + 1]?.startsWith(': ');
          const items: { term: string; defs: string[] }[] = [];
          let i = 0;
          while (isTerm(i)) {
            const term = lines[i].slice(0, -1);
            i++;
            const defs: string[] = [];
            while (i < lines.length && lines[i].startsWith(': ')) {
              let d = lines[i].slice(2);
              i++;
              while (i < lines.length && /^(?: {2,}|\t)\S/.test(lines[i])) d += '\n' + lines[i++].trim();
              defs.push(d);
            }
            items.push({ term, defs });
            let j = i;
            while (j < lines.length && lines[j] === '') j++;
            if (j > i && isTerm(j)) i = j;
            else break;
          }
          if (!items.length) return;
          const raw = lines.slice(0, i).join('\n') + (i < lines.length ? '\n' : '');
          return {
            type: 'dl',
            raw,
            items: items.map((it) => ({
              term: this.lexer.inlineTokens(it.term),
              defs: it.defs.map((d) => this.lexer.inlineTokens(d)),
            })),
          };
        },
        renderer(tok) {
          const items = (tok as unknown as { items: { term: Tokens.Generic[]; defs: Tokens.Generic[][] }[] }).items;
          return `<dl>${items
            .map(
              (it) =>
                `<dt>${this.parser.parseInline(it.term)}</dt>${it.defs.map((d) => `<dd>${this.parser.parseInline(d)}</dd>`).join('')}`,
            )
            .join('')}</dl>\n`;
        },
      },
    ],
    renderer: {
      // Raw HTML in a vendored file is shown as text, never passed through.
      html(token: Tokens.HTML | Tokens.Tag) {
        return esc(token.text);
      },
      heading(token: Tokens.Heading) {
        const inner = this.parser.parseInline(token.tokens);
        let id: string;
        let depth: number;
        let num = '';
        let label = '';
        if (opts.plan) {
          const p = opts.plan[planAt++];
          if (!p || p.depth !== token.depth) throw new Error(`specmd: heading plan out of step at "${token.text}"`);
          id = p.id;
          depth = p.depth + 1;
          num = p.num;
          label = p.label;
        } else {
          let slug = (opts.idPrefix ?? '') + slugify(token.text);
          for (let n = 2; ids.has(slug); n++) slug = `${(opts.idPrefix ?? '') + slugify(token.text)}-${n}`;
          id = opts.rootId && headings.length === 0 ? opts.rootId : slug;
          depth = Math.min(6, token.depth + (opts.baseDepth ?? 1) - 1);
        }
        ids.add(id);
        headings.push({ depth, slug: id, text: `${num ? num + ' ' : ''}${plain(token.text)}` });
        const n = num ? `<span class="num">${num}</span> ` : '';
        const aria = label ? `Link to ${label}` : `Link to this section`;
        return `<h${depth} id="${id}">${n}${inner}<a class="anchor" href="#${id}" aria-label="${esc(aria)}">#</a></h${depth}>\n`;
      },
      code(token: Tokens.Code) {
        const lang = (token.lang ?? '').trim().split(/\s+/)[0] || undefined;
        // A reference inside a code block cannot be a link; it becomes the plain section label.
        const code = token.text.replace(/\n$/, '').replace(/\{\{([A-Za-z0-9_.-]+)\}\}/g, (_m, k: string) => {
          const sec = opts.sections?.get(k);
          if (sec) return sec.label;
          if (opts.refs?.some((r) => r.key === k) || /^RFC\d+$/.test(k)) return `[${k}]`;
          throw new Error(`specmd: unresolved reference {{${k}}} in a code block in ${opts.file}`);
        });
        const known: Record<string, string> = { abnf: 'ABNF', wit: 'WIT', json: 'JSON', yaml: 'YAML', http: 'HTTP' };
        const l = lang ?? (httpLike(code) ? 'http' : undefined);
        // Shiki has no ABNF grammar: the block shows plain, with its label strip.
        codes.push({ code, lang: l === 'abnf' ? undefined : l, label: l ? (known[l] ?? l) : undefined });
        return `\n\u0000code:${codes.length - 1}\u0000\n`;
      },
      link(token: Tokens.Link) {
        const inner = this.parser.parseInline(token.tokens);
        const href = rewriteHref(token.href, { file: opts.file, idPrefix: opts.idPrefix });
        if (href === null) return inner;
        const only = token.tokens.length === 1 && token.tokens[0].type === 'codespan' ? (token.tokens[0] as Tokens.Codespan).text : null;
        const label = only !== null && !/^(?:https?:|#)/.test(token.href) ? docLabel(only, token.href.split('#')[0], opts.file) : null;
        if (label !== null) {
          const t = token.title ? ` title="${esc(token.title)}"` : '';
          return `<a href="${esc(href)}"${t}>${esc(label)}</a>`;
        }
        const t = token.title ? ` title="${esc(token.title)}"` : '';
        return `<a href="${esc(href)}"${t}>${inner}</a>`;
      },
    },
  });

  const finish = (html: string): Rendered => {
    if (opts.plan && planAt !== opts.plan.length) throw new Error(`specmd: ${opts.plan.length - planAt} planned headings were not rendered`);
    html = html.replace('<p>@@BCP14@@</p>', BCP14_BOILERPLATE);
    const segments: Segment[] = [];
    html.split(/\u0000code:(\d+)\u0000/).forEach((part, i) => {
      if (i % 2) segments.push(codes[Number(part)]);
      else if (part.trim()) segments.push({ html: markKeywords(part) });
    });
    return { segments, headings };
  };
  return { marked, finish };
}

export function renderPlain(markdown: string, opts: EngineOpts): Rendered {
  const { marked, finish } = engine(opts);
  return finish(marked.parse(markdown, { async: false }) as string);
}

/** Inline Markdown to HTML, with the same link policy and no wrapping paragraph. */
export function renderInline(markdown: string, file: string): string {
  const { marked } = engine({ file });
  return markKeywords(marked.parseInline(markdown, { async: false }) as string);
}

// --------------------------------------------------------------------------------------------
// Public: the draft
// --------------------------------------------------------------------------------------------

export interface DraftDoc extends Rendered {
  front: FrontMatter;
  sections: SectionInfo[];
  /** Normative and informative references, as HTML segments appended after the body */
  refsHtml: string;
  markdown: string;
}

let draftCache: DraftDoc | undefined;

export function renderDraft(): DraftDoc {
  if (draftCache) return draftCache;
  const { front, plan, markdown } = prepareDraft(readSpec(DRAFT_FILE));
  const sections = new Map(plan.map((p) => [p.id, p]));
  const { marked, finish } = engine({ file: DRAFT_FILE, plan, refs: front.refs, sections });
  const r = finish(marked.parse(markdown, { async: false }) as string);

  const refList = (kind: Ref['kind']) =>
    front.refs
      .filter((x) => x.kind === kind)
      .sort((a, b) => a.key.localeCompare(b.key, 'en', { numeric: true }))
      .map(
        (x) =>
          `<dt id="ref-${esc(x.key)}">[${esc(x.key)}]</dt><dd>${esc(x.title)}${/^RFC\d+$/.test(x.key) ? `, RFC ${x.key.slice(3)}` : ''}. <a href="${esc(x.target)}">${esc(x.target.replace(/^https?:\/\//, ''))}</a></dd>`,
      )
      .join('');
  const refsHtml =
    `<h2 id="references">References<a class="anchor" href="#references" aria-label="Link to References">#</a></h2>\n` +
    `<h3 id="normative-references">Normative references<a class="anchor" href="#normative-references" aria-label="Link to Normative references">#</a></h3>\n<dl class="refs">${refList('normative')}</dl>\n` +
    `<h3 id="informative-references">Informative references<a class="anchor" href="#informative-references" aria-label="Link to Informative references">#</a></h3>\n<dl class="refs">${refList('informative')}</dl>\n`;
  r.headings.push(
    { depth: 2, slug: 'references', text: 'References' },
    { depth: 3, slug: 'normative-references', text: 'Normative references' },
    { depth: 3, slug: 'informative-references', text: 'Informative references' },
  );

  draftCache = { ...r, front, sections: plan, refsHtml, markdown };
  return draftCache;
}

/** The text of one draft section (from its heading to the next heading of the same or higher level). */
export function sectionText(doc: DraftDoc, id: string): string {
  const s = doc.sections.find((x) => x.id === id);
  if (!s) throw new Error(`specmd: no draft section ${id}`);
  const lines = doc.markdown.split('\n');
  const start = lines.findIndex((l) => new RegExp(`^#{${s.depth}}\\s+${s.raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`).test(l));
  if (start < 0) return '';
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) if (new RegExp(`^#{1,${s.depth}}\\s`).test(lines[i])) { end = i; break; }
  return lines.slice(start + 1, end).join('\n');
}

// --------------------------------------------------------------------------------------------
// Public: the feature-token registry and the WIT summary
// --------------------------------------------------------------------------------------------

export interface FeatureToken {
  token: string;
  html: string;
  status: string;
  plain: string;
}

/** Splits a Markdown table row on pipes that are not inside backticks. */
function cells(row: string): string[] {
  const out: string[] = [];
  let cur = '';
  let tick = false;
  for (const ch of row.replace(/^\s*\|/, '').replace(/\|\s*$/, '')) {
    if (ch === '`') tick = !tick;
    if (ch === '|' && !tick) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export function featureTokens(): FeatureToken[] {
  const file = 'registries/feature-tokens.md';
  const rows = readSpec(file)
    .split('\n')
    .filter((l) => /^\| `[a-z0-9-]+` \|/.test(l));
  return rows.map((row) => {
    const c = cells(row);
    if (c.length !== 4) throw new Error(`specmd: feature-token row has ${c.length} cells: ${row.slice(0, 60)}`);
    return {
      token: c[0].replace(/`/g, ''),
      html: renderInline(c[1], file),
      status: c[2],
      plain: plain(c[1]),
    };
  });
}

export interface WitItem {
  name: string;
  html: string;
}

export function witSummary(): { interfaces: WitItem[]; worlds: WitItem[] } {
  const doc = renderDraft();
  const { marked } = engine({ file: DRAFT_FILE, refs: doc.front.refs, sections: new Map(doc.sections.map((s) => [s.id, s])), xrefBase: DRAFT_PATH });
  const text = sectionText(doc, 'appendix-wit');
  const [pkg, worlds] = text.split(/Worlds compose these[^\n]*\n/);
  const items = (block: string): WitItem[] => {
    const out: WitItem[] = [];
    for (const line of block.split('\n')) {
      const m = line.match(/^\* ((?:`[^`]+`(?: \/ )?)+)\s+(?:—|--)\s*(.*)$/);
      if (m) out.push({ name: m[1].replace(/`/g, ''), html: markKeywords(marked.parseInline(m[2], { async: false }) as string) });
      else if (out.length && /^ {2,}\S/.test(line)) {
        const prev = out[out.length - 1];
        prev.html += ' ' + markKeywords(marked.parseInline(line.trim(), { async: false }) as string);
      }
    }
    return out;
  };
  const w = items(worlds ?? '');
  const i = items(pkg ?? '');
  if (!i.length || !w.length) throw new Error('specmd: could not read the WIT appendix lists');
  return { interfaces: i, worlds: w };
}
