/**
 * Styles that hide an element visually while keeping it available to assistive
 * technology / layout where needed.
 *
 * Matches `@base-ui/utils/visuallyHidden`.
 */
export const visuallyHidden = {
  clipPath: 'inset(50%)',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  border: 0,
  padding: 0,
  width: '1px',
  height: '1px',
  margin: '-1px',
  position: 'fixed',
  top: 0,
  left: 0,
} as const

/**
 * Visually hidden styles for form inputs that participate in layout via
 * `position: absolute` (so they still associate with labels / forms).
 *
 * Matches `@base-ui/utils/visuallyHiddenInput`.
 */
export const visuallyHiddenInput = {
  clipPath: 'inset(50%)',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  border: 0,
  padding: 0,
  width: '1px',
  height: '1px',
  margin: '-1px',
  position: 'absolute',
} as const
