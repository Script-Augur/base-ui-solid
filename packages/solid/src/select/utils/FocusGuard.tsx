import { mergeProps } from 'solid-js'

import { visuallyHiddenStyle } from './visuallyHidden'

import type { JSX } from 'solid-js'

/**
 * Focus trap sentinel used for non-modal portal tab order.
 * Copied from `popover/utils/FocusGuard`.
 *
 * @param props - Span attributes (`onFocus`, refs, …).
 * @returns A visually hidden focusable `<span>`.
 */
export function FocusGuard(props: FocusGuardProps): JSX.Element {
  return (
    <span
      {...mergeProps(
        {
          'data-base-ui-focus-guard': '',
          'aria-hidden': true,
          tabIndex: 0,
          style: visuallyHiddenStyle,
        },
        props
      )}
    />
  )
}

/** Props for {@link FocusGuard}. */
export type FocusGuardProps = JSX.HTMLAttributes<HTMLSpanElement>
