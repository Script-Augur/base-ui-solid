/**
 * Port of `@base-ui/react` Avatar image tests (v1.7.0).
 * Skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, render, screen, waitFor } from '@solidjs/testing-library'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Avatar } from '../index'

describe('<Avatar.Image />', () => {
  let restoreImage: () => void

  function installImageMock(options?: Parameters<typeof mockImageLoading>[0]) {
    restoreImage()
    const imageMock = mockImageLoading(options)
    restoreImage = imageMock.restore
    return imageMock
  }

  beforeEach(() => {
    restoreImage = mockImageLoading({ completeOnSet: true }).restore
  })

  afterEach(() => {
    restoreImage()
    cleanup()
  })

  it('passes native image props to the rendered image', () => {
    render(() => (
      <Avatar.Root>
        <Avatar.Image
          crossOrigin="anonymous"
          data-testid="image"
          referrerPolicy="no-referrer"
          sizes="48px"
          src="avatar.png"
          srcSet="avatar.png 1x, avatar@2x.png 2x"
        />
      </Avatar.Root>
    ))

    const image = screen.getByTestId('image')
    expect(image).toHaveAttribute('crossorigin', 'anonymous')
    expect(image).toHaveAttribute('referrerpolicy', 'no-referrer')
    expect(image).toHaveAttribute('sizes', '48px')
    expect(image).toHaveAttribute('srcset', 'avatar.png 1x, avatar@2x.png 2x')
  })

  it('shows the image when only srcSet is provided', () => {
    render(() => (
      <Avatar.Root>
        <Avatar.Image data-testid="image" sizes="48px" srcSet="avatar.png 1x" />
        <Avatar.Fallback>JD</Avatar.Fallback>
      </Avatar.Root>
    ))

    expect(screen.getByTestId('image')).toHaveAttribute(
      'srcset',
      'avatar.png 1x'
    )
    expect(screen.queryByText('JD')).toBe(null)
  })

  it('passes responsive image props to the loading probe', () => {
    const imageMock = installImageMock()

    render(() => (
      <Avatar.Root>
        <Avatar.Image
          sizes="48px"
          src="fallback.png"
          srcSet="avatar.png 1x, avatar@2x.png 2x"
        />
      </Avatar.Root>
    ))

    expect(imageMock.images[0]?.sizes).toBe('48px')
    expect(imageMock.images[0]?.srcset).toBe('avatar.png 1x, avatar@2x.png 2x')
    expect(imageMock.images[0]?.src).toBe('fallback.png')
  })

  describe('prop: onLoadingStatusChange', () => {
    it('fires when the image loads', async () => {
      const imageMock = installImageMock()
      const onLoadingStatusChange = vi.fn()

      render(() => (
        <Avatar.Root>
          <Avatar.Image
            src="avatar.png"
            onLoadingStatusChange={onLoadingStatusChange}
          />
        </Avatar.Root>
      ))

      await waitFor(() => {
        expect(onLoadingStatusChange).toHaveBeenCalledWith('loading')
      })

      imageMock.images.at(-1)?.onload?.()

      await waitFor(() => {
        expect(
          onLoadingStatusChange.mock.calls.map(([status]) => status)
        ).toEqual(['loading', 'loaded'])
      })
    })

    it('fires when the image errors', async () => {
      const imageMock = installImageMock()
      const onLoadingStatusChange = vi.fn()

      render(() => (
        <Avatar.Root>
          <Avatar.Image
            src="avatar.png"
            onLoadingStatusChange={onLoadingStatusChange}
          />
        </Avatar.Root>
      ))

      await waitFor(() => {
        expect(onLoadingStatusChange).toHaveBeenCalledWith('loading')
      })

      imageMock.images.at(-1)?.onerror?.()

      await waitFor(() => {
        expect(
          onLoadingStatusChange.mock.calls.map(([status]) => status)
        ).toEqual(['loading', 'error'])
      })
    })

    it('fires for cached image errors without emitting idle', async () => {
      installImageMock({ completeOnSet: true, naturalWidth: 0 })
      const onLoadingStatusChange = vi.fn()

      render(() => (
        <Avatar.Root>
          <Avatar.Image
            src="avatar.png"
            onLoadingStatusChange={onLoadingStatusChange}
          />
        </Avatar.Root>
      ))

      await waitFor(() => {
        expect(onLoadingStatusChange).toHaveBeenCalledWith('error')
      })

      expect(onLoadingStatusChange).not.toHaveBeenCalledWith('idle')
    })
  })

  it('shows the image immediately for a cached src', () => {
    render(() => (
      <Avatar.Root>
        <Avatar.Image
          src="https://example.com/cached-avatar.png"
          alt="Jane Doe"
        />
        <Avatar.Fallback>JD</Avatar.Fallback>
      </Avatar.Root>
    ))

    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://example.com/cached-avatar.png'
    )
    expect(screen.queryByText('JD')).toBe(null)
  })
})
/**
 * When `completeOnSet` is true, simulates cached-image behavior: setting a
 * source immediately marks the image as complete before an async load event.
 */
function mockImageLoading({ completeOnSet = false, naturalWidth = 100 } = {}) {
  const OriginalImage = window.Image
  const images: Array<MockImage> = []

  window.Image = function MockImage() {
    let srcValue = ''
    let srcSetValue = ''
    const obj: MockImage = {
      complete: false,
      naturalWidth: 0,
      onload: null,
      onerror: null,
      referrerPolicy: '',
      crossOrigin: null,
      sizes: '',
      get src() {
        return srcValue
      },
      set src(value: string) {
        srcValue = value
        if (completeOnSet) {
          obj.complete = true
          obj.naturalWidth = naturalWidth
        }
      },
      get srcset() {
        return srcSetValue
      },
      set srcset(value: string) {
        srcSetValue = value
        if (completeOnSet) {
          obj.complete = true
          obj.naturalWidth = naturalWidth
        }
      },
    }
    images.push(obj)
    return obj
  } as unknown as typeof window.Image

  return {
    images,
    restore() {
      window.Image = OriginalImage
    },
  }
}
type MockImage = {
  complete: boolean
  naturalWidth: number
  onload: (() => void) | null
  onerror: (() => void) | null
  referrerPolicy: string
  crossOrigin: string | null
  sizes: string
  src: string
  srcset: string
}
