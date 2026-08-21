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
export { Separator, SeparatorDataAttributes } from './separator'
export { Toggle, ToggleDataAttributes } from './toggle'
export {
  ToggleGroup,
  ToggleGroupDataAttributes,
  ToggleGroupContext,
  useToggleGroupContext,
} from './toggle-group'
export {
  Collapsible,
  CollapsibleRoot,
  CollapsibleRootDataAttributes,
  CollapsibleRootContext,
  useCollapsibleRootContext,
  CollapsibleTrigger,
  CollapsibleTriggerDataAttributes,
  CollapsiblePanel,
  CollapsiblePanelDataAttributes,
  CollapsiblePanelCssVars,
} from './collapsible'
export {
  Accordion,
  AccordionRoot,
  AccordionRootDataAttributes,
  AccordionRootContext,
  useAccordionRootContext,
  AccordionItem,
  AccordionItemDataAttributes,
  AccordionItemContext,
  useAccordionItemContext,
  AccordionHeader,
  AccordionHeaderDataAttributes,
  AccordionTrigger,
  AccordionTriggerDataAttributes,
  AccordionPanel,
  AccordionPanelDataAttributes,
  AccordionPanelCssVars,
} from './accordion'
export {
  createControlled,
  createChangeEventDetails,
  REASONS,
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
export type { Orientation, SeparatorProps, SeparatorState } from './separator'
export type {
  ToggleChangeEventDetails,
  ToggleChangeEventReason,
  ToggleProps,
  ToggleState,
} from './toggle'
export type {
  ToggleGroupChangeEventDetails,
  ToggleGroupChangeEventReason,
  ToggleGroupContextValue,
  ToggleGroupProps,
  ToggleGroupState,
} from './toggle-group'
export type {
  CollapsibleRootChangeEventDetails,
  CollapsibleRootChangeEventReason,
  CollapsibleRootContextValue,
  CollapsibleRootProps,
  CollapsibleRootState,
  CollapsibleTriggerProps,
  CollapsibleTriggerState,
  CollapsiblePanelProps,
  CollapsiblePanelState,
} from './collapsible'
export type {
  AccordionRootChangeEventDetails,
  AccordionRootChangeEventReason,
  AccordionRootContextValue,
  AccordionRootProps,
  AccordionRootState,
  AccordionValue,
  AccordionItemChangeEventDetails,
  AccordionItemChangeEventReason,
  AccordionItemContextValue,
  AccordionItemProps,
  AccordionItemState,
  AccordionHeaderProps,
  AccordionHeaderState,
  AccordionTriggerProps,
  AccordionTriggerState,
  AccordionPanelProps,
  AccordionPanelState,
} from './accordion'
export type {
  CreateControlledOptions,
  ControlledSetter,
  ControlledSignal,
  BaseUIChangeEventDetails,
  ChangeEventReason,
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
