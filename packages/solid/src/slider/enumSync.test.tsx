import { cleanup, render, screen } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'

import { SliderRootDataAttributes } from './root/SliderRootDataAttributes'
import { SliderThumbDataAttributes } from './thumb/SliderThumbDataAttributes'

import { Slider } from './index'

// The parts inline these enums' values instead of referencing the members, so
// nothing links the docs enums to runtime behavior. These tests re-link every
// inlined member so a rename to only one side fails CI.
describe('Slider enum sync', () => {
  afterEach(() => {
    cleanup()
  })

  it('names the thumb index attribute per SliderThumbDataAttributes', () => {
    render(() => (
      <Slider.Root>
        <Slider.Control>
          <Slider.Thumb data-testid="thumb" />
        </Slider.Control>
      </Slider.Root>
    ))

    expect(screen.getByTestId('thumb')).toHaveAttribute(
      SliderThumbDataAttributes.index,
      '0'
    )
  })

  it('names root orientation and disabled attributes', () => {
    render(() => (
      <Slider.Root orientation="vertical" disabled>
        <Slider.Control data-testid="control">
          <Slider.Thumb />
        </Slider.Control>
      </Slider.Root>
    ))

    const group = screen.getByRole('group')
    expect(group).toHaveAttribute(
      SliderRootDataAttributes.orientation,
      'vertical'
    )
    expect(group).toHaveAttribute(SliderRootDataAttributes.disabled)
    expect(screen.getByTestId('control')).toHaveAttribute(
      SliderRootDataAttributes.orientation,
      'vertical'
    )
  })
})
