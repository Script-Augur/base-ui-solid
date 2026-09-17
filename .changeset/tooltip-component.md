---
'@script-augur/base-ui-solid': minor
'@script-augur/base-ui-utils': patch
---

Add Tooltip compound component (`Root`, `Trigger`, `Portal`, `Positioner`, `Popup`, `Arrow`, `Provider`, `Viewport`, stub `createHandle`) ported from `@base-ui/react@1.7.0`, based on Portal with Floating UI positioning and hover/focus-driven open state.

Widen `contains` / `ownerDocument` / `ownerWindow` to accept `EventTarget` so DTS builds succeed with DOM event targets.
