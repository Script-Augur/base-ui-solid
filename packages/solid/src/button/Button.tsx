import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../internals/createRender'
import { useButton } from '../internals/useButton'
import { dataAttr } from '../internals/useRender'

import { ButtonDataAttributes } from './ButtonDataAttributes'

import type { RenderProp } from '../internals/createRender'
import type { JSX } from 'solid-js'
/**
 * A button that can trigger actions. Renders a `<button>` by default.
 *
 * Documentation: [Base UI Button](https://base-ui.com/react/components/button)
 *
 * @param componentProps - Button props (`disabled`, `focusableWhenDisabled`, `nativeButton`, `render`, …).
 * @returns A Solid JSX element.
 *
 * @example
 * ```tsx
 * import { Button } from "@script-augur/base-ui-solid/button"
 *
 * <Button onClick={() => console.log("clicked")}>Save</Button>
 *
 * <Button
 *   nativeButton={false}
 *   render={(props) => <a {...props} href="#target">Go</a>}
 * >
 *   Go
 * </Button>
 * ```
 */
export function Button(componentProps: ButtonProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'disabled',
    'focusableWhenDisabled',
    'nativeButton',
    'ref',
  ])

  const { getButtonProps, buttonRefAssign } = useButton({
    disabled: () => local.disabled ?? false,
    focusableWhenDisabled: () => local.focusableWhenDisabled ?? false,
    native: () => local.nativeButton ?? true,
  })

  const state: ButtonState = {
    get disabled() {
      return local.disabled ?? false
    },
  }

  return createRender<ButtonState, Record<string, unknown>>({
    defaultElement: 'button',
    state,
    render: local.render,
    props: mergeProps(getButtonProps(elementProps as Record<string, unknown>), {
      get class() {
        return local.class
      },
      get style() {
        return local.style
      },
      get [ButtonDataAttributes.disabled]() {
        return dataAttr(local.disabled ?? false)
      },
      ref(element: HTMLElement) {
        buttonRefAssign(element)
        const userRef = local.ref
        if (typeof userRef === 'function') {
          userRef(element as HTMLButtonElement)
        }
      },
    }),
  })
}

/**
 * Public state exposed to `render` functions.
 */
export interface ButtonState extends Record<string, unknown> {
  /** Whether the button should ignore user interaction. */
  disabled: boolean
}

/**
 * Props for {@link Button}.
 */
export type ButtonProps = Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'disabled'
> & {
  /** Button label / content. */
  children?: JSX.Element
  /** Whether the button should ignore user interaction. @default false */
  disabled?: boolean
  /**
   * Whether the button should be focusable when disabled.
   * @default false
   */
  focusableWhenDisabled?: boolean
  /**
   * Whether the component is rendered as a native `<button>`.
   * Set `false` when using `render` with a non-button host (e.g. `<span>`, `<a>`).
   * @default true
   */
  nativeButton?: boolean
  /** Base UI-style render prop for host element composition. */
  render?: RenderProp<ButtonState, Record<string, unknown>>
}
