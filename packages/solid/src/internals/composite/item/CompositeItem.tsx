import { splitProps } from 'solid-js'

import { createRender } from '../../createRender'
import { mergeRenderProps } from '../../mergeRenderProps'

import { useCompositeItem } from './useCompositeItem'

import type { RenderProp } from '../../createRender'
import type { StateAttributesMapping } from '../../getStateAttributesProps.types'
import type { PropsInput } from '../../mergeRenderProps'
import type { MaybeAccessor } from '../../readMaybeAccessor'
import type { JSX } from 'solid-js'

/**
 * Renders a composite list item with roving tabindex wiring.
 *
 * Solid port of Base UI `CompositeItem`.
 *
 * @typeParam TMetadata - Per-item metadata stored in the composite map.
 * @typeParam TState - Render-state object passed to {@link createRender}.
 * @param componentProps - {@link CompositeItemProps} for this instance.
 * @returns The rendered item element.
 */
export function CompositeItem<
  TMetadata,
  TState extends Record<string, unknown> = Record<string, unknown>,
>(componentProps: CompositeItemProps<TMetadata, TState>): JSX.Element {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'state',
    'refs',
    'props',
    'metadata',
    'stateAttributesMapping',
    'tag',
  ])

  const { compositeProps, compositeRef } = useCompositeItem({
    metadata: local.metadata,
  })

  return createRender<TState, Record<string, unknown>>({
    defaultElement: local.tag ?? 'div',
    state: (local.state ?? {}) as TState,
    render: local.render,
    stateAttributesMapping: local.stateAttributesMapping,
    ref: [
      compositeRef,
      ...(local.refs ?? []).map(
        ref => (el: Element | null) => ref?.(el as HTMLElement | null)
      ),
    ],
    // Item props first (includes useButton). Composite tabindex must win
    // afterward — mirrors React getButtonProps(otherExternalProps) last.
    // Re-read MaybeAccessor bags via mergeRenderProps getters so live values
    // (e.g. Toolbar `disabled` for `render` hosts) stay reactive.
    props: [
      ...(local.props ?? []).map(normalizePropsInput),
      elementProps,
      {
        get tabIndex() {
          return compositeProps().tabIndex
        },
        onFocus(event: FocusEvent) {
          // Previous bag handlers (elementProps / getButtonProps) are composed by
          // mergeRenderProps and run after this. Composite first matches React's
          // `[compositeProps, ...props]` ordering.
          const compositeFocus = compositeProps().onFocus as
            | ((event: FocusEvent) => void)
            | undefined
          compositeFocus?.(event)
        },
        onMouseMove(event: MouseEvent) {
          const compositeMove = compositeProps().onMouseMove as
            | ((event: MouseEvent) => void)
            | undefined
          compositeMove?.(event)
        },
        get class() {
          return local.class
        },
        get style() {
          return local.style
        },
        get children() {
          return local.children
        },
      },
    ],
  })
}

/**
 * Props for {@link CompositeItem}.
 *
 * @typeParam TMetadata - Per-item metadata stored in the composite map.
 * @typeParam TState - Render-state object passed to {@link createRender}.
 */
export interface CompositeItemProps<
  TMetadata,
  TState extends Record<string, unknown>,
> {
  /** Custom renderer for the item host; defaults to `tag` or `'div'`. */
  render?: RenderProp<TState, Record<string, unknown>>
  /** Class name(s) applied to the host. */
  class?: string
  /** Inline styles applied to the host. */
  style?: JSX.CSSProperties | string
  /** Item contents. */
  children?: JSX.Element
  /** Value (or accessor) stored on this item in the composite metadata map. */
  metadata?: MaybeAccessor<TMetadata>
  /** Ref callbacks invoked with the host element. */
  refs?: Array<((el: HTMLElement | null) => void) | undefined>
  /**
   * Extra host props, each a record, a zero-arg accessor, or a
   * `(previous) => props` getter (Base UI `mergeProps` style).
   * Merged before composite `tabIndex` / focus handlers so composite wins.
   */
  props?: Array<CompositeItemPropsInput>
  /** Render-state object passed to {@link createRender}. */
  state?: TState
  /** Custom mapping for converting state fields to `data-*` attributes. */
  stateAttributesMapping?: StateAttributesMapping<
    TState & Record<string, unknown>
  >
  /** Host tag when `render` is omitted.
   *
   * @default 'div'
   */
  tag?: string
  [key: string]: unknown
}

/**
 * Prop bag accepted by {@link CompositeItem}: a plain record, a zero-arg
 * accessor that returns a record, or a previous-props getter.
 */
export type CompositeItemPropsInput =
  | Record<string, unknown>
  | (() => Record<string, unknown>)
  | ((previous: Record<string, unknown>) => Record<string, unknown>)

/**
 * Converts a {@link CompositeItemPropsInput} into a {@link PropsInput} for
 * {@link mergeRenderProps}.
 *
 * Zero-arg accessors are wrapped so they re-read on every merge; arity ≥ 1
 * functions are treated as previous-props getters (e.g. `getButtonProps`).
 *
 * @param bag - Item prop bag.
 * @returns Props input for merge.
 */
function normalizePropsInput(bag: CompositeItemPropsInput): PropsInput {
  if (typeof bag !== 'function') {
    return bag
  }
  // Zero-arg accessors re-read on every merge; arity ≥ 1 → previous-props getter.
  if (bag.length === 0) {
    const accessor = bag as () => Record<string, unknown>
    return (previous: Record<string, unknown>) =>
      mergeRenderProps(previous, accessor())
  }
  return bag
}
