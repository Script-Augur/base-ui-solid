import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'

import { Menu } from '../menu'

import { Menubar } from './index'

import type { JSX } from 'solid-js'

afterEach(() => {
  cleanup()
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
})

describe('Menubar', () => {
  it('renders role=menubar with orientation', () => {
    render(() => (
      <Menubar>
        <FileMenu />
      </Menubar>
    ))

    const bar = screen.getByRole('menubar')
    expect(bar).toBeVisible()
    expect(bar.getAttribute('aria-orientation')).toBe('horizontal')
  })

  it('opens a nested Menu from a menuitem trigger', () => {
    render(() => (
      <Menubar>
        <FileMenu />
      </Menubar>
    ))

    expect(screen.queryByRole('menu')).toBeNull()

    const trigger = screen.getByRole('menuitem', { name: 'File' })
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu')

    fireEvent.click(trigger)
    expect(screen.getByRole('menu')).toBeVisible()
    expect(screen.getByRole('menuitem', { name: 'New' })).toBeVisible()
  })

  it('sets data-has-submenu-open when a menu is open', async () => {
    render(() => (
      <Menubar>
        <FileMenu />
      </Menubar>
    ))

    const bar = screen.getByRole('menubar')
    expect(bar.getAttribute('data-has-submenu-open')).toBeNull()

    fireEvent.click(screen.getByRole('menuitem', { name: 'File' }))
    await waitFor(() => {
      expect(bar.getAttribute('data-has-submenu-open')).toBe('')
    })
  })

  it('closes the open menu when a sibling menu opens', async () => {
    render(() => (
      <Menubar>
        <FileMenu />
        <EditMenu />
      </Menubar>
    ))

    fireEvent.click(screen.getByRole('menuitem', { name: 'File' }))
    expect(screen.getByRole('menuitem', { name: 'New' })).toBeVisible()

    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }))
    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: 'New' })).toBeNull()
      expect(screen.getByRole('menuitem', { name: 'Undo' })).toBeVisible()
    })
  })

  it('moves focus between triggers with ArrowRight when a menu is open', async () => {
    render(() => (
      <Menubar>
        <FileMenu />
        <EditMenu />
      </Menubar>
    ))

    const file = screen.getByRole('menuitem', { name: 'File' })
    const edit = screen.getByRole('menuitem', { name: 'Edit' })

    fireEvent.click(file)
    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeVisible()
    })

    file.focus()
    fireEvent.keyDown(screen.getByRole('menubar'), { key: 'ArrowRight' })
    await waitFor(() => {
      expect(document.activeElement).toBe(edit)
    })
  })

  it('relays ArrowRight from an open popup to the menubar CompositeRoot', async () => {
    render(() => (
      <Menubar>
        <FileMenu />
        <EditMenu />
      </Menubar>
    ))

    fireEvent.click(screen.getByRole('menuitem', { name: 'File' }))
    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeVisible()
    })

    const menu = screen.getByRole('menu')
    menu.focus()
    fireEvent.keyDown(menu, { key: 'ArrowRight' })

    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByRole('menuitem', { name: 'Edit' })
      )
      expect(screen.getByRole('menuitem', { name: 'Undo' })).toBeVisible()
    })
  })

  it('does not close a menubar menu on ArrowLeft from the popup', () => {
    render(() => (
      <Menubar>
        <FileMenu />
      </Menubar>
    ))

    fireEvent.click(screen.getByRole('menuitem', { name: 'File' }))
    const menu = screen.getByRole('menu')
    menu.focus()
    fireEvent.keyDown(menu, { key: 'ArrowLeft' })

    expect(screen.getByRole('menu')).toBeVisible()
    expect(screen.getByRole('menuitem', { name: 'New' })).toBeVisible()
  })

  it('highlights a sibling trigger on hover while a menu is open', async () => {
    render(() => (
      <Menubar>
        <FileMenu />
        <EditMenu />
      </Menubar>
    ))

    fireEvent.click(screen.getByRole('menuitem', { name: 'File' }))
    await waitFor(() => {
      expect(
        screen.getByRole('menubar').getAttribute('data-has-submenu-open')
      ).toBe('')
    })

    const edit = screen.getByRole('menuitem', { name: 'Edit' })
    fireEvent.mouseMove(edit)
    await waitFor(() => {
      expect(document.activeElement).toBe(edit)
    })
  })

  it('honors disabled on the menubar', () => {
    render(() => (
      <Menubar disabled>
        <FileMenu />
      </Menubar>
    ))

    fireEvent.click(screen.getByRole('menuitem', { name: 'File' }))
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('applies scroll lock when modal (default)', () => {
    render(() => (
      <Menubar>
        <FileMenu defaultOpen />
      </Menubar>
    ))
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('does not apply scroll lock when modal={false}', () => {
    render(() => (
      <Menubar modal={false}>
        <FileMenu defaultOpen />
      </Menubar>
    ))
    expect(document.body.style.overflow).not.toBe('hidden')
  })
})

function FileMenu(props: { defaultOpen?: boolean }): JSX.Element {
  return (
    <Menu.Root defaultOpen={props.defaultOpen}>
      <Menu.Trigger>File</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Popup>
            <Menu.Item>New</Menu.Item>
            <Menu.Item>Open</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}

function EditMenu(): JSX.Element {
  return (
    <Menu.Root>
      <Menu.Trigger>Edit</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Popup>
            <Menu.Item>Undo</Menu.Item>
            <Menu.Item>Redo</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
