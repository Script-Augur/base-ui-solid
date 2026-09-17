import { useToastProviderContext } from './provider/ToastProviderContext'

import type { ToastObject, UseToastManagerReturnValue } from './types'
import type { Accessor } from 'solid-js'

/**
 * Returns the array of toasts and methods to manage them.
 *
 * @typeParam Data - Custom toast data shape.
 * @returns Manager API with reactive `toasts` accessor.
 */
export function useToastManager<
  TData extends object = Record<string, never>,
>(): UseToastManagerReturnValue<TData> {
  const store = useToastProviderContext()

  return {
    toasts: store.select('toasts') as Accessor<Array<ToastObject<TData>>>,
    add: store.addToast,
    close: store.closeToast,
    update: store.updateToast,
    promise: store.promiseToast,
  }
}

export type {
  ToastObject,
  ToastManagerAddOptions,
  ToastManagerUpdateOptions,
  ToastManagerPromiseOptions,
  ToastManagerPositionerProps,
  UseToastManagerReturnValue,
} from './types'
