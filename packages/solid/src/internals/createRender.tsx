import { mergeProps, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { JSX, ValidComponent } from 'solid-js'

/**
 * Base UI-style `render` prop composition for Solid.
 * Supports a default element, a component/tag, a JSX element to merge onto, or
 * `(props, state) => JSX`.
 *
 * @typeParam TState - State object passed to render functions.
 * @typeParam TProps - Props merged onto the rendered output.
 * @param options - Render configuration.
 * @returns A Solid JSX element.
 *
 * @example
 * ```tsx
 * import { createRender } from "@script-augur/base-ui-solid"
 *
 * // Default element with reactive props (use getters for derived values)
 * createRender({
 *   defaultElement: "button",
 *   props: mergeProps(elementProps, {
 *     type: "button",
 *     get "aria-pressed"() { return pressed() },
 *     children: "Save",
 *   }),
 * })
 *
 * // Custom render function with state
 * createRender({
 *   defaultElement: "button",
 *   props: { type: "button" },
 *   state: { disabled: true },
 *   render: (props, state) => (
 *     <button {...props} disabled={state.disabled}>
 *       Save
 *     </button>
 *   ),
 * })
 * ```
 */
export function createRender<
  TState extends Record<string, unknown> = Record<string, never>,
  TProps extends Record<string, unknown> = Record<string, unknown>,
>(options: CreateRenderOptions<TState, TProps>): JSX.Element {
  const state = (options.state ?? {}) as TState
  const props = mergeProps(options.props as Record<string, unknown>) as TProps

  if (typeof options.render === 'function') {
    // Always treat functions as Base UI render props `(props, state) => JSX`.
    // Solid components also accept a single props argument, so a second `state`
    // parameter is harmlessly ignored when `render={MyComponent}`.
    return (options.render as RenderFunction<TState, TProps>)(props, state)
  }

  if (options.render != null && typeof options.render === 'object') {
    const element = options.render as {
      type?: ValidComponent
      props?: Record<string, unknown>
    }
    if (element.type) {
      const merged = mergeProps(element.props ?? {}, props)
      return <Dynamic component={element.type} {...merged} />
    }
  }

  if (typeof options.render === 'string') {
    return <Dynamic component={options.render} {...props} />
  }

  return <Dynamic component={options.defaultElement} {...props} />
}

/**
 * Splits common polymorphic props (`render`, `ref`, `class`, `style`,
 * `children`) from the rest for `Dynamic` / forwarding.
 *
 * @typeParam T - Full props object type.
 * @param props - Full props object.
 * @returns `[local, rest]` like Solid `splitProps`.
 *
 * @example
 * ```tsx
 * const [local, rest] = splitRenderProps(props)
 * // local: render, ref, class, style, children
 * // rest: everything else to forward
 * ```
 */
export function splitRenderProps<T extends Record<string, unknown>>(
  props: T
): [
  Pick<T, 'render' | 'ref' | 'class' | 'style' | 'children'>,
  Omit<T, 'render' | 'ref' | 'class' | 'style' | 'children'>,
] {
  return splitProps(props, [
    'render',
    'ref',
    'class',
    'style',
    'children',
  ]) as never
}

/**
 * Render-prop function form: `(props, state) => JSX`.
 *
 * @typeParam TState - Component state snapshot for the render function.
 * @typeParam TProps - Props merged onto the rendered output.
 * @param props - Props merged onto the rendered output.
 * @param state - Component state snapshot for the render function.
 */
export type RenderFunction<TState, TProps extends Record<string, unknown>> = (
  props: TProps,
  state: TState
) => JSX.Element

/**
 * Base UI-style `render` prop: component type, JSX element, or render function.
 *
 * @typeParam TState - State object passed to render functions.
 * @typeParam TProps - Props merged onto the rendered output.
 */
export type RenderProp<TState, TProps extends Record<string, unknown>> =
  ValidComponent | JSX.Element | RenderFunction<TState, TProps>

/**
 * Options for {@link createRender}.
 *
 * @typeParam TState - State object passed to render functions.
 * @typeParam TProps - Props merged onto the rendered output.
 */
export interface CreateRenderOptions<
  TState,
  TProps extends Record<string, unknown>,
> {
  /** Default HTML tag or component when `render` is omitted. */
  defaultElement: ValidComponent
  /**
   * Props merged onto the rendered element.
   * Use `mergeProps` with getters for values that depend on signals —
   * snapshot values are not tracked by `Dynamic`'s spread effect.
   */
  props: TProps
  /** Component state passed to render functions. */
  state?: TState
  /** Base UI-style render prop. */
  render?: RenderProp<TState, TProps>
}

/**
 * Intrinsic element props for tag `T`.
 *
 * @typeParam T - Intrinsic JSX tag name (e.g. `"button"`).
 */
export type NativeProps<T extends keyof JSX.IntrinsicElements> =
  JSX.IntrinsicElements[T]

/**
 * Props helper for polymorphic parts that accept a `render` prop.
 *
 * @typeParam T - Default component / tag type for `ref` typing.
 * @typeParam TProps - Extra props forwarded to the rendered element.
 */
export type PolymorphicProps<
  T extends ValidComponent,
  TProps extends Record<string, unknown> = Record<string, never>,
> = TProps & {
  render?: RenderProp<Record<string, unknown>, Record<string, unknown>>
  ref?: T extends keyof HTMLElementTagNameMap
    ? HTMLElementTagNameMap[T] | ((el: HTMLElementTagNameMap[T]) => void)
    : Element | ((el: Element) => void)
  class?: string
  style?: JSX.CSSProperties | string
  children?: JSX.Element
}

export type { JSX, ValidComponent }
