/**
 * Port of `@base-ui/react` Accordion item tests (v1.7.0).
 * Skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Accordion } from '../index'

afterEach(() => {
  cleanup()
})

describe('<Accordion.Item />', () => {
  it('throws when rendered outside an Accordion.Root', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      expect(() => render(() => <Accordion.Item />)).toThrow(
        /Accordion parts must be placed within <Accordion\.Root>/
      )
    } finally {
      errorSpy.mockRestore()
    }
  })

  describe('state', () => {
    it('does not report hidden=true after the item has started opening', () => {
      const renderSpy = vi.fn()

      render(() => (
        <Accordion.Root>
          <Accordion.Item
            render={(props, state) => {
              renderSpy(state)
              return <div {...props} />
            }}
          >
            <Accordion.Header>
              <Accordion.Trigger>Trigger</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>Panel</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ))

      fireEvent.click(screen.getByRole('button', { name: 'Trigger' }))

      expect(
        renderSpy.mock.calls.some(
          ([state]) =>
            (state as { open: boolean; hidden: boolean }).open === true &&
            (state as { open: boolean; hidden: boolean }).hidden === true
        )
      ).toBe(false)
    })
  })
})
