import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { NavigationMenu } from './index'

import type { NavigationMenuRootChangeEventDetails } from './root/NavigationMenuRoot'
import type { JSX } from 'solid-js'

afterEach(() => {
  cleanup()
})

describe('NavigationMenu', () => {
  it('opens from the trigger click and shows content', () => {
    render(() => <BasicNavigationMenu />)

    expect(screen.queryByTestId('content-overview')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Overview' }))
    expect(screen.getByTestId('content-overview')).toBeVisible()
    expect(
      screen
        .getByRole('button', { name: 'Overview' })
        .getAttribute('aria-expanded')
    ).toBe('true')
  })

  it('supports controlled value state', () => {
    const [value, valueAssign] = createSignal<string | null>(null)
    const onValueChange = vi.fn(
      (next: unknown, _details: NavigationMenuRootChangeEventDetails) => {
        valueAssign(next as string | null)
      }
    )

    render(() => (
      <BasicNavigationMenu value={value()} onValueChange={onValueChange} />
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Overview' }))
    expect(onValueChange).toHaveBeenCalled()
    const firstCall = onValueChange.mock.calls[0]
    expect(firstCall?.[0]).toBe('overview')
    expect(firstCall?.[1].reason).toBe('trigger-press')
  })

  it('closes on Escape', () => {
    const onValueChange = vi.fn()
    render(() => (
      <BasicNavigationMenu
        defaultValue="overview"
        onValueChange={onValueChange}
      />
    ))

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onValueChange).toHaveBeenCalled()
    expect(onValueChange.mock.calls[0]?.[1]?.reason).toBe('escape-key')
  })

  it('closes Link with closeOnClick using link-press reason', () => {
    const onValueChange = vi.fn()
    render(() => (
      <BasicNavigationMenu
        defaultValue="overview"
        onValueChange={onValueChange}
      />
    ))

    fireEvent.click(screen.getByRole('link', { name: 'Docs' }))
    expect(onValueChange).toHaveBeenCalled()
    expect(onValueChange.mock.calls[0]?.[0]).toBeNull()
    expect(onValueChange.mock.calls[0]?.[1]?.reason).toBe('link-press')
  })

  it('honors onValueChange cancel()', () => {
    const onValueChange = vi.fn(
      (_next: unknown, details: NavigationMenuRootChangeEventDetails) => {
        details.cancel()
      }
    )

    render(() => <BasicNavigationMenu onValueChange={onValueChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Overview' }))
    expect(onValueChange).toHaveBeenCalled()
    expect(screen.queryByTestId('content-overview')).toBeNull()
  })

  it('toggles closed on second trigger press', () => {
    render(() => <BasicNavigationMenu />)

    const trigger = screen.getByRole('button', { name: 'Overview' })
    fireEvent.click(trigger)
    expect(screen.getByTestId('content-overview')).toBeVisible()

    fireEvent.click(trigger)
    expect(screen.queryByTestId('content-overview')).toBeNull()
  })
})

function BasicNavigationMenu(props: {
  value?: unknown
  defaultValue?: unknown
  onValueChange?: (
    value: unknown,
    details: NavigationMenuRootChangeEventDetails
  ) => void
}): JSX.Element {
  return (
    <NavigationMenu.Root
      value={props.value}
      defaultValue={props.defaultValue}
      onValueChange={props.onValueChange}
    >
      <NavigationMenu.List>
        <NavigationMenu.Item value="overview">
          <NavigationMenu.Trigger>Overview</NavigationMenu.Trigger>
          <NavigationMenu.Content data-testid="content-overview">
            <NavigationMenu.Link href="#docs" closeOnClick>
              Docs
            </NavigationMenu.Link>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item value="handbook">
          <NavigationMenu.Trigger>Handbook</NavigationMenu.Trigger>
          <NavigationMenu.Content data-testid="content-handbook">
            Handbook body
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>
      <NavigationMenu.Portal>
        <NavigationMenu.Positioner>
          <NavigationMenu.Popup>
            <NavigationMenu.Viewport />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  )
}
