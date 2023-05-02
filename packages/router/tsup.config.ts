import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/__tests__/**',
    '!src/**/__typetests__/**',
    '!src/**/__mocks__/**',
    '!src/**/__fixtures__/**',
  ],
  sourcemap: true,
  // bundle: false, // @TODO we should double check
  jsxFactory: 'automatic',
  esbuildOptions(options) {
    options.jsx = 'automatic'
  },
  clean: true,
  format: ['esm', 'cjs'],
})
