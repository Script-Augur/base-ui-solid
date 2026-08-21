/**
 * Public package entry — core primitives for the Base UI Solid port.
 *
 * Upstream pin: `@base-ui/react@1.7.0` (see `UPSTREAM.md`).
 *
 * @example
 * ```tsx
 * import {
 *   createControlled,
 *   DirectionProvider,
 *   version,
 * } from "@script-augur/base-ui-solid"
 *
 * console.log(version)
 * ```
 */

/** Package semver string for the current build (from `package.json` at build time). */
export const version: string = __PACKAGE_VERSION__

/** npm package name (from `package.json` at build time). */
export const PACKAGE_NAME: string = __PACKAGE_NAME__

export {
  createControlled,
  createRender,
  splitRenderProps,
  useRender,
  mergeAttrs,
  dataAttr,
  callHandler,
  useFloating,
  offset,
  flip,
  shift,
  arrow,
  autoUpdate,
  computePosition,
  createFocusTrap,
  createDismiss,
  createScrollLock,
  DirectionProvider,
  useDirection,
  DirectionContext,
} from './internals'

export type {
  CreateControlledOptions,
  ControlledSetter,
  ControlledSignal,
  CreateRenderOptions,
  RenderProp,
  RenderFunction,
  PolymorphicProps,
  NativeProps,
  RenderFn,
  UseRenderOptions,
  UseFloatingOptions,
  UseFloatingReturn,
  FloatingStyles,
  Placement,
  Strategy,
  Middleware,
  FocusTrapOptions,
  DismissOptions,
  TextDirection,
  DirectionProviderProps,
  DirectionContextValue,
} from './internals'
