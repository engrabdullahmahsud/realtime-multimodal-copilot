import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/workspace.ts',
    'src/document.ts',
    'src/conversation.ts',
    'src/ai.ts',
    'src/auth.ts',
    'src/database.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
})
