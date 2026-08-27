/**
 * Root state → data-attribute mapping. Image loading status is not exposed as
 * a data attribute on the root (matches upstream).
 */
export const avatarStateAttributesMapping = {
  imageLoadingStatus: () => null,
}
