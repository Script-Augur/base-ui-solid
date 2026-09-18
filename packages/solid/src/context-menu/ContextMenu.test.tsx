import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ContextMenu } from './index'

import type { ContextMenuRootChangeEventDetails } from './root/ContextMenuRoot'
import type { JSX } from 'solid-js'

afterEach(() => {
  cleanup()
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
})

describe('ContextMenu', () => {
  it('opens on contextmenu and closes from item click', async () => {
    render(() => <BasicContextMenu />)

    expect(screen.queryByRole('menu')).toBeNull()

    fireEvent.contextMenu(screen.getByTestId('trigger'), {
      clientX: 40,
      clientY: 60,
    })
    expect(screen.getByRole('menu')).toBeVisible()
    expect(screen.getByRole('menuitem', { name: 'Cut' })).toBeVisible()

    fireEvent.click(screen.getByRole('menuitem', { name: 'Cut' }))
    await waitFor(() => {
      expect(screen.queryByRole('menu')).toBeNull()
    })
  })

  it('supports controlled open via onOpenChange', () => {
    const [open, openAssign] = createSignal(false)
    const onOpenChange = vi.fn(
      (next: boolean, _details: ContextMenuRootChangeEventDetails) => {
        openAssign(next)
      }
    )

    render(() => (
      <BasicContextMenu open={open()} onOpenChange={onOpenChange} />
    ))

    fireEvent.contextMenu(screen.getByTestId('trigger'), {
      clientX: 10,
      clientY: 10,
    })
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(true)
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('trigger-press')
  })

  it('closes on Escape', () => {
    const onOpenChange = vi.fn()
    render(() => <BasicContextMenu defaultOpen onOpenChange={onOpenChange} />)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('escape-key')
  })

  it('closes on outside press immediately after contextmenu open (no grace)', async () => {
    const onOpenChange = vi.fn()
    render(() => (
      <ContextMenu.Root onOpenChange={onOpenChange}>
        <ContextMenu.Trigger data-testid="trigger">Area</ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Backdrop data-testid="backdrop" />
          <ContextMenu.Positioner>
            <ContextMenu.Popup>
              <ContextMenu.Item>Cut</ContextMenu.Item>
            </ContextMenu.Popup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>
    ))

    fireEvent.contextMenu(screen.getByTestId('trigger'), {
      clientX: 20,
      clientY: 30,
    })
    expect(screen.getByRole('menu')).toBeVisible()
    expect(onOpenChange.mock.calls[0]?.[1]?.event?.type).toBe('contextmenu')

    // Upstream skips the 500ms grace when openEvent.type === 'contextmenu'.
    // Modal menus dismiss via backdrop press (same as Dialog).
    fireEvent.pointerDown(screen.getByTestId('backdrop'), { button: 0 })
    const closeCall = onOpenChange.mock.calls.find(call => call[0] === false)
    expect(closeCall?.[1]?.reason).toBe('outside-press')
    await waitFor(() => {
      expect(screen.queryByRole('menu')).toBeNull()
    })
  })

  it('applies scroll lock when open (modal context menu)', () => {
    render(() => <BasicContextMenu defaultOpen />)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('mounts into a portal host', () => {
    render(() => <BasicContextMenu defaultOpen />)
    const portal = document.querySelector('[data-base-ui-portal]')
    expect(portal).not.toBeNull()
    expect(portal?.contains(screen.getByRole('menu'))).toBe(true)
  })

  it('exposes role=menu / menuitem and data-rootownerid', () => {
    render(() => <BasicContextMenu defaultOpen />)
    const menu = screen.getByRole('menu')
    expect(menu).toHaveAttribute('data-rootownerid')
    expect(screen.getByRole('menuitem', { name: 'Cut' })).toBeVisible()
  })

  it('marks the trigger with data-popup-open when open', () => {
    render(() => <BasicContextMenu defaultOpen />)
    expect(screen.getByTestId('trigger')).toHaveAttribute('data-popup-open')
    expect(screen.getByTestId('trigger')).toHaveAttribute('data-pressed')
  })

  it('does not open when disabled', () => {
    render(() => <BasicContextMenu disabled />)
    fireEvent.contextMenu(screen.getByTestId('trigger'), {
      clientX: 10,
      clientY: 10,
    })
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('supports nested submenu open via click', async () => {
    render(() => (
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger data-testid="trigger">Area</ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner>
            <ContextMenu.Popup>
              <ContextMenu.Item>Cut</ContextMenu.Item>
              <ContextMenu.SubmenuRoot>
                <ContextMenu.SubmenuTrigger>More</ContextMenu.SubmenuTrigger>
                <ContextMenu.Portal>
                  <ContextMenu.Positioner>
                    <ContextMenu.Popup>
                      <ContextMenu.Item>Nested</ContextMenu.Item>
                    </ContextMenu.Popup>
                  </ContextMenu.Positioner>
                </ContextMenu.Portal>
              </ContextMenu.SubmenuRoot>
            </ContextMenu.Popup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>
    ))

    fireEvent.click(screen.getByRole('menuitem', { name: 'More' }))
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Nested' })).toBeVisible()
    })
  })
})

function BasicContextMenu(props: {
  open?: boolean
  defaultOpen?: boolean
  disabled?: boolean
  onOpenChange?: (
    open: boolean,
    details: ContextMenuRootChangeEventDetails
  ) => void
}): JSX.Element {
  return (
    <ContextMenu.Root
      open={props.open}
      defaultOpen={props.defaultOpen}
      disabled={props.disabled}
      onOpenChange={props.onOpenChange}
    >
      <ContextMenu.Trigger data-testid="trigger">Area</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner>
          <ContextMenu.Popup>
            <ContextMenu.Item>Cut</ContextMenu.Item>
            <ContextMenu.Item>Copy</ContextMenu.Item>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}
