import { For, createMemo } from 'solid-js'

import { Toast } from '../index'
import { useToastManager } from '../useToastManager'

import type { JSX } from 'solid-js'

/**
 * Minimal toast list for tests — maps store toasts to Root + parts.
 * Keys by toast id so height / status updates do not remount roots.
 *
 * @returns Toast roots for the current manager toasts.
 */
export function List(): JSX.Element {
  const { toasts } = useToastManager()
  const ids = createMemo(() => toasts().map(toast => toast.id))

  return (
    <For each={ids()}>
      {id => {
        const toast = createMemo(() => toasts().find(item => item.id === id)!)
        return (
          <Toast.Root data-testid="root" toast={toast()}>
            <Toast.Content>
              <Toast.Title data-testid="title">{toast().title}</Toast.Title>
              <Toast.Description data-testid="description">
                {toast().description}
              </Toast.Description>
              <Toast.Close data-testid="close">Close</Toast.Close>
              <Toast.Action data-testid="action" />
            </Toast.Content>
          </Toast.Root>
        )
      }}
    </For>
  )
}
