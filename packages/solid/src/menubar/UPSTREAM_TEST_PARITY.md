# Menubar — upstream test parity

Upstream reference: `@base-ui/react@1.7.0` `Menubar` (single root export
wrapping nested `Menu` trees).

Base: Menu PR (`cursor/port-menu-c6a4`) + popup-handle foundation. Menubar owns
a shared lite `FloatingTreeStore`, `CompositeRoot` (`role=menubar`), and
`MenubarContext` consumed by Menu Root / Trigger.

## Covered here

| Behavior | Status |
| -------- | ------ |
| `role=menubar` + `aria-orientation` | covered |
| Nested `Menu.Root` + `Menu.Trigger` as `role=menuitem` (CompositeItem) | covered |
| Open menu from menubar trigger click | covered |
| `data-has-submenu-open` via `menuopenchange` | covered |
| Sibling menu close when another top-level menu opens | covered |
| ArrowRight moves highlight between triggers (CompositeRoot) | covered |
| `disabled` disables nested Menu triggers (store selector) | covered |
| Modal scroll lock / `modal={false}` | covered |

## Deferred / Lite / partial

| Behavior | Notes |
| -------- | ----- |
| Full Floating UI `useHover` / `useFocus` / `safePolygon` on menubar triggers | Lite: click + hover-when-`hasSubmenuOpen` + focus-open when submenu open |
| Mixed click/mousedown toggle (`useMixedToggleClickHandler`) | Lite: click toggle only |
| InternalBackdrop cutout geometry for `contentElement` | Lite: outside-press ignores presses inside menubar `contentElement` (no visual hole) |
| Detached Menu.handle triggers inside Menubar + keyboardEventRelay matrix | Relay wired when CompositeRoot present; detached matrix deferred |
| Vertical menubar placement / RTL inline sides | Placement defaults exist; RTL deferred with Menu |
| Full `loopFocus` / Home / End edge matrix vs upstream composite | CompositeRoot Home/End enabled; not exhaustively tested |
| Patient click / pointer-up open quirks | Deferred with Menu hover Lite |
| Context Menu package | Sibling agent — out of this PR |

## Explicitly out of this PR

- Context Menu package
- Full Floating UI interaction merge (same Lite posture as Menu)
