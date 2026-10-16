/**
 * Marks up a terminal session or wire example for CodeBlock's `html` prop, so the verb's colon and
 * the prompt can be lit without hand-writing spans (and without escaping braces in .astro files).
 *
 * The input is plain text, escaped here. Markers:
 *   a line starting with "$ "  the shell prompt (dimmed, not copied)
 *   ¦                          a signal-coloured colon: the verb separator in a route
 *   «text»                     bright output (response lines, values)
 *   ‹text›                     action colour (POST tags, error codes)
 *   ⟨text⟩                     dimmed (comments)
 */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function term(src: string): string {
  return esc(src.replace(/^\n/, '').replace(/\n$/, ''))
    .replace(/^\$ /gm, '<span class="c-prompt">$ </span>')
    .replace(/¦/g, '<span class="c-sig">:</span>')
    .replace(/«([^»]*)»/g, '<span class="c-out">$1</span>')
    .replace(/‹([^›]*)›/g, '<span class="c-act">$1</span>')
    .replace(/⟨([^⟩]*)⟩/g, '<span class="c-dim">$1</span>');
}
