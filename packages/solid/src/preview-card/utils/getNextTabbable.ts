import { ownerDocument } from '@script-augur/base-ui-utils'
import { tabbable } from 'tabbable'

/**
 * Returns the next page tabbable after `from` in document order.
 *
 * Used by non-modal PreviewCard after-guards. Skips other focus guards so Tab
 * continues past the portal rather than bouncing to the trigger.
 *
 * @param from - Anchor element (the after-guard, or the trigger as fallback).
 * @returns The next tabbable, or `null` when none.
 */
export function getNextTabbable(
  from: Element | null | undefined
): HTMLElement | null {
  if (from == null) return null

  const doc = ownerDocument(from)
  const list = tabbable(doc.body, {
    includeContainer: false,
    // jsdom has no layout; `full` display checks yield an empty list.
    displayCheck: 'none',
  }) as Array<HTMLElement>

  for (const el of list) {
    if (
      !(from.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)
    ) {
      continue
    }
    if (el.hasAttribute('data-base-ui-focus-guard')) {
      continue
    }
    return el
  }

  return null
}
