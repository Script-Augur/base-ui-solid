/**
 * Minimal platform detection (SSR-safe). Prefer importing only what you need so
 * unused checks tree-shake when bundled.
 *
 * Upstream `@base-ui/utils/platform` is larger; we stub the WebKit engine check
 * used by Scroll Area CSS variable registration.
 */

/**
 * WebKit (Safari, all iOS browsers, GNOME Web). Distinguished from Blink by
 * support for the legacy `-webkit-backdrop-filter` name.
 */
export const isWebkitEngine =
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('-webkit-backdrop-filter:none')

/** Namespace-style access matching upstream `platform.engine.webkit`. */
export const platform = {
  engine: {
    webkit: isWebkitEngine,
  },
}
