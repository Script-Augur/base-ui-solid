import { createNumberFieldStepperButton } from '../root/createNumberFieldStepperButton'

import type { RenderProp } from '../../internals/createRender'
import type { NumberFieldRootState } from '../root/NumberFieldRoot'
import type { JSX } from 'solid-js'

/**
 * A stepper button that increases the field value when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export function NumberFieldIncrement(
  componentProps: NumberFieldIncrementProps
): JSX.Element {
  return createNumberFieldStepperButton(componentProps, true)
}

export interface NumberFieldIncrementState extends NumberFieldRootState {}

export interface NumberFieldIncrementProps extends Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'disabled'
> {
  disabled?: boolean | undefined
  /**
   * Whether the component renders a native `<button>` element when replacing it
   * via the `render` prop.
   * @default true
   */
  nativeButton?: boolean | undefined
  render?: RenderProp<NumberFieldIncrementState, Record<string, unknown>>
  ref?: ((element: Element) => void) | undefined
}
