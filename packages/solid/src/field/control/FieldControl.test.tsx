import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Field } from '../index'
import { FormErrorsProvider, waitFor } from '../test-utils'

afterEach(() => {
  cleanup()
})

describe('<Field.Control />', () => {
  it('validates once when changed by the user', async () => {
    const validate = vi.fn()

    render(() => (
      <Field.Root validationMode="onChange" validate={validate}>
        <Field.Control />
      </Field.Root>
    ))

    fireEvent.input(screen.getByRole('textbox'), { target: { value: 'a' } })

    await waitFor(() => {
      expect(validate).toHaveBeenCalledTimes(1)
      expect(validate.mock.lastCall?.[0]).toBe('a')
    })
  })

  it('does not clear errors or validate when change is prevented', () => {
    const validate = vi.fn()
    const handleValueChange = vi.fn()

    render(() => (
      <FormErrorsProvider errors={{ message: 'Server error' }}>
        <Field.Root
          name="message"
          validationMode="onChange"
          validate={validate}
        >
          <Field.Control onValueChange={handleValueChange} />
          <Field.Error />
        </Field.Root>
      </FormErrorsProvider>
    ))

    const control = screen.getByRole<HTMLInputElement>('textbox')
    control.addEventListener('input', event => event.preventDefault(), {
      capture: true,
      once: true,
    })
    fireEvent.input(control, { cancelable: true, target: { value: 'a' } })

    expect(handleValueChange).toHaveBeenCalledTimes(1)
    expect(validate).not.toHaveBeenCalled()
    expect(screen.getByText('Server error')).toBeTruthy()
  })

  it('shows a required error when a prefilled value is cleared', async () => {
    render(() => (
      <Field.Root validationMode="onChange">
        <Field.Control data-testid="control" defaultValue="value" required />
        <Field.Error match="valueMissing">Required</Field.Error>
      </Field.Root>
    ))

    const control = screen.getByTestId('control')
    fireEvent.input(control, { target: { value: '' } })

    await waitFor(() => {
      expect(control).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByText('Required')).toBeTruthy()
    })
  })

  it('does not fire onValueChange again on blur after typing (input-only, not change)', () => {
    const handleValueChange = vi.fn()

    render(() => (
      <Field.Root>
        <Field.Control onValueChange={handleValueChange} />
      </Field.Root>
    ))

    const control = screen.getByRole('textbox')
    fireEvent.focus(control)
    fireEvent.input(control, { target: { value: 'a' } })
    expect(handleValueChange).toHaveBeenCalledTimes(1)

    // Native change fires on blur after edits; Solid must not treat that as a value event.
    fireEvent.change(control, { target: { value: 'a' } })
    fireEvent.blur(control)
    expect(handleValueChange).toHaveBeenCalledTimes(1)
  })
})
