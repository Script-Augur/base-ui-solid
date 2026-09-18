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
| Full Form Enter-submit / `FormData` / `autoSubmit` browser cases | Browser-only (`skipIf(isJSDOM)` upstream)              |
| Exhaustive IME / composition / selection matrices                | Ported core keyboard + paste; deeper matrices deferred |
| Owner-stack warning assertion text (SafeReact)                   | Solid uses `console.warn` without React owner stacks   |
| Remaining lock-state autofill matrix rows                        | Core hidden autofill + clear covered in jsdom          |

## Covered in jsdom (not browser-only)

These upstream cases run under jsdom and are ported here:

- Form `checkValidity` for incomplete / complete required OTP
- Hidden validation input focus → first slot
- Hidden-input autofill / clear (and password-manager filtering)
- Field description merge onto group `aria-describedby`
- Field `validationMode="onBlur"` commit only when leaving the OTP
- Root `aria-labelledby` on the group only (not slots)
- Controlled stale / async focus and `onValueComplete`
- Per-slot `type` override under `mask`

## Solid adaptations

- Dynamic props use `createSignal` / `fooAssign` instead of React `setState` / `setProps`.
- Slot value changes use `onInput` (≈ React `onChange`); native `change` also fires on blur.
- Label `htmlFor` → Solid `for`.
- `DirectionProvider` for RTL arrow tests.
- `OTPField.Separator` re-exports the shared Separator part (same as upstream).

## Parity status

Utils (`otp.test.ts`) are ported 1:1. Root/Input cover value clamping, controlled mode
(including stale/async flush semantics), validation types, paste, keyboard nav (incl. RTL),
Field/Form wiring (`checkValidity`, hidden focus/autofill, description, onBlur), group-only
`aria-labelledby`, and mask type override. Remaining upstream gaps are mostly conformance,
SSR, or true browser-only form submission matrices.
