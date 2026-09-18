import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useDrawerProviderContext } from './provider/DrawerProviderContext'
import { useDrawerRootContext } from './root/DrawerRootContext'

import { Drawer } from './index'

import type {
  DrawerRootActions,
  DrawerRootChangeEventDetails,
  DrawerRootProps,
} from './root/DrawerRoot'
import type { JSX } from 'solid-js'

afterEach(() => {
  cleanup()
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
})

describe('Drawer', () => {
  it('opens from the trigger and closes from Close', () => {
    const onOpenChange = vi.fn()
    render(() => (
      <Drawer.Root onOpenChange={onOpenChange}>
        <Drawer.Trigger>Open</Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Popup data-testid="popup">
            <Drawer.Title>Title</Drawer.Title>
            <Drawer.Close>Close</Drawer.Close>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>
    ))

    expect(screen.queryByTestId('popup')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'trigger-press' })
    )
    expect(screen.getByTestId('popup')).toBeVisible()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByTestId('popup')).toBeNull()
  })

  it('supports controlled open state', () => {
    const [open, openAssign] = createSignal(false)
    const onOpenChange = vi.fn(
      (next: boolean, _details: DrawerRootChangeEventDetails) => {
        openAssign(next)
      }
    )

    render(() => <BasicDrawer open={open()} onOpenChange={onOpenChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(true)
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('trigger-press')
  })

  it('wires aria-labelledby / aria-describedby to Title and Description', () => {
    render(() => <BasicDrawer defaultOpen />)

    const popup = screen.getByTestId('popup')
    const title = screen.getByText('Title')
    const description = screen.getByText('Description')

    expect(popup.getAttribute('aria-labelledby')).toBe(title.id)
    expect(popup.getAttribute('aria-describedby')).toBe(description.id)
  })

  it('closes on Escape', () => {
    const onOpenChange = vi.fn()
    render(() => <BasicDrawer defaultOpen onOpenChange={onOpenChange} />)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('escape-key')
  })

  it('closes on backdrop pointerdown for modal drawers', () => {
    const onOpenChange = vi.fn()
    render(() => <BasicDrawer defaultOpen onOpenChange={onOpenChange} />)

    fireEvent.pointerDown(screen.getByTestId('backdrop'), { button: 0 })
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('outside-press')
  })

  it('exposes swipeDirection and expanded on popup data attributes', () => {
    render(() => <BasicDrawer defaultOpen swipeDirection="left" />)

    const popup = screen.getByTestId('popup')
    expect(popup).toHaveAttribute('data-swipe-direction', 'left')
    expect(popup).toHaveAttribute('data-expanded')
    expect(popup).toHaveAttribute('data-open')
  })

  it('reflects snapPoints expanded state (last point = expanded)', () => {
    render(() => (
      <BasicDrawer defaultOpen snapPoints={[0.3, 0.8]} defaultSnapPoint={0.3} />
    ))

    expect(screen.getByTestId('popup')).not.toHaveAttribute('data-expanded')
  })

  it('marks Content with data-drawer-content', () => {
    render(() => (
      <Drawer.Root defaultOpen>
        <Drawer.Portal>
          <Drawer.Popup>
            <Drawer.Content data-testid="content">Body</Drawer.Content>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>
    ))

    expect(screen.getByTestId('content')).toHaveAttribute(
      'data-drawer-content'
    )
  })

  it('renders SwipeArea with opposite swipe direction (Lite: no gesture)', () => {
    render(() => (
      <Drawer.Root swipeDirection="down">
        <Drawer.SwipeArea data-testid="swipe-area" />
        <Drawer.Trigger>Open</Drawer.Trigger>
      </Drawer.Root>
    ))

    const area = screen.getByTestId('swipe-area')
    expect(area).toHaveAttribute('data-swipe-direction', 'up')
    expect(area).toHaveAttribute('data-closed')
    expect(area).toHaveAttribute('aria-hidden', 'true')
  })

  it('Provider Indent / IndentBackground flip data-active when open', async () => {
    render(() => (
      <Drawer.Provider>
        <Drawer.IndentBackground data-testid="indent-bg" />
        <Drawer.Indent data-testid="indent">
          <BasicDrawer />
        </Drawer.Indent>
      </Drawer.Provider>
    ))

    expect(screen.getByTestId('indent')).toHaveAttribute('data-inactive')
    expect(screen.getByTestId('indent-bg')).toHaveAttribute('data-inactive')

    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    await waitFor(() => {
      expect(screen.getByTestId('indent')).toHaveAttribute('data-active')
      expect(screen.getByTestId('indent-bg')).toHaveAttribute('data-active')
    })
  })

  it('exposes drawer root context values', () => {
    render(() => (
      <Drawer.Root
        defaultOpen
        swipeDirection="right"
        snapPoints={[0.5, 1]}
        defaultSnapPoint={1}
      >
        <DrawerStateProbe data-testid="state" />
        <Drawer.Portal>
          <Drawer.Popup>Content</Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>
    ))

    const state = screen.getByTestId('state')
    expect(state).toHaveAttribute('data-swipe-direction', 'right')
    expect(state).toHaveAttribute('data-expanded', 'true')
    expect(state).toHaveAttribute('data-swiping', 'false')
  })

  it('respects onOpenChange cancel()', () => {
    render(() => (
      <BasicDrawer
        defaultOpen
        onOpenChange={(_next, details) => {
          details.cancel()
        }}
      />
    ))

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByTestId('popup')).toBeVisible()
  })

  it('supports actionsRef.close / unmount', async () => {
    const actions: DrawerRootActions = {
      unmount: () => {},
      close: () => {},
    }

    render(() => <BasicDrawer defaultOpen actionsRef={actions} />)
    expect(screen.getByTestId('popup')).toBeVisible()

    actions.close()
    await waitFor(() => {
      expect(screen.queryByTestId('popup')).toBeNull()
    })
  })

  it('VirtualKeyboardProvider is a Lite passthrough', () => {
    render(() => (
      <Drawer.VirtualKeyboardProvider>
        <span data-testid="vk-child">ok</span>
      </Drawer.VirtualKeyboardProvider>
    ))
    expect(screen.getByTestId('vk-child')).toHaveTextContent('ok')
  })

  it('exports createHandle and opens via detached trigger with payload children', async () => {
    const handle = Drawer.createHandle<{ text: string }>()
    expect(handle).toBeInstanceOf(Drawer.Handle)

    render(() => (
      <>
        <Drawer.Trigger
          handle={handle}
          id="drawer-detached"
          payload={{ text: 'hello-drawer' }}
        >
          Detached
        </Drawer.Trigger>
        <Drawer.Root handle={handle}>
          {
            (({ payload }: { payload: { text: string } | undefined }) => (
              <Drawer.Portal>
                <Drawer.Popup data-testid="popup">
                  <Drawer.Title>Title</Drawer.Title>
                  {payload !== undefined && (
                    <Drawer.Description data-testid="payload-text">
                      {payload.text}
                    </Drawer.Description>
                  )}
                  <Drawer.Close>Close</Drawer.Close>
                </Drawer.Popup>
              </Drawer.Portal>
            )) as unknown as JSX.Element
          }
        </Drawer.Root>
      </>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Detached' }))
    await waitFor(() => {
      expect(screen.getByTestId('popup')).toBeVisible()
      expect(screen.getByTestId('payload-text')).toHaveTextContent(
        'hello-drawer'
      )
    })
  })

  it('keeps element Root children stable when a detached trigger writes payload', async () => {
    const handle = Drawer.createHandle<{ text: string }>()
    let portalMounts = 0

    function CountingPortal(props: { children: JSX.Element }) {
      portalMounts += 1
      return <Drawer.Portal>{props.children}</Drawer.Portal>
    }

    render(() => (
      <>
        <Drawer.Trigger
          handle={handle}
          id="stable-payload"
          payload={{ text: 'x' }}
        >
          Detached
        </Drawer.Trigger>
        <Drawer.Root handle={handle}>
          <CountingPortal>
            <Drawer.Popup data-testid="popup">
              <Drawer.Close>Close</Drawer.Close>
            </Drawer.Popup>
          </CountingPortal>
        </Drawer.Root>
      </>
    ))

    const mountsBefore = portalMounts
    fireEvent.click(screen.getByRole('button', { name: 'Detached' }))
    await waitFor(() => {
      expect(screen.getByTestId('popup')).toBeVisible()
    })
    // Element children must not remount Portal when payload is written.
    expect(portalMounts).toBe(mountsBefore)
  })

  it('Provider context reports active while open', async () => {
    render(() => (
      <Drawer.Provider>
        <ProviderProbe data-testid="provider" />
        <BasicDrawer />
      </Drawer.Provider>
    ))

    expect(screen.getByTestId('provider')).toHaveAttribute('data-active', 'false')
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    await waitFor(() => {
      expect(screen.getByTestId('provider')).toHaveAttribute(
        'data-active',
        'true'
      )
    })
  })
})

function BasicDrawer(props: DrawerRootProps = {}) {
  return (
    <Drawer.Root {...props}>
      <Drawer.Trigger>Open</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop data-testid="backdrop" />
        <Drawer.Viewport>
          <Drawer.Popup data-testid="popup">
            <Drawer.Title>Title</Drawer.Title>
            <Drawer.Description>Description</Drawer.Description>
            <Drawer.Close>Close</Drawer.Close>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

function DrawerStateProbe(props: { 'data-testid'?: string }) {
  const drawer = useDrawerRootContext()
  return (
    <div
      data-testid={props['data-testid']}
      data-swipe-direction={drawer.swipeDirection()}
      data-expanded={String(drawer.expanded())}
      data-swiping={String(drawer.swiping())}
    />
  )
}

function ProviderProbe(props: { 'data-testid'?: string }) {
  const provider = useDrawerProviderContext()
  return (
    <div
      data-testid={props['data-testid']}
      data-active={String(provider?.active() ?? false)}
    />
  )
}
