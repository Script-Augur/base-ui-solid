/**
 * Port of `@base-ui/react` Meter label tests (v1.7.0).
 * Skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { Show, createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Meter } from '../index'

import { MeterLabel } from './MeterLabel'

afterEach(() => {
  cleanup()
})

describe('<Meter.Label />', () => {
  it('updates and clears the meter label association', () => {
    const [labelId, labelIdAssign] = createSignal('label-a')
    const [showLabel, showLabelAssign] = createSignal(true)

    render(() => (
      <>
        <Meter.Root value={50}>
          <Show when={showLabel()}>
            <Meter.Label id={labelId()}>Battery level</Meter.Label>
          </Show>
        </Meter.Root>
        <button type="button" onClick={() => labelIdAssign('label-b')}>
          Change id
        </button>
        <button type="button" onClick={() => showLabelAssign(false)}>
          Remove label
        </button>
      </>
    ))

    const meter = screen.getByRole('meter')
    expect(meter).toHaveAttribute('aria-labelledby', 'label-a')

    fireEvent.click(screen.getByRole('button', { name: 'Change id' }))
    expect(meter).toHaveAttribute('aria-labelledby', 'label-b')

    fireEvent.click(screen.getByRole('button', { name: 'Remove label' }))
    expect(meter).not.toHaveAttribute('aria-labelledby')
  })

  it('throws a descriptive error when rendered outside <Meter.Root>', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      expect(() => render(() => <MeterLabel />)).toThrow(
        'Base UI: MeterRootContext is missing. Meter parts must be placed within <Meter.Root>.'
      )
    } finally {
      errorSpy.mockRestore()
    }
  })
})
