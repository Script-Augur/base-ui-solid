# Portal — upstream test parity

Upstream reference: `@base-ui/react@1.7.0` internal `FloatingPortalLite` /
`useFloatingPortalNode` (no public standalone `Portal` package export).

## Covered here

| Behavior                         | Status  |
| -------------------------------- | ------- |
| Default mount to `document.body` | covered |
| Custom `container` element       | covered |
| `container={null}` defers mount  | covered |
| Reactive container assignment    | covered |
| Nested portal → parent host      | covered |
| Host `data-base-ui-portal` + ref | covered |

## Deferred (Dialog / full `FloatingPortal`)

| Behavior                                         | Notes                                                                                          |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Non-modal focus guards (`FocusGuard`, tab order) | Full `FloatingPortal` path; overlays should use `createFocusTrap` / add guards in Dialog slice |
| `aria-owns` visually-hidden span                 | Tied to focus-guard path                                                                       |
| ShadowRoot container cases                       | API accepts `ShadowRoot`; jsdom coverage limited                                               |
