# Menu foundation gaps (popup store)

This folder ports shared createHandle / popup-store pieces from
`@base-ui/react@1.7.0`. Dialog/Popover can ship on the hybrid open bridge
(`OPEN_PIPELINE.md`). **Menu must not start until the items below land** (or are
explicitly scoped into the Menu PR that consumes this foundation).

## Already in place for Menu

| Piece | Status |
| ----- | ------ |
| `BasePopupHandle` / attach stack | done |
| `PopupTriggerMap` + trigger data forwarding | done |
| `SolidStore` / `NullStore` / `select` / `useState` | done |
| `SolidStore.observe` (selector or projector) | done (stub-complete; matches upstream API) |
| `PopupStoreState.floatingRootContext` / `floatingId` slots | typed + defaulted (`null` / `undefined`) |
| Active-trigger sync + outside-press helper | done |

## Still required before / in Menu

| Upstream | Gap | Owner |
| -------- | --- | ----- |
| `createPopupFloatingRootContext` / real `FloatingRootStore` | Slot is typed but always `null` in Dialog/Popover initials. Menu needs a Solid floating root that supports `events.emit('setOpen')` / `dispatchOpenChange`. | Menu PR |
| `applyPopupOpenChange` | Open logic is duplicated in Dialog/Popover Root closures. Menu should share floating dispatch, not the hybrid overwrite. | Menu PR (+ optional follow-up to consolidate overlays) |
| `useTriggerFocusGuards` / `inlineRect` | Not ported. Menu focus guards / context-menu positioning need them. | Menu PR |
| `usePopupRootStore` | React helper; Solid equivalent may be a small Root factory once floating exists. | Menu PR |
| Menu `Handle.open(triggerId: string)` | Dialog allows optional id; Menu upstream requires a string id. | Menu handle |

## Rule

Do **not** fork `PopupStoreState` in `menu/store` to invent parallel floating
fields. Extend the shared types here (or fill `floatingRootContext`) so Dialog /
Popover / Menu stay one family.
