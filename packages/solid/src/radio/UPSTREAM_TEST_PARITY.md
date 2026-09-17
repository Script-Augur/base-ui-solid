# Radio / Radio Group upstream test parity

Pinned upstream: `@base-ui/react@1.7.0`
(`packages/react/src/radio/root/RadioRoot.test.tsx`,
`packages/react/src/radio/indicator/RadioIndicator.test.tsx`,
`packages/react/src/radio/enumSync.test.ts`,
`packages/react/src/radio-group/RadioGroup.test.tsx`).

## Skipped

| Upstream case                                                | Reason                                                                           |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `describeConformance` (Root + Indicator + Group)             | React conformance harness                                                        |
| Indicator exit-animation finish case                         | Requires CSS animation harness / `BASE_UI_ANIMATIONS_DISABLED` timing            |
| Arrow-key navigation (LTR/RTL + Shift)                       | user-event keyboard harness; Solid `fireEvent` limited for composite focus moves |
| Form Enter-submit / `FormData` submission cases              | Browser-only (`skipIf(isJSDOM)` upstream); jsdom limited                         |
| Form canceled-change / submit / reset preservation cases     | Browser-only (`skipIf(isJSDOM)` upstream)                                        |
| External `form` attribute submission cases                   | Browser-only (`skipIf(isJSDOM)` upstream)                                        |
| Imperative ref-callback focus before mount                   | React callback-ref shape                                                         |
| Stable inputRef callback identity across re-renders          | React ref-callback semantics; Solid function refs differ                         |
| `inputRef` detach-on-unmount edge cases beyond checked/first | Covered partially; full React ref lifecycle omitted                              |

## Solid adaptations

- Dynamic props use `createSignal` instead of React `setState` / `setProps`.
- `nativeButton` + `render="button"` instead of `render={<button />}`.
- Label `htmlFor` → Solid `for`.
- `onValueChange` receives `createChangeEventDetails` (`cancel()`), matching Field/Form.
- Composite list uses Solid `CompositeRoot` / `CompositeItem` with `modifierKeys={[SHIFT]}`.

## Parity status

Root/Indicator/Group behavior, Field / Fieldset / Form error-clearing cases that
do not need real browser form submission are ported in
`RadioRoot.test.tsx` / `RadioIndicator.test.tsx` / `RadioGroup.test.tsx` /
`enumSync.test.ts`.
