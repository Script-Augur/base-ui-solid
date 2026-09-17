/**
 * Port of `@base-ui/react` Switch.Root tests (v1.7.0).
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
import { Switch } from '../index'

afterEach(() => {
  cleanup()
})

describe('<Switch.Root />', () => {
  describe('interactions', () => {
    it('should change its state when clicked', () => {
      render(() => <Switch.Root />)
      const switchEl = getVisibleSwitch()
      const input = getHiddenInput()

      expect(switchEl).toHaveAttribute('aria-checked', 'false')
      expect(input.checked).toBe(false)

      fireEvent.click(switchEl)
      expect(switchEl).toHaveAttribute('aria-checked', 'true')
      expect(input.checked).toBe(true)

      fireEvent.click(switchEl)
      expect(switchEl).toHaveAttribute('aria-checked', 'false')
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
            <Switch.Root checked={checked()} />
          </div>
        )
      }

      render(() => <App />)
      const switchEl = getVisibleSwitch()
      expect(switchEl).toHaveAttribute('aria-checked', 'false')
      fireEvent.click(screen.getByText('Toggle'))
      expect(switchEl).toHaveAttribute('aria-checked', 'true')
      fireEvent.click(screen.getByText('Toggle'))
      expect(switchEl).toHaveAttribute('aria-checked', 'false')
    })

    it('should update its state if the underlying input is toggled', () => {
      render(() => <Switch.Root />)
      const switchEl = getVisibleSwitch()
      const input = getHiddenInput()

      fireEvent.click(input)
      expect(switchEl).toHaveAttribute('aria-checked', 'true')
      expect(input.checked).toBe(true)
    })

    it('ignores a hidden input click canceled before the change handler', () => {
      const handleCheckedChange = vi.fn()
      render(() => <Switch.Root onCheckedChange={handleCheckedChange} />)

      const switchEl = getVisibleSwitch()
      const input = getHiddenInput()
      const event = new MouseEvent('click', { bubbles: true, cancelable: true })
      event.preventDefault()
      fireEvent(input, event)

      expect(handleCheckedChange).not.toHaveBeenCalled()
      expect(switchEl).toHaveAttribute('aria-checked', 'false')
    })

    it('can be activated with Space key', () => {
      render(() => <Switch.Root />)
      const switchEl = getVisibleSwitch()
      switchEl.focus()
      fireEvent.keyDown(switchEl, { key: ' ' })
      fireEvent.keyUp(switchEl, { key: ' ' })
      expect(switchEl).toHaveAttribute('aria-checked', 'true')
    })

    it('can be activated with Enter key', () => {
      render(() => <Switch.Root />)
      const switchEl = getVisibleSwitch()
      switchEl.focus()
      fireEvent.keyDown(switchEl, { key: 'Enter' })
      expect(switchEl).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('extra props', () => {
    it('should override the built-in attributes', () => {
      render(() => <Switch.Root role="checkbox" data-testid="switch" />)
      expect(screen.getByTestId('switch')).toHaveAttribute('role', 'checkbox')
    })

    it('sets aria-labelledby from a sibling label associated with the hidden input', () => {
      render(() => (
        <div>
          <label for="switch-input">Label</label>
          <Switch.Root id="switch-input" />
        </div>
      ))

      const label = screen.getByText('Label')
      expect(label.id).not.toBe('')
      expect(getVisibleSwitch()).toHaveAttribute('aria-labelledby', label.id)
    })

    it('updates fallback aria-labelledby when the hidden input id changes', async () => {
      function TestCase() {
        const [id, idAssign] = createSignal('switch-input-a')
        return (
          <>
            <label for="switch-input-a">Label A</label>
            <label for="switch-input-b">Label B</label>
            <Switch.Root id={id()} />
            <button type="button" onClick={() => idAssign('switch-input-b')}>
              Toggle
            </button>
          </>
        )
      }

      render(() => <TestCase />)

      const switchEl = getVisibleSwitch()
      const labelA = screen.getByText('Label A')
      expect(labelA.id).not.toBe('')
      expect(switchEl).toHaveAttribute('aria-labelledby', labelA.id)

      fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))

      await waitFor(() => {
        const labelB = screen.getByText('Label B')
        expect(labelB.id).not.toBe('')
        expect(labelA.id).not.toBe(labelB.id)
        expect(switchEl).toHaveAttribute('aria-labelledby', labelB.id)
      })
    })
  })

  describe('prop: onCheckedChange', () => {
    it('should call onCheckedChange when clicked', () => {
      const handleChange = vi.fn()
      render(() => <Switch.Root onCheckedChange={handleChange} />)
      fireEvent.click(getVisibleSwitch())
      expect(handleChange.mock.calls.length).toBe(1)
      expect(handleChange.mock.calls[0]?.[0]).toBe(true)
    })

    it('does not change state when canceled via a root click', () => {
      render(() => (
        <Field.Root>
          <Switch.Root
            data-testid="button"
            onCheckedChange={(_checked, eventDetails) => {
              eventDetails.cancel()
            }}
          />
        </Field.Root>
      ))

      const switchEl = screen.getByTestId('button')
      const input = getHiddenInput()
      fireEvent.click(switchEl)

      expect(switchEl).toHaveAttribute('aria-checked', 'false')
      expect(input.checked).toBe(false)
      expect(switchEl).not.toHaveAttribute('data-dirty')
      expect(switchEl).not.toHaveAttribute('data-filled')
    })

    it('does not change state when canceled via a hidden input click', () => {
      render(() => (
        <Field.Root>
          <Switch.Root
            data-testid="button"
            onCheckedChange={(_checked, eventDetails) => {
              eventDetails.cancel()
            }}
          />
        </Field.Root>
      ))

      const switchEl = screen.getByTestId('button')
      const input = getHiddenInput()
      fireEvent.click(input)

      expect(switchEl).toHaveAttribute('aria-checked', 'false')
      expect(input.checked).toBe(false)
      expect(switchEl).not.toHaveAttribute('data-dirty')
      expect(switchEl).not.toHaveAttribute('data-filled')
    })
  })

  describe('prop: onClick', () => {
    it('should call onClick when clicked', () => {
      const handleClick = vi.fn()
      render(() => <Switch.Root onClick={handleClick} />)
      fireEvent.click(getVisibleSwitch())
      expect(handleClick.mock.calls.length).toBe(1)
    })

    it('propagates a single click event to ancestors per user click', () => {
      const handleParentClick = vi.fn()
      render(() => (
        <div onClick={handleParentClick}>
          <Switch.Root />
        </div>
      ))

      fireEvent.click(getVisibleSwitch())
      expect(handleParentClick).toHaveBeenCalledTimes(1)
      expect(getVisibleSwitch()).toHaveAttribute('aria-checked', 'true')
    })

    it('does not propagate to ancestors when stopPropagation() is called', () => {
      const handleParentClick = vi.fn()
      render(() => (
        <div onClick={handleParentClick}>
          <Switch.Root onClick={event => event.stopPropagation()} />
        </div>
      ))

      fireEvent.click(getVisibleSwitch())
      expect(handleParentClick).toHaveBeenCalledTimes(0)
      expect(getVisibleSwitch()).toHaveAttribute('aria-checked', 'true')
    })

    it('propagates a single click event to ancestors with a native button', () => {
      const handleParentClick = vi.fn()
      render(() => (
        <div onClick={handleParentClick}>
          <Switch.Root nativeButton render="button" />
        </div>
      ))

      fireEvent.click(getVisibleSwitch())
      expect(handleParentClick).toHaveBeenCalledTimes(1)
      expect(getVisibleSwitch()).toHaveAttribute('aria-checked', 'true')
    })

    it('does not propagate to ancestors when stopPropagation() is called with a native button', () => {
      const handleParentClick = vi.fn()
      render(() => (
        <div onClick={handleParentClick}>
          <Switch.Root
            nativeButton
            render="button"
            onClick={event => event.stopPropagation()}
          />
        </div>
      ))

      fireEvent.click(getVisibleSwitch())
      expect(handleParentClick).toHaveBeenCalledTimes(0)
      expect(getVisibleSwitch()).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('prop: disabled', () => {
    it('uses aria-disabled instead of HTML disabled', () => {
      render(() => <Switch.Root disabled />)
      expect(getVisibleSwitch()).not.toHaveAttribute('disabled')
      expect(getVisibleSwitch()).toHaveAttribute('aria-disabled', 'true')
    })

    it('should not have the disabled attribute when disabled is not set', () => {
      render(() => <Switch.Root />)
      expect(getVisibleSwitch()).not.toHaveAttribute('disabled')
    })

    it('should not change its state when clicked', () => {
      render(() => <Switch.Root disabled />)
      fireEvent.click(getVisibleSwitch())
      expect(getVisibleSwitch()).toHaveAttribute('aria-checked', 'false')
    })
  })

  describe('prop: readOnly', () => {
    it('should have the aria-readonly attribute', () => {
      render(() => <Switch.Root readOnly />)
      expect(getVisibleSwitch()).toHaveAttribute('aria-readonly', 'true')
    })

    it('should not have the aria attribute when readOnly is not set', () => {
      render(() => <Switch.Root />)
      expect(getVisibleSwitch()).not.toHaveAttribute('aria-readonly')
    })

    it('should not change its state when clicked', () => {
      render(() => <Switch.Root readOnly />)
      fireEvent.click(getVisibleSwitch())
      expect(getVisibleSwitch()).toHaveAttribute('aria-checked', 'false')
    })

    it('should not change its state when its label is clicked', () => {
      render(() => (
        <label data-testid="label">
          <Switch.Root readOnly />
        </label>
      ))
      fireEvent.click(screen.getByTestId('label'))
      expect(getVisibleSwitch()).toHaveAttribute('aria-checked', 'false')
    })
  })

  describe('prop: required', () => {
    it('should have the aria-required attribute', () => {
      render(() => <Switch.Root required />)
      expect(getVisibleSwitch()).toHaveAttribute('aria-required', 'true')
    })

    it('should not have the aria attribute when required is not set', () => {
      render(() => <Switch.Root />)
      expect(getVisibleSwitch()).not.toHaveAttribute('aria-required')
    })
  })

  describe('prop: inputRef', () => {
    it('should be able to access the native input', () => {
      const inputRef: { current: HTMLInputElement | null } = { current: null }
      render(() => <Switch.Root inputRef={inputRef} />)
      expect(inputRef.current).toBe(getHiddenInput())
    })
  })

  it('should place the style hooks on the root and the thumb', () => {
    function App() {
      const [disabled, disabledAssign] = createSignal(true)
      const [readOnly, readOnlyAssign] = createSignal(true)
      return (
        <>
          <Switch.Root
            defaultChecked
            disabled={disabled()}
            readOnly={readOnly()}
            required
          >
            <Switch.Thumb data-testid="thumb" />
          </Switch.Root>
          <button
            type="button"
            onClick={() => {
              disabledAssign(false)
              readOnlyAssign(false)
            }}
          >
            Enable
          </button>
        </>
      )
    }

    render(() => <App />)

    const switchEl = getVisibleSwitch()
    const thumb = screen.getByTestId('thumb')

    expect(switchEl).toHaveAttribute('data-checked', '')
    expect(switchEl).toHaveAttribute('data-disabled', '')
    expect(switchEl).toHaveAttribute('data-readonly', '')
    expect(switchEl).toHaveAttribute('data-required', '')
    expect(thumb).toHaveAttribute('data-checked', '')
    expect(thumb).toHaveAttribute('data-disabled', '')
    expect(thumb).toHaveAttribute('data-readonly', '')
    expect(thumb).toHaveAttribute('data-required', '')

    fireEvent.click(screen.getByText('Enable'))
    fireEvent.click(switchEl)

    expect(switchEl).toHaveAttribute('data-unchecked', '')
    expect(switchEl).not.toHaveAttribute('data-checked')
    expect(thumb).toHaveAttribute('data-unchecked', '')
    expect(thumb).not.toHaveAttribute('data-checked')
  })

  it('should set the name attribute only on the input', () => {
    render(() => <Switch.Root name="switch-name" />)
    expect(getHiddenInput()).toHaveAttribute('name', 'switch-name')
    expect(getVisibleSwitch()).not.toHaveAttribute('name')
  })

  it('should not set the value attribute by default', () => {
    render(() => <Switch.Root />)
    expect(getHiddenInput()).not.toHaveAttribute('value')
  })

  it('should set the value attribute only on the input', () => {
    render(() => <Switch.Root value="1" />)
    expect(getHiddenInput()).toHaveAttribute('value', '1')
    expect(getVisibleSwitch()).not.toHaveAttribute('value')
  })

  describe('with native <label>', () => {
    it('should toggle the switch when a wrapping <label> is clicked', () => {
      render(() => (
        <label data-testid="label">
          <Switch.Root />
          Toggle
        </label>
      ))
      expect(getVisibleSwitch()).toHaveAttribute('aria-checked', 'false')
      fireEvent.click(screen.getByTestId('label'))
      expect(getVisibleSwitch()).toHaveAttribute('aria-checked', 'true')
    })

    it('should toggle the switch when an explicitly linked <label> is clicked', () => {
      render(() => (
        <div>
          <label data-testid="label" for="mySwitch">
            Toggle
          </label>
          <Switch.Root id="mySwitch" />
        </div>
      ))
      expect(getVisibleSwitch()).toHaveAttribute('aria-checked', 'false')
      fireEvent.click(screen.getByTestId('label'))
      expect(getVisibleSwitch()).toHaveAttribute('aria-checked', 'true')
    })

    it('should associate id with the native button when nativeButton=true', () => {
      render(() => (
        <div>
          <label data-testid="label" for="mySwitch">
            Toggle
          </label>
          <Switch.Root id="mySwitch" nativeButton render="button" />
        </div>
      ))

      const switchEl = getVisibleSwitch()
      expect(switchEl).toHaveAttribute('id', 'mySwitch')
      expect(getHiddenInput()).not.toHaveAttribute('id', 'mySwitch')
      expect(switchEl).toHaveAttribute('aria-checked', 'false')
      fireEvent.click(screen.getByTestId('label'))
      expect(switchEl).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('Form', () => {
    it('triggers native HTML validation on submit', async () => {
      render(() => (
        <Form>
          <Field.Root name="test">
            <Switch.Root name="switch" required />
            <Field.Error match="valueMissing" data-testid="error">
              required
            </Field.Error>
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>
      ))

      expect(screen.queryByTestId('error')).toBe(null)
      fireEvent.click(screen.getByText('Submit'))
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('required')
      })
    })

    it('clears external errors on change', async () => {
      render(() => (
        <Form errors={{ test: 'test' }}>
          <Field.Root name="test" data-testid="field">
            <Switch.Root data-testid="switch" />
            <Field.Error data-testid="error" />
          </Field.Root>
        </Form>
      ))

      const switchEl = screen.getByTestId('switch')
      expect(switchEl).toHaveAttribute('aria-invalid', 'true')
      expect(screen.queryByTestId('error')).toHaveTextContent('test')

      fireEvent.click(switchEl)
      await flushMicrotasks()
      expect(switchEl).not.toHaveAttribute('aria-invalid')
      expect(screen.queryByTestId('error')).toBe(null)
    })
  })

  describe('Field', () => {
    it('should receive disabled prop from Field.Root', () => {
      render(() => (
        <Field.Root disabled>
          <Switch.Root />
        </Field.Root>
      ))
      expect(getVisibleSwitch()).toHaveAttribute('data-disabled')
    })

    it('should receive name prop from Field.Root', () => {
      render(() => (
        <Field.Root name="field-switch">
          <Switch.Root />
        </Field.Root>
      ))
      expect(getHiddenInput()).toHaveAttribute('name', 'field-switch')
    })

    it('[data-touched]', () => {
      render(() => (
        <Field.Root>
          <Switch.Root data-testid="button" />
        </Field.Root>
      ))
      const button = screen.getByTestId('button')
      fireEvent.focus(button)
      fireEvent.blur(button)
      expect(button).toHaveAttribute('data-touched', '')
    })

    it('[data-dirty]', () => {
      render(() => (
        <Field.Root>
          <Switch.Root data-testid="button" />
        </Field.Root>
      ))
      const button = screen.getByTestId('button')
      expect(button).not.toHaveAttribute('data-dirty')
      fireEvent.click(button)
      expect(button).toHaveAttribute('data-dirty', '')
    })

    describe('[data-filled]', () => {
      it('adds [data-filled] attribute when checked after being initially unchecked', () => {
        render(() => (
          <Field.Root>
            <Switch.Root data-testid="button" />
          </Field.Root>
        ))
        const button = screen.getByTestId('button')
        expect(button).not.toHaveAttribute('data-filled')
        fireEvent.click(button)
        expect(button).toHaveAttribute('data-filled', '')
        fireEvent.click(button)
        expect(button).not.toHaveAttribute('data-filled')
      })

      it('removes [data-filled] attribute when unchecked after being initially checked', () => {
        render(() => (
          <Field.Root>
            <Switch.Root data-testid="button" defaultChecked />
          </Field.Root>
        ))
        const button = screen.getByTestId('button')
        expect(button).toHaveAttribute('data-filled')
        fireEvent.click(button)
        expect(button).not.toHaveAttribute('data-filled', '')
      })
    })

    it('[data-focused]', () => {
      render(() => (
        <Field.Root>
          <Switch.Root data-testid="button" />
        </Field.Root>
      ))
      const button = screen.getByTestId('button')
      expect(button).not.toHaveAttribute('data-focused')
      fireEvent.focus(button)
      expect(button).toHaveAttribute('data-focused', '')
      fireEvent.blur(button)
      expect(button).not.toHaveAttribute('data-focused')
    })

    it('does not set [data-focused] when disabled', () => {
      render(() => (
        <Field.Root>
          <Switch.Root disabled data-testid="button" />
        </Field.Root>
      ))
      fireEvent.focus(screen.getByTestId('button'))
      expect(screen.getByTestId('button')).not.toHaveAttribute('data-focused')
    })

    it('prop: validationMode=onSubmit', async () => {
      render(() => (
        <Form>
          <Field.Root>
            <Switch.Root required />
            <Field.Error data-testid="error" />
          </Field.Root>
          <button type="submit">submit</button>
        </Form>
      ))

      const button = getVisibleSwitch()
      expect(button).not.toHaveAttribute('aria-invalid')

      fireEvent.click(screen.getByText('submit'))
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-invalid', 'true')
      })
      expect(screen.queryByTestId('error')).not.toBe(null)

      fireEvent.click(button)
      expect(button).not.toHaveAttribute('aria-invalid')
      expect(screen.queryByTestId('error')).toBe(null)

      fireEvent.click(button)
      expect(button).toHaveAttribute('aria-invalid', 'true')
      expect(screen.queryByTestId('error')).not.toBe(null)
    })

    it('prop: validationMode=onChange', () => {
      render(() => (
        <Field.Root
          validationMode="onChange"
          validate={value => {
            const next = value as boolean
            return next ? 'error' : null
          }}
        >
          <Switch.Root data-testid="button" />
        </Field.Root>
      ))

      const button = screen.getByTestId('button')
      expect(button).not.toHaveAttribute('aria-invalid')
      fireEvent.click(button)
      expect(button).toHaveAttribute('aria-invalid', 'true')
    })

    it('validates once when changed by the user', () => {
      const validate = vi.fn()
      render(() => (
        <Field.Root validationMode="onChange" validate={validate}>
          <Switch.Root />
        </Field.Root>
      ))
      fireEvent.click(getVisibleSwitch())
      expect(validate).toHaveBeenCalledTimes(1)
      expect(validate.mock.lastCall?.[0]).toBe(true)
    })

    it('revalidates when a controlled value changes externally', () => {
      const validateSpy = vi.fn((value: unknown) =>
        (value as boolean) ? 'error' : null
      )

      function App() {
        const [checked, checkedAssign] = createSignal(false)
        return (
          <>
            <Field.Root
              validationMode="onChange"
              validate={validateSpy}
              name="newsletters"
            >
              <Switch.Root
                data-testid="button"
                checked={checked()}
                onCheckedChange={next => checkedAssign(next)}
              />
            </Field.Root>
            <button type="button" onClick={() => checkedAssign(prev => !prev)}>
              Toggle externally
            </button>
          </>
        )
      }

      render(() => <App />)
      const button = screen.getByTestId('button')
      expect(button).not.toHaveAttribute('aria-invalid')
      const initialCallCount = validateSpy.mock.calls.length

      fireEvent.click(screen.getByText('Toggle externally'))
      expect(validateSpy.mock.calls.length).toBe(initialCallCount + 1)
      expect(validateSpy.mock.lastCall?.[0]).toBe(true)
      expect(button).toHaveAttribute('aria-invalid', 'true')
    })

    it('prop: validationMode=onBlur', () => {
      render(() => (
        <Field.Root
          validationMode="onBlur"
          validate={value => {
            const next = value as boolean
            return next ? 'error' : null
          }}
        >
          <Switch.Root data-testid="button" />
          <Field.Error data-testid="error" />
        </Field.Root>
      ))

      const button = screen.getByTestId('button')
      expect(button).not.toHaveAttribute('aria-invalid')
      fireEvent.click(button)
      fireEvent.blur(button)
      expect(button).toHaveAttribute('aria-invalid', 'true')
    })

    describe('Field.Label', () => {
      describe('implicit', () => {
        it('sets for on the label', () => {
          render(() => (
            <Field.Root>
              <Field.Label data-testid="label">
                <Switch.Root />
                OK
              </Field.Label>
            </Field.Root>
          ))

          const label = screen.getByTestId('label')
          expect(label.getAttribute('for')).not.toBe(null)
          const input = document.querySelector('input[type="checkbox"]')
          expect(label.getAttribute('for')).toBe(input?.getAttribute('id'))

          const switchEl = getVisibleSwitch()
          expect(switchEl.getAttribute('aria-labelledby')).toBe(
            label.getAttribute('id')
          )
          expect(switchEl).toHaveAttribute('aria-checked', 'false')
          fireEvent.click(label)
          expect(switchEl).toHaveAttribute('aria-checked', 'true')
        })
      })

      describe('explicit association', () => {
        it('when the label is sibling to the switch', () => {
          render(() => (
            <Field.Root>
              <Field.Label data-testid="label">Label</Field.Label>
              <Switch.Root />
            </Field.Root>
          ))

          const label = screen.getByTestId('label')
          const switchEl = getVisibleSwitch()
          const input = document.querySelector('input[type="checkbox"]')

          expect(label.getAttribute('for')).not.toBe(null)
          expect(label.getAttribute('for')).toBe(input?.getAttribute('id'))
          expect(switchEl.getAttribute('aria-labelledby')).toBe(
            label.getAttribute('id')
          )
          expect(switchEl).toHaveAttribute('aria-checked', 'false')
          fireEvent.click(label)
          expect(switchEl).toHaveAttribute('aria-checked', 'true')
        })

        it('when rendering a non-native button', () => {
          render(() => (
            <Field.Root>
              <Field.Label data-testid="label">OK</Field.Label>
              <Switch.Root render="span" nativeButton={false} />
            </Field.Root>
          ))

          const label = screen.getByTestId('label')
          expect(label.getAttribute('for')).not.toBe(null)
          const input = document.querySelector('input[type="checkbox"]')
          expect(input?.getAttribute('id')).toBe(label.getAttribute('for'))
          expect(getVisibleSwitch().getAttribute('aria-labelledby')).toBe(
            label.getAttribute('id')
          )
        })

        it('when rendering a non-native label', () => {
          render(() => (
            <Field.Root>
              <Field.Label
                data-testid="label"
                render="span"
                nativeLabel={false}
              >
                <Switch.Root data-testid="button" />
              </Field.Label>
            </Field.Root>
          ))

          const label = screen.getByTestId('label')
          const switchEl = screen.getByTestId('button')
          expect(label.getAttribute('for')).toBe(null)
          expect(label.getAttribute('id')).not.toBe(null)
          expect(switchEl.getAttribute('aria-labelledby')).toBe(
            label.getAttribute('id')
          )
          expect(switchEl).toHaveAttribute('aria-checked', 'false')
          fireEvent.click(label)
          expect(switchEl).not.toHaveAttribute('aria-checked', 'true')
        })
      })
    })

    it('Field.Description', () => {
      render(() => (
        <Field.Root>
          <Switch.Root
            data-testid="button"
            aria-describedby="external-description"
          />
          <Field.Description data-testid="description" />
        </Field.Root>
      ))

      const internalInput = getHiddenInput()
      const description = screen.getByTestId('description')
      expect(internalInput).toHaveAttribute('aria-describedby', description.id)
      expect(screen.getByTestId('button')).toHaveAttribute(
        'aria-describedby',
        `external-description ${description.id}`
      )
    })
  })

  it('can render a native button', () => {
    const { container } = render(() => (
      <Switch.Root render="button" nativeButton />
    ))

    const switchEl = getVisibleSwitch()
    expect(switchEl).toHaveAttribute('aria-checked', 'false')
    expect(container.querySelector('button')).toBe(switchEl)

    // Native <button> Enter activation is browser-handled; jsdom fireEvent
    // keyDown does not synthesize the click. Space on non-native is covered
    // above; here assert click + Space on the native host via click.
    fireEvent.click(switchEl)
    expect(switchEl).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(switchEl)
    expect(switchEl).toHaveAttribute('aria-checked', 'false')
  })
})

function getVisibleSwitch() {
  return screen.getByRole('switch')
}

function getHiddenInput() {
  return screen.getByRole<HTMLInputElement>('checkbox', { hidden: true })
}
