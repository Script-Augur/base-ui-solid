/**
 * Port of `@base-ui/react` Tabs list tests (v1.7.0).
 * Skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Tabs } from '../index'
import { flushMicrotasks, waitFor } from '../test-utils'

afterEach(() => {
  cleanup()
})

describe('<Tabs.List />', () => {
  describe('accessibility attributes', () => {
    it('sets the aria-selected attribute on the active tab (controlled)', async () => {
      function App() {
        const [value, valueAssign] = createSignal(1)
        return (
          <Tabs.Root
            value={value()}
            onValueChange={next => valueAssign(next as number)}
          >
            <Tabs.List>
              <Tabs.Trigger value={1}>Tab 1</Tabs.Trigger>
              <Tabs.Trigger value={2}>Tab 2</Tabs.Trigger>
              <Tabs.Trigger value={3}>Tab 3</Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>
        )
      }

      render(() => <App />)

      screen.getByText('Tab 2').click()
      await flushMicrotasks()

      expect(screen.getByText('Tab 2')).toHaveAttribute('aria-selected', 'true')
    })

    it('sets the aria-selected attribute on the active tab', async () => {
      const handleChange = vi.fn()
      render(() => (
        <Tabs.Root defaultValue={1} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Trigger value={1}>Tab 1</Tabs.Trigger>
            <Tabs.Trigger value={2}>Tab 2</Tabs.Trigger>
            <Tabs.Trigger value={3}>Tab 3</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      ))

      const tab1 = screen.getByText('Tab 1')
      const tab2 = screen.getByText('Tab 2')
      const tab3 = screen.getByText('Tab 3')

      expect(tab1).toHaveAttribute('aria-selected', 'true')
      expect(tab2).toHaveAttribute('aria-selected', 'false')
      expect(tab3).toHaveAttribute('aria-selected', 'false')

      tab2.click()

      expect(screen.getByText('Tab 1')).toHaveAttribute(
        'aria-selected',
        'false'
      )
      expect(screen.getByText('Tab 2')).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByText('Tab 3')).toHaveAttribute(
        'aria-selected',
        'false'
      )

      tab3.click()
      await flushMicrotasks()

      expect(screen.getByText('Tab 1')).toHaveAttribute(
        'aria-selected',
        'false'
      )
      expect(screen.getByText('Tab 2')).toHaveAttribute(
        'aria-selected',
        'false'
      )
      expect(screen.getByText('Tab 3')).toHaveAttribute('aria-selected', 'true')

      screen.getByText('Tab 1').click()
      await flushMicrotasks()

      expect(screen.getByText('Tab 1')).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByText('Tab 2')).toHaveAttribute(
        'aria-selected',
        'false'
      )
      expect(screen.getByText('Tab 3')).toHaveAttribute(
        'aria-selected',
        'false'
      )
    })
  })

  describe('prop: loopFocus', () => {
    it('does not wrap focus past the first tab when `loopFocus` is false', async () => {
      render(() => (
        <Tabs.Root value={0}>
          <Tabs.List loopFocus={false}>
            <Tabs.Trigger value={0} />
            <Tabs.Trigger value={1} />
            <Tabs.Trigger value={2} />
          </Tabs.List>
        </Tabs.Root>
      ))

      await flushMicrotasks()

      const [firstTab, , lastTab] = screen.getAllByRole('tab')
      firstTab!.focus()

      fireEvent.keyDown(firstTab!, { key: 'ArrowLeft' })
      await flushMicrotasks()

      expect(firstTab).toHaveFocus()
      expect(lastTab).not.toHaveFocus()
    })

    it('does not wrap focus past the last tab when `loopFocus` is false', async () => {
      render(() => (
        <Tabs.Root value={2}>
          <Tabs.List loopFocus={false}>
            <Tabs.Trigger value={0} />
            <Tabs.Trigger value={1} />
            <Tabs.Trigger value={2} />
          </Tabs.List>
        </Tabs.Root>
      ))

      await flushMicrotasks()

      const [firstTab, , lastTab] = screen.getAllByRole('tab')
      lastTab!.focus()

      fireEvent.keyDown(lastTab!, { key: 'ArrowRight' })
      await flushMicrotasks()

      expect(lastTab).toHaveFocus()
      expect(firstTab).not.toHaveFocus()
    })
  })

  describe('keyboard navigation', () => {
    it('moves focus to a tab disabled with the `disabled` prop', async () => {
      render(() => (
        <Tabs.Root value={0}>
          <Tabs.List>
            <Tabs.Trigger value={0} />
            <Tabs.Trigger value={1} disabled />
            <Tabs.Trigger value={2} />
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
    })

    it('skips a natively disabled tab in a single keypress', async () => {
      render(() => (
        <Tabs.Root value={0}>
          <Tabs.List>
            <Tabs.Trigger value={0} />
            <Tabs.Trigger
              value={1}
              render={(props: Record<string, unknown>) => (
                <button type="button" {...props} disabled />
              )}
            />
            <Tabs.Trigger value={2} />
          </Tabs.List>
        </Tabs.Root>
      ))

      await flushMicrotasks()

      const [firstTab] = screen.getAllByRole('tab')
      firstTab!.focus()

      fireEvent.keyDown(firstTab!, { key: 'ArrowRight' })

      await waitFor(() => {
        expect(screen.getAllByRole('tab')[2]).toHaveFocus()
      })

      fireEvent.keyDown(screen.getAllByRole('tab')[2]!, { key: 'ArrowLeft' })

      await waitFor(() => {
        expect(screen.getAllByRole('tab')[0]).toHaveFocus()
      })
    })
  })

  it('can be named via `aria-label`', () => {
    render(() => (
      <Tabs.Root defaultValue={0}>
        <Tabs.List aria-label="string label">
          <Tabs.Trigger value={0} />
        </Tabs.List>
      </Tabs.Root>
    ))

    expect(screen.getByRole('tablist')).toHaveAccessibleName('string label')
  })

  it('can be named via `aria-labelledby`', () => {
    render(() => (
      <>
        <h3 id="label-id">complex name</h3>
        <Tabs.Root defaultValue={0}>
          <Tabs.List aria-labelledby="label-id">
            <Tabs.Trigger value={0} />
          </Tabs.List>
        </Tabs.Root>
      </>
    ))

    expect(screen.getByRole('tablist')).toHaveAccessibleName('complex name')
  })
})
