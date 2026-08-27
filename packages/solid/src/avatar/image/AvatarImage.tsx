import {
  Show,
  createEffect,
  createSignal,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import { createOpenChangeComplete } from '../../internals/createOpenChangeComplete'
import { createRender } from '../../internals/createRender'
import { createTransitionStatus } from '../../internals/createTransitionStatus'
import { dataAttr } from '../../internals/useRender'
import { useAvatarRootContext } from '../root/AvatarRootContext'

import { AvatarImageDataAttributes } from './AvatarImageDataAttributes'
import { useImageLoadingStatus } from './useImageLoadingStatus'

import type { RenderProp } from '../../internals/createRender'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { AvatarRootState, ImageLoadingStatus } from '../root/AvatarRoot'
import type { JSX } from 'solid-js'

/**
 * The image to be displayed in the avatar.
 * Renders an `<img>` element.
 *
 * Documentation: [Base UI Avatar](https://base-ui.com/react/components/avatar)
 *
 * @param componentProps - Image props (`src`, `onLoadingStatusChange`, …).
 * @returns A Solid JSX element.
 */
export function AvatarImage(componentProps: AvatarImageProps): JSX.Element {
  const context = useAvatarRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'onLoadingStatusChange',
    'ref',
  ])

  const src = () =>
    (elementProps as JSX.ImgHTMLAttributes<HTMLImageElement>).src
  const srcSet = () =>
    (elementProps as JSX.ImgHTMLAttributes<HTMLImageElement>).srcSet
  const sizes = () =>
    (elementProps as JSX.ImgHTMLAttributes<HTMLImageElement>).sizes
  const crossOrigin = () =>
    (elementProps as JSX.ImgHTMLAttributes<HTMLImageElement>).crossOrigin
  const referrerPolicy = () =>
    (elementProps as JSX.ImgHTMLAttributes<HTMLImageElement>).referrerPolicy

  const imageLoadingStatus = useImageLoadingStatus(src, {
    referrerPolicy,
    crossOrigin,
    sizes,
    srcSet,
  })

  const isVisible = () => imageLoadingStatus() === 'loaded'
  const { mounted, mountedAssign, transitionStatus } =
    createTransitionStatus(isVisible)

  const [imageElement, imageElementAssign] =
    createSignal<HTMLImageElement | null>(null)

  createEffect(() => {
    const status = imageLoadingStatus()
    if (status !== 'idle') {
      local.onLoadingStatusChange?.(status)
      context.imageLoadingStatusAssign(status)
    }
  })

  onCleanup(() => {
    context.imageLoadingStatusAssign('idle')
  })

  createOpenChangeComplete({
    open: isVisible,
    element: imageElement,
    onComplete() {
      if (!isVisible()) {
        mountedAssign(false)
      }
    },
  })

  const state: AvatarImageState = {
    get imageLoadingStatus() {
      return imageLoadingStatus()
    },
    get transitionStatus() {
      return transitionStatus()
    },
  }

  return (
    <Show when={mounted()}>
      {createRender<AvatarImageState, Record<string, unknown>>({
        defaultElement: 'img',
        state,
        render: local.render,
        props: mergeProps(elementProps as Record<string, unknown>, {
          get class() {
            return local.class
          },
          get style() {
            return local.style
          },
          get [AvatarImageDataAttributes.startingStyle]() {
            return dataAttr(transitionStatus() === 'starting')
          },
          get [AvatarImageDataAttributes.endingStyle]() {
            return dataAttr(transitionStatus() === 'ending')
          },
        }),
        ref: [
          local.ref as
            ((el: Element) => void) | { current: Element | null } | undefined,
          (el: Element | null) => {
            imageElementAssign(el as HTMLImageElement | null)
          },
        ],
      })}
    </Show>
  )
}
/** Public state exposed to `render` functions. */
export interface AvatarImageState extends AvatarRootState {
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus
}
/** Props for {@link AvatarImage}. */
export type AvatarImageProps = JSX.ImgHTMLAttributes<HTMLImageElement> & {
  /**
   * Callback fired when the loading status changes.
   */
  onLoadingStatusChange?: (status: ImageLoadingStatus) => void
  /** Base UI-style render prop for host element composition. */
  render?: RenderProp<AvatarImageState, Record<string, unknown>>
}
