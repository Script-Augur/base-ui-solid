import type { JSX } from 'solid-js'

/**
 * Visually-hidden style for focus guards and `aria-owns` anchors.
 * Copied from `popover/utils/visuallyHidden`.
 */
export const visuallyHiddenStyle = {
  'clip-path': 'inset(50%)',
  overflow: 'hidden',
  'white-space': 'nowrap',
  border: 0,
  padding: 0,
  width: '1px',
  height: '1px',
  margin: '-1px',
  position: 'fixed',
  top: 0,
  left: 0,
} as JSX.CSSProperties
