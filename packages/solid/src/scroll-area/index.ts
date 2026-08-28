export * as ScrollArea from './index.parts'

export { ScrollAreaRoot } from './root/ScrollAreaRoot'
export {
  ScrollAreaRootContext,
  useScrollAreaRootContext,
} from './root/ScrollAreaRootContext'
export { ScrollAreaRootCssVars } from './root/ScrollAreaRootCssVars'
export { ScrollAreaRootDataAttributes } from './root/ScrollAreaRootDataAttributes'
export { ScrollAreaViewport } from './viewport/ScrollAreaViewport'
export {
  ScrollAreaViewportContext,
  useScrollAreaViewportContext,
} from './viewport/ScrollAreaViewportContext'
export { ScrollAreaViewportCssVars } from './viewport/ScrollAreaViewportCssVars'
export { ScrollAreaViewportDataAttributes } from './viewport/ScrollAreaViewportDataAttributes'
export { ScrollAreaScrollbar } from './scrollbar/ScrollAreaScrollbar'
export {
  ScrollAreaScrollbarContext,
  useScrollAreaScrollbarContext,
} from './scrollbar/ScrollAreaScrollbarContext'
export { ScrollAreaScrollbarCssVars } from './scrollbar/ScrollAreaScrollbarCssVars'
export { ScrollAreaScrollbarDataAttributes } from './scrollbar/ScrollAreaScrollbarDataAttributes'
export { ScrollAreaContent } from './content/ScrollAreaContent'
export { ScrollAreaContentDataAttributes } from './content/ScrollAreaContentDataAttributes'
export { ScrollAreaThumb } from './thumb/ScrollAreaThumb'
export { ScrollAreaThumbDataAttributes } from './thumb/ScrollAreaThumbDataAttributes'
export { ScrollAreaCorner } from './corner/ScrollAreaCorner'

export type {
  ScrollAreaRootProps,
  ScrollAreaRootState,
  HiddenState,
  OverflowEdges,
  Size,
  Coords,
} from './root/ScrollAreaRoot'
export type {
  ScrollAreaRootContextValue,
  ScrollAreaRootRefs,
} from './root/ScrollAreaRootContext'
export type {
  ScrollAreaViewportProps,
  ScrollAreaViewportState,
} from './viewport/ScrollAreaViewport'
export type { ScrollAreaViewportContextValue } from './viewport/ScrollAreaViewportContext'
export type {
  ScrollAreaScrollbarProps,
  ScrollAreaScrollbarState,
} from './scrollbar/ScrollAreaScrollbar'
export type { ScrollAreaScrollbarOrientation } from './scrollbar/ScrollAreaScrollbarContext'
export type {
  ScrollAreaContentProps,
  ScrollAreaContentState,
} from './content/ScrollAreaContent'
export type {
  ScrollAreaThumbProps,
  ScrollAreaThumbState,
} from './thumb/ScrollAreaThumb'
export type {
  ScrollAreaCornerProps,
  ScrollAreaCornerState,
} from './corner/ScrollAreaCorner'
