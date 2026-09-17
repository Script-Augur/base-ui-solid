import { splitProps } from 'solid-js'

import { CompositeItem } from '../../internals/composite/item/CompositeItem'
import { useFocusableWhenDisabled } from '../../internals/useFocusableWhenDisabled'
import { useToolbarGroupContext } from '../group/ToolbarGroupContext'
import { useToolbarRootContext } from '../root/ToolbarRootContext'

import type { RenderProp } from '../../internals/createRender'
import type { ToolbarRootItemMetadata, ToolbarRootState } from '../root/ToolbarRoot'
import type { JSX } from 'solid-js'

/**
 * A native input element that integrates with Toolbar keyboard navigation.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 *
 * @param componentProps - Toolbar input props (`disabled`, `focusableWhenDisabled`, …).
 * @returns A Solid JSX element.
 *
 * @example
 * ```tsx
 * import { Toolbar } from "@script-augur/base-ui-solid/toolbar"
 *
 * <Toolbar.Root>
 *   <Toolbar.Input placeholder="Search" />
 * </Toolbar.Root>
 * ```
 */
export function ToolbarInput(componentProps: ToolbarInputProps): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'disabled',
    'focusableWhenDisabled',
    'ref',
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

  const { props: focusableWhenDisabledProps } = useFocusableWhenDisabled({
    composite: () => true,
    disabled,
    focusableWhenDisabled,
    isNativeButton: () => false,
  })

  const state: ToolbarInputState = {
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
    <CompositeItem<ToolbarRootItemMetadata, ToolbarInputState>
      tag="input"
      render={local.render}
      class={local.class}
      style={local.style}
      metadata={itemMetadata}
      state={state}
      stateAttributesMapping={{}}
      refs={[assignRef]}
      props={[
        {
          onClick: preventWhenDisabled,
          onPointerDown: preventWhenDisabled,
          get 'aria-disabled'() {
            return focusableWhenDisabledProps()['aria-disabled']
          },
          get disabled() {
            return focusableWhenDisabledProps().disabled
          },
        },
        elementProps,
      ]}
    />
  )

  /**
   * Blocks pointer activation while the input is disabled.
   *
   * @param event - Click or pointer-down event.
   */
  function preventWhenDisabled(event: Event) {
    if (disabled()) {
      event.preventDefault()
    }
  }

  /**
   * Forwards the host element to the consumer `ref`.
   *
   * @param element - Mounted input element, or `null` on unmount.
   */
  function assignRef(element: HTMLElement | null) {
    const userRef = local.ref
    if (typeof userRef === 'function' && element) {
      userRef(element as HTMLInputElement)
    }
  }
}

/**
 * Public state exposed to `render` functions.
 */
export interface ToolbarInputState extends ToolbarRootState {
  /** Whether the component ignores user interaction. */
  disabled: boolean
  /** Whether the component remains focusable when disabled. */
  focusable: boolean
}

/**
 * Props for {@link ToolbarInput}.
 */
export type ToolbarInputProps = Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  'disabled' | 'defaultValue'
> & {
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
  /** Uncontrolled initial value. */
  defaultValue?: string | number | Array<string>
  /** Base UI-style render prop for host element composition. */
  render?: RenderProp<ToolbarInputState, Record<string, unknown>>
}
