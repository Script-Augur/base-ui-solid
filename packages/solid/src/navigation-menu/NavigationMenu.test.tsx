import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DirectionProvider } from '../internals/direction'

import { NavigationMenu } from './index'

import type { NavigationMenuRootChangeEventDetails } from './root/NavigationMenuRoot'
import type { JSX } from 'solid-js'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
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

  it('wires aria-controls to the popup id when open', () => {
    render(() => <BasicNavigationMenu />)

    const trigger = screen.getByRole('button', { name: 'Overview' })
    fireEvent.click(trigger)

    const popupEl = document.querySelector('[id^="base-ui-navigation-menu"]')
    expect(popupEl).not.toBeNull()
    expect(trigger.getAttribute('aria-controls')).toBe(popupEl?.id)
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

  describe('hover Lite bridge', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
    })

    it('opens on hover after delay and stays open when pointer enters popup', async () => {
      const onValueChange = vi.fn()
      render(() => (
        <BasicNavigationMenu
          delay={50}
          closeDelay={50}
          onValueChange={onValueChange}
        />
      ))

      const trigger = screen.getByRole('button', { name: 'Overview' })
      fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
      await vi.advanceTimersByTimeAsync(50)

      expect(screen.getByTestId('content-overview')).toBeVisible()
      expect(onValueChange.mock.calls.at(-1)?.[1]?.reason).toBe('trigger-hover')

      const popup = document.querySelector('[id^="base-ui-navigation-menu"]')
      expect(popup).not.toBeNull()

      fireEvent.pointerLeave(trigger, { pointerType: 'mouse' })
      fireEvent.pointerEnter(popup!, { pointerType: 'mouse' })
      await vi.advanceTimersByTimeAsync(50)

      expect(screen.getByTestId('content-overview')).toBeVisible()
    })

    it('closes on hover leave when pointer never reaches the popup', async () => {
      render(() => <BasicNavigationMenu delay={50} closeDelay={50} />)

      const trigger = screen.getByRole('button', { name: 'Overview' })
      fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
      await vi.advanceTimersByTimeAsync(50)
      expect(screen.getByTestId('content-overview')).toBeVisible()

      fireEvent.pointerLeave(trigger, { pointerType: 'mouse' })
      await vi.advanceTimersByTimeAsync(50)
      await waitFor(() => {
        expect(screen.queryByTestId('content-overview')).toBeNull()
      })
    })

    it('blocks impatient click-close after hover open (stickIfOpen)', async () => {
      render(() => <BasicNavigationMenu delay={50} closeDelay={50} />)

      const trigger = screen.getByRole('button', { name: 'Overview' })
      fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
      await vi.advanceTimersByTimeAsync(50)
      expect(screen.getByTestId('content-overview')).toBeVisible()

      fireEvent.click(trigger)
      expect(screen.getByTestId('content-overview')).toBeVisible()

      await vi.advanceTimersByTimeAsync(500)
      fireEvent.click(trigger)
      expect(screen.queryByTestId('content-overview')).toBeNull()
    })
  })

  it('dismisses on outside-press to non-trigger list chrome', () => {
    const onValueChange = vi.fn()
    render(() => (
      <BasicNavigationMenu
        defaultValue="overview"
        onValueChange={onValueChange}
      />
    ))

    expect(screen.getByTestId('content-overview')).toBeVisible()

    fireEvent.pointerDown(screen.getByTestId('list-chrome'), { button: 0 })
    expect(onValueChange).toHaveBeenCalled()
    expect(onValueChange.mock.calls[0]?.[0]).toBeNull()
    expect(onValueChange.mock.calls[0]?.[1]?.reason).toBe('outside-press')
  })

  it('dismisses on outside-press outside the root', () => {
    const onValueChange = vi.fn()
    render(() => (
      <>
        <BasicNavigationMenu
          defaultValue="overview"
          onValueChange={onValueChange}
        />
        <button type="button" data-testid="outside">
          Outside
        </button>
      </>
    ))

    fireEvent.pointerDown(screen.getByTestId('outside'), { button: 0 })
    expect(onValueChange.mock.calls[0]?.[1]?.reason).toBe('outside-press')
  })

  it('opens horizontal menus with ArrowDown', () => {
    const onValueChange = vi.fn()
    render(() => <BasicNavigationMenu onValueChange={onValueChange} />)

    fireEvent.keyDown(screen.getByRole('button', { name: 'Overview' }), {
      key: 'ArrowDown',
    })
    expect(onValueChange.mock.calls[0]?.[0]).toBe('overview')
    expect(onValueChange.mock.calls[0]?.[1]?.reason).toBe('list-navigation')
  })

  it('opens vertical menus with ArrowRight (LTR)', () => {
    const onValueChange = vi.fn()
    render(() => (
      <BasicNavigationMenu
        orientation="vertical"
        onValueChange={onValueChange}
      />
    ))

    const trigger = screen.getByRole('button', { name: 'Overview' })
    fireEvent.keyDown(trigger, { key: 'ArrowUp' })
    expect(onValueChange).not.toHaveBeenCalled()

    fireEvent.keyDown(trigger, { key: 'ArrowRight' })
    expect(onValueChange.mock.calls[0]?.[0]).toBe('overview')
    expect(onValueChange.mock.calls[0]?.[1]?.reason).toBe('list-navigation')
  })

  it('opens vertical menus with ArrowLeft under RTL', () => {
    const onValueChange = vi.fn()
    render(() => (
      <DirectionProvider direction="rtl">
        <BasicNavigationMenu
          orientation="vertical"
          onValueChange={onValueChange}
        />
      </DirectionProvider>
    ))

    fireEvent.keyDown(screen.getByRole('button', { name: 'Overview' }), {
      key: 'ArrowLeft',
    })
    expect(onValueChange.mock.calls[0]?.[1]?.reason).toBe('list-navigation')
  })

  it('does not intercept arrow open keys when nested', () => {
    const onValueChange = vi.fn()
    render(() => (
      <NavigationMenu.Root>
        <NavigationMenu.List>
          <NavigationMenu.Item value="parent">
            <NavigationMenu.Trigger>Parent</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <NavigationMenu.Root onValueChange={onValueChange}>
                <NavigationMenu.List>
                  <NavigationMenu.Item value="child">
                    <NavigationMenu.Trigger>Child</NavigationMenu.Trigger>
                  </NavigationMenu.Item>
                </NavigationMenu.List>
              </NavigationMenu.Root>
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
    ))

    // Open parent so nested content mounts (keepMounted not set — open first).
    fireEvent.click(screen.getByRole('button', { name: 'Parent' }))
    const child = screen.getByRole('button', { name: 'Child' })
    fireEvent.keyDown(child, { key: 'ArrowDown' })
    fireEvent.keyDown(child, { key: 'ArrowRight' })
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('closes with focusOut when trigger blurs outside the menu', () => {
    const onValueChange = vi.fn()
    render(() => (
      <>
        <BasicNavigationMenu
          defaultValue="overview"
          onValueChange={onValueChange}
        />
        <button type="button" data-testid="elsewhere">
          Elsewhere
        </button>
      </>
    ))

    const trigger = screen.getByRole('button', { name: 'Overview' })
    fireEvent.blur(trigger, {
      relatedTarget: screen.getByTestId('elsewhere'),
    })
    expect(onValueChange).toHaveBeenCalled()
    expect(onValueChange.mock.calls[0]?.[0]).toBeNull()
    expect(onValueChange.mock.calls[0]?.[1]?.reason).toBe('focus-out')
  })
})

function BasicNavigationMenu(props: {
  value?: unknown
  defaultValue?: unknown
  delay?: number
  closeDelay?: number
  orientation?: 'horizontal' | 'vertical'
  onValueChange?: (
    value: unknown,
    details: NavigationMenuRootChangeEventDetails
  ) => void
}): JSX.Element {
  return (
    <NavigationMenu.Root
      value={props.value}
      defaultValue={props.defaultValue}
      delay={props.delay}
      closeDelay={props.closeDelay}
      orientation={props.orientation}
      onValueChange={props.onValueChange}
    >
      <NavigationMenu.List data-testid="list">
        <li data-testid="list-chrome" aria-hidden="true" />
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
