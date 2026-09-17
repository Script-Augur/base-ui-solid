# Checkbox Group upstream test parity

Pinned upstream: `@base-ui/react@1.7.0`
(`packages/react/src/checkbox-group/CheckboxGroup.test.tsx`,
`packages/react/src/checkbox-group/useCheckboxGroupParent.test.tsx`).

## Skipped

| Upstream case                                                          | Reason                                                                      |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `describeConformance`                                                  | React conformance harness                                                   |
| React Strict Mode isolation case                                       | Solid has no Strict Mode double-mount; covered by non-Strict isolation test |
| Full Field validationMode matrix (onSubmit / onChange / onBlur suites) | Partial — Form values projection covered; deep validation modes deferred    |
| Browser-only Form submission / focus suites (`skipIf(isJSDOM)`)        | jsdom limited; same skip class as Checkbox / Form                           |
| Portal / fieldset-disabled Form projection edge cases                  | Deferred with Form focus suites                                             |
| Nested parent checkbox demos                                           | Story covers single parent; nested parent not required for API parity       |

## Solid adaptations

- Dynamic props use `createSignal` instead of React `setState`.
- `onValueChange` / `onCheckedChange` receive `createChangeEventDetails` (`cancel()`).
- Label `htmlFor` → Solid `for` where applicable.
- `foo` / `fooAssign` setter naming per `AGENTS.md`.

## Parity status

Core group value / disabled / parent lifecycle / cancel / Field.Description
linking / Form value projection are covered in `CheckboxGroup.test.tsx`.
Checkbox.Root group cases previously deferred (parent indeterminate,
valueless child id, Field `data-filled`) are included here.
