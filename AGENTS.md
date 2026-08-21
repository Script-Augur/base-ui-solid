# Agent / contributor notes

Conventions for humans and coding agents working in this repo.

## Signal tuple naming

Prefer pairing a signal (or controlled signal) with a setter whose name **shares the same stem**:

```ts
// Preferred — rename/search for `open` finds both the read and the write
const [open, openAssign] = createControlled({ defaultValue: false })
const [value, valueAssign] = createSignal('')

openAssign(true)
openAssign(prev => !prev)
```

Avoid Solid’s default `setFoo` pairing when the state name is short and overloaded:

```ts
// Avoid — refactoring `open` → `expanded` leaves stray `setOpen` hits
const [open, setOpen] = createControlled({ defaultValue: false })
```

**Why:** text search and many renames treat `open` and `setOpen` as unrelated. `open` / `openAssign` stay linked.

Apply the same pattern to `createSignal`, `createControlled`, and any custom `[get, set]` tuple used in component internals. This convention is in force across the package — use `fooAssign` for new code and when touching existing call sites.
