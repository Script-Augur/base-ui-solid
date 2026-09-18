import { useComboboxRootContext } from '../../combobox/root/ComboboxRootContext'

import type { JSX } from 'solid-js'

/**
 * The current value of the autocomplete (the input string).
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 *
 * @param componentProps - Value props.
 * @returns Resolved input-value content (no wrapper element).
 */
export function AutocompleteValue(
  componentProps: AutocompleteValueProps
): JSX.Element {
  const context = useComboboxRootContext()
  const inputValue = () => String(context.inputValue())

  const childrenProp = componentProps.children
  if (typeof childrenProp === 'function') {
    return <>{childrenProp(inputValue())}</>
  }
  if (childrenProp != null) return <>{childrenProp}</>
  return <>{inputValue()}</>
}

/** Public state for {@link AutocompleteValue}. */
export interface AutocompleteValueState {}

/** Props for {@link AutocompleteValue}. */
export interface AutocompleteValueProps {
  /** Accepts a function that formats the input string, or static content. */
  children?: JSX.Element | ((value: string) => JSX.Element)
}
