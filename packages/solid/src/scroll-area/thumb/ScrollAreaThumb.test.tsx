/**
 * Port of `@base-ui/react` ScrollArea.Thumb tests (v1.7.0).
 * Browser-only / conformance skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { Show, createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SCROLL_TIMEOUT } from '../constants'
import { ScrollArea } from '../index'
import { installRafClock } from '../test-utils'

afterEach(cleanup)

describe('<ScrollArea.Thumb />', () => {
  it('throws a descriptive error when rendered outside <ScrollArea.Scrollbar>', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() =>
      render(() => (
        <ScrollArea.Root>
          <ScrollArea.Thumb />
        </ScrollArea.Root>
      ))
    ).toThrow(
      'Base UI: ScrollAreaScrollbarContext is missing. ScrollAreaScrollbar parts must be placed within <ScrollArea.Scrollbar>.'
    )

    errorSpy.mockRestore()
  })

  it('handles a thumb gesture when no viewport is mounted', () => {
    render(() => (
      <ScrollArea.Root>
        <ScrollArea.Scrollbar keepMounted>
          <ScrollArea.Thumb data-testid="thumb" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    ))

    const thumb = screen.getByTestId('thumb')
    Object.defineProperties(thumb, {
      setPointerCapture: { configurable: true, value: () => {} },
      hasPointerCapture: { configurable: true, value: () => false },
    })

    fireEvent.pointerDown(thumb, { button: 0, clientY: 0, pointerId: 1 })
    fireEvent.pointerMove(thumb, { clientY: 20, pointerId: 1, buttons: 1 })

    expect(thumb).not.toHaveAttribute('data-scrolling')
    expect(thumb.style.transform).toBe('')

    fireEvent.pointerUp(thumb, { pointerId: 1 })
    expect(thumb).not.toHaveAttribute('data-scrolling')
  })

  it('handles the scrollbar unmounting from a user pointer-move callback', () => {
    const [mounted, mountedAssign] = createSignal(true)

    render(() => (
      <ScrollArea.Root>
        <ScrollArea.Viewport data-testid="viewport" />
        <Show when={mounted()}>
          <ScrollArea.Scrollbar keepMounted data-testid="scrollbar">
            <ScrollArea.Thumb
              data-testid="thumb"
              onPointerMove={() => mountedAssign(false)}
            />
          </ScrollArea.Scrollbar>
        </Show>
      </ScrollArea.Root>
    ))

    const viewport = screen.getByTestId('viewport')
    const thumb = screen.getByTestId('thumb')
    Object.defineProperty(thumb, 'setPointerCapture', {
      configurable: true,
      value: () => {},
    })

    fireEvent.pointerDown(thumb, { button: 0, clientY: 0, pointerId: 1 })
    expect(() =>
      fireEvent.pointerMove(thumb, { clientY: 20, pointerId: 1, buttons: 1 })
    ).not.toThrow()

    expect(screen.queryByTestId('scrollbar')).toBe(null)
    expect(Number.isFinite(viewport.scrollTop) ? viewport.scrollTop : 0).toBe(0)
  })

  it('handles the viewport unmounting from a user pointer-up callback', () => {
    const [mounted, mountedAssign] = createSignal(true)

    render(() => (
      <ScrollArea.Root>
        <Show when={mounted()}>
          <ScrollArea.Viewport
            data-testid="viewport"
            style={{ 'scroll-snap-type': 'y mandatory' }}
          />
        </Show>
        <ScrollArea.Scrollbar keepMounted>
          <ScrollArea.Thumb
            data-testid="thumb"
            onPointerUp={() => mountedAssign(false)}
          />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    ))

    const viewport = screen.getByTestId('viewport')
    viewport.style.setProperty('scroll-snap-type', 'y mandatory')
    const thumb = screen.getByTestId('thumb')
    Object.defineProperties(thumb, {
      setPointerCapture: { configurable: true, value: () => {} },
      hasPointerCapture: { configurable: true, value: () => false },
    })

    fireEvent.pointerDown(thumb, { button: 0, clientY: 0, pointerId: 1 })
    expect(viewport.style.getPropertyValue('scroll-snap-type')).toBe('none')

    expect(() => fireEvent.pointerUp(thumb, { pointerId: 1 })).not.toThrow()
    expect(screen.queryByTestId('viewport')).toBe(null)
  })

  it('clears scrolling state on pointer cancel without releasing stale capture', () => {
    render(() => (
      <ScrollArea.Root style={{ width: '200px', height: '200px' }}>
        <ScrollArea.Viewport
          data-testid="viewport"
          style={{ width: '100%', height: '100%' }}
        >
          <div style={{ width: '1000px', height: '1000px' }} />
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar keepMounted>
          <ScrollArea.Thumb data-testid="thumb" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    ))

    const thumb = screen.getByTestId('thumb')
    const releaseSpy = vi.fn()
    Object.defineProperties(thumb, {
      setPointerCapture: { configurable: true, value: () => {} },
      hasPointerCapture: { configurable: true, value: () => false },
      releasePointerCapture: { configurable: true, value: releaseSpy },
    })

    fireEvent.pointerDown(thumb, { button: 0, clientY: 0, pointerId: 1 })
    fireEvent.pointerCancel(thumb, { pointerId: 1 })

    expect(releaseSpy).not.toHaveBeenCalled()
    expect(thumb).not.toHaveAttribute('data-scrolling')
  })

  describe('scroll snap', () => {
    it('disables viewport scroll snap while dragging and restores it on release', () => {
      render(() => (
        <ScrollArea.Root>
          <ScrollArea.Viewport
            data-testid="viewport"
            style={{ 'scroll-snap-type': 'y mandatory' }}
          />
          <ScrollArea.Scrollbar keepMounted>
            <ScrollArea.Thumb data-testid="thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ))

      const viewport = screen.getByTestId('viewport')
      viewport.style.setProperty('scroll-snap-type', 'y mandatory')
      const thumb = screen.getByTestId('thumb')
      Object.defineProperties(thumb, {
        setPointerCapture: { configurable: true, value: () => {} },
        hasPointerCapture: { configurable: true, value: () => true },
        releasePointerCapture: { configurable: true, value: () => {} },
      })

      fireEvent.pointerDown(thumb, { button: 0, clientY: 0, pointerId: 1 })
      expect(viewport.style.getPropertyValue('scroll-snap-type')).toBe('none')

      fireEvent.pointerUp(thumb, { pointerId: 1 })
      expect(viewport.style.getPropertyValue('scroll-snap-type')).toBe(
        'y mandatory'
      )
    })

    it('restores viewport scroll snap on pointer cancel', () => {
      render(() => (
        <ScrollArea.Root>
          <ScrollArea.Viewport
            data-testid="viewport"
            style={{ 'scroll-snap-type': 'y mandatory' }}
          />
          <ScrollArea.Scrollbar keepMounted>
            <ScrollArea.Thumb data-testid="thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ))

      const viewport = screen.getByTestId('viewport')
      viewport.style.setProperty('scroll-snap-type', 'y mandatory')
      const thumb = screen.getByTestId('thumb')
      Object.defineProperties(thumb, {
        setPointerCapture: { configurable: true, value: () => {} },
        hasPointerCapture: { configurable: true, value: () => false },
      })

      fireEvent.pointerDown(thumb, { button: 0, clientY: 0, pointerId: 1 })
      expect(viewport.style.getPropertyValue('scroll-snap-type')).toBe('none')

      fireEvent.pointerCancel(thumb, { pointerId: 1 })
      expect(viewport.style.getPropertyValue('scroll-snap-type')).toBe(
        'y mandatory'
      )
    })

    it('ignores a second pointer while a drag is active', () => {
      render(() => (
        <ScrollArea.Root>
          <ScrollArea.Viewport
            data-testid="viewport"
            style={{ 'scroll-snap-type': 'y mandatory' }}
          />
          <ScrollArea.Scrollbar keepMounted>
            <ScrollArea.Thumb data-testid="thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ))

      const viewport = screen.getByTestId('viewport')
      viewport.style.setProperty('scroll-snap-type', 'y mandatory')
      const thumb = screen.getByTestId('thumb')
      Object.defineProperties(thumb, {
        setPointerCapture: { configurable: true, value: () => {} },
        hasPointerCapture: {
          configurable: true,
          value: (id: number) => id === 1,
        },
      })

      fireEvent.pointerDown(thumb, { button: 0, clientY: 0, pointerId: 1 })
      expect(viewport.style.getPropertyValue('scroll-snap-type')).toBe('none')

      // Second pointer while first still holds capture — ignored.
      fireEvent.pointerDown(thumb, { button: 0, clientY: 10, pointerId: 2 })
      expect(viewport.style.getPropertyValue('scroll-snap-type')).toBe('none')
    })

    it('lets a new pointer take over when capture was silently dropped', () => {
      render(() => (
        <ScrollArea.Root>
          <ScrollArea.Viewport
            data-testid="viewport"
            style={{ 'scroll-snap-type': 'y mandatory' }}
          />
          <ScrollArea.Scrollbar keepMounted>
            <ScrollArea.Thumb data-testid="thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ))

      const viewport = screen.getByTestId('viewport')
      viewport.style.setProperty('scroll-snap-type', 'y mandatory')
      const thumb = screen.getByTestId('thumb')
      Object.defineProperties(thumb, {
        setPointerCapture: { configurable: true, value: () => {} },
        hasPointerCapture: { configurable: true, value: () => false },
        releasePointerCapture: { configurable: true, value: () => {} },
      })

      fireEvent.pointerDown(thumb, { button: 0, clientY: 0, pointerId: 1 })
      expect(viewport.style.getPropertyValue('scroll-snap-type')).toBe('none')

      // Capture silently dropped — new pointer may take over.
      fireEvent.pointerDown(thumb, { button: 0, clientY: 10, pointerId: 2 })
      fireEvent.pointerUp(thumb, { pointerId: 2 })
      expect(viewport.style.getPropertyValue('scroll-snap-type')).toBe(
        'y mandatory'
      )
    })

    it.skip('ignores non-primary pointer presses', () => {
      render(() => (
        <ScrollArea.Root>
          <ScrollArea.Viewport
            data-testid="viewport"
            style={{ 'scroll-snap-type': 'y mandatory' }}
          />
          <ScrollArea.Scrollbar keepMounted>
            <ScrollArea.Thumb data-testid="thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ))

      const viewport = screen.getByTestId('viewport')
      screen.getByTestId('thumb').dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          button: 2,
          clientY: 0,
          pointerId: 1,
        })
      )

      expect(viewport.style.getPropertyValue('scroll-snap-type')).not.toBe(
        'none'
      )
    })
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
          <ScrollArea.Scrollbar orientation="vertical" keepMounted>
            <ScrollArea.Thumb data-testid="thumb-y" />
          </ScrollArea.Scrollbar>
          <ScrollArea.Scrollbar orientation="horizontal" keepMounted>
            <ScrollArea.Thumb data-testid="thumb-x" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ))

      const thumbY = screen.getByTestId('thumb-y')
      const thumbX = screen.getByTestId('thumb-x')
      const viewport = screen.getByTestId('viewport')

      fireEvent.pointerEnter(viewport)
      fireEvent.scroll(viewport, { target: { scrollTop: 1 } })

      expect(thumbY).toHaveAttribute('data-scrolling', '')
      expect(thumbX).not.toHaveAttribute('data-scrolling')

      await clock.tick(SCROLL_TIMEOUT)

      expect(thumbY).not.toHaveAttribute('data-scrolling')
    })
  })

  describe.skip('horizontal dragging (browser layout)', () => {
    it('updates LTR scroll position and pointer capture state', () => {})
  })
})
