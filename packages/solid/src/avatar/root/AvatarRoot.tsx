import { createSignal, mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'

import { AvatarRootContext } from './AvatarRootContext'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * Displays a user's profile picture, initials, or fallback icon.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Avatar](https://base-ui.com/react/components/avatar)
 *
 * @param componentProps - Root props (`render`, …).
 * @returns A Solid JSX element.
 *
 * @example
 * ```tsx
 * import { Avatar } from "@script-augur/base-ui-solid/avatar"
 *
 * <Avatar.Root>
 *   <Avatar.Image src="/me.png" alt="Jane" />
 *   <Avatar.Fallback>JD</Avatar.Fallback>
 * </Avatar.Root>
 * ```
 */
export function AvatarRoot(componentProps: AvatarRootProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const [imageLoadingStatus, imageLoadingStatusAssign] =
    createSignal<ImageLoadingStatus>('idle')

  const state: AvatarRootState = {
    get imageLoadingStatus() {
      return imageLoadingStatus()
    },
  }

  const contextValue = {
    imageLoadingStatus,
    imageLoadingStatusAssign,
  }

  return (
    <AvatarRootContext.Provider value={contextValue}>
      {createRender<AvatarRootState, Record<string, unknown>>({
        defaultElement: 'span',
        state,
        render: local.render,
        props: mergeProps(elementProps as Record<string, unknown>, {
          get class() {
            return local.class
          },
          get style() {
            return local.style
          },
          get children() {
            return local.children
          },
          ref: local.ref,
        }),
      })}
    </AvatarRootContext.Provider>
  )
}

/** Image loading lifecycle shared by Avatar parts. */
export type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error'

/**
 * Public state exposed to `render` functions.
 */
export interface AvatarRootState extends Record<string, unknown> {
  /**
   * The image loading status.
   */
  imageLoadingStatus: ImageLoadingStatus
}

/**
 * Props for {@link AvatarRoot}.
 */
export type AvatarRootProps = JSX.HTMLAttributes<HTMLSpanElement> & {
  /** Base UI-style render prop for host element composition. */
  render?: RenderProp<AvatarRootState, Record<string, unknown>>
}
