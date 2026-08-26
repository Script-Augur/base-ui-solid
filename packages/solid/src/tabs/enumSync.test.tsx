/**
 * Port of `@base-ui/react` Tabs enum sync tests (v1.7.0).
 */
import { cleanup, render, screen } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'

import { TabsIndicatorCssVars } from './indicator/TabsIndicatorCssVars'
import { TabsIndicatorDataAttributes } from './indicator/TabsIndicatorDataAttributes'
import { TabsListDataAttributes } from './list/TabsListDataAttributes'
import { TabsPanelDataAttributes } from './panel/TabsPanelDataAttributes'
import { TabsRootDataAttributes } from './root/TabsRootDataAttributes'
import { TabTriggerDataAttributes } from './trigger/TabTriggerDataAttributes'

import { Tabs } from './index'

afterEach(() => {
  cleanup()
})

describe('Tabs enum sync', () => {
  it('names the activation-direction attribute per TabsRootDataAttributes', () => {
    expect(TabsRootDataAttributes.activationDirection).toBe(
      'data-activation-direction'
    )
  })

  it('names the panel index attribute per TabsPanelDataAttributes', () => {
    render(() => (
      <Tabs.Root defaultValue={0}>
        <Tabs.List>
          <Tabs.Trigger value={0} />
        </Tabs.List>
        <Tabs.Panel value={0} data-testid="panel" />
      </Tabs.Root>
    ))

    expect(screen.getByTestId('panel')).toHaveAttribute(
      TabsPanelDataAttributes.index
    )
  })

  it('names the tab attributes per TabTriggerDataAttributes', () => {
    render(() => (
      <Tabs.Root defaultValue={0} orientation="vertical">
        <Tabs.List>
          <Tabs.Trigger value={0} data-testid="active-tab" />
          <Tabs.Trigger value={1} disabled data-testid="disabled-tab" />
        </Tabs.List>
      </Tabs.Root>
    ))

    const activeTab = screen.getByTestId('active-tab')
    expect(activeTab).toHaveAttribute(
      TabTriggerDataAttributes.orientation,
      'vertical'
    )
    expect(activeTab).toHaveAttribute(
      TabTriggerDataAttributes.activationDirection,
      'none'
    )
    expect(activeTab).toHaveAttribute(TabTriggerDataAttributes.active)
    expect(activeTab).not.toHaveAttribute(TabTriggerDataAttributes.disabled)

    const disabledTab = screen.getByTestId('disabled-tab')
    expect(disabledTab).toHaveAttribute(TabTriggerDataAttributes.disabled)
    expect(disabledTab).not.toHaveAttribute(TabTriggerDataAttributes.active)
  })

  it('names the list and indicator attributes per their data attribute enums', () => {
    render(() => (
      <Tabs.Root defaultValue={0} orientation="vertical">
        <Tabs.List data-testid="list">
          <Tabs.Trigger value={0} />
          <Tabs.Indicator data-testid="indicator" />
        </Tabs.List>
      </Tabs.Root>
    ))

    const list = screen.getByTestId('list')
    expect(list).toHaveAttribute(TabsListDataAttributes.orientation, 'vertical')
    expect(list).toHaveAttribute(
      TabsListDataAttributes.activationDirection,
      'none'
    )

    const indicator = screen.getByTestId('indicator')
    expect(indicator).toHaveAttribute(
      TabsIndicatorDataAttributes.orientation,
      'vertical'
    )
    expect(indicator).toHaveAttribute(
      TabsIndicatorDataAttributes.activationDirection,
      'none'
    )
  })

  it('names the indicator CSS variables per TabsIndicatorCssVars', () => {
    render(() => (
      <Tabs.Root defaultValue={0}>
        <Tabs.List>
          <Tabs.Trigger value={0} />
          <Tabs.Indicator data-testid="indicator" />
        </Tabs.List>
      </Tabs.Root>
    ))

    const indicator = screen.getByTestId('indicator')
    const vars = [
      TabsIndicatorCssVars.activeTabLeft,
      TabsIndicatorCssVars.activeTabRight,
      TabsIndicatorCssVars.activeTabTop,
      TabsIndicatorCssVars.activeTabBottom,
      TabsIndicatorCssVars.activeTabWidth,
      TabsIndicatorCssVars.activeTabHeight,
    ] as const

    for (const cssVar of vars) {
      expect(indicator.style.getPropertyValue(cssVar)).not.toBe('')
    }
  })
})
