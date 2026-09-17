# Select — upstream test parity

Upstream reference: `@base-ui/react@1.7.0` `Select` (`Root`, `Label`,
`Trigger`, `Value`, `Icon`, `Portal`, `Backdrop`, `Positioner`, `Popup`,
`List`, `Item`, `ItemIndicator`, `ItemText`, `Arrow`, `ScrollUpArrow`,
`ScrollDownArrow`, `Group`, `GroupLabel`, `Separator`).

## Covered here

| Behavior                                                     | Status  |
| ------------------------------------------------------------ | ------- |
| Trigger opens / item click closes (single select)            | covered |
| `aria-expanded` / `aria-controls` on trigger                 | covered |
| `aria-selected` on items                                     | covered |
| `Select.Value` label fallback (`items` map not required)     | covered |
| Placeholder when no value selected                           | covered |
| Escape dismiss                                               | covered |
| Outside-press dismiss                                        | covered |
| Controlled `value` + `onValueChange` reason                  | covered |
| Controlled `open` + `onOpenChange` reason (`trigger-press`)  | covered |
| `onValueChange` / `onOpenChange` `cancel()`                  | covered |
| `disabled` prevents opening                                  | covered |
| Portal mount (`data-base-ui-portal`)                         | covered |
| Internal backdrop when `modal === true` (default)            | covered |
| Modal scroll lock (`modal === true` default)                 | covered |
| Non-modal: no scroll lock                                    | covered |
| `Select.Label` wired to trigger via `aria-labelledby`        | covered |
| `Select.Group` + `Select.GroupLabel` (`aria-labelledby`)     | covered |
| `multiple` selection + comma-joined `Select.Value`           | covered |
| `actionsRef.unmount`                                         | covered |
| `Select.ItemIndicator` renders only for the selected item    | covered |
| `disabled` items do not select / do not fire `onValueChange` | covered |
| Hidden `<input>` with serialized value for form submission   | covered |

## Deferred / partial

| Behavior                                                                             | Notes                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full keyboard `listNavigation` (arrow keys move highlight, typeahead)                | `Select.List` uses `CompositeRoot`/`CompositeItem` for Tab order and basic arrow-key composite navigation; upstream's dedicated Floating UI `useListNavigation` + typeahead matching is not ported                                                                                                         |
| `alignItemWithTrigger` positioning (popup aligns so selected item sits over trigger) | Deferred; `Select.Positioner` always uses `flip`/`shift`/`offset` with a fixed side, like Popover                                                                                                                                                                                                          |
| `selectedItemTextRef` DOM sync (Value adopts the exact rendered item text/casing)    | Not ported — `Select.Value` uses `resolveSelectedLabel`/`resolveMultipleLabels` against the `items` prop or `itemToStringLabel`, matching upstream's non-DOM-sync fallback path; without an `items` map it shows the serialized raw value (see test: `displays the selected value label via Select.Value`) |
| Scroll arrows: fine-grained pointer/hold acceleration curve                          | `createPressAndHold` provides press-and-hold repeat scrolling; upstream's exact acceleration curve is not matched pixel-for-pixel                                                                                                                                                                          |
| `highlightItemOnHover` moving a dedicated "active index" independent of focus        | Lite: hover currently relies on native focus/hover styling via Composite; no separate active-index store                                                                                                                                                                                                   |
| Multi-select keyboard range/shift-click selection                                    | Only click/pointerup toggle is implemented for `multiple`                                                                                                                                                                                                                                                  |
| RTL / `inline-start` / `inline-end` direction remapping                              | Maps to left/right (LTR), consistent with Popover                                                                                                                                                                                                                                                          |
| Full animation / `onOpenChangeComplete` exit matrix (CSS transitions)                | Wired via `createOpenChangeComplete`/`createTransitionStatus`; CSS animation edge cases deferred                                                                                                                                                                                                           |
| Nested selects / combobox-in-select composition                                      | Out of scope for this port                                                                                                                                                                                                                                                                                 |
| Shadow DOM outside-press matrix                                                      | jsdom coverage limited, same deferral as Popover/Dialog                                                                                                                                                                                                                                                    |
