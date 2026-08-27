/**
 * Merges multiple refs into a single callback ref.
 *
 * @typeParam T - Element type refs point to.
 * @param refs - Ref callbacks and/or ref objects.
 * @returns Callback that assigns the element to every ref.
 */
export function mergeRefs<T>(
  ...refs: Array<MergeRef<T>>
): (element: T | null) => void {
  return element => {
    for (const ref of refs) {
      assignRef(ref, element)
    }
  }
}
/** Solid ref callback or ref object (React-compat). */
export type MergeRef<T> =
  ((element: T) => void) | { current: T | null | undefined } | null | undefined
function assignRef<T>(ref: MergeRef<T>, element: T | null): void {
  if (typeof ref === 'function') {
    ref(element as T)
    return
  }
  if (ref && typeof ref === 'object' && 'current' in ref) {
    ref.current = element
  }
}
