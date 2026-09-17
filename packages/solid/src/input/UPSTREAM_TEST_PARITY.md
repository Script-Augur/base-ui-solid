# Input — upstream test parity

Pinned against `@base-ui/react@1.7.0` (`UPSTREAM.md`).

Sources: `packages/react/src/input/` (`Input.tsx`, `Input.test.tsx`, `InputDataAttributes.ts`).

## Upstream shape

React `Input` is a thin `forwardRef` wrapper around `Field.Control` — same props, state, and change-event types. Solid mirrors that by rendering `FieldControl` with identical public types.

Upstream `Input.test.tsx@1.7.0` is only `describeConformance`. Solid’s behavioral suite below exercises **Field.Control through Input** (and Form integration), not ports of upstream Input cases.

## Covered (Field.Control through Input)

| Area                                                           | Solid file       | Notes                                    |
| -------------------------------------------------------------- | ---------------- | ---------------------------------------- |
| Native `<input>` host                                          | `Input.test.tsx` |                                          |
| Field label association + disabled/invalid data attrs          | `Input.test.tsx` | Via `Field.Root`                         |
| Controlled `value` / `onValueChange`                           | `Input.test.tsx` | Field.Control path                       |
| Uncontrolled `defaultValue`                                    | `Input.test.tsx` | Field.Control path                       |
| Field style hooks (`filled` / `dirty` / `focused` / `touched`) | `Input.test.tsx` | Field.Control path                       |
| Field `validate` + `validationMode`                            | `Input.test.tsx` | Field.Control path                       |
| Form external-error clear on input                             | `Input.test.tsx` | Via `<Form errors={…}>`                  |
| `render` → textarea composition                                | `Input.test.tsx` | Behavioral stand-in for `Input.spec.tsx` |
| Input-only value events (no blur `change` double-fire)         | `Input.test.tsx` | Solid `onInput` convention               |

## Skipped

| Upstream test                                   | Reason                                                    |
| ----------------------------------------------- | --------------------------------------------------------- |
| `describeConformance`                           | Not used in this package                                  |
| `Input.spec.tsx` type-level ref / render checks | Type-level; behavioral render covered in `Input.test.tsx` |

## Solid divergences

- **Wrapper**: Solid `Input` is a function component that spreads into `FieldControl` (no `forwardRef`; Solid refs are props).
- **Signal naming**: Field/Form internals use `fooAssign` per `AGENTS.md`.
- **Value events**: Solid uses `onInput` only (same as Field.Control).
