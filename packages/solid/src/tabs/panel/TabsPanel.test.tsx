/**
 * Port of `@base-ui/react` Tabs panel tests (v1.7.0).
 * Skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { Show, createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Tabs } from '../index'
import { waitFor } from '../test-utils'

afterEach(() => {
  cleanup()
})

describe('<Tabs.Panel />', () => {
  it('throws a descriptive error when rendered outside <Tabs.Root>', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      expect(() => render(() => <Tabs.Panel value="1" keepMounted />)).toThrow(
        'Base UI: Tabs parts must be placed within <Tabs.Root>.'
      )
    } finally {
      errorSpy.mockRestore()
    }
  })

  describe('panels sharing a value', () => {
    it('keeps the surviving registration when a shadowed panel unmounts', async () => {
      function App() {
        const [shadowedMounted, shadowedMountedAssign] = createSignal(true)

        return (
          <>
            <button type="button" onClick={() => shadowedMountedAssign(false)}>
              unmount shadowed
            </button>
            <Tabs.Root value="a">
              <Tabs.List>
                <Tabs.Trigger value="a">A</Tabs.Trigger>
                <Tabs.Trigger value="b">B</Tabs.Trigger>
              </Tabs.List>
              <Show when={shadowedMounted()}>
                <Tabs.Panel value="b" keepMounted data-testid="shadowed" />
              </Show>
              <Tabs.Panel value="b" keepMounted data-testid="owner" />
            </Tabs.Root>
          </>
        )
      }

      render(() => <App />)

      await waitFor(() => {
        const tabB = screen.getAllByRole('tab')[1]
        const owner = screen.getByTestId('owner')
        expect(tabB).toHaveAttribute('aria-controls', owner.id)
      })

      const tabB = screen.getAllByRole('tab')[1]
      const owner = screen.getByTestId('owner')

      fireEvent.click(screen.getByRole('button', { name: 'unmount shadowed' }))

      expect(screen.queryByTestId('shadowed')).toBe(null)

      await waitFor(() => {
        expect(tabB).toHaveAttribute('aria-controls', owner.id)
      })
    })
  })
})
