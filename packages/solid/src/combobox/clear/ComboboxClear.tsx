import { Show, mergeProps, splitProps } from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createRender } from '../../internals/createRender'
import { useButton } from '../../internals/useButton'
import { useComboboxRootContext } from '../root/ComboboxRootContext'

import { ComboboxClearDataAttributes } from './ComboboxClearDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { JSX } from 'solid-js'

/**
 * Clears the value when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 *
 * @param componentProps - Clear props.
 * @returns A Solid JSX element.
 */
export function ComboboxClear(componentProps: ComboboxClearProps): JSX.Element {
  const context = useComboboxRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'disabled',
    'nativeButton',
    'keepMounted',
    'children',
    'ref',
  ])

  const disabled = () => context.disabled() || Boolean(local.disabled)

  const hasValue = () => {
    const current = context.value()
    if (context.multiple()) {
      return Array.isArray(current) && current.length > 0
    }
    return current != null
  }

  const visible = () =>
    hasValue() || Boolean(context.inputValue())

  const { getButtonProps, buttonRefAssign } = useButton({
    disabled,
    native: () => local.nativeButton ?? true,
  })

  function clear(event: Event) {
    if (disabled() || context.readOnly()) return
    const details = createChangeEventDetails(REASONS.clearPress, event)
    context.setValue(context.multiple() ? [] : null, details)
    if (details.isCanceled) return
    context.setInputValue(
      '',
      createChangeEventDetails(REASONS.inputClear, event)
    )
  }

  const state: ComboboxClearState = {
    get open() {
      return context.open()
    },
    get disabled() {
      return disabled()
    },
    get visible() {
      return visible()
    },
    get transitionStatus() {
      return context.transitionStatus()
    },
  }

  const shouldRender = () => local.keepMounted || visible()

  return (
    <Show when={shouldRender()}>
      {createRender<ComboboxClearState, Record<string, unknown>>({
        defaultElement: 'button',
        state,
        render: local.render,
        mapStateToDataAttributes: true,
        stateAttributesMapping: {
          visible(value: unknown) {
            return value ? { [ComboboxClearDataAttributes.visible]: '' } : null
          },
          disabled(value: unknown) {
            return value
              ? { [ComboboxClearDataAttributes.disabled]: '' }
              : null
          },
        },
        props: mergeProps(
          getButtonProps(
            mergeProps(elementProps as Record<string, unknown>, {
              type: 'button',
              onClick(event: MouseEvent) {
                clear(event)
              },
            }) as Record<string, unknown>
          ),
          {
            get 'aria-hidden'() {
              return visible() ? undefined : true
            },
            get tabIndex() {
              return visible() ? 0 : -1
            },
            get class() {
              return local.class
            },
            get style() {
              return local.style
            },
            get children() {
              return local.children ?? 'Clear'
            },
            ref(element: HTMLElement) {
              buttonRefAssign(element)
              const userRef = local.ref
              if (typeof userRef === 'function') {
                userRef(element as HTMLButtonElement)
              }
            },
          }
        ),
      })}
    </Show>
  )
}

/** Public state for {@link ComboboxClear}. */
export interface ComboboxClearState extends Record<string, unknown> {
  open: boolean
  disabled: boolean
  visible: boolean
  transitionStatus: TransitionStatus
}

/** Props for {@link ComboboxClear}. */
export type ComboboxClearProps = Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'disabled'
> & {
  disabled?: boolean
  nativeButton?: boolean
  /**
   * Whether the component should remain mounted when not visible.
   * @default false
   */
  keepMounted?: boolean
  render?: RenderProp<ComboboxClearState, Record<string, unknown>>
}
