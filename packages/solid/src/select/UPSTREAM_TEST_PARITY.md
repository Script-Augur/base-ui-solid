# Select — upstream test parity

Upstream reference: `@base-ui/react@1.7.0` `Select` (`Root`, `Label`,
`Trigger`, `Value`, `Icon`, `Portal`, `Backdrop`, `Positioner`, `Popup`,
`List`, `Item`, `ItemIndicator`, `ItemText`, `Arrow`, `ScrollUpArrow`,
`ScrollDownArrow`, `Group`, `GroupLabel`, `Separator`).

## Covered here

| Behavior                                                     | Status         |
| ------------------------------------------------------------ | -------------- |
| Trigger opens / item click closes (single select)            | covered        |
| Keyboard open (click without pointer type — Enter/Space)     | covered        |
| `aria-expanded` / `aria-controls` on trigger                 | covered        |
| `aria-selected` on items                                     | covered        |
| `Select.Value` label fallback (`items` map not required)     | covered        |
| Placeholder when no value selected                           | covered        |
| Escape dismiss                                               | covered        |
| Outside-press dismiss                                        | covered        |
| Controlled `value` + `onValueChange` reason                  | covered        |
| Controlled `open` + `onOpenChange` reason (`trigger-press`)  | covered        |
| `onValueChange` / `onOpenChange` `cancel()`                  | covered        |
| `disabled` prevents opening                                  | covered        |
| `readOnly` blocks open and blocks item selection when open   | covered        |
| Portal mount (`data-base-ui-portal`)                         | covered        |
| Internal backdrop when `modal === true` (default)            | covered        |
| Modal scroll lock (`modal === true` default)                 | covered        |
| Non-modal: no scroll lock                                    | covered        |
| `Select.Label` wired to trigger via `aria-labelledby`        | covered        |
| `Select.Group` + `Select.GroupLabel` (`aria-labelledby`)     | covered        |
| `multiple` selection + comma-joined `Select.Value`           | covered        |
| `multiple` + `name` → per-value `type="hidden"` inputs       | covered        |
| `actionsRef.unmount`                                         | covered        |
| `Select.ItemIndicator` renders only for the selected item    | covered        |
| `disabled` items do not select / do not fire `onValueChange` | covered        |
| Hidden `<input>` with serialized value for form submission   | covered        |
| Field validity on Trigger (`aria-invalid` / `data-invalid`)  | covered        |
| Item `highlighted` / `data-highlighted` from Composite index | covered (Lite) |

## Deferred / partial

| Behavior                                                                      | Notes                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full keyboard `listNavigation` (typeahead match, closed-trigger typeahead)    | `Select.List` uses `CompositeRoot`/`CompositeItem` for Tab order, arrow-key highlight, and `data-highlighted`; upstream Floating UI `useListNavigation` + `useTypeahead` (including closed-trigger typeahead that sets value) is not ported |
| `alignItemWithTrigger` positioning                                            | Prop default matches upstream (`true`); behavior is still a **no-op** in Lite positioning (flip/shift/offset only). Documented on the Positioner prop JSDoc                                                                                 |
| Autofill matching matrix                                                      | Shared hidden input has a Lite `onChange` that `setValue`s the raw autofilled string when not `multiple`/`readOnly`/`disabled`. Upstream also matches against `valuesRef` / `labelsRef` / `itemToString*` — that matrix is deferred         |
| Multi-select keyboard range / shift-click selection                           | Only click/pointer toggle is implemented for `multiple`                                                                                                                                                                                     |
| RTL / `inline-start` / `inline-end` direction remapping                       | Maps to left/right (LTR), consistent with Popover                                                                                                                                                                                           |
| Full animation / `onOpenChangeComplete` exit matrix (CSS transitions)         | Wired via `createOpenChangeComplete`/`createTransitionStatus`; CSS animation edge cases deferred                                                                                                                                            |
| Nested selects / combobox-in-select composition                               | Out of scope for this port                                                                                                                                                                                                                  |
| Shadow DOM outside-press matrix                                               | jsdom coverage limited, same deferral as Popover/Dialog                                                                                                                                                                                     |
| Scroll arrows: fine-grained pointer/hold acceleration curve                   | `createPressAndHold` provides press-and-hold repeat scrolling; upstream's exact acceleration curve is not matched pixel-for-pixel                                                                                                           |
| `selectedItemTextRef` DOM sync (Value adopts exact rendered item text/casing) | Not ported — `Select.Value` uses `resolveSelectedLabel`/`resolveMultipleLabels` against the `items` prop or `itemToStringLabel`, matching upstream's non-DOM-sync fallback path; without an `items` map it shows the serialized raw value   |
| Change reasons `windowResize` / `cancelOpen`                                  | Not in `SelectRootChangeEventReason` union yet; Trigger does not cancel open on mouseup-outside-during-press                                                                                                                                |
