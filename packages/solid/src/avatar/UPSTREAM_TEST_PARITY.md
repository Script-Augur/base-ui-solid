# Avatar upstream test parity

Pinned upstream: `@base-ui/react@1.7.0` (`packages/react/src/avatar`).

## Skipped (React-only or not applicable in Solid/jsdom)

| Upstream file                      | Case                        | Reason                                                                                       |
| ---------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------- |
| `*/Avatar*.test.tsx`               | `describeConformance`       | React conformance harness — skipped for Root, Image, Fallback                                |
| `Avatar.spec.tsx`                  | Type-level `expectType`     | React/TS expectType harness — covered by exported TypeScript types                           |
| `image/AvatarImage.test.tsx`       | `animations` (2 cases)      | Browser-only (`describe.skipIf(isJSDOM)`) — cover manually in Storybook                      |
| `image/AvatarImage.test.tsx`       | `cached images` SSR hydrate | Requires `renderToString` + hydrate; no Solid SSR harness yet — Storybook / future SSR suite |
| `fallback/AvatarFallback.test.tsx` | `regression` animation case | Browser-only animation exclusivity — cover manually in Storybook                             |

## Solid adaptations

- Dynamic prop updates use `createSignal` instead of React `setProps`.
- Image loading uses `window.Image` probe (same as upstream); tests mock `window.Image`.
- Fallback delay uses `@script-augur/base-ui-utils` `Timeout` (rAF-based); delay tests use Vitest fake timers.
- Context guard tests use synchronous `expect(() => render(...)).toThrow(...)`.

## Parity status

All other upstream behavioral cases that run under jsdom (`skipIf(!isJSDOM)` / non-browser suites) are ported.
