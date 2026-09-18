import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Menu } from './index'

import type { MenuRootChangeEventDetails } from './root/MenuRoot'
import type { JSX } from 'solid-js'

afterEach(() => {
  cleanup()
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
})

describe('Menu', () => {
  it('opens from the trigger and closes from item click', async () => {
    render(() => <BasicMenu />)

    expect(screen.queryByRole('menu')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.getByRole('menu')).toBeVisible()
    expect(screen.getByRole('menuitem', { name: 'Cut' })).toBeVisible()

    fireEvent.click(screen.getByRole('menuitem', { name: 'Cut' }))
    await waitFor(() => {
      expect(screen.queryByRole('menu')).toBeNull()
    })
  })

  it('supports controlled open state', () => {
    const [open, openAssign] = createSignal(false)
    const onOpenChange = vi.fn(
      (next: boolean, _details: MenuRootChangeEventDetails) => {
        openAssign(next)
      }
    )

    render(() => <BasicMenu open={open()} onOpenChange={onOpenChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(true)
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('trigger-press')
  })

  it('closes on Escape', () => {
    const onOpenChange = vi.fn()
    render(() => <BasicMenu defaultOpen onOpenChange={onOpenChange} />)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('escape-key')
  })

  it('closes on outside press', () => {
    const onOpenChange = vi.fn()
    render(() => (
      <BasicMenu defaultOpen modal={false} onOpenChange={onOpenChange} />
    ))

    fireEvent.pointerDown(document.body, { button: 0 })
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('outside-press')
  })

  it('applies scroll lock when modal is true', () => {
    render(() => <BasicMenu defaultOpen modal />)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('does not apply scroll lock when modal is false', () => {
    render(() => <BasicMenu defaultOpen modal={false} />)
    expect(document.body.style.overflow).not.toBe('hidden')
  })

  it('mounts into a portal host', () => {
    render(() => <BasicMenu defaultOpen />)
    const portal = document.querySelector('[data-base-ui-portal]')
    expect(portal).not.toBeNull()
    expect(portal?.contains(screen.getByRole('menu'))).toBe(true)
  })

  it('honors onOpenChange cancel()', () => {
    const onOpenChange = vi.fn(
      (_next: boolean, details: MenuRootChangeEventDetails) => {
        details.cancel()
      }
    )

    render(() => <BasicMenu onOpenChange={onOpenChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(onOpenChange).toHaveBeenCalled()
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('navigates items with ArrowDown / ArrowUp', async () => {
    render(() => <BasicMenu defaultOpen />)

    const menu = screen.getByRole('menu')
    menu.focus()
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    await waitFor(() => {
      expect(
        screen.getByRole('menuitem', { name: 'Cut' }).getAttribute(
          'data-highlighted'
        )
      ).toBe('')
      expect(screen.getByRole('menuitem', { name: 'Cut' }).tabIndex).toBe(0)
    })

    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    await waitFor(() => {
      expect(
        screen.getByRole('menuitem', { name: 'Copy' }).getAttribute(
          'data-highlighted'
        )
      ).toBe('')
      expect(screen.getByRole('menuitem', { name: 'Copy' }).tabIndex).toBe(0)
    })

    fireEvent.keyDown(menu, { key: 'ArrowUp' })
    await waitFor(() => {
      expect(
        screen.getByRole('menuitem', { name: 'Cut' }).getAttribute(
          'data-highlighted'
        )
      ).toBe('')
    })
  })

  it('createHandle opens and closes a detached trigger menu', async () => {
    const handle = Menu.createHandle()

    render(() => (
      <>
        <Menu.Trigger handle={handle} id="detached-trigger">
          Detached
        </Menu.Trigger>
        <Menu.Root handle={handle}>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup data-testid="popup">
                <Menu.Item>Action</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </>
    ))

    expect(screen.queryByRole('menu')).toBeNull()
    handle.open('detached-trigger')
    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeVisible()
    })
    expect(handle.isOpen).toBe(true)

    handle.close()
    await waitFor(() => {
      expect(screen.queryByRole('menu')).toBeNull()
    })
    expect(handle.isOpen).toBe(false)
  })

  it('toggles CheckboxItem checked state', async () => {
    const onCheckedChange = vi.fn()
    render(() => (
      <Menu.Root defaultOpen>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.CheckboxItem
                defaultChecked={false}
                onCheckedChange={onCheckedChange}
              >
                Bold
              </Menu.CheckboxItem>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    ))

    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Bold' }))
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything())
    await waitFor(() => {
      expect(
        screen.getByRole('menuitemcheckbox', { name: 'Bold' }).getAttribute(
          'aria-checked'
        )
      ).toBe('true')
    })
  })

  it('selects RadioItem within RadioGroup', async () => {
    const onValueChange = vi.fn()
    render(() => (
      <Menu.Root defaultOpen>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.RadioGroup
                defaultValue="left"
                onValueChange={onValueChange}
              >
                <Menu.RadioItem value="left">Left</Menu.RadioItem>
                <Menu.RadioItem value="right">Right</Menu.RadioItem>
              </Menu.RadioGroup>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    ))

    expect(
      screen.getByRole('menuitemradio', { name: 'Left' }).getAttribute(
        'aria-checked'
      )
    ).toBe('true')

    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Right' }))
    expect(onValueChange).toHaveBeenCalledWith('right', expect.anything())
    await waitFor(() => {
      expect(
        screen.getByRole('menuitemradio', { name: 'Right' }).getAttribute(
          'aria-checked'
        )
      ).toBe('true')
    })
  })

  it('labels a Group via GroupLabel', () => {
    render(() => (
      <Menu.Root defaultOpen>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Group>
                <Menu.GroupLabel>Edit</Menu.GroupLabel>
                <Menu.Item>Undo</Menu.Item>
              </Menu.Group>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    ))

    const group = screen.getByRole('group')
    const label = screen.getByText('Edit')
    expect(group.getAttribute('aria-labelledby')).toBe(label.id)
  })

  it('highlights items via typeahead', async () => {
    render(() => <BasicMenu defaultOpen />)

    const menu = screen.getByRole('menu')
    menu.focus()
    fireEvent.keyDown(menu, { key: 'p' })
    await waitFor(() => {
      expect(
        screen.getByRole('menuitem', { name: 'Paste' }).getAttribute(
          'data-highlighted'
        )
      ).toBe('')
    })
  })

  it('renders Separator between items', () => {
    render(() => (
      <Menu.Root defaultOpen>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Item>Cut</Menu.Item>
              <Menu.Separator data-testid="sep" />
              <Menu.Item>Copy</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    ))

    expect(screen.getByTestId('sep').getAttribute('role')).toBe('separator')
  })

  it('opens a submenu from SubmenuTrigger click and sets aria-controls', async () => {
    render(() => <MenuWithSubmenu />)

    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeVisible()
    })

    const submenuTrigger = screen.getByRole('menuitem', { name: 'More' })
    fireEvent.click(submenuTrigger)

    await waitFor(() => {
      const menus = screen.getAllByRole('menu')
      expect(menus.length).toBe(2)
    })

    await waitFor(() => {
      const trigger = screen.getByRole('menuitem', { name: 'More' })
      expect(trigger.getAttribute('aria-expanded')).toBe('true')
      expect(trigger.getAttribute('aria-controls')).toBeTruthy()
    })

    expect(screen.getByRole('menuitem', { name: 'Nested' })).toBeVisible()
    expect(document.querySelector('[data-nested]')).not.toBeNull()
  })

  it('includes SubmenuTrigger in parent ArrowDown navigation', async () => {
    render(() => <MenuWithSubmenu defaultOpen />)

    const menu = screen.getByRole('menu')
    menu.focus()
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    await waitFor(() => {
      expect(
        screen.getByRole('menuitem', { name: 'Cut' }).getAttribute(
          'data-highlighted'
        )
      ).toBe('')
    })
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    await waitFor(() => {
      expect(
        screen.getByRole('menuitem', { name: 'More' }).getAttribute(
          'data-highlighted'
        )
      ).toBe('')
    })
  })

  it('opens submenu with ArrowRight and closes with ArrowLeft', async () => {
    render(() => <MenuWithSubmenu defaultOpen />)

    const parentMenu = screen.getByRole('menu')
    parentMenu.focus()
    fireEvent.keyDown(parentMenu, { key: 'ArrowDown' })
    fireEvent.keyDown(parentMenu, { key: 'ArrowDown' })
    await waitFor(() => {
      expect(
        screen.getByRole('menuitem', { name: 'More' }).getAttribute(
          'data-highlighted'
        )
      ).toBe('')
    })

    const submenuTrigger = screen.getByRole('menuitem', { name: 'More' })
    // Keydown on the highlighted trigger (focus may have moved off the popup).
    fireEvent.keyDown(submenuTrigger, { key: 'ArrowRight' })
    await waitFor(() => {
      expect(screen.getAllByRole('menu').length).toBe(2)
    })

    const nestedMenu = screen.getAllByRole('menu')[1]!
    nestedMenu.focus()
    fireEvent.keyDown(nestedMenu, { key: 'ArrowLeft' })
    await waitFor(() => {
      expect(screen.getAllByRole('menu').length).toBe(1)
    })
  })

  it('clears preventUnmountOnClose on reopen so a later close can unmount', async () => {
    const actionsRef: { unmount: () => void; close: () => void } = {
      unmount: () => {},
      close: () => {},
    }
    const onOpenChange = vi.fn(
      (_next: boolean, details: MenuRootChangeEventDetails) => {
        // Only hold mount on the first close; later closes should unmount normally.
        if (onOpenChange.mock.calls.length === 1) {
          details.preventUnmountOnClose?.()
        }
      }
    )

    render(() => (
      <Menu.Root
        defaultOpen
        onOpenChange={onOpenChange}
        actionsRef={actionsRef}
      >
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup data-testid="popup">
              <Menu.Item>Cut</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    ))

    expect(screen.getByTestId('popup')).toBeVisible()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(typeof onOpenChange.mock.calls[0]?.[1]?.preventUnmountOnClose).toBe(
      'function'
    )
    expect(screen.getByTestId('popup')).toBeVisible()

    actionsRef.unmount()
    await waitFor(() => {
      expect(screen.queryByRole('menu')).toBeNull()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeVisible()
    })

    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => {
      expect(screen.queryByRole('menu')).toBeNull()
    })
  })
})

function BasicMenu(props: {
  open?: boolean
  defaultOpen?: boolean
  modal?: boolean
  onOpenChange?: (
    open: boolean,
    eventDetails: MenuRootChangeEventDetails
  ) => void
}): JSX.Element {
  return (
    <Menu.Root
      open={props.open}
      defaultOpen={props.defaultOpen}
      modal={props.modal}
      onOpenChange={props.onOpenChange}
    >
      <Menu.Trigger>Open</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Popup>
            <Menu.Item>Cut</Menu.Item>
            <Menu.Item>Copy</Menu.Item>
            <Menu.Item>Paste</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}

function MenuWithSubmenu(props: {
  defaultOpen?: boolean
}): JSX.Element {
  return (
    <Menu.Root defaultOpen={props.defaultOpen}>
      <Menu.Trigger>Open</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Popup>
            <Menu.Item>Cut</Menu.Item>
            <Menu.SubmenuRoot>
              <Menu.SubmenuTrigger>More</Menu.SubmenuTrigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.Item>Nested</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.SubmenuRoot>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
