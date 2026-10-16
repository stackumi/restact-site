/** Copy-to-clipboard for code blocks, shared by CodeBlock.astro and the Docs layout. */

/** The text of a <pre>, without hand-marked shell prompts. */
function textOf(pre: Element): string {
  const clone = pre.cloneNode(true) as Element;
  clone.querySelectorAll('.c-prompt').forEach((el) => el.remove());
  return (clone.textContent ?? '').replace(/\n$/, '');
}

/** Wire a button to copy `pre`, announcing the result in `status` (a polite live region). */
export function wireCopy(button: HTMLButtonElement, pre: Element, status: HTMLElement | null) {
  const idle = button.textContent ?? 'Copy';
  button.addEventListener('click', async () => {
    let ok = true;
    try {
      await navigator.clipboard.writeText(textOf(pre));
    } catch {
      ok = false;
    }
    button.textContent = ok ? 'Copied' : 'Copy failed';
    if (status) status.textContent = ok ? 'Copied to clipboard' : 'Could not copy to the clipboard';
    window.setTimeout(() => {
      button.textContent = idle;
      if (status) status.textContent = '';
    }, 1800);
  });
}
