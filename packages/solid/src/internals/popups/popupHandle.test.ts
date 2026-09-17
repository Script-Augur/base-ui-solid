import { describe, expect, it, vi } from 'vitest'

import {
  BasePopupHandle,
  PopupTriggerMap,
  SolidStore,
  createInitialPopupStoreState,
  popupStoreSelectors,
} from './index'

import type { PopupStoreContext, PopupStoreState } from './index'

describe('PopupTriggerMap', () => {
  it('adds, looks up, and deletes triggers by id', () => {
    const map = new PopupTriggerMap()
    const el = document.createElement('button')
    map.add('a', el)
    expect(map.getById('a')).toBe(el)
    expect(map.size).toBe(1)
    expect(map.hasElement(el)).toBe(true)
    map.delete('a')
    expect(map.getById('a')).toBeUndefined()
    expect(map.size).toBe(0)
  })
})
describe('BasePopupHandle', () => {
  it('ignores open/close while no root is attached', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const handle = new TestHandle()
    expect(handle.isOpen).toBe(false)
    handle.open()
    handle.close()
    expect(handle.isOpen).toBe(false)
    warn.mockRestore()
  })

  it('attaches a root store and opens/closes imperatively', () => {
    const handle = new TestHandle()
    const rootStore = createTestStore(false)
    const detach = handle.attachStore(rootStore)

    expect(handle.store).toBe(rootStore)
    handle.open()
    expect(rootStore.select('open')).toBe(true)
    expect(handle.isOpen).toBe(true)

    handle.close()
    expect(rootStore.select('open')).toBe(false)

    detach()
    expect(handle.store).not.toBe(rootStore)
  })

  it('opens by registered trigger id', () => {
    const handle = new TestHandle()
    const rootStore = createTestStore(false)
    handle.attachStore(rootStore)

    const trigger = document.createElement('button')
    trigger.id = 'trig-1'
    rootStore.context.triggerElements.add('trig-1', trigger)

    handle.open('trig-1')
    expect(rootStore.select('open')).toBe(true)
  })

  it('throws when anchored open cannot find a trigger', () => {
    const handle = new TestHandle()
    const rootStore = createTestStore(false)
    handle.attachStore(rootStore)
    expect(() => handle.open('missing')).toThrow(/no matching trigger/)
  })

  it('notifies subscribeStore when the active store changes', () => {
    const handle = new TestHandle()
    const rootStore = createTestStore(false)
    const listener = vi.fn()
    const unsubscribe = handle.subscribeStore(listener)

    const detach = handle.attachStore(rootStore)
    expect(listener).toHaveBeenCalledTimes(1)

    detach()
    expect(listener).toHaveBeenCalledTimes(2)
    unsubscribe()
  })
})
function createTestStore(open = false) {
  const triggerElements = new PopupTriggerMap()
  const state: TestState = {
    ...createInitialPopupStoreState(),
    open,
  }
  const context: PopupStoreContext<never> = {
    triggerElements,
    popupRef: { current: null },
    onOpenChange: undefined,
    onOpenChangeComplete: undefined,
  }
  const store = new SolidStore(state, context, popupStoreSelectors) as SolidStore<
    TestState,
    PopupStoreContext<never>,
    typeof popupStoreSelectors
  > & {
    setOpen: (next: boolean) => void
  }
  store.setOpen = (next: boolean) => {
    store.set('open', next)
  }
  return store
}
class TestHandle extends BasePopupHandle<
  ReturnType<typeof createTestStore>,
  ReturnType<typeof createTestStore>
> {
  constructor() {
    super(createTestStore(false), 'Test', true)
  }

  open(triggerId?: string | null) {
    this.openByTrigger(triggerId)
  }

  close() {
    this.closePopup()
  }

  get isOpen() {
    return this.attachedStore?.select('open') ?? false
  }
}
type TestState = PopupStoreState<unknown> & { open: boolean }
