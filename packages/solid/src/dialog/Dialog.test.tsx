import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Dialog } from './index'

import type {
  DialogRootActions,
  DialogRootChangeEventDetails,
} from './root/DialogRoot'
import type { JSX } from 'solid-js'

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

  it('closes on outside press when no Dialog.Backdrop is rendered', () => {
    const onOpenChange = vi.fn()
    render(() => (
      <Dialog.Root defaultOpen modal="trap-focus" onOpenChange={onOpenChange}>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Popup data-testid="popup">
            <Dialog.Close>Close</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    ))

    // trap-focus has no InternalBackdrop; any outside press dismisses.
    fireEvent.pointerDown(document.body, { button: 0 })
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

  it('traps focus without scroll lock when modal is trap-focus', async () => {
    render(() => (
      <Dialog.Root defaultOpen modal="trap-focus">
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Popup data-testid="popup">
            <button data-testid="first">First</button>
            <button data-testid="second">Second</button>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    ))

    expect(document.body.style.overflow).not.toBe('hidden')
    expect(screen.getByTestId('popup')).not.toHaveAttribute('aria-modal')

    await waitFor(() => {
      expect(screen.getByTestId('first')).toHaveFocus()
    })

    // jsdom does not move focus on Tab; assert wrap-around from last → first.
    screen.getByTestId('second').focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(screen.getByTestId('first')).toHaveFocus()
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

  it('exposes preventUnmountOnClose on change details', async () => {
    const actionsRef: DialogRootActions = {
      unmount: () => {},
      close: () => {},
    }
    const onOpenChange = vi.fn(
      (_open: boolean, details: DialogRootChangeEventDetails) => {
        // Only hold mount on the first close; later closes should unmount normally.
        if (onOpenChange.mock.calls.length === 1) {
          details.preventUnmountOnClose?.()
        }
      }
    )

    render(() => (
      <Dialog.Root
        defaultOpen
        onOpenChange={onOpenChange}
        actionsRef={actionsRef}
      >
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Popup data-testid="popup">
            <Dialog.Close>Close</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    ))

    expect(screen.getByTestId('popup')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(typeof onOpenChange.mock.calls[0]?.[1]?.preventUnmountOnClose).toBe(
      'function'
    )
    // Kept mounted until imperative unmount.
    expect(screen.getByTestId('popup')).toBeVisible()
    actionsRef.unmount()
    await waitFor(() => {
      expect(screen.queryByTestId('popup')).toBeNull()
    })

    // Re-open: preventUnmountOnClose must reset so a normal close unmounts again.
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    await waitFor(() => {
      expect(screen.getByTestId('popup')).toBeVisible()
    })
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => {
      expect(screen.queryByTestId('popup')).toBeNull()
    })
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

  it('only the topmost nested dialog dismisses on outside press', () => {
    const parentChange = vi.fn()
    const childChange = vi.fn()
    render(() => (
      <Dialog.Root defaultOpen onOpenChange={parentChange}>
        <Dialog.Portal>
          <Dialog.Backdrop data-testid="parent-backdrop" />
          <Dialog.Popup data-testid="parent-popup">
            <Dialog.Root defaultOpen onOpenChange={childChange}>
              <Dialog.Portal>
                {/* Nested backdrops are skipped unless forceRender */}
                <Dialog.Backdrop data-testid="child-backdrop" forceRender />
                <Dialog.Popup data-testid="child-popup">Child</Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    ))

    fireEvent.pointerDown(screen.getByTestId('child-backdrop'), { button: 0 })
    expect(childChange).toHaveBeenCalled()
    expect(childChange.mock.calls[0]?.[1]?.reason).toBe('outside-press')
    expect(parentChange).not.toHaveBeenCalled()
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

  it('renders Viewport when mounted', () => {
    render(() => (
      <Dialog.Root defaultOpen>
        <Dialog.Portal>
          <Dialog.Viewport data-testid="viewport">
            <Dialog.Popup data-testid="popup">Content</Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    ))

    expect(screen.getByTestId('viewport')).toBeVisible()
    expect(screen.getByTestId('viewport')).toHaveAttribute(
      'role',
      'presentation'
    )
  })

  describe('focus management', () => {
    it('cycles Tab within the modal popup', async () => {
      render(() => (
        <Dialog.Root defaultOpen>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup data-testid="popup">
              <button data-testid="first">First</button>
              <button data-testid="second">Second</button>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ))

      await waitFor(() => {
        expect(screen.getByTestId('first')).toHaveFocus()
      })

      // jsdom does not advance focus on Tab — exercise wrap edges only.
      screen.getByTestId('second').focus()
      fireEvent.keyDown(document, { key: 'Tab' })
      expect(screen.getByTestId('first')).toHaveFocus()

      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
      expect(screen.getByTestId('second')).toHaveFocus()
    })

    it('restores focus to the trigger on close by default', async () => {
      render(() => <BasicDialog />)

      const trigger = screen.getByRole('button', { name: 'Open' })
      trigger.focus()
      fireEvent.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup')).toBeVisible()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Close' }))
      await waitFor(() => {
        expect(screen.queryByTestId('popup')).toBeNull()
        expect(trigger).toHaveFocus()
      })
    })

    it('focuses the HTMLElement passed as initialFocus', async () => {
      function Harness() {
        const [target, targetAssign] = createSignal<HTMLElement | null>(null)
        const [open, openAssign] = createSignal(false)
        return (
          <div>
            <input
              data-testid="target"
              ref={el => {
                targetAssign(el)
                openAssign(true)
              }}
            />
            <Dialog.Root open={open()}>
              <Dialog.Trigger>Open</Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Popup data-testid="popup" initialFocus={target()}>
                  <button data-testid="first">First</button>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        )
      }

      render(() => <Harness />)

      await waitFor(() => {
        expect(screen.getByTestId('target')).toHaveFocus()
      })
    })

    it('does not move focus when initialFocus is false', async () => {
      render(() => (
        <div>
          <button data-testid="outside">Outside</button>
          {/* Use trap-focus so createFocusTrap is enabled and honors `false`. */}
          <Dialog.Root modal="trap-focus">
            <Dialog.Trigger>Open</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Popup data-testid="popup" initialFocus={false}>
                <input data-testid="inside" />
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      ))

      const trigger = screen.getByRole('button', { name: 'Open' })
      trigger.focus()
      fireEvent.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup')).toBeVisible()
      })
      // Allow microtasks from focus trap to settle.
      await Promise.resolve()
      await Promise.resolve()
      expect(trigger).toHaveFocus()
      expect(screen.getByTestId('inside')).not.toHaveFocus()
    })

    it('focuses finalFocus element on close', async () => {
      function Harness() {
        const [target, targetAssign] = createSignal<HTMLElement | null>(null)
        return (
          <div>
            <input data-testid="final" ref={el => targetAssign(el)} />
            <Dialog.Root>
              <Dialog.Trigger>Open</Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Popup data-testid="popup" finalFocus={target()}>
                  <Dialog.Close>Close</Dialog.Close>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        )
      }

      render(() => <Harness />)

      const trigger = screen.getByRole('button', { name: 'Open' })
      fireEvent.click(trigger)
      await waitFor(() => {
        expect(screen.getByTestId('popup')).toBeVisible()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Close' }))
      await waitFor(() => {
        expect(screen.queryByTestId('popup')).toBeNull()
        expect(screen.getByTestId('final')).toHaveFocus()
      })
    })

    it('does not restore focus when finalFocus is false', async () => {
      render(() => (
        <Dialog.Root>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup data-testid="popup" finalFocus={false}>
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ))

      const trigger = screen.getByRole('button', { name: 'Open' })
      trigger.focus()
      fireEvent.click(trigger)
      await waitFor(() => {
        expect(screen.getByTestId('popup')).toBeVisible()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Close' }))
      await waitFor(() => {
        expect(screen.queryByTestId('popup')).toBeNull()
      })
      await Promise.resolve()
      await Promise.resolve()
      expect(trigger).not.toHaveFocus()
    })

    it('non-modal after-guard focuses next tabbable, not the trigger', async () => {
      const onOpenChange = vi.fn()
      render(() => (
        <div>
          <Dialog.Root modal={false} onOpenChange={onOpenChange}>
            <Dialog.Trigger>Open</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Popup data-testid="popup">
                <button data-testid="inside">Inside</button>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
          <button data-testid="after">After</button>
        </div>
      ))

      fireEvent.click(screen.getByRole('button', { name: 'Open' }))
      await waitFor(() => {
        expect(screen.getByTestId('popup')).toBeVisible()
      })

      const guards = document.querySelectorAll('[data-base-ui-focus-guard]')
      const afterGuard = guards[guards.length - 1] as HTMLElement
      expect(afterGuard).toBeTruthy()

      fireEvent.focus(afterGuard)

      await waitFor(() => {
        expect(screen.getByTestId('after')).toHaveFocus()
      })
      expect(screen.getByRole('button', { name: 'Open' })).not.toHaveFocus()
      expect(onOpenChange).toHaveBeenCalledWith(
        false,
        expect.objectContaining({ reason: 'focus-out' })
      )
    })
  })

  it('exports createHandle and opens via detached trigger', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const handle = Dialog.createHandle()
    expect(handle).toBeInstanceOf(Dialog.Handle)
    expect(handle.isOpen).toBe(false)
    handle.open()
    expect(handle.isOpen).toBe(false)
    warn.mockRestore()

    render(() => (
      <>
        <Dialog.Trigger handle={handle} id="detached-trigger">
          Detached
        </Dialog.Trigger>
        <Dialog.Root handle={handle}>
          <Dialog.Portal>
            <Dialog.Popup data-testid="popup">
              <Dialog.Title>Title</Dialog.Title>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </>
    ))

    expect(screen.queryByTestId('popup')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Detached' }))
    await waitFor(() => {
      expect(screen.getByTestId('popup')).toBeVisible()
    })
    expect(handle.isOpen).toBe(true)

    handle.close()
    await waitFor(() => {
      expect(screen.queryByTestId('popup')).toBeNull()
    })
  })

  it('restores focus to a detached trigger on close', async () => {
    const handle = Dialog.createHandle()
    render(() => (
      <>
        <Dialog.Trigger handle={handle} id="detached-focus">
          Detached focus
        </Dialog.Trigger>
        <Dialog.Root handle={handle}>
          <Dialog.Portal>
            <Dialog.Popup data-testid="popup">
              <Dialog.Title>Title</Dialog.Title>
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </>
    ))

    const trigger = screen.getByRole('button', { name: 'Detached focus' })
    trigger.focus()
    fireEvent.click(trigger)

    await waitFor(() => {
      expect(screen.getByTestId('popup')).toBeVisible()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => {
      expect(screen.queryByTestId('popup')).toBeNull()
      expect(trigger).toHaveFocus()
    })
  })

  it('does not dismiss on outside press targeting a detached trigger', async () => {
    const handle = Dialog.createHandle()
    const onOpenChange = vi.fn()
    render(() => (
      <>
        <Dialog.Trigger handle={handle} id="detached-outside">
          Detached outside
        </Dialog.Trigger>
        <Dialog.Root handle={handle} modal={false} onOpenChange={onOpenChange}>
          <Dialog.Portal>
            <Dialog.Popup data-testid="popup">
              <Dialog.Title>Title</Dialog.Title>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Detached outside' }))
    await waitFor(() => {
      expect(screen.getByTestId('popup')).toBeVisible()
    })
    onOpenChange.mockClear()

    fireEvent.pointerDown(
      screen.getByRole('button', { name: 'Detached outside' }),
      { button: 0 }
    )
    expect(screen.getByTestId('popup')).toBeVisible()
    expect(onOpenChange).not.toHaveBeenCalled()

    fireEvent.pointerDown(document.body, { button: 0 })
    await waitFor(() => {
      expect(screen.queryByTestId('popup')).toBeNull()
    })
    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'outside-press' })
    )
  })

  it('exposes trigger payload to root children render function', async () => {
    const handle = Dialog.createHandle<{ text: string }>()
    render(() => (
      <>
        <Dialog.Trigger
          handle={handle}
          id="payload-trigger"
          payload={{ text: 'from-trigger' }}
        >
          Open with payload
        </Dialog.Trigger>
        <Dialog.Root handle={handle}>
          {
            (({ payload }: { payload: { text: string } | undefined }) => (
              <Dialog.Portal>
                <Dialog.Popup data-testid="popup">
                  <Dialog.Title>Title</Dialog.Title>
                  {payload !== undefined && (
                    <Dialog.Description data-testid="payload-text">
                      {payload.text}
                    </Dialog.Description>
                  )}
                </Dialog.Popup>
              </Dialog.Portal>
            )) as unknown as JSX.Element
          }
        </Dialog.Root>
      </>
    ))

    expect(screen.queryByTestId('payload-text')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Open with payload' }))
    await waitFor(() => {
      expect(screen.getByTestId('popup')).toBeVisible()
      expect(screen.getByTestId('payload-text')).toHaveTextContent(
        'from-trigger'
      )
    })
  })

  it('exposes openWithPayload to root children render function', async () => {
    const handle = Dialog.createHandle<{ text: string }>()
    render(() => (
      <>
        <button
          type="button"
          onClick={() => handle.openWithPayload({ text: 'imperative' })}
        >
          Imperative open
        </button>
        <Dialog.Root handle={handle}>
          {
            (({ payload }: { payload: { text: string } | undefined }) => (
              <Dialog.Portal>
                <Dialog.Popup data-testid="popup">
                  <Dialog.Title>Title</Dialog.Title>
                  {payload !== undefined && (
                    <span data-testid="payload-text">{payload.text}</span>
                  )}
                </Dialog.Popup>
              </Dialog.Portal>
            )) as unknown as JSX.Element
          }
        </Dialog.Root>
      </>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Imperative open' }))
    await waitFor(() => {
      expect(screen.getByTestId('popup')).toBeVisible()
      expect(screen.getByTestId('payload-text')).toHaveTextContent('imperative')
    })
    expect(handle.isOpen).toBe(true)
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
