import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/**/*.{ts,tsx,js,jsx}',
    //  '!src/entry/**/*.{ts,tsx,js,jsx}',
    '!src/**/__tests__/**',
    '!src/**/__typetests__/**',
    '!src/**/__mocks__/**',
    '!src/**/__fixtures__/**',
  ],
  external: ['~redwood-app-root'],
  sourcemap: true,
  // bundle: false, // @TODO we should double check
  clean: true,
  format: ['esm', 'cjs'],
})
