/**
 * Port of @base-ui/react Slider control smoke tests (v1.7.0).
 * Full pointer / touch / RTL geometry suites are skipped — see UPSTREAM_TEST_PARITY.md.
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { REASONS } from '../../internals/createChangeEventDetails'
import { Slider } from '../index'

afterEach(() => {
  cleanup()
})

describe('SliderControl', () => {
  it('renders the interactive control surface', () => {
    render(() => (
      <Slider.Root defaultValue={25}>
        <Slider.Control data-testid="control">
          <Slider.Track>
            <Slider.Thumb />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    ))

    expect(screen.getByTestId('control')).toBeTruthy()
  })

  it('mirrors root orientation and disabled data attributes', () => {
    render(() => (
      <Slider.Root defaultValue={25} orientation="vertical" disabled>
        <Slider.Control data-testid="control">
          <Slider.Thumb />
        </Slider.Control>
      </Slider.Root>
    ))

    const control = screen.getByTestId('control')
    expect(control).toHaveAttribute('data-orientation', 'vertical')
    expect(control).toHaveAttribute('data-disabled')
  })

  it('throws when used outside Root', () => {
    expect(() =>
      render(() => <Slider.Control />)
    ).toThrow(/SliderRootContext is missing/)
  })

  it('ignores non-primary pointer buttons', () => {
    const onValueChange = vi.fn()

    render(() => (
      <Slider.Root defaultValue={10} onValueChange={onValueChange}>
        <Slider.Control data-testid="control">
          <Slider.Thumb />
        </Slider.Control>
      </Slider.Root>
    ))

    fireEvent.pointerDown(screen.getByTestId('control'), {
      button: 2,
      pointerId: 1,
      clientX: 40,
      clientY: 0,
    })

    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('does not fire track-press when disabled', () => {
    const onValueChange = vi.fn()

    render(() => (
      <Slider.Root defaultValue={10} disabled onValueChange={onValueChange}>
        <Slider.Control data-testid="control">
          <Slider.Thumb />
        </Slider.Control>
      </Slider.Root>
    ))

    fireEvent.pointerDown(screen.getByTestId('control'), {
      button: 0,
      pointerId: 1,
      clientX: 40,
      clientY: 0,
    })

    expect(onValueChange).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ reason: REASONS.trackPress })
    )
    expect(onValueChange).not.toHaveBeenCalled()
  })
})
