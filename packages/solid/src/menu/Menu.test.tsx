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
