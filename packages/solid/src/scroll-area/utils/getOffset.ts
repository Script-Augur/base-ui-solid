/**
 * Reads computed margin/padding along an axis for thumb/track offset math.
 *
 * @param element - Element to measure, or `null`.
 * @param prop - `'margin'` or `'padding'`.
 * @param axis - `'x'` (inline) or `'y'` (block).
 * @returns Sum of start + end offsets (Safari RTL margin quirk handled).
 */
export function getOffset(
  element: Element | null,
  prop: 'margin' | 'padding',
  axis: 'x' | 'y'
): number {
  if (!element) {
    return 0
  }

  const styles = getComputedStyle(element)
  const key = `${prop}${axis === 'x' ? 'Inline' : 'Block'}` as const
  const start = parseFloat(
    styles[`${key}Start` as keyof CSSStyleDeclaration] as string
  )

  // Safari misreports `marginInlineEnd` in RTL.
  // We have to assume the start/end values are symmetrical, which is likely.
  if (axis === 'x' && prop === 'margin') {
    return start * 2
  }

  return (
    start +
    parseFloat(styles[`${key}End` as keyof CSSStyleDeclaration] as string)
  )
}
