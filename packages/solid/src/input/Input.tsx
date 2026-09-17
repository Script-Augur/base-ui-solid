import { FieldControl } from '../field/control/FieldControl'

import type {
  FieldControlChangeEventDetails,
  FieldControlChangeEventReason,
  FieldControlProps,
  FieldControlState,
} from '../field/control/FieldControl'
import type { JSX } from 'solid-js'

/**
 * A native input element that automatically works with
 * [Field](https://base-ui.com/react/components/field).
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Input](https://base-ui.com/react/components/input)
 *
 * @param componentProps - Input props (`value`, `defaultValue`, `onValueChange`, `render`, …).
 * @returns A Solid JSX element.
 *
 * @example
 * ```tsx
 * import { Input } from "@script-augur/base-ui-solid/input"
 * import { Field } from "@script-augur/base-ui-solid/field"
 *
 * <Field.Root name="email">
 *   <Field.Label>Email</Field.Label>
 *   <Input type="email" required />
 *   <Field.Error />
 * </Field.Root>
 * ```
 */
export function Input(componentProps: InputProps): JSX.Element {
  return <FieldControl {...componentProps} />
}

/**
 * Public state exposed to `render` functions (same as {@link FieldControlState}).
 */
export interface InputState extends FieldControlState {}

/**
 * Props for {@link Input}.
 */
export type InputProps = FieldControlProps

export type InputChangeEventReason = FieldControlChangeEventReason

export type InputChangeEventDetails = FieldControlChangeEventDetails
