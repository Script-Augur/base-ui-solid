import { splitProps } from 'solid-js'

import { CompositeItem } from '../../internals/composite/item/CompositeItem'
import { useButton } from '../../internals/useButton'
import { useToolbarGroupContext } from '../group/ToolbarGroupContext'
import { useToolbarRootContext } from '../root/ToolbarRootContext'

import type { RenderProp } from '../../internals/createRender'
import type { ToolbarRootItemMetadata, ToolbarRootState } from '../root/ToolbarRoot'
import type { JSX } from 'solid-js'

const EMPTY_OBJECT: Record<string, unknown> = {}

/** `useButton` native keys → Solid delegated prop names. */
const NATIVE_EVENT_TO_DELEGATED: Record<string, string> = {
  'on:click': 'onClick',
  'on:mousedown': 'onMouseDown',
  'on:mouseup': 'onMouseUp',
  'on:keydown': 'onKeyDown',
  'on:keyup': 'onKeyUp',
  'on:pointerdown': 'onPointerDown',
}

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
      refs={[buttonElementAssign]}
      props={[
        elementProps,
        // When a render prop is provided (typically another Base UI component
        // like Menu.Trigger), forward `disabled` so the rendered component can
        // derive its own disabled state. For the default toolbar button, avoid
        // forwarding a DOM `disabled` prop so focusable disabled buttons remain
        // hoverable. Live getter — must not snapshot via `disabled()`.
        local.render
          ? {
              get disabled() {
                return disabled()
              },
            }
          : EMPTY_OBJECT,
        // Mirror React: getButtonProps last, receiving prior bags as `previous`.
        // For `render` hosts, rewrite non-delegated `on:` listeners to delegated
        // `onX` so Solid composes them with the host's own `useButton` `on:`
        // handlers instead of overwriting (Solid treats `on:` as plain props).
        (previous: Record<string, unknown>) => {
          const buttonProps = getButtonProps(previous)
          return local.render
            ? rewriteNonDelegatedEventProps(buttonProps)
            : buttonProps
        },
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
  function buttonElementAssign(element: HTMLElement | null) {
    buttonRefAssign(element)
    const userRef = local.ref
    if (typeof userRef === 'function') {
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

/**
 * Maps Solid non-delegated `on:` listeners from {@link useButton} to delegated
 * `onX` props so a `render` host's own `useButton` can compose them via its
 * `externalOn*` path instead of overwriting colliding `on:` keys.
 *
 * @param props - Button props that may include `on:click` / `on:keydown` / ….
 * @returns Props with known `on:` keys rewritten to camelCase delegated names.
 */
function rewriteNonDelegatedEventProps(
  props: Record<string, unknown>
): Record<string, unknown> {
  const rewritten: Record<string, unknown> = {}

  for (const key of Object.keys(props)) {
    const delegatedKey = NATIVE_EVENT_TO_DELEGATED[key]
    const descriptor = Object.getOwnPropertyDescriptor(props, key)

    if (delegatedKey != null) {
      rewritten[delegatedKey] = props[key]
      continue
    }

    if (descriptor?.get || descriptor?.set) {
      Object.defineProperty(rewritten, key, descriptor)
    } else {
      rewritten[key] = props[key]
    }
  }

  return rewritten
}
