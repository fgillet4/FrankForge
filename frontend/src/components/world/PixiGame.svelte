<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { initPixiApp, pixiApp, setPlacementMode, moveWorld } from '../../lib/pixiManager';
  import { gameState } from '../../stores/gameState';
  import { get } from 'svelte/store';
  
  // Props
  export let width = '100%';
  export let height = '100%';
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  // Local state
  let gameContainer: HTMLDivElement;
  let selectedBuildingType: string | null = null;
  let isPlacementMode = false;
  
  // Keyboard controls
  let keysPressed: Record<string, boolean> = {};
  let keyboardControlsActive = false;
  let keyboardInterval: number | null = null;
  
  // Handle keyboard controls
  function handleKeyDown(event: KeyboardEvent) {
    // Don't block other handlers - we want the Escape key to still work
    const key = event.key.toLowerCase();
    keysPressed[key] = true;
    
    // Only handle WASD keys in this component
    if (['w', 'a', 's', 'd'].includes(key)) {
      // Start the movement loop if not already running
      if (!keyboardControlsActive) {
        startKeyboardControls();
      }
    }
  }
  
  function handleKeyUp(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    keysPressed[key] = false;
    
    // Check if any movement keys are still pressed
    const anyKeysPressed = ['w', 'a', 's', 'd'].some(k => keysPressed[k]);
    if (!anyKeysPressed && keyboardControlsActive) {
      stopKeyboardControls();
    }
  }
  
  function startKeyboardControls() {
    keyboardControlsActive = true;
    
    // Process keyboard input at a fixed rate
    keyboardInterval = window.setInterval(() => {
      // Calculate direction vector
      let dx = 0;
      let dy = 0;
      
      if (keysPressed['w']) dy += 10; // Up
      if (keysPressed['s']) dy -= 10; // Down
      if (keysPressed['a']) dx += 10; // Left
      if (keysPressed['d']) dx -= 10; // Right
      
      // Move the world if there's any direction
      if (dx !== 0 || dy !== 0) {
        moveWorld(dx, dy);
      }
    }, 16); // ~60fps
  }
  
  function stopKeyboardControls() {
    keyboardControlsActive = false;
    if (keyboardInterval !== null) {
      clearInterval(keyboardInterval);
      keyboardInterval = null;
    }
  }
  
  // Initialize PixiJS when component mounts
  onMount(() => {
    if (gameContainer) {
      try {
        console.log("Initializing PixiJS in game container");
        
        // Check if there's an existing app and destroy it if needed
        const existingApp = get(pixiApp);
        if (existingApp) {
          console.log("Destroying existing PixiJS app before creating a new one");
          existingApp.destroy(true, { children: true, texture: true, baseTexture: true });
          pixiApp.set(null);
        }
        
        // Initialize new app with game world
        const app = initPixiApp(gameContainer);
        
        // Add player character
        console.log("Adding player character");
        import('../../lib/pixiManager').then(module => {
          if (module.addPlayerCharacter) {
            module.addPlayerCharacter();
          }
        });
        
        // Set initial container dimensions to be fullscreen
        gameContainer.style.width = typeof width === 'number' ? `${width}px` : width;
        gameContainer.style.height = typeof height === 'number' ? `${height}px` : height;
        
        // Add keyboard event listeners for WASD controls
        console.log("Setting up keyboard controls");
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        
        // Notify parent that the game is ready
        console.log("PixiGame component initialized successfully, dispatching ready event");
        dispatch('ready', { app });
      } catch (error) {
        console.error("Error initializing PixiJS:", error);
      }
    } else {
      console.error("Game container reference not available");
    }
    
    return () => {
      console.log("PixiGame component cleanup from onMount return");
      stopKeyboardControls();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      const app = get(pixiApp);
      if (app) {
        console.log("Destroying PixiJS app in onMount cleanup");
        app.destroy(true, { children: true, texture: true, baseTexture: true });
        pixiApp.set(null);
      }
    };
  });
  
  // Clean up when component is destroyed
  onDestroy(() => {
    console.log("PixiGame component onDestroy triggered");
    
    // Clean up keyboard controls
    stopKeyboardControls();
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    
    const app = get(pixiApp);
    if (app) {
      try {
        // Clean up resources using our custom method first
        if ((app as any).cleanupResources) {
          console.log("Calling cleanupResources before destroying app");
          (app as any).cleanupResources();
        }
        
        console.log("Destroying PixiJS app in onDestroy");
        app.destroy(true, { 
          children: true, 
          texture: true, 
          baseTexture: true,
          removeView: true
        });
        
        // Check if we need to remove the canvas manually
        if (gameContainer) {
          const canvas = gameContainer.querySelector('canvas');
          if (canvas) {
            console.log("Manually removing canvas from container");
            gameContainer.removeChild(canvas);
          }
        }
        
        // Reset the store
        pixiApp.set(null);
        
      } catch (error) {
        console.error("Error during PixiJS app cleanup:", error);
      }
    }
  });
  
  // Handle building type selection
  export function selectBuildingType(type: string) {
    selectedBuildingType = type;
    isPlacementMode = true;
    setPlacementMode(true, type);
    
    console.log(`Selected building type: ${type}`);
  }
  
  // Toggle placement mode
  export function togglePlacementMode(enabled: boolean) {
    isPlacementMode = enabled;
    
    if (!enabled) {
      selectedBuildingType = null;
    }
    
    setPlacementMode(isPlacementMode, selectedBuildingType || undefined);
  }
  
  // Reset the view (center and reset zoom)
  export function resetView() {
    console.log("Resetting game view");
    import('../../lib/pixiManager').then(module => {
      module.resetView();
    });
  }
</script>

<div 
  class="pixi-game-container"
  bind:this={gameContainer}
  style:width={typeof width === 'number' ? `${width}px` : width}
  style:height={typeof height === 'number' ? `${height}px` : height}
/>

<style>
  .pixi-game-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
    background-color: #0f0f1e;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  }
</style>