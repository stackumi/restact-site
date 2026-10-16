// The code-highlighting theme: a TextMate theme whose colours are the site's CSS custom
// properties, so one theme serves both colour schemes. The quiet palette is on purpose:
// the signal colour lights keywords only, everything else is ink at three weights.
// Used by astro.config.mjs (Markdown/MDX fences) and CodeBlock.astro.

/** @type {import('shiki').ThemeRegistration} */
export const restactTheme = {
  name: 'restact',
  type: 'dark',
  fg: 'var(--ink-2)',
  bg: 'transparent',
  settings: [
    { settings: { foreground: 'var(--ink-2)' } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: 'var(--ink-3)' } },
    {
      scope: ['keyword', 'storage', 'storage.type', 'storage.modifier', 'keyword.control', 'keyword.other',
        'keyword.operator.new', 'keyword.operator.expression', 'keyword.operator.word', 'keyword.operator.logical.python'],
      settings: { foreground: 'var(--signal)' },
    },
    { scope: ['keyword.operator', 'punctuation', 'meta.brace'], settings: { foreground: 'var(--ink-2)' } },
    {
      scope: ['string', 'constant', 'constant.numeric', 'entity.name.function', 'support.function', 'meta.function-call',
        'support.type.property-name', 'entity.name.tag', 'markup.heading'],
      settings: { foreground: 'var(--ink)' },
    },
    { scope: ['source.json string'], settings: { foreground: 'var(--ink-2)' } },
    { scope: ['source.json support.type.property-name', 'source.json string.json support.type.property-name'], settings: { foreground: 'var(--ink)' } },
    { scope: ['entity.name.type', 'support.type', 'support.class', 'variable', 'variable.parameter'], settings: { foreground: 'var(--ink-2)' } },
  ],
};
