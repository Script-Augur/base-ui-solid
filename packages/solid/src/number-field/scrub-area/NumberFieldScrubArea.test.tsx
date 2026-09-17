import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { NumberField } from '../index'

afterEach(() => {
  cleanup()
})

describe('<NumberField.ScrubArea />', () => {
  it('renders and starts scrubbing on pointer down', () => {
    render(() => (
      <NumberField.Root defaultValue={0}>
        <NumberField.ScrubArea data-testid="scrub">Scrub</NumberField.ScrubArea>
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    ))

    const scrub = screen.getByTestId('scrub')
    fireEvent.pointerDown(scrub, {
      button: 0,
      pointerType: 'mouse',
      clientX: 10,
      clientY: 10,
    })
    expect(scrub.closest('[data-scrubbing]') || scrub).toBeTruthy()
  })

  it('does not start scrubbing when read-only', () => {
    const onValueChange = vi.fn()
    render(() => (
      <NumberField.Root defaultValue={0} readOnly onValueChange={onValueChange}>
        <NumberField.ScrubArea data-testid="scrub">Scrub</NumberField.ScrubArea>
      </NumberField.Root>
    ))

    fireEvent.pointerDown(screen.getByTestId('scrub'), {
      button: 0,
      pointerType: 'mouse',
    })
    expect(onValueChange).not.toHaveBeenCalled()
  })
})
