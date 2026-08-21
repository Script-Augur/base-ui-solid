import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CollapsiblePanelDataAttributes } from './panel/CollapsiblePanelDataAttributes'
import { CollapsibleTriggerDataAttributes } from './trigger/CollapsibleTriggerDataAttributes'

import { Collapsible } from './index'

const PANEL_CONTENT = 'This is panel content'

afterEach(() => {
  cleanup()
})

describe('Collapsible', () => {
  describe('ARIA attributes', () => {
    it('sets ARIA attributes when open', () => {
      render(() => (
        <Collapsible.Root defaultOpen>
          <Collapsible.Trigger />
          <Collapsible.Panel data-testid="panel" />
        </Collapsible.Root>
      ))

      const trigger = screen.getByRole('button')
      const panel = screen.getByTestId('panel')

      expect(trigger).toHaveAttribute('aria-expanded', 'true')
      expect(trigger).toHaveAttribute('aria-controls')
      expect(trigger.getAttribute('aria-controls')).toBe(
        panel.getAttribute('id')
      )
    })

    it('references manual panel id in trigger aria-controls', () => {
      render(() => (
        <Collapsible.Root defaultOpen>
          <Collapsible.Trigger />
          <Collapsible.Panel id="custom-panel-id" data-testid="panel" />
        </Collapsible.Root>
      ))

      const trigger = screen.getByRole('button')
      const panel = screen.getByTestId('panel')

      expect(trigger).toHaveAttribute('aria-controls', 'custom-panel-id')
      expect(panel).toHaveAttribute('id', 'custom-panel-id')
    })
  })

  describe('disabled', () => {
    it('does not toggle or call onOpenChange when clicked while disabled', () => {
      const handleOpenChange = vi.fn()

      render(() => (
        <Collapsible.Root disabled onOpenChange={handleOpenChange}>
          <Collapsible.Trigger>Trigger</Collapsible.Trigger>
          <Collapsible.Panel>{PANEL_CONTENT}</Collapsible.Panel>
        </Collapsible.Root>
      ))

      const trigger = screen.getByRole('button', { name: 'Trigger' })
      fireEvent.click(trigger)

      expect(handleOpenChange).not.toHaveBeenCalled()
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByText(PANEL_CONTENT)).toBe(null)
    })
  })

  describe('onOpenChange', () => {
    it('calls onOpenChange with trigger-press event details', () => {
      const handleOpenChange = vi.fn()

      render(() => (
        <Collapsible.Root onOpenChange={handleOpenChange}>
          <Collapsible.Trigger>Toggle</Collapsible.Trigger>
          <Collapsible.Panel>{PANEL_CONTENT}</Collapsible.Panel>
        </Collapsible.Root>
      ))

      fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))

      expect(handleOpenChange).toHaveBeenCalledTimes(1)
      const [openArg, details] = handleOpenChange.mock.calls[0] as [
        boolean,
        { reason: string; isCanceled: boolean },
      ]
      expect(openArg).toBe(true)
      expect(details.reason).toBe('trigger-press')
      expect(details.isCanceled).toBe(false)
    })

    it('eventDetails.cancel() prevents opening while uncontrolled', () => {
      const handleOpenChange = vi.fn(
        (_next: boolean, eventDetails: { cancel: () => void }) => {
          eventDetails.cancel()
        }
      )

      render(() => (
        <Collapsible.Root onOpenChange={handleOpenChange}>
          <Collapsible.Trigger>Toggle</Collapsible.Trigger>
          <Collapsible.Panel>{PANEL_CONTENT}</Collapsible.Panel>
        </Collapsible.Root>
      ))

      const trigger = screen.getByRole('button', { name: 'Toggle' })
      fireEvent.click(trigger)

      expect(handleOpenChange).toHaveBeenCalledOnce()
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByText(PANEL_CONTENT)).toBe(null)
    })
  })

  describe('open state', () => {
    it('uncontrolled mode toggles panel visibility', () => {
      render(() => (
        <Collapsible.Root defaultOpen={false}>
          <Collapsible.Trigger />
          <Collapsible.Panel>{PANEL_CONTENT}</Collapsible.Panel>
        </Collapsible.Root>
      ))

      const trigger = screen.getByRole('button')

      expect(trigger).not.toHaveAttribute('aria-controls')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByText(PANEL_CONTENT)).toBe(null)

      fireEvent.click(trigger)

      expect(trigger).toHaveAttribute('aria-expanded', 'true')
      expect(trigger).toHaveAttribute('aria-controls')
      expect(screen.getByText(PANEL_CONTENT)).toHaveAttribute(
        CollapsiblePanelDataAttributes.open
      )
      expect(trigger).toHaveAttribute(
        CollapsibleTriggerDataAttributes.panelOpen
      )

      fireEvent.click(trigger)

      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(trigger).not.toHaveAttribute('aria-controls')
      expect(screen.queryByText(PANEL_CONTENT)).toBe(null)
    })

    it('controlled mode follows external open', () => {
      function App() {
        const [open, openAssign] = createSignal(false)
        return (
          <>
            <Collapsible.Root open={open()}>
              <Collapsible.Trigger>trigger</Collapsible.Trigger>
              <Collapsible.Panel>{PANEL_CONTENT}</Collapsible.Panel>
            </Collapsible.Root>
            <button type="button" onClick={() => openAssign(!open())}>
              toggle
            </button>
          </>
        )
      }

      render(() => <App />)

      const trigger = screen.getByRole('button', { name: 'trigger' })
      const external = screen.getByRole('button', { name: 'toggle' })

      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByText(PANEL_CONTENT)).toBe(null)

      fireEvent.click(external)

      expect(trigger).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByText(PANEL_CONTENT)).toBeVisible()

      fireEvent.click(external)

      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByText(PANEL_CONTENT)).toBe(null)
    })

    it('keepMounted leaves the panel in the DOM when closed', () => {
      render(() => (
        <Collapsible.Root defaultOpen={false}>
          <Collapsible.Trigger>Trigger</Collapsible.Trigger>
          <Collapsible.Panel keepMounted data-testid="panel">
            {PANEL_CONTENT}
          </Collapsible.Panel>
        </Collapsible.Root>
      ))

      const panel = screen.getByTestId('panel')
      expect(panel).toHaveAttribute('hidden')
      expect(panel).toHaveAttribute(CollapsiblePanelDataAttributes.closed)

      fireEvent.click(screen.getByRole('button', { name: 'Trigger' }))

      expect(panel).not.toHaveAttribute('hidden')
      expect(panel).toHaveAttribute(CollapsiblePanelDataAttributes.open)
    })
  })
})
