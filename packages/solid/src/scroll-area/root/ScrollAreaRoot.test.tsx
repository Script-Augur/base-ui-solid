/**
 * Port of `@base-ui/react` ScrollArea.Root tests (v1.7.0).
 * Browser-only / conformance skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'

import { SCROLL_TIMEOUT } from '../constants'
import { ScrollArea } from '../index'
import { installRafClock } from '../test-utils'

afterEach(cleanup)

describe('<ScrollArea.Root />', () => {
  describe('data-scrolling attribute', () => {
    const clock = installRafClock()

    it('adds [data-scrolling] attribute when viewport is scrolled', async () => {
      render(() => (
        <ScrollArea.Root
          data-testid="root"
          style={{ width: '200px', height: '200px' }}
        >
          <ScrollArea.Viewport
            data-testid="viewport"
            style={{ width: '100%', height: '100%' }}
          >
            <div style={{ width: '1000px', height: '1000px' }} />
          </ScrollArea.Viewport>
        </ScrollArea.Root>
      ))

      const root = screen.getByTestId('root')
      const viewport = screen.getByTestId('viewport')

      expect(root).not.toHaveAttribute('data-scrolling')

      fireEvent.pointerEnter(viewport)
      fireEvent.scroll(viewport, { target: { scrollTop: 1 } })

      expect(root).toHaveAttribute('data-scrolling', '')

      await clock.tick(SCROLL_TIMEOUT)

      expect(root).not.toHaveAttribute('data-scrolling')

      fireEvent.pointerEnter(viewport)
      fireEvent.scroll(viewport, { target: { scrollLeft: 1 } })

      expect(root).toHaveAttribute('data-scrolling', '')

      await clock.tick(SCROLL_TIMEOUT)

      expect(root).not.toHaveAttribute('data-scrolling')
    })
  })

  describe.skip('sizing (browser layout)', () => {
    it('recomputes thumb size when becoming visible without requiring scroll', () => {
      // Upstream: describe.skipIf(isJSDOM) — Storybook coverage.
    })
  })

  describe.skip('overflow data attributes (browser layout)', () => {
    it('applies data attributes based on overflow and edges', () => {
      // Upstream: describe.skipIf(isJSDOM) — Storybook coverage.
    })
  })

  describe.skip('context stability (browser layout)', () => {
    it('does not re-render parts on scroll when the corner size is unchanged', () => {
      // Upstream: describe.skipIf(isJSDOM) — N/A Solid fine-grained updates.
    })
  })
})
