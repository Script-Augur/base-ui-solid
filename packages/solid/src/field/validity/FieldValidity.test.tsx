import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Field } from '../index'
import { waitFor } from '../test-utils'

afterEach(() => {
  cleanup()
})

describe('<Field.Validity />', () => {
  describe('validationMode=onBlur', () => {
    it('should pass validity data', async () => {
      const handleValidity = vi.fn()

      render(() => (
        <Field.Root validationMode="onBlur">
          <Field.Control required />
          <Field.Validity>{handleValidity}</Field.Validity>
        </Field.Root>
      ))

      const input = screen.getByRole<HTMLInputElement>('textbox')

      expect(handleValidity.mock.lastCall?.[0].validity.valid).toBe(null)

      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'test' } })
      fireEvent.blur(input)

      await waitFor(() => {
        expect(handleValidity.mock.lastCall?.[0].value).toBe('test')
        expect(handleValidity.mock.lastCall?.[0].validity.valid).toBe(true)
        expect(handleValidity.mock.lastCall?.[0].validity.valueMissing).toBe(
          false
        )
      })
    })

    it('should correctly pass errors when validate function returns a string', async () => {
      const handleValidity = vi.fn()

      render(() => (
        <Field.Root validationMode="onBlur" validate={() => 'error'}>
          <Field.Control />
          <Field.Validity>{handleValidity}</Field.Validity>
        </Field.Root>
      ))

      const input = screen.getByRole<HTMLInputElement>('textbox')
      fireEvent.focus(input)
      fireEvent.blur(input)

      await waitFor(() => {
        expect(handleValidity.mock.lastCall?.[0].error).toBe('error')
        expect(handleValidity.mock.lastCall?.[0].errors).toEqual(['error'])
      })
    })

    it('should correctly pass errors when validate function returns an array of strings', async () => {
      const handleValidity = vi.fn()

      render(() => (
        <Field.Root validationMode="onBlur" validate={() => ['1', '2']}>
          <Field.Control />
          <Field.Validity>{handleValidity}</Field.Validity>
        </Field.Root>
      ))

      const input = screen.getByRole<HTMLInputElement>('textbox')
      fireEvent.focus(input)
      fireEvent.blur(input)

      await waitFor(() => {
        expect(handleValidity.mock.lastCall?.[0].error).toBe('1')
        expect(handleValidity.mock.lastCall?.[0].errors).toEqual(['1', '2'])
      })
    })
  })
})
