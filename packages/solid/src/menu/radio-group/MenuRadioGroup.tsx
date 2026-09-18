import { createContext, mergeProps, splitProps, useContext  } from 'solid-js'

import { createControlled } from '../../internals/createControlled'
import { createRender } from '../../internals/createRender'

import type {
  BaseUIChangeEventDetails,
  ChangeEventReason,
} from '../../internals/createChangeEventDetails'
import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'
/**
 * Radio group context for menu radio items.
 */
export const MenuRadioGroupContext =
  createContext<MenuRadioGroupContextValue>()
/**
 * Groups mutually exclusive radio items in a menu.
 * Renders a `<div>` with `role="group"`.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuRadioGroup(
  componentProps: MenuRadioGroupProps
): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
    'value',
    'defaultValue',
    'onValueChange',
    'disabled',
  ])

  const [value, valueAssign] = createControlled({
    value: () => local.value,
    defaultValue: local.defaultValue ?? null,
  })

  const disabled = () => local.disabled ?? false

  return (
    <MenuRadioGroupContext.Provider
      value={{
        value,
        valueAssign,
        disabled,
        onValueChange: local.onValueChange,
      }}
    >
      {createRender<MenuRadioGroupState, Record<string, unknown>>({
        defaultElement: 'div',
        state: {
          get disabled() {
            return disabled()
          },
        },
        render: local.render,
        mapStateToDataAttributes: false,
        props: mergeProps(elementProps as Record<string, unknown>, {
          role: 'group',
          get class() {
            return local.class
          },
          get style() {
            return local.style
          },
          children: local.children,
          ref: local.ref,
        }),
      })}
    </MenuRadioGroupContext.Provider>
  )
}
/**
 * Reads radio group context.
 */
export function useMenuRadioGroupContext(): MenuRadioGroupContextValue {
  const ctx = useContext(MenuRadioGroupContext)
  if (!ctx) {
    throw new Error(
      'Base UI: Menu.RadioItem must be used within Menu.RadioGroup.'
    )
  }
  return ctx
}
/** Context value for radio group. */
export type MenuRadioGroupContextValue = {
  value: () => unknown
  valueAssign: (next: unknown) => void
  disabled: () => boolean
  onValueChange?: (
    value: unknown,
    eventDetails: BaseUIChangeEventDetails<ChangeEventReason>
  ) => void
}
/** Public state for {@link MenuRadioGroup}. */
export interface MenuRadioGroupState extends Record<string, unknown> {
  disabled: boolean
}
/** Props for {@link MenuRadioGroup}. */
export type MenuRadioGroupProps = JSX.HTMLAttributes<HTMLDivElement> & {
  value?: unknown
  /**
   * @default null
   */
  defaultValue?: unknown
  onValueChange?: (
    value: unknown,
    eventDetails: BaseUIChangeEventDetails<ChangeEventReason>
  ) => void
  disabled?: boolean
  render?: RenderProp<MenuRadioGroupState, Record<string, unknown>>
}
