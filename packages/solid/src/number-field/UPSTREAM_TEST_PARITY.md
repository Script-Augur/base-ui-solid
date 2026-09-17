# Number Field upstream test parity

Pinned upstream: `@base-ui/react@1.7.0`
(`packages/react/src/number-field/**`).

## Summary

| Area                                                                  | Status                                                                             |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Utils (`parse`, `validate`, `getViewportRect`)                        | **Full parity** with upstream unit tests                                           |
| Components (Root / Input / Group / Increment / Decrement / ScrubArea) | **Partial** — ~95 jsdom-runnable cases; not full upstream suite (~260 React cases) |

Do **not** treat component suites as complete parity. Upstream Root alone is ~2800 lines; Solid Root/Input/Increment/Decrement cover the behaviors listed below.

## Harness / environment skips (never ported here)

| Upstream                                                                                     | Reason                                               |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `describeConformance` (Root, Input, Group, Increment, Decrement, ScrubArea, ScrubAreaCursor) | React conformance harness                            |
| `NumberFieldRoot.iOS.test.tsx`                                                               | iOS `inputMode` / keyboard                           |
| `NumberFieldScrubArea.gecko.test.tsx`                                                        | Gecko pointer-lock timing                            |
| `*.spec.tsx`                                                                                 | Type-level React tests                               |
| Imperative React ref-callback identity / detach lifecycle                                    | React callback-ref shape; Solid function refs differ |

## Utils — ported in full

- `utils/parse.test.ts`
- `utils/validate.test.ts`
- `utils/getViewportRect.test.ts`

## Components — what IS ported (jsdom)

### Root (`NumberFieldRoot.test.tsx`)

- `defaultValue` / controlled `value` (incl. `null`, whitespace → `null`)
- `onValueChange` reasons (input-change, input-clear, keyboard, increment/decrement-press) + cancel
- `onValueCommitted` after button press
- `disabled` / `readOnly` / `required` / `name` (+ hidden input readOnly)
- `min` / `max` clamp while typing; `allowOutOfRange` typing vs step clamp
- `step` / `snapOnStep` via buttons
- Field: label association, disabled + name inheritance, `data-touched` / `data-dirty` (root) / `data-filled` / `data-focused`
- Field: `validationMode` onBlur / onChange (via `Field.Error`), `Field.Validity` onBlur
- Field: `Field.Description` + external `aria-describedby` composition (a11y merge regression)
- Form: clear external errors on change / increment; hidden-input autofill

### Input (`NumberFieldInput.test.tsx`)

- Role / `aria-roledescription`
- Parseable typing, non-numeric rejection, clear-on-empty
- ArrowUp/Down step; Home/End bounds
- `smallStep` (Alt) / `largeStep` (Shift) keyboard (controlled, single-step assertions)
- Blur commit for min / max / no step-snap / currency parse (`onValueCommitted`)
- Paste basics; consumer-prevented keydown; step from full-precision numeric state

### Increment / Decrement

- Click step, empty→0 / 0→-1, disabled at max/min
- Root `disabled` / `readOnly` no-ops
- Dirty-input sync via pointerdown (`onValueChange`); `snapOnStep` true/false
- Controlled external update then step
- Pointerdown + click does not double-fire; Increment ignores non-primary button
- Increment `aria-controls` / aria-labels

### Group / ScrubArea (thin)

- Group `role="group"`
- ScrubArea pointer-down scrub start; readOnly no scrub

## Components — still skipped / deferred (not just harness)

These exist upstream but are **not** claimed as Solid parity yet:

| Topic                                                                       | Notes                                                                       |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Continuous press-and-hold (timers, mouseleave/enter, touch timeout)         | Only click / single pointerdown basics in jsdom                             |
| Pointer `smallStep` / `largeStep` (Alt/Shift on button pointerdown)         | Upstream often `skipIf(isJSDOM)`; Solid covers keyboard Alt/Shift instead   |
| Wheel scrub (`allowWheelScrub`)                                             | Browser / passive listener edge cases                                       |
| ScrubAreaCursor + pointer-lock / virtual cursor motion                      | Pointer-lock-heavy; not in Solid suite                                      |
| Locale-heavy IME / exotic numeral / percent / roundingIncrement blur matrix | Large Input suite; only a few format/blur commit cases ported               |
| FormData / external `form` attribute submit                                 | Upstream skips in jsdom                                                     |
| Native `stepMismatch` / `rangeOverflow` form `checkValidity` matrix         | Partial behavior exists; not fully mirrored                                 |
| Dirty-input cancel races, controlled lag / stale commit edge cases          | Upstream Increment/Input advanced cases                                     |
| Multi-keystroke typing sequences asserting intermediate display             | jsdom + Solid controlled `value` binding; assert `onValueChange` / re-query |
| `inputMode` prop suite                                                      | Mostly iOS / browser                                                        |
| Consumer-prevented focus/blur/change defaults (full set)                    | Only keydown preventDefault covered                                         |

## Solid adaptations

- Dynamic props use `createSignal` / `*Assign` naming.
- `createRender` instead of `useRenderElement`.
- Label `htmlFor` → Solid `for`; text input uses `onInput` (≈ React `onChange`).
- Hidden `<input type="number">` for form association.
- Native wheel listener with `{ passive: false }` via `addEventListener`.
- `createPressAndHold` Solid port of `usePressAndHold`.
- Scrub cursor portals via Solid `Portal`.
- NumberFieldInput a11y merge matches FieldControl order: built-ins → `elementProps` → composed `aria-describedby` / `aria-invalid`.
- Form `clearErrors` / `validation.change` also run from Root `setValue` so they survive Input effect remount edge cases under state-attribute updates.
