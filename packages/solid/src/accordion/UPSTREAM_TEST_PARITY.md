# Accordion — upstream test parity

Pinned against `@base-ui/react@1.7.0` (`UPSTREAM.md`).

Layout mirrors upstream:

| Upstream                                      | Ours                                |
| --------------------------------------------- | ----------------------------------- |
| `accordion/root/AccordionRoot.test.tsx`       | `root/AccordionRoot.test.tsx`       |
| `accordion/item/AccordionItem.test.tsx`       | `item/AccordionItem.test.tsx`       |
| `accordion/header/AccordionHeader.test.tsx`   | `header/AccordionHeader.test.tsx`   |
| `accordion/trigger/AccordionTrigger.test.tsx` | `trigger/AccordionTrigger.test.tsx` |
| `accordion/panel/AccordionPanel.test.tsx`     | `panel/AccordionPanel.test.tsx`     |
| `accordion/root/AccordionRoot.spec.tsx`       | _(skipped — see below)_             |

## Ported

All jsdom-runnable behavioral cases from the files above, adapted for Solid (`render(() => …)`, signals, `fireEvent`).

Keyboard cases for **native** `<button>` use `fireEvent.click` (or click after Space keyup) where jsdom does not synthesize the browser’s click-from-keyboard; **non-native** triggers exercise `useButton` Enter / Space paths directly.

## Intentionally skipped

| Upstream case                                                     | Reason                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------- |
| `describeConformance(…)` (all parts)                              | React `#test-utils` conformance harness; not ported           |
| `AccordionRoot.spec.tsx` TypeScript `expectType` matrix           | React TS harness; rely on our `.d.ts` + `tsc` instead         |
| ARIA: `preserves generated part associations during hydration`    | Needs SSR/`renderToString` + hydrate; not wired for Solid yet |
| Panel: `suppresses the initial keyframe animation…` (SSR)         | Height/animation suppression not implemented in this slice    |
| Panel: CSS transition exit (`data-ending-style`, measured height) | Panel size / transition status not implemented yet            |
| Panel: `React.Activity` open-animation replay                     | React-only API                                                |
| Item: `state` test was `skipIf(isJSDOM)` upstream                 | Ported and run in jsdom (Solid render prop is sync enough)    |

## When bumping upstream

1. Diff `packages/react/src/accordion/**/*.test.tsx` (and `.spec.tsx`) at the new tag.
2. Add or update cases here with the same titles where possible.
3. Move any newly skippable-only cases into the table above with a reason.
