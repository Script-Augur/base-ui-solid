/**
 * Port of `@base-ui/react` Fieldset legend tests (v1.7.0).
 * Skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { Show, createSignal } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'

import { Fieldset } from '../index'

afterEach(() => {
  cleanup()
})

describe('<Fieldset.Legend />', () => {
  it('does not set aria-labelledby when no legend is rendered', () => {
    render(() => (
      <Fieldset.Root>
        <input />
      </Fieldset.Root>
    ))

    expect(screen.getByRole('group')).not.toHaveAttribute('aria-labelledby')
  })

  it('should set aria-labelledby on the fieldset automatically', () => {
    render(() => (
      <Fieldset.Root>
        <Fieldset.Legend data-testid="legend">Legend</Fieldset.Legend>
      </Fieldset.Root>
    ))

    expect(screen.getByRole('group')).toHaveAttribute(
      'aria-labelledby',
      screen.getByTestId('legend').id
    )
  })

  it('should set aria-labelledby on the fieldset with custom id', () => {
    render(() => (
      <Fieldset.Root>
        <Fieldset.Legend id="legend-id" />
      </Fieldset.Root>
    ))

    expect(screen.getByRole('group')).toHaveAttribute(
      'aria-labelledby',
      'legend-id'
    )
  })

  it('updates and clears the legend association', () => {
    const [legendId, legendIdAssign] = createSignal('legend-a')
    const [showLegend, showLegendAssign] = createSignal(true)

    render(() => (
      <>
        <Fieldset.Root>
          <Show when={showLegend()}>
            <Fieldset.Legend id={legendId()}>Legend</Fieldset.Legend>
          </Show>
        </Fieldset.Root>
        <button type="button" onClick={() => legendIdAssign('legend-b')}>
          Change id
        </button>
        <button type="button" onClick={() => showLegendAssign(false)}>
          Remove legend
        </button>
      </>
    ))

    expect(screen.getByRole('group')).toHaveAttribute(
      'aria-labelledby',
      'legend-a'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Change id' }))
    expect(screen.getByRole('group')).toHaveAttribute(
      'aria-labelledby',
      'legend-b'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remove legend' }))
    expect(screen.getByRole('group')).not.toHaveAttribute('aria-labelledby')
  })

  it('throws a descriptive error when rendered outside <Fieldset.Root>', () => {
    expect(() => render(() => <Fieldset.Legend />)).toThrow(
      'Base UI: FieldsetRootContext is missing. Fieldset parts must be placed within <Fieldset.Root>.'
    )
  })

  it('sets data-disabled when the fieldset is disabled', () => {
    render(() => (
      <Fieldset.Root disabled>
        <Fieldset.Legend data-testid="legend">Legend</Fieldset.Legend>
      </Fieldset.Root>
    ))

    expect(screen.getByTestId('legend')).toHaveAttribute('data-disabled')
  })
})
