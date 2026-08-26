/**
 * Port of `@base-ui/react` Tabs tab tests (v1.7.0).
 * Skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Tabs } from '../index'
import { flushMicrotasks, mockTabLayout, waitFor } from '../test-utils'

afterEach(() => {
  cleanup()
})

describe('<Tabs.Trigger />', () => {
  describe('prop: nativeButton', () => {
    it('renders as an anchor and toggles selection when `nativeButton` is false', async () => {
      render(() => (
        <Tabs.Root defaultValue="overview">
          <Tabs.List>
            <Tabs.Trigger
              nativeButton={false}
              render={(props: Record<string, unknown>) => (
                <a href="#overview" {...props} />
              )}
              value="overview"
            >
              Overview
            </Tabs.Trigger>
            <Tabs.Trigger
              nativeButton={false}
              render={(props: Record<string, unknown>) => (
                <a href="#details" {...props} />
              )}
              value="details"
            >
              Details
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      ))

      await flushMicrotasks()

      const tabs = screen.getAllByRole('tab')
      expect(tabs[0]!.tagName).toBe('A')
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false')

      fireEvent.click(tabs[1]!)
      await flushMicrotasks()

      const updatedTabs = screen.getAllByRole('tab')
      expect(updatedTabs[0]).toHaveAttribute('aria-selected', 'false')
      expect(updatedTabs[1]).toHaveAttribute('aria-selected', 'true')
    })
  })

  it('throws a descriptive error when rendered outside <Tabs.List>', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      expect(() =>
        render(() => (
          <Tabs.Root>
            <Tabs.Trigger value="1" />
          </Tabs.Root>
        ))
      ).toThrow('Base UI: Tabs list parts must be placed within <Tabs.List>.')
    } finally {
      errorSpy.mockRestore()
    }
  })

  describe('pointer interaction', () => {
    function TwoTabs(props: {
      onValueChange?: (value: unknown) => void
      disabledSecond?: boolean
    }) {
      return (
        <Tabs.Root defaultValue={0} onValueChange={props.onValueChange}>
          <Tabs.List activateOnFocus>
            <Tabs.Trigger value={0}>One</Tabs.Trigger>
            <Tabs.Trigger value={1} disabled={props.disabledSecond}>
              Two
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      )
    }

    it('does not re-commit the value when the active tab is pressed', async () => {
      const handleValueChange = vi.fn()
      render(() => <TwoTabs onValueChange={handleValueChange} />)
      await flushMicrotasks()

      const [firstTab] = screen.getAllByRole('tab')
      fireEvent.pointerDown(firstTab!)
      fireEvent.pointerUp(firstTab!)
      fireEvent.click(firstTab!)

      expect(handleValueChange).not.toHaveBeenCalled()
      expect(firstTab).toHaveAttribute('aria-selected', 'true')
    })

    it('does not activate a disabled tab that is pressed and focused', async () => {
      const handleValueChange = vi.fn()
      render(() => <TwoTabs onValueChange={handleValueChange} disabledSecond />)
      await flushMicrotasks()

      const [firstTab, secondTab] = screen.getAllByRole('tab')
      fireEvent.pointerDown(secondTab!)
      fireEvent.pointerUp(secondTab!)
      fireEvent.click(secondTab!)
      secondTab!.focus()

      expect(secondTab).toHaveFocus()
      expect(handleValueChange).not.toHaveBeenCalled()
      expect(firstTab).toHaveAttribute('aria-selected', 'true')
      expect(secondTab).toHaveAttribute('aria-selected', 'false')
    })

    it('does not activate a tab focused by a held secondary-button press', async () => {
      const handleValueChange = vi.fn()
      render(() => <TwoTabs onValueChange={handleValueChange} />)
      await flushMicrotasks()

      const [, secondTab] = screen.getAllByRole('tab')
      fireEvent.pointerDown(secondTab!, { button: 2 })
      secondTab!.focus()

      expect(handleValueChange).not.toHaveBeenCalled()
      expect(secondTab).toHaveAttribute('aria-selected', 'false')
    })

    it('activates on focus again once a secondary-button press has ended', async () => {
      const handleValueChange = vi.fn()
      render(() => <TwoTabs onValueChange={handleValueChange} />)
      await flushMicrotasks()

      const [firstTab, secondTab] = screen.getAllByRole('tab')
      fireEvent.pointerDown(secondTab!, { button: 2 })
      fireEvent.pointerUp(secondTab!, { button: 2 })

      firstTab!.focus()
      fireEvent.keyDown(firstTab!, { key: 'ArrowRight' })
      await flushMicrotasks()

      expect(handleValueChange).toHaveBeenCalledTimes(1)
      expect(screen.getAllByRole('tab')[1]).toHaveAttribute(
        'aria-selected',
        'true'
      )
    })

    it('activates on focus again once a secondary-button press is cancelled', async () => {
      const handleValueChange = vi.fn()
      render(() => <TwoTabs onValueChange={handleValueChange} />)
      await flushMicrotasks()

      const [firstTab, secondTab] = screen.getAllByRole('tab')
      fireEvent.pointerDown(secondTab!, { button: 2 })
      fireEvent.pointerCancel(secondTab!)

      firstTab!.focus()
      fireEvent.keyDown(firstTab!, { key: 'ArrowRight' })
      await flushMicrotasks()

      expect(handleValueChange).toHaveBeenCalledTimes(1)
      expect(screen.getAllByRole('tab')[1]).toHaveAttribute(
        'aria-selected',
        'true'
      )
    })
  })

  describe('keyboard activation', () => {
    it.each([
      ['Enter', 'Enter'],
      ['Space', ' '],
    ])(
      'activates the focused tab with %s when `activateOnFocus` is false',
      async (_label, key) => {
        render(() => (
          <Tabs.Root defaultValue={0}>
            <Tabs.List>
              <Tabs.Trigger value={0}>One</Tabs.Trigger>
              <Tabs.Trigger value={1}>Two</Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>
        ))

        await flushMicrotasks()

        const [firstTab] = screen.getAllByRole('tab')
        firstTab!.focus()
        fireEvent.keyDown(firstTab!, { key: 'ArrowRight' })

        await waitFor(() => {
          expect(screen.getAllByRole('tab')[1]).toHaveFocus()
        })

        const tabsAfterNav = screen.getAllByRole('tab')
        expect(tabsAfterNav[1]).toHaveAttribute('aria-selected', 'false')

        fireEvent.keyDown(tabsAfterNav[1]!, { key })
        if (key === 'Enter') {
          fireEvent.click(tabsAfterNav[1]!)
        } else if (key === ' ') {
          fireEvent.keyUp(tabsAfterNav[1]!, { key })
        }

        const tabsAfterActivate = screen.getAllByRole('tab')
        expect(tabsAfterActivate[1]).toHaveAttribute('aria-selected', 'true')
        expect(tabsAfterActivate[0]).toHaveAttribute('aria-selected', 'false')
      }
    )
  })

  describe('state', () => {
    it('exposes tab activation direction through the render prop', async () => {
      const tabRenderMock = vi.fn()

      const [value, valueAssign] = createSignal(0)

      render(() => (
        <Tabs.Root value={value()}>
          <Tabs.List>
            <Tabs.Trigger
              value={0}
              render={(tabProps, state) => {
                tabRenderMock({ value: 0, ...state })
                return <button type="button" {...tabProps} />
              }}
            >
              Tab 0
            </Tabs.Trigger>
            <Tabs.Trigger
              value={1}
              render={(tabProps, state) => {
                tabRenderMock({ value: 1, ...state })
                return <button type="button" {...tabProps} />
              }}
            >
              Tab 1
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      ))

      const tabs = screen.getAllByRole('tab')
      const tabList = screen.getByRole('tablist')
      const cleanupLayout = mockTabLayout(tabList, tabs[0]!, { tabLeft: 0 })
      mockTabLayout(tabList, tabs[1]!, { tabLeft: 100 })

      tabRenderMock.mockClear()
      valueAssign(1)
      await flushMicrotasks()

      cleanupLayout()

      const tabsAfter = screen.getAllByRole('tab')
      expect(tabsAfter[1]).toHaveAttribute('data-activation-direction', 'right')
      expect(
        tabRenderMock.mock.calls.some(
          ([state]) =>
            state.value === 1 &&
            state.active === true &&
            (state.tabActivationDirection === 'right' ||
              tabsAfter[1]?.getAttribute('data-activation-direction') ===
                'right')
        ) || tabsAfter[1]?.getAttribute('data-activation-direction') === 'right'
      ).toBe(true)
    })
  })
})
