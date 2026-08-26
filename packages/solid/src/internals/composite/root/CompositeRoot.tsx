import {
  createMemo,
  createSignal,
  mergeProps,
  splitProps,
  untrack,
} from 'solid-js'

import { createRender } from '../../createRender'
import { useDirection } from '../../direction'
import { listenerEffect } from '../../listenerEffect'
import { readMaybeAccessor } from '../../readMaybeAccessor'
import { CompositeList } from '../list/CompositeList'

import { CompositeRootContext } from './CompositeRootContext'
import { useCompositeRoot } from './useCompositeRoot'

import type { RenderProp } from '../../createRender'
import type { MaybeAccessor } from '../../readMaybeAccessor'
import type { CompositeMetadata } from '../list/CompositeList'
import type { JSX } from 'solid-js'

/**
 * Root of a composite widget: list tracking, keyboard navigation, and highlight
 * state for descendants that register via {@link CompositeList}.
 *
 * @typeParam TMetadata - Per-item metadata stored in the composite map.
 * @typeParam TState - Render-state object passed to {@link createRender}.
 * @param componentProps - {@link CompositeRootProps} for this instance.
 * @returns The rendered composite root element.
 */
export function CompositeRoot<
  TMetadata extends object,
  TState extends Record<string, unknown> = Record<string, unknown>,
>(componentProps: CompositeRootProps<TMetadata, TState>): JSX.Element {
  const [local, rest] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'state',
    'refs',
    'props',
    'orientation',
    'loopFocus',
    'highlightedIndex',
    'onHighlightedIndexChange',
    'enableHomeAndEndKeys',
    'onMapChange',
    'stopEventPropagation',
    'disabledIndices',
    'highlightItemOnHover',
    'tag',
  ])

  const elementsRef = { current: [] as Array<HTMLElement | null> }
  const direction = useDirection()

  const composite = useCompositeRoot({
    orientation: () => readMaybeAccessor(local.orientation, 'both' as const),
    loopFocus: () => readMaybeAccessor(local.loopFocus, true),
    highlightedIndex: () =>
      readMaybeAccessor(
        local.highlightedIndex,
        undefined as number | undefined
      ),
    onHighlightedIndexChange: index => {
      local.onHighlightedIndexChange?.(index)
    },
    enableHomeAndEndKeys: () =>
      readMaybeAccessor(local.enableHomeAndEndKeys, false),
    stopEventPropagation: () =>
      readMaybeAccessor(local.stopEventPropagation, true),
    disabledIndices: () => local.disabledIndices,
    direction,
    elementsRef,
  })

  const contextValue = {
    highlightedIndex: createMemo(() => composite.highlightedIndex()),
    onHighlightedIndexChange: composite.onHighlightedIndexChange,
    highlightItemOnHover: () => local.highlightItemOnHover ?? false,
    onKeyDown: composite.onKeyDown,
  }

  const [rootElement, rootElementAssign] = createSignal<HTMLElement | null>(
    null
  )

  listenerEffect(rootElement, 'keydown', event => composite.onKeyDown(event))

  return (
    <CompositeRootContext.Provider value={contextValue}>
      <CompositeList<TMetadata>
        elementsRef={elementsRef}
        onMapChange={handleMapChange}
      >
        {untrack(() =>
          createRender<TState, Record<string, unknown>>({
            defaultElement: local.tag ?? 'div',
            state: (local.state ?? {}) as TState,
            render: local.render,
            props: mergeProps(mergedProps() as Record<string, unknown>, {
              get children() {
                return local.children
              },
            }),
          })
        )}
      </CompositeList>
    </CompositeRootContext.Provider>
  )

  /**
   * Syncs list map updates into {@link useCompositeRoot} and the `onMapChange` prop.
   *
   * @param map - Connected nodes keyed to {@link CompositeMetadata}.
   */
  function handleMapChange(map: Map<Node, CompositeMetadata<TMetadata>>) {
    composite.onMapChange(map as unknown as Map<Element, { index: number }>)
    local.onMapChange?.(map)
  }

  /**
   * Stores the root host node and fans the same node out to `refs`.
   *
   * @param el - Mounted host element, or `null` on unmount.
   */
  function setRootRef(el: HTMLElement | null) {
    rootElementAssign(el)
    for (const ref of local.refs ?? []) {
      ref?.(el)
    }
  }

  /**
   * Merges host props: class/style, `ref`, extra `props` entries, and leftover
   * attributes from {@link CompositeRootProps}.
   *
   * @returns Props object for {@link createRender}.
   */
  function mergedProps() {
    const fromPropsArrays = (local.props ?? []).map(p =>
      readMaybeAccessor(p, {})
    )
    return mergeProps(
      {
        ref: setRootRef,
        get class() {
          return local.class
        },
        get style() {
          return local.style
        },
      },
      ...fromPropsArrays,
      rest as Record<string, unknown>
    )
  }
}

/**
 * Props for {@link CompositeRoot}.
 *
 * Extra keys are forwarded to the host element.
 *
 * @typeParam TMetadata - Per-item metadata stored in the composite map.
 * @typeParam TState - Render-state object passed to {@link createRender}.
 */
export interface CompositeRootProps<
  TMetadata,
  TState extends Record<string, unknown>,
> {
  /** Custom renderer for the root host; defaults to `tag` or `'div'`. */
  render?: RenderProp<TState, Record<string, unknown>>
  /** Class name(s) applied to the host. */
  class?: string
  /** Inline styles applied to the host. */
  style?: JSX.CSSProperties | string
  /** Composite items and any wrapping markup. */
  children?: JSX.Element
  /** Render-state object passed to {@link createRender}. */
  state?: TState
  /** Ref callbacks invoked with the host element. */
  refs?: Array<((el: HTMLElement | null) => void) | undefined>
  /**
   * Extra host props, each a record or an accessor that returns a record.
   * Merged after class/style/`ref`.
   */
  props?: Array<MaybeAccessor<Record<string, unknown>>>
  /**
   * Arrow-key axes to handle. An accessor is re-read on each navigation.
   *
   * @default 'both'
   */
  orientation?: MaybeAccessor<'horizontal' | 'vertical' | 'both'>
  /**
   * When `true`, arrow keys wrap from the last item to the first (and vice versa).
   *
   * @default true
   */
  loopFocus?: MaybeAccessor<boolean>
  /** Controlled highlighted index. Omit for uncontrolled highlight. */
  highlightedIndex?: MaybeAccessor<number | undefined>
  /**
   * Called when the highlighted index changes.
   *
   * @param index - Newly highlighted list index.
   */
  onHighlightedIndexChange?: (index: number) => void
  /**
   * When `true`, Home/End move highlight to the first/last enabled item.
   *
   * @default false
   */
  enableHomeAndEndKeys?: MaybeAccessor<boolean>
  /**
   * Called whenever {@link CompositeList} rebuilds the ordered metadata map.
   *
   * @param map - Connected nodes keyed to {@link CompositeMetadata}.
   */
  onMapChange?: (map: Map<Node, CompositeMetadata<TMetadata>>) => void
  /**
   * When `true`, handled composite keys call `stopPropagation`.
   *
   * @default true
   */
  stopEventPropagation?: MaybeAccessor<boolean>
  /** List indexes skipped by keyboard navigation. */
  disabledIndices?: Array<number>
  /**
   * When `true`, hovering an item updates the highlighted index.
   *
   * @default false
   */
  highlightItemOnHover?: boolean
  /** Host tag when `render` is omitted.
   *
   * @default 'div'
   */
  tag?: string
  [key: string]: unknown
}
