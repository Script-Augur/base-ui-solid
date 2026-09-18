import {
  createEffect,
  createUniqueId,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import { ACTIVE_COMPOSITE_ITEM } from '../../internals/composite/constants'
import { useCompositeItem } from '../../internals/composite/item/useCompositeItem'
import { useCompositeRootContext } from '../../internals/composite/root/CompositeRootContext'
import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createRender } from '../../internals/createRender'
import { useButton } from '../../internals/useButton'
import { useComboboxRootContext } from '../root/ComboboxRootContext'
import { compareItemEquality } from '../utils/itemEquality'

import { ComboboxItemContext } from './ComboboxItemContext'
import { ComboboxItemDataAttributes } from './ComboboxItemDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * An individual selectable item in the combobox popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 *
 * @param componentProps - Item props (`value`, `disabled`, …).
 * @returns A Solid JSX element.
 */
export function ComboboxItem<TValue = unknown>(
  componentProps: ComboboxItemProps<TValue>
): JSX.Element {
  const context = useComboboxRootContext()
  const compositeRoot = useCompositeRootContext()

  const [local, elementProps] = splitProps(
    componentProps as ComboboxItemProps<unknown> & Record<string, unknown>,
    ['render', 'class', 'style', 'children', 'value', 'disabled', 'id', 'ref']
  )

  const disabled = () => context.disabled() || Boolean(local.disabled)

  const generatedId = createUniqueId()
  const id = () => local.id ?? generatedId

  const matches = () => context.matchesQuery(local.value)

  createEffect(() => {
    if (!matches()) {
      context.unregisterVisibleItem(id())
      return
    }
    context.registerVisibleItem(id())
    onCleanup(() => context.unregisterVisibleItem(id()))
  })

  const selected = (): boolean => {
    const current = context.value()
    const comparer = context.isItemEqualToValue()
    if (context.multiple()) {
      return (
        Array.isArray(current) &&
        current.some(entry => compareItemEquality(local.value, entry, comparer))
      )
    }
    return compareItemEquality(local.value, current, comparer)
  }

  const { compositeProps, compositeRef, index } = useCompositeItem<
    ComboboxItemMetadata<unknown>
  >({
    metadata: () => ({ value: local.value, disabled: disabled() }),
  })

  const highlighted = () =>
    index() >= 0 && compositeRoot.highlightedIndex() === index()

  const { getButtonProps, buttonRefAssign } = useButton({
    disabled,
    native: () => false,
    composite: () => true,
    tabIndex: () => compositeProps().tabIndex as number,
  })

  const itemContext = { selected, index }

  function commitSelection(event: Event) {
    if (disabled() || context.readOnly()) return

    const details = createChangeEventDetails(REASONS.itemPress, event)

    if (context.multiple()) {
      const current = context.value()
      const list = Array.isArray(current) ? current : []
      const comparer = context.isItemEqualToValue()
      const alreadySelected = list.some(entry =>
        compareItemEquality(local.value, entry, comparer)
      )
      const next = alreadySelected
        ? list.filter(
            entry => !compareItemEquality(local.value, entry, comparer)
          )
        : [...list, local.value]
      context.setValue(next, details)
      return
    }

    context.setValue(local.value, details)
    if (details.isCanceled) return

    const label = context.fillInputFromValue(local.value)
    context.setInputValue(
      label,
      createChangeEventDetails(REASONS.itemPress, event)
    )
    context.setOpen(false, createChangeEventDetails(REASONS.itemPress, event))
  }

  const state: ComboboxItemState = {
    get selected() {
      return selected()
    },
    get disabled() {
      return disabled()
    },
    get highlighted() {
      return highlighted()
    },
  }

  return (
    <ComboboxItemContext.Provider value={itemContext}>
      {createRender<ComboboxItemState, Record<string, unknown>>({
        defaultElement: 'div',
        state,
        render: local.render,
        mapStateToDataAttributes: true,
        stateAttributesMapping: {
          selected(value: unknown) {
            return value ? { [ComboboxItemDataAttributes.selected]: '' } : null
          },
          disabled(value: unknown) {
            return value ? { [ComboboxItemDataAttributes.disabled]: '' } : null
          },
          highlighted(value: unknown) {
            return value
              ? { [ComboboxItemDataAttributes.highlighted]: '' }
              : null
          },
        },
        props: mergeProps(
          getButtonProps(
            mergeProps(
              elementProps as Record<string, unknown>,
              compositeProps,
              {
                onClick(event: MouseEvent) {
                  commitSelection(event)
                },
              }
            ) as Record<string, unknown>
          ),
          {
            get id() {
              return id()
            },
            role: 'option',
            get 'aria-selected'() {
              return selected()
            },
            get 'aria-disabled'() {
              return disabled() || undefined
            },
            get ['attr:hidden']() {
              return matches() ? undefined : true
            },
            get [ACTIVE_COMPOSITE_ITEM as string]() {
              return selected() ? '' : undefined
            },
            get class() {
              return local.class
            },
            get style() {
              return local.style
            },
            get children() {
              return local.children
            },
            ref(element: HTMLElement) {
              buttonRefAssign(element)
              compositeRef(element)
              const userRef = local.ref
              if (typeof userRef === 'function') {
                userRef(element as HTMLDivElement)
              }
            },
          }
        ),
      })}
    </ComboboxItemContext.Provider>
  )
}

/** Metadata published into the composite map for a combobox item. */
export interface ComboboxItemMetadata<TValue> {
  value: TValue
  disabled: boolean
}

/** Public state for {@link ComboboxItem}. */
export interface ComboboxItemState extends Record<string, unknown> {
  selected: boolean
  disabled: boolean
  highlighted: boolean
}

/** Props for {@link ComboboxItem}. */
export type ComboboxItemProps<TValue = unknown> = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'children'
> & {
  children?: JSX.Element
  /** The value associated with this item. */
  value: TValue
  /**
   * Whether the item is disabled.
   * @default false
   */
  disabled?: boolean
  render?: RenderProp<ComboboxItemState, Record<string, unknown>>
}
