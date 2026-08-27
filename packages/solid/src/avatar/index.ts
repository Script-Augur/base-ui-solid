export * as Avatar from './index.parts'

export { AvatarRoot } from './root/AvatarRoot'
export {
  AvatarRootContext,
  useAvatarRootContext,
} from './root/AvatarRootContext'
export { AvatarImage } from './image/AvatarImage'
export { AvatarImageDataAttributes } from './image/AvatarImageDataAttributes'
export { AvatarFallback } from './fallback/AvatarFallback'

export type {
  AvatarRootProps,
  AvatarRootState,
  ImageLoadingStatus,
} from './root/AvatarRoot'
export type { AvatarRootContextValue } from './root/AvatarRootContext'
export type { AvatarImageProps, AvatarImageState } from './image/AvatarImage'
export type {
  AvatarFallbackProps,
  AvatarFallbackState,
} from './fallback/AvatarFallback'
