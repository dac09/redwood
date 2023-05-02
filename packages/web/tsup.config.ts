import fs from 'node:fs/promises'

import fg from 'fast-glob'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/**/*.{ts,tsx,js,jsx}',
    //  '!src/entry/**/*.{ts,tsx,js,jsx}',
    '!src/**/__tests__/**',
    // '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx,js,jsx}',
    '!src/**/__typetests__/**',
    '!src/**/__mocks__/**',
    '!src/**/__fixtures__/**',
  ],
  external: ['~redwood-app-root'],
  sourcemap: true,
  // shims: true,
  bundle: true, // @TODO we should double check
  // splitting: true,
  clean: true,
  shims: true,
  format: ['esm', 'cjs'],
  onSuccess: async () => {
    const dtsFiles = await fg('src/**/*.d.ts', {
      cwd: __dirname,
    })

    dtsFiles.forEach(async (file) => {
      await fs.copyFile(file, file.replace('src', 'dist'))
    })
  },
})
