import { createNumberFieldStepperButton } from '../root/createNumberFieldStepperButton'

import type { RenderProp } from '../../internals/createRender'
import type { NumberFieldRootState } from '../root/NumberFieldRoot'
import type { JSX } from 'solid-js'

/**
 * A stepper button that decreases the field value when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export function NumberFieldDecrement(
  componentProps: NumberFieldDecrementProps
): JSX.Element {
  return createNumberFieldStepperButton(componentProps, false)
}

export interface NumberFieldDecrementState extends NumberFieldRootState {}

export interface NumberFieldDecrementProps extends Omit<
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
  render?: RenderProp<NumberFieldDecrementState, Record<string, unknown>>
  ref?: ((element: Element) => void) | undefined
}
