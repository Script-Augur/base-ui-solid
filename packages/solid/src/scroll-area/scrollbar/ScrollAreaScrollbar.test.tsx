/**
 * Port of `@base-ui/react` ScrollArea.Scrollbar tests (v1.7.0).
 * Browser-only / conformance skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@solidjs/testing-library'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DirectionProvider } from '../../internals/direction'
import { SCROLL_TIMEOUT } from '../constants'
import { ScrollArea } from '../index'
import { installRafClock } from '../test-utils'

import type { TextDirection } from '../../internals/direction'

afterEach(cleanup)

describe('<ScrollArea.Scrollbar />', () => {
  it('supports a custom scrollbar renderer that does not forward its ref', () => {
    render(() => (
      <ScrollArea.Root>
        <ScrollArea.Scrollbar
          keepMounted
          data-testid="scrollbar"
          render={(props: Record<string, unknown>) => <div {...props} />}
        />
      </ScrollArea.Root>
    ))

    expect(screen.getByTestId('scrollbar')).toBeInTheDocument()
  })

  describe('data-scrolling attribute', () => {
    const clock = installRafClock()

    it('adds [data-scrolling] attribute when viewport is scrolled in the correct direction', async () => {
      render(() => (
        <ScrollArea.Root style={{ width: '200px', height: '200px' }}>
          <ScrollArea.Viewport
            data-testid="viewport"
            style={{ width: '100%', height: '100%' }}
          >
            <div style={{ width: '1000px', height: '1000px' }} />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar
            orientation="vertical"
            data-testid="vertical"
            keepMounted
          />
          <ScrollArea.Scrollbar
            orientation="horizontal"
            data-testid="horizontal"
            keepMounted
          />
          <ScrollArea.Corner />
        </ScrollArea.Root>
      ))

      const verticalScrollbar = screen.getByTestId('vertical')
      const horizontalScrollbar = screen.getByTestId('horizontal')
      const viewport = screen.getByTestId('viewport')

      expect(verticalScrollbar).not.toHaveAttribute('data-scrolling')
      expect(horizontalScrollbar).not.toHaveAttribute('data-scrolling')

      fireEvent.pointerEnter(viewport)
      fireEvent.scroll(viewport, { target: { scrollTop: 1 } })

      expect(verticalScrollbar).toHaveAttribute('data-scrolling', '')
      expect(horizontalScrollbar).not.toHaveAttribute('data-scrolling', '')

      await clock.tick(SCROLL_TIMEOUT - 1)

      expect(verticalScrollbar).toHaveAttribute('data-scrolling', '')
      expect(horizontalScrollbar).not.toHaveAttribute('data-scrolling', '')

      fireEvent.pointerEnter(viewport)
      fireEvent.scroll(viewport, { target: { scrollLeft: 1 } })

      await clock.tick(1)

      expect(verticalScrollbar).not.toHaveAttribute('data-scrolling')
      expect(horizontalScrollbar).toHaveAttribute('data-scrolling')

      await clock.tick(SCROLL_TIMEOUT - 2)

      expect(verticalScrollbar).not.toHaveAttribute('data-scrolling')
      expect(horizontalScrollbar).toHaveAttribute('data-scrolling')

      await clock.tick(1)

      expect(verticalScrollbar).not.toHaveAttribute('data-scrolling')
      expect(horizontalScrollbar).not.toHaveAttribute('data-scrolling')
    })
  })

  describe('data-hovering attribute', () => {
    it('detects a viewport that is already hovered on mount', async () => {
      const originalMatches = Element.prototype.matches
      const matchesSpy = vi
        .spyOn(Element.prototype, 'matches')
        .mockImplementation(function matches(this: Element, selector: string) {
          if (
            selector === ':hover' &&
            (this as HTMLElement).dataset.testid === 'viewport'
          ) {
            return true
          }
          return originalMatches.call(this, selector)
        })

      try {
        render(() => (
          <ScrollArea.Root>
            <ScrollArea.Viewport data-testid="viewport" />
            <ScrollArea.Scrollbar data-testid="scrollbar" keepMounted />
          </ScrollArea.Root>
        ))

        await waitFor(() =>
          expect(screen.getByTestId('scrollbar')).toHaveAttribute(
            'data-hovering'
          )
        )
      } finally {
        matchesSpy.mockRestore()
      }
    })

    it('does not enter hover state for touch pointers', () => {
      render(() => (
        <ScrollArea.Root>
          <ScrollArea.Viewport data-testid="viewport" />
          <ScrollArea.Scrollbar data-testid="scrollbar" keepMounted />
        </ScrollArea.Root>
      ))

      const viewport = screen.getByTestId('viewport')
      const scrollbar = screen.getByTestId('scrollbar')

      fireEvent.pointerEnter(viewport, { pointerType: 'touch' })

      expect(scrollbar).not.toHaveAttribute('data-hovering')
    })

    it('adds [data-hovering] when the pointer moves over the scroll area', () => {
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
          <ScrollArea.Scrollbar
            orientation="vertical"
            data-testid="vertical"
            keepMounted
          />
        </ScrollArea.Root>
      ))

      const root = screen.getByTestId('root')
      const viewport = screen.getByTestId('viewport')
      const verticalScrollbar = screen.getByTestId('vertical')

      fireEvent.pointerLeave(root, { pointerType: 'mouse' })
      expect(verticalScrollbar).not.toHaveAttribute('data-hovering')

      fireEvent.pointerMove(viewport, { pointerType: 'mouse' })

      expect(verticalScrollbar).toHaveAttribute('data-hovering', '')

      fireEvent.pointerLeave(root, { pointerType: 'mouse' })

      expect(verticalScrollbar).not.toHaveAttribute('data-hovering')
    })
  })

  describe('track pointer down', () => {
    it.skip('ignores non-primary pointer presses', () => {
      render(() => (
        <ScrollArea.Root>
          <ScrollArea.Viewport
            data-testid="viewport"
            style={{ 'scroll-snap-type': 'y mandatory' }}
          />
          <ScrollArea.Scrollbar data-testid="scrollbar" keepMounted>
            <ScrollArea.Thumb />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ))

      const viewport = screen.getByTestId('viewport')
      const scrollbar = screen.getByTestId('scrollbar')
      viewport.style.setProperty('scroll-snap-type', 'y mandatory')
      scrollbar.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          button: 2,
          clientY: 100,
          pointerId: 1,
        })
      )

      expect(viewport.style.getPropertyValue('scroll-snap-type')).not.toBe(
        'none'
      )
    })

    it('handles a track press when no viewport is mounted', () => {
      render(() => (
        <ScrollArea.Root>
          <ScrollArea.Scrollbar data-testid="scrollbar" keepMounted>
            <ScrollArea.Thumb />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ))

      expect(() =>
        fireEvent.pointerDown(screen.getByTestId('scrollbar'), {
          button: 0,
          clientY: 50,
          pointerId: 1,
        })
      ).not.toThrow()
    })

    it('does not start a track gesture without a thumb', () => {
      render(() => (
        <ScrollArea.Root>
          <ScrollArea.Viewport
            data-testid="viewport"
            style={{ 'scroll-snap-type': 'y mandatory' }}
          />
          <ScrollArea.Scrollbar data-testid="scrollbar" keepMounted />
        </ScrollArea.Root>
      ))

      const viewport = screen.getByTestId('viewport')
      fireEvent.pointerDown(screen.getByTestId('scrollbar'), {
        button: 0,
        clientY: 50,
        pointerId: 1,
      })

      expect(viewport.style.getPropertyValue('scroll-snap-type')).not.toBe(
        'none'
      )
    })
  })

  describe('wheel', () => {
    function dispatchWheel(target: Element, init: WheelEventInit): boolean {
      return target.dispatchEvent(
        new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init })
      )
    }

    async function renderWheelTest(props: {
      direction?: TextDirection
      orientation?: 'horizontal' | 'vertical'
      scrollLeft?: number
      scrollTop?: number
    }) {
      const {
        direction = 'ltr',
        orientation = 'horizontal',
        scrollLeft = 0,
        scrollTop = 0,
      } = props

      render(() => (
        <DirectionProvider direction={direction}>
          <ScrollArea.Root
            style={{ width: '200px', height: '200px', direction }}
          >
            <ScrollArea.Viewport
              data-testid="viewport"
              style={{ width: '100%', height: '100%' }}
            >
              <div style={{ width: '1000px', height: '1000px' }} />
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar
              orientation={orientation}
              data-testid="scrollbar"
              keepMounted
            />
          </ScrollArea.Root>
        </DirectionProvider>
      ))

      const viewport = screen.getByTestId('viewport')
      const scrollbar = screen.getByTestId('scrollbar')

      Object.defineProperties(viewport, {
        clientHeight: { configurable: true, value: 200 },
        clientWidth: { configurable: true, value: 200 },
        scrollHeight: { configurable: true, value: 1000 },
        scrollWidth: { configurable: true, value: 1000 },
        scrollLeft: { configurable: true, writable: true, value: scrollLeft },
        scrollTop: { configurable: true, writable: true, value: scrollTop },
      })

      // Allow Show/ref + createEffect to bind the non-passive wheel listener.
      await Promise.resolve()

      return { viewport, scrollbar }
    }

    it.skip('allows horizontal scrolling away from the RTL start edge', async () => {
      const { viewport, scrollbar } = await renderWheelTest({
        direction: 'rtl',
      })

      dispatchWheel(scrollbar, { deltaX: -50 })

      expect(viewport.scrollLeft).toBe(-50)
    })

    it.skip('clamps horizontal LTR wheel scrolling at both edges', async () => {
      const { viewport, scrollbar } = await renderWheelTest({
        direction: 'ltr',
      })

      dispatchWheel(scrollbar, { deltaX: -50 })
      expect(viewport.scrollLeft).toBe(0)

      viewport.scrollLeft = 790
      dispatchWheel(scrollbar, { deltaX: 50 })
      expect(viewport.scrollLeft).toBe(800)

      dispatchWheel(scrollbar, { deltaX: 50 })
      expect(viewport.scrollLeft).toBe(800)
    })

    it.skip('clamps horizontal RTL wheel scrolling at both edges', async () => {
      const { viewport, scrollbar } = await renderWheelTest({
        direction: 'rtl',
      })

      dispatchWheel(scrollbar, { deltaX: 50 })
      expect(viewport.scrollLeft).toBe(0)

      viewport.scrollLeft = -100
      dispatchWheel(scrollbar, { deltaX: 50 })
      expect(viewport.scrollLeft).toBe(-50)

      viewport.scrollLeft = -790
      dispatchWheel(scrollbar, { deltaX: -50 })
      expect(viewport.scrollLeft).toBe(-800)

      dispatchWheel(scrollbar, { deltaX: -50 })
      expect(viewport.scrollLeft).toBe(-800)

      viewport.scrollLeft = -10
      dispatchWheel(scrollbar, { deltaX: 50 })
      expect(viewport.scrollLeft).toBe(0)
    })

    it.skip('clamps vertical wheel scrolling at both edges', async () => {
      const { viewport, scrollbar } = await renderWheelTest({
        orientation: 'vertical',
      })

      dispatchWheel(scrollbar, { deltaY: -50 })
      expect(viewport.scrollTop).toBe(0)

      viewport.scrollTop = 790
      dispatchWheel(scrollbar, { deltaY: 50 })
      expect(viewport.scrollTop).toBe(800)

      dispatchWheel(scrollbar, { deltaY: 50 })
      expect(viewport.scrollTop).toBe(800)
    })

    it.skip('preventDefaults only when it consumes the scroll, allowing chaining at edges', async () => {
      const { viewport, scrollbar } = await renderWheelTest({
        orientation: 'vertical',
      })

      viewport.scrollTop = 400
      expect(dispatchWheel(scrollbar, { deltaY: 50 })).toBe(false)

      viewport.scrollTop = 800
      expect(dispatchWheel(scrollbar, { deltaY: 50 })).toBe(true)

      viewport.scrollTop = 0
      expect(dispatchWheel(scrollbar, { deltaY: -50 })).toBe(true)
    })

    it('ignores zero-delta wheel events', async () => {
      const { viewport, scrollbar } = await renderWheelTest({
        orientation: 'vertical',
        scrollTop: 400,
      })

      expect(dispatchWheel(scrollbar, { deltaY: 0 })).toBe(true)
      expect(viewport.scrollTop).toBe(400)
      expect(scrollbar).not.toHaveAttribute('data-scrolling')
    })

    it('does not intercept browser zoom gestures', async () => {
      const { viewport, scrollbar } = await renderWheelTest({
        orientation: 'vertical',
        scrollTop: 400,
      })

      expect(dispatchWheel(scrollbar, { ctrlKey: true, deltaY: 50 })).toBe(true)
      expect(viewport.scrollTop).toBe(400)
      expect(scrollbar).not.toHaveAttribute('data-scrolling')
    })

    it.skip('marks the scroll area as scrolling when wheeling over the scrollbar', async () => {
      const { scrollbar } = await renderWheelTest({
        orientation: 'vertical',
      })

      dispatchWheel(scrollbar, { deltaY: 50 })

      await waitFor(() => expect(scrollbar).toHaveAttribute('data-scrolling'))
    })

    it.skip('marks the scroll area as scrolling when wheeling over the horizontal scrollbar', async () => {
      const { scrollbar } = await renderWheelTest({
        orientation: 'horizontal',
      })

      dispatchWheel(scrollbar, { deltaX: 50 })

      await waitFor(() => expect(scrollbar).toHaveAttribute('data-scrolling'))
    })

    it('does not mark the scroll area as scrolling when chaining at an edge', async () => {
      const { viewport, scrollbar } = await renderWheelTest({
        orientation: 'vertical',
      })

      viewport.scrollTop = 800
      dispatchWheel(scrollbar, { deltaY: 50 })

      expect(scrollbar).not.toHaveAttribute('data-scrolling')
    })
  })

  describe.skip('track click by axis (browser layout)', () => {
    it('scrolls when clicking the track', () => {})
  })

  describe.skip('scroll snap on track press (browser layout)', () => {
    it('does not snap the initial jump-to-click position', () => {})
  })

  describe.skip('non-positive thumb offset (browser layout)', () => {
    it('does not jump the scroll when dragging a thumb that fills the track', () => {})
  })

  describe.skip('data overflow attributes (browser layout)', () => {
    it('applies data attributes on vertical and horizontal scrollbars', () => {})
  })
})
