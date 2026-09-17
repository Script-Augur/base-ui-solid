import { mergeProps, splitProps } from 'solid-js'

import { createRender } from '../../createRender'
import { readMaybeAccessor } from '../../readMaybeAccessor'

import { useCompositeItem } from './useCompositeItem'

import type { RenderProp } from '../../createRender'
import type { StateAttributesMapping } from '../../getStateAttributesProps.types'
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
    props: mergeProps(
      // Item props first (includes useButton). Composite tabindex must win
      // afterward — mirrors React getButtonProps(otherExternalProps) last.
      ...(local.props ?? []).map(p => readMaybeAccessor(p, {})),
      elementProps as Record<string, unknown>,
      {
        get tabIndex() {
          return compositeProps().tabIndex
        },
        get onFocus() {
          return compositeProps().onFocus
        },
        get onMouseMove() {
          return compositeProps().onMouseMove
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
      }
    ),
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
   * Extra host props, each a record or an accessor that returns a record.
   * Merged after composite props.
   */
  props?: Array<MaybeAccessor<Record<string, unknown>>>
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
