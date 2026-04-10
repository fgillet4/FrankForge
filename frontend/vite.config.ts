import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'path'

// Stub plugin – returns an empty module for the Rust WASM pkg when not yet compiled
const wasmStubPlugin = {
  name: 'wasm-pkg-stub',
  resolveId(id: string) {
    if (id.includes('frankforge_core')) return '\0frankforge_core_stub';
    return null;
  },
  load(id: string) {
    if (id === '\0frankforge_core_stub') {
      return 'export default {}; export function initialize_elements(){return{}} export function initialize_molecules(){return{}} export function initialize_reactions(){return[]}';
    }
    return null;
  },
};

export default defineConfig({
  plugins: [svelte(), wasmStubPlugin],
  resolve: {
    alias: {
      '$lib': resolve(__dirname, './src/lib')
    }
  }
})
