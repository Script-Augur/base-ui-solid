import { createSignal, createUniqueId } from 'solid-js'

import type { BaseUIChangeEventDetails } from '../internals/createChangeEventDetails'
import type { Accessor } from 'solid-js'

const EMPTY_ARRAY: Array<string> = []
/**
 * Parent / child coordination for a select-all checkbox inside a Checkbox Group.
 *
 * @param params - All values, current group value, and change handler.
 * @returns Parent id, prop getters, and disabled-state tracking.
 */
export function useCheckboxGroupParent(
  params: UseCheckboxGroupParentParameters
): UseCheckboxGroupParentReturnValue {
  const allValues = () => params.allValues ?? EMPTY_ARRAY
  const value = () => params.value()

  let uncontrolledState = value().slice()
  const disabledStatesRef = new Map<string, boolean>()

  const [status, statusAssign] = createSignal<'on' | 'off' | 'mixed'>('mixed')

  const id = createUniqueId()
  const checked = () => value().length === allValues().length
  const indeterminate = () =>
    value().length !== allValues().length && value().length > 0

  const getParentProps = (): ParentCheckboxProps => ({
    get id() {
      return id
    },
    get indeterminate() {
      return indeterminate()
    },
    get checked() {
      return checked()
    },
    get 'aria-controls'() {
      return allValues()
        .map(v => `${id}-${v}`)
        .join(' ')
    },
    onCheckedChange(_nextChecked, eventDetails) {
      const uncontrolled = uncontrolledState

      // None except the disabled ones that are checked, which can't be changed.
      const none = allValues().filter(
        v => disabledStatesRef.get(v) && uncontrolled.includes(v)
      )
      // "All" that are valid:
      // - any that aren't disabled
      // - disabled ones that are checked
      const all = allValues().filter(
        v => !disabledStatesRef.get(v) || uncontrolled.includes(v)
      )

      const allOnOrOff =
        uncontrolled.length === all.length || uncontrolled.length === 0

      if (allOnOrOff) {
        if (value().length === all.length) {
          params.onValueChange?.(none, eventDetails)
        } else {
          params.onValueChange?.(all, eventDetails)
        }
        return
      }

      let nextStatus: 'on' | 'off' | 'mixed' = 'mixed'
      let nextValue = uncontrolled

      if (status() === 'mixed') {
        nextStatus = 'on'
        nextValue = all
      } else if (status() === 'on') {
        nextStatus = 'off'
        nextValue = none
      }

      params.onValueChange?.(nextValue, eventDetails)
      if (!eventDetails.isCanceled) {
        statusAssign(nextStatus)
      }
    },
  })

  const getChildProps = (childValue: string): ChildCheckboxProps => ({
    get checked() {
      return value().includes(childValue)
    },
    onCheckedChange(nextChecked, eventDetails) {
      const newValue = value().slice()
      if (nextChecked) {
        newValue.push(childValue)
      } else {
        const index = newValue.indexOf(childValue)
        if (index !== -1) {
          newValue.splice(index, 1)
        }
      }

      params.onValueChange?.(newValue, eventDetails)
      if (!eventDetails.isCanceled) {
        uncontrolledState = newValue
        statusAssign('mixed')
      }
    },
  })

  return {
    id,
    disabledStatesRef,
    getParentProps,
    getChildProps,
  }
}
export interface UseCheckboxGroupParentParameters {
  allValues?: Array<string> | undefined
  value: Accessor<Array<string>>
  onValueChange?: (
    value: Array<string>,
    eventDetails: BaseUIChangeEventDetails<'none'>
  ) => void
}
export interface UseCheckboxGroupParentReturnValue {
  id: string
  disabledStatesRef: Map<string, boolean>
  getParentProps: () => ParentCheckboxProps
  getChildProps: (value: string) => ChildCheckboxProps
}
interface ParentCheckboxProps {
  id: string
  indeterminate: boolean
  checked: boolean
  'aria-controls': string
  onCheckedChange: (
    checked: boolean,
    eventDetails: BaseUIChangeEventDetails<'none'>
  ) => void
}
interface ChildCheckboxProps {
  checked: boolean
  onCheckedChange: (
    checked: boolean,
    eventDetails: BaseUIChangeEventDetails<'none'>
  ) => void
}
