# Navigation Menu — upstream test parity

Upstream reference: `@base-ui/react@1.7.0` `NavigationMenu` (`Root`, `List`,
`Item`, `Content`, `Trigger`, `Portal`, `Positioner`, `Viewport`, `Backdrop`,
`Popup`, `Arrow`, `Link`, `Icon`).

This port is a **Lite** Navigation Menu (same approach as Popover): no
`FloatingTree` / `useHover` / `useClick` / `safePolygon` from floating-ui-react.

## Covered here

| Behavior                                              | Status          |
| ----------------------------------------------------- | --------------- |
| Controlled / uncontrolled `value` + `onValueChange`   | covered         |
| `onValueChange` `cancel()`                            | covered         |
| Open derived from `value != null`                     | covered         |
| Trigger click toggle                                  | covered         |
| Trigger hover open/close with `delay` / `closeDelay`  | covered (Lite)  |
| Patient click / `stickIfOpen` after hover-open        | covered (Lite)  |
| Escape dismiss via List                               | covered         |
| Outside-press dismiss (ignores triggers)              | covered         |
| Link `closeOnClick` with `link-press` reason          | covered         |
| Content portals into Viewport when active             | covered         |
| Content `keepMounted`                                 | covered (basic) |
| Positioner `useFloating` against active trigger       | covered         |
| Portal / Popup / Backdrop / Arrow / Viewport / Icon   | covered         |
| List `CompositeRoot` orientation + arrow-key list nav | covered         |
| Nested root via parent `NavigationMenuRootContext`    | covered (Lite)  |
| Basic popup size CSS vars on item switch              | covered (Lite)  |
| Lite MutationObserver content auto-size               | covered (Lite)  |

## Deferred / partial

| Behavior                                                                    | Notes                                                              |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Full `FloatingTree` / `FloatingNode` nesting                                | Nested detection uses optional parent Root context only            |
| `safePolygon` hover close                                                   | Lite pointerenter/leave + delay on Trigger                         |
| Full floating-ui `useHover` / `useClick` interaction stack                  | Manual click + hover timers                                        |
| Nested `FloatingNode` content trees                                         | Content uses Solid `Portal` into Viewport only                     |
| Full auto-size matrix (interrupted mutation resize, animation finish reset) | Lite CSS vars + MutationObserver; not full upstream matrix         |
| Focus guards inside Viewport / Popup                                        | Deferred (Popover-style guards not fully wired)                    |
| `viewportInert` / viewport target element split                             | Deferred                                                           |
| Close transition fixed-size freeze on positioner                            | Deferred                                                           |
| Direction-aware `inline-start` / `inline-end` remapping                     | Maps to left/right (LTR)                                           |
| `collisionAvoidance` / sticky / boundary matrix                             | Accepted for API parity; Floating UI flip/shift defaults           |
| Intentional vs sloppy outside-press                                         | Solid uses `pointerdown` via Lite dismiss                          |
| Shadow DOM outside-press matrix                                             | jsdom coverage limited                                             |
| Full `onOpenChangeComplete` animation matrix                                | Wired via `createOpenChangeComplete`; CSS animation cases deferred |
