import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Popover } from './index'

import type {
  PopoverRootActions,
  PopoverRootChangeEventDetails,
} from './root/PopoverRoot'
import type { JSX } from 'solid-js'

afterEach(() => {
  cleanup()
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
})
describe('Popover', () => {
  it('opens from the trigger and closes from Close', () => {
    render(() => <BasicPopover />)

    expect(screen.queryByTestId('popup')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.getByTestId('popup')).toBeVisible()
    expect(screen.getByRole('dialog')).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByTestId('popup')).toBeNull()
  })

  it('supports controlled open state', () => {
    const [open, openAssign] = createSignal(false)
    const onOpenChange = vi.fn(
      (next: boolean, _details: PopoverRootChangeEventDetails) => {
        openAssign(next)
      }
    )

    render(() => <BasicPopover open={open()} onOpenChange={onOpenChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0][0]).toBe(true)
    expect(onOpenChange.mock.calls[0][1].reason).toBe('trigger-press')
  })

  it('wires aria-labelledby / aria-describedby to Title and Description', () => {
    render(() => <BasicPopover defaultOpen />)

    const popup = screen.getByTestId('popup')
    const title = screen.getByText('Title')
    const description = screen.getByText('Description')

    expect(popup.getAttribute('aria-labelledby')).toBe(title.id)
    expect(popup.getAttribute('aria-describedby')).toBe(description.id)
  })

  it('closes on Escape', () => {
    const onOpenChange = vi.fn()
    render(() => <BasicPopover defaultOpen onOpenChange={onOpenChange} />)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('escape-key')
  })

  it('closes on outside press for non-modal popovers', () => {
    const onOpenChange = vi.fn()
    render(() => (
      <BasicPopover defaultOpen modal={false} onOpenChange={onOpenChange} />
    ))

    fireEvent.pointerDown(document.body, { button: 0 })
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('outside-press')
  })

  it('renders an internal backdrop when modal is true', () => {
    render(() => <BasicPopover defaultOpen modal />)
    expect(document.querySelector('[data-base-ui-inert]')).not.toBeNull()
  })

  it('does not render an internal backdrop when modal is false', () => {
    render(() => <BasicPopover defaultOpen modal={false} />)
    expect(document.querySelector('[data-base-ui-inert]')).toBeNull()
  })

  it('applies scroll lock when modal is true', () => {
    render(() => <BasicPopover defaultOpen modal />)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('does not apply scroll lock when modal is false', () => {
    render(() => <BasicPopover defaultOpen modal={false} />)
    expect(document.body.style.overflow).not.toBe('hidden')
  })

  it('does not apply scroll lock for trap-focus', () => {
    render(() => <BasicPopover defaultOpen modal="trap-focus" />)
    expect(document.body.style.overflow).not.toBe('hidden')
  })

  it('mounts into a portal host', () => {
    render(() => <BasicPopover defaultOpen />)
    const portal = document.querySelector('[data-base-ui-portal]')
    expect(portal).not.toBeNull()
    expect(portal?.contains(screen.getByTestId('popup'))).toBe(true)
  })

  it('honors onOpenChange cancel()', () => {
    const onOpenChange = vi.fn(
      (_next: boolean, details: PopoverRootChangeEventDetails) => {
        details.cancel()
      }
    )
    render(() => <BasicPopover onOpenChange={onOpenChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(onOpenChange).toHaveBeenCalled()
    expect(screen.queryByTestId('popup')).toBeNull()
  })

  it('supports actionsRef.close and actionsRef.unmount', async () => {
    const actions: PopoverRootActions = {
      unmount: () => {},
      close: () => {},
    }
    const onOpenChangeComplete = vi.fn()

    render(() => (
      <BasicPopover
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
    const actions: PopoverRootActions = {
      unmount: () => {},
      close: () => {},
    }
    const onOpenChange = vi.fn(
      (next: boolean, details: PopoverRootChangeEventDetails) => {
        if (!next) details.preventUnmountOnClose?.()
      }
    )

    render(() => (
      <BasicPopover
        defaultOpen
        actionsRef={actions}
        onOpenChange={onOpenChange}
      />
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.getByTestId('popup')).toBeInTheDocument()

    actions.unmount()
    await waitFor(() => {
      expect(screen.queryByTestId('popup')).toBeNull()
    })
  })

  it('nested Escape only closes the topmost popover', () => {
    const outerChange = vi.fn()
    const innerChange = vi.fn()

    render(() => (
      <Popover.Root defaultOpen onOpenChange={outerChange}>
        <Popover.Trigger>Outer</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup data-testid="outer">
              <Popover.Root defaultOpen onOpenChange={innerChange}>
                <Popover.Trigger>Inner</Popover.Trigger>
                <Popover.Portal>
                  <Popover.Positioner>
                    <Popover.Popup data-testid="inner">
                      <Popover.Close>Close inner</Popover.Close>
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              </Popover.Root>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    ))

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(innerChange).toHaveBeenCalled()
    expect(innerChange.mock.calls[0]?.[1]?.reason).toBe('escape-key')
    expect(outerChange).not.toHaveBeenCalled()
  })

  it('opens on hover after delay when openOnHover is set', async () => {
    const onOpenChange = vi.fn()

    render(() => (
      <Popover.Root onOpenChange={onOpenChange}>
        <Popover.Trigger openOnHover delay={20}>
          Hover
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup data-testid="popup">Content</Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    ))

    fireEvent.pointerEnter(screen.getByRole('button', { name: 'Hover' }), {
      pointerType: 'mouse',
    })
    expect(screen.queryByTestId('popup')).toBeNull()

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalled()
    })
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('trigger-hover')
  })

  it('toggles closed when the trigger is clicked again after click-open', () => {
    render(() => <BasicPopover />)

    const trigger = screen.getByRole('button', { name: 'Open' })
    fireEvent.click(trigger)
    expect(screen.getByTestId('popup')).toBeVisible()

    fireEvent.click(trigger)
    expect(screen.queryByTestId('popup')).toBeNull()
  })

  it('sticks open on impatient click after hover-open', async () => {
    vi.useFakeTimers()
    try {
      render(() => (
        <Popover.Root>
          <Popover.Trigger openOnHover delay={20}>
            Hover
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup data-testid="popup">Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ))

      const trigger = screen.getByRole('button', { name: 'Hover' })
      fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
      await vi.advanceTimersByTimeAsync(20)
      expect(screen.getByTestId('popup')).toBeVisible()

      // Within PATIENT_CLICK_THRESHOLD (500ms) — must stay open.
      fireEvent.click(trigger)
      expect(screen.getByTestId('popup')).toBeVisible()
    } finally {
      vi.useRealTimers()
    }
  })

  it('closes on patient click after hover-open', async () => {
    vi.useFakeTimers()
    try {
      render(() => (
        <Popover.Root>
          <Popover.Trigger openOnHover delay={20}>
            Hover
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup data-testid="popup">Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ))

      const trigger = screen.getByRole('button', { name: 'Hover' })
      fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
      await vi.advanceTimersByTimeAsync(20)
      expect(screen.getByTestId('popup')).toBeVisible()

      await vi.advanceTimersByTimeAsync(500)
      fireEvent.click(trigger)
      expect(screen.queryByTestId('popup')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('renders Viewport when mounted', () => {
    render(() => (
      <Popover.Root defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup>
              <Popover.Viewport data-testid="viewport">
                Content
              </Popover.Viewport>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    ))

    expect(screen.getByTestId('viewport')).toBeVisible()
  })

  it('renders Arrow inside Positioner', () => {
    render(() => (
      <Popover.Root defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup>
              <Popover.Arrow data-testid="arrow" />
              Content
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    ))

    expect(screen.getByTestId('arrow')).toBeInTheDocument()
  })

  it('exports createHandle stub', () => {
    const handle = Popover.createHandle()
    expect(handle).toBeInstanceOf(Popover.Handle)
    expect(() => handle.open()).not.toThrow()
    expect(() => handle.close()).not.toThrow()
  })

  it('sets aria-modal when modal is true', () => {
    render(() => <BasicPopover defaultOpen modal />)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })
})
function BasicPopover(props: {
  open?: boolean
  defaultOpen?: boolean
  modal?: boolean | 'trap-focus'
  onOpenChange?: (open: boolean, details: PopoverRootChangeEventDetails) => void
  onOpenChangeComplete?: (open: boolean) => void
  actionsRef?: PopoverRootActions
  children?: JSX.Element
}): JSX.Element {
  return (
    <Popover.Root
      open={props.open}
      defaultOpen={props.defaultOpen}
      modal={props.modal}
      onOpenChange={props.onOpenChange}
      onOpenChangeComplete={props.onOpenChangeComplete}
      actionsRef={props.actionsRef}
    >
      <Popover.Trigger>Open</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner>
          <Popover.Popup data-testid="popup">
            <Popover.Title>Title</Popover.Title>
            <Popover.Description>Description</Popover.Description>
            {props.children}
            <Popover.Close>Close</Popover.Close>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
