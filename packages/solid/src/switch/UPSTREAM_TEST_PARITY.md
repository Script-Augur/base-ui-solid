# Switch upstream test parity

Pinned upstream: `@base-ui/react@1.7.0`
(`packages/react/src/switch/root/SwitchRoot.test.tsx`,
`packages/react/src/switch/thumb/SwitchThumb.test.tsx`,
`packages/react/src/switch/enumSync.test.ts`).

## Skipped

| Upstream case                                                                 | Reason                                                                     |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `describeConformance` (Root + Thumb)                                          | React conformance harness                                                  |
| Imperative ref-callback focus/blur/click before input mounts                  | React callback-ref shape                                                   |
| Keyboard modifier event properties on `onCheckedChange`                       | user-event Shift+click harness; Solid fireEvent limited                    |
| Form Enter-submit / `FormData` submission cases                               | Browser-only (`skipIf(isJSDOM)` upstream); jsdom limited                   |
| Form canceled-change / submit / reset preservation case                       | Browser-only (`skipIf(isJSDOM)` upstream)                                  |
| Native-button Enter/Space keyboard activation in “can render a native button” | Browser-native `<button>` key activation; jsdom `fireEvent` does not click |

## Solid adaptations

- Dynamic props use `createSignal` instead of React `setState` / `setProps`.
- `nativeButton` + `render="button"` instead of `render={<button />}`.
- Label `htmlFor` → Solid `for`.
- `onCheckedChange` receives `createChangeEventDetails` (`cancel()`), matching Field/Form.

## Parity status

Root/Thumb behavior, Field integration, and Form validation / external-error
cases that do not need real browser form submission are ported in
`SwitchRoot.test.tsx` / `SwitchThumb.test.tsx` / `enumSync.test.ts`.
