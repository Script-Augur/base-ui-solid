import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Field } from '../../field'
import { FormErrorsProvider, waitFor } from '../../field/test-utils'
import { REASONS } from '../../internals/createChangeEventDetails'
import { OTPField } from '../index'

afterEach(() => {
  cleanup()
})
const OTP_LENGTH = 6
describe('<OTPField.Root />', () => {
  describe('value handling', () => {
    it('splits the default value across inputs', () => {
      render(() => <OTPFieldFixture defaultValue="12a34b56" />)

      const inputs = screen.getAllByRole<HTMLInputElement>('textbox')
      expect(inputs.map(input => input.value)).toEqual([
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
      ])
    })

    it('clamps an overlong default value to the rendered slot count', () => {
      render(() => <OTPFieldFixture defaultValue="12a34b56c7" name="otp" />)

      const inputs = screen.getAllByRole<HTMLInputElement>('textbox')
      const hiddenInput =
        document.querySelector<HTMLInputElement>('input[name="otp"]')

      expect(inputs.map(input => input.value)).toEqual([
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
      ])
      expect(inputs[0]).toHaveAttribute('maxlength', '6')
      inputs.slice(1).forEach(input => {
        expect(input).not.toHaveAttribute('maxlength')
      })
      expect(hiddenInput).toHaveValue('123456')
    })

    it('assigns slot indexes from render order when omitted', () => {
      render(() => (
        <OTPField.Root defaultValue="123" length={3}>
          <OTPField.Input />
          <OTPField.Input />
          <OTPField.Input />
        </OTPField.Root>
      ))

      const inputs = screen.getAllByRole<HTMLInputElement>('textbox')
      expect(inputs.map(input => input.value)).toEqual(['1', '2', '3'])
    })

    it('supports grouped layouts without affecting slot counting', () => {
      render(() => (
        <OTPField.Root defaultValue="123456" length={6}>
          <div data-testid="first-group">
            <OTPField.Input />
            <OTPField.Input />
            <OTPField.Input />
          </div>
          <OTPField.Separator />
          <div data-testid="second-group">
            <OTPField.Input />
            <OTPField.Input />
            <OTPField.Input />
          </div>
        </OTPField.Root>
      ))

      expect(getValues()).toBe('123456')
      expect(screen.getByTestId('first-group')).toBeTruthy()
      expect(screen.getByTestId('second-group')).toBeTruthy()
    })

    it('supports controlled values', () => {
      const [value, valueAssign] = createSignal('12')

      render(() => (
        <div>
          <OTPFieldFixture
            value={value()}
            onValueChange={next => valueAssign(next)}
          />
          <button type="button" onClick={() => valueAssign('999999')}>
            set
          </button>
        </div>
      ))

      expect(getValues()).toBe('12')
      fireEvent.click(screen.getByText('set'))
      expect(getValues()).toBe('999999')
    })

    it('calls onValueChange when typing into a slot', () => {
      const onValueChange = vi.fn()
      render(() => <OTPFieldFixture onValueChange={onValueChange} />)

      const inputs = screen.getAllByRole<HTMLInputElement>('textbox')
      fireEvent.input(inputs[0]!, { target: { value: '7' } })

      expect(onValueChange).toHaveBeenCalled()
      expect(onValueChange.mock.calls[0]![0]).toBe('7')
      expect(onValueChange.mock.calls[0]![1].reason).toBe(REASONS.inputChange)
    })

    it('cancels value updates when details.cancel is called', () => {
      render(() => (
        <OTPFieldFixture
          defaultValue="1"
          onValueChange={(_value, details) => {
            details.cancel()
          }}
        />
      ))

      const inputs = screen.getAllByRole<HTMLInputElement>('textbox')
      fireEvent.input(inputs[0]!, { target: { value: '9' } })
      expect(getValues()).toBe('1')
    })
  })

  describe('completion', () => {
    it('fires onValueComplete when the value becomes complete', async () => {
      const onValueComplete = vi.fn()
      render(() => (
        <OTPFieldFixture
          defaultValue="12345"
          onValueComplete={onValueComplete}
        />
      ))

      const inputs = screen.getAllByRole<HTMLInputElement>('textbox')
      fireEvent.input(inputs[5]!, { target: { value: '6' } })

      await waitFor(() => {
        expect(onValueComplete).toHaveBeenCalledWith(
          '123456',
          expect.objectContaining({ reason: REASONS.inputChange })
        )
      })
    })

    it('sets data-complete when all slots are filled', () => {
      render(() => <OTPFieldFixture defaultValue="123456" />)

      const root = screen.getByRole('group')
      expect(root).toHaveAttribute('data-complete', '')
    })
  })

  describe('validationType', () => {
    it('filters non-numeric characters by default', () => {
      render(() => <OTPFieldFixture defaultValue="a1b2c3" />)
      expect(getValues()).toBe('123')
    })

    it('accepts alphabetic characters when validationType is alpha', () => {
      render(() => (
        <OTPFieldFixture defaultValue="a1b2" validationType="alpha" />
      ))
      expect(getValues()).toBe('ab')
    })

    it('accepts alphanumeric characters when validationType is alphanumeric', () => {
      render(() => (
        <OTPFieldFixture defaultValue="A1-B2" validationType="alphanumeric" />
      ))
      expect(getValues()).toBe('A1B2')
    })

    it('reports rejected characters through onValueInvalid', () => {
      const onValueInvalid = vi.fn()
      render(() => <OTPFieldFixture onValueInvalid={onValueInvalid} />)

      const inputs = screen.getAllByRole<HTMLInputElement>('textbox')
      fireEvent.input(inputs[0]!, { target: { value: 'a' } })

      expect(onValueInvalid).toHaveBeenCalledWith(
        'a',
        expect.objectContaining({ reason: REASONS.inputChange })
      )
    })
  })

  describe('disabled / readOnly / required / mask', () => {
    it('disables all inputs when disabled', () => {
      render(() => <OTPFieldFixture disabled />)
      screen.getAllByRole<HTMLInputElement>('textbox').forEach(input => {
        expect(input).toBeDisabled()
      })
    })

    it('marks inputs readonly when readOnly', () => {
      render(() => <OTPFieldFixture readOnly />)
      screen.getAllByRole<HTMLInputElement>('textbox').forEach(input => {
        expect(input).toHaveAttribute('readonly')
      })
    })

    it('marks inputs required when required', () => {
      render(() => <OTPFieldFixture required />)
      screen.getAllByRole<HTMLInputElement>('textbox').forEach(input => {
        expect(input).toBeRequired()
      })
    })

    it('masks slot inputs when mask is true', () => {
      render(() => <OTPFieldFixture mask defaultValue="12" />)
      const root = screen.getByRole('group')
      const slots = root.querySelectorAll('input')
      expect(slots.length).toBe(6)
      slots.forEach(input => {
        expect(input).toHaveAttribute('type', 'password')
      })
    })
  })

  describe('Field integration', () => {
    it('inherits disabled from Field.Root', () => {
      render(() => (
        <Field.Root disabled>
          <OTPFieldFixture />
        </Field.Root>
      ))

      screen.getAllByRole<HTMLInputElement>('textbox').forEach(input => {
        expect(input).toBeDisabled()
      })
    })

    it('uses Field name for the hidden input', () => {
      render(() => (
        <Field.Root name="code">
          <OTPFieldFixture defaultValue="123456" />
        </Field.Root>
      ))

      expect(
        document.querySelector<HTMLInputElement>('input[name="code"]')
      ).toHaveValue('123456')
    })

    it('associates Field.Label with the first input', () => {
      render(() => (
        <Field.Root name="otp">
          <Field.Label>Code</Field.Label>
          <OTPFieldFixture />
        </Field.Root>
      ))

      expect(screen.getAllByRole('textbox')[0]).toHaveAccessibleName('Code')
    })
  })

  describe('Form integration', () => {
    it('clears form errors when the value changes', async () => {
      render(() => (
        <FormErrorsProvider errors={{ otp: 'Invalid code' }}>
          <Field.Root name="otp">
            <OTPFieldFixture defaultValue="1" />
            <Field.Error data-testid="error" />
          </Field.Root>
        </FormErrorsProvider>
      ))

      expect(screen.getByTestId('error')).toHaveTextContent('Invalid code')

      const inputs = screen.getAllByRole<HTMLInputElement>('textbox')
      fireEvent.input(inputs[0]!, { target: { value: '2' } })

      await waitFor(() => {
        expect(screen.queryByTestId('error')).toBeNull()
      })
    })
  })

  describe('paste', () => {
    it('fills slots from a pasted value', () => {
      render(() => <OTPFieldFixture />)
      const inputs = screen.getAllByRole<HTMLInputElement>('textbox')
      pasteText(inputs[0]!, '123456')
      expect(getValues()).toBe('123456')
    })

    it('strips whitespace from pasted values', () => {
      render(() => <OTPFieldFixture />)
      const inputs = screen.getAllByRole<HTMLInputElement>('textbox')
      pasteText(inputs[0]!, '1 2 3 4 5 6')
      expect(getValues()).toBe('123456')
    })

    it('pastes from a middle slot without shifting earlier characters', () => {
      render(() => <OTPFieldFixture defaultValue="12" />)
      const inputs = screen.getAllByRole<HTMLInputElement>('textbox')
      pasteText(inputs[2]!, '99')
      expect(getValues()).toBe('1299')
    })
  })

  describe('hidden validation input', () => {
    it('omits the hidden input when length is invalid', () => {
      render(() => (
        <OTPField.Root length={0} name="otp">
          <OTPField.Input />
        </OTPField.Root>
      ))

      expect(document.querySelector('input[name="otp"]')).toBeNull()
    })

    it('exposes autocomplete one-time-code on the first slot by default', () => {
      render(() => <OTPFieldFixture />)
      const inputs = screen.getAllByRole<HTMLInputElement>('textbox')
      expect(inputs[0]).toHaveAttribute('autocomplete', 'one-time-code')
      inputs.slice(1).forEach(input => {
        expect(input).toHaveAttribute('autocomplete', 'off')
      })
    })
  })
})
function OTPSlots(props: { length?: number }) {
  const length = props.length ?? OTP_LENGTH
  return (
    <>
      {Array.from({ length }, () => (
        <OTPField.Input />
      ))}
    </>
  )
}
function OTPFieldFixture(props: OTPFieldProps = {}) {
  return (
    <OTPField.Root length={OTP_LENGTH} {...props}>
      <OTPSlots />
    </OTPField.Root>
  )
}
function getValues() {
  return screen
    .getAllByRole<HTMLInputElement>('textbox')
    .map(input => input.value)
    .join('')
}
function pasteText(target: HTMLElement, value: string) {
  fireEvent.paste(target, {
    clipboardData: {
      getData: () => value,
    },
  })
}
type OTPFieldProps = Omit<
  Parameters<typeof OTPField.Root>[0],
  'children' | 'length'
>
