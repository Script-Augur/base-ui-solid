import { splitProps } from 'solid-js'

import { CompositeRoot } from '../../internals/composite/root/CompositeRoot'
import { useSelectRootContext } from '../root/SelectRootContext'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * A container for the select items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 *
 * @param componentProps - List props.
 * @returns A Solid JSX element.
 */
export function SelectList(componentProps: SelectListProps): JSX.Element {
  const context = useSelectRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  const state: SelectListState = {}

  return (
    <CompositeRoot<Record<string, never>, SelectListState>
      tag="div"
      render={local.render}
      class={local.class}
      style={local.style}
      state={state}
      highlightItemOnHover={context.highlightItemOnHover()}
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
          onScroll(event: Event) {
            context.updateScrollArrowVisibility(
              event.currentTarget as HTMLElement
            )
          },
        },
        elementProps,
      ]}
    >
      {local.children}
    </CompositeRoot>
  )
}

/** Public state for {@link SelectList} (empty). */
export interface SelectListState extends Record<string, unknown> {}

/** Props for {@link SelectList}. */
export type SelectListProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<SelectListState, Record<string, unknown>>
  ref?: (element: Element | null) => void
}
