import { dispatchClickWithModifiers } from '@script-augur/base-ui-utils'
import { createEffect, mergeProps, on } from 'solid-js'

import { makeEventPreventable } from './makeEventPreventable'
import { useFocusableWhenDisabled } from './useFocusableWhenDisabled'

import type { BaseUIEvent } from './makeEventPreventable'
import type { Accessor, JSX } from 'solid-js'

/**
 * Shared button behavior for native `<button>` and non-native hosts
 * (`role="button"`), matching Base UI's `useButton` contracts.
 *
 * @param parameters - Disabled / native / composite configuration (accessors).
 * @returns `getButtonProps` + `buttonRef` to attach to the rendered element.
 *
 * @example
 * ```tsx
 * const { getButtonProps, buttonRef } = useButton({
 *   disabled: () => props.disabled ?? false,
 *   native: () => props.nativeButton ?? true,
 * })
 * ```
 */
export function useButton(
  parameters: UseButtonParameters = {}
): UseButtonReturnValue {
  const disabled = () => parameters.disabled?.() ?? false
  const tabIndex = () => parameters.tabIndex?.() ?? 0
  const isNativeButton = () => parameters.native?.() ?? true
  const focusableWhenDisabled = () => parameters.focusableWhenDisabled?.()
  const isCompositeItem = () => parameters.composite?.() ?? false

  let elementRef: HTMLElement | null = null

  const { props: focusableWhenDisabledProps } = useFocusableWhenDisabled({
    focusableWhenDisabled,
    disabled,
    composite: isCompositeItem,
    tabIndex,
    isNativeButton,
  })

  const updateDisabled = () => {
    const element = elementRef
    if (!isButtonElement(element)) return

    if (
      isCompositeItem() &&
      disabled() &&
      focusableWhenDisabledProps().disabled === undefined &&
      element.disabled
    ) {
      element.disabled = false
    }
  }

  createEffect(on(focusableWhenDisabledProps, updateDisabled))

  function getButtonProps(
    externalProps: Record<string, unknown> = {}
  ): Record<string, unknown> {
    const externalOnClick = externalProps.onClick as
      JSX.EventHandlerUnion<HTMLElement, MouseEvent> | undefined
    const externalOnMouseDown = externalProps.onMouseDown as
      JSX.EventHandlerUnion<HTMLElement, MouseEvent> | undefined
    const externalOnKeyUp = externalProps.onKeyUp as
      JSX.EventHandlerUnion<HTMLElement, KeyboardEvent> | undefined
    const externalOnKeyDown = externalProps.onKeyDown as
      JSX.EventHandlerUnion<HTMLElement, KeyboardEvent> | undefined
    const externalOnPointerDown = externalProps.onPointerDown as
      JSX.EventHandlerUnion<HTMLElement, PointerEvent> | undefined

    const otherExternalProps = { ...externalProps }
    delete otherExternalProps.onClick
    delete otherExternalProps.onMouseDown
    delete otherExternalProps.onKeyUp
    delete otherExternalProps.onKeyDown
    delete otherExternalProps.onPointerDown

    // Use non-delegated `on:` listeners so keyboard activation works with
    // testing-library `fireEvent` and matches native host behavior.
    return mergeProps(
      {
        'on:click': (event: MouseEvent) => {
          if (disabled()) {
            event.preventDefault()
            return
          }
          callEventHandler(externalOnClick, event)
        },
        'on:mousedown': (event: MouseEvent) => {
          if (!disabled()) {
            callEventHandler(externalOnMouseDown, event)
          }
        },
        'on:keydown': (event: KeyboardEvent) => {
          if (disabled() && focusableWhenDisabled() && event.key !== 'Tab') {
            event.preventDefault()
          }

          if (disabled()) {
            return
          }

          const baseUIEvent = makeEventPreventable(event)
          callEventHandler(externalOnKeyDown, baseUIEvent)
          if (baseUIEvent.baseUIHandlerPrevented) {
            return
          }

          const isCurrentTarget = event.target === event.currentTarget
          const currentTarget = event.currentTarget as Element
          const isButton = isButtonElement(currentTarget)
          const isLink = !isNativeButton() && isValidLinkElement(currentTarget)
          const shouldClick =
            isCurrentTarget && (isNativeButton() ? isButton : !isLink)
          const isEnterKey = event.key === 'Enter'
          const isSpaceKey = event.key === ' '
          const role = currentTarget.getAttribute('role')
          const isTextNavigationRole =
            role?.startsWith('menuitem') ||
            role === 'option' ||
            role === 'gridcell'

          if (isCurrentTarget && isCompositeItem() && isSpaceKey) {
            if (event.defaultPrevented && isTextNavigationRole) {
              return
            }

            event.preventDefault()

            if (!isNativeButton() || isButton) {
              baseUIEvent.preventBaseUIHandler()
              dispatchClickWithModifiers(currentTarget, event)
            }

            return
          }

          if (
            !shouldClick ||
            isNativeButton() ||
            (!isSpaceKey && !isEnterKey)
          ) {
            if (isCurrentTarget && isLink && isSpaceKey) {
              event.preventDefault()
            }
            return
          }

          if (event.defaultPrevented) {
            return
          }

          event.preventDefault()

          if (isEnterKey) {
            baseUIEvent.preventBaseUIHandler()
            dispatchClickWithModifiers(currentTarget, event)
          }
        },
        'on:keyup': (event: KeyboardEvent) => {
          if (disabled()) {
            return
          }

          const baseUIEvent = makeEventPreventable(event)
          callEventHandler(externalOnKeyUp, baseUIEvent)

          if (
            event.target === event.currentTarget &&
            isNativeButton() &&
            isCompositeItem() &&
            isButtonElement(event.currentTarget as HTMLElement) &&
            event.key === ' '
          ) {
            event.preventDefault()
            return
          }

          if (baseUIEvent.baseUIHandlerPrevented) {
            return
          }

          if (
            event.target === event.currentTarget &&
            !isNativeButton() &&
            !isCompositeItem() &&
            !event.defaultPrevented &&
            event.key === ' '
          ) {
            baseUIEvent.preventBaseUIHandler()
            dispatchClickWithModifiers(event.currentTarget as Element, event)
          }
        },
        'on:pointerdown': (event: PointerEvent) => {
          if (disabled()) {
            event.preventDefault()
            return
          }
          callEventHandler(externalOnPointerDown, event)
        },
      },
      {
        get type() {
          return isNativeButton() ? ('button' as const) : undefined
        },
        get role() {
          return isNativeButton() ? undefined : ('button' as const)
        },
        get tabIndex() {
          return focusableWhenDisabledProps().tabIndex
        },
        get disabled() {
          return focusableWhenDisabledProps().disabled
        },
        get ['aria-disabled']() {
          const value = focusableWhenDisabledProps()['aria-disabled']
          return value ? true : undefined
        },
      },
      otherExternalProps
    )
  }

  const buttonRef = (element: HTMLElement | null) => {
    elementRef = element
    updateDisabled()
  }

  return {
    getButtonProps,
    buttonRef,
  }
}

