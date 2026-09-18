/**
 * CSS custom properties for {@link ToastPositioner}.
 *
 * **Lite:** `--available-*` and `--anchor-*` are declared for API parity with
 * `@base-ui/react@1.7.0` but are **not written** onto the positioner element
 * until size/hide middleware is ported. Only `--transform-origin` is applied.
 */
export enum ToastPositionerCssVars {
  /**
   * The available width between the anchor and the edge of the viewport.
   * **Lite stub — not set on the element today.**
   * @type {number}
   */
  availableWidth = '--available-width',
  /**
   * The available height between the anchor and the edge of the viewport.
   * **Lite stub — not set on the element today.**
   * @type {number}
   */
  availableHeight = '--available-height',
  /**
   * The anchor's width.
   * **Lite stub — not set on the element today.**
   * @type {number}
   */
  anchorWidth = '--anchor-width',
  /**
   * The anchor's height.
   * **Lite stub — not set on the element today.**
   * @type {number}
   */
  anchorHeight = '--anchor-height',
  /**
   * The coordinates that this element is anchored to. Used for animations and transitions.
   * @type {string}
   */
  transformOrigin = '--transform-origin',
}
