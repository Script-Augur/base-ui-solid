# @script-augur/base-ui-solid

## 0.4.0

### Minor Changes

- 304839e: Add Alert Dialog compound component (`Root`, `Trigger`, `Portal`, `Backdrop`, `Viewport`, `Popup`, `Title`, `Description`, `Close`) ported from `@base-ui/react@1.7.0` as a thin Dialog wrapper with forced modal behavior, disabled pointer dismissal, and `role="alertdialog"`.
- ad3f734: Add Checkbox (Root + Indicator) with Field/Form integration, ported from `@base-ui/react@1.7.0`.
- 8a21242: Add Checkbox Group with parent/select-all support and Field/Form integration, ported from `@base-ui/react@1.7.0`.
- 304839e: Add Dialog compound component (`Root`, `Trigger`, `Portal`, `Backdrop`, `Viewport`, `Popup`, `Title`, `Description`, `Close`) ported from `@base-ui/react@1.7.0`, reusing Portal plus dismiss / focus-trap / scroll-lock internals.
- 16df3f9: Add Field compound component (`Root`, `Label`, `Error`, `Description`, `Control`, `Validity`, `Item`) and supporting Labelable internals, ported from `@base-ui/react@1.7.0`.
- 70bb98c: Add Fieldset compound component (`Root`, `Legend`) with nested disabled inheritance and legend `aria-labelledby` association, ported from `@base-ui/react@1.7.0`.
- 2ed97ac: Add Form component with consolidated validation, external errors, `onFormSubmit`, and `actionsRef`, ported from `@base-ui/react@1.7.0`.
- a130f42: Add Input component as a Field.Control wrapper with Field/Form integration, ported from `@base-ui/react@1.7.0`.
- 153522b: Add NumberField compound component (`Root`, `Group`, `Input`, `Increment`, `Decrement`, `ScrubArea`, `ScrubAreaCursor`) ported from `@base-ui/react@1.7.0`.
- a885988: Add Popover compound component (`Root`, `Trigger`, `Portal`, `Positioner`, `Popup`, `Arrow`, `Backdrop`, `Title`, `Description`, `Close`, `Viewport`, stub `createHandle`) ported from `@base-ui/react@1.7.0`, based on Portal with Floating UI positioning.
- 8ef854a: Add Portal (FloatingPortalLite-compatible mount) with nested portal context for overlays, ported from `@base-ui/react@1.7.0`.
- e71c595: Add Radio (Root + Indicator) and RadioGroup with Field/Form integration, ported from `@base-ui/react@1.7.0`.
- 22af97e: Add Switch (Root + Thumb) with Field/Form integration, ported from `@base-ui/react@1.7.0`.

## 0.3.0

### Minor Changes

- e695b61: Add Scroll Area compound component (`Root`, `Viewport`, `Content`, `Scrollbar`, `Thumb`, `Corner`) ported from `@base-ui/react@1.7.0`.

## 0.2.0

### Minor Changes

- 61c1bdc: Add Avatar (`Root` / `Image` / `Fallback`) with image loading status, enter/exit transition hooks, delayed fallback, deep import `@script-augur/base-ui-solid/avatar`, and Storybook stories.
- 76f91ea: Add Meter (`Root` / `Track` / `Indicator` / `Label` / `Value`) with range normalization, formatted value display, ARIA attributes, deep import `@script-augur/base-ui-solid/meter`, and Storybook stories.

## 0.1.0

### Minor Changes

- 09516f7: Add Accordion (`Root` / `Item` / `Header` / `Trigger` / `Panel`) with single/multiple open values, cancelable `onValueChange`, deep import `@script-augur/base-ui-solid/accordion`, and Storybook stories.
- 1480c61: Add Button with native/non-native semantics, disabled + focusableWhenDisabled behavior, deep import `@script-augur/base-ui-solid/button`, and Storybook stories.
- 2c7da43: Add Collapsible (`Root` / `Trigger` / `Panel`) with controlled open state, cancelable `onOpenChange`, deep import `@script-augur/base-ui-solid/collapsible`, and Storybook stories.
- 96db1ae: Add Progress (`Root` / `Track` / `Indicator` / `Label` / `Value`) with range normalization, formatted value display, ARIA attributes, deep import `@script-augur/base-ui-solid/progress`, and Storybook stories.
- 1480c61: Add Separator with orientation + data-orientation, deep import `@script-augur/base-ui-solid/separator`, and Storybook stories.
- a267cb4: Add Tabs (`Root` / `List` / `Trigger` / `Panel` / `Indicator`) with controlled/uncontrolled value, cancelable `onValueChange`, composite keyboard navigation, activation direction, deep import `@script-augur/base-ui-solid/tabs`, and Storybook stories.
- aab8051: Add Toggle with controlled/uncontrolled pressed state, cancelable onPressedChange, deep import `@script-augur/base-ui-solid/toggle`, and Storybook stories.
- 9023f83: Add ToggleGroup with shared value state for nested Toggles, cancelable onValueChange, deep import `@script-augur/base-ui-solid/toggle-group`, and Storybook stories.
