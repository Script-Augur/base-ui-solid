/**
 * Port of @base-ui/react Slider value / label / indicator smoke tests (v1.7.0).
 * Skips documented in ../UPSTREAM_TEST_PARITY.md
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Slider } from '../index'

afterEach(() => {
  cleanup()
})

describe('SliderValue', () => {
  it('renders formatted values in an output', () => {
    render(() => (
      <Slider.Root defaultValue={42}>
        <Slider.Value data-testid="value" />
        <Slider.Control>
          <Slider.Thumb />
        </Slider.Control>
      </Slider.Root>
    ))

    const output = screen.getByTestId('value')
    expect(output.tagName).toBe('OUTPUT')
    expect(output.textContent).toContain('42')
  })

  it('supports a children render function', () => {
    render(() => (
      <Slider.Root defaultValue={[10, 90]}>
        <Slider.Value data-testid="value">
          {(formatted, values) => (
            <span>
              {formatted.join('/')} ({values.join(',')})
            </span>
          )}
        </Slider.Value>
        <Slider.Control>
          <Slider.Thumb index={0} />
          <Slider.Thumb index={1} />
        </Slider.Control>
      </Slider.Root>
    ))

    expect(screen.getByTestId('value').textContent).toContain('10')
    expect(screen.getByTestId('value').textContent).toContain('90')
  })
})

describe('SliderLabel', () => {
  it('associates the label with the slider group', () => {
    render(() => (
      <Slider.Root defaultValue={5}>
        <Slider.Label>Volume</Slider.Label>
        <Slider.Control>
          <Slider.Thumb />
        </Slider.Control>
      </Slider.Root>
    ))

    expect(screen.getByText('Volume')).toBeTruthy()
    const group = screen.getByRole('group')
    expect(group.getAttribute('aria-labelledby')).toBeTruthy()
  })
})

describe('SliderIndicator', () => {
  it('renders an indicator with width based on value', () => {
    render(() => (
      <Slider.Root defaultValue={50} min={0} max={100}>
        <Slider.Control>
          <Slider.Track>
            <Slider.Indicator data-testid="indicator" />
            <Slider.Thumb />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    ))

    const indicator = screen.getByTestId('indicator')
    expect(indicator.style.width).toBe('50%')
  })
})

describe('SliderThumb', () => {
  it('forwards keyboard Home/End to min/max', () => {
    const onValueChange = vi.fn()
    const onKeyDown = vi.fn()
    render(() => (
      <Slider.Root
        defaultValue={40}
        min={0}
        max={100}
        onValueChange={onValueChange}
      >
        <Slider.Control>
          <Slider.Thumb onKeyDown={onKeyDown} />
        </Slider.Control>
      </Slider.Root>
    ))

    const input = screen.getByRole<HTMLInputElement>('slider')
    input.focus()
    fireEvent.keyDown(input, { key: 'Home' })
    expect(onKeyDown).toHaveBeenCalled()
    expect(onValueChange).toHaveBeenCalled()
    expect(onValueChange.mock.calls[0]![0]).toBe(0)
    expect(Number(input.value)).toBe(0)

    fireEvent.keyDown(input, { key: 'End' })
    expect(onValueChange.mock.calls.at(-1)![0]).toBe(100)
    expect(Number(input.value)).toBe(100)
  })
})

