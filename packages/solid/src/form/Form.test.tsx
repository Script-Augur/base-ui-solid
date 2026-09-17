/**
 * Port of `@base-ui/react` Form tests (v1.7.0).
 * Skips documented in `./UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { For, Show, createSignal } from 'solid-js'
import { Portal } from 'solid-js/web'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Field } from '../field'
import { flushMicrotasks, waitFor } from '../field/test-utils'
import { Fieldset } from '../fieldset'

import { Form } from './Form'

import type { FormActions } from './Form'
import type { Errors } from '../internals/form-context/FormContext'

afterEach(() => {
  cleanup()
})

describe('<Form />', () => {
  it('does not submit if there are errors', () => {
    const onSubmit = vi.fn()

    render(() => (
      <Form onSubmit={onSubmit}>
        <Field.Root>
          <Field.Control required />
          <Field.Error data-testid="error" />
        </Field.Root>
        <button type="submit">Submit</button>
      </Form>
    ))

    fireEvent.click(screen.getByRole('button'))

    expect(screen.getByTestId('error')).toBeInTheDocument()
    expect(onSubmit.mock.calls.length > 0).toBe(false)
  })

  it('blocks submit and focuses the first invalid field across custom and native validation', () => {
    const onFormSubmit = vi.fn()
    const select = vi.spyOn(HTMLInputElement.prototype, 'select')

    try {
      render(() => (
        <Form onFormSubmit={onFormSubmit}>
          <Field.Root name="custom" validate={() => 'custom error'}>
            <Field.Control data-testid="custom" />
          </Field.Root>
          <Field.Root name="native">
            <Field.Control data-testid="native" required />
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>
      ))

      fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

      expect(onFormSubmit).not.toHaveBeenCalled()
      expect(screen.getByTestId('custom')).toHaveFocus()
      expect(select).toHaveBeenCalledTimes(1)
    } finally {
      select.mockRestore()
    }
  })

  it('keeps focusing the first invalid field after a control value changes', () => {
    render(() => (
      <Form>
        <Field.Root name="a">
          <Field.Control required data-testid="a" />
        </Field.Root>
        <Field.Root name="b">
          <Field.Control required data-testid="b" />
        </Field.Root>
        <button type="submit">Submit</button>
      </Form>
    ))

    const inputA = screen.getByTestId('a')
    const submit = screen.getByRole('button', { name: 'Submit' })

    fireEvent.click(submit)
    expect(inputA).toHaveFocus()

    fireEvent.input(inputA, { target: { value: 'x' } })
    fireEvent.input(inputA, { target: { value: '' } })

    fireEvent.click(submit)
    expect(inputA).toHaveFocus()
  })

  it('keeps the registration-order focus fallback stable across disconnected trees', () => {
    const firstHost = document.createElement('div')
    const secondHost = document.createElement('div')
    const firstContainer = document.createElement('div')
    const secondContainer = document.createElement('div')
    const firstRoot = firstHost.attachShadow({ mode: 'open' })
    const secondRoot = secondHost.attachShadow({ mode: 'open' })
    firstRoot.append(firstContainer)
    secondRoot.append(secondContainer)
    document.body.append(firstHost, secondHost)

    try {
      const { unmount } = render(() => (
        <Form>
          <Portal mount={firstContainer}>
            <Field.Root name="a">
              <Field.Control required data-testid="a" />
            </Field.Root>
          </Portal>
          <Portal mount={secondContainer}>
            <Field.Root name="b">
              <Field.Control required data-testid="b" />
            </Field.Root>
          </Portal>
          <button type="submit">Submit</button>
        </Form>
      ))

      try {
        const inputA = firstContainer.querySelector('[data-testid="a"]')
        if (!inputA) {
          throw new Error('Expected field control in first shadow root')
        }

        const submit = screen.getByRole('button', { name: 'Submit' })
        const form = submit.closest('form')
        if (!form) {
          throw new Error('Expected submit button to be inside a form')
        }

        // Disconnected shadow trees cannot use document-order; fallback is
        // registration order (a then b).
        fireEvent.submit(form)
        expect(firstRoot.activeElement).toBe(inputA)

        // Updating the control refreshes registration without changing order.
        fireEvent.input(inputA, { target: { value: 'x' } })
        fireEvent.input(inputA, { target: { value: '' } })
        fireEvent.submit(form)

        expect(firstRoot.activeElement).toBe(inputA)
      } finally {
        unmount()
      }
    } finally {
      firstHost.remove()
      secondHost.remove()
    }
  })

  it('focuses the first invalid field in document order when keyed fields are reordered', () => {
    const [names, namesAssign] = createSignal(['a', 'b'])

    render(() => (
      <>
        <button type="button" onClick={() => namesAssign(['b', 'a'])}>
          Reorder
        </button>
        <Form>
          {/*
            Solid `<For>` (like React `key={name}`) moves existing field nodes
            without remounting, so the Form registry Map keeps registration
            order [a, b] while DOM order flips to [b, a]. A plain `.map()` remount
            would re-register in DOM order and mask that divergence.
          */}
          <For each={names()}>
            {name => (
              <Field.Root name={name}>
                <Field.Control required data-testid={name} />
              </Field.Root>
            )}
          </For>
          <button type="submit">Submit</button>
        </Form>
      </>
    ))

    const inputA = screen.getByTestId('a')
    const inputB = screen.getByTestId('b')

    fireEvent.click(screen.getByRole('button', { name: 'Reorder' }))

    // DOM flipped; same element instances (no remount).
    expect(
      inputB.compareDocumentPosition(inputA) & Node.DOCUMENT_POSITION_FOLLOWING
    ).not.toBe(0)
    expect(screen.getByTestId('a')).toBe(inputA)
    expect(screen.getByTestId('b')).toBe(inputB)

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    // Document-order focus must prefer DOM-first `b` over Map-first `a`.
    expect(inputB).toHaveFocus()
  })

  it('submits when a valid async validator is pending', () => {
    const onSubmit = vi.fn((event: Event) => {
      event.preventDefault()
    })
    const validate = vi.fn(() => new Promise<string>(() => {}))

    render(() => (
      <Form onSubmit={onSubmit}>
        <Field.Root validate={validate}>
          <Field.Control />
        </Field.Root>
        <button type="submit">Submit</button>
      </Form>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    expect(validate).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('does not submit if an unnamed registered field control is invalid', () => {
    const onSubmit = vi.fn((event: Event) => {
      event.preventDefault()
    })

    render(() => (
      <Form onSubmit={onSubmit}>
        <Field.Root>
          <Field.Control required />
          <Field.Error data-testid="error" />
        </Field.Root>
        <button type="submit">Submit</button>
      </Form>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByTestId('error')).toBeInTheDocument()
  })

  it('clears invalid state for an unnamed registered field control on change', () => {
    const onSubmit = vi.fn((event: Event) => {
      event.preventDefault()
    })

    render(() => (
      <Form onSubmit={onSubmit}>
        <Field.Root>
          <Field.Control required />
          <Field.Error data-testid="error" />
        </Field.Root>
        <button type="submit">Submit</button>
      </Form>
    ))

    const submit = screen.getByRole('button', { name: 'Submit' })
    const control = screen.getByRole('textbox')

    fireEvent.click(submit)

    expect(onSubmit).not.toHaveBeenCalled()
    expect(control).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByTestId('error')).toBeInTheDocument()

    fireEvent.input(control, { target: { value: 'ok' } })

    expect(control).not.toHaveAttribute('aria-invalid')
    expect(screen.queryByTestId('error')).toBe(null)

    fireEvent.click(submit)

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('keeps same-name field validity scoped on submit', () => {
    const onSubmit = vi.fn((event: Event) => {
      event.preventDefault()
    })

    render(() => (
      <Form onSubmit={onSubmit}>
        <Field.Root name="shared">
          <Field.Control required data-testid="first" />
          <Field.Error data-testid="first-error" />
        </Field.Root>
        <Field.Root name="shared">
          <Field.Control required defaultValue="ok" data-testid="second" />
          <Field.Error data-testid="second-error" />
        </Field.Root>
        <button type="submit">Submit</button>
      </Form>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByTestId('first')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByTestId('first-error')).toBeInTheDocument()
    expect(screen.getByTestId('second')).not.toHaveAttribute('aria-invalid')
    expect(screen.queryByTestId('second-error')).toBe(null)
  })

  it('unmounted fields should be removed from the form', () => {
    const submitSpy = vi.fn((event: Event) => event.preventDefault())
    const [checked, checkedAssign] = createSignal(true)

    render(() => (
      <Form onSubmit={submitSpy}>
        <Field.Root name="name">
          <Field.Control defaultValue="Alice" />
        </Field.Root>

        <input
          type="checkbox"
          checked={checked()}
          onChange={() => checkedAssign(!checked())}
        />

        <Show when={checked()}>
          <Field.Root name="email">
            <Field.Control defaultValue="" required data-testid="email" />
          </Field.Root>
        </Show>

        <button type="submit">Submit</button>
      </Form>
    ))

    const submit = screen.getByText('Submit')

    fireEvent.click(submit)
    expect(submitSpy.mock.calls.length).toBe(0)
    expect(screen.getByTestId('email')).toHaveAttribute('aria-invalid', 'true')

    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(submit)
    expect(submitSpy.mock.calls.length).toBe(1)
  })

  it('excludes disabled fieldset fields from validation and onFormSubmit values', () => {
    const handleSubmit = vi.fn()

    render(() => (
      <Form onFormSubmit={handleSubmit}>
        <Fieldset.Root disabled>
          <Field.Root name="disabled">
            <Field.Control required data-testid="disabled" />
          </Field.Root>
        </Fieldset.Root>
        <Field.Root name="enabled">
          <Field.Control defaultValue="sent" />
        </Field.Root>
        <button type="submit">Submit</button>
      </Form>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    expect(handleSubmit).toHaveBeenCalledTimes(1)
    expect(handleSubmit.mock.lastCall?.[0]).toEqual({ enabled: 'sent' })
    expect(screen.getByTestId('disabled')).not.toHaveAttribute('aria-invalid')
  })

  it('clears invalid UI when a fieldset field becomes disabled', () => {
    const handleSubmit = vi.fn()
    const [disabled, disabledAssign] = createSignal(false)

    render(() => (
      <Form onFormSubmit={handleSubmit}>
        <Fieldset.Root disabled={disabled()}>
          <Field.Root name="disabled">
            <Field.Control required data-testid="control" />
            <Field.Error data-testid="error" />
          </Field.Root>
        </Fieldset.Root>
        <button type="button" onClick={() => disabledAssign(true)}>
          Disable
        </button>
        <button type="button" onClick={() => disabledAssign(false)}>
          Enable
        </button>
        <button type="submit">Submit</button>
      </Form>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    expect(handleSubmit).not.toHaveBeenCalled()
    expect(screen.getByTestId('control')).toHaveAttribute(
      'aria-invalid',
      'true'
    )
    expect(screen.getByTestId('error')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Disable' }))

    expect(screen.getByTestId('control')).toBeDisabled()
    expect(screen.getByTestId('control')).not.toHaveAttribute('aria-invalid')
    expect(screen.queryByTestId('error')).toBe(null)

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    expect(handleSubmit).toHaveBeenCalledTimes(1)
    expect(handleSubmit.mock.lastCall?.[0]).toEqual({})

    fireEvent.click(screen.getByRole('button', { name: 'Enable' }))
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    expect(handleSubmit).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('control')).toHaveAttribute(
      'aria-invalid',
      'true'
    )
    expect(screen.getByTestId('error')).toBeInTheDocument()
  })

  it('clears invalid attributes when a field control becomes disabled', () => {
    const handleSubmit = vi.fn()
    const [disabled, disabledAssign] = createSignal(false)

    render(() => (
      <Form onFormSubmit={handleSubmit}>
        <Field.Root name="disabled">
          <Field.Control disabled={disabled()} required data-testid="control" />
        </Field.Root>
        <button type="button" onClick={() => disabledAssign(true)}>
          Disable
        </button>
        <button type="submit">Submit</button>
      </Form>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    expect(screen.getByTestId('control')).toHaveAttribute(
      'aria-invalid',
      'true'
    )

    fireEvent.click(screen.getByRole('button', { name: 'Disable' }))

    expect(screen.getByTestId('control')).toBeDisabled()
    expect(screen.getByTestId('control')).not.toHaveAttribute('aria-invalid')

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    expect(handleSubmit).toHaveBeenCalledTimes(1)
    expect(handleSubmit.mock.lastCall?.[0]).toEqual({})
  })

  it('re-registers field controls when they become enabled again', () => {
    const handleSubmit = vi.fn()
    const [disabled, disabledAssign] = createSignal(false)

    render(() => (
      <Form onFormSubmit={handleSubmit}>
        <Field.Root name="control">
          <Field.Control disabled={disabled()} required data-testid="control" />
        </Field.Root>
        <button type="button" onClick={() => disabledAssign(true)}>
          Disable
        </button>
        <button type="button" onClick={() => disabledAssign(false)}>
          Enable
        </button>
        <button type="submit">Submit</button>
      </Form>
    ))

    const submit = screen.getByRole('button', { name: 'Submit' })

    fireEvent.click(submit)

    expect(handleSubmit).not.toHaveBeenCalled()
    expect(screen.getByTestId('control')).toHaveAttribute(
      'aria-invalid',
      'true'
    )

    fireEvent.click(screen.getByRole('button', { name: 'Disable' }))
    fireEvent.click(submit)

    expect(handleSubmit).toHaveBeenCalledTimes(1)
    expect(handleSubmit.mock.lastCall?.[0]).toEqual({})

    fireEvent.click(screen.getByRole('button', { name: 'Enable' }))
    fireEvent.click(submit)

    expect(handleSubmit).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('control')).toHaveAttribute(
      'aria-invalid',
      'true'
    )

    fireEvent.input(screen.getByTestId('control'), {
      target: { value: 'sent' },
    })
    fireEvent.click(submit)

    expect(handleSubmit).toHaveBeenCalledTimes(2)
    expect(handleSubmit.mock.lastCall?.[0]).toEqual({ control: 'sent' })
  })

  describe('prop: errors', () => {
    it('should mark <Field.Control> as invalid and populate <Field.Error>', () => {
      render(() => (
        <Form errors={{ foo: 'bar' }}>
          <Field.Root name="foo">
            <Field.Control />
            <Field.Error data-testid="error" />
          </Field.Root>
        </Form>
      ))

      expect(screen.getByTestId('error')).toHaveTextContent('bar')
      expect(screen.getByRole('textbox')).toHaveAttribute(
        'aria-invalid',
        'true'
      )
    })

    it('should not mark <Field.Control> as invalid if no error is provided', () => {
      render(() => (
        <Form>
          <Field.Root name="foo">
            <Field.Control />
            <Field.Error data-testid="error" />
          </Field.Root>
        </Form>
      ))

      expect(screen.queryByTestId('error')).toBe(null)
      expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid')
    })

    it('focuses asynchronously replaced external errors and clears only the changed own property', async () => {
      const [errors, errorsAssign] = createSignal<Errors | undefined>()

      render(() => (
        <Form
          errors={errors()}
          onFormSubmit={() => {
            const nextErrors = Object.create(null) as Record<string, string>
            nextErrors.first = 'First error'
            nextErrors.second = 'Second error'
            Promise.resolve().then(() => errorsAssign(nextErrors))
          }}
        >
          <Field.Root name="first">
            <Field.Control data-testid="first" />
            <Field.Error data-testid="first-error" />
          </Field.Root>
          <Field.Root name="second">
            <Field.Control data-testid="second" />
            <Field.Error data-testid="second-error" />
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>
      ))

      fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
      await waitFor(() => expect(screen.getByTestId('first')).toHaveFocus())
      expect(screen.getByTestId('first-error')).toHaveTextContent('First error')
      expect(screen.getByTestId('second-error')).toHaveTextContent(
        'Second error'
      )

      fireEvent.input(screen.getByTestId('first'), { target: { value: 'a' } })

      expect(screen.queryByTestId('first-error')).toBe(null)
      expect(screen.getByTestId('second-error')).toHaveTextContent(
        'Second error'
      )
    })

    function ErrorsApp() {
      const [errors, errorsAssign] = createSignal<Errors>({})

      return (
        <Form
          errors={errors()}
          onSubmit={event => {
            event.preventDefault()
            const formData = new FormData(event.currentTarget)
            const name = formData.get('name') as string
            const age = formData.get('age') as string

            errorsAssign({
              ...(name === '' && { name: 'Name is required' }),
              ...(age === '' && { age: 'Age is required' }),
            })
          }}
        >
          <Field.Root name="name">
            <Field.Control data-testid="name" />
            <Field.Error data-testid="name-error" />
          </Field.Root>
          <Field.Root name="age">
            <Field.Control data-testid="age" />
            <Field.Error data-testid="age-error" />
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>
      )
    }

    it('focuses the first invalid field only on submit', async () => {
      render(() => <ErrorsApp />)

      const submit = screen.getByRole('button')
      const name = screen.getByTestId('name')
      const age = screen.getByTestId('age')

      fireEvent.click(submit)
      await waitFor(() => expect(name).toHaveFocus())

      fireEvent.input(name, { target: { value: 'John' } })

      expect(age).not.toHaveFocus()

      fireEvent.click(submit)
      await waitFor(() => expect(age).toHaveFocus())

      fireEvent.input(age, { target: { value: '42' } })

      // userEvent.click would move focus to the submit control; fireEvent does not.
      submit.focus()
      fireEvent.click(submit)

      expect(age).not.toHaveFocus()
    })

    it('does not swap focus immediately on change after two submissions', async () => {
      render(() => <ErrorsApp />)

      const submit = screen.getByRole('button')
      const name = screen.getByTestId('name')
      const age = screen.getByTestId('age')

      fireEvent.click(submit)
      await waitFor(() => expect(name).toHaveFocus())

      fireEvent.click(submit)

      fireEvent.input(name, { target: { value: 'John' } })

      expect(age).not.toHaveFocus()
    })

    it('removes errors upon change', async () => {
      render(() => <ErrorsApp />)

      const name = screen.getByTestId('name')
      const age = screen.getByTestId('age')

      fireEvent.click(screen.getByText('Submit'))
      await flushMicrotasks()

      expect(screen.queryByTestId('name-error')).not.toBe(null)
      expect(screen.queryByTestId('age-error')).not.toBe(null)

      fireEvent.input(name, { target: { value: 'John' } })
      fireEvent.input(age, { target: { value: '42' } })
      expect(screen.queryByTestId('name-error')).toBe(null)
      expect(screen.queryByTestId('age-error')).toBe(null)
    })

    it('runs field validation on first change after Form error is set', async () => {
      const validateSpy = vi.fn((value: unknown) => {
        if (value === 'abcd') {
          return 'field error'
        }
        return null
      })

      function Test() {
        const [errors, errorsAssign] = createSignal<Errors>({})

        return (
          <Form
            errors={errors()}
            onSubmit={event => {
              event.preventDefault()
              const formData = new FormData(event.currentTarget)
              const name = formData.get('name') as string

              if (name === 'abcde') {
                errorsAssign({ name: 'submit error' })
              } else {
                errorsAssign({})
              }
            }}
          >
            <Field.Root name="name" validate={validateSpy}>
              <Field.Control data-testid="name" />
              <Field.Error data-testid="name-error" />
            </Field.Root>
            <button type="submit">Submit</button>
          </Form>
        )
      }

      render(() => <Test />)

      const input = screen.getByTestId('name')
      fireEvent.input(input, { target: { value: 'abcde' } })
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
      await waitFor(() =>
        expect(screen.getByTestId('name-error')).toHaveTextContent(
          'submit error'
        )
      )

      validateSpy.mockClear()

      fireEvent.input(input, { target: { value: 'abcd' } })
      expect(validateSpy.mock.calls.length).toBe(1)
      expect(screen.queryByTestId('name-error')).not.toBe(null)
      expect(screen.getByTestId('name-error')).toHaveTextContent('field error')
    })

    it('runs field validation on change when invalid prop is true and validationMode is onChange', () => {
      const validateSpy = vi.fn(() => 'field error')

      render(() => (
        <Form errors={{ name: 'server error' }}>
          <Field.Root
            name="name"
            invalid
            validate={validateSpy}
            validationMode="onChange"
          >
            <Field.Control data-testid="name" />
            <Field.Error data-testid="name-error" />
          </Field.Root>
        </Form>
      ))

      const input = screen.getByTestId('name')
      expect(screen.getByTestId('name-error')).toHaveTextContent('server error')

      fireEvent.input(input, { target: { value: 'a' } })

      expect(validateSpy.mock.calls.length).toBe(1)
      expect(screen.getByTestId('name-error')).toHaveTextContent('field error')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('does not run field validation on change for onBlur mode when invalid prop is true', () => {
      const validateSpy = vi.fn(() => 'field error')

      render(() => (
        <Form errors={{ name: 'server error' }}>
          <Field.Root
            name="name"
            invalid
            validate={validateSpy}
            validationMode="onBlur"
          >
            <Field.Control data-testid="name" />
            <Field.Error data-testid="name-error" />
          </Field.Root>
        </Form>
      ))

      const input = screen.getByTestId('name')
      expect(screen.getByTestId('name-error')).toHaveTextContent('server error')

      fireEvent.input(input, { target: { value: 'a' } })
      expect(validateSpy.mock.calls.length).toBe(0)
      expect(screen.queryByTestId('name-error')).toBe(null)

      fireEvent.blur(input)
      expect(validateSpy.mock.calls.length).toBe(1)
      expect(screen.getByTestId('name-error')).toHaveTextContent('field error')
    })
  })

  describe('prop: onFormSubmit', () => {
    it('runs when the form is submitted', () => {
      const submitSpy = vi.fn((formValues, eventDetails) => ({
        formValues,
        eventDetails,
      }))

      render(() => (
        <Form onFormSubmit={submitSpy}>
          <Field.Root name="username">
            <Field.Control defaultValue="alice132" />
          </Field.Root>
          <Field.Root name="quantity">
            <Field.Control defaultValue="5" />
          </Field.Root>
          <button type="submit">submit</button>
        </Form>
      ))

      fireEvent.click(screen.getByText('submit'))

      expect(submitSpy.mock.calls.length).toBe(1)
      expect(submitSpy.mock.results.at(-1)?.value.formValues).toEqual({
        username: 'alice132',
        quantity: '5',
      })
      expect(
        submitSpy.mock.results.at(-1)?.value.eventDetails.event.defaultPrevented
      ).toBe(true)
    })

    it('does not run when the form is invalid', () => {
      const submitSpy = vi.fn()

      render(() => (
        <Form onFormSubmit={submitSpy}>
          <Field.Root name="username">
            <Field.Control defaultValue="" required />
            <Field.Error data-testid="error" />
          </Field.Root>
          <button type="submit">submit</button>
        </Form>
      ))

      expect(screen.queryByTestId('error')).toBe(null)
      fireEvent.click(screen.getByText('submit'))
      expect(submitSpy.mock.calls.length).toBe(0)
      expect(screen.queryByTestId('error')).not.toBe(null)
    })
  })

  it('does not submit when invalid prop remains true even if validate returns null', () => {
    const submitSpy = vi.fn()
    const validateSpy = vi.fn(() => null)

    render(() => (
      <Form onFormSubmit={submitSpy}>
        <Field.Root
          name="name"
          invalid
          validate={validateSpy}
          validationMode="onChange"
        >
          <Field.Control data-testid="name" />
          <Field.Error data-testid="name-error" />
        </Field.Root>
        <button type="submit">submit</button>
      </Form>
    ))

    const input = screen.getByTestId('name')
    fireEvent.input(input, { target: { value: 'o' } })

    expect(validateSpy.mock.calls.length).toBe(1)

    fireEvent.click(screen.getByText('submit'))

    expect(submitSpy.mock.calls.length).toBe(0)
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  describe('prop: noValidate', () => {
    it('should disable native validation if set to true (default)', () => {
      render(() => <Form data-testid="form" />)
      expect(screen.getByTestId('form')).toHaveAttribute('novalidate')
    })

    it('should enable native validation if set to false', () => {
      render(() => <Form data-testid="form" noValidate={false} />)
      expect(screen.getByTestId('form')).not.toHaveAttribute('novalidate')
    })
  })

  describe('prop: actionsRef', () => {
    it('validates the form when the `validate` method is called', () => {
      const actionsRef: { current: FormActions | null } = { current: null }

      render(() => (
        <>
          <Form actionsRef={actionsRef}>
            <Field.Root name="username">
              <Field.Control defaultValue="" required />
              <Field.Error data-testid="error" />
            </Field.Root>
            <Field.Root name="quantity" validate={() => 'error'}>
              <Field.Control defaultValue="5" />
              <Field.Error data-testid="error" />
            </Field.Root>
            <button type="submit">submit</button>
          </Form>
          <button type="button" onClick={() => actionsRef.current?.validate()}>
            validate
          </button>
        </>
      ))

      expect(screen.queryByTestId('error')).toBe(null)

      fireEvent.click(screen.getByText('validate'))

      expect(screen.queryAllByTestId('error').length).toBe(2)
    })

    it('validates a field when the `validate` method is called with the field name', () => {
      const actionsRef: { current: FormActions | null } = { current: null }

      render(() => (
        <>
          <Form actionsRef={actionsRef}>
            <Field.Root name="username">
              <Field.Control defaultValue="" required />
              <Field.Error data-testid="error" />
            </Field.Root>
            <Field.Root name="quantity" validate={() => 'number field error'}>
              <Field.Control defaultValue="5" />
              <Field.Error data-testid="error" />
            </Field.Root>
            <button type="submit">submit</button>
          </Form>
          <button
            type="button"
            onClick={() => actionsRef.current?.validate('quantity')}
          >
            validate
          </button>
        </>
      ))

      expect(screen.queryByTestId('error')).toBe(null)

      fireEvent.click(screen.getByText('validate'))

      expect(screen.getByTestId('error')).toHaveTextContent(
        'number field error'
      )
    })

    it('targets only the current registration after name, id, and control replacement', () => {
      const initialValidate = vi.fn(() => null)
      const renamedValidate = vi.fn(() => null)
      const replacementValidate = vi.fn(() => null)
      const actionsRef: { current: FormActions | null } = { current: null }
      const [step, stepAssign] = createSignal(0)

      render(() => (
        <>
          <Form actionsRef={actionsRef}>
            {/* Keyed Show remounts Field like React `key={step}`. */}
            <Show when={step() !== 2 ? String(step()) : null} keyed>
              {stepKey => {
                const currentStep = Number(stepKey)
                const name = currentStep === 0 ? 'initial' : 'current'
                let validate = initialValidate
                if (currentStep === 1) {
                  validate = renamedValidate
                } else if (currentStep > 1) {
                  validate = replacementValidate
                }

                return (
                  <Field.Root name={name} validate={validate}>
                    <Field.Control id={`control-${currentStep}`} />
                  </Field.Root>
                )
              }}
            </Show>
          </Form>
          <button type="button" onClick={() => stepAssign(1)}>
            Rename
          </button>
          <button type="button" onClick={() => stepAssign(2)}>
            Unmount
          </button>
          <button type="button" onClick={() => stepAssign(3)}>
            Replace
          </button>
          <button
            type="button"
            onClick={() => actionsRef.current?.validate('initial')}
          >
            Validate initial
          </button>
          <button
            type="button"
            onClick={() => actionsRef.current?.validate('current')}
          >
            Validate current
          </button>
        </>
      ))

      fireEvent.click(screen.getByRole('button', { name: 'Rename' }))
      fireEvent.click(screen.getByRole('button', { name: 'Validate initial' }))
      fireEvent.click(screen.getByRole('button', { name: 'Validate current' }))

      expect(initialValidate).not.toHaveBeenCalled()
      expect(renamedValidate).toHaveBeenCalledTimes(1)

      fireEvent.click(screen.getByRole('button', { name: 'Unmount' }))
      fireEvent.click(screen.getByRole('button', { name: 'Validate current' }))
      expect(renamedValidate).toHaveBeenCalledTimes(1)

      fireEvent.click(screen.getByRole('button', { name: 'Replace' }))
      fireEvent.click(screen.getByRole('button', { name: 'Validate current' }))

      expect(replacementValidate).toHaveBeenCalledTimes(1)
    })

    it('clears actionsRef on unmount', () => {
      const actionsRef: { current: FormActions | null } = { current: null }
      const [mounted, mountedAssign] = createSignal(true)

      render(() => (
        <>
          <Show when={mounted()}>
            <Form actionsRef={actionsRef}>
              <Field.Root name="x">
                <Field.Control />
              </Field.Root>
            </Form>
          </Show>
          <button type="button" onClick={() => mountedAssign(false)}>
            Unmount
          </button>
        </>
      ))

      expect(actionsRef.current).toBeTruthy()
      fireEvent.click(screen.getByRole('button', { name: 'Unmount' }))
      expect(actionsRef.current).toBe(null)
    })
  })
})
