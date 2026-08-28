// Data-attribute strings inlined so `ScrollAreaRootDataAttributes` tree-shakes out.
// `value` is `unknown` so the mapping satisfies `StateAttributesMapping<T & Record<string, unknown>>`.
const attr = (name: string) => (value: unknown) =>
  value ? { [name]: '' } : null

export const scrollAreaStateAttributesMapping = {
  hasOverflowX: attr('data-has-overflow-x'),
  hasOverflowY: attr('data-has-overflow-y'),
  overflowXStart: attr('data-overflow-x-start'),
  overflowXEnd: attr('data-overflow-x-end'),
  overflowYStart: attr('data-overflow-y-start'),
  overflowYEnd: attr('data-overflow-y-end'),
  cornerHidden: () => null,
}
