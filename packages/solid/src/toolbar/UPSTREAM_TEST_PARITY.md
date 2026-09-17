# Toolbar — upstream test parity (`@base-ui/react@1.7.0`)

Solid port covers Root / Group / Button / Link / Input / Separator with composite
roving tabindex, disabled inheritance, and `focusableWhenDisabled`.

## Covered (hosts in-tree)

| Area | Status |
| ---- | ------ |
| Root ARIA / context / keyboard (ltr+rtl) / disabled / `focusableWhenDisabled` | covered |
| Group disabled inheritance | covered |
| Button nativeButton Space/Enter; disabled + hover-while-disabled | covered |
| Button `render` → live `disabled` when root/group flips | covered (Solid regression) |
| Switch render + interactions + disabled | covered |
| Dialog / AlertDialog / Popover render + interactions + disabled + composite keydown isolation | covered |
| Toggle / ToggleGroup smoke | covered |
| Link ARIA | covered |
| Input pointer disabled / re-enable | covered |
| NumberField.Input render + ArrowUp/Down interactions + disabled | covered |
| Separator orientation + outside-root throw | covered |

## Deferred — missing dependency (not ported yet)

| Area | Reason |
| ---- | ------ |
| Menu.Trigger render / interactions / disabled | Menu not in `@script-augur/base-ui-solid` yet |
| Select.Trigger render / interactions / disabled | Select not ported yet |

## Deferred — available but intentionally skipped

| Area | Reason |
| ---- | ------ |
| Input caret-boundary keyboard navigation (`skipIf(!isJSDOM)` upstream) | Upstream skips in jsdom; Solid covered at composite level by Root keyboard tests + `isNativeInput` caret early-return |
| Input disabled Tab / vertical roving (`skipIf(!isJSDOM)` upstream) | Same jsdom limitation; pointer + NumberField disabled suites cover Solid focusable-disabled attrs |
| `describeConformance` | Solid suite does not use MUI conformance harness |
| Full ToggleGroup direct-child navigation matrix from React Button suite | Partial smoke via Toggle/ToggleGroup render; remaining cases are ToggleGroup-owned |

## Notes

- React `useButton` auto-detects composite via context; Solid passes `composite: () => true` on Toolbar.Button.
- Solid `render` props use `(props) => <Comp {...props} />` instead of JSX-element `render={<Comp />}`.
- Toolbar.Button mirrors React’s three-bag merge (`elementProps`, live `{ disabled }` for `render`, `getButtonProps(previous)`).
