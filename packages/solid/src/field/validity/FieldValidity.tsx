import { createMemo } from 'solid-js'

import { createTransitionStatus } from '../../internals/createTransitionStatus'
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext'
import { getCombinedFieldValidityData } from '../utils/getCombinedFieldValidityData'

import type { TransitionStatus } from '../../internals/createTransitionStatus'
import type { FieldValidityData } from '../root/FieldRoot'
import type { JSX, JSXElement } from 'solid-js'

/**
 * Used to display a custom message based on the field's validity.
 * Requires `children` to be a function that accepts field validity state.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export function FieldValidity(props: FieldValidityProps): JSX.Element {
  const field = useFieldRootContext(false)

  const combinedFieldValidityData = createMemo(() =>
    getCombinedFieldValidityData(field.validityData(), field.invalid())
  )

  const isInvalid = () => combinedFieldValidityData().state.valid === false
  const { transitionStatus } = createTransitionStatus(isInvalid)

  const fieldValidityState = createMemo((): FieldValidityState => {
    const combined = combinedFieldValidityData()
    return {
      ...combined,
      validity: combined.state,
      transitionStatus: transitionStatus(),
    }
  })

  return <>{() => props.children(fieldValidityState())}</>
}

export interface FieldValidityState extends Omit<FieldValidityData, 'state'> {
  /**
   * The validity state.
   */
  validity: FieldValidityData['state']
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus
}

export interface FieldValidityProps {
  /**
   * A function that accepts the field validity state as an argument.
   */
  children: (state: FieldValidityState) => JSXElement
}
