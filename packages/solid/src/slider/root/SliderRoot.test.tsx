/**
 * Port of @base-ui/react Slider root tests (v1.7.0).
 * Skips documented in ../UPSTREAM_TEST_PARITY.md
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

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

  it('supports controlled values', () => {
    const [value, valueAssign] = createSignal(10)
    const onValueChange = vi.fn((next: number) => valueAssign(next))

    render(() => (
      <BasicSlider value={value()} onValueChange={onValueChange} />
    ))

    const input = screen.getByRole<HTMLInputElement>('slider')
    expect(input.value).toBe('10')

    fireEvent.input(input, { target: { value: '40' } })
    // range inputs fire change with valueAsNumber via onChange in our port
    fireEvent.change(input, { target: { value: '40', valueAsNumber: 40 } })

    expect(onValueChange).toHaveBeenCalled()
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
    expect(() =>
      render(() => <Slider.Thumb />)
    ).toThrow(/SliderRootContext is missing/)
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
})
function BasicSlider(props: {
  defaultValue?: number
  value?: number
  onValueChange?: (value: number) => void
  disabled?: boolean
  min?: number
  max?: number
  step?: number
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
