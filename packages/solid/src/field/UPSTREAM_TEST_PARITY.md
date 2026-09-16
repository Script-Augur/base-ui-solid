# Field — upstream test parity

Pinned against `@base-ui/react@1.7.0` (`UPSTREAM.md`).

Sources under `/tmp/base-ui-field/field/`.

## Ported (Solid)

| Area                                                    | Solid file                | Notes                     |
| ------------------------------------------------------- | ------------------------- | ------------------------- |
| Label association / id swap                             | `root/FieldRoot.test.tsx` |                           |
| `disabled` / `invalid` / Fieldset inherit               | `root/FieldRoot.test.tsx` | Fieldset via context only |
| Form-error invalid while disabled                       | `root/FieldRoot.test.tsx` | Via `FormErrorsProvider`  |
| `validate` + `validationMode` onBlur/onChange           | `root/FieldRoot.test.tsx` |                           |
| valueMissing dirty/pristine                             | `root/FieldRoot.test.tsx` |                           |
| required + typeMismatch native interactions             | `root/FieldRoot.test.tsx` | Field-local revalidation  |
| valueMissing clear / typeMismatch defer-until-blur      | `root/FieldRoot.test.tsx` | Field-local revalidation  |
| async + stale async                                     | `root/FieldRoot.test.tsx` |                           |
| debounce (`validationDebounceTime`)                     | `root/FieldRoot.test.tsx` | Field.Control only        |
| style hooks (touched/dirty/filled/focused)              | `root/FieldRoot.test.tsx` |                           |
| controlled `dirty` / `touched`                          | `root/FieldRoot.test.tsx` |                           |
| `actionsRef.validate` (+ clear on unmount)              | `root/FieldRoot.test.tsx` |                           |
| Label / Description / Control / Error / Validity / Item | matching `*.test.tsx`     | Form errors via context   |

## Skipped

| Upstream test                                                                                       | Reason                                                                                                                     |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `describeConformance` (all parts)                                                                   | Not used in this package                                                                                                   |
| `FieldRoot.react17.test.tsx`                                                                        | React 17-only                                                                                                              |
| `FieldControl.spec.tsx` / type-level `.spec.tsx`                                                    | Type-level                                                                                                                 |
| SSR / `isJSDOM` Select+Checkbox aria-labelledby cases                                               | Browser-only + Select/Checkbox not ported                                                                                  |
| React 19 `Activity` remount case                                                                    | React-only API                                                                                                             |
| Form submit orchestration (`onSubmit` mode via `<Form>`, `onFormSubmit`, multi-field validate args) | Deferred to Form slice                                                                                                     |
| `validate` runs after native validations (Form submit click)                                        | Needs Form submit orchestration; Field-local native/custom order is covered via `onBlur`/`onChange` + `actionsRef` instead |
| Checkbox / CheckboxGroup / Radio / RadioGroup / NumberField / Select integration                    | Deferred to those component slices                                                                                         |
| debounce for Checkbox / RadioGroup                                                                  | Needs those controls                                                                                                       |
| Select/Radio dirty remount baselines                                                                | Needs those controls                                                                                                       |
| Field.Error animation `describe.skipIf(isJSDOM)`                                                    | Browser-only                                                                                                               |
| Field.Validity Form-submit + badInput browser case                                                  | Form slice / browser-only                                                                                                  |
| Field.Item Checkbox/Radio disable + parent checkbox label                                           | Deferred to Checkbox/Radio                                                                                                 |
| Field.Control SSR autofocus focused sync                                                            | Browser-only (`isJSDOM`)                                                                                                   |
| Field.Control uncontrolled rerender-count StrictMode case                                           | React render-count / StrictMode N/A                                                                                        |

## Solid divergences

- **Form errors in tests** use `FormErrorsProvider` (FormContext) instead of `<Form>`.
- **Input value events** use Solid `onInput` only (React Field.Control `onChange` ≈ input). Native `change` on blur must not re-fire `onValueChange` / `validation.change`.
- **Signal naming** uses `fooAssign` internally per `AGENTS.md`.
- **FormContext.errors** is an `Accessor` for Solid reactivity (Form slice will provide the same shape).
- **Field.Root children** are memoized with Solid's `children()` under the context Provider so reactive `data-*` updates do not remount controls (would break held DOM refs / mid-blur validation). `createRender`'s stable `div`/`input` hosts also keep children outside the attribute spread for the same reason.
