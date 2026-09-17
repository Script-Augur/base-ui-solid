# Toast upstream test parity

Pinned upstream: `@base-ui/react@1.7.0` (`packages/react/src/toast/**`).

## Summary

| Area                                                          | Status                            |
| ------------------------------------------------------------- | --------------------------------- |
| `ToastStore` (metadata, limit, close-all, updateKey, timers)  | **Covered** in focused suite      |
| Provider / `useToastManager` / `createToastManager` bridge    | **Covered**                       |
| Viewport expand (hover)                                       | **Covered**                       |
| Root Close + Title/Description `aria-*` ids                   | **Covered**                       |
| Promise toast loading → success                               | **Covered**                       |
| Full Root swipe / pointer / iOS matrix (~1700 lines upstream) | **Deferred**                      |
| Full Viewport F6 / focus-guard / touch / window-blur matrix   | **Deferred**                      |
| Positioner + Arrow floating placement suite                   | **Deferred** (Lite `useFloating`) |
| `describeConformance` / `*.spec.tsx`                          | **Not ported** (React harness)    |
| High-priority SR announcement edge cases                      | **Deferred**                      |

## Covered here (`Toast.test.tsx`)

- Store metadata sync, ending-height ignore, close-all, limit flags, updateKey
- Provider add + default 5s auto-dismiss (fake rAF timers)
- Manager `close()` without id removes all
- Limit marks older toasts `limited`
- `promise()` loading → success description
- Viewport `data-expanded` on mouse enter
- Close button dismisses; title/description ids on root
- `createToastManager` add / update / close bridge
- `store.select` reactivity

## Deferred (upstream still source of truth)

- Swipe dismiss directions, reverse-cancel, damping, ignore selectors
- Touch pause / document pointerdown outside viewport
- F6 focus viewport, focus guards, shift-tab restore
- Window blur / focus timer pause-resume edge cases
- Anchored positioner collision / arrow uncentered matrix
- Action renderable-children + `actionProps` merge edge cases
- Enum sync / type-level `*.spec.tsx`

Do **not** treat the Solid suite as complete parity with upstream Root/Viewport tests.
