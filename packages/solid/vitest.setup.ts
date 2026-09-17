import '@testing-library/jest-dom/vitest'

// Disable CSS enter/exit animation waits in unit tests (matches upstream helpers).
globalThis.BASE_UI_ANIMATIONS_DISABLED = true
