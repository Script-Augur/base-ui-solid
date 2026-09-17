/**
 * Port of `@base-ui/react` Radio.Root tests (v1.7.0).
 * Skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RadioGroup } from '../../radio-group'
import { Radio } from '../index'

afterEach(() => {
  cleanup()
})

describe('<Radio.Root />', () => {
  it('does not forward `value` prop', () => {
    render(() => (
      <RadioGroup>
        <Radio.Root value="test" data-testid="radio-root" />
      </RadioGroup>
    ))

    expect(screen.getByTestId('radio-root')).not.toHaveAttribute('value')
  })

  it('allows `null` value', () => {
    render(() => (
      <RadioGroup>
        <Radio.Root value={null} data-testid="radio-null" />
        <Radio.Root value="a" data-testid="radio-a" />
      </RadioGroup>
    ))

    const radioNull = screen.getByTestId('radio-null')
    const radioA = screen.getByTestId('radio-a')
    fireEvent.click(radioNull)
    expect(radioNull).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(radioA)
    expect(radioNull).toHaveAttribute('aria-checked', 'false')
  })

  it('associates `id` with the native button when `nativeButton=true`', () => {
    render(() => (
      <div>
        <label data-testid="label" for="myRadio">
          A
        </label>

        <RadioGroup defaultValue="b">
          <Radio.Root
            value="a"
            id="myRadio"
            nativeButton
            render="button"
            data-testid="a"
          />
          <Radio.Root value="b" data-testid="b" />
        </RadioGroup>
      </div>
    ))

    const radioA = screen.getByTestId('a')
    expect(radioA).toHaveAttribute('id', 'myRadio')

    const hiddenInput = radioA.nextElementSibling as HTMLInputElement | null
    expect(hiddenInput?.tagName).toBe('INPUT')
    expect(hiddenInput).not.toHaveAttribute('id', 'myRadio')

    expect(radioA).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(screen.getByTestId('label'))
    expect(radioA).toHaveAttribute('aria-checked', 'true')
  })

  it('sets `aria-labelledby` from a sibling label associated with the hidden input', () => {
    render(() => (
      <div>
        <label for="radio-input">Label</label>
        <RadioGroup>
          <Radio.Root value="a" id="radio-input" />
        </RadioGroup>
      </div>
    ))

    const label = screen.getByText('Label')
    expect(label.id).not.toBe('')
    expect(screen.getByRole('radio')).toHaveAttribute(
      'aria-labelledby',
      label.id
    )
  })

  it('updates fallback `aria-labelledby` when the hidden input id changes', async () => {
    function TestCase() {
      const [id, idAssign] = createSignal('radio-input-a')
      return (
        <>
          <label for="radio-input-a">Label A</label>
          <label for="radio-input-b">Label B</label>
          <RadioGroup>
            <Radio.Root value="a" id={id()} />
          </RadioGroup>
          <button type="button" onClick={() => idAssign('radio-input-b')}>
            Toggle
          </button>
        </>
      )
    }

    render(() => <TestCase />)

    const radio = screen.getByRole('radio')
    const labelA = screen.getByText('Label A')
    expect(labelA.id).not.toBe('')
    expect(radio).toHaveAttribute('aria-labelledby', labelA.id)

    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))

    await waitFor(() => {
      const labelB = screen.getByText('Label B')
      expect(labelB.id).not.toBe('')
      expect(labelA.id).not.toBe(labelB.id)
      expect(radio).toHaveAttribute('aria-labelledby', labelB.id)
    })
  })

  describe('prop: onClick', () => {
    it('propagates a single click event to ancestors per user click', () => {
      const handleParentClick = vi.fn()
      render(() => (
        <RadioGroup>
          <div onClick={handleParentClick}>
            <Radio.Root value="a" data-testid="radio" />
          </div>
        </RadioGroup>
      ))

      fireEvent.click(screen.getByTestId('radio'))

      expect(handleParentClick).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('radio')).toHaveAttribute(
        'aria-checked',
        'true'
      )
    })

    it('does not propagate to ancestors when stopPropagation() is called', () => {
      const handleParentClick = vi.fn()
      render(() => (
        <RadioGroup>
          <div onClick={handleParentClick}>
            <Radio.Root
              value="a"
              data-testid="radio"
              onClick={event => event.stopPropagation()}
            />
          </div>
        </RadioGroup>
      ))

      fireEvent.click(screen.getByTestId('radio'))

      expect(handleParentClick).toHaveBeenCalledTimes(0)
      expect(screen.getByTestId('radio')).toHaveAttribute(
        'aria-checked',
        'true'
      )
    })

    it('propagates a single click event to ancestors with a native button', () => {
      const handleParentClick = vi.fn()
      render(() => (
        <RadioGroup>
          <div onClick={handleParentClick}>
            <Radio.Root
              value="a"
              nativeButton
              render="button"
              data-testid="radio"
            />
          </div>
        </RadioGroup>
      ))

      fireEvent.click(screen.getByTestId('radio'))

      expect(handleParentClick).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('radio')).toHaveAttribute(
        'aria-checked',
        'true'
      )
    })
  })

  describe('prop: disabled', () => {
    it('should render a disabled radio', () => {
      render(() => (
        <RadioGroup>
          <Radio.Root value="a" disabled data-testid="radio" />
        </RadioGroup>
      ))

      expect(screen.getByTestId('radio')).toHaveAttribute(
        'aria-disabled',
        'true'
      )
    })
  })
})
