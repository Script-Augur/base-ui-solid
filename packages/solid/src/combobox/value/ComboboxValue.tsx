import { useComboboxRootContext } from '../root/ComboboxRootContext'
import {
  resolveMultipleLabels,
  resolveSelectedLabel,
} from '../utils/resolveValueLabel'

import type { JSX } from 'solid-js'

/**
 * The current value of the combobox.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 *
 * @param componentProps - Value props.
 * @returns Resolved label content (no wrapper element).
 */
export function ComboboxValue(componentProps: ComboboxValueProps): JSX.Element {
  const context = useComboboxRootContext()

  const value = () => context.value()
  const hasSelectedValue = () => {
    const current = value()
    if (context.multiple()) {
      return Array.isArray(current) && current.length > 0
    }
    return current != null
  }

  const childrenProp = componentProps.children
  if (typeof childrenProp === 'function') {
    return <>{childrenProp(value())}</>
  }
  if (childrenProp != null) return <>{childrenProp}</>
  if (!hasSelectedValue()) return <>{componentProps.placeholder ?? null}</>

  const current = value()
  if (Array.isArray(current)) {
    return (
      <>
        {resolveMultipleLabels(
          current,
          context.items(),
          context.itemToStringLabel()
        )}
      </>
    )
  }
  return (
    <>
      {resolveSelectedLabel(
        current,
        context.items(),
        context.itemToStringLabel()
      )}
    </>
  )
}

/** Public state for {@link ComboboxValue}. */
export interface ComboboxValueState {}

/** Props for {@link ComboboxValue}. */
export interface ComboboxValueProps {
  /** Accepts a function that returns a value formatted for display, or static content. */
  children?: JSX.Element | ((value: unknown) => JSX.Element)
  /** The placeholder to display when no value is selected. */
  placeholder?: JSX.Element
}
