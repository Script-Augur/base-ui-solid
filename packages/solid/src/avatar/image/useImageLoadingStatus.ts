import { createEffect, createSignal, onCleanup } from 'solid-js'

import type { ImageLoadingStatus } from '../root/AvatarRoot'
import type { Accessor, JSX } from 'solid-js'
/**
 * Probes image load status with an off-DOM `Image` before mounting the real
 * `<img>`. Solid port of Base UI `useImageLoadingStatus`.
 *
 * @param src - Image URL accessor.
 * @param options - Responsive / CORS options accessors.
 * @returns Loading status accessor.
 */
export function useImageLoadingStatus(
  src: Accessor<string | undefined>,
  options: {
    referrerPolicy: Accessor<UseImageLoadingStatusOptions['referrerPolicy']>
    crossOrigin: Accessor<UseImageLoadingStatusOptions['crossOrigin']>
    sizes: Accessor<UseImageLoadingStatusOptions['sizes']>
    srcSet: Accessor<UseImageLoadingStatusOptions['srcSet']>
  }
): Accessor<ImageLoadingStatus> {
  const [loadingStatus, loadingStatusAssign] =
    createSignal<ImageLoadingStatus>('idle')

  createEffect(() => {
    const currentSrc = src()
    const srcSet = options.srcSet()

    if (!currentSrc && !srcSet) {
      loadingStatusAssign('error')
      return
    }

    let isMounted = true
    const image = new window.Image()

    const updateStatus = (status: ImageLoadingStatus) => () => {
      if (!isMounted) {
        return
      }
      loadingStatusAssign(status)
    }

    loadingStatusAssign('loading')
    image.onload = updateStatus('loaded')
    image.onerror = updateStatus('error')

    const referrerPolicy = options.referrerPolicy()
    if (referrerPolicy) {
      image.referrerPolicy = referrerPolicy
    }
    image.crossOrigin = options.crossOrigin() ?? null

    const sizes = options.sizes()
    if (sizes) {
      image.sizes = sizes
    }
    if (srcSet) {
      image.srcset = srcSet
    }
    if (currentSrc) {
      image.src = currentSrc
    }

    // Fast path for cached/decoded images
    if (image.complete) {
      loadingStatusAssign(image.naturalWidth > 0 ? 'loaded' : 'error')
    }

    onCleanup(() => {
      isMounted = false
    })
  })

  return loadingStatus
}
/**
 * `<img>` attributes forwarded to the off-DOM loading probe so CORS and
 * responsive sources match the rendered image.
 */
interface UseImageLoadingStatusOptions {
  /**
   * Referrer policy applied to the probe (`referrerpolicy` on `<img>`).
   */
  referrerPolicy?: JSX.HTMLAttributes<HTMLImageElement>['referrerPolicy']
  /**
   * CORS mode for the probe (`crossorigin` on `<img>`).
   */
  crossOrigin?: JSX.ImgHTMLAttributes<HTMLImageElement>['crossOrigin']
  /**
   * Layout sizes hint for the probe (`sizes` on `<img>`).
   */
  sizes?: JSX.ImgHTMLAttributes<HTMLImageElement>['sizes']
  /**
   * Responsive candidate set for the probe (`srcset` on `<img>`).
   */
  srcSet?: JSX.ImgHTMLAttributes<HTMLImageElement>['srcSet']
}
