/**
 * Combines multiple cleanup functions into a single cleanup function.
 *
 * Matches `@base-ui/utils/mergeCleanups`.
 *
 * @param cleanups - Cleanup callbacks (falsy entries are ignored).
 * @returns A function that runs each cleanup in order.
 */
export function mergeCleanups(...cleanups: Array<Cleanup>): () => void {
  return () => {
    for (const cleanup of cleanups) {
      if (cleanup) {
        cleanup()
      }
    }
  }
}
type Cleanup = false | null | undefined | (() => void)
