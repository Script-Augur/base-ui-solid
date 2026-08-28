/**
 * Port of `@base-ui/react` Scroll Area enum sync tests (v1.7.0).
 */
import { cleanup, render, screen } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'

import { ScrollAreaRootCssVars } from './root/ScrollAreaRootCssVars'
import { ScrollAreaRootDataAttributes } from './root/ScrollAreaRootDataAttributes'
import { scrollAreaStateAttributesMapping } from './root/stateAttributes'
import { ScrollAreaScrollbarCssVars } from './scrollbar/ScrollAreaScrollbarCssVars'
import { ScrollAreaScrollbarDataAttributes } from './scrollbar/ScrollAreaScrollbarDataAttributes'
import { ScrollAreaViewportCssVars } from './viewport/ScrollAreaViewportCssVars'

import { ScrollArea } from './index'

afterEach(cleanup)

describe('Scroll Area enum sync', () => {
  it('names the overflow data-attributes per ScrollAreaRootDataAttributes', () => {
    const keys = [
      'hasOverflowX',
      'hasOverflowY',
      'overflowXStart',
      'overflowXEnd',
      'overflowYStart',
      'overflowYEnd',
    ] as const

    for (const key of keys) {
      const emitted = scrollAreaStateAttributesMapping[key](true)
      expect(Object.keys(emitted!)[0]).toBe(ScrollAreaRootDataAttributes[key])
    }
  })

  it('names the scrollbar orientation attribute per ScrollAreaScrollbarDataAttributes', () => {
    render(() => (
      <ScrollArea.Root>
        <ScrollArea.Scrollbar
          orientation="horizontal"
          keepMounted
          data-testid="scrollbar"
        />
      </ScrollArea.Root>
    ))

    expect(screen.getByTestId('scrollbar')).toHaveAttribute(
      ScrollAreaScrollbarDataAttributes.orientation,
      'horizontal'
    )
  })

  it('names the corner and thumb CSS variables per the *CssVars enums', () => {
    render(() => (
      <ScrollArea.Root data-testid="root">
        <ScrollArea.Scrollbar
          orientation="vertical"
          keepMounted
          data-testid="scrollbar-y"
        />
        <ScrollArea.Scrollbar
          orientation="horizontal"
          keepMounted
          data-testid="scrollbar-x"
        />
      </ScrollArea.Root>
    ))

    const root = screen.getByTestId('root')
    const scrollbarY = screen.getByTestId('scrollbar-y')
    const scrollbarX = screen.getByTestId('scrollbar-x')

    expect(
      root.style.getPropertyValue(ScrollAreaRootCssVars.scrollAreaCornerHeight)
    ).not.toBe('')
    expect(
      root.style.getPropertyValue(ScrollAreaRootCssVars.scrollAreaCornerWidth)
    ).not.toBe('')
    expect(
      scrollbarY.style.getPropertyValue(
        ScrollAreaScrollbarCssVars.scrollAreaThumbHeight
      )
    ).not.toBe('')
    expect(
      scrollbarX.style.getPropertyValue(
        ScrollAreaScrollbarCssVars.scrollAreaThumbWidth
      )
    ).not.toBe('')
  })

  it.skip('names the overflow CSS variables per ScrollAreaViewportCssVars (browser layout)', () => {
    // Upstream: `it.skipIf(isJSDOM)`. Covered in Storybook / browser QA.
    void ScrollAreaViewportCssVars
  })
})
