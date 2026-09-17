# Toolbar — upstream test parity (`@base-ui/react@1.7.0`)

Solid port covers Root / Group / Button / Link / Input / Separator with composite
roving tabindex, disabled inheritance, and `focusableWhenDisabled`.

## Deferred / skipped vs React suite

| Area | Reason |
| ---- | ------ |
| Menu / Select render-prop integration on `Toolbar.Button` | Menu and Select are not ported yet |
| Switch / Dialog / Popover / Menu / Select render-prop interaction suites | Menu/Select not ported; Switch/overlay interaction via `render` prop deferred (smoke render covered) |
| Input caret-boundary keyboard navigation (`skipIf(!isJSDOM)` upstream) | Complex selection APIs; covered at composite level by Root keyboard tests |
| NumberField Input interaction / disabled keyboard | Smoke render covered; full NumberField keyboard while nested deferred |
| `describeConformance` | Solid suite does not use MUI conformance harness |

## Notes

- React `useButton` auto-detects composite via context; Solid passes `composite: () => true` on Toolbar.Button.
- Solid `render` props use `(props) => <Comp {...props} />` instead of JSX-element `render={<Comp />}`.
