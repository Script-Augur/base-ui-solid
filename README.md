# @script-augur/base-ui-solid

Solid-idiomatic port of [Base UI](https://base-ui.com/) headless components. Published to **GitHub Packages** under the `@script-augur` scope.

## Packages

| Package                       | Purpose                                                 |
| ----------------------------- | ------------------------------------------------------- |
| `@script-augur/base-ui-solid` | Public Solid headless components                        |
| `@script-augur/base-ui-utils` | Shared DOM/store helpers (workspace; publish if needed) |

## Install (consumers)

```bash
# Requires GitHub Packages auth for @script-augur
pnpm add @script-augur/base-ui-solid solid-js
```

Machine-wide auth (same as other Script-Augur packages):

```ini
# ~/.npmrc
@script-augur:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=ghp_YOUR_TOKEN
```

## Portal setup

Base UI-style overlays use portals. Add a stacking context on your app root:

```css
.root {
  isolation: isolate;
}
```

On iOS 26+ Safari, also ensure:

```css
body {
  position: relative;
}
```

## Develop

```bash
pnpm install
pnpm build
pnpm test        # watch mode (Vitest)
pnpm test:run    # one-shot (CI)
pnpm lint
pnpm storybook
pnpm changeset
```

## License

MIT — see [LICENSE](./LICENSE) and [NOTICE](./NOTICE).
