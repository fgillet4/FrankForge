import { writable } from 'svelte/store';

// Create a store with initial value of null
export const canvasStore = writable(null);