import { createRender } from './createRender'
import { mergeRenderProps } from './mergeRenderProps'

import type { StateAttributesMapping } from './getStateAttributesProps.types'
import type { JSX, ValidComponent } from 'solid-js'
/**
 * Resolves a Base UI-style `render` prop into a Solid element.
 *
 * Thin wrapper around {@link createRender} for the common tag / component /
 * `(props, state)` cases without JSX-element `render` merging.
 */
export function useRender<
  TProps extends Record<string, unknown>,
  TState extends Record<string, unknown> = Record<string, never>,
>(options: UseRenderOptions<TProps, TState>): JSX.Element | undefined {
  return createRender<TState, TProps>({
    defaultElement: options.defaultElement,
    props: options.props,
    state: options.state,
    render: options.render as never,
    ref: options.ref as never,
    stateAttributesMapping: options.stateAttributesMapping,
    enabled: options.enabled,
    class: options.class,
    style: options.style,
  })
}
/** @see {@link mergeRenderProps} */
export function mergeAttrs(
  ...objects: Array<Record<string, unknown> | null | undefined>
): Record<string, unknown> {
  return mergeRenderProps(...objects.filter(Boolean))
}
/** Boolean → `data-*` attribute helper (`""` when true, omitted when false). */
export function dataAttr(condition: boolean | undefined): '' | undefined {
  return condition ? '' : undefined
}
/** Invokes an optional event handler. */
export function callHandler<T extends Event>(
  handler: ((event: T) => void) | undefined,
  event: T
): void {
  handler?.(event)
}
export type RenderFn<
  TProps extends Record<string, unknown>,
  TState = Record<string, never>,
> = (props: TProps, state: TState) => JSX.Element
export type RenderProp<
  TProps extends Record<string, unknown>,
  TState = Record<string, never>,
> = ValidComponent | RenderFn<TProps, TState>
export interface UseRenderOptions<
  TProps extends Record<string, unknown>,
  TState extends Record<string, unknown> = Record<string, never>,
> {
  defaultElement: ValidComponent
  props: TProps
  state?: TState
  render?: RenderProp<TProps, TState>
  ref?: CreateRenderRef<TProps>
  stateAttributesMapping?: CreateRenderStateMapping<TState>
  enabled?: boolean
  class?: string | ((state: TState) => string | undefined)
  style?:
    | Record<string, string | number>
    | ((state: TState) => Record<string, string | number> | undefined)
}
type CreateRenderRef<TProps> = TProps extends { ref?: infer R } ? R : never
type CreateRenderStateMapping<TState extends Record<string, unknown>> =
  StateAttributesMapping<TState>
