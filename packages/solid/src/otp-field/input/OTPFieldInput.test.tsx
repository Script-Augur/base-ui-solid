import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { flushMicrotasks, waitFor } from '../../field/test-utils'
import { REASONS } from '../../internals/createChangeEventDetails'
import { DirectionProvider } from '../../internals/direction'
import { OTPField } from '../index'

afterEach(() => {
  cleanup()
})
const OTP_LENGTH = 4
describe('<OTPField.Input />', () => {
  describe('keyboard navigation', () => {
    it('moves focus with arrow keys', () => {
      render(() => <OTPFieldFixture defaultValue="12" />)
      const inputs = getInputs()

      inputs[1]!.focus()
      fireEvent.keyDown(inputs[1]!, { key: 'ArrowLeft' })
      expect(document.activeElement).toBe(inputs[0])

      fireEvent.keyDown(inputs[0]!, { key: 'ArrowRight' })
      expect(document.activeElement).toBe(inputs[1])
    })

    it('moves focus with Home and End', () => {
      render(() => <OTPFieldFixture defaultValue="12" />)
      const inputs = getInputs()

      inputs[1]!.focus()
      fireEvent.keyDown(inputs[1]!, { key: 'Home' })
      expect(document.activeElement).toBe(inputs[0])

      fireEvent.keyDown(inputs[0]!, { key: 'End' })
      expect(document.activeElement).toBe(inputs[2])
    })

    it('reverses horizontal arrows in RTL', () => {
      render(() => (
        <DirectionProvider direction="rtl">
          <OTPFieldFixture defaultValue="12" />
        </DirectionProvider>
      ))
      const inputs = getInputs()

      inputs[1]!.focus()
      fireEvent.keyDown(inputs[1]!, { key: 'ArrowRight' })
      expect(document.activeElement).toBe(inputs[0])

      fireEvent.keyDown(inputs[0]!, { key: 'ArrowLeft' })
      expect(document.activeElement).toBe(inputs[1])
    })
  })

  describe('backspace and delete', () => {
    it('clears the current character with Backspace', () => {
      const onValueChange = vi.fn()
      render(() => (
        <OTPFieldFixture defaultValue="12" onValueChange={onValueChange} />
      ))
      const inputs = getInputs()

      inputs[1]!.focus()
      fireEvent.keyDown(inputs[1]!, { key: 'Backspace' })

      expect(onValueChange).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ reason: REASONS.keyboard })
      )
    })

    it('moves back and clears the previous character when the slot is empty', () => {
      const onValueChange = vi.fn()
      render(() => (
        <OTPFieldFixture defaultValue="1" onValueChange={onValueChange} />
      ))
      const inputs = getInputs()

      inputs[1]!.focus()
      fireEvent.keyDown(inputs[1]!, { key: 'Backspace' })

      expect(onValueChange).toHaveBeenCalledWith(
        '',
        expect.objectContaining({ reason: REASONS.keyboard })
      )
    })

    it('clears the current character with Delete', () => {
      const onValueChange = vi.fn()
      render(() => (
        <OTPFieldFixture defaultValue="12" onValueChange={onValueChange} />
      ))
      const inputs = getInputs()

      inputs[0]!.focus()
      fireEvent.keyDown(inputs[0]!, { key: 'Delete' })

      expect(onValueChange).toHaveBeenCalledWith(
        '2',
        expect.objectContaining({ reason: REASONS.keyboard })
      )
    })

    it('clears the entire value with Ctrl+Backspace', () => {
      const onValueChange = vi.fn()
      render(() => (
        <OTPFieldFixture defaultValue="12" onValueChange={onValueChange} />
      ))
      const inputs = getInputs()

      inputs[1]!.focus()
      fireEvent.keyDown(inputs[1]!, { key: 'Backspace', ctrlKey: true })

      expect(onValueChange).toHaveBeenCalledWith(
        '',
        expect.objectContaining({ reason: REASONS.keyboard })
      )
    })
  })

  describe('typing', () => {
    it('replaces the current slot value on input', () => {
      render(() => <OTPFieldFixture defaultValue="1" />)
      const inputs = getInputs()

      fireEvent.input(inputs[0]!, { target: { value: '9' } })
      expect(inputs.map(input => input.value)).toEqual(['9', '', '', ''])
    })

    it('advances focus after accepting a character', async () => {
      render(() => <OTPFieldFixture />)
      const inputs = getInputs()

      inputs[0]!.focus()
      fireEvent.input(inputs[0]!, { target: { value: '1' } })
      await flushMicrotasks()

      await waitFor(() => {
        expect(document.activeElement).toBe(inputs[1])
      })
    })

    it('sets only the active slot tabIndex to 0', () => {
      render(() => <OTPFieldFixture defaultValue="12" />)
      const inputs = getInputs()

      expect(inputs[0]).toHaveAttribute('tabindex', '-1')
      expect(inputs[1]).toHaveAttribute('tabindex', '-1')
      expect(inputs[2]).toHaveAttribute('tabindex', '0')
      expect(inputs[3]).toHaveAttribute('tabindex', '-1')
    })
  })

  describe('mouse', () => {
    it('focuses the clicked slot when it is within the filled range', () => {
      render(() => <OTPFieldFixture defaultValue="12" />)
      const inputs = getInputs()

      fireEvent.mouseDown(inputs[1]!)
      expect(document.activeElement).toBe(inputs[1])
    })
  })

  describe('data attributes', () => {
    it('marks filled slots with data-filled', () => {
      render(() => <OTPFieldFixture defaultValue="1" />)
      const inputs = getInputs()

      expect(inputs[0]).toHaveAttribute('data-filled', '')
      expect(inputs[1]).not.toHaveAttribute('data-filled')
    })
  })
})
function OTPFieldFixture(
  props: Omit<Parameters<typeof OTPField.Root>[0], 'children' | 'length'> = {}
) {
  return (
    <OTPField.Root length={OTP_LENGTH} {...props}>
      <OTPField.Input />
      <OTPField.Input />
      <OTPField.Input />
      <OTPField.Input />
    </OTPField.Root>
  )
}
function getInputs() {
  return screen.getAllByRole<HTMLInputElement>('textbox')
}
