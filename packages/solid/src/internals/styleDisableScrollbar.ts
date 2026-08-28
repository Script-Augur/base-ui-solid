/**
 * Injects a shared stylesheet that hides native scrollbars on elements with
 * {@link styleDisableScrollbar.className}.
 *
 * Upstream React uses a JSX `<style>` with CSP nonce / precedence. We do not
 * have a CSP provider yet — nonce / `disableStyleElements` are omitted.
 * See Scroll Area `UPSTREAM_TEST_PARITY.md`.
 */

const DISABLE_SCROLLBAR_CLASS_NAME = 'base-ui-disable-scrollbar'
const STYLE_CSS = `.${DISABLE_SCROLLBAR_CLASS_NAME}{scrollbar-width:none}.${DISABLE_SCROLLBAR_CLASS_NAME}::-webkit-scrollbar{display:none}`
/** Stable `id` / `name` for the injected `<style>` element. */
export const STYLE_TAG_ID = 'base-ui-disable-scrollbar'
export const styleDisableScrollbar = {
  className: DISABLE_SCROLLBAR_CLASS_NAME,
  /** Creates a `<style>` element for appending to `document.head`. */
  createElement(): HTMLStyleElement {
    const el = document.createElement('style')
    el.id = STYLE_TAG_ID
    // `namedItem` lookup in Root uses the `name` property.
    el.setAttribute('name', STYLE_TAG_ID)
    el.textContent = STYLE_CSS
    return el
  },
}
/**
 * Ensures the disable-scrollbar stylesheet is present in `document.head`.
 * Idempotent across multiple ScrollArea roots.
 *
 * @returns Cleanup that removes the style node when the last caller unmounts.
 */
export function ensureDisableScrollbarStyle(): () => void {
  if (typeof document === 'undefined') {
    return () => {}
  }

  const existing = document.head
    .getElementsByTagName('style')
    .namedItem(STYLE_TAG_ID)
  if (existing) {
    return () => {}
  }

  const el = styleDisableScrollbar.createElement()
  document.head.appendChild(el)
  return () => {
    if (document.head.getElementsByTagName('style').namedItem(STYLE_TAG_ID)) {
      el.remove()
    }
  }
}
