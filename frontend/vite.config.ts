import { defineConfig } from 'vite'

export default defineConfig({
  // main.ts awaits the login gate at the top level.
  build: { target: 'es2022' },
  server: {
    // The process engine is built into ../rust/pkg, outside this folder.
    fs: { allow: ['..'] },
  },
})
