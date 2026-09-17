import { mergeProps, splitProps } from 'solid-js'

import type { JSX } from 'solid-js'

/**
 * Full-viewport inert layer used for modal popovers so outside presses hit a
 * known backdrop element (upstream `InternalBackdrop`).
 *
 * @param componentProps - Backdrop props (`inert`, `ref`, …).
 * @returns A fixed `role="presentation"` div.
 */
export function InternalBackdrop(
  componentProps: InternalBackdropProps
): JSX.Element {
  const [local, rest] = splitProps(componentProps, ['style', 'ref'])

  return (
    <div
      role="presentation"
      data-base-ui-inert=""
      {...mergeProps(
        {
          get style() {
            const base: JSX.CSSProperties = {
              position: 'fixed',
              inset: '0',
              'user-select': 'none',
              '-webkit-user-select': 'none',
            }
            const user = local.style
            if (user && typeof user === 'object' && !Array.isArray(user)) {
              return { ...base, ...user }
            }
            return base
          },
          ref: local.ref,
        },
        rest
      )}
    />
  )
}

/** Props for {@link InternalBackdrop}. */
export type InternalBackdropProps = JSX.HTMLAttributes<HTMLDivElement>
