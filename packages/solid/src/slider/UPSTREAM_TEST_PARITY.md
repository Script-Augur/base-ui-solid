# Slider upstream test parity

Pinned upstream: `@base-ui/react@1.7.0`
(`packages/react/src/slider/**`).

## What is covered in this package

| Area | Coverage |
| ---- | -------- |
| Utils | Unit tests for `roundValueToStep`, `getSliderValue`, `getPushedThumbValues`, `resolveThumbCollision` (push/swap/none) |
| Root | Uncontrolled render; **controlled value + DOM assert**; cancel; min/max/step; range thumbs; vertical `data-orientation`; `onValueCommitted` + `input-change` / `keyboard` reasons; Field `data-dirty` (not on mount); Field disabled/name; Form clearErrors; Form `focusFirstInvalid` targets the **range input** |
| Value / Label / Indicator | Formatted output, children render fn, labelledby, indicator `%` width |
| Thumb keyboard | Home/End, **PageUp/PageDown**, **Shift+Arrow → largeStep** |
| Control | Smoke render; orientation/disabled attrs; non-primary button ignored; disabled ignores pointer; **no** pointer-geometry / track-press value asserts (jsdom layout) |
| enumSync | Thumb `data-index` only (not a full Progress-style attr matrix) |

## Intentionally skipped / thin

| Upstream case | Reason |
| ------------- | ------ |
| `describeConformance` (all parts) | React conformance harness |
| Full Root pointer / touch / RTL drag matrix (~3.5k lines) | Needs real layout / pointer capture geometry |
| Control track-press / drag **value** asserts | Implemented in `SliderControl`; not asserted here without layout |
| `thumbAlignment="edge"` SSR `PrehydrationScript` | Solid has no prehydration script; edge measures client-side only |
| Full Thumb focus-visible restore suite | Lightly covered via keyboard path only |
| FormData / native submit browser-only cases | Same jsdom limits as Switch/NumberField |
| Fieldset disabled-propagation case that cites Slider | Still skipped in Fieldset parity until that suite is extended |
| enumSync for orientation / dragging / disabled / field attrs | Documented minimal sync; expand later if desired |

## Solid adaptations

- `createControlled` + `valueAssign` / `fooAssign` (`AGENTS.md`).
- `createRender` + `splitProps` instead of `useRenderElement`.
- Context values are accessors (`values()`, `disabled()`, …).
- Field registers `validation.inputRef` (range input), matching React `useRegisterFieldControl(validation.inputRef, …)` — **not** the Control `div`.
- Value-change Field effect uses Switch-style prev gating (no mount clearErrors; no `validityData` re-entry loop).
- `onValueChange` / `onValueCommitted` use `REASONS.drag` / `trackPress` / `keyboard` / `inputChange` / `none`.
- Label uses `createLabel` (non-native `<div>`).
- Output uses Solid `for` instead of React `htmlFor`.
