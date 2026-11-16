import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    // The process engine is built into ../rust/pkg, outside this folder.
    fs: { allow: ['..'] },
  },
})
