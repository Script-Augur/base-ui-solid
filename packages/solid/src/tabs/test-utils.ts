import { vi } from 'vitest'

/**
 * Flushes microtasks and a macrotask so Solid effects and jsdom layout settle.
 *
 * @returns A promise that resolves after the queues drain.
 */
export async function flushMicrotasks(): Promise<void> {
  await Promise.resolve()
  await new Promise<void>(resolve => queueMicrotask(resolve))
  await new Promise<void>(resolve => setTimeout(resolve, 0))
}

/**
 * Retries `assertion` until it succeeds or `timeout` elapses.
 *
 * @param assertion - Callback that throws until the condition holds.
 * @param options - Polling timeout and interval.
 * @returns A promise that resolves when the assertion passes.
 */
export async function waitFor(
  assertion: () => void | Promise<void>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const timeout = options.timeout ?? 1000
  const interval = options.interval ?? 10
  const start = Date.now()

  while (Date.now() - start < timeout) {
    try {
      await assertion()
      return
    } catch {
      await new Promise(resolve => setTimeout(resolve, interval))
    }
  }

  await assertion()
}

/**
 * Mocks layout APIs so indicator / activation-direction tests run in jsdom.
 *
 * @param tabList - List element to stub geometry on.
 * @param activeTab - Active tab element to stub geometry on.
 * @param options - Pixel offsets and sizes (defaults match a typical bar).
 * @returns Restore function that undoes spies and property overrides.
 */
export function mockTabLayout(
  tabList: HTMLElement,
  activeTab: HTMLElement,
  options: {
    tabLeft?: number
    tabTop?: number
    tabWidth?: number
    tabHeight?: number
    listLeft?: number
    listTop?: number
    listWidth?: number
    listHeight?: number
  } = {}
): () => void {
  const tabLeft = options.tabLeft ?? 100
  const tabTop = options.tabTop ?? 0
  const tabWidth = options.tabWidth ?? 80
  const tabHeight = options.tabHeight ?? 32
  const listLeft = options.listLeft ?? 0
  const listTop = options.listTop ?? 0
  const listWidth = options.listWidth ?? 300
  const listHeight = options.listHeight ?? 40

  const tabRect = {
    left: listLeft + tabLeft,
    top: listTop + tabTop,
    right: listLeft + tabLeft + tabWidth,
    bottom: listTop + tabTop + tabHeight,
    width: tabWidth,
    height: tabHeight,
    x: listLeft + tabLeft,
    y: listTop + tabTop,
    toJSON: () => ({}),
  }

  const listRect = {
    left: listLeft,
    top: listTop,
    right: listLeft + listWidth,
    bottom: listTop + listHeight,
    width: listWidth,
    height: listHeight,
    x: listLeft,
    y: listTop,
    toJSON: () => ({}),
  }

  const tabGetBoundingClientRect = vi.spyOn(activeTab, 'getBoundingClientRect')
  tabGetBoundingClientRect.mockReturnValue(tabRect)

  const listGetBoundingClientRect = vi.spyOn(tabList, 'getBoundingClientRect')
  listGetBoundingClientRect.mockReturnValue(listRect)

  Object.defineProperty(activeTab, 'offsetWidth', {
    configurable: true,
    value: tabWidth,
  })
  Object.defineProperty(activeTab, 'offsetHeight', {
    configurable: true,
    value: tabHeight,
  })
  Object.defineProperty(activeTab, 'offsetLeft', {
    configurable: true,
    value: tabLeft,
  })
  Object.defineProperty(activeTab, 'offsetTop', {
    configurable: true,
    value: tabTop,
  })

  Object.defineProperty(tabList, 'offsetWidth', {
    configurable: true,
    value: listWidth,
  })
  Object.defineProperty(tabList, 'offsetHeight', {
    configurable: true,
    value: listHeight,
  })
  Object.defineProperty(tabList, 'scrollWidth', {
    configurable: true,
    value: listWidth,
  })
  Object.defineProperty(tabList, 'scrollHeight', {
    configurable: true,
    value: listHeight,
  })
  Object.defineProperty(tabList, 'scrollLeft', {
    configurable: true,
    writable: true,
    value: 0,
  })
  Object.defineProperty(tabList, 'scrollTop', {
    configurable: true,
    writable: true,
    value: 0,
  })
  Object.defineProperty(tabList, 'clientLeft', {
    configurable: true,
    value: 0,
  })
  Object.defineProperty(tabList, 'clientTop', {
    configurable: true,
    value: 0,
  })

  const tabComputedStyle = window.getComputedStyle(activeTab)
  const listComputedStyle = window.getComputedStyle(tabList)
  const tabGetComputedStyle = vi
    .spyOn(window, 'getComputedStyle')
    .mockImplementation(element => {
      if (element === activeTab) {
        return {
          ...tabComputedStyle,
          width: `${tabWidth}px`,
          height: `${tabHeight}px`,
        }
      }
      if (element === tabList) {
        return {
          ...listComputedStyle,
          width: `${listWidth}px`,
          height: `${listHeight}px`,
        }
      }
      return tabComputedStyle
    })

  return () => {
    tabGetBoundingClientRect.mockRestore()
    listGetBoundingClientRect.mockRestore()
    tabGetComputedStyle.mockRestore()
  }
}
