import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Portal } from './Portal'
import { usePortalContext } from './PortalContext'
import { resolvePortalContainer } from './resolvePortalContainer'

afterEach(() => {
  cleanup()
})

describe('Portal', () => {
  it('renders children into document.body by default', () => {
    render(() => (
      <div data-testid="app-root">
        <Portal>
          <span data-testid="portaled">hello</span>
        </Portal>
      </div>
    ))

    const portaled = screen.getByTestId('portaled')
    expect(portaled).toBeVisible()
    expect(portaled.parentElement?.getAttribute('data-base-ui-portal')).toBe('')
    expect(document.body.contains(portaled)).toBe(true)
    expect(screen.getByTestId('app-root').contains(portaled)).toBe(false)
  })

  it('renders into a custom container', () => {
    const container = document.createElement('div')
    container.dataset.testid = 'custom-container'
    document.body.append(container)

    try {
      render(() => (
        <Portal container={container}>
          <span data-testid="portaled">custom</span>
        </Portal>
      ))

      const portaled = screen.getByTestId('portaled')
      expect(container.contains(portaled)).toBe(true)
      expect(portaled.parentElement?.parentElement).toBe(container)
    } finally {
      container.remove()
    }
  })

  it('renders nothing while container is explicitly null', () => {
    render(() => (
      <Portal container={null}>
        <span data-testid="portaled">hidden</span>
      </Portal>
    ))

    expect(screen.queryByTestId('portaled')).toBeNull()
  })

  it('mounts when container becomes available', () => {
    const [container, containerAssign] = createSignal<HTMLElement | null>(null)
    const host = document.createElement('div')
    document.body.append(host)

    try {
      render(() => (
        <Portal container={container}>
          <span data-testid="portaled">deferred</span>
        </Portal>
      ))

      expect(screen.queryByTestId('portaled')).toBeNull()

      containerAssign(host)
      expect(screen.getByTestId('portaled')).toBeVisible()
      expect(host.contains(screen.getByTestId('portaled'))).toBe(true)
    } finally {
      host.remove()
    }
  })

  it('does not fall through to document.body for invalid containers', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      render(() => (
        <Portal container={() => ({}) as unknown as HTMLElement}>
          <span data-testid="portaled">invalid</span>
        </Portal>
      ))

      expect(screen.queryByTestId('portaled')).toBeNull()
      expect(document.body.querySelector('[data-base-ui-portal]')).toBeNull()
      expect(warn).toHaveBeenCalled()
    } finally {
      warn.mockRestore()
    }
  })

  it('nests into the parent portal host by default', () => {
    render(() => (
      <Portal>
        <div data-testid="outer">
          <Portal>
            <span data-testid="nested">nested</span>
          </Portal>
        </div>
      </Portal>
    ))

    const outer = screen.getByTestId('outer')
    const nested = screen.getByTestId('nested')
    const outerHost = outer.parentElement
    expect(outerHost?.getAttribute('data-base-ui-portal')).toBe('')
    expect(outerHost?.contains(nested)).toBe(true)
    // Nested portal remounts under the parent host, not under the outer div.
    expect(outer.contains(nested)).toBe(false)
  })

  it('exposes portal context to children', () => {
    function Reader() {
      const ctx = usePortalContext()
      return <span data-testid="ctx-id">{ctx?.portalNode()?.id ?? ''}</span>
    }

    const hostRef: { current: HTMLDivElement | null } = { current: null }
    render(() => (
      <Portal
        ref={el => {
          hostRef.current = el
        }}
      >
        <Reader />
      </Portal>
    ))

    expect(screen.getByTestId('ctx-id').textContent).toBe(
      hostRef.current?.id ?? ''
    )
  })

  it('forwards ref to the portal host', () => {
    const hostRef: { current: HTMLDivElement | null } = { current: null }

    render(() => (
      <Portal
        ref={el => {
          hostRef.current = el
        }}
      >
        <span data-testid="portaled">ref</span>
      </Portal>
    ))

    expect(hostRef.current).toBeInstanceOf(HTMLDivElement)
    expect(hostRef.current?.getAttribute('data-base-ui-portal')).toBe('')
    expect(hostRef.current?.contains(screen.getByTestId('portaled'))).toBe(true)
  })

  it('removes the portal host on unmount', () => {
    const { unmount } = render(() => (
      <Portal data-testid="portal-host">
        <span data-testid="portaled">bye</span>
      </Portal>
    ))

    expect(document.querySelector('[data-base-ui-portal]')).not.toBeNull()
    unmount()
    expect(document.querySelector('[data-base-ui-portal]')).toBeNull()
    expect(screen.queryByTestId('portaled')).toBeNull()
  })

  it('removes host attributes that disappear from props', () => {
    const [attrs, attrsAssign] = createSignal<{
      'data-x'?: string
      'aria-label'?: string
    }>({
      'data-x': '1',
      'aria-label': 'portal',
    })

    const hostRef: { current: HTMLDivElement | null } = { current: null }
    render(() => (
      <Portal
        ref={el => {
          hostRef.current = el
        }}
        {...attrs()}
      >
        <span data-testid="portaled">attrs</span>
      </Portal>
    ))

    expect(hostRef.current?.getAttribute('data-x')).toBe('1')
    expect(hostRef.current?.getAttribute('aria-label')).toBe('portal')

    attrsAssign({ 'aria-label': 'updated' })
    expect(hostRef.current?.getAttribute('data-x')).toBeNull()
    expect(hostRef.current?.getAttribute('aria-label')).toBe('updated')
  })

  it('wires host event handlers from element props', () => {
    const onClick = vi.fn()
    const hostRef: { current: HTMLDivElement | null } = { current: null }

    render(() => (
      <Portal
        ref={el => {
          hostRef.current = el
        }}
        onClick={onClick}
      >
        <span data-testid="portaled">click</span>
      </Portal>
    ))

    fireEvent.click(hostRef.current!)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('applies class and style to the portal host', () => {
    const hostRef: { current: HTMLDivElement | null } = { current: null }

    render(() => (
      <Portal
        ref={el => {
          hostRef.current = el
        }}
        class="portal-host"
        style={{ color: 'red' }}
      >
        <span data-testid="portaled">styled</span>
      </Portal>
    ))

    expect(hostRef.current?.className).toBe('portal-host')
    expect(hostRef.current?.style.color).toBe('red')
  })
})

describe('resolvePortalContainer', () => {
  it('returns null for invalid non-null container values', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      expect(
        resolvePortalContainer({} as unknown as HTMLElement, null)
      ).toBeNull()
      expect(
        resolvePortalContainer(() => ({}) as unknown as HTMLElement, null)
      ).toBeNull()
      expect(warn).toHaveBeenCalled()
    } finally {
      warn.mockRestore()
    }
  })

  it('still defaults to document.body when container is omitted', () => {
    expect(resolvePortalContainer(undefined, null)).toBe(document.body)
  })
})
