import { For } from 'solid-js'

import { useComboboxRootContext } from '../root/ComboboxRootContext'

import type { JSX } from 'solid-js'

/**
 * Maps filtered items to children.
 * Requires `items` / `filteredItems` on the root.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export function ComboboxCollection(
  componentProps: ComboboxCollectionProps
): JSX.Element {
  const context = useComboboxRootContext()
  const items = () => {
    const filtered = context.filteredItems()
    if (filtered) return filtered
    const source = context.items()
    if (Array.isArray(source)) return source as ReadonlyArray<unknown>
    return []
  }

  return (
    <For each={items()}>
      {(item, index) => componentProps.children(item, index())}
    </For>
  )
}

export interface ComboboxCollectionProps {
  children: (item: unknown, index: number) => JSX.Element
}
