/**
 * Port of `@base-ui/react` Checkbox.Root tests (v1.7.0).
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

import { Field } from '../../field'
import { flushMicrotasks } from '../../field/test-utils'
import { Form } from '../../form'
import { Checkbox } from '../index'

afterEach(() => {
  cleanup()
})
describe('<Checkbox.Root />', () => {
  describe('ARIA attributes', () => {
    it('sets the correct aria attributes', () => {
      function App() {
        const [required, requiredAssign] = createSignal(false)
        return (
          <div>
            <Checkbox.Root data-testid="test" required={required()} />
            <button type="button" onClick={() => requiredAssign(true)}>
              require
            </button>
          </div>
        )
      }

      render(() => <App />)

      expect(getVisibleCheckbox()).toBe(screen.getByTestId('test'))
      expect(getVisibleCheckbox()).toHaveAttribute('aria-checked')
      fireEvent.click(screen.getByRole('button', { name: 'require' }))
      expect(getVisibleCheckbox()).toHaveAttribute('aria-required', 'true')
    })
  })

  describe('extra props', () => {
    it('can override the built-in attributes', () => {
      render(() => <Checkbox.Root role="switch" />)
      expect(screen.getByRole('switch')).toHaveAttribute('role', 'switch')
    })
  })

  describe('prop: onClick', () => {
    it('propagates a single click event to ancestors per user click', () => {
      const handleParentClick = vi.fn()
      render(() => (
        <div onClick={handleParentClick}>
          <Checkbox.Root data-testid="checkbox" />
        </div>
      ))

      fireEvent.click(screen.getByTestId('checkbox'))

      expect(handleParentClick).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('checkbox')).toHaveAttribute(
        'aria-checked',
        'true'
      )
    })

    it('does not propagate to ancestors when stopPropagation() is called', () => {
      const handleParentClick = vi.fn()
      render(() => (
        <div onClick={handleParentClick}>
          <Checkbox.Root
            data-testid="checkbox"
            onClick={event => event.stopPropagation()}
          />
        </div>
      ))

      fireEvent.click(screen.getByTestId('checkbox'))

      expect(handleParentClick).toHaveBeenCalledTimes(0)
      expect(screen.getByTestId('checkbox')).toHaveAttribute(
        'aria-checked',
        'true'
      )
    })

    it('propagates a single click event to ancestors with a native button', () => {
      const handleParentClick = vi.fn()
      render(() => (
        <div onClick={handleParentClick}>
          <Checkbox.Root nativeButton render="button" data-testid="checkbox" />
        </div>
      ))

      fireEvent.click(screen.getByTestId('checkbox'))

      expect(handleParentClick).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('checkbox')).toHaveAttribute(
        'aria-checked',
        'true'
      )
    })
  })

  describe('interactions', () => {
    it('should change its state when clicked', () => {
      render(() => <Checkbox.Root />)
      const checkbox = getVisibleCheckbox()
      const input = getHiddenInput()

      expect(checkbox).toHaveAttribute('aria-checked', 'false')
      expect(input.checked).toBe(false)

      fireEvent.click(checkbox)
      expect(checkbox).toHaveAttribute('aria-checked', 'true')
      expect(input.checked).toBe(true)

      fireEvent.click(checkbox)
      expect(checkbox).toHaveAttribute('aria-checked', 'false')
      expect(input.checked).toBe(false)
    })

    it('should update its state when changed from outside', () => {
      function App() {
        const [checked, checkedAssign] = createSignal(false)
        return (
          <div>
            <button type="button" onClick={() => checkedAssign(c => !c)}>
              Toggle
            </button>
            <Checkbox.Root checked={checked()} />
          </div>
        )
      }

      render(() => <App />)
      const checkbox = getVisibleCheckbox()
      expect(checkbox).toHaveAttribute('aria-checked', 'false')
      fireEvent.click(screen.getByText('Toggle'))
      expect(checkbox).toHaveAttribute('aria-checked', 'true')
    })

    it('should call onCheckedChange when clicked', () => {
      const onCheckedChange = vi.fn()
      render(() => <Checkbox.Root onCheckedChange={onCheckedChange} />)
      fireEvent.click(getVisibleCheckbox())
      expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything())
    })

    it('does not update when onCheckedChange cancels the event', () => {
      render(() => (
        <Checkbox.Root
          onCheckedChange={(_checked, details) => {
            details.cancel()
          }}
        />
      ))
      fireEvent.click(getVisibleCheckbox())
      expect(getVisibleCheckbox()).toHaveAttribute('aria-checked', 'false')
    })

    it('should update its state if the underlying input is toggled', () => {
      render(() => <Checkbox.Root />)
      const checkbox = getVisibleCheckbox()
      const input = getHiddenInput()

      fireEvent.click(input)
      expect(checkbox).toHaveAttribute('aria-checked', 'true')
      expect(input.checked).toBe(true)
    })

    it('can be activated with Space key', () => {
      render(() => <Checkbox.Root />)
      const checkbox = getVisibleCheckbox()
      checkbox.focus()
      fireEvent.keyDown(checkbox, { key: ' ' })
      fireEvent.keyUp(checkbox, { key: ' ' })
      expect(checkbox).toHaveAttribute('aria-checked', 'true')
    })

    it('does not activate with Enter key', () => {
      render(() => <Checkbox.Root />)
      const checkbox = getVisibleCheckbox()
      checkbox.focus()
      fireEvent.keyDown(checkbox, { key: 'Enter' })
      expect(checkbox).toHaveAttribute('aria-checked', 'false')
    })
  })

  describe('prop: disabled', () => {
    it('uses aria-disabled instead of HTML disabled', () => {
      render(() => <Checkbox.Root disabled />)
      const checkbox = getVisibleCheckbox()
      expect(checkbox).not.toHaveAttribute('disabled')
      expect(checkbox).toHaveAttribute('aria-disabled', 'true')
    })

    it('should not change its state when clicked', () => {
      render(() => <Checkbox.Root disabled />)
      fireEvent.click(getVisibleCheckbox())
      expect(getVisibleCheckbox()).toHaveAttribute('aria-checked', 'false')
    })
  })

  describe('prop: readOnly', () => {
    it('should have the aria-readonly attribute', () => {
      render(() => <Checkbox.Root readOnly />)
      expect(getVisibleCheckbox()).toHaveAttribute('aria-readonly', 'true')
    })

    it('should not have the aria attribute when readOnly is not set', () => {
      render(() => <Checkbox.Root />)
      expect(getVisibleCheckbox()).not.toHaveAttribute('aria-readonly')
    })

    it('should not change its state when clicked', () => {
      render(() => <Checkbox.Root readOnly />)
      fireEvent.click(getVisibleCheckbox())
      expect(getVisibleCheckbox()).toHaveAttribute('aria-checked', 'false')
    })

    it('should not change its state when its label is clicked', () => {
      render(() => (
        <label>
          <Checkbox.Root readOnly />
          Accept
        </label>
      ))
      fireEvent.click(screen.getByText('Accept'))
      expect(getVisibleCheckbox()).toHaveAttribute('aria-checked', 'false')
    })
  })

  describe('prop: indeterminate', () => {
    it('should set aria-checked as mixed', () => {
      render(() => <Checkbox.Root indeterminate />)
      expect(getVisibleCheckbox()).toHaveAttribute('aria-checked', 'mixed')
    })

    it('should not change its state when clicked', () => {
      render(() => <Checkbox.Root indeterminate />)
      fireEvent.click(getVisibleCheckbox())
      expect(getVisibleCheckbox()).toHaveAttribute('aria-checked', 'mixed')
    })

    it('should not have the aria attribute when indeterminate is not set', () => {
      render(() => <Checkbox.Root />)
      expect(getVisibleCheckbox()).toHaveAttribute('aria-checked', 'false')
    })

    it('should not be overridden by checked prop', () => {
      render(() => <Checkbox.Root indeterminate checked />)
      expect(getVisibleCheckbox()).toHaveAttribute('aria-checked', 'mixed')
    })

    it('sets the native input state when indeterminate', () => {
      render(() => <Checkbox.Root indeterminate />)
      expect(getHiddenInput().indeterminate).toBe(true)
    })

    it('sets indeterminate style hooks on the root and indicator', () => {
      render(() => (
        <Checkbox.Root indeterminate>
          <Checkbox.Indicator data-testid="indicator" />
        </Checkbox.Root>
      ))
      expect(getVisibleCheckbox()).toHaveAttribute('data-indeterminate')
      expect(screen.getByTestId('indicator')).toHaveAttribute(
        'data-indeterminate'
      )
    })
  })

  it('should place the style hooks on the root and the indicator', () => {
    render(() => (
      <Checkbox.Root defaultChecked disabled readOnly required>
        <Checkbox.Indicator data-testid="indicator" />
      </Checkbox.Root>
    ))
    const root = getVisibleCheckbox()
    const indicator = screen.getByTestId('indicator')
    expect(root).toHaveAttribute('data-checked')
    expect(root).toHaveAttribute('data-disabled')
    expect(root).toHaveAttribute('data-readonly')
    expect(root).toHaveAttribute('data-required')
    expect(indicator).toHaveAttribute('data-checked')
    expect(indicator).toHaveAttribute('data-disabled')
  })

  it('should set the name attribute only on the input', () => {
    render(() => <Checkbox.Root name="terms" />)
    expect(getVisibleCheckbox()).not.toHaveAttribute('name')
    expect(getHiddenInput()).toHaveAttribute('name', 'terms')
  })

  it('should change state when clicking the checkbox if it has a wrapping label', () => {
    render(() => (
      <label>
        <Checkbox.Root />
        Label
      </label>
    ))
    fireEvent.click(getVisibleCheckbox())
    expect(getVisibleCheckbox()).toHaveAttribute('aria-checked', 'true')
  })

  describe('with native label', () => {
    it('toggle when wrapping label clicked', () => {
      render(() => (
        <label data-testid="label">
          <Checkbox.Root />
          Accept
        </label>
      ))
      fireEvent.click(screen.getByTestId('label'))
      expect(getVisibleCheckbox()).toHaveAttribute('aria-checked', 'true')
    })

    it('toggle when explicitly linked label clicked', () => {
      render(() => (
        <>
          <Checkbox.Root id="terms" />
          <label for="terms">Accept</label>
        </>
      ))
      fireEvent.click(screen.getByText('Accept'))
      expect(getVisibleCheckbox()).toHaveAttribute('aria-checked', 'true')
    })

    it('associate id with native button when nativeButton=true', () => {
      render(() => (
        <>
          <Checkbox.Root id="terms" nativeButton render="button" />
          <label for="terms">Accept</label>
        </>
      ))
      expect(getVisibleCheckbox()).toHaveAttribute('id', 'terms')
      expect(getHiddenInput()).not.toHaveAttribute('id')
      fireEvent.click(screen.getByText('Accept'))
      expect(getVisibleCheckbox()).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('Form', () => {
    it('triggers native HTML validation on submit', async () => {
      render(() => (
        <Form>
          <Field.Root name="terms">
            <Checkbox.Root required />
            <Field.Error match="valueMissing" data-testid="error" />
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>
      ))

      fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument()
      })
    })

    it('clears external errors on change', async () => {
      function App() {
        const [errors, errorsAssign] = createSignal<Record<string, string>>({
          terms: 'Agree first',
        })
        return (
          <Form
            errors={errors()}
            onClearErrors={next => errorsAssign(next as Record<string, string>)}
          >
            <Field.Root name="terms">
              <Checkbox.Root />
              <Field.Error data-testid="error" />
            </Field.Root>
          </Form>
        )
      }

      render(() => <App />)
      expect(screen.getByTestId('error')).toHaveTextContent('Agree first')
      expect(getVisibleCheckbox()).toHaveAttribute('aria-invalid', 'true')

      fireEvent.click(getVisibleCheckbox())
      await flushMicrotasks()
      expect(screen.queryByTestId('error')).toBeNull()
    })
  })

  describe('Field', () => {
    it('receive disabled from Field.Root', () => {
      render(() => (
        <Field.Root disabled>
          <Checkbox.Root />
        </Field.Root>
      ))
      expect(getVisibleCheckbox()).toHaveAttribute('aria-disabled', 'true')
    })

    it('receive name from Field.Root', () => {
      render(() => (
        <Field.Root name="terms">
          <Checkbox.Root />
        </Field.Root>
      ))
      expect(getHiddenInput()).toHaveAttribute('name', 'terms')
    })

    it('sets data-touched on focus and blur', () => {
      render(() => (
        <Field.Root>
          <Checkbox.Root />
        </Field.Root>
      ))
      const checkbox = getVisibleCheckbox()
      expect(checkbox).not.toHaveAttribute('data-touched')
      fireEvent.focus(checkbox)
      fireEvent.blur(checkbox)
      expect(checkbox).toHaveAttribute('data-touched')
    })

    it('sets data-dirty after click', () => {
      render(() => (
        <Field.Root>
          <Checkbox.Root />
        </Field.Root>
      ))
      const checkbox = getVisibleCheckbox()
      expect(checkbox).not.toHaveAttribute('data-dirty')
      fireEvent.click(checkbox)
      expect(checkbox).toHaveAttribute('data-dirty')
    })

    it('adds data-filled when checked from unchecked', () => {
      render(() => (
        <Field.Root>
          <Checkbox.Root />
        </Field.Root>
      ))
      const checkbox = getVisibleCheckbox()
      expect(checkbox).not.toHaveAttribute('data-filled')
      fireEvent.click(checkbox)
      expect(checkbox).toHaveAttribute('data-filled')
    })

    it('removes data-filled when unchecked from defaultChecked', () => {
      render(() => (
        <Field.Root>
          <Checkbox.Root defaultChecked />
        </Field.Root>
      ))
      const checkbox = getVisibleCheckbox()
      expect(checkbox).toHaveAttribute('data-filled')
      fireEvent.click(checkbox)
      expect(checkbox).not.toHaveAttribute('data-filled')
    })

    it('sets data-focused on focus', () => {
      render(() => (
        <Field.Root>
          <Checkbox.Root />
        </Field.Root>
      ))
      const checkbox = getVisibleCheckbox()
      fireEvent.focus(checkbox)
      expect(checkbox).toHaveAttribute('data-focused')
      fireEvent.blur(checkbox)
      expect(checkbox).not.toHaveAttribute('data-focused')
    })

    it('does not set data-focused when disabled', () => {
      render(() => (
        <Field.Root>
          <Checkbox.Root disabled />
        </Field.Root>
      ))
      fireEvent.focus(getVisibleCheckbox())
      expect(getVisibleCheckbox()).not.toHaveAttribute('data-focused')
    })

    it('sets data-invalid from Field.Root invalid', () => {
      render(() => (
        <Field.Root invalid>
          <Checkbox.Root />
        </Field.Root>
      ))
      expect(getVisibleCheckbox()).toHaveAttribute('data-invalid')
    })

    it('Field.Label associates and toggles on click', () => {
      render(() => (
        <Field.Root>
          <Checkbox.Root />
          <Field.Label>Accept terms</Field.Label>
        </Field.Root>
      ))
      fireEvent.click(screen.getByText('Accept terms'))
      expect(getVisibleCheckbox()).toHaveAttribute('aria-checked', 'true')
    })

    it('Field.Description links via aria-describedby', () => {
      render(() => (
        <Field.Root>
          <Checkbox.Root />
          <Field.Description data-testid="description">
            Required
          </Field.Description>
        </Field.Root>
      ))
      const descriptionId = screen.getByTestId('description').id
      expect(getVisibleCheckbox().getAttribute('aria-describedby')).toContain(
        descriptionId
      )
    })

    it('composes external aria-describedby with Field.Description', () => {
      render(() => (
        <Field.Root>
          <Checkbox.Root aria-describedby="external-description" />
          <Field.Description data-testid="description">
            Required
          </Field.Description>
        </Field.Root>
      ))
      expect(getVisibleCheckbox().getAttribute('aria-describedby')).toBe(
        `external-description ${screen.getByTestId('description').id}`
      )
    })
  })
})
function getVisibleCheckbox() {
  return screen.getByRole('checkbox')
}
function getHiddenInput() {
  const [, input] = screen.getAllByRole<HTMLInputElement>('checkbox', {
    hidden: true,
  })
  return input
}