/**
 * Parameters for {@link useButton}.
 */
export interface UseButtonParameters {
  /** Whether the component should ignore user interaction. @default false */
  disabled?: Accessor<boolean | undefined>
  /** Whether the button may receive focus even if disabled. @default false */
  focusableWhenDisabled?: Accessor<boolean | undefined>
  /** Tab index while focusable. @default 0 */
  tabIndex?: Accessor<number | undefined>
  /** Whether the host is a native `<button>`. @default true */
  native?: Accessor<boolean | undefined>
  /**
   * Whether the button is part of a composite widget.
   * When `true`, Space activates on keydown rather than keyup.
   * @default false
   */
  composite?: Accessor<boolean | undefined>
}

/**
 * Return value of {@link useButton}.
 */
export interface UseButtonReturnValue {
  /**
   * Resolver for button props.
   *
   * @param externalProps - Additional props to merge (event handlers composed).
   */
  getButtonProps: (
    externalProps?: Record<string, unknown>
  ) => Record<string, unknown>
  /** Ref callback for the rendered button element. */
  buttonRef: (element: HTMLElement | null) => void
}

export type { BaseUIEvent }

function callEventHandler<T extends Event>(
  handler: JSX.EventHandlerUnion<HTMLElement, T> | undefined,
  event: T
): void {
  if (typeof handler === 'function') {
    ;(handler as (event: T) => void)(event)
  }
}

function isButtonElement(elem: Element | null): elem is HTMLButtonElement {
  return elem instanceof HTMLElement && elem.tagName === 'BUTTON'
}

function isValidLinkElement(elem: Element | null): elem is HTMLAnchorElement {
  return (
    elem instanceof HTMLElement &&
    elem.tagName === 'A' &&
    Boolean((elem as HTMLAnchorElement).href)
  )
}
