import { mergeProps, splitProps } from 'solid-js'

import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createRender } from '../../internals/createRender'
import { useButton } from '../../internals/useButton'
import { useComboboxRootContext } from '../root/ComboboxRootContext'
import { compareItemEquality } from '../utils/itemEquality'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * Removes a chip's value from the multiple selection.
 * Renders a `<button>` element.
 */
export function ComboboxChipRemove(
  componentProps: ComboboxChipRemoveProps
): JSX.Element {
  const context = useComboboxRootContext()
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
    'nativeButton',
    'value',
  ])

  const { getButtonProps, buttonRefAssign } = useButton({
    disabled: () => context.disabled(),
    native: () => local.nativeButton ?? true,
  })

  const state: ComboboxChipRemoveState = {
    get disabled() {
      return context.disabled()
    },
  }

  return createRender<ComboboxChipRemoveState, Record<string, unknown>>({
    defaultElement: 'button',
    state,
    render: local.render,
    props: mergeProps(
      getButtonProps(
        mergeProps(elementProps as Record<string, unknown>, {
          type: 'button',
          onClick(event: MouseEvent) {
            if (context.disabled() || context.readOnly()) return
            if (!context.multiple()) return
            const current = context.value()
            const list = Array.isArray(current) ? current : []
            const comparer = context.isItemEqualToValue()
            const removeValue = local.value
            const next =
              removeValue === undefined
                ? list.slice(0, -1)
                : list.filter(
                    entry =>
                      !compareItemEquality(removeValue, entry, comparer)
                  )
            context.setValue(
              next,
              createChangeEventDetails(REASONS.chipRemovePress, event)
            )
          },
        }) as Record<string, unknown>
      ),
      {
        get class() {
          return local.class
        },
        get style() {
          return local.style
        },
        get children() {
          return local.children ?? '×'
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
  })
}

export interface ComboboxChipRemoveState extends Record<string, unknown> {
  disabled: boolean
}

export type ComboboxChipRemoveProps = Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'value'
> & {
  /** Value to remove; defaults to last selected when omitted. */
  value?: unknown
  nativeButton?: boolean
  render?: RenderProp<ComboboxChipRemoveState, Record<string, unknown>>
}
