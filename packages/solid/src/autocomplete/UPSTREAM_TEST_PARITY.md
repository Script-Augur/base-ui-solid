# Autocomplete — upstream test parity (Lite)

Solid Autocomplete Lite targets `@base-ui/react@1.7.0` Autocomplete as a thin
façade over Combobox with `selectionMode: 'none'`. Public `value` is the
**input string** (mapped to Combobox `inputValue`), not a selected item.

## Shared with Combobox (re-exported)

| Part / API | Notes |
| ---------- | ----- |
| Input, Icon, Clear, List, Status, Portal, Backdrop, Positioner, Popup, Arrow | Combobox implementations |
| Group, GroupLabel, Row, Collection, Empty | Combobox implementations |
| `useFilter` / `useFilteredItems` | Combobox utils |
| Arrow highlight + `aria-activedescendant` | Combobox Lite Input path |
| Filter unmounts non-matches; Enter activates visible only | Combobox Lite |

## Unique Autocomplete

| Area | Status |
| ---- | ------ |
| Root remap: `value` → input string; `selectionMode: 'none'` | covered |
| `openOnInputClick` default **false** | covered |
| Item press fills input, closes; **no** lasting `aria-selected` | covered |
| Clear clears **input** only (`clear-press`); visible when input non-empty | covered |
| Form `name` on visible Input (input owns form value) | covered |
| Controlled `value` + `cancel()` on input change | covered |
| `mode: 'list'` default filtering | covered |
| `Autocomplete.Value` reads input string | covered |
| Field `aria-invalid` on Input | covered |
| `actionsRef.unmount` | covered |
| Trigger toggles open | covered |

## Deferred / Lite gaps

| Area | Notes |
| ---- | ----- |
| `mode: 'both' \| 'inline'` inline preview | Props accepted; filter disabled for `inline`/`none`; no temporary highlight→input compose |
| `mode: 'none'` static list | Filter off; no further mode-specific UX |
| `keepHighlight` | Accepted no-op |
| `autoHighlight: 'always'` | Treated like `true` in Lite |
| `submitOnItemClick` | Accepted no-op |
| `inline` list-without-popup | Accepted no-op (Combobox) |
| Full Floating listNavigation matrix | Same Combobox Lite limits |
| Label / ItemIndicator / Chips | Combobox-only — not in Autocomplete surface |

**Do not claim Covered** for inline autocompletion or form-submit-on-item-click
unless additional tests land.
