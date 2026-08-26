# Tabs — upstream test parity

Pinned against `@base-ui/react@1.7.0`.

Layout mirrors upstream:

| Upstream                                | Ours                               | Status                        |
| --------------------------------------- | ---------------------------------- | ----------------------------- |
| `tabs/enumSync.test.tsx`                | `enumSync.test.tsx`                | Ported                        |
| `tabs/list/TabsList.test.tsx`           | `list/TabsList.test.tsx`           | Ported                        |
| `tabs/trigger/TabTrigger.test.tsx`      | `trigger/TabTrigger.test.tsx`      | Ported                        |
| `tabs/panel/TabsPanel.test.tsx`         | `panel/TabsPanel.test.tsx`         | Ported                        |
| `tabs/root/TabsRoot.test.tsx`           | `root/TabsRoot.test.tsx`           | Ported (jsdom-runnable cases) |
| `tabs/indicator/TabsIndicator.test.tsx` | `indicator/TabsIndicator.test.tsx` | Ported (jsdom-runnable cases) |

## Solid adaptations

- `render(() => …)`, signals instead of `setProps`, `fireEvent` instead of `user.click` / `user.keyboard`.
- Native button keyboard: `fireEvent.click` after Enter where jsdom does not synthesize click-from-keyboard.
- `flushMicrotasks` drains composite list registration.
- Keyboard wrap-around tests do not assert `Tabs.List` `onKeyDown` call counts (composite handles keys on the tab; list listeners may not see the event after `stopPropagation`).
- `values of different types` uses primitives (`0`, `'1'`, `2`); objects/symbols as `For` keys are awkward in Solid.
- `defaultValue` change after init does not assert React `toErrorDev` (no matching warning in `createControlled`).
- `syncs aria-controls when keepMounted is false` asserts the **active** tab’s `aria-controls` after the switch (inactive-tab attribute clearing can lag a render).

## Intentionally skipped

| Upstream case                                                                        | Reason                                                                                                                  |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `describeConformance(…)` (all parts)                                                 | React `#test-utils` conformance harness                                                                                 |
| TypeScript `.spec.tsx` / `expectType` matrices                                       | React TS harness; rely on `.d.ts` + `tsc`                                                                               |
| Safari `beforeEach` skip in `TabsRoot`                                               | Not applicable                                                                                                          |
| `describe.skipIf(isJSDOM)` activation-direction / click+direction cases in Root      | Chromium layout; one horizontal case is covered with `mockTabLayout`                                                    |
| RTL keyboard matrix (`skipIf(isJSDOM && direction === 'rtl')`)                       | Same as upstream jsdom skip                                                                                             |
| Popover / Dialog nested popup cases (2)                                              | **Deferred:** unskip when `Popover` and `Dialog` exist. Upstream titles: `works inside Popover`, `works inside Dialog`. |
| `cleans and replaces panel registrations in Strict Mode`                             | React Strict Mode double-mount harness                                                                                  |
| `when activateOnFocus = true should call onValueChange on pointerdown`               | jsdom does not dispatch Solid `on:` pointerdown the way Chromium user-event does                                        |
| Indicator SSR / `renderBeforeHydration` / Chromium layout `describe.skipIf(isJSDOM)` | SSR prehydration is a no-op; layout needs a real browser                                                                |
| `should set CSS variables corresponding to the active tab` (Indicator)               | Chromium layout; skipped like upstream `skipIf(isJSDOM)`                                                                |

## When Popover / Dialog land

Re-enable the two Root tests under `describe('popups')` (`works inside Popover`, `works inside Dialog`). They only need those components to exist; Tabs itself already supports nested keyboard focus.

## When bumping upstream

1. Diff `packages/react/src/tabs/**/*.test.tsx` at the new tag.
2. Add or update cases here with the same titles where possible.
3. Move newly skippable-only cases into the table above with a reason.
