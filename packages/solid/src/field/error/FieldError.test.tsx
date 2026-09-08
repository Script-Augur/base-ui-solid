import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'

import { Field } from '../index'
import { FormErrorsProvider, waitFor } from '../test-utils'

afterEach(() => {
  cleanup()
})

describe('<Field.Error />', () => {
  it('should set aria-describedby on the control automatically', () => {
    render(() => (
      <Field.Root invalid>
        <Field.Control />
        <Field.Error match>Message</Field.Error>
      </Field.Root>
    ))

    expect(screen.getByRole('textbox')).toHaveAttribute(
      'aria-describedby',
      screen.getByText('Message').id
    )
  })

  it('should show error messages for onBlur validation', async () => {
    render(() => (
      <Field.Root validationMode="onBlur">
        <Field.Control required />
        <Field.Error>Message</Field.Error>
      </Field.Root>
    ))

    expect(screen.queryByText('Message')).toBe(null)

    const input = screen.getByRole<HTMLInputElement>('textbox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'a' } })
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.blur(input)

    await waitFor(() => {
      expect(screen.getByText('Message')).toBeTruthy()
    })
  })

  describe('prop: match', () => {
    it('should only render when `match` matches constraint validation', async () => {
      render(() => (
        <Field.Root validationMode="onChange">
          <Field.Control required minLength={2} />
          <Field.Error match="valueMissing">Message</Field.Error>
        </Field.Root>
      ))

      expect(screen.queryByText('Message')).toBe(null)

      const input = screen.getByRole<HTMLInputElement>('textbox')
      fireEvent.change(input, { target: { value: 'a' } })
      fireEvent.change(input, { target: { value: '' } })

      await waitFor(() => {
        expect(screen.getByText('Message')).toBeTruthy()
      })

      fireEvent.change(input, { target: { value: 'ab' } })
      await waitFor(() => {
        expect(screen.queryByText('Message')).toBe(null)
      })
    })

    it('should show custom errors', async () => {
      render(() => (
        <Field.Root validationMode="onBlur" validate={() => 'error'}>
          <Field.Control />
          <Field.Error match="customError">Message</Field.Error>
        </Field.Root>
      ))

      const input = screen.getByRole<HTMLInputElement>('textbox')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'a' } })
      fireEvent.blur(input)

      await waitFor(() => {
        expect(screen.getByText('Message')).toBeTruthy()
      })
    })

    it('uses `match={false}` as the default slot for Form errors', () => {
      render(() => (
        <FormErrorsProvider errors={{ username: 'Username is reserved' }}>
          <Field.Root name="username">
            <Field.Control defaultValue="admin" />
            <Field.Error match="valueMissing">
              Username is required.
            </Field.Error>
            <Field.Error data-testid="default-error" match={false} />
          </Field.Root>
        </FormErrorsProvider>
      ))

      expect(screen.getByTestId('default-error')).toHaveTextContent(
        'Username is reserved'
      )
      expect(screen.queryByText('Username is required.')).toBe(null)
    })

    it('uses an omitted `match` as the default slot for Form errors', () => {
      render(() => (
        <FormErrorsProvider errors={{ username: 'Username is reserved' }}>
          <Field.Root name="username">
            <Field.Control />
            <Field.Error data-testid="default-error" />
          </Field.Root>
        </FormErrorsProvider>
      ))

      expect(screen.getByTestId('default-error')).toHaveTextContent(
        'Username is reserved'
      )
    })

    it('uses the Field.Control name fallback for Form errors', () => {
      render(() => (
        <FormErrorsProvider errors={{ email: 'Email is already taken' }}>
          <Field.Root>
            <Field.Control name="email" />
            <Field.Error />
          </Field.Root>
        </FormErrorsProvider>
      ))

      expect(screen.getByText('Email is already taken')).toBeTruthy()
    })

    it('renders Form error arrays as a list', () => {
      render(() => (
        <FormErrorsProvider
          errors={{
            username: ['Username is reserved', 'Username is too short'],
          }}
        >
          <Field.Root name="username">
            <Field.Control />
            <Field.Error data-testid="default-error" />
          </Field.Root>
        </FormErrorsProvider>
      ))

      const list = screen.getByTestId('default-error').querySelector('ul')
      expect(list).toBeTruthy()
      expect(list?.querySelectorAll('li')).toHaveLength(2)
    })

    it('renders single-item Form error arrays as text', () => {
      render(() => (
        <FormErrorsProvider errors={{ username: ['Username is reserved'] }}>
          <Field.Root name="username">
            <Field.Control />
            <Field.Error data-testid="default-error" />
          </Field.Root>
        </FormErrorsProvider>
      ))

      expect(screen.getByTestId('default-error').querySelector('ul')).toBe(null)
      expect(screen.getByTestId('default-error')).toHaveTextContent(
        'Username is reserved'
      )
    })

    it('ignores empty Form error arrays', () => {
      render(() => (
        <FormErrorsProvider errors={{ username: [] }}>
          <Field.Root name="username">
            <Field.Control />
            <Field.Error data-testid="default-error" />
          </Field.Root>
        </FormErrorsProvider>
      ))

      expect(screen.queryByTestId('default-error')).toBe(null)
    })
  })
})
