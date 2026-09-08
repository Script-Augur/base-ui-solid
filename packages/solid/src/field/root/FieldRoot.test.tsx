import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { Show, createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FieldsetRootContext } from '../../fieldset/root/FieldsetRootContext'
import { Field } from '../index'
import { FormErrorsProvider, flushMicrotasks, waitFor } from '../test-utils'

import type { FieldRootActions } from '../root/FieldRoot'

afterEach(() => {
  cleanup()
})

describe('<Field.Root />', () => {
  it('updates label association when replacing one control with another', async () => {
    function App() {
      const [showFirst, showFirstAssign] = createSignal(true)
      return (
        <Field.Root>
          <Show
            when={showFirst()}
            fallback={<Field.Control id="second" data-testid="second" />}
          >
            <Field.Control id="first" data-testid="first" />
          </Show>
          <Field.Label data-testid="label">Label</Field.Label>
          <button type="button" onClick={() => showFirstAssign(false)}>
            swap
          </button>
        </Field.Root>
      )
    }

    render(() => <App />)
    expect(screen.getByTestId('label')).toHaveAttribute('for', 'first')
    fireEvent.click(screen.getByText('swap'))
    await flushMicrotasks()
    expect(screen.getByTestId('label')).toHaveAttribute('for', 'second')
  })

  it('preserves null initial control ids', () => {
    render(() => (
      <Field.Root>
        <Field.Control
          id={null as unknown as undefined}
          data-testid="control"
        />
        <Field.Label data-testid="label">Label</Field.Label>
      </Field.Root>
    ))

    // Without an explicit id string, association uses the provider id.
    const control = screen.getByTestId('control')
    const label = screen.getByTestId('label')
    expect(label.getAttribute('for')).toBe(control.id)
  })

  it('updates label associations when the control id changes', async () => {
    function App() {
      const [id, idAssign] = createSignal('a')
      return (
        <Field.Root>
          <Field.Control id={id()} data-testid="control" />
          <Field.Label data-testid="label">Label</Field.Label>
          <button type="button" onClick={() => idAssign('b')}>
            change
          </button>
        </Field.Root>
      )
    }

    render(() => <App />)
    expect(screen.getByTestId('label')).toHaveAttribute('for', 'a')
    fireEvent.click(screen.getByText('change'))
    await flushMicrotasks()
    expect(screen.getByTestId('label')).toHaveAttribute('for', 'b')
  })

  it('falls back to a generated id when the control id is removed', async () => {
    function App() {
      const [id, idAssign] = createSignal<string | undefined>('explicit')
      return (
        <Field.Root>
          <Field.Control id={id()} data-testid="control" />
          <Field.Label data-testid="label">Label</Field.Label>
          <button type="button" onClick={() => idAssign(undefined)}>
            clear
          </button>
        </Field.Root>
      )
    }

    render(() => <App />)
    expect(screen.getByTestId('label')).toHaveAttribute('for', 'explicit')
    fireEvent.click(screen.getByText('clear'))
    await flushMicrotasks()
    const control = screen.getByTestId('control')
    expect(screen.getByTestId('label')).toHaveAttribute('for', control.id)
    expect(control.id).toBeTruthy()
  })

  describe('prop: disabled', () => {
    it('should add data-disabled style hook to all components', () => {
      render(() => (
        <Field.Root disabled data-testid="root">
          <Field.Label data-testid="label">Label</Field.Label>
          <Field.Control data-testid="control" />
          <Field.Description data-testid="description">Desc</Field.Description>
        </Field.Root>
      ))

      expect(screen.getByTestId('root')).toHaveAttribute('data-disabled')
      expect(screen.getByTestId('label')).toHaveAttribute('data-disabled')
      expect(screen.getByTestId('control')).toHaveAttribute('data-disabled')
      expect(screen.getByTestId('description')).toHaveAttribute('data-disabled')
    })

    it('keeps an explicitly invalid field marked invalid while disabled', () => {
      render(() => (
        <Field.Root disabled invalid data-testid="root">
          <Field.Control data-testid="control" />
        </Field.Root>
      ))

      expect(screen.getByTestId('root')).toHaveAttribute('data-invalid')
      expect(screen.getByTestId('control')).toHaveAttribute('data-invalid')
    })

    it('keeps a disabled field with form errors marked invalid', () => {
      render(() => (
        <FormErrorsProvider errors={{ name: 'Server error' }}>
          <Field.Root name="name" disabled data-testid="root">
            <Field.Control data-testid="control" />
          </Field.Root>
        </FormErrorsProvider>
      ))

      expect(screen.getByTestId('root')).toHaveAttribute('data-invalid')
      expect(screen.getByTestId('control')).toHaveAttribute('data-invalid')
    })

    it('inherits disabled from Fieldset context', () => {
      render(() => (
        <FieldsetRootContext.Provider value={{ disabled: () => true }}>
          <Field.Root data-testid="root">
            <Field.Control data-testid="control" />
          </Field.Root>
        </FieldsetRootContext.Provider>
      ))

      expect(screen.getByTestId('root')).toHaveAttribute('data-disabled')
      expect(screen.getByTestId('control')).toHaveAttribute('disabled')
    })
  })

  describe('prop: validate', () => {
    it('when not in <Form> the function does not run by default', () => {
      const validate = vi.fn(() => 'error')

      render(() => (
        <Field.Root validate={validate}>
          <Field.Control />
          <Field.Error />
        </Field.Root>
      ))

      const control = screen.getByRole('textbox')
      fireEvent.focus(control)
      fireEvent.change(control, { target: { value: 'a' } })
      fireEvent.blur(control)

      expect(validate).not.toHaveBeenCalled()
      expect(screen.queryByText('error')).toBe(null)
    })

    it('runs on blur when validationMode is onBlur', async () => {
      const validate = vi.fn((value: unknown) =>
        value === 'bad' ? 'error' : null
      )

      render(() => (
        <Field.Root validationMode="onBlur" validate={validate}>
          <Field.Control />
          <Field.Error />
        </Field.Root>
      ))

      const control = screen.getByRole('textbox')
      fireEvent.focus(control)
      fireEvent.change(control, { target: { value: 'bad' } })
      fireEvent.blur(control)

      await waitFor(() => {
        expect(validate).toHaveBeenCalled()
        expect(screen.getByText('error')).toBeTruthy()
      })
    })

    it('should apply aria-invalid prop to control once validation finishes', async () => {
      render(() => (
        <Field.Root validationMode="onBlur" validate={() => 'error'}>
          <Field.Control />
        </Field.Root>
      ))

      const control = screen.getByRole('textbox')
      fireEvent.focus(control)
      fireEvent.change(control, { target: { value: 'a' } })
      expect(control).not.toHaveAttribute('aria-invalid')
      fireEvent.blur(control)

      await waitFor(() => {
        expect(control).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('uses the Field.Control name fallback when the Field.Root name is removed', async () => {
      function App() {
        const [name, nameAssign] = createSignal<string | undefined>('email')
        return (
          <FormErrorsProvider errors={{ email: 'Email is already taken' }}>
            <Field.Root name={name()}>
              <Field.Control name="email" />
              <Field.Error />
              <button type="button" onClick={() => nameAssign(undefined)}>
                clear-name
              </button>
            </Field.Root>
          </FormErrorsProvider>
        )
      }

      render(() => <App />)
      expect(screen.getByText('Email is already taken')).toBeTruthy()
      fireEvent.click(screen.getByText('clear-name'))
      await flushMicrotasks()
      expect(screen.getByText('Email is already taken')).toBeTruthy()
    })
  })

  describe('prop: validationMode', () => {
    describe('onChange', () => {
      it('validates the field on change', async () => {
        render(() => (
          <Field.Root
            validationMode="onChange"
            validate={value => ((value as string).length < 3 ? 'error' : null)}
          >
            <Field.Control />
            <Field.Error />
          </Field.Root>
        ))

        const control = screen.getByRole('textbox')
        fireEvent.change(control, { target: { value: 't' } })

        await waitFor(() => {
          expect(control).toHaveAttribute('aria-invalid', 'true')
          expect(screen.getByText('error')).toBeTruthy()
        })

        fireEvent.change(control, { target: { value: 'tes' } })
        await waitFor(() => {
          expect(control).not.toHaveAttribute('aria-invalid')
          expect(screen.queryByText('error')).toBe(null)
        })
      })
    })

    describe('onBlur', () => {
      it('validates the field on blur', async () => {
        render(() => (
          <Field.Root
            validationMode="onBlur"
            validate={value => ((value as string).length < 3 ? 'error' : null)}
          >
            <Field.Control />
            <Field.Error />
          </Field.Root>
        ))

        const control = screen.getByRole('textbox')
        fireEvent.focus(control)
        fireEvent.change(control, { target: { value: 't' } })
        expect(screen.queryByText('error')).toBe(null)
        fireEvent.blur(control)

        await waitFor(() => {
          expect(screen.getByText('error')).toBeTruthy()
        })
      })

      it('should not mark invalid if `valueMissing` is the only error and not yet dirtied', async () => {
        render(() => (
          <Field.Root validationMode="onBlur">
            <Field.Control required />
            <Field.Error match="valueMissing">Required</Field.Error>
          </Field.Root>
        ))

        const control = screen.getByRole('textbox')
        fireEvent.focus(control)
        fireEvent.blur(control)

        await flushMicrotasks()
        expect(control).not.toHaveAttribute('aria-invalid')
        expect(screen.queryByText('Required')).toBe(null)
      })

      it('should mark invalid if `valueMissing` is the only error and dirtied', async () => {
        render(() => (
          <Field.Root validationMode="onBlur">
            <Field.Control required />
            <Field.Error match="valueMissing">Required</Field.Error>
          </Field.Root>
        ))

        const control = screen.getByRole('textbox')
        fireEvent.focus(control)
        fireEvent.change(control, { target: { value: 'a' } })
        fireEvent.change(control, { target: { value: '' } })
        fireEvent.blur(control)

        await waitFor(() => {
          expect(control).toHaveAttribute('aria-invalid', 'true')
          expect(screen.getByText('Required')).toBeTruthy()
        })
      })

      it('supports async validation', async () => {
        render(() => (
          <Field.Root
            validationMode="onBlur"
            validate={async value => {
              await Promise.resolve()
              return (value as string) === 'bad' ? 'async error' : null
            }}
          >
            <Field.Control />
            <Field.Error />
          </Field.Root>
        ))

        const control = screen.getByRole('textbox')
        fireEvent.focus(control)
        fireEvent.change(control, { target: { value: 'bad' } })
        fireEvent.blur(control)

        await waitFor(() => {
          expect(screen.getByText('async error')).toBeTruthy()
        })
      })

      it('ignores stale async validation results', async () => {
        let resolveFirst: (value: string | null) => void = () => {}
        const first = new Promise<string | null>(resolve => {
          resolveFirst = resolve
        })
        let call = 0

        render(() => (
          <Field.Root
            validationMode="onBlur"
            validate={() => {
              call += 1
              if (call === 1) return first
              return Promise.resolve('second')
            }}
          >
            <Field.Control />
            <Field.Error />
          </Field.Root>
        ))

        const control = screen.getByRole('textbox')
        fireEvent.focus(control)
        fireEvent.change(control, { target: { value: 'a' } })
        fireEvent.blur(control)

        fireEvent.focus(control)
        fireEvent.change(control, { target: { value: 'b' } })
        fireEvent.blur(control)

        await waitFor(() => {
          expect(screen.getByText('second')).toBeTruthy()
        })

        resolveFirst('first')
        await flushMicrotasks()
        expect(screen.queryByText('first')).toBe(null)
        expect(screen.getByText('second')).toBeTruthy()
      })

      it('should apply [data-field] style hooks to field components', async () => {
        render(() => (
          <Field.Root validationMode="onBlur" validate={() => 'error'}>
            <Field.Label data-testid="label">Label</Field.Label>
            <Field.Control data-testid="control" />
            <Field.Description data-testid="description">
              Desc
            </Field.Description>
            <Field.Error data-testid="error" />
          </Field.Root>
        ))

        const control = screen.getByTestId('control')
        fireEvent.focus(control)
        fireEvent.change(control, { target: { value: 'a' } })
        fireEvent.blur(control)

        await waitFor(() => {
          expect(screen.getByTestId('label')).toHaveAttribute('data-invalid')
          expect(control).toHaveAttribute('data-invalid')
          expect(screen.getByTestId('description')).toHaveAttribute(
            'data-invalid'
          )
          expect(screen.getByTestId('error')).toHaveAttribute('data-invalid')
        })
      })

      describe('revalidation', () => {
        it('revalidates on change for `valueMissing`', async () => {
          render(() => (
            <Field.Root validationMode="onBlur">
              <Field.Control required />
              <Field.Error match="valueMissing">Required</Field.Error>
            </Field.Root>
          ))

          const control = screen.getByRole('textbox')
          fireEvent.focus(control)
          fireEvent.change(control, { target: { value: 'a' } })
          fireEvent.change(control, { target: { value: '' } })
          fireEvent.blur(control)

          await waitFor(() => {
            expect(screen.getByText('Required')).toBeTruthy()
          })

          fireEvent.change(control, { target: { value: 'ok' } })
          await waitFor(() => {
            expect(screen.queryByText('Required')).toBe(null)
            expect(control).not.toHaveAttribute('aria-invalid')
          })
        })

        it('should mark field as invalid for other errors (e.g., typeMismatch) even if not dirty', async () => {
          render(() => (
            <Field.Root validationMode="onBlur">
              <Field.Control type="email" />
              <Field.Error match="typeMismatch">Bad email</Field.Error>
            </Field.Root>
          ))

          const control = screen.getByRole('textbox')
          fireEvent.focus(control)
          fireEvent.change(control, { target: { value: 'not-an-email' } })
          fireEvent.blur(control)

          await waitFor(() => {
            expect(control).toHaveAttribute('aria-invalid', 'true')
            expect(screen.getByText('Bad email')).toBeTruthy()
          })
        })
      })
    })
  })

  describe('prop: validateDebounceTime', () => {
    it('should debounce validation', async () => {
      vi.useFakeTimers({ toFake: ['performance', 'requestAnimationFrame'] })
      let now = 0
      vi.spyOn(performance, 'now').mockImplementation(() => now)
      const frames: Array<FrameRequestCallback> = []
      vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
        frames.push(cb)
        return frames.length
      })
      vi.stubGlobal('cancelAnimationFrame', (id: number) => {
        frames[id - 1] = () => undefined
      })

      try {
        render(() => (
          <Field.Root
            validationDebounceTime={100}
            validationMode="onChange"
            validate={value => {
              const str = value as string
              return str.length < 3 ? 'error' : null
            }}
          >
            <Field.Control />
            <Field.Error />
          </Field.Root>
        ))

        const control = screen.getByRole('textbox')
        fireEvent.change(control, { target: { value: 't' } })
        expect(control).not.toHaveAttribute('aria-invalid')

        now = 99
        frames.at(-1)?.(now)
        fireEvent.change(control, { target: { value: 'te' } })

        now = 198
        frames.at(-1)?.(now)
        expect(control).not.toHaveAttribute('aria-invalid')

        now = 199
        frames.at(-1)?.(now)

        await waitFor(() => {
          expect(control).toHaveAttribute('aria-invalid', 'true')
          expect(screen.getByText('error')).toBeTruthy()
        })
      } finally {
        vi.unstubAllGlobals()
        vi.useRealTimers()
      }
    })
  })

  describe('style hooks', () => {
    describe('touched', () => {
      it('should apply [data-touched] style hook to all components when touched', async () => {
        render(() => (
          <Field.Root data-testid="root">
            <Field.Label data-testid="label">Label</Field.Label>
            <Field.Control data-testid="control" />
            <Field.Description data-testid="description">
              Desc
            </Field.Description>
          </Field.Root>
        ))

        const control = screen.getByTestId('control')
        fireEvent.focus(control)
        fireEvent.blur(control)

        await waitFor(() => {
          expect(screen.getByTestId('root')).toHaveAttribute('data-touched')
          expect(screen.getByTestId('label')).toHaveAttribute('data-touched')
          expect(control).toHaveAttribute('data-touched')
          expect(screen.getByTestId('description')).toHaveAttribute(
            'data-touched'
          )
        })
      })
    })

    describe('dirty', () => {
      it('should apply [data-dirty] style hook to all components when dirty', async () => {
        render(() => (
          <Field.Root data-testid="root">
            <Field.Label data-testid="label">Label</Field.Label>
            <Field.Control data-testid="control" />
            <Field.Description data-testid="description">
              Desc
            </Field.Description>
          </Field.Root>
        ))

        const control = screen.getByTestId('control')
        fireEvent.change(control, { target: { value: 'a' } })

        await waitFor(() => {
          expect(screen.getByTestId('root')).toHaveAttribute('data-dirty')
          expect(screen.getByTestId('label')).toHaveAttribute('data-dirty')
          expect(control).toHaveAttribute('data-dirty')
          expect(screen.getByTestId('description')).toHaveAttribute(
            'data-dirty'
          )
        })
      })
    })

    describe('filled', () => {
      it('should apply [data-filled] style hook to all components when filled', async () => {
        render(() => (
          <Field.Root data-testid="root">
            <Field.Label data-testid="label">Label</Field.Label>
            <Field.Control data-testid="control" />
            <Field.Description data-testid="description">
              Desc
            </Field.Description>
          </Field.Root>
        ))

        const control = screen.getByTestId('control')
        fireEvent.change(control, { target: { value: 'a' } })

        await waitFor(() => {
          expect(screen.getByTestId('root')).toHaveAttribute('data-filled')
          expect(screen.getByTestId('label')).toHaveAttribute('data-filled')
          expect(control).toHaveAttribute('data-filled')
          expect(screen.getByTestId('description')).toHaveAttribute(
            'data-filled'
          )
        })
      })

      it('changes [data-filled] when the value is changed externally', async () => {
        function App() {
          const [value, valueAssign] = createSignal('')
          return (
            <div>
              <Field.Root data-testid="root">
                <Field.Control value={value()} data-testid="control" />
              </Field.Root>
              <button type="button" onClick={() => valueAssign('hello')}>
                set
              </button>
              <button type="button" onClick={() => valueAssign('')}>
                clear
              </button>
            </div>
          )
        }

        render(() => <App />)
        expect(screen.getByTestId('root')).not.toHaveAttribute('data-filled')
        fireEvent.click(screen.getByText('set'))
        await waitFor(() => {
          expect(screen.getByTestId('root')).toHaveAttribute('data-filled')
        })
        fireEvent.click(screen.getByText('clear'))
        await waitFor(() => {
          expect(screen.getByTestId('root')).not.toHaveAttribute('data-filled')
        })
      })
    })

    describe('focused', () => {
      it('should apply [data-focused] style hook to all components when focused', async () => {
        render(() => (
          <Field.Root data-testid="root">
            <Field.Label data-testid="label">Label</Field.Label>
            <Field.Control data-testid="control" />
            <Field.Description data-testid="description">
              Desc
            </Field.Description>
          </Field.Root>
        ))

        const control = screen.getByTestId('control')
        fireEvent.focus(control)

        await waitFor(() => {
          expect(screen.getByTestId('root')).toHaveAttribute('data-focused')
          expect(screen.getByTestId('label')).toHaveAttribute('data-focused')
          expect(control).toHaveAttribute('data-focused')
          expect(screen.getByTestId('description')).toHaveAttribute(
            'data-focused'
          )
        })

        fireEvent.blur(control)
        await waitFor(() => {
          expect(screen.getByTestId('root')).not.toHaveAttribute('data-focused')
        })
      })
    })
  })

  describe('prop: dirty', () => {
    it('controls the dirty state', () => {
      render(() => (
        <Field.Root dirty data-testid="root">
          <Field.Control data-testid="control" />
        </Field.Root>
      ))

      expect(screen.getByTestId('root')).toHaveAttribute('data-dirty')
      expect(screen.getByTestId('control')).toHaveAttribute('data-dirty')
    })

    it('does not update controlled dirty state from user input', async () => {
      render(() => (
        <Field.Root dirty={false} data-testid="root">
          <Field.Control data-testid="control" />
        </Field.Root>
      ))

      fireEvent.change(screen.getByTestId('control'), {
        target: { value: 'a' },
      })
      await flushMicrotasks()
      expect(screen.getByTestId('root')).not.toHaveAttribute('data-dirty')
    })
  })

  describe('prop: touched', () => {
    it('controls the touched state', () => {
      render(() => (
        <Field.Root touched data-testid="root">
          <Field.Control data-testid="control" />
        </Field.Root>
      ))

      expect(screen.getByTestId('root')).toHaveAttribute('data-touched')
      expect(screen.getByTestId('control')).toHaveAttribute('data-touched')
    })

    it('does not update controlled touched state on blur', async () => {
      render(() => (
        <Field.Root touched={false} data-testid="root">
          <Field.Control data-testid="control" />
        </Field.Root>
      ))

      const control = screen.getByTestId('control')
      fireEvent.focus(control)
      fireEvent.blur(control)
      await flushMicrotasks()
      expect(screen.getByTestId('root')).not.toHaveAttribute('data-touched')
    })
  })

  describe('prop: actionsRef', () => {
    it('validates the field when the `validate` method is called', async () => {
      const actionsRef: { current: FieldRootActions | null } = {
        current: null,
      }

      render(() => (
        <Field.Root
          actionsRef={actionsRef}
          validationMode="onSubmit"
          validate={() => 'error'}
        >
          <Field.Control />
          <Field.Error />
        </Field.Root>
      ))

      await flushMicrotasks()
      expect(actionsRef.current).toBeTruthy()
      actionsRef.current!.validate()

      await waitFor(() => {
        expect(screen.getByText('error')).toBeTruthy()
      })
    })

    it('validates a logical field without a mounted control', async () => {
      const actionsRef: { current: FieldRootActions | null } = {
        current: null,
      }

      render(() => (
        <Field.Root actionsRef={actionsRef} validate={() => 'logical error'}>
          <Field.Error />
        </Field.Root>
      ))

      await flushMicrotasks()
      actionsRef.current!.validate()

      await waitFor(() => {
        expect(screen.getByText('logical error')).toBeTruthy()
      })
    })

    it('validates the current control value when the `validate` method is called', async () => {
      const validate = vi.fn((value: unknown) =>
        value === 'ok' ? null : 'error'
      )
      const actionsRef: { current: FieldRootActions | null } = {
        current: null,
      }

      render(() => (
        <Field.Root actionsRef={actionsRef} validate={validate}>
          <Field.Control defaultValue="ok" />
          <Field.Error />
        </Field.Root>
      ))

      await flushMicrotasks()
      actionsRef.current!.validate()
      await waitFor(() => {
        expect(validate).toHaveBeenCalled()
        expect(validate.mock.lastCall?.[0]).toBe('ok')
      })
    })
  })
})
