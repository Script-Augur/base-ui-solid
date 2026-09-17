# Checkbox upstream test parity

Pinned upstream: `@base-ui/react@1.7.0`
(`packages/react/src/checkbox/root/CheckboxRoot.test.tsx`,
`packages/react/src/checkbox/indicator/CheckboxIndicator.test.tsx`).

## Skipped

| Upstream case                                                | Reason                                                      |
| ------------------------------------------------------------ | ----------------------------------------------------------- |
| `describeConformance` (Root + Indicator)                     | React conformance harness                                   |
| Grouped parent indeterminate aria / input                    | Checkbox Group not ported yet                               |
| Valueless child / native-button ids in parent group          | Checkbox Group not ported yet                               |
| Field `[data-filled]` inside a group                         | Checkbox Group not ported yet                               |
| Form Enter-submit / `FormData` submission cases              | Browser-only (`skipIf(isJSDOM)` upstream); jsdom limited    |
| Imperative ref-callback focus/blur/click before input mounts | React callback-ref shape                                    |
| Indicator exit/enter CSS animation suites                    | Browser-only; `BASE_UI_ANIMATIONS_DISABLED` in vitest setup |

## Solid adaptations

- Dynamic props use `createSignal` instead of React `setState` / `setProps`.
- `nativeButton` + `render="button"` instead of `render={<button />}`.
- Label `htmlFor` → Solid `for`.
- Checkbox Group context stub always returns `undefined` until Group slice.
- `onCheckedChange` receives `createChangeEventDetails` (`cancel()`), matching Field/Form.

## Parity status

Standalone Root/Indicator behavior is largely ported in
`CheckboxRoot.test.tsx` / `CheckboxIndicator.test.tsx`. Field coverage here is
state attrs, label click, description linking (including external
`aria-describedby` composition), and Form external-error clear — not full
upstream Field/Form validation parity.

Still missing vs upstream Field/Form Checkbox cases (list, don’t claim):

| Upstream-ish gap                                                | Notes                             |
| --------------------------------------------------------------- | --------------------------------- |
| `validationMode` onSubmit / onChange / onBlur suites            | Not ported for Checkbox           |
| `[data-valid]` / validate-once / controlled external revalidate | Not ported                        |
| Field.Label explicit/implicit `for` / `aria-labelledby` matrix  | Partial via label click only      |
| Form Enter-submit / `FormData`                                  | Browser-only; still skipped above |
