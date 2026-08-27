/**
 * Maps component state fields to `data-*` attributes (Base UI convention).
 *
 * @typeParam TState - Component state object shape.
 */
export type StateAttributesMapping<TState extends Record<string, unknown>> = {
  [Property in keyof TState]?: (
    value: TState[Property]
  ) => Record<string, string> | null
}
