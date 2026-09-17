/**
 * Port of `@base-ui/react` CheckboxGroup tests (v1.7.0).
 * Skips documented in `./UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Checkbox } from '../checkbox'
import { Field } from '../field'
import { Form } from '../form'

import { CheckboxGroup } from './index'

import type { CheckboxGroupChangeEventDetails } from './CheckboxGroup'
import type { CheckboxRootChangeEventDetails } from '../checkbox/root/CheckboxRoot'

afterEach(() => {
  cleanup()
})

describe('<CheckboxGroup />', () => {
  describe('prop: id', () => {
    it('is forwarded to the root element', () => {
      render(() => <CheckboxGroup id="group-id" />)
      expect(screen.getByRole('group')).toHaveAttribute('id', 'group-id')
    })
  })

  describe('prop: value', () => {
    it('should control the value', () => {
      function App() {
        const [value, valueAssign] = createSignal(['red'])
        return (
          <CheckboxGroup value={value()} onValueChange={valueAssign}>
            <Checkbox.Root name="red" data-testid="red" />
            <Checkbox.Root name="green" data-testid="green" />
            <Checkbox.Root name="blue" data-testid="blue" />
          </CheckboxGroup>
        )
      }

      render(() => <App />)

      const red = screen.getByTestId('red')
      const green = screen.getByTestId('green')
      const blue = screen.getByTestId('blue')

      expect(red).toHaveAttribute('aria-checked', 'true')
      expect(green).toHaveAttribute('aria-checked', 'false')
      expect(blue).toHaveAttribute('aria-checked', 'false')

      fireEvent.click(green)

      expect(red).toHaveAttribute('aria-checked', 'true')
      expect(green).toHaveAttribute('aria-checked', 'true')
      expect(blue).toHaveAttribute('aria-checked', 'false')

      fireEvent.click(blue)

      expect(red).toHaveAttribute('aria-checked', 'true')
      expect(green).toHaveAttribute('aria-checked', 'true')
      expect(blue).toHaveAttribute('aria-checked', 'true')

      fireEvent.click(green)

      expect(red).toHaveAttribute('aria-checked', 'true')
      expect(green).toHaveAttribute('aria-checked', 'false')
      expect(blue).toHaveAttribute('aria-checked', 'true')
    })

    it('supports an empty string item value', () => {
      function App() {
        const [value, valueAssign] = createSignal([''])
        return (
          <CheckboxGroup value={value()} onValueChange={valueAssign}>
            <Checkbox.Root value="" data-testid="empty" />
            <Checkbox.Root value="other" data-testid="other" />
          </CheckboxGroup>
        )
      }

      render(() => <App />)

      const empty = screen.getByTestId('empty')
      const other = screen.getByTestId('other')

      expect(empty).toHaveAttribute('aria-checked', 'true')
      expect(other).toHaveAttribute('aria-checked', 'false')

      fireEvent.click(empty)

      expect(empty).toHaveAttribute('aria-checked', 'false')
    })

    it('treats a controlled value that becomes undefined as an empty array', () => {
      function App() {
        const [value, valueAssign] = createSignal<Array<string> | undefined>([
          'red',
        ])
        return (
          <>
            <CheckboxGroup value={value()}>
              <Checkbox.Root value="red" data-testid="red" />
            </CheckboxGroup>
            <button type="button" onClick={() => valueAssign(undefined)}>
              Clear
            </button>
          </>
        )
      }

      render(() => <App />)

      expect(screen.getByTestId('red')).toHaveAttribute('aria-checked', 'true')

      fireEvent.click(screen.getByText('Clear'))

      expect(screen.getByTestId('red')).toHaveAttribute('aria-checked', 'false')
    })
  })

  describe('prop: onValueChange', () => {
    it('should be called when the value changes', () => {
      const handleValueChange = vi.fn()

      function App() {
        const [value, valueAssign] = createSignal<Array<string>>([])
        return (
          <CheckboxGroup
            value={value()}
            onValueChange={nextValue => {
              valueAssign(nextValue)
              handleValueChange(nextValue)
            }}
          >
            <Checkbox.Root name="red" data-testid="red" />
            <Checkbox.Root name="green" data-testid="green" />
            <Checkbox.Root name="blue" data-testid="blue" />
          </CheckboxGroup>
        )
      }

      render(() => <App />)

      fireEvent.click(screen.getByTestId('red'))
      expect(handleValueChange.mock.calls.length).toBe(1)
      expect(handleValueChange.mock.calls[0]?.[0]).toEqual(['red'])

      fireEvent.click(screen.getByTestId('green'))
      expect(handleValueChange.mock.calls.length).toBe(2)
      expect(handleValueChange.mock.calls[1]?.[0]).toEqual(['red', 'green'])

      fireEvent.click(screen.getByTestId('blue'))
      expect(handleValueChange.mock.calls.length).toBe(3)
      expect(handleValueChange.mock.calls[2]?.[0]).toEqual([
        'red',
        'green',
        'blue',
      ])
    })

    it('should treat an omitted defaultValue as an empty array', () => {
      const handleValueChange = vi.fn()

      render(() => (
        <CheckboxGroup onValueChange={handleValueChange}>
          <Checkbox.Root name="red" data-testid="red" />
          <Checkbox.Root name="green" data-testid="green" />
          <Checkbox.Root name="blue" data-testid="blue" />
        </CheckboxGroup>
      ))

      fireEvent.click(screen.getByTestId('red'))
      expect(handleValueChange.mock.calls[0]?.[0]).toEqual(['red'])

      fireEvent.click(screen.getByTestId('green'))
      expect(handleValueChange.mock.calls[1]?.[0]).toEqual(['red', 'green'])

      fireEvent.click(screen.getByTestId('red'))
      expect(handleValueChange.mock.calls[2]?.[0]).toEqual(['green'])
    })

    it('does not update the group when onValueChange cancels the event', () => {
      const handleValueChange = vi.fn(
        (
          _value: Array<string>,
          eventDetails: CheckboxGroupChangeEventDetails
        ) => {
          eventDetails.cancel()
        }
      )

      render(() => (
        <CheckboxGroup onValueChange={handleValueChange}>
          <Checkbox.Root value="red" data-testid="red" />
          <Checkbox.Root value="green" data-testid="green" />
        </CheckboxGroup>
      ))

      const red = screen.getByTestId('red')
      const green = screen.getByTestId('green')

      fireEvent.click(red)

      expect(handleValueChange.mock.calls.length).toBe(1)
      expect(handleValueChange.mock.calls[0]?.[0]).toEqual(['red'])
      expect(red).toHaveAttribute('aria-checked', 'false')
      expect(green).toHaveAttribute('aria-checked', 'false')
    })
  })

  describe('prop: defaultValue', () => {
    it('should set the initial value', () => {
      render(() => (
        <CheckboxGroup defaultValue={['red']}>
          <Checkbox.Root name="red" data-testid="red" />
          <Checkbox.Root name="green" data-testid="green" />
          <Checkbox.Root name="blue" data-testid="blue" />
        </CheckboxGroup>
      ))

      const red = screen.getByTestId('red')
      const green = screen.getByTestId('green')
      const blue = screen.getByTestId('blue')

      expect(red).toHaveAttribute('aria-checked', 'true')
      expect(green).toHaveAttribute('aria-checked', 'false')
      expect(blue).toHaveAttribute('aria-checked', 'false')

      fireEvent.click(green)

      expect(red).toHaveAttribute('aria-checked', 'true')
      expect(green).toHaveAttribute('aria-checked', 'true')
      expect(blue).toHaveAttribute('aria-checked', 'false')
    })

    it('keeps omitted defaults isolated between groups', () => {
      render(() => (
        <>
          <CheckboxGroup allValues={['a-1', 'a-2']}>
            <Checkbox.Root parent data-testid="a-parent" />
            <Checkbox.Root value="a-1" data-testid="a-1" />
            <Checkbox.Root value="a-2" data-testid="a-2" />
          </CheckboxGroup>
          <CheckboxGroup allValues={['b-1', 'b-2']}>
            <Checkbox.Root parent data-testid="b-parent" />
            <Checkbox.Root value="b-1" data-testid="b-1" />
            <Checkbox.Root value="b-2" data-testid="b-2" />
          </CheckboxGroup>
        </>
      ))

      const aParent = screen.getByTestId('a-parent')
      const a1 = screen.getByTestId('a-1')
      const a2 = screen.getByTestId('a-2')
      const bParent = screen.getByTestId('b-parent')
      const b1 = screen.getByTestId('b-1')
      const b2 = screen.getByTestId('b-2')

      fireEvent.click(a1)
      expect(aParent).toHaveAttribute('aria-checked', 'mixed')
      expect(bParent).toHaveAttribute('aria-checked', 'false')
      expect(b1).toHaveAttribute('aria-checked', 'false')
      expect(b2).toHaveAttribute('aria-checked', 'false')

      fireEvent.click(bParent)
      expect(b1).toHaveAttribute('aria-checked', 'true')
      expect(b2).toHaveAttribute('aria-checked', 'true')
      expect(a1).toHaveAttribute('aria-checked', 'true')
      expect(a2).toHaveAttribute('aria-checked', 'false')

      fireEvent.click(aParent)
      expect(a1).toHaveAttribute('aria-checked', 'true')
      expect(a2).toHaveAttribute('aria-checked', 'true')
      expect(bParent).toHaveAttribute('aria-checked', 'true')

      fireEvent.click(b1)
      expect(bParent).toHaveAttribute('aria-checked', 'mixed')
      expect(aParent).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('prop: disabled', () => {
    it('disables all checkboxes when `true`', () => {
      render(() => (
        <CheckboxGroup disabled>
          <Checkbox.Root name="red" data-testid="red" />
          <Checkbox.Root name="green" data-testid="green" />
          <Checkbox.Root name="blue" data-testid="blue" />
        </CheckboxGroup>
      ))

      expect(screen.getByTestId('red')).toHaveAttribute('aria-disabled', 'true')
      expect(screen.getByTestId('green')).toHaveAttribute(
        'aria-disabled',
        'true'
      )
      expect(screen.getByTestId('blue')).toHaveAttribute(
        'aria-disabled',
        'true'
      )
    })

    it('does not disable all checkboxes when `false`', () => {
      render(() => (
        <CheckboxGroup disabled={false}>
          <Checkbox.Root name="red" data-testid="red" />
          <Checkbox.Root name="green" data-testid="green" />
          <Checkbox.Root name="blue" data-testid="blue" />
        </CheckboxGroup>
      ))

      expect(screen.getByTestId('red')).not.toHaveAttribute(
        'aria-disabled',
        'true'
      )
      expect(screen.getByTestId('green')).not.toHaveAttribute(
        'aria-disabled',
        'true'
      )
      expect(screen.getByTestId('blue')).not.toHaveAttribute(
        'aria-disabled',
        'true'
      )
    })

    it('takes precedence over individual checkboxes', () => {
      render(() => (
        <CheckboxGroup disabled>
          <Checkbox.Root name="red" data-testid="red" disabled={false} />
          <Checkbox.Root name="green" data-testid="green" />
          <Checkbox.Root name="blue" data-testid="blue" />
        </CheckboxGroup>
      ))

      expect(screen.getByTestId('red')).toHaveAttribute('aria-disabled', 'true')
      expect(screen.getByTestId('green')).toHaveAttribute(
        'aria-disabled',
        'true'
      )
      expect(screen.getByTestId('blue')).toHaveAttribute(
        'aria-disabled',
        'true'
      )
    })
  })

  describe('Field.Description', () => {
    it('links the group and individual checkboxes', () => {
      render(() => (
        <Field.Root name="apple">
          <CheckboxGroup
            defaultValue={[]}
            aria-describedby="external-description"
          >
            <Field.Description data-testid="group-description">
              Group description
            </Field.Description>
            <Field.Item>
              <Field.Label>
                <Checkbox.Root
                  value="fuji-apple"
                  aria-describedby="checkbox-description"
                />
                Fuji
              </Field.Label>
            </Field.Item>
          </CheckboxGroup>
        </Field.Root>
      ))

      const groupDescription = screen.getByTestId('group-description')
      const groupDescriptionId = groupDescription.getAttribute('id')
      expect(groupDescriptionId).not.toBe(null)
      expect(
        screen.getByRole('group').getAttribute('aria-describedby')
      ).toContain(groupDescriptionId)
      expect(
        screen.getByRole('checkbox').getAttribute('aria-describedby')
      ).toContain(groupDescriptionId)
      expect(screen.getByRole('checkbox')).toHaveAttribute(
        'aria-describedby',
        `checkbox-description ${groupDescriptionId}`
      )
      expect(screen.getByRole('group')).toHaveAttribute(
        'aria-describedby',
        `external-description ${groupDescriptionId}`
      )
    })
  })

  describe('Form values', () => {
    it('projects selected enabled checkboxes while preserving the logical validation value', () => {
      const handleSubmit = vi.fn()
      const validateGroup = vi.fn(() => null)

      function App() {
        const [disabledBanana, disabledBananaAssign] = createSignal(true)
        return (
          <Form onFormSubmit={handleSubmit} data-testid="form">
            <Field.Root name="fruits" validate={validateGroup}>
              <CheckboxGroup defaultValue={['apple', 'banana']}>
                <Checkbox.Root value="apple" />
                <Checkbox.Root value="banana" disabled={disabledBanana()} />
              </CheckboxGroup>
            </Field.Root>
            <button type="button" onClick={() => disabledBananaAssign(false)}>
              Enable
            </button>
            <button type="submit">Submit</button>
          </Form>
        )
      }

      render(() => <App />)

      fireEvent.click(screen.getByText('Submit'))

      expect(validateGroup).toHaveBeenLastCalledWith(
        ['apple', 'banana'],
        expect.objectContaining({
          fruits: ['apple'],
        })
      )
      expect(handleSubmit.mock.lastCall?.[0].fruits).toEqual(['apple'])

      fireEvent.click(screen.getByText('Enable'))
      fireEvent.click(screen.getByText('Submit'))

      expect(validateGroup).toHaveBeenLastCalledWith(
        ['apple', 'banana'],
        expect.objectContaining({
          fruits: ['apple', 'banana'],
        })
      )
      expect(handleSubmit.mock.lastCall?.[0].fruits).toEqual([
        'apple',
        'banana',
      ])
    })
  })
})

describe('useCheckboxGroupParent', () => {
  const allValues = ['a', 'b', 'c']

  it('should control child checkboxes', () => {
    const parentCheckedChange = vi.fn()
    const childCheckedChange = vi.fn()

    function App() {
      const [value, valueAssign] = createSignal<Array<string>>([])
      return (
        <CheckboxGroup
          value={value()}
          onValueChange={valueAssign}
          allValues={allValues}
        >
          <Checkbox.Root
            parent
            data-testid="parent"
            onCheckedChange={parentCheckedChange}
          />
          <Checkbox.Root value="a" />
          <Checkbox.Root value="b" onCheckedChange={childCheckedChange} />
          <Checkbox.Root value="c" />
        </CheckboxGroup>
      )
    }

    render(() => <App />)

    const checkboxes = screen
      .getAllByRole('checkbox')
      .filter(v => v.getAttribute('data-parent') == null)
    const parent = screen.getByTestId('parent')

    checkboxes.forEach(checkbox => {
      expect(checkbox).toHaveAttribute('aria-checked', 'false')
    })

    fireEvent.click(parent)
    expect(parent).toHaveAttribute('aria-checked', 'true')
    checkboxes.forEach(checkbox => {
      expect(checkbox).toHaveAttribute('aria-checked', 'true')
    })
    expect(parentCheckedChange).toHaveBeenCalledTimes(1)
    expect(childCheckedChange).toHaveBeenCalledTimes(0)

    fireEvent.click(parent)
    expect(parent).toHaveAttribute('aria-checked', 'false')
    checkboxes.forEach(checkbox => {
      expect(checkbox).toHaveAttribute('aria-checked', 'false')
    })
  })

  it('parent should be marked as mixed if some children are checked', () => {
    function App() {
      const [value, valueAssign] = createSignal<Array<string>>([])
      return (
        <CheckboxGroup
          value={value()}
          onValueChange={valueAssign}
          allValues={allValues}
        >
          <Checkbox.Root parent data-testid="parent" />
          <Checkbox.Root value="a" data-testid="a" />
          <Checkbox.Root value="b" />
          <Checkbox.Root value="c" />
        </CheckboxGroup>
      )
    }

    render(() => <App />)

    fireEvent.click(screen.getByTestId('a'))
    expect(screen.getByTestId('parent')).toHaveAttribute(
      'aria-checked',
      'mixed'
    )
  })

  it('should apply space-separated aria-controls attribute with child names', () => {
    function App() {
      const [value, valueAssign] = createSignal<Array<string>>([])
      return (
        <CheckboxGroup
          value={value()}
          onValueChange={valueAssign}
          allValues={allValues}
        >
          <Checkbox.Root parent data-testid="parent" />
          <Checkbox.Root value="a" />
          <Checkbox.Root value="b" />
          <Checkbox.Root value="c" />
        </CheckboxGroup>
      )
    }

    render(() => <App />)

    const parent = screen.getByTestId('parent')
    const id = parent.getAttribute('id')
    expect(parent).toHaveAttribute(
      'aria-controls',
      allValues.map(v => `${id}-${v}`).join(' ')
    )
  })

  it('keeps parent select-all aria-controls when consumer props conflict', () => {
    function App() {
      const [value, valueAssign] = createSignal<Array<string>>([])
      return (
        <CheckboxGroup
          value={value()}
          onValueChange={valueAssign}
          allValues={allValues}
        >
          <Checkbox.Root
            parent
            data-testid="parent"
            aria-controls="consumer-clobber"
          />
          <Checkbox.Root value="a" />
          <Checkbox.Root value="b" />
          <Checkbox.Root value="c" />
        </CheckboxGroup>
      )
    }

    render(() => <App />)

    const parent = screen.getByTestId('parent')
    const id = parent.getAttribute('id')
    expect(id).toBeTruthy()
    expect(parent).toHaveAttribute(
      'aria-controls',
      allValues.map(v => `${id}-${v}`).join(' ')
    )
    expect(parent).not.toHaveAttribute('aria-controls', 'consumer-clobber')
  })

  it('does not select a child without an identifying value', () => {
    render(() => (
      <CheckboxGroup allValues={['a']}>
        <Checkbox.Root parent data-testid="parent" />
        <Checkbox.Root id="standalone" data-testid="no-value" />
        <Checkbox.Root value="a" data-testid="checkbox-a" />
      </CheckboxGroup>
    ))

    fireEvent.click(screen.getByTestId('parent'))

    expect(screen.getByTestId('parent')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByTestId('checkbox-a')).toHaveAttribute(
      'aria-checked',
      'true'
    )
    expect(screen.getByTestId('no-value')).toHaveAttribute(
      'aria-checked',
      'false'
    )
    expect(screen.getByTestId('no-value').nextElementSibling).toHaveAttribute(
      'id',
      'standalone'
    )
  })

  it('preserves initial state if mixed when parent is clicked', () => {
    function App() {
      const [value, valueAssign] = createSignal<Array<string>>([])
      return (
        <CheckboxGroup
          value={value()}
          onValueChange={valueAssign}
          allValues={allValues}
        >
          <Checkbox.Root parent data-testid="parent" />
          <Checkbox.Root value="a" data-testid="checkboxA" />
          <Checkbox.Root value="b" />
          <Checkbox.Root value="c" />
        </CheckboxGroup>
      )
    }

    render(() => <App />)

    const checkboxes = screen
      .getAllByRole('checkbox')
      .filter(v => v.getAttribute('data-parent') == null)
    const checkboxA = screen.getByTestId('checkboxA')
    const parent = screen.getByTestId('parent')

    fireEvent.click(checkboxA)
    expect(parent).toHaveAttribute('aria-checked', 'mixed')

    fireEvent.click(parent)
    checkboxes.forEach(checkbox => {
      expect(checkbox).toHaveAttribute('aria-checked', 'true')
    })

    fireEvent.click(parent)
    checkboxes.forEach(checkbox => {
      expect(checkbox).toHaveAttribute('aria-checked', 'false')
    })

    fireEvent.click(parent)
    expect(parent).toHaveAttribute('aria-checked', 'mixed')
    expect(checkboxA).toHaveAttribute('aria-checked', 'true')
    checkboxes.forEach(checkbox => {
      if (checkbox !== checkboxA) {
        expect(checkbox).toHaveAttribute('aria-checked', 'false')
      }
    })
  })

  it('lets a parent checkbox cancel a parent-enabled group change', () => {
    const handleValueChange = vi.fn()
    const handleParentChange = vi.fn(
      (_checked: boolean, eventDetails: CheckboxRootChangeEventDetails) => {
        eventDetails.cancel()
      }
    )

    render(() => (
      <CheckboxGroup allValues={allValues} onValueChange={handleValueChange}>
        <Checkbox.Root
          parent
          data-testid="parent"
          onCheckedChange={handleParentChange}
        />
        <Checkbox.Root value="a" data-testid="checkboxA" />
        <Checkbox.Root value="b" data-testid="checkboxB" />
        <Checkbox.Root value="c" data-testid="checkboxC" />
      </CheckboxGroup>
    ))

    fireEvent.click(screen.getByTestId('parent'))

    expect(handleParentChange).toHaveBeenCalledTimes(1)
    expect(handleValueChange).toHaveBeenCalledTimes(0)
    expect(screen.getByTestId('parent')).toHaveAttribute(
      'aria-checked',
      'false'
    )
  })

  it('does not advance the parent toggle cycle when the group cancels a parent change', () => {
    const handleValueChange = vi.fn(
      (
        _value: Array<string>,
        eventDetails: CheckboxGroupChangeEventDetails
      ) => {
        eventDetails.cancel()
      }
    )

    render(() => (
      <CheckboxGroup
        value={['a']}
        allValues={allValues}
        onValueChange={handleValueChange}
      >
        <Checkbox.Root parent data-testid="parent" />
        <Checkbox.Root value="a" />
        <Checkbox.Root value="b" />
        <Checkbox.Root value="c" />
      </CheckboxGroup>
    ))

    const parent = screen.getByTestId('parent')
    fireEvent.click(parent)
    fireEvent.click(parent)

    expect(handleValueChange).toHaveBeenCalledTimes(2)
    expect(handleValueChange.mock.calls[0]?.[0]).toEqual(allValues)
    expect(handleValueChange.mock.calls[1]?.[0]).toEqual(allValues)
  })

  it('handles unchecked disabled checkboxes', () => {
    function App() {
      const [value, valueAssign] = createSignal<Array<string>>([])
      return (
        <CheckboxGroup
          value={value()}
          onValueChange={valueAssign}
          allValues={allValues}
        >
          <Checkbox.Root parent data-testid="parent" />
          <Checkbox.Root value="a" disabled data-testid="checkboxA" />
          <Checkbox.Root value="b" />
          <Checkbox.Root value="c" />
        </CheckboxGroup>
      )
    }

    render(() => <App />)

    fireEvent.click(screen.getByTestId('parent'))
    expect(screen.getByTestId('parent')).toHaveAttribute(
      'aria-checked',
      'mixed'
    )
    expect(screen.getByTestId('checkboxA')).toHaveAttribute(
      'aria-checked',
      'false'
    )
  })

  it('handles checked disabled checkboxes', () => {
    function App() {
      const [value, valueAssign] = createSignal<Array<string>>(['a'])
      return (
        <CheckboxGroup
          value={value()}
          onValueChange={valueAssign}
          allValues={allValues}
        >
          <Checkbox.Root parent data-testid="parent" />
          <Checkbox.Root value="a" data-testid="checkboxA" disabled />
          <Checkbox.Root value="b" data-testid="checkboxB" />
          <Checkbox.Root value="c" />
        </CheckboxGroup>
      )
    }

    render(() => <App />)

    const checkboxA = screen.getByTestId('checkboxA')
    const checkboxB = screen.getByTestId('checkboxB')
    const parent = screen.getByTestId('parent')

    fireEvent.click(parent)
    expect(checkboxA).toHaveAttribute('aria-checked', 'true')
    expect(checkboxB).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(parent)
    expect(checkboxA).toHaveAttribute('aria-checked', 'true')
    expect(checkboxB).toHaveAttribute('aria-checked', 'false')
  })
})

describe('<Checkbox.Root /> group cases', () => {
  it('sets grouped parent aria when manually indeterminate', () => {
    render(() => (
      <CheckboxGroup value={[]} allValues={['one']}>
        <Checkbox.Root parent indeterminate data-testid="parent" />
      </CheckboxGroup>
    ))

    expect(screen.getByTestId('parent')).toHaveAttribute(
      'aria-checked',
      'mixed'
    )
  })

  it('assigns an input id to a valueless child in a parent checkbox group', () => {
    render(() => (
      <CheckboxGroup allValues={['one']}>
        <Checkbox.Root data-testid="child" />
      </CheckboxGroup>
    ))

    const child = screen.getByTestId('child')
    const input = child.nextElementSibling
    expect(input).toHaveAttribute('id')
    expect(input?.getAttribute('id')).not.toBe('')
  })

  it('adds [data-filled] attribute when any checkbox is filled when inside a group', () => {
    render(() => (
      <Field.Root name="group" data-testid="field">
        <CheckboxGroup defaultValue={['1', '2']}>
          <Checkbox.Root value="1" />
          <Checkbox.Root value="2" />
        </CheckboxGroup>
      </Field.Root>
    ))

    expect(screen.getByTestId('field')).toHaveAttribute('data-filled')
  })
})
