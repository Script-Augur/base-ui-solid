/**
 * Port of `@base-ui/react` Accordion panel tests (v1.7.0).
 * Skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, render, screen } from '@solidjs/testing-library'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Accordion } from '../index'

const PANEL_CONTENT = 'This is panel content'

afterEach(() => {
  cleanup()
})

describe('<Accordion.Panel />', () => {
  it('warns when a panel enables hiddenUntilFound and disables keepMounted', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      render(() => (
        <Accordion.Root>
          <Accordion.Item>
            <Accordion.Panel hiddenUntilFound keepMounted={false}>
              {PANEL_CONTENT}
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ))

      expect(warnSpy).toHaveBeenCalledWith(
        'Base UI: The `keepMounted={false}` prop on an `Accordion.Panel` is ignored when `hiddenUntilFound` is enabled on the panel or root, since the panel must remain mounted while closed.'
      )
      expect(screen.getByText(PANEL_CONTENT).getAttribute('hidden')).toBe(
        'until-found'
      )
    } finally {
      warnSpy.mockRestore()
    }
  })

  it('passes root keepMounted to closed panels', () => {
    render(() => (
      <Accordion.Root keepMounted>
        <Accordion.Item value={0}>
          <Accordion.Header>
            <Accordion.Trigger>Trigger</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>{PANEL_CONTENT}</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    ))

    expect(screen.getByText(PANEL_CONTENT)).toHaveAttribute('hidden')
  })

  it('passes root hiddenUntilFound to closed panels and allows panel overrides', () => {
    render(() => (
      <Accordion.Root hiddenUntilFound keepMounted>
        <Accordion.Item value={0}>
          <Accordion.Header>
            <Accordion.Trigger>Trigger 1</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>{PANEL_CONTENT}</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value={1}>
          <Accordion.Header>
            <Accordion.Trigger>Trigger 2</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel hiddenUntilFound={false} keepMounted={false}>
            Overridden panel
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    ))

    expect(screen.getByText(PANEL_CONTENT).getAttribute('hidden')).toBe(
      'until-found'
    )
    expect(screen.queryByText('Overridden panel')).toBe(null)
  })
})
