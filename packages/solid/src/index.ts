/**
 * Public package entry — Base UI Solid port.
 *
 * Upstream pin: `@base-ui/react@1.7.0` (see `UPSTREAM.md`).
 *
 * @example
 * ```tsx
 * import { Button, version } from "@script-augur/base-ui-solid"
 * // or: import { Button } from "@script-augur/base-ui-solid/button"
 *
 * <Button onClick={() => {}}>Save</Button>
 * ```
 */

/** Package semver string for the current build (from `package.json` at build time). */
export const version: string = __PACKAGE_VERSION__

/** npm package name (from `package.json` at build time). */
export const PACKAGE_NAME: string = __PACKAGE_NAME__

export { Button, ButtonDataAttributes } from './button'
export {
  createControlled,
  createRender,
  splitRenderProps,
  useRender,
  mergeAttrs,
  dataAttr,
  callHandler,
  useButton,
  useFocusableWhenDisabled,
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

export type { ButtonProps, ButtonState } from './button'
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
  UseButtonParameters,
  UseButtonReturnValue,
  UseFocusableWhenDisabledParameters,
  UseFocusableWhenDisabledReturnValue,
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
