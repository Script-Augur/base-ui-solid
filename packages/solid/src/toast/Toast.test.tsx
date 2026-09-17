import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@solidjs/testing-library'
import { createSignal, onMount } from 'solid-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createToastManager } from './createToastManager'
import { ToastStore, selectors } from './store'
import { useToastManager } from './useToastManager'
import { List } from './utils/test-utils'

import { Toast } from './index'

import type { ToastObject } from './types'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})
describe('ToastStore', () => {
  it('keeps toast metadata synchronized after mutations', () => {
    const store = createStore([
      { id: 'newest', height: 30 },
      { id: 'middle', height: 40 },
      { id: 'oldest', height: 50 },
    ])

    expect(selectors.toastIndex(store.state, 'middle')).toBe(1)
    expect(selectors.toastOffsetY(store.state, 'middle')).toBe(30)

    store.closeToast('middle')
    expect(selectors.toast(store.state, 'middle')?.transitionStatus).toBe(
      'ending'
    )
    expect(selectors.toastVisibleIndex(store.state, 'middle')).toBe(-1)

    store.removeToast('middle', true)
    expect(selectors.toast(store.state, 'middle')).toBe(undefined)
  })

  it('ignores height recalculations while a toast is transitioning out', () => {
    const store = createStore([{ id: 'a', height: 40 }])
    store.closeToast('a')
    store.updateToastInternal('a', {
      height: 80,
      transitionStatus: undefined,
    })
    const toast = selectors.toast(store.state, 'a')
    expect(toast?.transitionStatus).toBe('ending')
    expect(toast?.height).toBe(0)
  })

  it('close() without id closes all toasts', () => {
    const onCloseA = vi.fn()
    const onCloseB = vi.fn()
    const store = createStore([
      { id: 'a', onClose: onCloseA },
      { id: 'b', onClose: onCloseB },
    ])

    store.closeToast()
    expect(store.state.toasts.every(t => t.transitionStatus === 'ending')).toBe(
      true
    )
    expect(onCloseA).toHaveBeenCalledTimes(1)
    expect(onCloseB).toHaveBeenCalledTimes(1)
  })

  it('applies limited flags when over limit', () => {
    const store = createStore([])
    store.syncProviderProps(0, 1)
    store.addToast({ id: 'first', title: 'First', timeout: 0 })
    store.addToast({ id: 'second', title: 'Second', timeout: 0 })

    expect(selectors.toast(store.state, 'second')?.limited).toBe(false)
    expect(selectors.toast(store.state, 'first')?.limited).toBe(true)
  })

  it('bumps updateKey on update and upsert', () => {
    const store = createStore([])
    store.addToast({ id: 'a', title: 'A', timeout: 0 })
    expect(selectors.toast(store.state, 'a')?.updateKey).toBe(0)

    store.updateToast('a', { title: 'B' })
    expect(selectors.toast(store.state, 'a')?.updateKey).toBe(1)
    expect(selectors.toast(store.state, 'a')?.title).toBe('B')

    store.addToast({ id: 'a', title: 'C', timeout: 0 })
    expect(selectors.toast(store.state, 'a')?.updateKey).toBe(2)
    expect(selectors.toast(store.state, 'a')?.title).toBe('C')
  })
})
describe('Toast.Provider / useToastManager', () => {
  let frames: Array<FrameRequestCallback>
  let now: number

  beforeEach(() => {
    frames = []
    now = 0
    vi.useFakeTimers({ toFake: ['performance', 'requestAnimationFrame'] })
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      frames.push(cb)
      return frames.length
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      frames[id - 1] = () => undefined
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function advance(ms: number) {
    now += ms
    let guard = 0
    while (frames.length > 0 && guard < 50) {
      guard += 1
      const pending = frames.splice(0, frames.length)
      for (const frame of pending) {
        frame(now)
      }
    }
  }

  it('adds and auto-dismisses a toast after default timeout', async () => {
    function AddButton() {
      const { add } = useToastManager()
      return (
        <button
          type="button"
          onClick={() => {
            add({ title: 'test' })
          }}
        >
          add
        </button>
      )
    }

    render(() => (
      <Toast.Provider>
        <Toast.Viewport>
          <List />
        </Toast.Viewport>
        <AddButton />
      </Toast.Provider>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'add' }))
    expect(screen.getByTestId('root')).toBeTruthy()

    advance(5000)
    await waitFor(() => {
      expect(screen.queryByTestId('root')).toBeNull()
    })
  })

  it('close without id closes all via manager', async () => {
    function Controls() {
      const { add, close } = useToastManager()
      return (
        <>
          <button
            type="button"
            onClick={() => {
              add({ id: 'a', title: 'A', timeout: 0 })
              add({ id: 'b', title: 'B', timeout: 0 })
            }}
          >
            add
          </button>
          <button type="button" onClick={() => close()}>
            close-all
          </button>
        </>
      )
    }

    render(() => (
      <Toast.Provider>
        <Toast.Viewport>
          <List />
        </Toast.Viewport>
        <Controls />
      </Toast.Provider>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'add' }))
    expect(screen.getAllByTestId('root')).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'close-all' }))
    await waitFor(() => {
      expect(screen.queryByTestId('root')).toBeNull()
    })
  })

  it('respects limit by marking older toasts limited', async () => {
    function AddTwo() {
      const { add, toasts } = useToastManager()
      return (
        <>
          <button
            type="button"
            onClick={() => {
              add({ id: 'first', title: 'First', timeout: 0 })
              add({ id: 'second', title: 'Second', timeout: 0 })
            }}
          >
            add
          </button>
          <span data-testid="limited">
            {toasts()
              .map(t => `${t.id}:${String(t.limited)}`)
              .join(',')}
          </span>
        </>
      )
    }

    render(() => (
      <Toast.Provider limit={1}>
        <Toast.Viewport>
          <List />
        </Toast.Viewport>
        <AddTwo />
      </Toast.Provider>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'add' }))
    await waitFor(() => {
      expect(screen.getByTestId('limited').textContent).toContain(
        'second:false'
      )
      expect(screen.getByTestId('limited').textContent).toContain('first:true')
    })
  })

  it('promise toast transitions loading → success', async () => {
    function PromiseButton() {
      const { promise, toasts } = useToastManager()
      return (
        <>
          <button
            type="button"
            onClick={() => {
              void promise(Promise.resolve('ok'), {
                loading: 'Loading…',
                success: result => `Done: ${result}`,
                error: 'Failed',
              })
            }}
          >
            run
          </button>
          <span data-testid="types">
            {toasts()
              .map(t => t.type)
              .join(',')}
          </span>
        </>
      )
    }

    render(() => (
      <Toast.Provider timeout={0}>
        <Toast.Viewport>
          <List />
        </Toast.Viewport>
        <PromiseButton />
      </Toast.Provider>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'run' }))
    expect(screen.getByTestId('types').textContent).toBe('loading')

    await waitFor(() => {
      expect(screen.getByTestId('types').textContent).toBe('success')
    })
    expect(screen.getByTestId('description').textContent).toBe('Done: ok')
  })
})
describe('Toast.Viewport expand', () => {
  it('sets data-expanded on hover', () => {
    function Seed() {
      const { add } = useToastManager()
      onMount(() => {
        add({ title: 'Hello', timeout: 0 })
      })
      return null
    }

    render(() => (
      <Toast.Provider>
        <Toast.Viewport data-testid="viewport">
          <List />
          <Seed />
        </Toast.Viewport>
      </Toast.Provider>
    ))

    const viewport = screen.getByTestId('viewport')
    expect(viewport.getAttribute('data-expanded')).toBeNull()

    fireEvent.mouseEnter(viewport)
    expect(viewport.getAttribute('data-expanded')).toBe('')
  })
})
describe('Toast.Root Close / Title / Description', () => {
  it('Close button dismisses the toast', async () => {
    function Seed() {
      const { add } = useToastManager()
      onMount(() => {
        add({ title: 'Closable', description: 'Body', timeout: 0 })
      })
      return null
    }

    render(() => (
      <Toast.Provider>
        <Toast.Viewport>
          <List />
          <Seed />
        </Toast.Viewport>
      </Toast.Provider>
    ))

    await waitFor(() => {
      expect(screen.getByTestId('root')).toBeTruthy()
    })
    fireEvent.click(screen.getByTestId('close'))
    await waitFor(() => {
      expect(screen.queryByTestId('root')).toBeNull()
    })
  })

  it('wires title and description ids onto the root', async () => {
    function Seed() {
      const { add } = useToastManager()
      onMount(() => {
        add({ title: 'T', description: 'D', timeout: 0 })
      })
      return null
    }

    render(() => (
      <Toast.Provider>
        <Toast.Viewport>
          <List />
          <Seed />
        </Toast.Viewport>
      </Toast.Provider>
    ))

    await waitFor(() => {
      expect(screen.getByTestId('root')).toBeTruthy()
    })
    const root = screen.getByTestId('root')
    const title = screen.getByTestId('title')
    const description = screen.getByTestId('description')
    expect(root.getAttribute('aria-labelledby')).toBe(title.id)
    expect(root.getAttribute('aria-describedby')).toBe(description.id)
  })
})
describe('createToastManager bridge', () => {
  it('routes add/close/update through a subscribed Provider', async () => {
    const manager = createToastManager()

    function Observer() {
      const { toasts } = useToastManager()
      return (
        <span data-testid="titles">
          {toasts()
            .map(t => String(t.title))
            .join(',')}
        </span>
      )
    }

    render(() => (
      <Toast.Provider toastManager={manager} timeout={0}>
        <Toast.Viewport>
          <List />
        </Toast.Viewport>
        <Observer />
      </Toast.Provider>
    ))

    const id = manager.add({ title: 'From manager' })
    await waitFor(() => {
      expect(screen.getByTestId('titles').textContent).toBe('From manager')
    })

    manager.update(id, { title: 'Updated' })
    await waitFor(() => {
      expect(screen.getByTestId('titles').textContent).toBe('Updated')
    })

    manager.close(id)
    await waitFor(() => {
      expect(screen.queryByTestId('root')).toBeNull()
    })
  })
})
describe('select reactivity', () => {
  it('exposes reactive accessors via store.select', () => {
    const store = createStore([])
    const toasts = store.select('toasts')
    const [seen, seenAssign] = createSignal(0)

    // Simulate a tracking consumer
    const count = () => {
      seenAssign(toasts().length)
      return toasts().length
    }

    expect(count()).toBe(0)
    store.addToast({ id: 'x', title: 'X', timeout: 0 })
    expect(count()).toBe(1)
    expect(seen()).toBe(1)
  })
})
function createStore(toasts: Array<ToastObject<object>> = []) {
  return new ToastStore({
    toasts: toasts.map(toast => ({ updateKey: 0, ...toast })),
    timeout: 0,
    limit: 3,
    hovering: false,
    focused: false,
    isWindowFocused: true,
    viewport: null,
    prevFocusElement: null,
  })
}
