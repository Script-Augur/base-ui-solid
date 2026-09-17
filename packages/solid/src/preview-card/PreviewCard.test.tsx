import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PreviewCard } from './index'

import type {
  PreviewCardRootActions,
  PreviewCardRootChangeEventDetails,
} from './root/PreviewCardRoot'
import type { JSX } from 'solid-js'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('PreviewCard', () => {
  it('opens on hover after delay and closes after closeDelay', async () => {
    vi.useFakeTimers()
    render(() => <BasicPreviewCard delay={100} closeDelay={50} />)

    expect(screen.queryByTestId('popup')).toBeNull()

    fireEvent.pointerEnter(screen.getByRole('link', { name: 'typography' }), {
      pointerType: 'mouse',
    })
    expect(screen.queryByTestId('popup')).toBeNull()

    await vi.advanceTimersByTimeAsync(100)
    expect(screen.getByTestId('popup')).toBeVisible()

    fireEvent.pointerLeave(screen.getByRole('link', { name: 'typography' }), {
      pointerType: 'mouse',
    })
    await vi.advanceTimersByTimeAsync(50)
    expect(screen.queryByTestId('popup')).toBeNull()
  })

  it('opens on focus after delay with trigger-focus reason', async () => {
    vi.useFakeTimers()
    const onOpenChange = vi.fn()
    render(() => <BasicPreviewCard delay={80} onOpenChange={onOpenChange} />)

    fireEvent.focus(screen.getByRole('link', { name: 'typography' }))
    await vi.advanceTimersByTimeAsync(80)

    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(true)
    expect(onOpenChange.mock.calls[0]?.[1].reason).toBe('trigger-focus')
    expect(screen.getByTestId('popup')).toBeVisible()
  })

  it('supports controlled open state', async () => {
    vi.useFakeTimers()
    const [open, openAssign] = createSignal(false)
    const onOpenChange = vi.fn(
      (next: boolean, _details: PreviewCardRootChangeEventDetails) => {
        openAssign(next)
      }
    )

    render(() => (
      <BasicPreviewCard open={open()} delay={10} onOpenChange={onOpenChange} />
    ))

    expect(screen.queryByTestId('popup')).toBeNull()

    fireEvent.pointerEnter(screen.getByRole('link', { name: 'typography' }), {
      pointerType: 'mouse',
    })
    await vi.advanceTimersByTimeAsync(10)
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(true)
    expect(onOpenChange.mock.calls[0]?.[1].reason).toBe('trigger-hover')
  })

  it('renders when defaultOpen', () => {
    render(() => <BasicPreviewCard defaultOpen />)
    expect(screen.getByTestId('popup')).toBeVisible()
    expect(screen.getByTestId('popup').getAttribute('tabindex')).toBe('-1')
    expect(
      screen.getByTestId('popup').hasAttribute('data-base-ui-focusable')
    ).toBe(true)
  })

  it('closes on Escape', () => {
    const onOpenChange = vi.fn()
    render(() => <BasicPreviewCard defaultOpen onOpenChange={onOpenChange} />)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('escape-key')
  })

  it('closes on outside press', () => {
    const onOpenChange = vi.fn()
    render(() => <BasicPreviewCard defaultOpen onOpenChange={onOpenChange} />)

    fireEvent.pointerDown(document.body, { button: 0 })
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('outside-press')
  })

  it('mounts into a portal host', () => {
    render(() => <BasicPreviewCard defaultOpen />)
    const portal = document.querySelector('[data-base-ui-portal]')
    expect(portal).not.toBeNull()
    expect(portal?.contains(screen.getByTestId('popup'))).toBe(true)
  })

  it('honors onOpenChange cancel()', async () => {
    vi.useFakeTimers()
    const onOpenChange = vi.fn(
      (_next: boolean, details: PreviewCardRootChangeEventDetails) => {
        details.cancel()
      }
    )
    render(() => <BasicPreviewCard delay={10} onOpenChange={onOpenChange} />)

    fireEvent.pointerEnter(screen.getByRole('link', { name: 'typography' }), {
      pointerType: 'mouse',
    })
    await vi.advanceTimersByTimeAsync(10)
    expect(screen.queryByTestId('popup')).toBeNull()
  })

  it('supports actionsRef.close and unmount', async () => {
    const actions: PreviewCardRootActions = {
      unmount: () => {},
      close: () => {},
    }
    const onOpenChange = vi.fn()
    render(() => (
      <BasicPreviewCard
        defaultOpen
        actionsRef={actions}
        onOpenChange={onOpenChange}
      />
    ))

    expect(screen.getByTestId('popup')).toBeVisible()
    actions.close()
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('imperative-action')

    actions.unmount()
    await waitFor(() => {
      expect(screen.queryByTestId('popup')).toBeNull()
    })
  })

  it('keeps open when pointer moves to popup before closeDelay', async () => {
    vi.useFakeTimers()
    render(() => <BasicPreviewCard delay={50} closeDelay={100} />)

    fireEvent.pointerEnter(screen.getByRole('link', { name: 'typography' }), {
      pointerType: 'mouse',
    })
    await vi.advanceTimersByTimeAsync(50)
    expect(screen.getByTestId('popup')).toBeVisible()

    fireEvent.pointerLeave(screen.getByRole('link', { name: 'typography' }), {
      pointerType: 'mouse',
    })
    fireEvent.pointerEnter(screen.getByTestId('popup'), {
      pointerType: 'mouse',
    })
    await vi.advanceTimersByTimeAsync(100)
    expect(screen.getByTestId('popup')).toBeVisible()
  })

  it('renders Arrow and Viewport when open', () => {
    render(() => <BasicPreviewCard defaultOpen />)
    expect(screen.getByTestId('arrow')).toBeVisible()
    expect(screen.getByTestId('viewport')).toBeVisible()
  })

  it('exports createHandle stub', () => {
    const handle = PreviewCard.createHandle()
    expect(handle).toBeInstanceOf(PreviewCard.Handle)
    expect(() => handle.open()).not.toThrow()
    expect(() => handle.close()).not.toThrow()
  })

  it('reports trigger-hover reason on hover open', async () => {
    vi.useFakeTimers()
    const onOpenChange = vi.fn()
    render(() => <BasicPreviewCard delay={20} onOpenChange={onOpenChange} />)

    fireEvent.pointerEnter(screen.getByRole('link', { name: 'typography' }), {
      pointerType: 'mouse',
    })
    await vi.advanceTimersByTimeAsync(20)
    expect(onOpenChange.mock.calls.at(-1)?.[1].reason).toBe('trigger-hover')
  })
})

function BasicPreviewCard(props: {
  open?: boolean
  defaultOpen?: boolean
  delay?: number
  closeDelay?: number
  onOpenChange?: (
    open: boolean,
    eventDetails: PreviewCardRootChangeEventDetails
  ) => void
  actionsRef?: PreviewCardRootActions
}): JSX.Element {
  return (
    <PreviewCard.Root
      open={props.open}
      defaultOpen={props.defaultOpen}
      onOpenChange={props.onOpenChange}
      actionsRef={props.actionsRef}
    >
      <p>
        The principles of good{' '}
        <PreviewCard.Trigger
          href="https://en.wikipedia.org/wiki/Typography"
          delay={props.delay}
          closeDelay={props.closeDelay}
        >
          typography
        </PreviewCard.Trigger>{' '}
        remain.
      </p>
      <PreviewCard.Portal>
        <PreviewCard.Backdrop data-testid="backdrop" />
        <PreviewCard.Positioner sideOffset={8}>
          <PreviewCard.Popup data-testid="popup">
            <PreviewCard.Arrow data-testid="arrow" />
            <PreviewCard.Viewport data-testid="viewport">
              Preview content
            </PreviewCard.Viewport>
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  )
}
