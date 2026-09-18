/**
 * Port of @base-ui/react Slider root tests (v1.7.0).
 * Skips documented in ../UPSTREAM_TEST_PARITY.md
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Field } from '../../field'
import { flushMicrotasks, waitFor } from '../../field/test-utils'
import { Form } from '../../form'
import { REASONS } from '../../internals/createChangeEventDetails'
import { Slider } from '../index'

afterEach(() => {
  cleanup()
})

describe('SliderRoot', () => {
  it('renders a group with a range input', () => {
    render(() => <BasicSlider defaultValue={30} />)

    expect(screen.getByRole('group')).toBeTruthy()
    const input = screen.getByRole<HTMLInputElement>('slider')
    expect(input.type).toBe('range')
    expect(input.value).toBe('30')
  })

  it('supports controlled values and updates the DOM value', async () => {
    const [value, valueAssign] = createSignal(10)
    const onValueChange = vi.fn(
      (
        next: number,
        details: { reason: string; cancel: () => void; isCanceled: boolean }
      ) => {
        valueAssign(next)
        return details
      }
    )

    render(() => (
      <BasicSlider value={value()} onValueChange={onValueChange} />
    ))

    const input = screen.getByRole<HTMLInputElement>('slider')
    expect(input.value).toBe('10')

    fireEvent.change(input, { target: { value: '40', valueAsNumber: 40 } })
    await flushMicrotasks()

    expect(onValueChange).toHaveBeenCalled()
    const [nextValue, details] = onValueChange.mock.calls[0]!
    expect(nextValue).toBe(40)
    expect(details.reason).toBe(REASONS.inputChange)
    expect(value()).toBe(40)
    expect(input.value).toBe('40')
  })

  it('commits onValueCommitted with the change reason', () => {
    const onValueChange = vi.fn()
    const onValueCommitted = vi.fn()

    render(() => (
      <BasicSlider
        defaultValue={10}
        onValueChange={onValueChange}
        onValueCommitted={onValueCommitted}
      />
    ))

    const input = screen.getByRole<HTMLInputElement>('slider')
    fireEvent.change(input, { target: { value: '55', valueAsNumber: 55 } })

    expect(onValueChange).toHaveBeenCalledWith(
      55,
      expect.objectContaining({ reason: REASONS.inputChange })
    )
    expect(onValueCommitted).toHaveBeenCalledWith(
      55,
      expect.objectContaining({ reason: REASONS.inputChange })
    )
  })

  it('does not call onValueCommitted when onValueChange is canceled', () => {
    const onValueCommitted = vi.fn()

    render(() => (
      <BasicSlider
        defaultValue={10}
        onValueChange={(_value, details) => {
          details.cancel()
        }}
        onValueCommitted={onValueCommitted}
      />
    ))

    const input = screen.getByRole<HTMLInputElement>('slider')
    fireEvent.change(input, { target: { value: '50', valueAsNumber: 50 } })

    expect(input.value).toBe('10')
    expect(onValueCommitted).not.toHaveBeenCalled()
  })

  it('reports keyboard reason for Home/End', () => {
    const onValueChange = vi.fn()
    const onValueCommitted = vi.fn()

    render(() => (
      <BasicSlider
        defaultValue={40}
        onValueChange={onValueChange}
        onValueCommitted={onValueCommitted}
      />
    ))

    const input = screen.getByRole<HTMLInputElement>('slider')
    input.focus()
    fireEvent.keyDown(input, { key: 'Home' })

    expect(onValueChange.mock.calls[0]![0]).toBe(0)
    expect(onValueChange.mock.calls[0]![1].reason).toBe(REASONS.keyboard)
    expect(onValueCommitted.mock.calls[0]![1].reason).toBe(REASONS.keyboard)
  })

  it('marks the root disabled and disables the input', () => {
    render(() => <BasicSlider defaultValue={20} disabled />)

    const input = screen.getByRole<HTMLInputElement>('slider')
    expect(input.disabled).toBe(true)
    expect(screen.getByRole('group')).toHaveAttribute('data-disabled')
  })

  it('supports min, max, and step on the range input', () => {
    render(() => (
      <BasicSlider defaultValue={4} min={0} max={10} step={2} />
    ))

    const input = screen.getByRole<HTMLInputElement>('slider')
    expect(input.min).toBe('0')
    expect(input.max).toBe('10')
    expect(input.step).toBe('2')
  })

  it('renders a range slider with multiple thumbs', () => {
    render(() => (
      <Slider.Root defaultValue={[20, 60]}>
        <Slider.Control>
          <Slider.Track>
            <Slider.Indicator />
            <Slider.Thumb index={0} data-testid="thumb-0" />
            <Slider.Thumb index={1} data-testid="thumb-1" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    ))

    const inputs = screen.getAllByRole<HTMLInputElement>('slider')
    expect(inputs).toHaveLength(2)
    expect(inputs[0]!.value).toBe('20')
    expect(inputs[1]!.value).toBe('60')
  })

  it('throws when parts are used outside Root', () => {
    expect(() => render(() => <Slider.Thumb />)).toThrow(
      /SliderRootContext is missing/
    )
  })

  it('supports vertical orientation', () => {
    render(() => (
      <Slider.Root defaultValue={50} orientation="vertical">
        <Slider.Control>
          <Slider.Thumb />
        </Slider.Control>
      </Slider.Root>
    ))

    expect(screen.getByRole('group')).toHaveAttribute(
      'data-orientation',
      'vertical'
    )
    expect(screen.getByRole<HTMLInputElement>('slider')).toHaveAttribute(
      'aria-orientation',
      'vertical'
    )
  })

  it('cancels onValueChange when details.cancel() is called', () => {
    const onValueChange = vi.fn((_value, details) => {
      details.cancel()
    })

    render(() => (
      <BasicSlider defaultValue={10} onValueChange={onValueChange as never} />
    ))

    const input = screen.getByRole<HTMLInputElement>('slider')
    fireEvent.change(input, { target: { value: '50', valueAsNumber: 50 } })

    expect(onValueChange).toHaveBeenCalled()
    expect(input.value).toBe('10')
  })

  describe('Field', () => {
    it('marks the root data-dirty after a value change', async () => {
      render(() => (
        <Field.Root>
          <BasicSlider defaultValue={10} />
        </Field.Root>
      ))

      const group = screen.getByRole('group')
      expect(group).not.toHaveAttribute('data-dirty')

      fireEvent.change(screen.getByRole('slider'), {
        target: { value: '40', valueAsNumber: 40 },
      })
      await flushMicrotasks()

      expect(group).toHaveAttribute('data-dirty', '')
    })

    it('does not mark dirty on mount', () => {
      render(() => (
        <Field.Root>
          <BasicSlider defaultValue={25} />
        </Field.Root>
      ))

      expect(screen.getByRole('group')).not.toHaveAttribute('data-dirty')
    })

    it('receives disabled from Field.Root', () => {
      render(() => (
        <Field.Root disabled>
          <BasicSlider defaultValue={10} />
        </Field.Root>
      ))

      expect(screen.getByRole('slider')).toBeDisabled()
      expect(screen.getByRole('group')).toHaveAttribute('data-disabled')
    })

    it('receives name from Field.Root on the range input', () => {
      render(() => (
        <Field.Root name="volume">
          <BasicSlider defaultValue={10} />
        </Field.Root>
      ))

      expect(screen.getByRole('slider')).toHaveAttribute('name', 'volume')
    })
  })

  describe('Form', () => {
    it('clears external errors when the value changes', async () => {
      render(() => (
        <Form errors={{ volume: 'too loud' }}>
          <Field.Root name="volume">
            <BasicSlider defaultValue={10} />
            <Field.Error data-testid="error" />
          </Field.Root>
        </Form>
      ))

      expect(screen.getByTestId('error')).toHaveTextContent('too loud')
      expect(screen.getByRole('group')).toHaveAttribute('aria-invalid', 'true')

      fireEvent.change(screen.getByRole('slider'), {
        target: { value: '20', valueAsNumber: 20 },
      })
      await flushMicrotasks()

      expect(screen.queryByTestId('error')).toBe(null)
      expect(screen.getByRole('group')).not.toHaveAttribute('aria-invalid')
    })

    it('focuses the range input on invalid submit (not the Control div)', async () => {
      const select = vi.spyOn(HTMLInputElement.prototype, 'select')

      try {
        render(() => (
          <Form>
            <Field.Root
              name="volume"
              validate={() => 'invalid volume'}
              validationMode="onSubmit"
            >
              <BasicSlider defaultValue={10} />
              <Field.Error data-testid="error" />
            </Field.Root>
            <button type="submit">Submit</button>
          </Form>
        ))

        fireEvent.click(screen.getByText('Submit'))

        await waitFor(() => {
          expect(screen.getByTestId('error')).toHaveTextContent(
            'invalid volume'
          )
        })

        const input = screen.getByRole<HTMLInputElement>('slider')
        expect(input).toHaveFocus()
        expect(select).toHaveBeenCalled()
        expect(document.activeElement).toBe(input)
        expect(document.activeElement).not.toBe(
          screen.getByTestId('control')
        )
      } finally {
        select.mockRestore()
      }
    })
  })
})

function BasicSlider(props: {
  defaultValue?: number
  value?: number
  onValueChange?: (
    value: number,
    details: { reason: string; cancel: () => void; isCanceled: boolean }
  ) => void
  onValueCommitted?: (
    value: number | ReadonlyArray<number>,
    details: { reason: string }
  ) => void
  disabled?: boolean
  min?: number
  max?: number
  step?: number
  largeStep?: number
}) {
  return (
    <Slider.Root {...props}>
      <Slider.Control data-testid="control">
        <Slider.Track>
          <Slider.Indicator />
          <Slider.Thumb data-testid="thumb" />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  )
}
