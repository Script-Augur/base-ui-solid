/**
 * Minimal platform detection (SSR-safe). Prefer importing only what you need so
 * unused checks tree-shake when bundled.
 *
 * Subset of upstream `@base-ui/utils/platform` covering traits used by Scroll
 * Area and Number Field (WebKit / Gecko / iOS).
 */

const raw = readRawData()
const lowerUserAgent = raw.userAgent.toLowerCase()
const lowerPlatform = raw.platform.toLowerCase()
const maxTouchPoints = raw.maxTouchPoints
/** iPhone, iPad (including iPadOS 13+ reporting as macOS), iPod. */
const ios =
  /^i(os$|p)/.test(lowerPlatform) ||
  (lowerPlatform === 'macintel' && maxTouchPoints > 1)
/**
 * WebKit (Safari, all iOS browsers, GNOME Web). Distinguished from Blink by
 * support for the legacy `-webkit-backdrop-filter` name.
 */
const webkitEngine =
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('-webkit-backdrop-filter:none')
/** Gecko: Firefox (excludes Firefox-on-iOS which is WebKit). */
const gecko = !webkitEngine && lowerUserAgent.includes('firefox')
export const isWebkitEngine = webkitEngine
/** Namespace-style access matching upstream `platform`. */
export const platform = {
  os: {
    ios,
  },
  engine: {
    webkit: webkitEngine,
    gecko,
  },
}
function readRawData(): RawNavigatorData {
  if (typeof navigator === 'undefined') {
    return { userAgent: '', platform: '', maxTouchPoints: 0 }
  }

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
  }
}
interface RawNavigatorData {
  readonly userAgent: string
  readonly platform: string
  readonly maxTouchPoints: number
}
