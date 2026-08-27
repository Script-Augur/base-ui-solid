import type { StateAttributesMapping } from './getStateAttributesProps.types'
/**
 * Converts state fields to reactive `data-*` attribute props.
 *
 * @typeParam TState - Component state object shape.
 * @param state - Current component state (may use getters for reactivity).
 * @param customMapping - Optional per-key attribute mappers.
 * @returns Attribute bag with getters for reactive state.
 */
export function getStateAttributesProps<TState extends Record<string, unknown>>(
  state: TState,
  customMapping?: StateAttributesMapping<TState>
): Record<string, string | undefined> {
  const props: Record<string, string | undefined> = {}

  for (const key of Object.keys(state) as Array<keyof TState>) {
    const mapper = customMapping?.[key]

    if (mapper) {
      const attrNames = collectMapperAttributeNames(mapper, state[key])
      for (const attrName of attrNames) {
        Object.defineProperty(props, attrName, {
          configurable: true,
          enumerable: true,
          get() {
            const customProps = mapper(state[key])
            if (customProps == null) {
              return undefined
            }
            return customProps[attrName]
          },
        })
      }
      continue
    }

    const attrName = `data-${String(key).toLowerCase()}`
    Object.defineProperty(props, attrName, {
      configurable: true,
      enumerable: true,
      get() {
        const value = state[key]
        if (value === true) {
          return ''
        }
        if (value) {
          return String(value)
        }
        return undefined
      },
    })
  }

  return props
}
export type { StateAttributesMapping } from './getStateAttributesProps.types'
function collectMapperAttributeNames<TState, TKey extends keyof TState>(
  mapper: (value: TState[TKey]) => Record<string, string> | null,
  currentValue: TState[TKey]
): Set<string> {
  const names = new Set<string>()
  const probes = new Set<unknown>([
    currentValue,
    true,
    false,
    0,
    1,
    '',
    'indeterminate',
    'progressing',
    'complete',
  ])

  for (const probe of probes) {
    const result = mapper(probe as TState[TKey])
    if (result) {
      for (const name of Object.keys(result)) {
        names.add(name)
      }
    }
  }

  return names
}
