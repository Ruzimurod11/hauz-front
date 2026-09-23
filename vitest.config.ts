import { defineConfig } from 'vitest/config'

// Separate from vite.config.ts so unit tests do not boot the TanStack Start
// plugin; the tested modules are plain TypeScript.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
