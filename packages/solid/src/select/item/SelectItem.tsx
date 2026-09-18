import { createUniqueId, mergeProps, splitProps } from 'solid-js'

import { ACTIVE_COMPOSITE_ITEM } from '../../internals/composite/constants'
import { useCompositeItem } from '../../internals/composite/item/useCompositeItem'
import { useCompositeRootContext } from '../../internals/composite/root/CompositeRootContext'
import {
  REASONS,
  createChangeEventDetails,
} from '../../internals/createChangeEventDetails'
import { createRender } from '../../internals/createRender'
import { useButton } from '../../internals/useButton'
import { useSelectRootContext } from '../root/SelectRootContext'
import { compareItemEquality } from '../utils/itemEquality'

import { SelectItemContext } from './SelectItemContext'
import { SelectItemDataAttributes } from './SelectItemDataAttributes'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * An individual selectable item in the select popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 *
 * @param componentProps - Item props (`value`, `disabled`, …).
 * @returns A Solid JSX element.
 */
export function SelectItem<TValue = unknown>(
  componentProps: SelectItemProps<TValue>
): JSX.Element {
  const context = useSelectRootContext()
  const compositeRoot = useCompositeRootContext()

  const [local, elementProps] = splitProps(
    componentProps as SelectItemProps<unknown> & Record<string, unknown>,
    ['render', 'class', 'style', 'children', 'value', 'disabled', 'id', 'ref']
  )

  const disabled = () => context.disabled() || Boolean(local.disabled)

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

  const generatedId = createUniqueId()
  const id = () => local.id ?? generatedId

  const { compositeProps, compositeRef, index } = useCompositeItem<
    SelectItemMetadata<unknown>
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
    context.setOpen(false, createChangeEventDetails(REASONS.itemPress, event))
  }

  const state: SelectItemState = {
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
    <SelectItemContext.Provider value={itemContext}>
      {createRender<SelectItemState, Record<string, unknown>>({
        defaultElement: 'div',
        state,
        render: local.render,
        mapStateToDataAttributes: true,
        stateAttributesMapping: {
          selected(value: unknown) {
            return value ? { [SelectItemDataAttributes.selected]: '' } : null
          },
          disabled(value: unknown) {
            return value ? { [SelectItemDataAttributes.disabled]: '' } : null
          },
          highlighted(value: unknown) {
            return value ? { [SelectItemDataAttributes.highlighted]: '' } : null
          },
        },
        props: mergeProps(
          getButtonProps(
            mergeProps(
              elementProps as Record<string, unknown>,
              // Accessor — Solid `mergeProps` keeps tabIndex / hover focus reactive.
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
    </SelectItemContext.Provider>
  )
}

/** Metadata published into the composite map for a select item. */
export interface SelectItemMetadata<TValue> {
  value: TValue
  disabled: boolean
}

/** Public state for {@link SelectItem}. */
export interface SelectItemState extends Record<string, unknown> {
  selected: boolean
  disabled: boolean
  highlighted: boolean
}

/** Props for {@link SelectItem}. */
export type SelectItemProps<TValue = unknown> = Omit<
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
  render?: RenderProp<SelectItemState, Record<string, unknown>>
}
