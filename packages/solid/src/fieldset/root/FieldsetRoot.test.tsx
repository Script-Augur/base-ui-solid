/**
 * Port of `@base-ui/react` Fieldset root tests (v1.7.0).
 * Skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'

import { Field } from '../../field'
import { Fieldset } from '../index'

afterEach(() => {
  cleanup()
})

describe('<Fieldset.Root />', () => {
  it('sets the native disabled attribute', () => {
    render(() => (
      <Fieldset.Root disabled data-testid="fieldset">
        <input />
      </Fieldset.Root>
    ))

    expect(screen.getByTestId('fieldset')).toHaveAttribute('disabled')
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('keeps nested fieldsets disabled when an ancestor fieldset is disabled', () => {
    render(() => (
      <Fieldset.Root disabled>
        <Fieldset.Root>
          <Field.Root>
            <Field.Control data-testid="control" />
          </Field.Root>
        </Fieldset.Root>
      </Fieldset.Root>
    ))

    expect(screen.getByTestId('control')).toHaveAttribute('disabled')
  })

  it('updates nested disabled precedence in both directions', () => {
    const [outerDisabled, outerDisabledAssign] = createSignal(false)
    const [innerDisabled, innerDisabledAssign] = createSignal(true)

    render(() => (
      <>
        <Fieldset.Root disabled={outerDisabled()}>
          <Fieldset.Root disabled={innerDisabled()}>
            <Field.Root data-testid="root">
              <Field.Control data-testid="control" />
            </Field.Root>
          </Fieldset.Root>
        </Fieldset.Root>

        <button type="button" onClick={() => outerDisabledAssign(true)}>
          Disable outer
        </button>

        <button type="button" onClick={() => innerDisabledAssign(false)}>
          Enable inner
        </button>

        <button type="button" onClick={() => outerDisabledAssign(false)}>
          Enable outer
        </button>
      </>
    ))

    expect(screen.getByTestId('control')).toBeDisabled()
    expect(screen.getByTestId('root')).toHaveAttribute('data-disabled')
    fireEvent.click(screen.getByRole('button', { name: 'Disable outer' }))
    fireEvent.click(screen.getByRole('button', { name: 'Enable inner' }))
    expect(screen.getByTestId('control')).toBeDisabled()
    expect(screen.getByTestId('root')).toHaveAttribute('data-disabled')
    fireEvent.click(screen.getByRole('button', { name: 'Enable outer' }))
    expect(screen.getByTestId('control')).not.toBeDisabled()
    expect(screen.getByTestId('root')).not.toHaveAttribute('data-disabled')
  })

  it('sets data-disabled on the fieldset when disabled', () => {
    render(() => <Fieldset.Root disabled data-testid="fieldset" />)

    expect(screen.getByTestId('fieldset')).toHaveAttribute('data-disabled')
  })
})
