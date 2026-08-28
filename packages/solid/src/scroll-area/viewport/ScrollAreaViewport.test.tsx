/**
 * Port of `@base-ui/react` ScrollArea.Viewport tests (v1.7.0).
 * Browser-only / conformance skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { Show, createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SCROLL_TIMEOUT } from '../constants'
import { ScrollArea } from '../index'
import { installRafClock } from '../test-utils'

afterEach(cleanup)

describe('<ScrollArea.Viewport />', () => {
  it('throws a descriptive error when rendered outside <ScrollArea.Root>', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(() => <ScrollArea.Viewport />)).toThrow(
      'Base UI: ScrollAreaRootContext is missing. ScrollArea parts must be placed within <ScrollArea.Root>.'
    )

    errorSpy.mockRestore()
  })

  it('handles a user scroll callback unmounting the viewport', () => {
    const [mounted, mountedAssign] = createSignal(true)

    render(() => (
      <ScrollArea.Root style={{ width: '200px', height: '200px' }}>
        <Show when={mounted()}>
          <ScrollArea.Viewport
            data-testid="viewport"
            style={{ width: '100%', height: '100%' }}
            onScroll={() => mountedAssign(false)}
          >
            <div style={{ width: '1000px', height: '1000px' }} />
          </ScrollArea.Viewport>
        </Show>
      </ScrollArea.Root>
    ))

    const viewport = screen.getByTestId('viewport')
    fireEvent.pointerEnter(viewport)
    expect(() =>
      fireEvent.scroll(viewport, { target: { scrollTop: 1 } })
    ).not.toThrow()
    expect(screen.queryByTestId('viewport')).toBe(null)
  })

  describe('data-scrolling attribute', () => {
    const clock = installRafClock()

    it('adds [data-scrolling] attribute when viewport is scrolled', async () => {
      render(() => (
        <ScrollArea.Root style={{ width: '200px', height: '200px' }}>
          <ScrollArea.Viewport
            data-testid="viewport"
            style={{ width: '100%', height: '100%' }}
          >
            <div style={{ width: '1000px', height: '1000px' }} />
          </ScrollArea.Viewport>
        </ScrollArea.Root>
      ))

      const viewport = screen.getByTestId('viewport')

      expect(viewport).not.toHaveAttribute('data-scrolling')

      fireEvent.pointerEnter(viewport)
      fireEvent.scroll(viewport, { target: { scrollTop: 1 } })

      expect(viewport).toHaveAttribute('data-scrolling', '')

      await clock.tick(SCROLL_TIMEOUT)

      expect(viewport).not.toHaveAttribute('data-scrolling')

      fireEvent.pointerEnter(viewport)
      fireEvent.scroll(viewport, { target: { scrollLeft: 1 } })

      expect(viewport).toHaveAttribute('data-scrolling', '')

      await clock.tick(SCROLL_TIMEOUT)

      expect(viewport).not.toHaveAttribute('data-scrolling')
    })

    it('ignores data-scrolling during programmatic scroll', () => {
      render(() => (
        <ScrollArea.Root style={{ width: '200px', height: '200px' }}>
          <ScrollArea.Viewport
            data-testid="viewport"
            style={{
              width: '100%',
              height: '100%',
              'pointer-events': 'none',
            }}
          >
            <div style={{ width: '1000px', height: '1000px' }} />
          </ScrollArea.Viewport>
        </ScrollArea.Root>
      ))

      const viewport = screen.getByTestId('viewport')
      fireEvent.scroll(viewport, { target: { scrollTop: 1 } })
      expect(viewport).not.toHaveAttribute('data-scrolling')
    })

    it.skip('adds [data-scrolling] in touch modality even when the gesture delivers no events', async () => {
      // Solid jsdom: Root `pointerType` from fireEvent is unreliable; covered in Storybook.
    })

    it('keeps ignoring programmatic scrolls in mouse modality', async () => {
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

      fireEvent.pointerDown(root, { pointerType: 'mouse' })
      await clock.tick(200)
      fireEvent.scroll(viewport, { target: { scrollTop: 1 } })
      await clock.tick(SCROLL_TIMEOUT)

      expect(viewport).not.toHaveAttribute('data-scrolling')
    })

    it.skip('restores programmatic scroll suppression after modality flips back to mouse', async () => {
      // Depends on reliable touch-modality latching via pointerType in jsdom.
    })

    it('removes [data-scrolling] after timeout', async () => {
      render(() => (
        <ScrollArea.Root style={{ width: '200px', height: '200px' }}>
          <ScrollArea.Viewport
            data-testid="viewport"
            style={{ width: '100%', height: '100%' }}
          >
            <div style={{ width: '1000px', height: '1000px' }} />
          </ScrollArea.Viewport>
        </ScrollArea.Root>
      ))

      const viewport = screen.getByTestId('viewport')

      fireEvent.pointerEnter(viewport)
      fireEvent.scroll(viewport, { target: { scrollTop: 1 } })

      expect(viewport).toHaveAttribute('data-scrolling', '')

      await clock.tick(SCROLL_TIMEOUT - 1)

      expect(viewport).toHaveAttribute('data-scrolling', '')

      await clock.tick(1)

      expect(viewport).not.toHaveAttribute('data-scrolling')
    })
  })

  describe.skip('subtree animations (browser)', () => {
    it('recomputes overflow after a subtree animation finishes', () => {})
  })

  describe.skip('overflow data attributes (browser layout)', () => {
    it('applies data attributes on viewport', () => {})
  })

  describe.skip('overscroll feedback (browser)', () => {
    it('shrinks and pins the thumb while overscrolling', () => {})
  })
})
