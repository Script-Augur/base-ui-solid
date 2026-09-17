/**
 * Port of `@base-ui/react` RadioGroup tests (v1.7.0).
 * Skips documented in `./UPSTREAM_TEST_PARITY.md`.
 */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@solidjs/testing-library'
import { For, createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Field } from '../field'
import { flushMicrotasks } from '../field/test-utils'
import { Fieldset } from '../fieldset'
import { Form } from '../form'
import { Radio } from '../radio'

import { RadioGroup } from './index'

afterEach(() => {
  cleanup()
})

describe('<RadioGroup />', () => {
  describe('extra props', () => {
    it('can override the built-in attributes', () => {
      render(() => <RadioGroup data-testid="group" role="presentation" />)
      expect(screen.getByTestId('group')).toHaveAttribute(
        'role',
        'presentation'
      )
    })
  })

  describe('prop: id', () => {
    it('passes the id to the group element', () => {
      render(() => <RadioGroup id="test-group" data-testid="group" />)
      expect(screen.getByTestId('group')).toHaveAttribute('id', 'test-group')
    })
  })

  describe('prop: onValueChange', () => {
    it('is called when a radio is clicked', () => {
      const handleValueChange = vi.fn()
      render(() => (
        <RadioGroup onValueChange={handleValueChange}>
          <Radio.Root value="a" data-testid="a" />
          <Radio.Root value="b" data-testid="b" />
        </RadioGroup>
      ))

      fireEvent.click(screen.getByTestId('a'))
      expect(handleValueChange).toHaveBeenCalledTimes(1)
      expect(handleValueChange.mock.calls[0]?.[0]).toBe('a')
    })

    it('can be canceled', () => {
      render(() => (
        <RadioGroup
          defaultValue="b"
          onValueChange={(_value, details) => {
            details.cancel()
          }}
        >
          <Radio.Root value="a" data-testid="a" />
          <Radio.Root value="b" data-testid="b" />
        </RadioGroup>
      ))

      fireEvent.click(screen.getByTestId('a'))
      expect(screen.getByTestId('a')).toHaveAttribute('aria-checked', 'false')
      expect(screen.getByTestId('b')).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('prop: disabled', () => {
    it('disables radios in the group', () => {
      render(() => (
        <RadioGroup disabled>
          <Radio.Root value="a" data-testid="a" />
        </RadioGroup>
      ))

      expect(screen.getByTestId('a')).toHaveAttribute('data-disabled', '')
      expect(screen.getByRole('radiogroup')).toHaveAttribute(
        'aria-disabled',
        'true'
      )
    })
  })

  describe('prop: readOnly', () => {
    it('marks radios as readonly', () => {
      render(() => (
        <RadioGroup readOnly defaultValue="a">
          <Radio.Root value="a" data-testid="a" />
          <Radio.Root value="b" data-testid="b" />
        </RadioGroup>
      ))

      fireEvent.click(screen.getByTestId('b'))
      expect(screen.getByTestId('a')).toHaveAttribute('aria-checked', 'true')
      expect(screen.getByTestId('b')).toHaveAttribute('aria-checked', 'false')
    })
  })

  it('should update its state if the underlying input is toggled', () => {
    render(() => (
      <RadioGroup>
        <Radio.Root value="a" data-testid="a" />
      </RadioGroup>
    ))

    const radio = screen.getByTestId('a')
    const input = radio.nextElementSibling as HTMLInputElement
    fireEvent.click(input)
    expect(radio).toHaveAttribute('aria-checked', 'true')
  })

  it('should place the style hooks on the root and subcomponents', () => {
    render(() => (
      <RadioGroup defaultValue="a" disabled readOnly required>
        <Radio.Root value="a" data-testid="radio">
          <Radio.Indicator data-testid="indicator" keepMounted />
        </Radio.Root>
      </RadioGroup>
    ))

    const group = screen.getByRole('radiogroup')
    expect(group).toHaveAttribute('data-disabled', '')

    const radio = screen.getByTestId('radio')
    expect(radio).toHaveAttribute('data-checked', '')
    expect(radio).toHaveAttribute('data-disabled', '')
    expect(radio).toHaveAttribute('data-readonly', '')
    expect(radio).toHaveAttribute('data-required', '')

    expect(screen.getByTestId('indicator')).toHaveAttribute('data-checked', '')
  })

  it('should set the name attribute on each radio input', () => {
    render(() => (
      <RadioGroup name="test-group">
        <Radio.Root value="a" data-testid="a" />
        <Radio.Root value="b" data-testid="b" />
      </RadioGroup>
    ))

    const inputA = screen.getByTestId('a')
      .nextElementSibling as HTMLInputElement
    const inputB = screen.getByTestId('b')
      .nextElementSibling as HTMLInputElement
    expect(inputA.name).toBe('test-group')
    expect(inputB.name).toBe('test-group')
  })

  it('points inputRef to the checked radio input when present', () => {
    const inputRef: { current: HTMLInputElement | null } = { current: null }
    render(() => (
      <RadioGroup defaultValue="b" inputRef={inputRef}>
        <Radio.Root value="a" data-testid="a" />
        <Radio.Root value="b" data-testid="b" />
      </RadioGroup>
    ))

    const inputB = screen.getByTestId('b')
      .nextElementSibling as HTMLInputElement
    expect(inputRef.current).toBe(inputB)
  })

  it('supports inputRef as a function', () => {
    const handleInputRef = vi.fn()
    render(() => (
      <RadioGroup defaultValue="a" inputRef={handleInputRef}>
        <Radio.Root value="a" data-testid="a" />
      </RadioGroup>
    ))

    const inputA = screen.getByTestId('a')
      .nextElementSibling as HTMLInputElement
    expect(handleInputRef).toHaveBeenCalledWith(inputA)
  })

  it('skips disabled radios when assigning inputRef', () => {
    const inputRef: { current: HTMLInputElement | null } = { current: null }
    render(() => (
      <RadioGroup inputRef={inputRef}>
        <Radio.Root value="a" disabled data-testid="a" />
        <Radio.Root value="b" data-testid="b" />
      </RadioGroup>
    ))

    const inputB = screen.getByTestId('b')
      .nextElementSibling as HTMLInputElement
    expect(inputRef.current).toBe(inputB)
  })

  it('does not forward `value` prop', () => {
    render(() => (
      <RadioGroup value="a" data-testid="group">
        <Radio.Root value="a" />
      </RadioGroup>
    ))
    expect(screen.getByTestId('group')).not.toHaveAttribute('value')
  })

  it('sets tabIndex=0 to the correct element initially', async () => {
    render(() => (
      <RadioGroup defaultValue="b">
        <Radio.Root value="a" data-testid="a" />
        <Radio.Root value="b" data-testid="b" />
        <Radio.Root value="c" data-testid="c" />
      </RadioGroup>
    ))

    await waitFor(() => {
      expect(screen.getByTestId('a')).toHaveAttribute('tabindex', '-1')
      expect(screen.getByTestId('b')).toHaveAttribute('tabindex', '0')
      expect(screen.getByTestId('c')).toHaveAttribute('tabindex', '-1')
    })
  })

  describe('with native <label>', () => {
    it('can select a radio by clicking a wrapping label', () => {
      render(() => (
        <RadioGroup>
          <label data-testid="label">
            <Radio.Root value="a" data-testid="radio" />
            Option A
          </label>
        </RadioGroup>
      ))

      fireEvent.click(screen.getByTestId('label'))
      expect(screen.getByTestId('radio')).toHaveAttribute(
        'aria-checked',
        'true'
      )
    })
  })

  describe('Field', () => {
    it('sets aria-labelledby from Field.Label', () => {
      render(() => (
        <Field.Root>
          <Field.Label data-testid="label">Favorite</Field.Label>
          <RadioGroup>
            <Radio.Root value="a" data-testid="a" />
          </RadioGroup>
        </Field.Root>
      ))

      const label = screen.getByTestId('label')
      expect(label.id).not.toBe('')
      expect(screen.getByRole('radiogroup')).toHaveAttribute(
        'aria-labelledby',
        label.id
      )
    })

    describe('Field.Root', () => {
      it('should set touched / dirty / filled attributes', async () => {
        render(() => (
          <Field.Root>
            <RadioGroup>
              <Radio.Root value="a" data-testid="a" />
              <Radio.Root value="b" data-testid="b" />
            </RadioGroup>
          </Field.Root>
        ))

        const group = screen.getByRole('radiogroup')
        const radioA = screen.getByTestId('a')

        fireEvent.focus(group)
        fireEvent.click(radioA)
        fireEvent.blur(group)
        await flushMicrotasks()

        expect(group).toHaveAttribute('data-touched', '')
        expect(group).toHaveAttribute('data-dirty', '')
        expect(group).toHaveAttribute('data-filled', '')
      })
    })

    describe('Field.Description', () => {
      it('links description via aria-describedby', () => {
        render(() => (
          <Field.Root>
            <RadioGroup>
              <Radio.Root value="a" />
            </RadioGroup>
            <Field.Description data-testid="description">
              Help text
            </Field.Description>
          </Field.Root>
        ))

        const group = screen.getByRole('radiogroup')
        const description = screen.getByTestId('description')
        expect(group.getAttribute('aria-describedby')).toContain(description.id)
      })

      it('composes external aria-describedby on group and radio', () => {
        render(() => (
          <Field.Root>
            <RadioGroup aria-describedby="external-group-description">
              <Radio.Root
                value="a"
                data-testid="radio"
                aria-describedby="external-radio-description"
              />
            </RadioGroup>
            <Field.Description data-testid="description">
              Help text
            </Field.Description>
          </Field.Root>
        ))

        const description = screen.getByTestId('description')
        expect(screen.getByRole('radiogroup')).toHaveAttribute(
          'aria-describedby',
          `external-group-description ${description.id}`
        )
        expect(screen.getByTestId('radio')).toHaveAttribute(
          'aria-describedby',
          `external-radio-description ${description.id}`
        )
      })
    })
  })

  describe('Fieldset', () => {
    it('uses Fieldset.Legend as aria-labelledby', () => {
      render(() => (
        <Fieldset.Root>
          <Fieldset.Legend data-testid="legend">Options</Fieldset.Legend>
          <RadioGroup>
            <Radio.Root value="a" />
          </RadioGroup>
        </Fieldset.Root>
      ))

      const legend = screen.getByTestId('legend')
      expect(screen.getByRole('radiogroup')).toHaveAttribute(
        'aria-labelledby',
        legend.id
      )
    })
  })

  describe('Form', () => {
    it('clears errors on change', async () => {
      render(() => (
        <Form errors={{ test: 'Error' }}>
          <Field.Root name="test">
            <RadioGroup>
              <Radio.Root value="a" data-testid="a" />
            </RadioGroup>
            <Field.Error data-testid="error" />
          </Field.Root>
        </Form>
      ))

      expect(screen.getByTestId('error')).toBeTruthy()
      fireEvent.click(screen.getByTestId('a'))
      await flushMicrotasks()
      await waitFor(() => {
        expect(screen.queryByTestId('error')).toBeNull()
      })
    })
  })

  it('supports controlled value updates', () => {
    function App() {
      const [value, valueAssign] = createSignal<string | undefined>('a')
      return (
        <div>
          <button type="button" onClick={() => valueAssign('b')}>
            Set B
          </button>
          <RadioGroup value={value()}>
            <Radio.Root value="a" data-testid="a" />
            <Radio.Root value="b" data-testid="b" />
          </RadioGroup>
        </div>
      )
    }

    render(() => <App />)
    expect(screen.getByTestId('a')).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByText('Set B'))
    expect(screen.getByTestId('b')).toHaveAttribute('aria-checked', 'true')
  })

  it('supports dynamic radio lists', () => {
    function App() {
      const [items, itemsAssign] = createSignal(['a', 'b'])
      return (
        <div>
          <button type="button" onClick={() => itemsAssign(['a', 'b', 'c'])}>
            Add
          </button>
          <RadioGroup defaultValue="a">
            <For each={items()}>
              {item => <Radio.Root value={item} data-testid={item} />}
            </For>
          </RadioGroup>
        </div>
      )
    }

    render(() => <App />)
    expect(screen.queryByTestId('c')).toBeNull()
    fireEvent.click(screen.getByText('Add'))
    expect(screen.getByTestId('c')).toBeTruthy()
  })
})
