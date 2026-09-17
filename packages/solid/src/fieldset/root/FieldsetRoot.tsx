import { createSignal, mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../internals/createRender'
import { dataAttr } from '../../internals/useRender'

import {
  FieldsetRootContext,
  useFieldsetRootContext,
} from './FieldsetRootContext'

import type { FieldsetRootContextValue } from './FieldsetRootContext'
import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * Groups a shared legend with related controls.
 * Renders a `<fieldset>` element.
 *
 * Documentation: [Base UI Fieldset](https://base-ui.com/react/components/fieldset)
 *
 * @param componentProps - Root props (`disabled`, `render`, …).
 * @returns A Solid JSX element.
 *
 * @example
 * ```tsx
 * import { Fieldset } from "@script-augur/base-ui-solid/fieldset"
 *
 * <Fieldset.Root>
 *   <Fieldset.Legend>Billing details</Fieldset.Legend>
 * </Fieldset.Root>
 * ```
 */
export function FieldsetRoot(componentProps: FieldsetRootProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'disabled',
    'children',
    'ref',
  ])

  const [legendId, legendIdAssign] = createSignal<string | undefined>()

  const parent = useFieldsetRootContext(true)
  const disabled = () => Boolean(parent?.disabled()) || Boolean(local.disabled)

  const state: FieldsetRootState = {
    get disabled() {
      return disabled()
    },
  }

  const contextValue: FieldsetRootContextValue = {
    legendId,
    legendIdAssign,
    disabled,
  }

  return (
    <FieldsetRootContext.Provider value={contextValue}>
      {createRender<FieldsetRootState, Record<string, unknown>>({
        defaultElement: 'fieldset',
        state,
        render: local.render,
        props: mergeProps(elementProps as Record<string, unknown>, {
          get 'aria-labelledby'() {
            return legendId()
          },
          get disabled() {
            return disabled() || undefined
          },
          get class() {
            return local.class
          },
          get style() {
            return local.style
          },
          get 'data-disabled'() {
            return dataAttr(disabled())
          },
          get children() {
            return local.children
          },
          ref: local.ref,
        }),
      })}
    </FieldsetRootContext.Provider>
  )
}

/**
 * Public state exposed to `render` functions.
 */
export interface FieldsetRootState extends Record<string, unknown> {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean
}

/**
 * Props for {@link FieldsetRoot}.
 */
export type FieldsetRootProps = Omit<
  JSX.FieldsetHTMLAttributes<HTMLFieldSetElement>,
  'disabled'
> & {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined
  /** Base UI-style render prop for host element composition. */
  render?: RenderProp<FieldsetRootState, Record<string, unknown>>
}
