import { createMemo } from 'solid-js'

import type { Accessor } from 'solid-js'

/**
 * Builds disabled / focusability attributes for native and non-native buttons,
 * matching Base UI's `useFocusableWhenDisabled`.
 *
 * @param parameters - Disabled / focusable / native / composite configuration.
 * @returns An accessor of props to merge onto the button element.
 *
 * @example
 * ```ts
 * const { props } = useFocusableWhenDisabled({
 *   disabled: () => true,
 *   focusableWhenDisabled: () => true,
 *   isNativeButton: () => true,
 * })
 * ```
 */
export function useFocusableWhenDisabled(
  parameters: UseFocusableWhenDisabledParameters
): UseFocusableWhenDisabledReturnValue {
  const props = createMemo(() => {
    const disabled = parameters.disabled()
    const focusableWhenDisabled = parameters.focusableWhenDisabled?.()
    const composite = parameters.composite?.() ?? false
    const tabIndexProp = parameters.tabIndex?.() ?? 0
    const isNativeButton = parameters.isNativeButton()

    const isFocusableComposite = composite && focusableWhenDisabled !== false
    const isNonFocusableComposite = composite && focusableWhenDisabled === false

    const additionalProps: FocusableWhenDisabledProps = {}

    if (!composite) {
      additionalProps.tabIndex = tabIndexProp
      if (!isNativeButton && disabled) {
        additionalProps.tabIndex = focusableWhenDisabled ? tabIndexProp : -1
      }
    }

    if (
      (isNativeButton &&
        (Boolean(focusableWhenDisabled) || isFocusableComposite)) ||
      (!isNativeButton && disabled)
    ) {
      // Only set when true so Solid doesn't serialize `aria-disabled="false"`.
      if (disabled) {
        additionalProps['aria-disabled'] = true
      }
    }

    if (isNativeButton && (!focusableWhenDisabled || isNonFocusableComposite)) {
      if (disabled) {
        additionalProps.disabled = true
      }
    }

    return additionalProps
  })

  return { props }
}

/**
 * Parameters for {@link useFocusableWhenDisabled}.
 */
export interface UseFocusableWhenDisabledParameters {
  /** When `undefined`, composite items are focusable when disabled by default. */
  focusableWhenDisabled?: Accessor<boolean | undefined>
  /** Disabled state of the control. */
  disabled: Accessor<boolean>
  /** Whether this is a composite item. @default false */
  composite?: Accessor<boolean | undefined>
  /** Tab index while focusable. @default 0 */
  tabIndex?: Accessor<number | undefined>
  /** Whether the host element is a native `<button>`. */
  isNativeButton: Accessor<boolean>
}

/**
 * Return value of {@link useFocusableWhenDisabled}.
 */
export interface UseFocusableWhenDisabledReturnValue {
  /** Accessor of props to merge onto the rendered element. */
  props: Accessor<FocusableWhenDisabledProps>
}

interface FocusableWhenDisabledProps {
  'aria-disabled'?: boolean
  disabled?: boolean
  tabIndex?: number
}
