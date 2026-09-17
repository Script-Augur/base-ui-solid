import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Field } from '../field'
import { waitFor } from '../field/test-utils'
import { Form } from '../form'

import { Input } from './Input'
import { InputDataAttributes } from './InputDataAttributes'

afterEach(() => {
  cleanup()
})

describe('<Input />', () => {
  it('renders a native input element', () => {
    render(() => <Input data-testid="input" placeholder="Name" />)

    const input = screen.getByTestId('input')
    expect(input.tagName).toBe('INPUT')
    expect(input).toHaveAttribute('placeholder', 'Name')
  })

  it('associates with Field.Label and inherits Field disabled/invalid state', () => {
    render(() => (
      <Field.Root name="email" disabled invalid>
        <Field.Label>Email</Field.Label>
        <Input data-testid="input" />
      </Field.Root>
    ))

    const input = screen.getByTestId('input')
    expect(input).toBeDisabled()
    expect(input).toHaveAttribute(InputDataAttributes.disabled, '')
    expect(input).toHaveAttribute(InputDataAttributes.invalid, '')
    expect(screen.getByLabelText('Email')).toBe(input)
  })

  it('supports controlled value and onValueChange', () => {
    const handleValueChange = vi.fn()

    render(() => {
      const [value, valueAssign] = createSignal('a')
      return (
        <Field.Root name="name">
          <Input
            data-testid="input"
            value={value()}
            onValueChange={next => {
              handleValueChange(next)
              valueAssign(next)
            }}
          />
        </Field.Root>
      )
    })

    const input = screen.getByTestId<HTMLInputElement>('input')
    expect(input.value).toBe('a')

    fireEvent.input(input, { target: { value: 'ab' } })
    expect(handleValueChange).toHaveBeenCalledWith('ab')
    expect(input.value).toBe('ab')
  })

  it('supports uncontrolled defaultValue', () => {
    render(() => (
      <Field.Root name="name">
        <Input data-testid="input" defaultValue="seed" />
      </Field.Root>
    ))

    expect(screen.getByTestId<HTMLInputElement>('input').value).toBe('seed')
  })

  it('marks filled/dirty/focused via Field integration', () => {
    render(() => (
      <Field.Root name="name">
        <Input data-testid="input" />
      </Field.Root>
    ))

    const input = screen.getByTestId('input')
    fireEvent.focus(input)
    expect(input).toHaveAttribute(InputDataAttributes.focused, '')

    fireEvent.input(input, { target: { value: 'x' } })
    expect(input).toHaveAttribute(InputDataAttributes.filled, '')
    expect(input).toHaveAttribute(InputDataAttributes.dirty, '')

    fireEvent.blur(input)
    expect(input).not.toHaveAttribute(InputDataAttributes.focused)
    expect(input).toHaveAttribute(InputDataAttributes.touched, '')
  })

  it('validates with Field validationMode onChange', async () => {
    const validate = vi.fn(() => 'Nope')

    render(() => (
      <Field.Root name="code" validationMode="onChange" validate={validate}>
        <Input data-testid="input" />
        <Field.Error />
      </Field.Root>
    ))

    fireEvent.input(screen.getByTestId('input'), { target: { value: 'z' } })

    await waitFor(() => {
      expect(validate).toHaveBeenCalledWith('z', expect.anything())
      expect(screen.getByText('Nope')).toBeTruthy()
      expect(screen.getByTestId('input')).toHaveAttribute(
        'aria-invalid',
        'true'
      )
    })
  })

  it('clears Form external errors on input', async () => {
    render(() => (
      <Form errors={{ email: 'Server error' }}>
        <Field.Root name="email">
          <Input data-testid="input" type="email" />
          <Field.Error />
        </Field.Root>
      </Form>
    ))

    expect(screen.getByText('Server error')).toBeTruthy()

    fireEvent.input(screen.getByTestId('input'), {
      target: { value: 'a@b.com' },
    })

    await waitFor(() => {
      expect(screen.queryByText('Server error')).toBeNull()
    })
  })

  it('submits values through Form with Input as the control', async () => {
    const handleFormSubmit = vi.fn()

    render(() => (
      <Form onFormSubmit={handleFormSubmit}>
        <Field.Root name="name">
          <Input data-testid="input" defaultValue="Ada" />
        </Field.Root>
        <button type="submit">Submit</button>
      </Form>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => {
      expect(handleFormSubmit).toHaveBeenCalledTimes(1)
      expect(handleFormSubmit.mock.calls[0]?.[0]).toEqual({ name: 'Ada' })
    })
  })

  it('can render as a textarea via render prop', () => {
    render(() => (
      <Field.Root name="bio">
        <Input data-testid="input" render={props => <textarea {...props} />} />
      </Field.Root>
    ))

    const el = screen.getByTestId('input')
    expect(el.tagName).toBe('TEXTAREA')
  })

  it('does not fire onValueChange again on blur after typing', () => {
    const handleValueChange = vi.fn()

    render(() => (
      <Field.Root>
        <Input onValueChange={handleValueChange} />
      </Field.Root>
    ))

    const input = screen.getByRole('textbox')
    fireEvent.focus(input)
    fireEvent.input(input, { target: { value: 'a' } })
    expect(handleValueChange).toHaveBeenCalledTimes(1)

    fireEvent.change(input, { target: { value: 'a' } })
    fireEvent.blur(input)
    expect(handleValueChange).toHaveBeenCalledTimes(1)
  })
})
