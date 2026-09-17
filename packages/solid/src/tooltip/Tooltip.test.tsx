import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Tooltip } from './index'

import type {
  TooltipRootActions,
  TooltipRootChangeEventDetails,
} from './root/TooltipRoot'
import type { JSX } from 'solid-js'

afterEach(() => {
  cleanup()
})

describe('Tooltip', () => {
  it('does not open on click alone (without hover/focus)', () => {
    render(() => <BasicTooltip />)

    fireEvent.click(screen.getByRole('button', { name: 'Hover' }))
    expect(screen.queryByTestId('popup')).toBeNull()
  })

  it('opens on hover after the default delay', async () => {
    vi.useFakeTimers()
    try {
      render(() => <BasicTooltip />)

      const trigger = screen.getByRole('button', { name: 'Hover' })
      fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
      expect(screen.queryByTestId('popup')).toBeNull()

      await vi.advanceTimersByTimeAsync(600)
      expect(screen.getByTestId('popup')).toBeVisible()
    } finally {
      vi.useRealTimers()
    }
  })

  it('opens on focus without waiting for a delay', () => {
    const onOpenChange = vi.fn()
    render(() => <BasicTooltip onOpenChange={onOpenChange} />)

    const trigger = screen.getByRole('button', { name: 'Hover' })
    fireEvent.focus(trigger)

    expect(screen.getByTestId('popup')).toBeVisible()
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(true)
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('trigger-focus')
  })

  it('closes on blur when opened by focus', () => {
    render(() => <BasicTooltip />)

    const trigger = screen.getByRole('button', { name: 'Hover' })
    fireEvent.focus(trigger)
    expect(screen.getByTestId('popup')).toBeVisible()

    fireEvent.blur(trigger)
    expect(screen.queryByTestId('popup')).toBeNull()
  })

  it('supports controlled open + reports trigger-hover reason', async () => {
    vi.useFakeTimers()
    try {
      const [open, openAssign] = createSignal(false)
      const onOpenChange = vi.fn(
        (next: boolean, _details: TooltipRootChangeEventDetails) => {
          openAssign(next)
        }
      )

      render(() => (
        <BasicTooltip open={open()} onOpenChange={onOpenChange} delay={10} />
      ))

      fireEvent.pointerEnter(screen.getByRole('button', { name: 'Hover' }), {
        pointerType: 'mouse',
      })
      await vi.advanceTimersByTimeAsync(10)

      expect(onOpenChange).toHaveBeenCalled()
      expect(onOpenChange.mock.calls[0]?.[0]).toBe(true)
      expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('trigger-hover')
    } finally {
      vi.useRealTimers()
    }
  })

  it('honors onOpenChange cancel()', async () => {
    vi.useFakeTimers()
    try {
      const onOpenChange = vi.fn(
        (_next: boolean, details: TooltipRootChangeEventDetails) => {
          details.cancel()
        }
      )
      render(() => <BasicTooltip onOpenChange={onOpenChange} delay={10} />)

      fireEvent.pointerEnter(screen.getByRole('button', { name: 'Hover' }), {
        pointerType: 'mouse',
      })
      await vi.advanceTimersByTimeAsync(10)

      expect(onOpenChange).toHaveBeenCalled()
      expect(screen.queryByTestId('popup')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('closes on Escape', () => {
    const onOpenChange = vi.fn()
    render(() => <BasicTooltip defaultOpen onOpenChange={onOpenChange} />)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('escape-key')
  })

  it('closes on outside press', () => {
    const onOpenChange = vi.fn()
    render(() => <BasicTooltip defaultOpen onOpenChange={onOpenChange} />)

    fireEvent.pointerDown(document.body, { button: 0 })
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('outside-press')
  })

  it('closes when disabled becomes true while open', () => {
    const onOpenChange = vi.fn()
    const [disabled, disabledAssign] = createSignal(false)

    render(() => (
      <BasicTooltip
        defaultOpen
        disabled={disabled()}
        onOpenChange={onOpenChange}
      />
    ))
    expect(screen.getByTestId('popup')).toBeVisible()

    disabledAssign(true)
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('disabled')
    expect(screen.queryByTestId('popup')).toBeNull()
  })

  it('mounts into a portal host', () => {
    render(() => <BasicTooltip defaultOpen />)
    const portal = document.querySelector('[data-base-ui-portal]')
    expect(portal).not.toBeNull()
    expect(portal?.contains(screen.getByTestId('popup'))).toBe(true)
  })

  it('mounts the Positioner and registers the Arrow', () => {
    render(() => (
      <Tooltip.Root defaultOpen>
        <Tooltip.Trigger>Hover</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner data-testid="positioner">
            <Tooltip.Popup data-testid="popup">
              <Tooltip.Arrow data-testid="arrow" />
              Content
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ))

    expect(screen.getByTestId('positioner')).toBeInTheDocument()
    expect(screen.getByTestId('arrow')).toBeInTheDocument()
  })

  it('renders Viewport when mounted', () => {
    render(() => (
      <Tooltip.Root defaultOpen>
        <Tooltip.Trigger>Hover</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup>
              <Tooltip.Viewport data-testid="viewport">
                Content
              </Tooltip.Viewport>
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ))

    expect(screen.getByTestId('viewport')).toBeVisible()
  })

  it('cancels a pending open when closeOnClick fires before the delay elapses', async () => {
    vi.useFakeTimers()
    try {
      const onOpenChange = vi.fn()
      render(() => <BasicTooltip onOpenChange={onOpenChange} delay={50} />)

      const trigger = screen.getByRole('button', { name: 'Hover' })
      fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
      fireEvent.pointerDown(trigger)

      await vi.advanceTimersByTimeAsync(50)
      expect(onOpenChange).not.toHaveBeenCalled()
      expect(screen.queryByTestId('popup')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('closes on pointerdown when open (closeOnClick default true)', () => {
    const onOpenChange = vi.fn()
    render(() => <BasicTooltip defaultOpen onOpenChange={onOpenChange} />)

    const trigger = screen.getByRole('button', { name: 'Hover' })
    fireEvent.pointerDown(trigger)

    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('trigger-press')
    expect(screen.queryByTestId('popup')).toBeNull()
  })

  it('does not cancel or close when closeOnClick is false', async () => {
    vi.useFakeTimers()
    try {
      render(() => (
        <Tooltip.Root>
          <Tooltip.Trigger delay={20} closeOnClick={false}>
            Hover
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup data-testid="popup">Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      ))

      const trigger = screen.getByRole('button', { name: 'Hover' })
      fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
      fireEvent.pointerDown(trigger)
      await vi.advanceTimersByTimeAsync(20)

      expect(screen.getByTestId('popup')).toBeVisible()
    } finally {
      vi.useRealTimers()
    }
  })

  it('supports actionsRef.close and actionsRef.unmount', async () => {
    const actions: TooltipRootActions = {
      unmount: () => {},
      close: () => {},
    }
    const onOpenChangeComplete = vi.fn()

    render(() => (
      <BasicTooltip
        defaultOpen
        actionsRef={actions}
        onOpenChangeComplete={onOpenChangeComplete}
      />
    ))

    expect(screen.getByTestId('popup')).toBeVisible()

    actions.close()
    await waitFor(() => {
      expect(screen.queryByTestId('popup')).toBeNull()
    })
  })

  it('preventUnmountOnClose keeps the popup mounted until unmount()', async () => {
    const actions: TooltipRootActions = {
      unmount: () => {},
      close: () => {},
    }
    const onOpenChange = vi.fn(
      (next: boolean, details: TooltipRootChangeEventDetails) => {
        if (!next) details.preventUnmountOnClose?.()
      }
    )

    render(() => (
      <BasicTooltip
        defaultOpen
        actionsRef={actions}
        onOpenChange={onOpenChange}
      />
    ))

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByTestId('popup')).toBeInTheDocument()

    actions.unmount()
    await waitFor(() => {
      expect(screen.queryByTestId('popup')).toBeNull()
    })
  })

  it('supports defaultOpen', () => {
    render(() => <BasicTooltip defaultOpen />)
    expect(screen.getByTestId('popup')).toBeVisible()
  })

  it('exports createHandle stub', () => {
    const handle = Tooltip.createHandle()
    expect(handle).toBeInstanceOf(Tooltip.Handle)
    expect(() => handle.open()).not.toThrow()
    expect(() => handle.close()).not.toThrow()
  })

  it('keeps the popup open when hovering from the trigger into the popup', () => {
    render(() => (
      <Tooltip.Root defaultOpen>
        <Tooltip.Trigger>Hover</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup data-testid="popup">Content</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ))

    const trigger = screen.getByRole('button', { name: 'Hover' })
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' })
    fireEvent.pointerEnter(screen.getByTestId('popup'), { pointerType: 'mouse' })

    expect(screen.getByTestId('popup')).toBeVisible()
  })

  it('provider: opens an adjacent tooltip instantly while the group is active', async () => {
    vi.useFakeTimers()
    try {
      render(() => (
        <Tooltip.Provider timeout={400}>
          <Tooltip.Root>
            <Tooltip.Trigger delay={600}>First</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="first-popup">First</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
          <Tooltip.Root>
            <Tooltip.Trigger delay={600}>Second</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="second-popup">
                  Second
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      ))

      const first = screen.getByRole('button', { name: 'First' })
      const second = screen.getByRole('button', { name: 'Second' })

      fireEvent.pointerEnter(first, { pointerType: 'mouse' })
      await vi.advanceTimersByTimeAsync(600)
      expect(screen.getByTestId('first-popup')).toBeVisible()

      fireEvent.pointerLeave(first, { pointerType: 'mouse' })
      fireEvent.pointerEnter(second, { pointerType: 'mouse' })
      // Instant phase: no 600ms open delay required.
      await vi.advanceTimersByTimeAsync(0)

      expect(screen.getByTestId('second-popup')).toBeVisible()
    } finally {
      vi.useRealTimers()
    }
  })

  it('provider: requires the full delay again once the timeout elapses', async () => {
    vi.useFakeTimers()
    try {
      render(() => (
        <Tooltip.Provider timeout={100}>
          <Tooltip.Root>
            <Tooltip.Trigger delay={600}>First</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="first-popup">First</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
          <Tooltip.Root>
            <Tooltip.Trigger delay={600}>Second</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="second-popup">
                  Second
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      ))

      const first = screen.getByRole('button', { name: 'First' })
      const second = screen.getByRole('button', { name: 'Second' })

      fireEvent.pointerEnter(first, { pointerType: 'mouse' })
      await vi.advanceTimersByTimeAsync(600)
      expect(screen.getByTestId('first-popup')).toBeVisible()

      fireEvent.pointerLeave(first, { pointerType: 'mouse' })
      await vi.advanceTimersByTimeAsync(200)

      fireEvent.pointerEnter(second, { pointerType: 'mouse' })
      await vi.advanceTimersByTimeAsync(100)
      expect(screen.queryByTestId('second-popup')).toBeNull()

      await vi.advanceTimersByTimeAsync(500)
      expect(screen.getByTestId('second-popup')).toBeVisible()
    } finally {
      vi.useRealTimers()
    }
  })
})

function BasicTooltip(props: {
  open?: boolean
  defaultOpen?: boolean
  delay?: number
  disabled?: boolean
  onOpenChange?: (open: boolean, details: TooltipRootChangeEventDetails) => void
  onOpenChangeComplete?: (open: boolean) => void
  actionsRef?: TooltipRootActions
  children?: JSX.Element
}): JSX.Element {
  return (
    <Tooltip.Root
      open={props.open}
      defaultOpen={props.defaultOpen}
      disabled={props.disabled}
      onOpenChange={props.onOpenChange}
      onOpenChangeComplete={props.onOpenChangeComplete}
      actionsRef={props.actionsRef}
    >
      <Tooltip.Trigger delay={props.delay}>Hover</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner>
          <Tooltip.Popup data-testid="popup">
            {props.children}
            Content
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
