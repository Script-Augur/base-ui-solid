import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Field } from '../index'

afterEach(() => {
  cleanup()
})

describe('<Field.Label />', () => {
  it('should set htmlFor referencing the control automatically', () => {
    render(() => (
      <Field.Root data-testid="field">
        <Field.Control />
        <Field.Label data-testid="label">Label</Field.Label>
      </Field.Root>
    ))

    expect(screen.getByTestId('label')).toHaveAttribute(
      'for',
      screen.getByRole('textbox').id
    )
  })

  it('when nativeLabel={false}, clicking focuses the associated control', () => {
    render(() => (
      <Field.Root>
        <Field.Control data-testid="control" />
        <Field.Label nativeLabel={false} render="div" data-testid="label">
          Label
        </Field.Label>
      </Field.Root>
    ))

    const label = screen.getByTestId('label')
    const control = screen.getByTestId('control')

    expect(label).not.toHaveAttribute('for')

    fireEvent.click(label)
    expect(control).toHaveFocus()
  })

  it('reflects the disabled state from Field.Item', () => {
    render(() => (
      <Field.Root>
        <Field.Item disabled>
          <Field.Label data-testid="label">Label</Field.Label>
        </Field.Item>
      </Field.Root>
    ))

    expect(screen.getByTestId('label')).toHaveAttribute('data-disabled')
  })

  describe('dev warnings', () => {
    it('does not warn by default', () => {
      const errorSpy = vi
        .spyOn(console, 'error')
        .mockName('console.error')
        .mockImplementation(() => {})

      render(() => (
        <Field.Root>
          <Field.Control />
          <Field.Label>Label</Field.Label>
        </Field.Root>
      ))

      expect(errorSpy).not.toHaveBeenCalled()
      errorSpy.mockRestore()
    })

    it('errors if nativeLabel=true but ref is not a label', () => {
      const errorSpy = vi
        .spyOn(console, 'error')
        .mockName('console.error')
        .mockImplementation(() => {})

      try {
        render(() => (
          <Field.Root>
            <Field.Control />
            <Field.Label nativeLabel render="div">
              Label
            </Field.Label>
          </Field.Root>
        ))

        expect(errorSpy).toHaveBeenCalledTimes(1)
        expect(errorSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            'Base UI: <Field.Label> expected a <label> element because the `nativeLabel` prop is true.'
          )
        )
      } finally {
        errorSpy.mockRestore()
      }
    })

    it('errors if nativeLabel=false but ref is a label', () => {
      const errorSpy = vi
        .spyOn(console, 'error')
        .mockName('console.error')
        .mockImplementation(() => {})

      try {
        render(() => (
          <Field.Root>
            <Field.Control />
            <Field.Label nativeLabel={false}>Label</Field.Label>
          </Field.Root>
        ))

        expect(errorSpy).toHaveBeenCalledTimes(1)
        expect(errorSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            'Base UI: <Field.Label> expected a non-<label> element because the `nativeLabel` prop is false.'
          )
        )
      } finally {
        errorSpy.mockRestore()
      }
    })
  })
})
