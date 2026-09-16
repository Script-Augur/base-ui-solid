import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Dialog } from './index'

import type { DialogRootChangeEventDetails } from './root/DialogRoot'

afterEach(() => {
  cleanup()
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
})
describe('Dialog', () => {
  it('opens from the trigger and closes from Close', () => {
    render(() => <BasicDialog />)

    expect(screen.queryByTestId('popup')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.getByTestId('popup')).toBeVisible()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByTestId('popup')).toBeNull()
  })

  it('supports controlled open state', () => {
    const [open, openAssign] = createSignal(false)
    const onOpenChange = vi.fn(
      (next: boolean, _details: DialogRootChangeEventDetails) => {
        openAssign(next)
      }
    )

    render(() => <BasicDialog open={open()} onOpenChange={onOpenChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(onOpenChange).toHaveBeenCalled()
    const firstCall = onOpenChange.mock.calls[0]
    expect(firstCall?.[0]).toBe(true)
    expect(firstCall?.[1]?.reason).toBe('trigger-press')
  })

  it('wires aria-labelledby / aria-describedby to Title and Description', () => {
    render(() => <BasicDialog defaultOpen />)

    const popup = screen.getByTestId('popup')
    const title = screen.getByText('Title')
    const description = screen.getByText('Description')

    expect(popup.getAttribute('aria-labelledby')).toBe(title.id)
    expect(popup.getAttribute('aria-describedby')).toBe(description.id)
  })

  it('closes on Escape', () => {
    const onOpenChange = vi.fn()
    render(() => <BasicDialog defaultOpen onOpenChange={onOpenChange} />)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('escape-key')
  })

  it('closes on backdrop pointerdown for modal dialogs', () => {
    const onOpenChange = vi.fn()
    render(() => <BasicDialog defaultOpen onOpenChange={onOpenChange} />)

    fireEvent.pointerDown(screen.getByTestId('backdrop'), { button: 0 })
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('outside-press')
  })

  it('does not close on outside press when disablePointerDismissal is true', () => {
    const onOpenChange = vi.fn()
    render(() => (
      <BasicDialog
        defaultOpen
        disablePointerDismissal
        onOpenChange={onOpenChange}
      />
    ))

    fireEvent.pointerDown(screen.getByTestId('backdrop'), { button: 0 })
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(screen.getByTestId('popup')).toBeVisible()
  })

  it('locks body scroll while a modal dialog is open', () => {
    render(() => <BasicDialog defaultOpen modal />)
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(document.body.style.overflow).not.toBe('hidden')
  })

  it('does not lock scroll when modal is false', () => {
    render(() => <BasicDialog defaultOpen modal={false} />)
    expect(document.body.style.overflow).not.toBe('hidden')
  })

  it('renders into a portal host on document.body', () => {
    render(() => <BasicDialog defaultOpen />)
    const popup = screen.getByTestId('popup')
    expect(popup.closest('[data-base-ui-portal]')).not.toBeNull()
    expect(document.body.contains(popup)).toBe(true)
  })

  it('respects onOpenChange cancel()', () => {
    render(() => (
      <BasicDialog
        onOpenChange={(_open, details) => {
          details.cancel()
        }}
      />
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.queryByTestId('popup')).toBeNull()
  })

  it('nests dialogs and only the topmost closes on Escape', () => {
    render(() => (
      <Dialog.Root defaultOpen>
        <Dialog.Portal>
          <Dialog.Popup data-testid="parent-popup">
            <Dialog.Title>Parent</Dialog.Title>
            <Dialog.Root defaultOpen>
              <Dialog.Portal>
                <Dialog.Popup data-testid="child-popup">
                  <Dialog.Title>Child</Dialog.Title>
                  <Dialog.Close>Close child</Dialog.Close>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    ))

    expect(screen.getByTestId('parent-popup')).toBeVisible()
    expect(screen.getByTestId('child-popup')).toBeVisible()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('child-popup')).toBeNull()
    expect(screen.getByTestId('parent-popup')).toBeVisible()
  })

  it('sets data-nested on nested popups', () => {
    render(() => (
      <Dialog.Root defaultOpen>
        <Dialog.Portal>
          <Dialog.Popup data-testid="parent-popup">
            <Dialog.Root defaultOpen>
              <Dialog.Portal>
                <Dialog.Popup data-testid="child-popup">Child</Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    ))

    expect(screen.getByTestId('child-popup')).toHaveAttribute('data-nested')
  })

  it('renders an internal backdrop for modal dialogs', () => {
    render(() => <BasicDialog defaultOpen modal />)
    expect(document.querySelector('[data-base-ui-inert]')).not.toBeNull()
  })

  it('does not render an internal backdrop when modal is false', () => {
    render(() => <BasicDialog defaultOpen modal={false} />)
    expect(document.querySelector('[data-base-ui-inert]')).toBeNull()
  })

  it('renders non-modal focus guards and aria-owns', () => {
    render(() => <BasicDialog defaultOpen modal={false} />)

    expect(
      document.querySelectorAll('[data-base-ui-focus-guard]').length
    ).toBeGreaterThanOrEqual(2)
    expect(document.querySelector('[aria-owns]')).not.toBeNull()
  })
})
function BasicDialog(props: {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean, details: DialogRootChangeEventDetails) => void
  modal?: boolean | 'trap-focus'
  disablePointerDismissal?: boolean
}) {
  return (
    <Dialog.Root
      defaultOpen={props.defaultOpen}
      open={props.open}
      onOpenChange={props.onOpenChange}
      modal={props.modal}
      disablePointerDismissal={props.disablePointerDismissal}
    >
      <Dialog.Trigger>Open</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop data-testid="backdrop" />
        <Dialog.Popup data-testid="popup">
          <Dialog.Title>Title</Dialog.Title>
          <Dialog.Description>Description</Dialog.Description>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
