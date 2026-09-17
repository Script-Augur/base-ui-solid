import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Field } from '../../field'
import { FormErrorsProvider, waitFor } from '../../field/test-utils'
import { NumberField } from '../index'

afterEach(() => {
  cleanup()
})
describe('<NumberField.Root />', () => {
  describe('prop: defaultValue', () => {
    it('accepts a number value', () => {
      renderNumberField({ defaultValue: 5 })
      const input = screen.getByTestId('input')
      expect(input.tagName).toBe('INPUT')
      expect(input.type).toBe('text')
      expect(input.value).toBe('5')
    })

    it('accepts an undefined value', () => {
      renderNumberField()
      expect(screen.getByTestId('input').value).toBe('')
    })
  })

  describe('prop: value', () => {
    it('accepts a controlled number that can change over time', () => {
      const [value, valueAssign] = createSignal<number | null>(1)

      render(() => (
        <NumberField.Root value={value()}>
          <NumberField.Input data-testid="input" />
          <button type="button" onClick={() => valueAssign(2)}>
            set
          </button>
        </NumberField.Root>
      ))

      expect(screen.getByTestId('input').value).toBe('1')
      fireEvent.click(screen.getByText('set'))
      expect(screen.getByTestId('input').value).toBe('2')
    })

    it('accepts a null value', () => {
      render(() => (
        <NumberField.Root value={null}>
          <NumberField.Input data-testid="input" />
        </NumberField.Root>
      ))
      expect(screen.getByTestId('input').value).toBe('')
    })

    it('reports null when the input is empty but not trimmed', () => {
      const onValueChange = vi.fn()
      render(() => (
        <NumberField.Root value={1} onValueChange={onValueChange}>
          <NumberField.Input data-testid="input" />
        </NumberField.Root>
      ))

      fireEvent.input(screen.getByTestId('input'), { target: { value: '  ' } })
      expect(onValueChange.mock.calls[0][0]).toBeNull()
    })
  })

  describe('prop: onValueChange', () => {
    it('supports controlled value updates', () => {
      const onValueChange = vi.fn()
      const [value, valueAssign] = createSignal<number | null>(1)

      render(() => (
        <NumberField.Root
          value={value()}
          onValueChange={(next, details) => {
            onValueChange(next, details)
            if (!details.isCanceled) {
              valueAssign(next)
            }
          }}
        >
          <NumberField.Input data-testid="input" />
          <NumberField.Increment data-testid="increment">
            +
          </NumberField.Increment>
        </NumberField.Root>
      ))

      fireEvent.click(screen.getByTestId('increment'))
      expect(onValueChange).toHaveBeenCalled()
      expect(value()).toBe(2)
      expect(screen.getByTestId('input').value).toBe('2')
    })

    it('is called with a number when transitioning from null', () => {
      const onValueChange = vi.fn()
      const [value, valueAssign] = createSignal<number | null>(null)

      render(() => (
        <NumberField.Root
          value={value()}
          onValueChange={(next, details) => {
            onValueChange(next, details)
            if (!details.isCanceled) {
              valueAssign(next)
            }
          }}
        >
          <NumberField.Input data-testid="input" />
        </NumberField.Root>
      ))

      fireEvent.input(screen.getByTestId('input'), { target: { value: '5' } })
      expect(onValueChange).toHaveBeenCalledTimes(1)
      expect(onValueChange.mock.calls[0][0]).toBe(5)
    })

    it('is called with null when emptying a number', () => {
      const onValueChange = vi.fn()
      const [value, valueAssign] = createSignal<number | null>(5)

      render(() => (
        <NumberField.Root
          value={value()}
          onValueChange={(next, details) => {
            onValueChange(next, details)
            if (!details.isCanceled) {
              valueAssign(next)
            }
          }}
        >
          <NumberField.Input data-testid="input" />
        </NumberField.Root>
      ))

      fireEvent.input(screen.getByTestId('input'), { target: { value: '' } })
      expect(onValueChange).toHaveBeenCalledTimes(1)
      expect(onValueChange.mock.calls[0][0]).toBeNull()
    })

    it('includes the reason for parseable typing', () => {
      const onValueChange = vi.fn()
      renderNumberField({ onValueChange })

      fireEvent.input(screen.getByTestId('input'), { target: { value: '12' } })
      expect(onValueChange.mock.calls[0][1].reason).toBe('input-change')
    })

    it('includes the reason when clearing the value', () => {
      const onValueChange = vi.fn()
      renderNumberField({ defaultValue: 5, onValueChange })

      fireEvent.input(screen.getByTestId('input'), { target: { value: '' } })
      expect(onValueChange.mock.calls[0][1].reason).toBe('input-clear')
    })

    it('includes the reason for keyboard increments', () => {
      const onValueChange = vi.fn()
      renderNumberField({ defaultValue: 1, onValueChange })

      fireEvent.keyDown(screen.getByTestId('input'), { key: 'ArrowUp' })
      expect(onValueChange.mock.calls[0][1].reason).toBe('keyboard')
    })

    it('includes the reason for increment and decrement button presses', () => {
      const onValueChange = vi.fn()
      renderNumberField({ defaultValue: 1, onValueChange })

      fireEvent.click(screen.getByTestId('increment'))
      expect(onValueChange.mock.calls.at(-1)![1].reason).toBe('increment-press')

      fireEvent.click(screen.getByTestId('decrement'))
      expect(onValueChange.mock.calls.at(-1)![1].reason).toBe('decrement-press')
    })

    it('supports cancelable onValueChange', () => {
      renderNumberField({
        defaultValue: 0,
        onValueChange: (_value, details) => {
          details.cancel()
        },
      })

      fireEvent.click(screen.getByTestId('increment'))
      expect(screen.getByTestId('input').value).toBe('0')
    })
  })

  describe('prop: onValueCommitted', () => {
    it('calls onValueCommitted after button press', () => {
      const onValueCommitted = vi.fn()
      renderNumberField({ defaultValue: 0, onValueCommitted })

      fireEvent.click(screen.getByTestId('increment'))
      expect(onValueCommitted).toHaveBeenCalled()
      expect(onValueCommitted.mock.calls[0][0]).toBe(1)
    })
  })

  describe('prop: disabled', () => {
    it('disables the input', () => {
      renderNumberField({ disabled: true })
      expect(screen.getByTestId('input')).toBeDisabled()
    })
  })

  describe('prop: readOnly', () => {
    it('marks the input as readOnly', () => {
      renderNumberField({ readOnly: true })
      expect(screen.getByTestId('input')).toHaveAttribute('readonly')
    })

    it('does not render aria-readonly on stepper buttons', () => {
      renderNumberField({ readOnly: true })
      const increment = screen.getByTestId('increment')
      const decrement = screen.getByTestId('decrement')

      expect(increment).not.toHaveAttribute('aria-readonly')
      expect(decrement).not.toHaveAttribute('aria-readonly')
      expect(increment).toHaveAttribute('aria-disabled', 'true')
      expect(decrement).toHaveAttribute('aria-disabled', 'true')
    })

    it('keeps focus state in sync on a readOnly field', () => {
      render(() => (
        <Field.Root>
          <NumberField.Root readOnly>
            <NumberField.Input data-testid="input" />
          </NumberField.Root>
        </Field.Root>
      ))

      const input = screen.getByTestId('input')
      fireEvent.focus(input)
      expect(input).toHaveAttribute('data-focused', '')
      fireEvent.blur(input)
      expect(input).not.toHaveAttribute('data-focused')
    })
  })

  describe('prop: required', () => {
    it('marks the input as required', () => {
      renderNumberField({ required: true })
      expect(screen.getByTestId('input')).toHaveAttribute('required')
    })
  })

  describe('prop: name', () => {
    it('sets the name attribute on the hidden input', () => {
      const { container } = render(() => (
        <NumberField.Root name="amount" defaultValue={3}>
          <NumberField.Input />
        </NumberField.Root>
      ))

      const hidden = container.querySelector(
        'input[type="number"]'
      ) as HTMLInputElement
      expect(hidden).toBeTruthy()
      expect(hidden.name).toBe('amount')
      expect(hidden.value).toBe('3')
      expect(hidden).toHaveAttribute('aria-hidden', 'true')
    })

    it('marks the hidden input readOnly when the field is readOnly', () => {
      const { container } = render(() => (
        <NumberField.Root name="test" readOnly>
          <NumberField.Input />
        </NumberField.Root>
      ))

      const hidden = container.querySelector(
        'input[type="number"]'
      ) as HTMLInputElement
      expect(hidden).toHaveAttribute('readonly')
    })
  })

  describe('prop: min', () => {
    it('clamps typed values below min while showing the raw text', () => {
      const onValueChange = vi.fn()
      const [value, valueAssign] = createSignal<number | null>(5)

      render(() => (
        <NumberField.Root
          value={value()}
          min={5}
          onValueChange={(next, details) => {
            onValueChange(next, details)
            if (!details.isCanceled) {
              valueAssign(next)
            }
          }}
        >
          <NumberField.Input data-testid="input" />
        </NumberField.Root>
      ))

      fireEvent.input(screen.getByTestId('input'), { target: { value: '4' } })
      expect(screen.getByTestId('input').value).toBe('4')
      expect(onValueChange.mock.calls[0][0]).toBe(5)
    })

    it('allows values above min', () => {
      const onValueChange = vi.fn()
      const [value, valueAssign] = createSignal<number | null>(5)

      render(() => (
        <NumberField.Root
          value={value()}
          min={5}
          onValueChange={(next, details) => {
            onValueChange(next, details)
            if (!details.isCanceled) {
              valueAssign(next)
            }
          }}
        >
          <NumberField.Input data-testid="input" />
        </NumberField.Root>
      ))

      fireEvent.input(screen.getByTestId('input'), { target: { value: '6' } })
      expect(screen.getByTestId('input').value).toBe('6')
      expect(onValueChange.mock.calls[0][0]).toBe(6)
    })
  })

  describe('prop: max', () => {
    it('clamps typed values above max while showing the raw text', () => {
      const onValueChange = vi.fn()
      const [value, valueAssign] = createSignal<number | null>(5)

      render(() => (
        <NumberField.Root
          value={value()}
          max={5}
          onValueChange={(next, details) => {
            onValueChange(next, details)
            if (!details.isCanceled) {
              valueAssign(next)
            }
          }}
        >
          <NumberField.Input data-testid="input" />
        </NumberField.Root>
      ))

      fireEvent.input(screen.getByTestId('input'), { target: { value: '6' } })
      expect(screen.getByTestId('input').value).toBe('6')
      expect(onValueChange.mock.calls[0][0]).toBe(5)
    })

    it('allows values below max', () => {
      const onValueChange = vi.fn()
      const [value, valueAssign] = createSignal<number | null>(5)

      render(() => (
        <NumberField.Root
          value={value()}
          max={5}
          onValueChange={(next, details) => {
            onValueChange(next, details)
            if (!details.isCanceled) {
              valueAssign(next)
            }
          }}
        >
          <NumberField.Input data-testid="input" />
        </NumberField.Root>
      ))

      fireEvent.input(screen.getByTestId('input'), { target: { value: '4' } })
      expect(screen.getByTestId('input').value).toBe('4')
      expect(onValueChange.mock.calls[0][0]).toBe(4)
    })
  })

  describe('prop: allowOutOfRange', () => {
    it('allows typing out of range when true', () => {
      const onValueChange = vi.fn()
      render(() => (
        <NumberField.Root max={5} allowOutOfRange onValueChange={onValueChange}>
          <NumberField.Input data-testid="input" />
        </NumberField.Root>
      ))

      fireEvent.input(screen.getByTestId('input'), { target: { value: '6' } })
      expect(screen.getByTestId('input').value).toBe('6')
      expect(onValueChange.mock.calls[0][0]).toBe(6)
    })

    it('still clamps step interactions when true', () => {
      renderNumberField({ defaultValue: 5, max: 5, allowOutOfRange: true })
      fireEvent.click(screen.getByTestId('increment'))
      expect(screen.getByTestId('input').value).toBe('5')
    })

    it('clamps typed values when false', () => {
      const onValueChange = vi.fn()
      render(() => (
        <NumberField.Root
          max={5}
          allowOutOfRange={false}
          onValueChange={onValueChange}
        >
          <NumberField.Input data-testid="input" />
        </NumberField.Root>
      ))

      fireEvent.input(screen.getByTestId('input'), { target: { value: '6' } })
      expect(onValueChange.mock.calls[0][0]).toBe(5)
    })
  })

  describe('prop: step', () => {
    it('defaults to 1', () => {
      renderNumberField({ defaultValue: 5 })
      fireEvent.click(screen.getByTestId('increment'))
      expect(screen.getByTestId('input').value).toBe('6')
    })

    it('increments and decrements by the step prop', () => {
      renderNumberField({ defaultValue: 4, step: 2 })
      fireEvent.click(screen.getByTestId('increment'))
      expect(screen.getByTestId('input').value).toBe('6')
      fireEvent.click(screen.getByTestId('decrement'))
      expect(screen.getByTestId('input').value).toBe('4')
    })

    it('snaps when snapOnStep is true', () => {
      renderNumberField({ defaultValue: 5, step: 2, snapOnStep: true })
      fireEvent.click(screen.getByTestId('increment'))
      expect(screen.getByTestId('input').value).toBe('6')
      fireEvent.click(screen.getByTestId('decrement'))
      expect(screen.getByTestId('input').value).toBe('4')
    })
  })

  describe('prop: min/max button clamp', () => {
    it('respects min and max on increment/decrement', () => {
      renderNumberField({ defaultValue: 0, min: 0, max: 1 })

      fireEvent.click(screen.getByTestId('increment'))
      expect(screen.getByTestId('input').value).toBe('1')
      expect(screen.getByTestId('increment')).toBeDisabled()

      fireEvent.click(screen.getByTestId('decrement'))
      expect(screen.getByTestId('input').value).toBe('0')
      expect(screen.getByTestId('decrement')).toBeDisabled()
    })
  })

  describe('Field', () => {
    it('associates with Field.Label and inherits disabled', () => {
      render(() => (
        <Field.Root name="qty" disabled>
          <Field.Label>Quantity</Field.Label>
          <NumberField.Root defaultValue={1}>
            <NumberField.Input data-testid="input" />
          </NumberField.Root>
        </Field.Root>
      ))

      const input = screen.getByTestId('input')
      expect(input).toBeDisabled()
      expect(screen.getByLabelText('Quantity')).toBe(input)
    })

    it('inherits Field.Root name onto the hidden input', () => {
      const { container } = render(() => (
        <Field.Root name="qty">
          <NumberField.Root defaultValue={2}>
            <NumberField.Input />
          </NumberField.Root>
        </Field.Root>
      ))

      const hidden = container.querySelector(
        'input[type="number"]'
      ) as HTMLInputElement
      expect(hidden.name).toBe('qty')
    })

    it('sets data-touched after blur', () => {
      render(() => (
        <Field.Root>
          <NumberField.Root>
            <NumberField.Input data-testid="input" />
          </NumberField.Root>
        </Field.Root>
      ))

      const input = screen.getByTestId('input')
      fireEvent.focus(input)
      fireEvent.blur(input)
      expect(input).toHaveAttribute('data-touched', '')
    })

    it('sets data-dirty on the root and data-filled on the input while typing', async () => {
      render(() => (
        <Field.Root>
          <NumberField.Root data-testid="root">
            <NumberField.Input data-testid="input" />
          </NumberField.Root>
        </Field.Root>
      ))

      const input = screen.getByTestId('input')
      expect(screen.getByTestId('root')).not.toHaveAttribute('data-dirty')

      input.value = '1'
      fireEvent.input(input)
      expect(screen.getByTestId('root')).toHaveAttribute('data-dirty', '')

      await waitFor(() => {
        expect(screen.getByTestId('input')).toHaveAttribute('data-filled', '')
      })

      const inputAfter = screen.getByTestId('input')
      inputAfter.value = ''
      fireEvent.input(inputAfter)

      await waitFor(() => {
        expect(screen.getByTestId('input')).not.toHaveAttribute('data-filled')
      })
    })

    it('sets data-focused on focus', () => {
      render(() => (
        <Field.Root>
          <NumberField.Root>
            <NumberField.Input data-testid="input" />
          </NumberField.Root>
        </Field.Root>
      ))

      const input = screen.getByTestId('input')
      fireEvent.focus(input)
      expect(input).toHaveAttribute('data-focused', '')
      fireEvent.blur(input)
      expect(input).not.toHaveAttribute('data-focused')
    })

    it('validates with validationMode onBlur', async () => {
      render(() => (
        <Field.Root validationMode="onBlur" validate={() => 'error'}>
          <NumberField.Root>
            <NumberField.Input data-testid="input" />
          </NumberField.Root>
          <Field.Error data-testid="error" />
        </Field.Root>
      ))

      const input = screen.getByTestId('input')
      expect(screen.queryByTestId('error')).toBeNull()

      fireEvent.focus(input)
      input.value = '3'
      fireEvent.input(input)
      fireEvent.blur(input)

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('error')
      })
    })

    it('validates with validationMode onChange', async () => {
      render(() => (
        <Field.Root
          validationMode="onChange"
          validate={value => (value === 1 ? 'error' : null)}
        >
          <NumberField.Root>
            <NumberField.Input data-testid="input" />
          </NumberField.Root>
          <Field.Error data-testid="error" />
        </Field.Root>
      ))

      const input = screen.getByTestId('input')
      expect(screen.queryByTestId('error')).toBeNull()

      input.value = '1'
      fireEvent.input(input)

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('error')
      })
    })

    it('exposes Field.Validity data after onBlur validation', async () => {
      const handleValidity = vi.fn()

      render(() => (
        <Field.Root validationMode="onBlur" validate={() => 'bad'}>
          <NumberField.Root>
            <NumberField.Input data-testid="input" />
          </NumberField.Root>
          <Field.Validity>{handleValidity}</Field.Validity>
        </Field.Root>
      ))

      const input = screen.getByTestId('input')
      fireEvent.focus(input)
      fireEvent.input(input, { target: { value: '3' } })
      fireEvent.blur(input)

      await waitFor(() => {
        expect(handleValidity.mock.lastCall?.[0].error).toBe('bad')
        expect(handleValidity.mock.lastCall?.[0].errors).toEqual(['bad'])
      })
    })

    it('composes Field.Description with external aria-describedby', () => {
      render(() => (
        <Field.Root>
          <NumberField.Root>
            <NumberField.Input
              data-testid="input"
              aria-describedby="external-description"
            />
          </NumberField.Root>
          <Field.Description>Helpful hint</Field.Description>
        </Field.Root>
      ))

      const describedBy = screen
        .getByTestId('input')
        .getAttribute('aria-describedby')
      expect(describedBy).toBe(
        `external-description ${screen.getByText('Helpful hint').id}`
      )
    })
  })

  describe('Form', () => {
    it('clears external errors on change', async () => {
      render(() => (
        <FormErrorsProvider errors={{ quantity: 'server error' }}>
          <Field.Root name="quantity">
            <NumberField.Root defaultValue={1}>
              <NumberField.Input data-testid="input" />
            </NumberField.Root>
            <Field.Error data-testid="error" />
          </Field.Root>
        </FormErrorsProvider>
      ))

      const input = screen.getByTestId('input')
      expect(screen.getByTestId('error')).toHaveTextContent('server error')

      input.value = '5'
      fireEvent.input(input)

      await waitFor(() => {
        expect(screen.queryByTestId('error')).toBeNull()
      })
    })

    it('clears external errors when incrementing after Form errors', async () => {
      render(() => (
        <FormErrorsProvider errors={{ quantity: 'server error' }}>
          <Field.Root name="quantity">
            <NumberField.Root defaultValue={1}>
              <NumberField.Input data-testid="input" />
              <NumberField.Increment data-testid="increment">
                +
              </NumberField.Increment>
            </NumberField.Root>
            <Field.Error data-testid="error" />
          </Field.Root>
        </FormErrorsProvider>
      ))

      expect(screen.getByTestId('error')).toHaveTextContent('server error')
      fireEvent.click(screen.getByTestId('increment'))

      await waitFor(() => {
        expect(screen.queryByTestId('error')).toBeNull()
      })
    })

    it('handles browser autofill via the hidden number input', () => {
      const onValueChange = vi.fn()
      const { container } = render(() => (
        <Field.Root name="quantity">
          <NumberField.Root onValueChange={onValueChange}>
            <NumberField.Input data-testid="input" />
          </NumberField.Root>
        </Field.Root>
      ))

      const hidden = container.querySelector(
        'input[type="number"][name="quantity"]'
      ) as HTMLInputElement
      fireEvent.change(hidden, { target: { value: '42' } })

      expect(onValueChange.mock.calls[0][0]).toBe(42)
      expect(screen.getByTestId('input').value).toBe('42')
    })
  })
})
function renderNumberField(props: Parameters<typeof NumberField.Root>[0] = {}) {
  return render(() => (
    <NumberField.Root {...props}>
      <NumberField.Group>
        <NumberField.Decrement data-testid="decrement">-</NumberField.Decrement>
        <NumberField.Input data-testid="input" />
        <NumberField.Increment data-testid="increment">+</NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  ))
}
