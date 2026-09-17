import { splitProps } from 'solid-js'

import { CompositeItem } from '../../internals/composite/item/CompositeItem'
import { useButton } from '../../internals/useButton'
import { useToolbarGroupContext } from '../group/ToolbarGroupContext'
import { useToolbarRootContext } from '../root/ToolbarRootContext'

import type { RenderProp } from '../../internals/createRender'
import type { ToolbarRootItemMetadata, ToolbarRootState } from '../root/ToolbarRoot'
import type { JSX } from 'solid-js'

const EMPTY_OBJECT: Record<string, unknown> = {}

/**
 * A button that can be used as-is or as a trigger for other components.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 *
 * @param componentProps - Toolbar button props (`disabled`, `focusableWhenDisabled`, …).
 * @returns A Solid JSX element.
 *
 * @example
 * ```tsx
 * import { Toolbar } from "@script-augur/base-ui-solid/toolbar"
 *
 * <Toolbar.Root>
 *   <Toolbar.Button onClick={() => {}}>Save</Toolbar.Button>
 * </Toolbar.Root>
 * ```
 */
export function ToolbarButton(componentProps: ToolbarButtonProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'disabled',
    'focusableWhenDisabled',
    'nativeButton',
    'ref',
    'children',
  ])

  const root = useToolbarRootContext()
  const groupContext = useToolbarGroupContext()

  const focusableWhenDisabled = () => local.focusableWhenDisabled ?? true
  const disabled = () =>
    root.disabled() ||
    (groupContext?.disabled() ?? false) ||
    (local.disabled ?? false)

  const itemMetadata = (): ToolbarRootItemMetadata => ({
    disabled: disabled(),
    focusableWhenDisabled: focusableWhenDisabled(),
  })

  const { getButtonProps, buttonRefAssign } = useButton({
    disabled,
    focusableWhenDisabled,
    native: () => local.nativeButton ?? true,
    composite: () => true,
  })

  const state: ToolbarButtonState = {
    get disabled() {
      return disabled()
    },
    get orientation() {
      return root.orientation()
    },
    get focusable() {
      return focusableWhenDisabled()
    },
  }

  return (
    <CompositeItem<ToolbarRootItemMetadata, ToolbarButtonState>
      tag="button"
      render={local.render}
      class={local.class}
      style={local.style}
      metadata={itemMetadata}
      state={state}
      stateAttributesMapping={{}}
      refs={[assignRefs]}
      props={[
        // getButtonProps merges consumer props and gates click/keyboard when
        // disabled. Passing elementProps only through getButtonProps avoids a
        // second raw `onClick` that would bypass the disabled check.
        () =>
          getButtonProps({
            ...(elementProps as Record<string, unknown>),
            // When a render prop is provided (typically another Base UI component
            // like Menu.Trigger), forward `disabled` so the rendered component can
            // derive its own disabled state.
            ...(local.render ? { disabled: disabled() } : EMPTY_OBJECT),
          }),
      ]}
    >
      {local.children}
    </CompositeItem>
  )

  /**
   * Stores the host for {@link useButton} and forwards the consumer `ref`.
   *
   * @param element - Mounted button element, or `null` on unmount.
   */
  function assignRefs(element: HTMLElement | null) {
    buttonRefAssign(element)
    const userRef = local.ref
    if (typeof userRef === 'function' && element) {
      userRef(element as HTMLButtonElement)
    }
  }
}

/**
 * Public state exposed to `render` functions.
 */
export interface ToolbarButtonState extends ToolbarRootState {
  /** Whether the component ignores user interaction. */
  disabled: boolean
  /** Whether the component remains focusable when disabled. */
  focusable: boolean
}

/**
 * Props for {@link ToolbarButton}.
 */
export type ToolbarButtonProps = Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'disabled'
> & {
  /** Button label / content. */
  children?: JSX.Element
  /**
   * When `true` the item is disabled.
   * @default false
   */
  disabled?: boolean
  /**
   * When `true` the item remains focusable when disabled.
   * @default true
   */
  focusableWhenDisabled?: boolean
  /**
   * Whether the component renders a native `<button>` element.
   * @default true
   */
  nativeButton?: boolean
  /** Base UI-style render prop for host element composition. */
  render?: RenderProp<ToolbarButtonState, Record<string, unknown>>
}
