/**
 * Port of `@base-ui/react` Tabs indicator tests (v1.7.0).
 * Skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, render, screen } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'

import { Tabs } from '../index'
import { waitFor } from '../test-utils'

import type { TabsIndicatorState } from './TabsIndicator'

afterEach(() => {
  cleanup()
})

describe('<Tabs.Indicator />', () => {
  it('exposes null active tab state when the selected value has no matching tab', async () => {
    const indicatorStates: Array<TabsIndicatorState> = []

    render(() => (
      <Tabs.Root value="missing">
        <Tabs.List>
          <Tabs.Trigger value="one">One</Tabs.Trigger>
          <Tabs.Indicator
            render={(props, state) => {
              indicatorStates.push({ ...state })
              return <span data-testid="bubble" {...props} />
            }}
          />
        </Tabs.List>
      </Tabs.Root>
    ))

    await waitFor(() => {
      expect(indicatorStates.length).toBeGreaterThan(0)
    })

    const state = indicatorStates.at(-1)!
    expect(state.activeTabPosition).toBe(null)
    expect(state.activeTabSize).toBe(null)
    expect(screen.getByTestId('bubble')).toHaveAttribute('hidden')
  })

  it('should not render when no tab is active', () => {
    render(() => (
      <Tabs.Root value={null}>
        <Tabs.List>
          <Tabs.Indicator data-testid="bubble" />
        </Tabs.List>
      </Tabs.Root>
    ))

    expect(screen.queryByTestId('bubble')).toBe(null)
  })

  it.skip('should set CSS variables corresponding to the active tab', () => {
    // Chromium layout; skipped in jsdom like upstream `describe.skipIf(isJSDOM)`.
  })
})
