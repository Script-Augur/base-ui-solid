import { generateId } from '@script-augur/base-ui-utils'

import type {
  ToastManagerAddOptions,
  ToastManagerPromiseOptions,
  ToastManagerUpdateOptions,
  ToastObject,
} from './types'

/**
 * Creates a new toast manager for use outside of components.
 *
 * @typeParam Data - Custom toast data shape.
 * @returns A {@link ToastManager} that bridges into a mounted Provider.
 */
export function createToastManager<
  TData extends object = Record<string, never>,
>(): ToastManager<TData> {
  const listeners = new Set<(data: ToastManagerEvent) => void>()

  function emit(data: ToastManagerEvent) {
    listeners.forEach(listener => listener(data))
  }

  return {
    // This should be private aside from ToastProvider needing to access it.
    // https://x.com/drosenwasser/status/1816947740032872664
    ' subscribe': function subscribe(
      listener: (data: ToastManagerEvent) => void
    ) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    add<T extends TData = TData>(options: ToastManagerAddOptions<T>): string {
      const id = options.id || generateId('toast')
      const toastToAdd: ToastObject<T> = {
        ...options,
        id,
        transitionStatus: 'starting',
      }

      emit({
        action: 'add',
        options: toastToAdd as ToastManagerEvent['options'],
      })

      return id
    },

    close(id?: string): void {
      emit({
        action: 'close',
        options: { id },
      })
    },

    update<T extends TData = TData>(
      id: string,
      updates: ToastManagerUpdateOptions<T>
    ): void {
      emit({
        action: 'update',
        options: {
          ...updates,
          id,
        },
      })
    },

    promise<TValue, T extends TData = TData>(
      promiseValue: Promise<TValue>,
      options: ToastManagerPromiseOptions<TValue, T>
    ): Promise<TValue> {
      let handledPromise = promiseValue

      emit({
        action: 'promise',
        options: {
          ...options,
          promise: promiseValue,
          setPromise(promise: Promise<TValue>) {
            handledPromise = promise
          },
        } as ToastManagerEvent['options'],
      })

      return handledPromise
    },
  }
}

/** Imperative toast manager bridged through {@link createToastManager}. */
export interface ToastManager<TData extends object = Record<string, never>> {
  ' subscribe': (listener: (data: ToastManagerEvent) => void) => () => void
  add: <T extends TData = TData>(options: ToastManagerAddOptions<T>) => string
  close: (id?: string) => void
  update: <T extends TData = TData>(
    id: string,
    updates: ToastManagerUpdateOptions<T>
  ) => void
  promise: <TValue, T extends TData = TData>(
    promiseValue: Promise<TValue>,
    options: ToastManagerPromiseOptions<TValue, T>
  ) => Promise<TValue>
}

/** Event emitted by {@link ToastManager} to a subscribed Provider. */
export interface ToastManagerEvent {
  action: 'add' | 'close' | 'update' | 'promise'
  // Intentionally loose: add/update/promise payloads differ by action (matches 1.7.0).
  options: {
    id?: string
    promise?: Promise<unknown>
    setPromise?: (promise: Promise<unknown>) => void
    [key: string]: unknown
  }
}
