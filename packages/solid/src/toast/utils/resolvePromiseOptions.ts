import type { ToastManagerUpdateOptions } from '../useToastManager'

/**
 * Resolves promise toast options (string, object, or result callback) into update options.
 *
 * @param options - Loading / success / error option input.
 * @param result - Optional result passed to function options.
 * @returns Normalized update options.
 */
export function resolvePromiseOptions<T, TData extends object>(
  options:
    | string
    | ToastManagerUpdateOptions<TData>
    | ((result: T) => string | ToastManagerUpdateOptions<TData>),
  result?: T
): ToastManagerUpdateOptions<TData> {
  if (typeof options === 'string') {
    return {
      description: options,
    }
  }

  if (typeof options === 'function') {
    const resolvedOptions = options(result as T)
    return typeof resolvedOptions === 'string'
      ? { description: resolvedOptions }
      : resolvedOptions
  }

  return options
}
