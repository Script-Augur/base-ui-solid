import { cleanup, render, screen } from '@solidjs/testing-library'
import { createSignal, mergeProps } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'

import { createRender } from './createRender'

afterEach(() => {
  cleanup()
})
describe('createRender', () => {
  it('renders the default element with static props', () => {
    render(() =>
      createRender({
        defaultElement: 'div',
        props: { role: 'progressbar', 'data-testid': 'host' },
      })
    )

    const host = screen.getByTestId('host')
    expect(host.tagName).toBe('DIV')
    expect(host).toHaveAttribute('role', 'progressbar')
  })

  it('updates attributes when props use reactive getters', async () => {
    const [value, valueAssign] = createSignal(10)

    render(() =>
      createRender({
        defaultElement: 'div',
        props: mergeProps({
          role: 'progressbar',
          get 'aria-valuenow'() {
            return value()
          },
        }),
      })
    )

    const host = screen.getByRole('progressbar')
    expect(host).toHaveAttribute('aria-valuenow', '10')

    valueAssign(42)
    await flushMicrotasks()
    expect(host).toHaveAttribute('aria-valuenow', '42')
  })

  it('forwards reactive getters to custom render functions', async () => {
    const [value, valueAssign] = createSignal('a')

    render(() =>
      createRender({
        defaultElement: 'div',
        state: {},
        render: (props: Record<string, unknown>) => (
          <span
            data-testid="custom"
            data-value={props['data-value'] as string}
          />
        ),
        props: mergeProps({
          get 'data-value'() {
            return value()
          },
        }),
      })
    )

    const host = screen.getByTestId('custom')
    expect(host).toHaveAttribute('data-value', 'a')

    valueAssign('b')
    await flushMicrotasks()
    expect(host).toHaveAttribute('data-value', 'b')
  })
})
async function flushMicrotasks(): Promise<void> {
  await Promise.resolve()
  await new Promise<void>(resolve => queueMicrotask(resolve))
  await new Promise<void>(resolve => setTimeout(resolve, 0))
}
