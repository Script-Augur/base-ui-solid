# OTP Field upstream test parity

Pinned upstream: `@base-ui/react@1.7.0`
(`packages/react/src/otp-field/root/OTPFieldRoot.test.tsx`,
`packages/react/src/otp-field/input/OTPFieldInput.test.tsx`,
`packages/react/src/otp-field/utils/otp.test.ts`).

## Skipped

| Upstream case                                                    | Reason                                                 |
| ---------------------------------------------------------------- | ------------------------------------------------------ |
| `describeConformance` (Root + Input)                             | React conformance harness                              |
| `renderToString` / SSR hydrate cases                             | Deferred SSR harness (same as Fieldset/Avatar)         |
| React 17-specific root test file                                 | N/A for Solid                                          |
| Spec/type-level `.spec.tsx` files                                | Type-only React harness                                |
| Full autofill / password-manager matrices                        | Browser-only; jsdom limited                            |
| Full Form Enter-submit / `FormData` / `autoSubmit` browser cases | Browser-only (`skipIf(isJSDOM)` upstream)              |
| Exhaustive IME / composition / selection matrices                | Ported core keyboard + paste; deeper matrices deferred |
| Owner-stack warning assertion text (SafeReact)                   | Solid uses `console.warn` without React owner stacks   |

## Solid adaptations

- Dynamic props use `createSignal` / `fooAssign` instead of React `setState` / `setProps`.
- Slot value changes use `onInput` (≈ React `onChange`); native `change` also fires on blur.
- Label `htmlFor` → Solid `for`.
- `DirectionProvider` for RTL arrow tests.
- `OTPField.Separator` re-exports the shared Separator part (same as upstream).

## Parity status

Utils (`otp.test.ts`) are ported 1:1. Root/Input cover value clamping, controlled mode,
validation types, paste, keyboard nav (incl. RTL), Field/Form wiring, and completion
callbacks. Remaining upstream cases are mostly conformance, SSR, or browser-only form
submission matrices.
