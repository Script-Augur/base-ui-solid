# Combobox — upstream test parity (Lite)

Solid Combobox Lite targets `@base-ui/react@1.7.0` Combobox public parts with a
usable single-select type-to-filter path. This file records what is covered by
`Combobox.test.tsx` versus intentionally deferred.

## Covered

| Area | Status |
|------|--------|
| Input `role=combobox`, open on click (`openOnInputClick`) | covered |
| Trigger toggles open (`trigger-press`) | covered |
| Item select fills input, closes, `aria-selected` | covered |
| Controlled `value` + `cancel()` | covered |
| Controlled `open` + `cancel()` | covered |
| Controlled `inputValue` + default filter hides non-matches | covered |
| Escape / outside-press dismiss reasons | covered |
| `disabled` / `readOnly` | covered |
| Portal mount (`data-base-ui-portal`) | covered |
| `modal` default **false**; `modal={true}` scroll lock + internal backdrop | covered |
| Label → Input `aria-labelledby` | covered |
| Clear (`clear-press` / input clear) | covered |
| Empty when filtered items length is 0 (`items` + Collection) | covered |
| Hidden form input / `name` serialization | covered |
| Field validity (`aria-invalid`) on Input | covered |
| `actionsRef.unmount` | covered |
| ItemIndicator only when selected | covered |
| Disabled item does not change value | covered |
| Lite ArrowDown highlight (`data-highlighted`) | covered |

## Deferred / Lite stubs

| Area | Notes |
|------|--------|
| Full Floating UI `useListNavigation` + typeahead | Composite Lite only |
| Aria modes `'both' \| 'inline' \| 'none'` | Not on public ComboboxRoot; Autocomplete owns these |
| `autoHighlight: 'always'` / `keepHighlight` | Public Root is boolean `autoHighlight`; always/keep deferred |
| `loopFocus` full APG matrix | Prop accepted; Composite approximates |
| `grid` + `Row` 2D keyboard nav | Row is presentational stub |
| `virtualized` / `inline` / Dialog composition reset | Props accepted as no-ops |
| Chips focus / Backspace-to-remove matrix | ChipRemove supports minimal multi remove only |
| `Status` async announcement nuances | Polite live region stub |
| Grouped `items` flattening parity with upstream store | Basic flatten + Collection only |
| `limit` edge cases | Implemented when `items` array is filtered; not exhaustively tested |
| `submitOnItemClick`, `fillInputOnItemPress` | Aria-internal; not public |
| Autofill matching against labelsRef/valuesRef | Lite autofill sets raw string value |
| Shadow DOM outside-press; CSS animation `onOpenChangeComplete` edges | Same Lite limits as Select |
| `cancel-open` / window-resize reasons | Reason constant added; behavior deferred |
| Positioner collision CSS vars / `anchorHidden` | Same Lite stubs as Select |
| Multi shift-range selection | Click toggle only |
| RTL remapping | Same as Select/Popover |
| Scroll arrows / ItemText | Select-only — not part of Combobox |
| InputGroup / Collection advanced recipes | Thin stubs exported |

**Do not claim Covered** for filter modes beyond default `list` contains-filter, or for chips keyboard, unless additional tests land.
