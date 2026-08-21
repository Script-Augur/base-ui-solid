import { mergeProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { JSX, ValidComponent } from 'solid-js'

/**
 * Resolves a Base UI-style `render` prop into a Solid element.
 *
 * Prefer {@link createRender} when you also need to merge onto a JSX element
 * node; `useRender` covers the common tag / component / `(props, state)` cases.
 *
 * @typeParam TProps - Props merged onto the rendered output.
 * @typeParam TState - State object passed to render functions.
 * @param options - Render configuration.
 * @returns A Solid JSX element.
 *
 * @example
 * ```tsx
 * import { useRender } from "@script-augur/base-ui-solid"
 * import type { RenderProp } from "@script-augur/base-ui-solid"
 *
 * function Root(props: {
 *   children?: JSX.Element
 *   render?: RenderProp<Record<string, unknown>>
 * }) {
 *   return useRender({
 *     defaultElement: "div",
 *     props: { role: "group", children: props.children },
 *     render: props.render,
 *   })
 * }
 * ```
 */
export function useRender<
  TProps extends Record<string, unknown>,
  TState extends Record<string, unknown> = Record<string, never>,
>(options: UseRenderOptions<TProps, TState>): JSX.Element {
  const state = (options.state ?? {}) as TState
  const render = options.render

  if (typeof render === 'function' && render.length >= 2) {
    return (render as RenderFn<TProps, TState>)(options.props, state)
  }

  const component =
    (typeof render === 'function' || typeof render === 'string'
      ? (render as ValidComponent)
      : undefined) ?? options.defaultElement

  return <Dynamic component={component} {...options.props} />
}

/**
 * Merges attribute objects with Solid `mergeProps`, skipping falsy entries.
 *
 * @param objects - Attribute bags to merge.
 * @returns Merged attributes.
 *
 * @example
 * ```ts
 * const attrs = mergeAttrs(
 *   { id: "root" },
 *   disabled ? { "aria-disabled": true } : null,
 *   props,
 * )
 * ```
 */
export function mergeAttrs(
  ...objects: Array<Record<string, unknown> | null | undefined>
): Record<string, unknown> {
  return mergeProps(...objects.filter(Boolean))
}

/**
 * Boolean → `data-*` attribute helper (`""` when true, omitted when false).
 *
 * @param condition - Whether the data attribute should be present.
 * @returns `""` or `undefined`.
 *
 * @example
 * ```tsx
 * <button data-open={dataAttr(open())} />
 * ```
 */
export function dataAttr(condition: boolean | undefined): '' | undefined {
  return condition ? '' : undefined
}

/**
 * Invokes an optional event handler.
 *
 * @typeParam T - Event type forwarded to `handler`.
 * @param handler - Listener to call, if defined.
 * @param event - Event argument forwarded to `handler`.
 *
 * @example
 * ```ts
 * callHandler(props.onClick, event)
 * ```
 */
export function callHandler<T extends Event>(
  handler: ((event: T) => void) | undefined,
  event: T
): void {
  handler?.(event)
}

/**
 * Render-prop function form used by {@link useRender}.
 *
 * @typeParam TProps - Props merged onto the rendered output.
 * @typeParam TState - Component state snapshot for the render function.
 * @param props - Props merged onto the rendered output.
 * @param state - Component state snapshot for the render function.
 */
export type RenderFn<
  TProps extends Record<string, unknown>,
  TState = Record<string, never>,
> = (props: TProps, state: TState) => JSX.Element

/**
 * `render` prop accepted by {@link useRender}: component type or render fn.
 *
 * @typeParam TProps - Props merged onto the rendered output.
 * @typeParam TState - State object passed to render functions.
 */
export type RenderProp<
  TProps extends Record<string, unknown>,
  TState = Record<string, never>,
> = ValidComponent | RenderFn<TProps, TState>

/**
 * Options for {@link useRender}.
 *
 * @typeParam TProps - Props merged onto the rendered output.
 * @typeParam TState - State object passed to render functions.
 */
export interface UseRenderOptions<
  TProps extends Record<string, unknown>,
  TState extends Record<string, unknown> = Record<string, never>,
> {
  /** Default HTML tag or component when `render` is omitted. */
  defaultElement: ValidComponent
  /** Props merged onto the rendered element. */
  props: TProps
  /** Component state passed to render functions. */
  state?: TState
  /** Base UI-style render prop. */
  render?: RenderProp<TProps, TState>
}
