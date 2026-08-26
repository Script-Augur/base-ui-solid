# Progress upstream test parity

Pinned upstream: `@base-ui/react@1.7.0` (`packages/react/src/progress`).

## Skipped (React-only or not applicable in Solid/jsdom)

| Upstream file                          | Case                        | Reason                                                                                       |
| -------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------- |
| `*/Progress*.test.tsx`                 | `describeConformance`       | React conformance harness — skipped for all parts (Root, Track, Indicator, Label, Value)     |
| `indicator/ProgressIndicator.test.tsx` | `internal styles` (3 cases) | Browser computed-style assertions (`describe.skipIf(isJSDOM)`) — cover manually in Storybook |

## Solid adaptations

- Dynamic prop updates use `createSignal` instead of React `setProps`.
- Context guard tests use synchronous `expect(() => render(...)).toThrow(...)`.
- Label association test uses Solid `Show` instead of React conditional render.

## Parity status

All other upstream behavioral cases in `ProgressRoot.test.tsx`, `ProgressLabel.test.tsx`, and `ProgressValue.test.tsx` are ported.
