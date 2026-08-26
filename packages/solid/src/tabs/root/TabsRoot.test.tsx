/**
 * Port of `@base-ui/react` Tabs root tests (v1.7.0).
 * Skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@solidjs/testing-library'
import { Show, createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { REASONS } from '../../internals/createChangeEventDetails'
import { DirectionProvider } from '../../internals/direction'
import { Tabs } from '../index'
import { flushMicrotasks, mockTabLayout, waitFor } from '../test-utils'

import type { Orientation } from '../../separator/Separator'
import type { TabsRootChangeEventDetails, TabsValue } from '../index'

afterEach(() => {
  cleanup()
})

describe('<Tabs.Root />', () => {
  describe('prop: children', () => {
    it('should accept a null child', () => {
      render(() => (
        <Tabs.Root value={0}>
          {null}
          <Tabs.List>
            <Tabs.Trigger value={1} />
          </Tabs.List>
        </Tabs.Root>
      ))

      expect(screen.getAllByRole('tab')).toHaveLength(1)
    })

    it('should support empty children', () => {
      render(() => <Tabs.Root value={1} />)
    })

    it('puts the selected child in tab order', async () => {
      const [value, valueAssign] = createSignal(1)
      render(() => (
        <Tabs.Root value={value()}>
          <Tabs.List>
            <Tabs.Trigger value={0} />
            <Tabs.Trigger value={1} />
          </Tabs.List>
        </Tabs.Root>
      ))

      expect(screen.getAllByRole('tab').map(tab => tab.tabIndex)).toEqual([
        -1, 0,
      ])

      valueAssign(0)
      await flushMicrotasks()

      expect(screen.getAllByRole('tab').map(tab => tab.tabIndex)).toEqual([
        0, -1,
      ])
    })

    it('sets the aria-labelledby attribute on tab panels to the corresponding tab id', () => {
      render(() => (
        <Tabs.Root defaultValue="tab-0">
          <Tabs.List>
            <Tabs.Trigger value="tab-0" />
            <Tabs.Trigger value="tab-1" id="explicit-tab-id-1" />
            <Tabs.Trigger value="tab-2" />
            <Tabs.Trigger value="tab-3" id="explicit-tab-id-3" />
          </Tabs.List>
          <Tabs.Panel value="tab-1" keepMounted />
          <Tabs.Panel value="tab-0" keepMounted />
          <Tabs.Panel value="tab-2" keepMounted />
          <Tabs.Panel value="tab-3" keepMounted />
        </Tabs.Root>
      ))

      const tabs = screen.getAllByRole('tab')
      const tabPanels = screen.getAllByRole('tabpanel', { hidden: true })

      expect(tabPanels[0]).toHaveAttribute('aria-labelledby', tabs[1]!.id)
      expect(tabPanels[1]).toHaveAttribute('aria-labelledby', tabs[0]!.id)
      expect(tabPanels[2]).toHaveAttribute('aria-labelledby', tabs[2]!.id)
      expect(tabPanels[3]).toHaveAttribute('aria-labelledby', tabs[3]!.id)
    })

    it('sets the aria-controls attribute on tabs to the corresponding tab panel id', () => {
      render(() => (
        <Tabs.Root defaultValue="tab-0">
          <Tabs.List>
            <Tabs.Trigger value="tab-0" />
            <Tabs.Trigger value="tab-1" id="explicit-tab-id-1" />
            <Tabs.Trigger value="tab-2" />
            <Tabs.Trigger value="tab-3" id="explicit-tab-id-3" />
          </Tabs.List>
          <Tabs.Panel value="tab-1" keepMounted />
          <Tabs.Panel value="tab-0" keepMounted />
          <Tabs.Panel value="tab-2" keepMounted />
          <Tabs.Panel value="tab-3" keepMounted />
        </Tabs.Root>
      ))

      const tabs = screen.getAllByRole('tab')
      const tabPanels = screen.getAllByRole('tabpanel', { hidden: true })

      expect(tabs[0]).toHaveAttribute('aria-controls', tabPanels[1]!.id)
      expect(tabs[1]).toHaveAttribute('aria-controls', tabPanels[0]!.id)
      expect(tabs[2]).toHaveAttribute('aria-controls', tabPanels[2]!.id)
      expect(tabs[3]).toHaveAttribute('aria-controls', tabPanels[3]!.id)
    })

    it('sets aria-controls on the first tab when no value is provided', () => {
      render(() => (
        <Tabs.Root>
          <Tabs.List>
            <Tabs.Trigger value={0} />
            <Tabs.Trigger value={1} />
          </Tabs.List>
          <Tabs.Panel value={0} keepMounted />
          <Tabs.Panel value={1} keepMounted />
        </Tabs.Root>
      ))

      const tabs = screen.getAllByRole('tab')
      const tabPanels = screen.getAllByRole('tabpanel', { hidden: true })

      expect(tabs[0]).toHaveAttribute('aria-controls', tabPanels[0]!.id)
      expect(tabs[1]).toHaveAttribute('aria-controls', tabPanels[1]!.id)
      expect(tabPanels[0]).toHaveAttribute('aria-labelledby', tabs[0]!.id)
      expect(tabPanels[1]).toHaveAttribute('aria-labelledby', tabs[1]!.id)
    })

    it('syncs aria-controls to the mounted tab panel when keepMounted is false', async () => {
      render(() => (
        <Tabs.Root defaultValue="tab-0">
          <Tabs.List>
            <Tabs.Trigger value="tab-0">Tab 0</Tabs.Trigger>
            <Tabs.Trigger value="tab-1">Tab 1</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Panel value="tab-0">Panel 0</Tabs.Panel>
          <Tabs.Panel value="tab-1">Panel 1</Tabs.Panel>
        </Tabs.Root>
      ))

      const tabs = screen.getAllByRole('tab')
      const [firstTabPanel] = screen.getAllByRole('tabpanel')

      expect(tabs[0]).toHaveAttribute('aria-controls', firstTabPanel!.id)
      expect(tabs[1]).not.toHaveAttribute('aria-controls')

      fireEvent.click(tabs[1]!)
      await flushMicrotasks()

      await waitFor(() => {
        const currentTabs = screen.getAllByRole('tab')
        const [secondTabPanel] = screen.getAllByRole('tabpanel')
        expect(secondTabPanel).toHaveTextContent('Panel 1')
        expect(currentTabs[1]).toHaveAttribute(
          'aria-controls',
          secondTabPanel!.id
        )
      })
    })

    it.skip('cleans and replaces panel registrations in Strict Mode', async () => {
      // React Strict Mode double-mount; Solid has no equivalent harness.
      const [panel, panelAssign] = createSignal({
        id: 'panel-a',
        mounted: true,
        value: 'a',
      })

      render(() => (
        <>
          <button
            type="button"
            onClick={() =>
              panelAssign({ id: 'panel-b', mounted: true, value: 'b' })
            }
          >
            replace
          </button>
          <button
            type="button"
            onClick={() =>
              panelAssign(current => ({ ...current, mounted: false }))
            }
          >
            unmount
          </button>
          <button
            type="button"
            onClick={() =>
              panelAssign({ id: 'panel-c', mounted: true, value: 'b' })
            }
          >
            remount
          </button>
          <Tabs.Root value="a">
            <Tabs.List>
              <Tabs.Trigger value="a">A</Tabs.Trigger>
              <Tabs.Trigger value="b">B</Tabs.Trigger>
            </Tabs.List>
            <Show when={panel().mounted ? panel() : false} keyed>
              {item => <Tabs.Panel value={item.value} keepMounted />}
            </Show>
          </Tabs.Root>
        </>
      ))

      const [tabA, tabB] = screen.getAllByRole('tab')

      expect(tabA).toHaveAttribute(
        'aria-controls',
        screen.getByRole('tabpanel', { hidden: true }).id
      )
      expect(tabB).not.toHaveAttribute('aria-controls')

      fireEvent.click(screen.getByRole('button', { name: 'replace' }))
      await waitFor(() => {
        expect(tabA).not.toHaveAttribute('aria-controls')
        expect(tabB).toHaveAttribute(
          'aria-controls',
          screen.getByRole('tabpanel', { hidden: true }).id
        )
      })

      fireEvent.click(screen.getByRole('button', { name: 'unmount' }))
      await flushMicrotasks()
      expect(tabA).not.toHaveAttribute('aria-controls')
      expect(tabB).not.toHaveAttribute('aria-controls')

      fireEvent.click(screen.getByRole('button', { name: 'remount' }))
      await flushMicrotasks()
      expect(tabA).not.toHaveAttribute('aria-controls')
      expect(tabB).toHaveAttribute(
        'aria-controls',
        screen.getByRole('tabpanel', { hidden: true }).id
      )
    })
  })

  describe('prop: value', () => {
    it('should pass selected prop to children', () => {
      render(() => (
        <Tabs.Root value={1}>
          <Tabs.List>
            <Tabs.Trigger value={0} />
            <Tabs.Trigger value={1} />
          </Tabs.List>
        </Tabs.Root>
      ))
      const tabElements = screen.getAllByRole('tab')
      expect(tabElements[0]).toHaveAttribute('aria-selected', 'false')
      expect(tabElements[1]).toHaveAttribute('aria-selected', 'true')
    })

    it('should support values of different types', async () => {
      const tabValues = [0, '1', 2]

      function App() {
        return (
          <Tabs.Root>
            <Tabs.List>
              {tabValues.map(value => (
                <Tabs.Trigger value={value} />
              ))}
            </Tabs.List>
            {tabValues.map(value => (
              <Tabs.Panel value={value} keepMounted />
            ))}
          </Tabs.Root>
        )
      }

      render(() => <App />)

      const tabElements = screen.getAllByRole('tab')
      const tabPanelElements = screen.getAllByRole('tabpanel', { hidden: true })

      for (let index = 0; index < tabValues.length; index += 1) {
        expect(tabPanelElements[index]).toHaveAttribute(
          'aria-labelledby',
          tabElements[index]!.id
        )
        fireEvent.click(tabElements[index]!)
        await flushMicrotasks()
        expect(tabPanelElements[index]!.hidden).toBe(false)
      }
    })
  })

  describe('disabled tabs', () => {
    it('should select the second tab when the first one is disabled', () => {
      render(() => (
        <Tabs.Root>
          <Tabs.List>
            <Tabs.Trigger value={0} disabled>
              Disabled tab
            </Tabs.Trigger>
            <Tabs.Trigger value={1}>Enabled tab</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Panel value={0} keepMounted>
            Disabled panel
          </Tabs.Panel>
          <Tabs.Panel value={1} keepMounted>
            Enabled panel
          </Tabs.Panel>
        </Tabs.Root>
      ))

      const [disabledTab, enabledTab] = screen.getAllByRole('tab')
      const [disabledPanel, enabledPanel] = screen.getAllByRole('tabpanel', {
        hidden: true,
      })

      expect(disabledTab).toHaveAttribute('aria-selected', 'false')
      expect(enabledTab).toHaveAttribute('aria-selected', 'true')
      expect(disabledPanel).toHaveAttribute('hidden')
      expect(enabledPanel).not.toHaveAttribute('hidden')
      expect(enabledPanel).toHaveTextContent('Enabled panel')
    })

    it('should select the third tab when first two tabs are disabled', () => {
      render(() => (
        <Tabs.Root>
          <Tabs.List>
            <Tabs.Trigger value={0} disabled>
              Tab 0
            </Tabs.Trigger>
            <Tabs.Trigger value={1} disabled>
              Tab 1
            </Tabs.Trigger>
            <Tabs.Trigger value={2}>Tab 2</Tabs.Trigger>
            <Tabs.Trigger value={3}>Tab 3</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Panel value={0}>Panel 0</Tabs.Panel>
          <Tabs.Panel value={1}>Panel 1</Tabs.Panel>
          <Tabs.Panel value={2}>Panel 2</Tabs.Panel>
          <Tabs.Panel value={3}>Panel 3</Tabs.Panel>
        </Tabs.Root>
      ))

      const tabs = screen.getAllByRole('tab')
      expect(tabs[2]).toHaveAttribute('aria-selected', 'true')
      expect(tabs[0]).toHaveAttribute('aria-selected', 'false')
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false')
      expect(tabs[3]).toHaveAttribute('aria-selected', 'false')
    })

    it('should still honor explicit defaultValue even if it points to a disabled tab', () => {
      render(() => (
        <Tabs.Root defaultValue={0}>
          <Tabs.List>
            <Tabs.Trigger value={0} disabled>
              Tab 0
            </Tabs.Trigger>
            <Tabs.Trigger value={1}>Tab 1</Tabs.Trigger>
            <Tabs.Trigger value={2}>Tab 2</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      ))

      const tabs = screen.getAllByRole('tab')
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false')
      expect(tabs[2]).toHaveAttribute('aria-selected', 'false')
    })

    it('continues honoring an initially disabled explicit defaultValue after defaultValue changes', async () => {
      const [defaultValue, defaultValueAssign] = createSignal<TabsValue>(0)
      render(() => (
        <Tabs.Root defaultValue={defaultValue()}>
          <Tabs.List>
            <Tabs.Trigger value={0} disabled>
              Tab 0
            </Tabs.Trigger>
            <Tabs.Trigger value={1}>Tab 1</Tabs.Trigger>
            <Tabs.Trigger value={2}>Tab 2</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      ))

      const tabs = screen.getAllByRole('tab')
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true')

      defaultValueAssign(1)
      await flushMicrotasks()

      expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false')
      expect(tabs[2]).toHaveAttribute('aria-selected', 'false')
    })

    it('should still honor explicit value prop even if it points to a disabled tab', () => {
      render(() => (
        <Tabs.Root value={0}>
          <Tabs.List>
            <Tabs.Trigger value={0} disabled>
              Tab 0
            </Tabs.Trigger>
            <Tabs.Trigger value={1}>Tab 1</Tabs.Trigger>
            <Tabs.Trigger value={2}>Tab 2</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      ))

      const tabs = screen.getAllByRole('tab')
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false')
      expect(tabs[2]).toHaveAttribute('aria-selected', 'false')
    })

    it('does not set tabIndex=0 on disabled tabs when they are programmatically selected', async () => {
      const [value, valueAssign] = createSignal(1)
      render(() => (
        <Tabs.Root value={value()}>
          <Tabs.List>
            <Tabs.Trigger value={0} disabled>
              Tab 0
            </Tabs.Trigger>
            <Tabs.Trigger value={1}>Tab 1</Tabs.Trigger>
            <Tabs.Trigger value={2}>Tab 2</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      ))

      const tabs = screen.getAllByRole('tab')
      expect(tabs[1]).toHaveAttribute('tabindex', '0')
      expect(tabs[0]).toHaveAttribute('tabindex', '-1')
      expect(tabs[2]).toHaveAttribute('tabindex', '-1')

      valueAssign(0)
      await flushMicrotasks()

      expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
      expect(tabs[0]).toHaveAttribute('tabindex', '-1')
      expect(tabs[1]).toHaveAttribute('tabindex', '0')
    })

    it('does not select any tab when all tabs are disabled', () => {
      render(() => (
        <Tabs.Root>
          <Tabs.List>
            <Tabs.Trigger value={0} disabled>
              Tab 0
            </Tabs.Trigger>
            <Tabs.Trigger value={1} disabled>
              Tab 1
            </Tabs.Trigger>
            <Tabs.Trigger value={2} disabled>
              Tab 2
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Panel value={0} keepMounted>
            Panel 0
          </Tabs.Panel>
          <Tabs.Panel value={1} keepMounted>
            Panel 1
          </Tabs.Panel>
          <Tabs.Panel value={2} keepMounted>
            Panel 2
          </Tabs.Panel>
        </Tabs.Root>
      ))

      const tabs = screen.getAllByRole('tab')
      const panels = screen.getAllByRole('tabpanel', { hidden: true })

      expect(tabs[0]).toHaveAttribute('aria-selected', 'false')
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false')
      expect(tabs[2]).toHaveAttribute('aria-selected', 'false')
      expect(panels[0]).toHaveAttribute('hidden')
      expect(panels[1]).toHaveAttribute('hidden')
      expect(panels[2]).toHaveAttribute('hidden')
    })
  })

  describe('prop: onValueChange', () => {
    it.skip('when `activateOnFocus = true` should call onValueChange on pointerdown', () => {
      // jsdom does not dispatch Solid `on:` pointerdown/mousedown the way user-event does in Chromium.
      const handleChange = vi.fn()
      const handlePointerDown = vi.fn()
      render(() => (
        <Tabs.Root value={0} onValueChange={handleChange}>
          <Tabs.List activateOnFocus>
            <Tabs.Trigger value={0} />
            <Tabs.Trigger value={1} onPointerDown={handlePointerDown} />
          </Tabs.List>
        </Tabs.Root>
      ))

      fireEvent.mouseDown(screen.getAllByRole('tab')[1]!, { button: 0 })
      expect(handleChange.mock.calls.length).toBe(1)
      expect(handlePointerDown.mock.calls.length).toBe(1)
    })

    it('should not call onValueChange on non-main button clicks', () => {
      const handleChange = vi.fn()
      render(() => (
        <Tabs.Root value={0} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Trigger value={0} />
            <Tabs.Trigger value={1} />
          </Tabs.List>
        </Tabs.Root>
      ))

      fireEvent.click(screen.getAllByRole('tab')[1]!, { button: 2 })
      expect(handleChange.mock.calls.length).toBe(0)
    })

    it('should not call onValueChange when already active', () => {
      const handleChange = vi.fn()
      render(() => (
        <Tabs.Root value={0} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Trigger value={0} />
            <Tabs.Trigger value={1} />
          </Tabs.List>
        </Tabs.Root>
      ))

      fireEvent.click(screen.getAllByRole('tab')[0]!)
      expect(handleChange.mock.calls.length).toBe(0)
    })

    it('when `activateOnFocus = true` should call onValueChange if an unactive tab gets focused', async () => {
      const handleChange = vi.fn()
      render(() => (
        <Tabs.Root value={0} onValueChange={handleChange}>
          <Tabs.List activateOnFocus>
            <Tabs.Trigger value={0} />
            <Tabs.Trigger value={1} />
          </Tabs.List>
        </Tabs.Root>
      ))

      const [firstTab] = screen.getAllByRole('tab')
      firstTab!.focus()
      fireEvent.keyDown(firstTab!, { key: 'ArrowRight' })
      await flushMicrotasks()

      expect(handleChange.mock.calls.length).toBe(1)
      expect(handleChange.mock.calls[0]![0]).toBe(1)
    })

    it('when `activateOnFocus = false` should not call onValueChange if an unactive tab gets focused', () => {
      const handleChange = vi.fn()
      render(() => (
        <Tabs.Root value={1} onValueChange={handleChange}>
          <Tabs.List activateOnFocus={false}>
            <Tabs.Trigger value={0} />
            <Tabs.Trigger value={1} />
          </Tabs.List>
        </Tabs.Root>
      ))

      screen.getAllByRole('tab')[0]!.focus()
      expect(handleChange.mock.calls.length).toBe(0)
    })

    it('calls onValueChange when auto-selecting the first tab on mount', () => {
      const handleChange = vi.fn()
      render(() => (
        <Tabs.Root onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Trigger value={0}>Tab 0</Tabs.Trigger>
            <Tabs.Trigger value={1}>Tab 1</Tabs.Trigger>
            <Tabs.Trigger value={2}>Tab 2</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      ))

      expect(handleChange.mock.calls.length).toBe(1)
      expect(handleChange.mock.calls[0]![0]).toBe(0)
      expect(handleChange.mock.calls[0]![1].reason).toBe(REASONS.initial)
      expect(handleChange.mock.calls[0]![1].activationDirection).toBe('none')
      expect(screen.getAllByRole('tab')[0]).toHaveAttribute(
        'aria-selected',
        'true'
      )
    })

    it('calls onValueChange with the selected value when the implicit default matches a later tab', () => {
      const handleChange = vi.fn()
      render(() => (
        <Tabs.Root onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Trigger value={1}>Tab 1</Tabs.Trigger>
            <Tabs.Trigger value={0}>Tab 0</Tabs.Trigger>
            <Tabs.Trigger value={2}>Tab 2</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      ))

      expect(handleChange.mock.calls.length).toBe(1)
      expect(handleChange.mock.calls[0]![0]).toBe(0)
      expect(handleChange.mock.calls[0]![1].reason).toBe(REASONS.initial)
      const tabs = screen.getAllByRole('tab')
      expect(tabs[0]).toHaveAttribute('aria-selected', 'false')
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
    })

    it('calls onValueChange when the implicit first tab is disabled', () => {
      const handleChange = vi.fn()
      render(() => (
        <Tabs.Root onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Trigger value={0} disabled>
              Tab 0
            </Tabs.Trigger>
            <Tabs.Trigger value={1}>Tab 1</Tabs.Trigger>
            <Tabs.Trigger value={2}>Tab 2</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      ))

      expect(handleChange.mock.calls.length).toBe(1)
      expect(handleChange.mock.calls[0]![0]).toBe(1)
      expect(handleChange.mock.calls[0]![1].reason).toBe(REASONS.initial)
      expect(handleChange.mock.calls[0]![1].activationDirection).toBe('none')
      expect(screen.getAllByRole('tab')[1]).toHaveAttribute(
        'aria-selected',
        'true'
      )
    })

    it('does not cancel automatic value changes', () => {
      const handleChange = vi.fn(
        (_value: TabsValue, eventDetails: TabsRootChangeEventDetails) => {
          eventDetails.cancel()
        }
      )

      render(() => (
        <Tabs.Root onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Trigger value={0} disabled>
              Tab 0
            </Tabs.Trigger>
            <Tabs.Trigger value={1}>Tab 1</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      ))

      expect(handleChange.mock.calls.length).toBe(1)
      expect(handleChange.mock.calls[0]![0]).toBe(1)
      expect(handleChange.mock.calls[0]![1].reason).toBe(REASONS.initial)
      expect(handleChange.mock.calls[0]![1].event).toBeInstanceOf(Event)
      expect(handleChange.mock.calls[0]![1].event?.type).toBe('base-ui')
      expect(handleChange.mock.calls[0]![1].trigger).toBe(undefined)
      expect(handleChange.mock.calls[0]![1].activationDirection).toBe('none')

      const tabs = screen.getAllByRole('tab')
      expect(tabs[0]).toHaveAttribute('aria-selected', 'false')
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
    })

    it('does not move an uncontrolled selection when a user-initiated change is canceled', () => {
      const handleChange = vi.fn(
        (_value: TabsValue, eventDetails: TabsRootChangeEventDetails) => {
          if (eventDetails.reason === REASONS.none) {
            eventDetails.cancel()
          }
        }
      )

      render(() => (
        <Tabs.Root defaultValue={0} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Trigger value={0}>Tab 0</Tabs.Trigger>
            <Tabs.Trigger value={1}>Tab 1</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      ))

      const tabs = screen.getAllByRole('tab')
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true')

      fireEvent.click(tabs[1]!)

      expect(handleChange).toHaveBeenCalledTimes(1)
      expect(handleChange.mock.calls[0]![1].reason).toBe(REASONS.none)
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false')
    })

    it('calls onValueChange with null when all tabs are initially disabled', () => {
      const handleChange = vi.fn()
      render(() => (
        <Tabs.Root onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Trigger value={0} disabled>
              Tab 0
            </Tabs.Trigger>
            <Tabs.Trigger value={1} disabled>
              Tab 1
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      ))

      expect(handleChange.mock.calls.length).toBe(1)
      expect(handleChange.mock.calls[0]![0]).toBe(null)
      expect(handleChange.mock.calls[0]![1].reason).toBe(REASONS.initial)
      expect(handleChange.mock.calls[0]![1].activationDirection).toBe('none')
    })

    it('does not emit missing when an enabled tab appears after all tabs were disabled', async () => {
      const handleChange = vi.fn()
      const [enableSecond, enableSecondAssign] = createSignal(false)

      render(() => (
        <Tabs.Root onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Trigger value={0} disabled>
              Tab 0
            </Tabs.Trigger>
            <Tabs.Trigger value={1} disabled={!enableSecond()}>
              Tab 1
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      ))

      expect(handleChange.mock.calls.length).toBe(1)
      expect(handleChange.mock.calls[0]![0]).toBe(null)
      expect(handleChange.mock.calls[0]![1].reason).toBe(REASONS.initial)

      enableSecondAssign(true)
      await flushMicrotasks()

      expect(handleChange.mock.calls.length).toBe(1)
      const tabs = screen.getAllByRole('tab')
      expect(tabs[0]).toHaveAttribute('aria-selected', 'false')
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false')
    })

    it('does not call onValueChange on initial render when defaultValue is provided', () => {
      const handleChange = vi.fn()
      render(() => (
        <Tabs.Root defaultValue={1} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Trigger value={0}>Tab 0</Tabs.Trigger>
            <Tabs.Trigger value={1}>Tab 1</Tabs.Trigger>
            <Tabs.Trigger value={2}>Tab 2</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      ))

      expect(handleChange.mock.calls.length).toBe(0)
      expect(screen.getAllByRole('tab')[1]).toHaveAttribute(
        'aria-selected',
        'true'
      )
    })

    it('does not call onValueChange on initial render when defaultValue is null', () => {
      const handleChange = vi.fn()
      render(() => (
        <Tabs.Root defaultValue={null} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Trigger value={0}>Tab 0</Tabs.Trigger>
            <Tabs.Trigger value={1}>Tab 1</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      ))

      expect(handleChange.mock.calls.length).toBe(0)
      const tabs = screen.getAllByRole('tab')
      expect(tabs[0]).toHaveAttribute('aria-selected', 'false')
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false')
    })

    it('treats defaultValue={undefined} as an implicit default when the first tab is disabled', () => {
      const handleChange = vi.fn()
      render(() => (
        <Tabs.Root defaultValue={undefined} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Trigger value={0} disabled>
              Tab 0
            </Tabs.Trigger>
            <Tabs.Trigger value={1}>Tab 1</Tabs.Trigger>
            <Tabs.Trigger value={2}>Tab 2</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      ))

      expect(handleChange.mock.calls.length).toBe(1)
      expect(handleChange.mock.calls[0]![0]).toBe(1)
      expect(handleChange.mock.calls[0]![1].reason).toBe(REASONS.initial)
    })

    it('calls onValueChange when the selected tab becomes disabled', async () => {
      const handleChange = vi.fn()
      const [disableFirst, disableFirstAssign] = createSignal(false)

      render(() => (
        <Tabs.Root defaultValue={0} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Trigger value={0} disabled={disableFirst()}>
              Tab 0
            </Tabs.Trigger>
            <Tabs.Trigger value={1}>Tab 1</Tabs.Trigger>
            <Tabs.Trigger value={2}>Tab 2</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      ))

      disableFirstAssign(true)

      await waitFor(() => {
        expect(handleChange.mock.calls.length).toBe(1)
        expect(handleChange.mock.calls[0]![0]).toBe(1)
        expect(handleChange.mock.calls[0]![1].reason).toBe(REASONS.disabled)
        expect(handleChange.mock.calls[0]![1].activationDirection).toBe('none')
      })
    })

    it('calls onValueChange when an explicit disabled default becomes disabled again', async () => {
      const handleChange = vi.fn()
      const [disableFirst, disableFirstAssign] = createSignal(true)

      render(() => (
        <Tabs.Root defaultValue={0} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Trigger value={0} disabled={disableFirst()}>
              Tab 0
            </Tabs.Trigger>
            <Tabs.Trigger value={1}>Tab 1</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      ))

      expect(handleChange.mock.calls.length).toBe(0)
      expect(screen.getAllByRole('tab')[0]).toHaveAttribute(
        'aria-selected',
        'true'
      )

      disableFirstAssign(false)
      await flushMicrotasks()
      expect(handleChange.mock.calls.length).toBe(0)

      disableFirstAssign(true)
      await waitFor(() => {
        expect(handleChange.mock.calls.length).toBe(1)
        expect(handleChange.mock.calls[0]![0]).toBe(1)
        expect(handleChange.mock.calls[0]![1].reason).toBe(REASONS.disabled)
      })
    })

    it('calls onValueChange when the selected tab becomes disabled with keepMounted panels', async () => {
      const handleChange = vi.fn()
      const [disableFirst, disableFirstAssign] = createSignal(false)

      render(() => (
        <Tabs.Root defaultValue={0} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Trigger value={0} disabled={disableFirst()}>
              Tab 0
            </Tabs.Trigger>
            <Tabs.Trigger value={1}>Tab 1</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Panel value={0} keepMounted>
            Panel 0
          </Tabs.Panel>
          <Tabs.Panel value={1} keepMounted>
            Panel 1
          </Tabs.Panel>
        </Tabs.Root>
      ))

      disableFirstAssign(true)

      await waitFor(() => {
        expect(handleChange.mock.calls.length).toBe(1)
        expect(handleChange.mock.calls[0]![0]).toBe(1)
        expect(handleChange.mock.calls[0]![1].reason).toBe(REASONS.disabled)
      })

      const panels = screen.getAllByRole('tabpanel', { hidden: true })
      expect(panels[0]).toHaveAttribute('hidden')
      expect(panels[1]).not.toHaveAttribute('hidden')
    })

    it('calls onValueChange when the selected tab is removed', async () => {
      const handleChange = vi.fn()
      const [showFirstTab, showFirstTabAssign] = createSignal(true)

      render(() => (
        <Tabs.Root defaultValue={0} onValueChange={handleChange}>
          <Tabs.List>
            <Show when={showFirstTab()}>
              <Tabs.Trigger value={0}>Tab 0</Tabs.Trigger>
            </Show>
            <Tabs.Trigger value={1}>Tab 1</Tabs.Trigger>
            <Tabs.Trigger value={2}>Tab 2</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      ))

      showFirstTabAssign(false)

      await waitFor(() => {
        expect(handleChange.mock.calls.length).toBe(1)
        expect(handleChange.mock.calls[0]![0]).toBe(1)
        expect(handleChange.mock.calls[0]![1].reason).toBe(REASONS.missing)
      })

      const tabs = screen.getAllByRole('tab')
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
      expect(tabs[0]).toHaveTextContent('Tab 1')
    })

    it('calls onValueChange with null when the selected tab is removed and no tabs remain', async () => {
      const handleChange = vi.fn()
      const [showTab, showTabAssign] = createSignal(true)

      render(() => (
        <Tabs.Root defaultValue={0} onValueChange={handleChange}>
          <Tabs.List>
            <Show when={showTab()}>
              <Tabs.Trigger value={0}>Tab 0</Tabs.Trigger>
            </Show>
          </Tabs.List>
          <Tabs.Panel value={0} keepMounted>
            Panel 0
          </Tabs.Panel>
        </Tabs.Root>
      ))

      expect(screen.getByRole('tabpanel')).not.toHaveAttribute('hidden')
      showTabAssign(false)

      await waitFor(() => {
        expect(handleChange.mock.calls.length).toBe(1)
        expect(handleChange.mock.calls[0]![0]).toBe(null)
        expect(handleChange.mock.calls[0]![1].reason).toBe(REASONS.missing)
      })

      expect(screen.queryAllByRole('tab').length).toBe(0)
      expect(screen.getByRole('tabpanel', { hidden: true })).toHaveAttribute(
        'hidden'
      )
    })

    it('calls onValueChange when an explicit defaultValue points at a tab that is never present', async () => {
      const handleChange = vi.fn()
      render(() => (
        <Tabs.Root defaultValue={0} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Trigger value={1}>Tab 1</Tabs.Trigger>
            <Tabs.Trigger value={2}>Tab 2</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      ))

      await waitFor(() => {
        expect(handleChange.mock.calls.length).toBe(1)
        expect(handleChange.mock.calls[0]![0]).toBe(1)
        expect(handleChange.mock.calls[0]![1].reason).toBe(REASONS.missing)
      })
    })

    it('does not emit a second change when the fallback resolves to the current value', () => {
      const handleValueChange = vi.fn()
      render(() => (
        <Tabs.Root onValueChange={handleValueChange}>
          <Tabs.List>
            <Tabs.Trigger value="a" disabled>
              Stale duplicate
            </Tabs.Trigger>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      ))

      expect(handleValueChange).toHaveBeenCalledTimes(1)
      expect(handleValueChange.mock.calls[0]![0]).toBe('a')
      expect(handleValueChange.mock.calls[0]![1].reason).toBe(REASONS.initial)
    })

    it('does not call onValueChange when a controlled selected tab becomes disabled', async () => {
      const handleChange = vi.fn()
      const [disableFirst, disableFirstAssign] = createSignal(false)

      render(() => (
        <Tabs.Root value={0} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Trigger value={0} disabled={disableFirst()}>
              Tab 0
            </Tabs.Trigger>
            <Tabs.Trigger value={1}>Tab 1</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      ))

      disableFirstAssign(true)
      await flushMicrotasks()

      expect(handleChange.mock.calls.length).toBe(0)
      expect(screen.getAllByRole('tab')[0]).toHaveAttribute(
        'aria-selected',
        'true'
      )
    })

    it('does not call onValueChange when a controlled selected tab is removed', async () => {
      const handleChange = vi.fn()
      const [showFirstTab, showFirstTabAssign] = createSignal(true)

      render(() => (
        <Tabs.Root value={0} onValueChange={handleChange}>
          <Tabs.List>
            <Show when={showFirstTab()}>
              <Tabs.Trigger value={0}>Tab 0</Tabs.Trigger>
            </Show>
            <Tabs.Trigger value={1}>Tab 1</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      ))

      showFirstTabAssign(false)
      await flushMicrotasks()

      expect(handleChange.mock.calls.length).toBe(0)
      expect(screen.getAllByRole('tab')[0]).toHaveAttribute(
        'aria-selected',
        'false'
      )
    })
  })

  describe('prop: orientation', () => {
    it('does not add aria-orientation by default', () => {
      render(() => (
        <Tabs.Root value={0}>
          <Tabs.List>
            <Tabs.Root />
          </Tabs.List>
        </Tabs.Root>
      ))

      expect(screen.getByRole('tablist')).not.toHaveAttribute(
        'aria-orientation'
      )
    })

    it('adds the proper aria-orientation when vertical', () => {
      render(() => (
        <Tabs.Root value={0} orientation="vertical">
          <Tabs.List>
            <Tabs.Root />
          </Tabs.List>
        </Tabs.Root>
      ))

      expect(screen.getByRole('tablist')).toHaveAttribute(
        'aria-orientation',
        'vertical'
      )
    })
  })

  describe('pointer navigation', () => {
    it('selects the clicked tab', () => {
      render(() => (
        <Tabs.Root defaultValue={0}>
          <Tabs.List activateOnFocus={false}>
            <Tabs.Trigger value={0}>Tab 1</Tabs.Trigger>
            <Tabs.Trigger value={1}>Tab 2</Tabs.Trigger>
            <Tabs.Trigger value={2}>Tab 3</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Panel value={0} keepMounted>
            Panel 1
          </Tabs.Panel>
          <Tabs.Panel value={1} keepMounted>
            Panel 2
          </Tabs.Panel>
          <Tabs.Panel value={2} keepMounted>
            Panel 3
          </Tabs.Panel>
        </Tabs.Root>
      ))

      fireEvent.click(screen.getByRole('tab', { name: 'Tab 2' }))
      const panels = screen.getAllByRole('tabpanel', { hidden: true })
      expect(panels[0]).toHaveAttribute('hidden')
      expect(panels[1]).not.toHaveAttribute('hidden')
      expect(panels[2]).toHaveAttribute('hidden')
    })

    it('does not select the clicked disabled tab', () => {
      render(() => (
        <Tabs.Root defaultValue={0}>
          <Tabs.List activateOnFocus={false}>
            <Tabs.Trigger value={0}>Tab 1</Tabs.Trigger>
            <Tabs.Trigger disabled value={1}>
              Tab 2
            </Tabs.Trigger>
            <Tabs.Trigger value={2}>Tab 3</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Panel value={0} keepMounted>
            Panel 1
          </Tabs.Panel>
          <Tabs.Panel value={1} keepMounted>
            Panel 2
          </Tabs.Panel>
          <Tabs.Panel value={2} keepMounted>
            Panel 3
          </Tabs.Panel>
        </Tabs.Root>
      ))

      fireEvent.click(screen.getByRole('tab', { name: 'Tab 2' }))
      const panels = screen.getAllByRole('tabpanel', { hidden: true })
      expect(panels[0]).not.toHaveAttribute('hidden')
      expect(panels[1]).toHaveAttribute('hidden')
      expect(panels[2]).toHaveAttribute('hidden')
    })
  })

  describe('keyboard navigation when focus is on a tab', () => {
    ;(
      [
        ['horizontal', 'ltr', 'ArrowLeft', 'ArrowRight'],
        ['vertical', undefined, 'ArrowUp', 'ArrowDown'],
      ] as const
    ).forEach(([orientation, direction, previousItemKey, nextItemKey]) => {
      describe(`when focus is on a tab element in a ${orientation} ${direction ?? ''} tablist`, () => {
        describe(previousItemKey, () => {
          it('moves focus to the last tab without activating it if focus is on the first tab', async () => {
            const handleChange = vi.fn()
            render(() => (
              <DirectionProvider direction={direction ?? 'ltr'}>
                <Tabs.Root
                  onValueChange={handleChange}
                  orientation={orientation}
                  value={0}
                >
                  <Tabs.List activateOnFocus={false}>
                    <Tabs.Trigger value={0} />
                    <Tabs.Trigger value={1} />
                    <Tabs.Trigger value={2} />
                  </Tabs.List>
                </Tabs.Root>
              </DirectionProvider>
            ))

            const [firstTab, , lastTab] = screen.getAllByRole('tab')
            firstTab!.focus()
            fireEvent.keyDown(firstTab!, { key: previousItemKey })
            await flushMicrotasks()

            expect(lastTab).toHaveFocus()
            expect(handleChange.mock.calls.length).toBe(0)
          })
        })

        describe(nextItemKey, () => {
          it('moves focus to the next tab while activating it', async () => {
            const handleChange = vi.fn()
            render(() => (
              <DirectionProvider direction={direction ?? 'ltr'}>
                <Tabs.Root
                  onValueChange={handleChange}
                  orientation={orientation}
                  value={0}
                >
                  <Tabs.List activateOnFocus>
                    <Tabs.Trigger value={0} />
                    <Tabs.Trigger value={1} />
                    <Tabs.Trigger value={2} />
                  </Tabs.List>
                </Tabs.Root>
              </DirectionProvider>
            ))

            const [firstTab, secondTab] = screen.getAllByRole('tab')
            firstTab!.focus()
            fireEvent.keyDown(firstTab!, { key: nextItemKey })
            await flushMicrotasks()

            expect(secondTab).toHaveFocus()
            expect(handleChange.mock.calls[0]![0]).toBe(1)
          })

          it('moves focus to a disabled tab without activating it', async () => {
            const handleChange = vi.fn()
            render(() => (
              <Tabs.Root
                onValueChange={handleChange}
                orientation={orientation}
                value={0}
              >
                <Tabs.List activateOnFocus>
                  <Tabs.Trigger value={0} />
                  <Tabs.Trigger value={1} disabled />
                  <Tabs.Trigger value={2} />
                </Tabs.List>
              </Tabs.Root>
            ))

            const [firstTab, disabledTab] = screen.getAllByRole('tab')
            firstTab!.focus()
            fireEvent.keyDown(firstTab!, { key: nextItemKey })
            await flushMicrotasks()

            expect(disabledTab).toHaveFocus()
            expect(handleChange.mock.calls.length).toBe(0)
          })
        })

        describe('modifier keys', () => {
          ;(['Shift', 'Control', 'Alt', 'Meta'] as const).forEach(
            modifierKey => {
              it(`does not move focus when modifier key: ${modifierKey} is pressed`, () => {
                const handleChange = vi.fn()
                render(() => (
                  <DirectionProvider direction={direction ?? 'ltr'}>
                    <Tabs.Root
                      onValueChange={handleChange}
                      orientation={orientation}
                      value={0}
                    >
                      <Tabs.List>
                        <Tabs.Trigger value={0} />
                        <Tabs.Trigger value={1} />
                        <Tabs.Trigger value={2} />
                      </Tabs.List>
                    </Tabs.Root>
                  </DirectionProvider>
                ))

                const [firstTab] = screen.getAllByRole('tab')
                firstTab!.focus()
                const extra =
                  modifierKey === 'Shift'
                    ? { shiftKey: true }
                    : modifierKey === 'Control'
                      ? { ctrlKey: true }
                      : modifierKey === 'Alt'
                        ? { altKey: true }
                        : { metaKey: true }

                fireEvent.keyDown(firstTab!, { key: nextItemKey, ...extra })
                expect(firstTab).toHaveFocus()
                expect(handleChange.mock.calls.length).toBe(0)
              })
            }
          )
        })
      })
    })

    describe('when focus is on a tab regardless of orientation', () => {
      it('when `activateOnFocus = false`, moves focus to the first tab without activating it', async () => {
        const handleChange = vi.fn()
        render(() => (
          <Tabs.Root onValueChange={handleChange} value={2}>
            <Tabs.List activateOnFocus={false}>
              <Tabs.Trigger value={0} />
              <Tabs.Trigger value={1} />
              <Tabs.Trigger value={2} />
            </Tabs.List>
          </Tabs.Root>
        ))

        const [firstTab, , lastTab] = screen.getAllByRole('tab')
        lastTab!.focus()
        fireEvent.keyDown(lastTab!, { key: 'Home' })
        await flushMicrotasks()
        expect(firstTab).toHaveFocus()
        expect(handleChange.mock.calls.length).toBe(0)
      })

      it('when `activateOnFocus = true`, moves focus to the first tab while activating it', async () => {
        const handleChange = vi.fn()
        render(() => (
          <Tabs.Root onValueChange={handleChange} value={2}>
            <Tabs.List activateOnFocus>
              <Tabs.Trigger value={0} />
              <Tabs.Trigger value={1} />
              <Tabs.Trigger value={2} />
            </Tabs.List>
          </Tabs.Root>
        ))

        const [firstTab, , lastTab] = screen.getAllByRole('tab')
        lastTab!.focus()
        fireEvent.keyDown(lastTab!, { key: 'Home' })
        await flushMicrotasks()
        expect(firstTab).toHaveFocus()
        expect(handleChange.mock.calls[0]![0]).toBe(0)
      })

      it('when `activateOnFocus = false`, moves focus to the last tab without activating it', async () => {
        const handleChange = vi.fn()
        render(() => (
          <Tabs.Root onValueChange={handleChange} value={0}>
            <Tabs.List activateOnFocus={false}>
              <Tabs.Trigger value={0} />
              <Tabs.Trigger value={1} />
              <Tabs.Trigger value={2} />
            </Tabs.List>
          </Tabs.Root>
        ))

        const [firstTab, , lastTab] = screen.getAllByRole('tab')
        firstTab!.focus()
        fireEvent.keyDown(firstTab!, { key: 'End' })
        await flushMicrotasks()
        expect(lastTab).toHaveFocus()
        expect(handleChange.mock.calls.length).toBe(0)
      })

      it('when `activateOnFocus = true`, moves focus to the last tab while activating it', async () => {
        const handleChange = vi.fn()
        render(() => (
          <Tabs.Root onValueChange={handleChange} value={0}>
            <Tabs.List activateOnFocus>
              <Tabs.Trigger value={0} />
              <Tabs.Trigger value={1} />
              <Tabs.Trigger value={2} />
            </Tabs.List>
          </Tabs.Root>
        ))

        const [firstTab, , lastTab] = screen.getAllByRole('tab')
        firstTab!.focus()
        fireEvent.keyDown(firstTab!, { key: 'End' })
        await flushMicrotasks()
        expect(lastTab).toHaveFocus()
        expect(handleChange.mock.calls[0]![0]).toBe(2)
      })
    })

    it('should allow to focus first tab when there are no active tabs', () => {
      render(() => (
        <Tabs.Root defaultValue={0}>
          <Tabs.List>
            <Tabs.Trigger value={0} />
            <Tabs.Trigger value={1} />
          </Tabs.List>
        </Tabs.Root>
      ))

      expect(
        screen.getAllByRole('tab').map(tab => tab.getAttribute('tabIndex'))
      ).toEqual(['0', '-1'])
    })
  })

  describe('nested tabs', () => {
    it('keeps a nested root independent from the one hosting its panel', async () => {
      render(() => (
        <Tabs.Root defaultValue="outer-1">
          <Tabs.List data-testid="outer-list">
            <Tabs.Trigger value="outer-1">Outer 1</Tabs.Trigger>
            <Tabs.Trigger value="outer-2">Outer 2</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Panel value="outer-1" data-testid="outer-panel-1">
            <Tabs.Root defaultValue="inner-1">
              <Tabs.List data-testid="inner-list">
                <Tabs.Trigger value="inner-1">Inner 1</Tabs.Trigger>
                <Tabs.Trigger value="inner-2">Inner 2</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Panel value="inner-1">Inner panel 1</Tabs.Panel>
              <Tabs.Panel value="inner-2">Inner panel 2</Tabs.Panel>
            </Tabs.Root>
          </Tabs.Panel>
          <Tabs.Panel value="outer-2">Outer panel 2</Tabs.Panel>
        </Tabs.Root>
      ))

      const [outerTab1, outerTab2] = within(
        screen.getByTestId('outer-list')
      ).getAllByRole('tab')
      const [innerTab1, innerTab2] = within(
        screen.getByTestId('inner-list')
      ).getAllByRole('tab')

      const outerPanel1 = screen.getByTestId('outer-panel-1')
      const innerPanel1 = screen.getByText('Inner panel 1')

      expect(outerTab1).toHaveAttribute('aria-controls', outerPanel1.id)
      expect(innerTab1).toHaveAttribute('aria-controls', innerPanel1.id)
      expect(innerPanel1).toHaveAttribute('aria-labelledby', innerTab1!.id)

      innerTab1!.focus()
      fireEvent.keyDown(innerTab1!, { key: 'ArrowRight' })
      await flushMicrotasks()

      expect(innerTab2).toHaveFocus()
      expect(innerTab2).toHaveAttribute('aria-selected', 'false')

      fireEvent.keyDown(innerTab2!, { key: 'Enter' })
      fireEvent.click(innerTab2!)

      expect(innerTab2).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByText('Inner panel 2')).not.toHaveAttribute('hidden')
      expect(outerTab1).toHaveAttribute('aria-selected', 'true')
      expect(outerTab2).toHaveAttribute('aria-selected', 'false')

      fireEvent.click(outerTab2!)
      expect(screen.queryByTestId('inner-list')).toBe(null)
      expect(screen.getByText('Outer panel 2')).not.toHaveAttribute('hidden')
    })
  })

  describe('highlight synchronization on external value change relative to focus', () => {
    it.each([true, false])(
      'keeps controlled async activation and focus aligned with activateOnFocus=%s',
      async activateOnFocus => {
        const onValueChange = vi.fn()
        const [value, valueAssign] = createSignal(0)

        render(() => (
          <Tabs.Root
            value={value()}
            onValueChange={nextValue => {
              onValueChange(nextValue)
              Promise.resolve().then(() => valueAssign(nextValue as number))
            }}
          >
            <Tabs.List activateOnFocus={activateOnFocus}>
              <Tabs.Trigger value={0}>First</Tabs.Trigger>
              <Tabs.Trigger value={1} disabled>
                Disabled
              </Tabs.Trigger>
              <Tabs.Trigger value={2}>Third</Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>
        ))

        const [firstTab, disabledTab, thirdTab] = screen.getAllByRole('tab')
        firstTab!.focus()
        fireEvent.keyDown(firstTab!, { key: 'ArrowRight' })
        expect(disabledTab).toHaveFocus()
        expect(firstTab).toHaveAttribute('aria-selected', 'true')

        fireEvent.keyDown(disabledTab!, { key: 'ArrowRight' })
        expect(thirdTab).toHaveFocus()

        if (!activateOnFocus) {
          expect(onValueChange).not.toHaveBeenCalled()
          fireEvent.keyDown(thirdTab!, { key: 'Enter' })
          fireEvent.click(thirdTab!)
        }

        await waitFor(() =>
          expect(thirdTab).toHaveAttribute('aria-selected', 'true')
        )
        expect(thirdTab).toHaveFocus()
        expect(onValueChange).toHaveBeenCalledWith(2)
      }
    )

    it('when focus is outside the tablist, highlight follows the new active tab (tabIndex=0 moves)', async () => {
      const [value, valueAssign] = createSignal(0)
      render(() => (
        <Tabs.Root value={value()}>
          <Tabs.List activateOnFocus={false}>
            <Tabs.Trigger value={0} />
            <Tabs.Trigger value={1} />
            <Tabs.Trigger value={2} />
          </Tabs.List>
        </Tabs.Root>
      ))

      const [firstTab, secondTab, thirdTab] = screen.getAllByRole('tab')
      expect(firstTab!.tabIndex).toBe(0)

      valueAssign(2)
      await flushMicrotasks()

      expect(firstTab!.tabIndex).toBe(-1)
      expect(secondTab!.tabIndex).toBe(-1)
      expect(thirdTab!.tabIndex).toBe(0)

      valueAssign(1)
      await flushMicrotasks()

      expect(firstTab!.tabIndex).toBe(-1)
      expect(secondTab!.tabIndex).toBe(0)
      expect(thirdTab!.tabIndex).toBe(-1)
    })

    it('when focus is inside the tablist, highlight stays put on external change and arrow keys continue from the focused tab', async () => {
      const [value, valueAssign] = createSignal(0)
      render(() => (
        <Tabs.Root value={value()}>
          <Tabs.List activateOnFocus={false}>
            <Tabs.Trigger value={0}>Tab 1</Tabs.Trigger>
            <Tabs.Trigger value={1}>Tab 2</Tabs.Trigger>
            <Tabs.Trigger value={2}>Tab 3</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      ))

      const [firstTab, secondTab, thirdTab] = screen.getAllByRole('tab')
      firstTab!.focus()
      expect(firstTab).toHaveProperty('tabIndex', 0)

      valueAssign(2)
      await flushMicrotasks()

      expect(firstTab).toHaveFocus()
      fireEvent.keyDown(firstTab!, { key: 'ArrowRight' })
      await flushMicrotasks()
      expect(secondTab).toHaveFocus()
      expect(thirdTab!.tabIndex).toBe(-1)
    })
  })

  describe('activation direction (jsdom layout mocks)', () => {
    it('should set the `data-activation-direction` attribute on the tabs root with orientation=horizontal', async () => {
      render(() => (
        <Tabs.Root data-testid="root">
          <Tabs.List>
            <Tabs.Trigger value={0} />
            <Tabs.Trigger value={1} />
          </Tabs.List>
        </Tabs.Root>
      ))

      const root = screen.getByTestId('root')
      const tabs = screen.getAllByRole('tab')
      const tabList = screen.getByRole('tablist')
      mockTabLayout(tabList, tabs[0]!, { tabLeft: 0 })
      mockTabLayout(tabList, tabs[1]!, { tabLeft: 100 })

      expect(root).toHaveAttribute('data-activation-direction', 'none')
      fireEvent.click(tabs[1]!)
      await flushMicrotasks()
      expect(root).toHaveAttribute('data-activation-direction', 'right')
    })
  })
})
