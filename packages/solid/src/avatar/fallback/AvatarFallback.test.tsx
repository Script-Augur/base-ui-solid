/**
 * Port of `@base-ui/react` Avatar fallback tests (v1.7.0).
 * Skips documented in `../UPSTREAM_TEST_PARITY.md`.
 *
 * Upstream mocks `useImageLoadingStatus`; we drive status via a controllable
 * Image mock instead so the real Solid probe stays under test.
 */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@solidjs/testing-library'
import { Show, createSignal } from 'solid-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Avatar } from '../index'

describe('<Avatar.Fallback />', () => {
  let restoreImage: () => void = () => {}

  afterEach(() => {
    restoreImage()
    cleanup()
    vi.useRealTimers()
  })

  it('should not render the children if the image loaded', async () => {
    restoreImage = mockImageWithStatus('loaded')

    render(() => (
      <Avatar.Root>
        <Avatar.Image src="avatar.png" />
        <Avatar.Fallback data-testid="fallback" />
      </Avatar.Root>
    ))

    await waitFor(() => {
      expect(screen.queryByTestId('fallback')).toBe(null)
    })
  })

  it('should render the fallback if the image fails to load', async () => {
    restoreImage = mockImageWithStatus('error')

    render(() => (
      <Avatar.Root>
        <Avatar.Image src="avatar.png" />
        <Avatar.Fallback>AC</Avatar.Fallback>
      </Avatar.Root>
    ))

    await waitFor(() => {
      expect(screen.queryByText('AC')).not.toBe(null)
    })
  })

  it('shows the fallback when a loaded image is unmounted', async () => {
    restoreImage = mockImageWithStatus('loaded')
    const [showImage, showImageAssign] = createSignal(true)

    render(() => (
      <div>
        <button type="button" onClick={() => showImageAssign(false)}>
          Hide image
        </button>
        <Avatar.Root>
          <Show when={showImage()}>
            <Avatar.Image data-testid="image" src="avatar.png" />
          </Show>
          <Avatar.Fallback data-testid="fallback">AC</Avatar.Fallback>
        </Avatar.Root>
      </div>
    ))

    await waitFor(() => {
      expect(screen.queryByTestId('fallback')).toBe(null)
    })
    expect(screen.getByTestId('image')).not.toBe(null)

    fireEvent.click(screen.getByText('Hide image'))

    await waitFor(() => {
      expect(screen.getByTestId('fallback')).not.toBe(null)
    })
    expect(screen.queryByTestId('image')).toBe(null)
  })

  describe('prop: delay', () => {
    let frames: Array<FrameRequestCallback>
    let now: number

    beforeEach(() => {
      frames = []
      now = 0
      vi.useFakeTimers({ toFake: ['performance', 'requestAnimationFrame'] })
      vi.spyOn(performance, 'now').mockImplementation(() => now)
      vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
        frames.push(cb)
        return frames.length
      })
      vi.stubGlobal('cancelAnimationFrame', (id: number) => {
        frames[id - 1] = () => undefined
      })
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    function advance(ms: number) {
      now += ms
      // Drain rAF queue; Timeout re-schedules until delay elapses.
      let guard = 0
      while (frames.length > 0 && guard < 50) {
        guard += 1
        const pending = frames.splice(0, frames.length)
        for (const frame of pending) {
          frame(now)
        }
      }
    }

    it('shows the fallback when the delay has elapsed', () => {
      restoreImage = mockImageWithStatus('error')

      render(() => (
        <Avatar.Root>
          <Avatar.Image src="avatar.png" />
          <Avatar.Fallback delay={100}>AC</Avatar.Fallback>
        </Avatar.Root>
      ))

      expect(screen.queryByText('AC')).toBe(null)

      advance(100)

      expect(screen.queryByText('AC')).not.toBe(null)
    })

    it('shows the fallback immediately when delay is 0', () => {
      restoreImage = mockImageWithStatus('error')

      render(() => (
        <Avatar.Root>
          <Avatar.Image src="avatar.png" />
          <Avatar.Fallback delay={0}>AC</Avatar.Fallback>
        </Avatar.Root>
      ))

      // No timers are advanced: `delay={0}` must render synchronously on mount.
      expect(screen.queryByText('AC')).not.toBe(null)
    })

    it('shows the fallback when delay changes to 0', () => {
      restoreImage = mockImageWithStatus('error')
      const [delay, delayAssign] = createSignal(100)

      render(() => (
        <Avatar.Root>
          <Avatar.Image src="avatar.png" />
          <Avatar.Fallback delay={delay()}>AC</Avatar.Fallback>
        </Avatar.Root>
      ))

      expect(screen.queryByText('AC')).toBe(null)

      delayAssign(0)

      expect(screen.queryByText('AC')).not.toBe(null)
    })

    it('keeps the fallback visible when delay changes from undefined to a number', () => {
      restoreImage = mockImageWithStatus('error')
      const [delay, delayAssign] = createSignal<number | undefined>(undefined)

      render(() => (
        <Avatar.Root>
          <Avatar.Image src="avatar.png" />
          <Avatar.Fallback delay={delay()}>AC</Avatar.Fallback>
        </Avatar.Root>
      ))

      expect(screen.queryByText('AC')).not.toBe(null)

      delayAssign(100)

      expect(screen.queryByText('AC')).not.toBe(null)
    })

    it('keeps the fallback visible across a number -> undefined -> number delay change', () => {
      restoreImage = mockImageWithStatus('error')
      const [delay, delayAssign] = createSignal<number | undefined>(100)

      render(() => (
        <Avatar.Root>
          <Avatar.Image src="avatar.png" />
          <Avatar.Fallback delay={delay()}>AC</Avatar.Fallback>
        </Avatar.Root>
      ))

      // Fallback is hidden until the delay elapses.
      expect(screen.queryByText('AC')).toBe(null)

      // Removing the delay before it elapses shows the fallback immediately.
      delayAssign(undefined)
      expect(screen.queryByText('AC')).not.toBe(null)

      // Restoring the delay must not re-hide the already-visible fallback.
      delayAssign(100)
      expect(screen.queryByText('AC')).not.toBe(null)
    })
  })

  it('keeps fallback mounted and image unmounted while the image is loading', async () => {
    restoreImage = mockImageWithStatus('loading')
    const [showImage, showImageAssign] = createSignal(false)

    render(() => (
      <div>
        <button type="button" onClick={() => showImageAssign(true)}>
          Show image
        </button>
        <Avatar.Root>
          <Avatar.Image
            data-testid="image"
            src={showImage() ? 'avatar.png' : undefined}
          />
          <Avatar.Fallback data-testid="fallback">AC</Avatar.Fallback>
        </Avatar.Root>
      </div>
    ))

    expect(screen.queryByTestId('image')).toBe(null)
    expect(screen.getByTestId('fallback')).not.toBe(null)

    fireEvent.click(screen.getByText('Show image'))

    await waitFor(() => {
      expect(screen.queryByTestId('image')).toBe(null)
      expect(screen.getByTestId('fallback')).not.toBe(null)
    })
  })
})
function mockImageWithStatus(status: 'loaded' | 'error' | 'loading') {
  const OriginalImage = window.Image

  window.Image = function MockImage() {
    const obj: MockImage = {
      complete: status !== 'loading',
      naturalWidth: status === 'loaded' ? 100 : 0,
      onload: null,
      onerror: null,
      src: '',
      srcset: '',
    }

    Object.defineProperty(obj, 'src', {
      get() {
        return ''
      },
      set() {
        if (status === 'loaded') {
          obj.complete = true
          obj.naturalWidth = 100
        } else if (status === 'error') {
          obj.complete = true
          obj.naturalWidth = 0
        } else {
          obj.complete = false
          obj.naturalWidth = 0
        }
      },
    })

    return obj
  } as unknown as typeof window.Image

  return () => {
    window.Image = OriginalImage
  }
}
type MockImage = {
  complete: boolean
  naturalWidth: number
  onload: (() => void) | null
  onerror: (() => void) | null
  src: string
  srcset: string
}
