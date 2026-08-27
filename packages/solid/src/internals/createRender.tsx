import { mergeProps, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { getStateAttributesProps } from './getStateAttributesProps'
import { mergeRefs } from './mergeRefs'
import { mergeRenderProps, mergeRenderPropsN } from './mergeRenderProps'
import { mergeClassNames } from './resolveRenderProps'

import type { StateAttributesMapping } from './getStateAttributesProps.types'
import type { MergeRef } from './mergeRefs'
import type { PropsInput } from './mergeRenderProps'
import type { JSX, ValidComponent } from 'solid-js'
/**
 * Base UI-style `render` prop composition for Solid.
 * Supports a default element, a component/tag, a JSX element to merge onto, or
 * `(props, state) => JSX`.
 *
 * Mirrors upstream `@base-ui/react` `useRender` / `useRenderElement` behavior:
 * state → `data-*` attrs, class/style merging, ref forwarding, and `enabled`.
 *
 * @typeParam TState - State object passed to render functions.
 * @typeParam TProps - Props merged onto the rendered output.
 * @param options - Render configuration.
 * @returns A Solid JSX element (empty when `enabled` is `false`).
 */
export function createRender<
  TState extends Record<string, unknown> = Record<string, never>,
  TProps extends Record<string, unknown> = Record<string, unknown>,
>(options: CreateRenderOptions<TState, TProps>): JSX.Element {
  if (options.enabled === false) {
    return null
  }
  return renderInner(options)
}
/**
 * Splits common polymorphic props (`render`, `ref`, `class`, `style`,
 * `children`) from the rest for `Dynamic` / forwarding.
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
/** Explicit `{ component, props }` descriptor (Solid alternative to React element render). */
export interface RenderElementDescriptor {
  component: ValidComponent
  props?: Record<string, unknown>
}
export type RenderFunction<TState, TProps extends Record<string, unknown>> = (
  props: TProps,
  state: TState
) => JSX.Element
export type RenderProp<TState, TProps extends Record<string, unknown>> =
  ValidComponent | RenderElementDescriptor | RenderFunction<TState, TProps>
export interface CreateRenderOptions<
  TState,
  TProps extends Record<string, unknown>,
> {
  /** Default HTML tag or component when `render` is omitted. */
  defaultElement: ValidComponent
  /**
   * Props merged onto the rendered element.
   * Use `mergeProps` with getters for values that depend on signals.
   */
  props?: TProps | Array<TProps | undefined>
  /** Component state passed to render functions and `data-*` mapping. */
  state?: TState
  /** Base UI-style render prop. */
  render?: RenderProp<TState, TProps>
  /** Ref callback(s) merged onto the rendered element. */
  ref?: MergeRef<Element> | Array<MergeRef<Element> | undefined>
  /** Custom mapping for converting state fields to `data-*` attributes. */
  stateAttributesMapping?: StateAttributesMapping<
    TState & Record<string, unknown>
  >
  /**
   * When `true`, maps `state` fields to `data-*` attributes automatically.
   * Defaults to `false` — ported parts usually set data attrs on `props` directly.
   */
  mapStateToDataAttributes?: boolean
  /**
   * When `false`, skips rendering.
   * @default true
   */
  enabled?: boolean
  /** Class merged onto the rendered element (string or state function). */
  class?: string | ((state: TState) => string | undefined)
  /** Alias for `class` (React compat in tests). */
  className?: string | ((state: TState) => string | undefined)
  /** Style merged onto the rendered element (object or state function). */
  style?:
    | Record<string, string | number>
    | ((state: TState) => Record<string, string | number> | undefined)
}
export type NativeProps<T extends keyof JSX.IntrinsicElements> =
  JSX.IntrinsicElements[T]
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
function renderInner<
  TState extends Record<string, unknown>,
  TProps extends Record<string, unknown>,
>(options: CreateRenderOptions<TState, TProps>): JSX.Element {
  const state = (options.state ?? {}) as TState
  const renderProp = options.render

  const outProps = () =>
    computeRenderElementProps({
      className: options.class ?? options.className,
      style: options.style,
      state,
      stateAttributesMapping: options.stateAttributesMapping,
      mapStateToDataAttributes: options.mapStateToDataAttributes,
      props: options.props,
      ref: options.ref,
      renderProp: options.render as
        | RenderProp<Record<string, unknown>, Record<string, unknown>>
        | undefined,
    })

  if (typeof renderProp === 'function') {
    return renderProp(outProps() as TProps, state)
  }

  if (typeof renderProp === 'string') {
    return <Dynamic component={renderProp as ValidComponent} {...outProps()} />
  }

  if (isRenderElementDescriptor(renderProp)) {
    const merged = mergeRenderProps(renderProp.props ?? {}, outProps())
    return <Dynamic component={renderProp.component} {...merged} />
  }

  return (
    <Dynamic
      key={String(options.defaultElement)}
      component={options.defaultElement}
      {...renderDefaultElementProps(options.defaultElement, outProps())}
    />
  )
}
function computeRenderElementProps<
  TState extends Record<string, unknown>,
>(params: {
  className?: string | ((state: TState) => string | undefined) | undefined
  style?:
    | Record<string, string | number>
    | ((state: TState) => Record<string, string | number> | undefined)
    | undefined
  state: TState
  stateAttributesMapping?: StateAttributesMapping<TState>
  mapStateToDataAttributes?: boolean
  props?: Record<string, unknown> | Array<PropsInput>
  ref?: MergeRef<Element> | Array<MergeRef<Element> | undefined>
  renderProp?: RenderProp<Record<string, unknown>, Record<string, unknown>>
}): Record<string, unknown> {
  const stateProps =
    params.mapStateToDataAttributes === true ||
    params.stateAttributesMapping != null
      ? getStateAttributesProps(params.state, params.stateAttributesMapping)
      : {}

  const resolvedInputProps = Array.isArray(params.props)
    ? mergeRenderPropsN(params.props)
    : (params.props ?? {})

  let outProps = mergeProps(stateProps, resolvedInputProps) as Record<
    string,
    unknown
  >

  const classNameInput = params.className
  if (typeof classNameInput === 'function') {
    outProps = mergeProps(outProps, {
      get class() {
        const resolved = classNameInput(params.state)
        const existing =
          (resolvedInputProps.class as string | undefined) ??
          (resolvedInputProps.className as string | undefined)
        return mergeClassNames(existing, resolved)
      },
    })
  } else if (classNameInput !== undefined) {
    const existing =
      (outProps.class as string | undefined) ??
      (outProps.className as string | undefined)
    outProps.class = mergeClassNames(existing, classNameInput)
    delete outProps.className
  }

  const styleInput = params.style
  if (typeof styleInput === 'function') {
    outProps = mergeProps(outProps, {
      get style() {
        const resolved = styleInput(params.state)
        return mergeProps(
          (resolvedInputProps.style as Record<string, unknown> | undefined) ??
            {},
          resolved ?? {}
        )
      },
    })
  } else if (styleInput !== undefined) {
    outProps.style = mergeProps(
      (outProps.style as Record<string, unknown> | undefined) ?? {},
      styleInput
    )
  }

  const renderRef = getRenderElementRef(params.renderProp)
  const refs = [
    outProps.ref as MergeRef<Element> | undefined,
    renderRef,
    ...(Array.isArray(params.ref) ? params.ref : [params.ref]),
  ]
  const mergedRef = mergeRefs(...refs.filter(Boolean))
  if (refs.some(Boolean)) {
    outProps.ref = mergedRef
  }

  return outProps
}
function getRenderElementRef(
  renderProp:
    RenderProp<Record<string, unknown>, Record<string, unknown>> | undefined
): MergeRef<Element> | undefined {
  if (renderProp == null || typeof renderProp !== 'object') {
    return undefined
  }
  if (isRenderElementDescriptor(renderProp)) {
    return renderProp.props?.ref as MergeRef<Element> | undefined
  }
  return undefined
}
function renderDefaultElementProps(
  defaultElement: ValidComponent,
  props: Record<string, unknown>
): Record<string, unknown> {
  if (defaultElement === 'button') {
    return mergeRenderProps({ type: 'button' }, props)
  }
  if (defaultElement === 'img') {
    return mergeRenderProps({ alt: '' }, props)
  }
  return props
}
function isRenderElementDescriptor(
  value: unknown
): value is RenderElementDescriptor {
  return (
    value != null &&
    typeof value === 'object' &&
    'component' in value &&
    typeof (value as RenderElementDescriptor).component === 'string'
  )
}
