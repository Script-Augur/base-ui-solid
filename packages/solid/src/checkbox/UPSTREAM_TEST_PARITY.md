# Checkbox upstream test parity

Pinned upstream: `@base-ui/react@1.7.0`
(`packages/react/src/checkbox/root/CheckboxRoot.test.tsx`,
`packages/react/src/checkbox/indicator/CheckboxIndicator.test.tsx`).

## Skipped

| Upstream case                                                | Reason                                                      |
| ------------------------------------------------------------ | ----------------------------------------------------------- |
| `describeConformance` (Root + Indicator)                     | React conformance harness                                   |
| Form Enter-submit / `FormData` submission cases              | Browser-only (`skipIf(isJSDOM)` upstream); jsdom limited    |
| Imperative ref-callback focus/blur/click before input mounts | React callback-ref shape                                    |
| Indicator exit/enter CSS animation suites                    | Browser-only; `BASE_UI_ANIMATIONS_DISABLED` in vitest setup |

## Solid adaptations

- Dynamic props use `createSignal` instead of React `setState` / `setProps`.
- `nativeButton` + `render="button"` instead of `render={<button />}`.
- Label `htmlFor` → Solid `for`.
- Group integration via `CheckboxGroup` context (see `checkbox-group/UPSTREAM_TEST_PARITY.md`).
- `onCheckedChange` receives `createChangeEventDetails` (`cancel()`), matching Field/Form.

## Parity status

Standalone Root/Indicator behavior is largely ported in
`CheckboxRoot.test.tsx` / `CheckboxIndicator.test.tsx`. Grouped parent /
valueless-child / Field `[data-filled]` cases live under
`checkbox-group/CheckboxGroup.test.tsx`.

Still missing vs upstream Field/Form Checkbox cases (list, don’t claim):

| Upstream-ish gap                                                | Notes                                    |
| --------------------------------------------------------------- | ---------------------------------------- |
| `validationMode` onSubmit / onChange / onBlur suites            | Not fully ported for standalone Checkbox |
| `[data-valid]` / validate-once / controlled external revalidate | Not ported                               |
| Field.Label explicit/implicit `for` / `aria-labelledby` matrix  | Partial via label click only             |
| Form Enter-submit / `FormData`                                  | Browser-only; still skipped above        |
