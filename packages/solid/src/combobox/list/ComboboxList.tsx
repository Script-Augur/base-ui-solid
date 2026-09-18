import { splitProps } from 'solid-js'

import { CompositeRoot } from '../../internals/composite/root/CompositeRoot'
import { useComboboxRootContext } from '../root/ComboboxRootContext'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * A container for the combobox items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 *
 * @param componentProps - List props.
 * @returns A Solid JSX element.
 */
export function ComboboxList(componentProps: ComboboxListProps): JSX.Element {
  const context = useComboboxRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const children = () => {
    const child = local.children
    if (typeof child === 'function') {
      const items = context.filteredItems() ?? []
      return items.map((item, index) => child(item, index))
    }
    return child
  }

  const state: ComboboxListState = {
    get empty() {
      return context.listEmpty()
    },
  }

  return (
    <CompositeRoot<Record<string, never>, ComboboxListState>
      tag="div"
      render={local.render}
      class={local.class}
      style={local.style}
      state={state}
      // Combobox uses Input-driven virtual focus via Root `highlightedIndex`
      // (Composite's internal seed would force index 0 and fight autoHighlight).
      highlightItemOnHover={false}
      loopFocus={context.loopFocus()}
      refs={[
        el => {
          context.listElementAssign(el)
          local.ref?.(el as Element)
        },
      ]}
      props={[
        {
          get id() {
            return `${context.id()}-list`
          },
          role: 'listbox',
          get 'aria-multiselectable'() {
            return context.multiple() || undefined
          },
        },
        elementProps,
      ]}
    >
      {children()}
    </CompositeRoot>
  )
}

/** Public state for {@link ComboboxList}. */
export interface ComboboxListState extends Record<string, unknown> {
  empty: boolean
}

/** Props for {@link ComboboxList}. */
export type ComboboxListProps = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'children'
> & {
  children?: JSX.Element | ((item: unknown, index: number) => JSX.Element)
  render?: RenderProp<ComboboxListState, Record<string, unknown>>
  ref?: (element: Element | null) => void
}
