// frontend/src/lib/canvasActions.ts
import { writable } from 'svelte/store';

// Define the interface for canvas actions
export interface CanvasActions {
  startPlacement: (buildingType: string) => void;
  selectBuilding: (id: string) => void;
  deleteSelectedBuilding: () => void;
  rotateSelectedBuilding: () => void;
  cancelPlacement: () => void;
}

// Create a store with initial null values for all actions
const defaultActions: CanvasActions = {
  startPlacement: null,
  selectBuilding: null,
  deleteSelectedBuilding: null,
  rotateSelectedBuilding: null,
  cancelPlacement: null
};

// Create the store
export const canvasActions = writable<CanvasActions>(defaultActions);

// Helper function to register canvas actions
export function registerCanvasActions(actions: Partial<CanvasActions>): void {
  canvasActions.update(currentActions => ({
    ...currentActions,
    ...actions
  }));
}