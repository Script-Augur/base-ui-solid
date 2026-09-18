import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { useSelectRootContext } from '../root/SelectRootContext'
import {
  resolveMultipleLabels,
  resolveSelectedLabel,
} from '../utils/resolveValueLabel'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * A text label of the currently selected item.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 *
 * @param componentProps - Value props.
 * @returns A Solid JSX element.
 */
export function SelectValue(componentProps: SelectValueProps): JSX.Element {
  const context = useSelectRootContext()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'placeholder',
    'ref',
  ])

  const value = () => context.value()
  const hasSelectedValue = () => {
    const current = value()
    if (context.multiple()) {
      return Array.isArray(current) && current.length > 0
    }
    return current != null
  }

  const state: SelectValueState = {
    get value() {
      return value()
    },
    get placeholder() {
      return !hasSelectedValue()
    },
  }

  const children = () => {
    const childrenProp = local.children
    if (typeof childrenProp === 'function') {
      return childrenProp(value())
    }
    if (childrenProp != null) return childrenProp
    if (!hasSelectedValue()) return local.placeholder ?? null
    const current = value()
    if (Array.isArray(current)) {
      return resolveMultipleLabels(
        current,
        context.items(),
        context.itemToStringLabel()
      )
    }
    return resolveSelectedLabel(
      current,
      context.items(),
      context.itemToStringLabel()
    )
  }

  return createRender<SelectValueState, Record<string, unknown>>({
    defaultElement: 'span',
    state,
    render: local.render,
    props: mergeProps(elementProps as Record<string, unknown>, {
      get children() {
        return children()
      },
      get class() {
        return local.class
      },
      get style() {
        return local.style
      },
      ref: local.ref,
    }),
  })
}

/** Public state for {@link SelectValue}. */
export interface SelectValueState extends Record<string, unknown> {
  value: unknown
  placeholder: boolean
}

/** Props for {@link SelectValue}. */
export type SelectValueProps = Omit<
  JSX.HTMLAttributes<HTMLSpanElement>,
  'children'
> & {
  /** Accepts a function that returns a value formatted for display, or static content. */
  children?: JSX.Element | ((value: unknown) => JSX.Element)
  /** The placeholder to display when no value is selected. */
  placeholder?: JSX.Element
  render?: RenderProp<SelectValueState, Record<string, unknown>>
}
