import { createContext, useContext } from 'solid-js'

import type { ImageLoadingStatus } from './AvatarRoot'
import type { Accessor, Setter } from 'solid-js'

const AvatarRootContext = createContext<AvatarRootContextValue | undefined>(
  undefined
)

export { AvatarRootContext }

/**
 * Reads the nearest {@link AvatarRoot} context.
 *
 * @returns Context value.
 * @throws If used outside an Avatar root.
 */
export function useAvatarRootContext(): AvatarRootContextValue {
  const context = useContext(AvatarRootContext)
  if (context) return context

  throw new Error(
    'Base UI: AvatarRootContext is missing. Avatar parts must be placed within <Avatar.Root>.'
  )
}

/**
 * Shared state for avatar parts nested under {@link AvatarRoot}.
 */
export interface AvatarRootContextValue {
  /** Current image loading status. */
  imageLoadingStatus: Accessor<ImageLoadingStatus>
  /** Updates the image loading status. */
  imageLoadingStatusAssign: Setter<ImageLoadingStatus>
}
