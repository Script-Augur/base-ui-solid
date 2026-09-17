# Slider upstream test parity

Pinned upstream: `@base-ui/react@1.7.0`
(`packages/react/src/slider/**`).

## Skipped

| Upstream case | Reason |
| ------------- | ------ |
| `describeConformance` (all parts) | React conformance harness |
| Full `SliderRoot.test.tsx` pointer/touch matrix (~3.5k lines) | Ported core controlled/disabled/range/orientation/cancel cases; remaining pointer geometry + RTL drag suites need browser layout |
| Full `SliderThumb.test.tsx` focus-visible restore / prehydration | `:focus-visible` restore covered lightly; SSR prehydration script not ported (same as Tabs Indicator) |
| Full `SliderControl.test.tsx` touch/pointer capture suites | Control drag/track-press implemented; detailed pointer-rect cases need real layout |
| `thumbAlignment="edge"` prehydration script | Solid has no `PrehydrationScript`; `edge` / `edge-client-only` measure client-side only |
| Form `FormData` / native submit browser-only cases | Same Field/Form jsdom limits as Switch/NumberField |

## Solid adaptations

- `createControlled` + `valueAssign` / `fooAssign` naming (`AGENTS.md`).
- `createRender` + `splitProps` instead of `useRenderElement`.
- Context values are accessors (`values()`, `disabled()`, …).
- `onValueChange` / `onValueCommitted` use `createChangeEventDetails` / `createGenericEventDetails` with `REASONS.drag` / `REASONS.trackPress` / `keyboard` / `inputChange` / `none`.
- Label uses `createLabel` (non-native `<div>`).
- Output uses Solid `for` instead of React `htmlFor`.

## Parity status

Utils unit tests (`roundValueToStep`, `getSliderValue`, `getPushedThumbValues`, `resolveThumbCollision`) match upstream.
`enumSync.test.tsx` asserts thumb `data-index`.
Root/Value/Label/Indicator/Thumb smoke + Field-oriented behavior covered in part tests.
