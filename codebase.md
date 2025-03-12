# .gitignore

```
node_modules/
.svelte-kit/
build/
.env
.env.*
!.env.example
vite.config.js.timestamp-*
vite.config.ts.timestamp-*
target/
Cargo.lock
pkg/
wasm-pack.log
dist/
.DS_Store

```

# frontend/.gitignore

```
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

```

# frontend/.vscode/extensions.json

```json
{
  "recommendations": ["svelte.svelte-vscode"]
}

```

# frontend/index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + Svelte + TS</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>

```

# frontend/package.json

```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-check --tsconfig ./tsconfig.app.json && tsc -p tsconfig.node.json"
  },
  "devDependencies": {
    "@sveltejs/adapter-auto": "^4.0.0",
    "@sveltejs/kit": "^2.19.0",
    "@sveltejs/vite-plugin-svelte": "^5.0.3",
    "@tsconfig/svelte": "^5.0.4",
    "svelte": "^5.20.2",
    "svelte-check": "^4.1.5",
    "svelte-preprocess": "^6.0.3",
    "typescript": "~5.7.2",
    "vite": "^6.2.0",
    "vite-plugin-wasm": "^3.4.1"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.49.1"
  }
}

```

# frontend/public/vite.svg

This is a file of the type: SVG Image

# frontend/README.md

```md
# Svelte + TS + Vite

This template should help get you started developing with Svelte and TypeScript in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode).

## Need an official Svelte framework?

Check out [SvelteKit](https://github.com/sveltejs/kit#readme), which is also powered by Vite. Deploy anywhere with its serverless-first approach and adapt to various platforms, with out of the box support for TypeScript, SCSS, and Less, and easily-added support for mdsvex, GraphQL, PostCSS, Tailwind CSS, and more.

## Technical considerations

**Why use this over SvelteKit?**

- It brings its own routing solution which might not be preferable for some users.
- It is first and foremost a framework that just happens to use Vite under the hood, not a Vite app.

This template contains as little as possible to get started with Vite + TypeScript + Svelte, while taking into account the developer experience with regards to HMR and intellisense. It demonstrates capabilities on par with the other `create-vite` templates and is a good starting point for beginners dipping their toes into a Vite + Svelte project.

Should you later need the extended capabilities and extensibility provided by SvelteKit, the template has been structured similarly to SvelteKit so that it is easy to migrate.

**Why `global.d.ts` instead of `compilerOptions.types` inside `jsconfig.json` or `tsconfig.json`?**

Setting `compilerOptions.types` shuts out all other types not explicitly listed in the configuration. Using triple-slash references keeps the default TypeScript setting of accepting type information from the entire workspace, while also adding `svelte` and `vite/client` type information.

**Why include `.vscode/extensions.json`?**

Other templates indirectly recommend extensions via the README, but this file allows VS Code to prompt the user to install the recommended extension upon opening the project.

**Why enable `allowJs` in the TS template?**

While `allowJs: false` would indeed prevent the use of `.js` files in the project, it does not prevent the use of JavaScript syntax in `.svelte` files. In addition, it would force `checkJs: false`, bringing the worst of both worlds: not being able to guarantee the entire codebase is TypeScript, and also having worse typechecking for the existing JavaScript. In addition, there are valid use cases in which a mixed codebase may be relevant.

**Why is HMR not preserving my local component state?**

HMR state preservation comes with a number of gotchas! It has been disabled by default in both `svelte-hmr` and `@sveltejs/vite-plugin-svelte` due to its often surprising behavior. You can read the details [here](https://github.com/rixo/svelte-hmr#svelte-hmr).

If you have state that's important to retain within a component, consider creating an external store which would not be replaced by HMR.

\`\`\`ts
// store.ts
// An extremely simple external store
import { writable } from 'svelte/store'
export default writable(0)
\`\`\`

```

# frontend/src/app.css

```css
:root {
  font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  font-weight: 500;
  color: #646cff;
  text-decoration: inherit;
}
a:hover {
  color: #535bf2;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

h1 {
  font-size: 3.2em;
  line-height: 1.1;
}

.card {
  padding: 2em;
}

#app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.25s;
}
button:hover {
  border-color: #646cff;
}
button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}

@media (prefers-color-scheme: light) {
  :root {
    color: #213547;
    background-color: #ffffff;
  }
  a:hover {
    color: #747bff;
  }
  button {
    background-color: #f9f9f9;
  }
}

```

# frontend/src/App.svelte

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { gameState, startGameLoop } from '$lib/gameLoop';
  import { initWasm } from '$lib/wasm';
  import GameCanvas from './components/world/GameCanvas.svelte';
  import BuildingControlPanel from './components/buildings/BuildingControlPanel.svelte';
  import ResourceDisplay from './components/ui/ResourceDisplay.svelte';
  
  let gameCanvas;
  let gameLoopStop;
  
  onMount(async () => {
    // Initialize WASM (commented out for now until we integrate it)
    try {
      // await initWasm();
      console.log('WASM integration will be added later');
    } catch (error) {
      console.error('Failed to initialize WASM:', error);
    }
    
    // Start game loop
    gameLoopStop = startGameLoop();
    
    // Clean up on component destroy
    return () => {
      if (gameLoopStop) gameLoopStop();
    };
  });
  
  // Handle pause toggle
  function togglePause() {
    gameState.update(state => ({
      ...state,
      isPaused: !state.isPaused
    }));
  }
</script>

<main>
  <div class="game-container">
    <header>
      <h1>FrankForge</h1>
      <div class="controls">
        <button on:click={togglePause}>
          {$gameState.isPaused ? 'Resume' : 'Pause'}
        </button>
      </div>
    </header>
    
    <div class="game-content">
      <div class="sidebar">
        <BuildingControlPanel {gameCanvas} />
        <ResourceDisplay />
      </div>
      
      <div class="canvas-container">
        <GameCanvas bind:this={gameCanvas} />
      </div>
    </div>
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: #1a1a2e;
    color: white;
  }
  
  .game-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }
  
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #0f0f1e;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid #2a2a3e;
  }
  
  h1 {
    margin: 0;
    color: #3498db;
    font-size: 1.5rem;
  }
  
  .controls button {
    background-color: #2c3e50;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .controls button:hover {
    background-color: #3d566e;
  }
  
  .game-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  
  .sidebar {
    width: 300px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background-color: #16213e;
    overflow-y: auto;
  }
  
  .canvas-container {
    flex: 1;
    overflow: hidden;
  }
</style>
```

# frontend/src/assets/svelte.svg

This is a file of the type: SVG Image

# frontend/src/components/buildings/BasicBuilding.svelte

```svelte
<script lang="ts">
  export let type: string = 'generic';
  export let x: number = 0;
  export let y: number = 0;
  export let size: number = 32;
  export let selected: boolean = false;
  
  // Building colors based on type
  const colors = {
    extractor: '#3498db',
    reactor: '#e74c3c',
    powerPlant: '#2ecc71',
    default: '#bdc3c7'
  };
  
  function getColor() {
    return colors[type] || colors.default;
  }
</script>

<!-- This component will be used for rendering buildings on the canvas -->
<div 
  class="building"
  class:selected
  style="
    left: {x - size/2}px;
    top: {y - size/2}px;
    width: {size}px;
    height: {size}px;
    background-color: {getColor()};
  "
>
</div>

<style>
  .building {
    position: absolute;
    border-radius: 4px;
  }
  
  .selected {
    outline: 2px solid white;
  }
</style>

```

# frontend/src/components/buildings/BuildingControlPanel.svelte

```svelte
<script lang="ts">
    import { gameState } from '$lib/gameLoop';
    
    // GameCanvas reference passed from parent
    export let gameCanvas;
    
    // Available building types
    const buildingTypes = [
      { id: 'extractor', name: 'Extractor', description: 'Extracts resources from the environment', cost: { energy: 100 } },
      { id: 'reactor', name: 'Chemical Reactor', description: 'Combines chemicals to create reactions', cost: { energy: 200, methane: 50 } },
      { id: 'powerPlant', name: 'Power Plant', description: 'Generates energy from fuel', cost: { energy: 150 } }
    ];
    
    // Resources required to build
    function canBuild(buildingType) {
      const building = buildingTypes.find(b => b.id === buildingType);
      if (!building) return false;
      
      // Check if we have enough resources
      for (const [resource, amount] of Object.entries(building.cost)) {
        if ($gameState.resources[resource] < amount) {
          return false;
        }
      }
      
      return true;
    }
    
    // Start building placement
    function startPlacement(buildingType) {
      // Check if we can afford it
      if (!canBuild(buildingType)) return;
      
      // Start placement mode in the game canvas
      gameCanvas.startPlacement(buildingType);
    }
    
    // Function to get color for building icon
    function getBuildingColor(buildingType) {
      switch (buildingType) {
        case 'extractor': return '#3498db';
        case 'reactor': return '#e74c3c';
        case 'powerPlant': return '#2ecc71';
        default: return '#bdc3c7';
      }
    }
  </script>
  
  <div class="control-panel">
    <h2>Buildings</h2>
    
    <div class="building-list">
      {#each buildingTypes as building}
        <button 
          class="building-button" 
          class:disabled={!canBuild(building.id)}
          on:click={() => startPlacement(building.id)}
        >
          <div class="building-icon" style="background-color: {getBuildingColor(building.id)}"></div>
          <div class="building-info">
            <span class="building-name">{building.name}</span>
            <span class="building-desc">{building.description}</span>
            <div class="building-cost">
              {#each Object.entries(building.cost) as [resource, amount]}
                <span class="resource-cost {$gameState.resources[resource] < amount ? 'insufficient' : ''}">
                  {resource}: {amount}
                </span>
              {/each}
            </div>
          </div>
        </button>
      {/each}
    </div>
  </div>
  
  <style>
    .control-panel {
      background-color: #2c3e50;
      color: white;
      border-radius: 4px;
      padding: 16px;
      width: 100%;
    }
    
    h2 {
      margin-top: 0;
      border-bottom: 1px solid #34495e;
      padding-bottom: 8px;
    }
    
    .building-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .building-button {
      display: flex;
      align-items: center;
      gap: 12px;
      background-color: #34495e;
      border: none;
      padding: 12px;
      border-radius: 4px;
      color: white;
      text-align: left;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .building-button:hover:not(.disabled) {
      background-color: #3d566e;
    }
    
    .building-button.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .building-icon {
      width: 32px;
      height: 32px;
      border-radius: 4px;
      flex-shrink: 0;
    }
    
    .building-info {
      display: flex;
      flex-direction: column;
    }
    
    .building-name {
      font-weight: bold;
    }
    
    .building-desc {
      font-size: 12px;
      color: #bdc3c7;
      margin-bottom: 4px;
    }
    
    .building-cost {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 11px;
    }
    
    .resource-cost {
      background-color: rgba(0, 0, 0, 0.2);
      padding: 2px 4px;
      border-radius: 2px;
    }
    
    .resource-cost.insufficient {
      color: #e74c3c;
    }
  </style>
```

# frontend/src/components/buildings/BuildingControlPanel.svelte.bak

```bak
<!-- src/components/BuildingControlPanel.svelte -->
<script lang="ts">
    import { gameState } from '$lib/gameLoop';
    
    // Import reference to GameCanvas
    export let gameCanvas: any;
    
    // Available building types
    const buildingTypes = [
      { id: 'extractor', name: 'Extractor', description: 'Extracts resources from the environment', cost: { energy: 100 } },
      { id: 'reactor', name: 'Chemical Reactor', description: 'Combines chemicals to create reactions', cost: { energy: 200, methane: 50 } },
      { id: 'separator', name: 'Separator', description: 'Separates mixed compounds', cost: { energy: 150 } },
      { id: 'storage', name: 'Storage Tank', description: 'Stores resources', cost: { energy: 50 } },
      { id: 'powerPlant', name: 'Power Plant', description: 'Generates energy from fuel', cost: { energy: 300 } },
      { id: 'pipe', name: 'Pipeline', description: 'Connects buildings to transfer resources', cost: { energy: 10 } }
    ];
    
    // Resources required to build
    function canBuild(buildingType: string): boolean {
      const building = buildingTypes.find(b => b.id === buildingType);
      if (!building) return false;
      
      // Check if we have enough resources
      for (const [resource, amount] of Object.entries(building.cost)) {
        if ($gameState.resources[resource] < amount) {
          return false;
        }
      }
      
      return true;
    }
    
    // Start building placement
    function startPlacement(buildingType: string) {
      // Check if we can afford it
      if (!canBuild(buildingType)) return;
      
      // Start placement mode in the game canvas
      gameCanvas.startPlacement(buildingType);
    }
    
    // Function to get color for building icon
    function getBuildingColor(buildingType: string): string {
      switch (buildingType) {
        case 'extractor': return '#3498db';
        case 'reactor': return '#e74c3c';
        case 'separator': return '#9b59b6';
        case 'storage': return '#f1c40f';
        case 'powerPlant': return '#2ecc71';
        case 'pipe': return '#95a5a6';
        default: return '#bdc3c7';
      }
    }
  </script>
  
  <div class="control-panel">
    <h2>Buildings</h2>
    
    <div class="building-list">
      {#each buildingTypes as building}
        <button 
          class="building-button" 
          class:disabled={!canBuild(building.id)}
          on:click={() => startPlacement(building.id)}
        >
          <div class="building-icon" style="background-color: {getBuildingColor(building.id)}"></div>
          <div class="building-info">
            <span class="building-name">{building.name}</span>
            <span class="building-desc">{building.description}</span>
            <div class="building-cost">
              {#each Object.entries(building.cost) as [resource, amount]}
                <span class="resource-cost {$gameState.resources[resource] < amount ? 'insufficient' : ''}">
                  {resource}: {amount}
                </span>
              {/each}
            </div>
          </div>
        </button>
      {/each}
    </div>
  </div>
  
  <style>
    .control-panel {
      background-color: #2c3e50;
      color: white;
      border-radius: 4px;
      padding: 16px;
      width: 300px;
    }
    
    h2 {
      margin-top: 0;
      border-bottom: 1px solid #34495e;
      padding-bottom: 8px;
    }
    
    .building-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .building-button {
      display: flex;
      align-items: center;
      gap: 12px;
      background-color: #34495e;
      border: none;
      padding: 12px;
      border-radius: 4px;
      color: white;
      text-align: left;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .building-button:hover:not(.disabled) {
      background-color: #3d566e;
    }
    
    .building-button.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .building-icon {
      width: 32px;
      height: 32px;
      border-radius: 4px;
      flex-shrink: 0;
    }
    
    .building-info {
      display: flex;
      flex-direction: column;
    }
    
    .building-name {
      font-weight: bold;
    }
    
    .building-desc {
      font-size: 12px;
      color: #bdc3c7;
      margin-bottom: 4px;
    }
    
    .building-cost {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 11px;
    }
    
    .resource-cost {
      background-color: rgba(0, 0, 0, 0.2);
      padding: 2px 4px;
      border-radius: 2px;
    }
    
    .resource-cost.insufficient {
      color: #e74c3c;
    }
  </style>
```

# frontend/src/components/ui/BuildingControlPanel.svelte

```svelte
<script lang="ts">
  import { gameState } from '../../stores/gameState';
  
  // Available building types
  const buildingTypes = [
    { id: 'extractor', name: 'Extractor', description: 'Extracts resources from the environment', cost: { energy: 100 } },
    { id: 'reactor', name: 'Chemical Reactor', description: 'Combines chemicals to create reactions', cost: { energy: 200 } },
    { id: 'powerPlant', name: 'Power Plant', description: 'Generates energy from fuel', cost: { energy: 300 } }
  ];
  
  // Start building placement
  function startPlacement(buildingType: string) {
    console.log('Starting placement of:', buildingType);
    // Building placement logic will go here
  }
</script>

<div class="control-panel">
  <h2>Buildings</h2>
  
  <div class="building-list">
    {#each buildingTypes as building}
      <button 
        class="building-button"
        on:click={() => startPlacement(building.id)}
      >
        <div class="building-info">
          <span class="building-name">{building.name}</span>
          <span class="building-desc">{building.description}</span>
        </div>
      </button>
    {/each}
  </div>
</div>

<style>
  .control-panel {
    background-color: #2c3e50;
    color: white;
    border-radius: 4px;
    padding: 16px;
    width: 300px;
  }
  
  h2 {
    margin-top: 0;
    border-bottom: 1px solid #34495e;
    padding-bottom: 8px;
  }
  
  .building-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .building-button {
    display: flex;
    align-items: center;
    gap: 12px;
    background-color: #34495e;
    border: none;
    padding: 12px;
    border-radius: 4px;
    color: white;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .building-button:hover {
    background-color: #3d566e;
  }
  
  .building-info {
    display: flex;
    flex-direction: column;
  }
  
  .building-name {
    font-weight: bold;
  }
  
  .building-desc {
    font-size: 12px;
    color: #bdc3c7;
  }
</style>

```

# frontend/src/components/ui/ResourceDisplay.svelte

```svelte
<script lang="ts">
    import { gameState } from '$lib/gameLoop';
    
    // Resource icons/colors
    const resourceColors = {
      methane: '#27ae60',
      oxygen: '#3498db',
      water: '#00bcd4',
      carbon_dioxide: '#95a5a6',
      hydrogen: '#f1c40f',
      energy: '#e67e22',
      sulfur: '#f39c12'
    };
    
    // Format numbers with suffixes (K, M, etc.)
    function formatNumber(num) {
      if (num >= 1_000_000) {
        return (num / 1_000_000).toFixed(1) + 'M';
      } else if (num >= 1_000) {
        return (num / 1_000).toFixed(1) + 'K';
      } else {
        return num.toFixed(0);
      }
    }
    
    // Calculate resource flow rates (simulated for now)
    function getFlowRate(resource) {
      // This would actually calculate based on buildings
      // For now, return a fixed value for demonstration
      switch (resource) {
        case 'methane':
          return $gameState.buildings.filter(b => b.type === 'extractor').length * 2;
        case 'energy':
          return $gameState.buildings.filter(b => b.type === 'powerPlant').length * 5 - 
                 $gameState.buildings.length * 1; // Each building consumes 1 energy
        default:
          return 0;
      }
    }
  </script>
  
  <div class="resource-panel">
    <h2>Resources</h2>
    
    <div class="resource-list">
      {#each Object.entries($gameState.resources) as [resource, amount]}
        <div class="resource-item">
          <div class="resource-icon" style="background-color: {resourceColors[resource] || '#bdc3c7'}"></div>
          <div class="resource-details">
            <div class="resource-name">{resource}</div>
            <div class="resource-amount">{formatNumber(amount)}</div>
          </div>
          <div class="resource-flow {getFlowRate(resource) > 0 ? 'positive' : getFlowRate(resource) < 0 ? 'negative' : ''}">
            {getFlowRate(resource) > 0 ? '+' : ''}{formatNumber(getFlowRate(resource))}/s
          </div>
        </div>
      {/each}
    </div>
    
    <div class="energy-display">
      <h3>Energy</h3>
      <div class="energy-meter">
        <div class="energy-fill" style="width: {Math.min(100, $gameState.resources.energy / 10)}%"></div>
      </div>
      <div class="energy-stats">
        <div>Current: {formatNumber($gameState.resources.energy)} J</div>
        <div>Production: +{formatNumber(getFlowRate('energy') > 0 ? getFlowRate('energy') : 0)} J/s</div>
        <div>Consumption: -{formatNumber(getFlowRate('energy') < 0 ? -getFlowRate('energy') : 0)} J/s</div>
      </div>
    </div>
  </div>
  
  <style>
    .resource-panel {
      background-color: #2c3e50;
      border-radius: 4px;
      padding: 16px;
      color: white;
      width: 100%;
    }
    
    h2, h3 {
      margin-top: 0;
      border-bottom: 1px solid #34495e;
      padding-bottom: 8px;
    }
    
    .resource-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }
    
    .resource-item {
      display: flex;
      align-items: center;
      background-color: #34495e;
      padding: 8px 12px;
      border-radius: 4px;
    }
    
    .resource-icon {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      margin-right: 12px;
    }
    
    .resource-details {
      flex: 1;
    }
    
    .resource-name {
      font-size: 14px;
      text-transform: capitalize;
    }
    
    .resource-amount {
      font-weight: bold;
      font-size: 16px;
    }
    
    .resource-flow {
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 2px;
      background-color: rgba(0, 0, 0, 0.2);
    }
    
    .resource-flow.positive {
      color: #2ecc71;
    }
    
    .resource-flow.negative {
      color: #e74c3c;
    }
    
    .energy-meter {
      height: 12px;
      background-color: #34495e;
      border-radius: 6px;
      margin: 8px 0;
      overflow: hidden;
    }
    
    .energy-fill {
      height: 100%;
      background: linear-gradient(90deg, #f39c12, #e67e22);
      border-radius: 6px;
    }
    
    .energy-stats {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #bdc3c7;
    }
  </style>
```

# frontend/src/components/ui/ResourceDisplay.svelte.bak

```bak
<!-- src/components/ResourceDisplay.svelte -->
<script lang="ts">
    import { gameState } from '$lib/gameLoop';
    
    // Resource icons/colors
    const resourceColors = {
      methane: '#27ae60',
      oxygen: '#3498db',
      water: '#00bcd4',
      carbon_dioxide: '#95a5a6',
      hydrogen: '#f1c40f',
      energy: '#e67e22',
      sulfur: '#f39c12'
    };
    
    // Format numbers with suffixes (K, M, etc.)
    function formatNumber(num: number): string {
      if (num >= 1_000_000) {
        return (num / 1_000_000).toFixed(1) + 'M';
      } else if (num >= 1_000) {
        return (num / 1_000).toFixed(1) + 'K';
      } else {
        return num.toFixed(1);
      }
    }
    
    // Calculate resource flow rates (placeholder)
    function getFlowRate(resource: string): number {
      // This would actually calculate based on buildings
      // For now, just returning a random number for demonstration
      return (Math.random() * 2 - 1) * 10;
    }
  </script>
  
  <div class="resource-panel">
    <h2>Resources</h2>
    
    <div class="resource-list">
      {#each Object.entries($gameState.resources) as [resource, amount]}
        <div class="resource-item">
          <div class="resource-icon" style="background-color: {resourceColors[resource] || '#bdc3c7'}"></div>
          <div class="resource-details">
            <div class="resource-name">{resource}</div>
            <div class="resource-amount">{formatNumber(amount)}</div>
          </div>
          <div class="resource-flow {getFlowRate(resource) > 0 ? 'positive' : 'negative'}">
            {getFlowRate(resource) > 0 ? '+' : ''}{formatNumber(getFlowRate(resource))}/s
          </div>
        </div>
      {/each}
    </div>
    
    <div class="energy-display">
      <h3>Energy</h3>
      <div class="energy-meter">
        <div class="energy-fill" style="width: 75%"></div>
      </div>
      <div class="energy-stats">
        <div>Current: {formatNumber($gameState.energy_available || 0)} J</div>
        <div>Production: +{formatNumber(120)} J/s</div>
        <div>Consumption: -{formatNumber(80)} J/s</div>
      </div>
    </div>
  </div>
  
  <style>
    .resource-panel {
      background-color: #2c3e50;
      border-radius: 4px;
      padding: 16px;
      color: white;
    }
    
    h2, h3 {
      margin-top: 0;
      border-bottom: 1px solid #34495e;
      padding-bottom: 8px;
    }
    
    .resource-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }
    
    .resource-item {
      display: flex;
      align-items: center;
      background-color: #34495e;
      padding: 8px 12px;
      border-radius: 4px;
    }
    
    .resource-icon {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      margin-right: 12px;
    }
    
    .resource-details {
      flex: 1;
    }
    
    .resource-name {
      font-size: 14px;
      text-transform: capitalize;
    }
    
    .resource-amount {
      font-weight: bold;
      font-size: 16px;
    }
    
    .resource-flow {
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 2px;
      background-color: rgba(0, 0, 0, 0.2);
    }
    
    .resource-flow.positive {
      color: #2ecc71;
    }
    
    .resource-flow.negative {
      color: #e74c3c;
    }
    
    .energy-meter {
      height: 12px;
      background-color: #34495e;
      border-radius: 6px;
      margin: 8px 0;
      overflow: hidden;
    }
    
    .energy-fill {
      height: 100%;
      background: linear-gradient(90deg, #f39c12, #e67e22);
      border-radius: 6px;
    }
    
    .energy-stats {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #bdc3c7;
    }
  </style>
```

# frontend/src/components/ui/SaveLoadPanel.svelte

```svelte
<!-- src/components/SaveLoadPanel.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { saveGame, loadGame, listSaves, deleteSave } from '../../lib/supabase';
    import { gameState } from '../../lib/gameLoop';
    
    let saves = [];
    let isLoading = true;
    let saveName = 'Game 1';
    let saveStatus = '';
    let showConfirmDelete = false;
    let saveToDelete = null;
    
    onMount(async () => {
      await refreshSaves();
    });
    
    async function refreshSaves() {
      isLoading = true;
      const { data, error } = await listSaves();
      
      if (error) {
        console.error('Error loading saves:', error);
      } else {
        saves = data || [];
      }
      
      isLoading = false;
    }
    
    async function handleSave() {
      saveStatus = 'Saving...';
      
      const { error } = await saveGame(saveName, $gameState);
      
      if (error) {
        saveStatus = `Error: ${error.message}`;
        console.error('Error saving game:', error);
      } else {
        saveStatus = 'Game saved successfully!';
        await refreshSaves();
        
        // Clear status after 3 seconds
        setTimeout(() => {
          saveStatus = '';
        }, 3000);
      }
    }
    
    async function handleLoad(saveId) {
      isLoading = true;
      
      const { data, error } = await loadGame(saveId);
      
      if (error) {
        console.error('Error loading game:', error);
      } else if (data) {
        // Update game state with loaded data
        gameState.set(data.state_data);
      }
      
      isLoading = false;
    }
    
    function confirmDelete(saveId) {
      saveToDelete = saveId;
      showConfirmDelete = true;
    }
    
    async function handleDelete() {
      if (!saveToDelete) return;
      
      const { error } = await deleteSave(saveToDelete);
      
      if (error) {
        console.error('Error deleting save:', error);
      } else {
        await refreshSaves();
      }
      
      showConfirmDelete = false;
      saveToDelete = null;
    }
    
    function formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString();
    }
  </script>
  
  <div class="save-panel">
    <h2>Save/Load Game</h2>
    
    <div class="save-form">
      <div class="input-group">
        <input type="text" bind:value={saveName} placeholder="Save name">
        <button on:click={handleSave}>Save Game</button>
      </div>
      
      {#if saveStatus}
        <div class="status-message">{saveStatus}</div>
      {/if}
    </div>
    
    <div class="saves-list">
      <h3>Saved Games</h3>
      
      {#if isLoading}
        <div class="loading">Loading saves...</div>
      {:else if saves.length === 0}
        <div class="no-saves">No saved games found</div>
      {:else}
        {#each saves as save}
          <div class="save-item">
            <div class="save-info">
              <div class="save-name">{save.name}</div>
              <div class="save-date">
                Last saved: {formatDate(save.updated_at)}
              </div>
            </div>
            
            <div class="save-actions">
              <button class="action-button load" on:click={() => handleLoad(save.id)}>
                Load
              </button>
              <button class="action-button delete" on:click={() => confirmDelete(save.id)}>
                Delete
              </button>
            </div>
          </div>
        {/each}
      {/if}
    </div>
    
    {#if showConfirmDelete}
      <div class="modal-overlay">
        <div class="modal">
          <h3>Confirm Delete</h3>
          <p>Are you sure you want to delete this save?</p>
          <div class="modal-actions">
            <button class="cancel" on:click={() => showConfirmDelete = false}>Cancel</button>
            <button class="delete" on:click={handleDelete}>Delete</button>
          </div>
        </div>
      </div>
    {/if}
  </div>
  
  <style>
    .save-panel {
      background-color: #2c3e50;
      border-radius: 4px;
      padding: 16px;
      color: white;
      position: relative;
    }
    
    h2, h3 {
      margin-top: 0;
      border-bottom: 1px solid #34495e;
      padding-bottom: 8px;
    }
    
    .save-form {
      margin-bottom: 16px;
    }
    
    .input-group {
      display: flex;
      gap: 8px;
    }
    
    input {
      flex: 1;
      padding: 8px 12px;
      border-radius: 4px;
      border: none;
      background-color: #34495e;
      color: white;
    }
    
    button {
      background-color: #3498db;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    button:hover {
      background-color: #2980b9;
    }
    
    .status-message {
      margin-top: 8px;
      padding: 4px 8px;
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
      font-size: 14px;
    }
    
    .saves-list {
      max-height: 300px;
      overflow-y: auto;
    }
    
    .save-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #34495e;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    
    .save-name {
      font-weight: bold;
    }
    
    .save-date {
      font-size: 12px;
      color: #bdc3c7;
    }
    
    .save-actions {
      display: flex;
      gap: 8px;
    }
    
    .action-button {
      font-size: 12px;
      padding: 4px 8px;
    }
    
    .action-button.load {
      background-color: #2ecc71;
    }
    
    .action-button.load:hover {
      background-color: #27ae60;
    }
    
    .action-button.delete {
      background-color: #e74c3c;
    }
    
    .action-button.delete:hover {
      background-color: #c0392b;
    }
    
    .loading, .no-saves {
      padding: 16px;
      text-align: center;
      color: #bdc3c7;
    }
    
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 100;
    }
    
    .modal {
      background-color: #2c3e50;
      border-radius: 4px;
      padding: 24px;
      width: 300px;
    }
    
    .modal h3 {
      margin-top: 0;
      color: #e74c3c;
    }
    
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }
    
    .modal-actions .cancel {
      background-color: #7f8c8d;
    }
    
    .modal-actions .delete {
      background-color: #e74c3c;
    }
  </style>
```

# frontend/src/components/ui/SaveLoadPanel.svelte.bak

```bak
<!-- src/components/SaveLoadPanel.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { saveGame, loadGame, listSaves, deleteSave } from '../../lib/supabase';
    import { gameState } from '$lib/gameLoop';
    
    let saves = [];
    let isLoading = true;
    let saveName = 'Game 1';
    let saveStatus = '';
    let showConfirmDelete = false;
    let saveToDelete = null;
    
    onMount(async () => {
      await refreshSaves();
    });
    
    async function refreshSaves() {
      isLoading = true;
      const { data, error } = await listSaves();
      
      if (error) {
        console.error('Error loading saves:', error);
      } else {
        saves = data || [];
      }
      
      isLoading = false;
    }
    
    async function handleSave() {
      saveStatus = 'Saving...';
      
      const { error } = await saveGame(saveName, $gameState);
      
      if (error) {
        saveStatus = `Error: ${error.message}`;
        console.error('Error saving game:', error);
      } else {
        saveStatus = 'Game saved successfully!';
        await refreshSaves();
        
        // Clear status after 3 seconds
        setTimeout(() => {
          saveStatus = '';
        }, 3000);
      }
    }
    
    async function handleLoad(saveId) {
      isLoading = true;
      
      const { data, error } = await loadGame(saveId);
      
      if (error) {
        console.error('Error loading game:', error);
      } else if (data) {
        // Update game state with loaded data
        gameState.set(data.state_data);
      }
      
      isLoading = false;
    }
    
    function confirmDelete(saveId) {
      saveToDelete = saveId;
      showConfirmDelete = true;
    }
    
    async function handleDelete() {
      if (!saveToDelete) return;
      
      const { error } = await deleteSave(saveToDelete);
      
      if (error) {
        console.error('Error deleting save:', error);
      } else {
        await refreshSaves();
      }
      
      showConfirmDelete = false;
      saveToDelete = null;
    }
    
    function formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString();
    }
  </script>
  
  <div class="save-panel">
    <h2>Save/Load Game</h2>
    
    <div class="save-form">
      <div class="input-group">
        <input type="text" bind:value={saveName} placeholder="Save name">
        <button on:click={handleSave}>Save Game</button>
      </div>
      
      {#if saveStatus}
        <div class="status-message">{saveStatus}</div>
      {/if}
    </div>
    
    <div class="saves-list">
      <h3>Saved Games</h3>
      
      {#if isLoading}
        <div class="loading">Loading saves...</div>
      {:else if saves.length === 0}
        <div class="no-saves">No saved games found</div>
      {:else}
        {#each saves as save}
          <div class="save-item">
            <div class="save-info">
              <div class="save-name">{save.name}</div>
              <div class="save-date">
                Last saved: {formatDate(save.updated_at)}
              </div>
            </div>
            
            <div class="save-actions">
              <button class="action-button load" on:click={() => handleLoad(save.id)}>
                Load
              </button>
              <button class="action-button delete" on:click={() => confirmDelete(save.id)}>
                Delete
              </button>
            </div>
          </div>
        {/each}
      {/if}
    </div>
    
    {#if showConfirmDelete}
      <div class="modal-overlay">
        <div class="modal">
          <h3>Confirm Delete</h3>
          <p>Are you sure you want to delete this save?</p>
          <div class="modal-actions">
            <button class="cancel" on:click={() => showConfirmDelete = false}>Cancel</button>
            <button class="delete" on:click={handleDelete}>Delete</button>
          </div>
        </div>
      </div>
    {/if}
  </div>
  
  <style>
    .save-panel {
      background-color: #2c3e50;
      border-radius: 4px;
      padding: 16px;
      color: white;
      position: relative;
    }
    
    h2, h3 {
      margin-top: 0;
      border-bottom: 1px solid #34495e;
      padding-bottom: 8px;
    }
    
    .save-form {
      margin-bottom: 16px;
    }
    
    .input-group {
      display: flex;
      gap: 8px;
    }
    
    input {
      flex: 1;
      padding: 8px 12px;
      border-radius: 4px;
      border: none;
      background-color: #34495e;
      color: white;
    }
    
    button {
      background-color: #3498db;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    button:hover {
      background-color: #2980b9;
    }
    
    .status-message {
      margin-top: 8px;
      padding: 4px 8px;
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
      font-size: 14px;
    }
    
    .saves-list {
      max-height: 300px;
      overflow-y: auto;
    }
    
    .save-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #34495e;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    
    .save-name {
      font-weight: bold;
    }
    
    .save-date {
      font-size: 12px;
      color: #bdc3c7;
    }
    
    .save-actions {
      display: flex;
      gap: 8px;
    }
    
    .action-button {
      font-size: 12px;
      padding: 4px 8px;
    }
    
    .action-button.load {
      background-color: #2ecc71;
    }
    
    .action-button.load:hover {
      background-color: #27ae60;
    }
    
    .action-button.delete {
      background-color: #e74c3c;
    }
    
    .action-button.delete:hover {
      background-color: #c0392b;
    }
    
    .loading, .no-saves {
      padding: 16px;
      text-align: center;
      color: #bdc3c7;
    }
    
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 100;
    }
    
    .modal {
      background-color: #2c3e50;
      border-radius: 4px;
      padding: 24px;
      width: 300px;
    }
    
    .modal h3 {
      margin-top: 0;
      color: #e74c3c;
    }
    
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }
    
    .modal-actions .cancel {
      background-color: #7f8c8d;
    }
    
    .modal-actions .delete {
      background-color: #e74c3c;
    }
  </style>
```

# frontend/src/components/world/GameCanvas.svelte

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { gameState } from '$lib/gameLoop';
  
  // Canvas properties
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let width = 800;
  let height = 600;
  
  // Camera controls
  let cameraX = 0;
  let cameraY = 0;
  const cameraSpeed = 10;
  
  // Grid properties
  const TILE_SIZE = 32;
  
  // Mouse state
  let mouseX = 0;
  let mouseY = 0;
  let isMouseDown = false;
  
  // Building placement
  let placementMode = false;
  let placementType = '';
  
  // Tile types
  const tileTypes = {
    ground: { color: '#394764' },
    resource: { color: '#3498db' },
    methane: { color: '#27ae60' },
    water: { color: '#00bcd4' }
  };
  
  // World grid - for now a simple array
  let worldGrid = [];
  const GRID_SIZE = 50; // 50x50 grid
  
  // Initialize the world grid
  function initializeWorld() {
    worldGrid = [];
    
    for (let y = 0; y < GRID_SIZE; y++) {
      let row = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        // Add some random resource patches
        if (Math.random() < 0.03) {
          if (Math.random() < 0.5) {
            row.push('methane');
          } else {
            row.push('water');
          }
        } else {
          row.push('ground');
        }
      }
      worldGrid.push(row);
    }
  }
  
  // Handle keyboard input for camera movement
  function handleKeyDown(event: KeyboardEvent) {
    // Only move camera if not typing in an input
    if (event.target instanceof HTMLInputElement) return;
    
    if (event.key === 'w' || event.key === 'ArrowUp') cameraY -= cameraSpeed;
    if (event.key === 's' || event.key === 'ArrowDown') cameraY += cameraSpeed;
    if (event.key === 'a' || event.key === 'ArrowLeft') cameraX -= cameraSpeed;
    if (event.key === 'd' || event.key === 'ArrowRight') cameraX += cameraSpeed;
    
    // Prevent scrolling the page
    if (['w', 's', 'a', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
    }
  }
  
  onMount(() => {
    // Initialize canvas
    ctx = canvas.getContext('2d');
    
    // Initialize world
    initializeWorld();
    
    // Add keyboard listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Start render loop
    const renderFrame = requestAnimationFrame(renderLoop);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(renderFrame);
    };
  });
  
  function renderLoop() {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);
    
    // Render world grid
    renderTiles();
    
    // Render buildings
    renderBuildings();
    
    // Render placement preview
    if (placementMode) {
      renderPlacementPreview();
    }
    
    // Continue the loop
    requestAnimationFrame(renderLoop);
  }
  
  function renderTiles() {
    // Calculate visible grid range
    const startX = Math.floor(cameraX / TILE_SIZE);
    const endX = startX + Math.ceil(width / TILE_SIZE) + 1;
    const startY = Math.floor(cameraY / TILE_SIZE);
    const endY = startY + Math.ceil(height / TILE_SIZE) + 1;
    
    // Render visible tiles
    for (let y = Math.max(0, startY); y < Math.min(worldGrid.length, endY); y++) {
      for (let x = Math.max(0, startX); x < Math.min(worldGrid[0].length, endX); x++) {
        const tileType = worldGrid[y][x];
        const screenX = Math.floor(x * TILE_SIZE - cameraX);
        const screenY = Math.floor(y * TILE_SIZE - cameraY);
        
        // Draw tile
        ctx.fillStyle = tileTypes[tileType].color;
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        
        // Draw grid lines
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      }
    }
  }
  
  function renderBuildings() {
    $gameState.buildings.forEach(building => {
      const screenX = Math.floor(building.position.x * TILE_SIZE - cameraX);
      const screenY = Math.floor(building.position.y * TILE_SIZE - cameraY);
      
      // Only render if on screen
      if (screenX > -TILE_SIZE * 2 && screenX < width &&
          screenY > -TILE_SIZE * 2 && screenY < height) {
        
        // Draw building based on type
        switch (building.type) {
          case 'extractor':
            drawExtractor(screenX, screenY);
            break;
          case 'reactor':
            drawReactor(screenX, screenY);
            break;
          case 'powerPlant':
            drawPowerPlant(screenX, screenY);
            break;
          default:
            // Default building shape
            ctx.fillStyle = '#bdc3c7';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        }
      }
    });
  }
  
  function drawExtractor(x, y) {
    // Blue circular extractor
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, TILE_SIZE/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner details
    ctx.fillStyle = '#2980b9';
    ctx.beginPath();
    ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, TILE_SIZE/4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  function drawReactor(x, y) {
    // Red square reactor
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    
    // Inner details (warning stripes)
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(x + TILE_SIZE/4, y + TILE_SIZE/4, TILE_SIZE/2, TILE_SIZE/2);
  }
  
  function drawPowerPlant(x, y) {
    // Green power plant (triangle shape)
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.moveTo(x + TILE_SIZE/2, y);
    ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE);
    ctx.lineTo(x, y + TILE_SIZE);
    ctx.closePath();
    ctx.fill();
  }
  
  function renderPlacementPreview() {
    // Get mouse grid position
    const gridX = Math.floor((mouseX + cameraX) / TILE_SIZE);
    const gridY = Math.floor((mouseY + cameraY) / TILE_SIZE);
    const screenX = gridX * TILE_SIZE - cameraX;
    const screenY = gridY * TILE_SIZE - cameraY;
    
    // Draw semi-transparent preview
    ctx.globalAlpha = 0.5;
    
    switch (placementType) {
      case 'extractor':
        drawExtractor(screenX, screenY);
        break;
      case 'reactor':
        drawReactor(screenX, screenY);
        break;
      case 'powerPlant':
        drawPowerPlant(screenX, screenY);
        break;
      default:
        ctx.fillStyle = '#bdc3c7';
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }
    
    ctx.globalAlpha = 1.0;
    
    // Draw grid highlight
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
  }
  
  function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
  }
  
  function handleMouseDown(event) {
    isMouseDown = true;
    
    if (placementMode) {
      const gridX = Math.floor((mouseX + cameraX) / TILE_SIZE);
      const gridY = Math.floor((mouseY + cameraY) / TILE_SIZE);
      
      // Check if within grid bounds
      if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
        // Check if we can place on this tile (not occupied)
        const canPlace = !$gameState.buildings.some(
          b => b.position.x === gridX && b.position.y === gridY
        );
        
        if (canPlace) {
          // Add new building to game state
          const newBuilding = {
            id: crypto.randomUUID(),
            type: placementType,
            position: { x: gridX, y: gridY },
            connections: []
          };
          
          gameState.update(state => {
            state.buildings = [...state.buildings, newBuilding];
            
            // Deduct resources (placeholder - will be implemented in next steps)
            // For now just decrease energy as a placeholder
            state.resources.energy -= 100;
            
            return state;
          });
        }
      }
      
      // Exit placement mode after placing
      placementMode = false;
    }
  }
  
  function handleMouseUp() {
    isMouseDown = false;
  }
  
  // Method to start building placement - will be called from BuildingControlPanel
  export function startPlacement(type) {
    placementMode = true;
    placementType = type;
  }
</script>

<div class="game-container">
  <canvas
    bind:this={canvas}
    {width}
    {height}
    on:mousemove={handleMouseMove}
    on:mousedown={handleMouseDown}
    on:mouseup={handleMouseUp}
  ></canvas>
</div>

<style>
  .game-container {
    position: relative;
    overflow: hidden;
    background-color: #1a1a2e;
  }
  
  canvas {
    display: block;
  }
</style>
```

# frontend/src/components/world/GameCanvas.svelte.bak

```bak
<!-- src/components/GameCanvas.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { gameState, startGameLoop } from '$lib/gameLoop';
  import type { Building } from '$lib/gameLoop';
  
  // Canvas properties
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let width = 800;
  let height = 600;
  
  // Camera controls
  let cameraX = 0;
  let cameraY = 0;
  let zoom = 1;
  
  // Mouse state
  let mouseX = 0;
  let mouseY = 0;
  let isDragging = false;
  let selectedBuilding: Building | null = null;
  
  // Building placement
  let placementMode = false;
  let placementType = '';
  
  onMount(() => {
    // Initialize canvas
    ctx = canvas.getContext('2d');
    
    // Start render loop
    const renderLoopCleanup = startRenderLoop();
    
    // Start game loop
    const gameLoopCleanup = startGameLoop();
    
    return () => {
      renderLoopCleanup();
      gameLoopCleanup();
    };
  });
  
  function startRenderLoop() {
    let animationFrame: number;
    
    const render = () => {
      // Clear canvas
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, width, height);
      
      // Apply camera transform
      ctx.save();
      ctx.translate(width/2, height/2);
      ctx.scale(zoom, zoom);
      ctx.translate(-cameraX, -cameraY);
      
      // Draw grid
      drawGrid();
      
      // Draw buildings
      $gameState.buildings.forEach(building => {
        drawBuilding(building);
      });
      
      // Draw connections between buildings
      drawConnections();
      
      // Draw placement preview if in placement mode
      if (placementMode) {
        drawPlacementPreview();
      }
      
      // Reset transform
      ctx.restore();
      
      // Draw UI elements that don't move with camera
      drawUI();
      
      // Request next frame
      animationFrame = requestAnimationFrame(render);
    };
    
    animationFrame = requestAnimationFrame(render);
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }
  
  function drawGrid() {
    const gridSize = 32;
    const gridExtent = 2000;
    
    ctx.strokeStyle = '#2a2a3e';
    ctx.lineWidth = 1;
    
    // Calculate visible grid range
    const startX = Math.floor((cameraX - width/(2*zoom)) / gridSize) * gridSize;
    const endX = Math.ceil((cameraX + width/(2*zoom)) / gridSize) * gridSize;
    const startY = Math.floor((cameraY - height/(2*zoom)) / gridSize) * gridSize;
    const endY = Math.ceil((cameraY + height/(2*zoom)) / gridSize) * gridSize;
    
    // Draw vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  }
  
  function drawBuilding(building: Building) {
    const size = 32;
    const x = building.position.x;
    const y = building.position.y;
    
    // Draw different shapes based on building type
    ctx.fillStyle = getColorForBuildingType(building.type);
    
    switch (building.type) {
      case 'extractor':
        ctx.beginPath();
        ctx.arc(x, y, size/2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'reactor':
        ctx.fillRect(x - size/2, y - size/2, size, size);
        break;
      case 'powerPlant':
        drawTriangle(x, y, size);
        break;
      default:
        ctx.fillRect(x - size/2, y - size/2, size, size);
    }
    
    // Draw selection indicator if selected
    if (selectedBuilding && selectedBuilding.id === building.id) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - size/2 - 4, y - size/2 - 4, size + 8, size + 8);
    }
  }
  
  function drawTriangle(x: number, y: number, size: number) {
    ctx.beginPath();
    ctx.moveTo(x, y - size/2);
    ctx.lineTo(x + size/2, y + size/2);
    ctx.lineTo(x - size/2, y + size/2);
    ctx.closePath();
    ctx.fill();
  }
  
  function getColorForBuildingType(type: string): string {
    switch (type) {
      case 'extractor': return '#3498db';
      case 'reactor': return '#e74c3c';
      case 'separator': return '#9b59b6';
      case 'storage': return '#f1c40f';
      case 'powerPlant': return '#2ecc71';
      case 'pipe': return '#95a5a6';
      default: return '#bdc3c7';
    }
  }
  
  function drawConnections() {
    ctx.strokeStyle = '#95a5a6';
    ctx.lineWidth = 2;
    
    $gameState.buildings.forEach(building => {
      building.connections.forEach(targetId => {
        const target = $gameState.buildings.find(b => b.id === targetId);
        if (target) {
          ctx.beginPath();
          ctx.moveTo(building.position.x, building.position.y);
          ctx.lineTo(target.position.x, target.position.y);
          ctx.stroke();
        }
      });
    });
  }
  
  function drawPlacementPreview() {
    // Get mouse world position
    const worldX = cameraX + (mouseX - width/2) / zoom;
    const worldY = cameraY + (mouseY - height/2) / zoom;
    
    // Snap to grid
    const gridSize = 32;
    const snappedX = Math.round(worldX / gridSize) * gridSize;
    const snappedY = Math.round(worldY / gridSize) * gridSize;
    
    // Draw preview
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = getColorForBuildingType(placementType);
    
    switch (placementType) {
      case 'extractor':
        ctx.beginPath();
        ctx.arc(snappedX, snappedY, gridSize/2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'reactor':
        ctx.fillRect(snappedX - gridSize/2, snappedY - gridSize/2, gridSize, gridSize);
        break;
      case 'powerPlant':
        drawTriangle(snappedX, snappedY, gridSize);
        break;
      default:
        ctx.fillRect(snappedX - gridSize/2, snappedY - gridSize/2, gridSize, gridSize);
    }
    
    ctx.globalAlpha = 1.0;
  }
  
  function drawUI() {
    // Draw resource info
    ctx.font = '16px monospace';
    ctx.fillStyle = '#ffffff';
    let y = 20;
    
    for (const [resource, amount] of Object.entries($gameState.resources)) {
      ctx.fillText(`${resource}: ${amount.toFixed(1)}`, 10, y);
      y += 20;
    }
    
    // Draw energy info
    ctx.fillText(`Energy: ${$gameState.tick} J`, 10, y + 20);
  }
  
  // Event handlers
  function handleMouseDown(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
    
    if (event.button === 0) { // Left click
      if (placementMode) {
        placeBuilding();
      } else {
        selectBuilding();
      }
    } else if (event.button === 2) { // Right click
      isDragging = true;
    }
  }
  
  function handleMouseMove(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
    
    if (isDragging) {
      cameraX -= event.movementX / zoom;
      cameraY -= event.movementY / zoom;
    }
  }
  
  function handleMouseUp() {
    isDragging = false;
  }
  
  function handleWheel(event: WheelEvent) {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    zoom = Math.max(0.1, Math.min(zoom * zoomFactor, 5));
  }
  
  function placeBuilding() {
    const worldX = cameraX + (mouseX - width/2) / zoom;
    const worldY = cameraY + (mouseY - height/2) / zoom;
    
    // Snap to grid
    const gridSize = 32;
    const snappedX = Math.round(worldX / gridSize) * gridSize;
    const snappedY = Math.round(worldY / gridSize) * gridSize;
    
    // Create new building
    const newBuilding: Building = {
      id: crypto.randomUUID(),
      type: placementType,
      position: { x: snappedX, y: snappedY },
      connections: []
    };
    
    // Add to game state
    gameState.update(state => {
      state.buildings.push(newBuilding);
      return state;
    });
    
    // Exit placement mode
    placementMode = false;
  }
  
  function selectBuilding() {
    const worldX = cameraX + (mouseX - width/2) / zoom;
    const worldY = cameraY + (mouseY - height/2) / zoom;
    
    // Find clicked building
    selectedBuilding = null;
    
    for (const building of $gameState.buildings) {
      const dx = building.position.x - worldX;
      const dy = building.position.y - worldY;
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      if (distance < 20) {
        selectedBuilding = building;
        break;
      }
    }
  }
  
  // Building placement controls
  export function startPlacement(type: string) {
    placementMode = true;
    placementType = type;
  }
  
  // Prevent context menu on right-click
  function handleContextMenu(event: MouseEvent) {
    event.preventDefault();
  }
</script>

<div class="game-container">
  <canvas
    bind:this={canvas}
    {width}
    {height}
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    on:wheel={handleWheel}
    on:contextmenu={handleContextMenu}
  ></canvas>
</div>

<style>
  .game-container {
    position: relative;
    overflow: hidden;
    background-color: #1a1a2e;
  }
  
  canvas {
    display: block;
  }
</style>
```

# frontend/src/lib/Counter.svelte

```svelte
<script lang="ts">
  let count: number = $state(0)
  const increment = () => {
    count += 1
  }
</script>

<button onclick={increment}>
  count is {count}
</button>

```

# frontend/src/lib/gameLoop.ts

```ts
// src/lib/gameLoop.ts
import { writable, derived } from 'svelte/store';
import type { Writable } from 'svelte/store';

// Game state interface
export interface GameState {
  tick: number;
  lastUpdate: number;
  isPaused: boolean;
  resources: Record<string, number>;
  buildings: Building[];
  temperature: number;
  // ... other state properties
}

export interface Building {
  id: string;
  type: string;
  position: { x: number; y: number };
  connections: string[];
  // Building-specific properties
}

// Initialize default game state
const createGameState = (): Writable<GameState> => {
  return writable({
    tick: 0,
    lastUpdate: Date.now(),
    isPaused: false,
    resources: {
      methane: 100,
      oxygen: 100,
      water: 100,
      energy: 1000,
      carbon_dioxide: 0,
      hydrogen: 0,
      // ... other resources
    },
    buildings: [],
    temperature: 293.15, // 20°C in Kelvin
  });
};

export const gameState = createGameState();

// Game loop
export function startGameLoop() {
  let animationFrame: number;
  let lastTimestamp = performance.now();
  
  const update = (timestamp: number) => {
    // Calculate delta time in seconds
    const deltaTime = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;
    
    // Update game state
    gameState.update(state => {
      if (state.isPaused) return state;
      
      // Update tick counter
      state.tick += 1;
      state.lastUpdate = Date.now();
      
      // Process building operations
      processBuildingOperations(state, deltaTime);
      
      // Process resource consumption and production
      processResources(state, deltaTime);
      
      // Return updated state
      return state;
    });
    
    // Request next frame
    animationFrame = requestAnimationFrame(update);
  };
  
  // Start the loop
  animationFrame = requestAnimationFrame(update);
  
  // Return a function to stop the loop
  return () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  };
}

// Process all building operations
function processBuildingOperations(state: GameState, deltaTime: number) {
  state.buildings.forEach(building => {
    // Process each building's operations based on type
    switch (building.type) {
      case 'extractor':
        // Extractors produce resources based on what they're placed on
        // This would normally check the tile type, but for now just produce methane
        state.resources.methane += 2 * deltaTime;
        // Consume energy
        state.resources.energy -= 1 * deltaTime;
        break;
        
      case 'reactor':
        // Reactors combine chemicals
        // Simple reaction: methane + oxygen -> carbon dioxide + water
        const methaneAvailable = state.resources.methane;
        const oxygenAvailable = state.resources.oxygen;
        
        if (methaneAvailable >= 1 * deltaTime && oxygenAvailable >= 2 * deltaTime) {
          // Consume reactants
          state.resources.methane -= 1 * deltaTime;
          state.resources.oxygen -= 2 * deltaTime;
          
          // Produce products
          state.resources.carbon_dioxide += 1 * deltaTime;
          state.resources.water += 2 * deltaTime;
          
          // Generate some energy from reaction
          state.resources.energy += 5 * deltaTime;
        }
        
        // Base energy consumption
        state.resources.energy -= 2 * deltaTime;
        break;
        
      case 'powerPlant':
        // Power plants generate energy
        state.resources.energy += 10 * deltaTime;
        
        // Consume some methane as fuel
        if (state.resources.methane >= 0.5 * deltaTime) {
          state.resources.methane -= 0.5 * deltaTime;
        } else {
          // Less efficient if no methane
          state.resources.energy -= 5 * deltaTime;
        }
        break;
        
      default:
        // Default building just consumes energy
        state.resources.energy -= 0.5 * deltaTime;
    }
  });
}

// Process resource production and consumption
function processResources(state: GameState, deltaTime: number) {
  // Ensure resources don't go negative (except energy, which can go into debt)
  for (const [resource, amount] of Object.entries(state.resources)) {
    if (resource !== 'energy' && amount < 0) {
      state.resources[resource] = 0;
    }
  }
  
  // Apply minimum energy - can't go below -1000
  if (state.resources.energy < -1000) {
    state.resources.energy = -1000;
    
    // When in energy debt, everything works at reduced capacity
    // This is handled in the building operations logic
  }
}

// Derived stores for UI
export const resourcesStore = derived(gameState, $state => $state.resources);
export const buildingsStore = derived(gameState, $state => $state.buildings);
```

# frontend/src/lib/supabase.ts

```ts
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { GameState } from './gameLoop';

// Initialize Supabase client with fallback values for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User authentication
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  return { data, error };
}

export async function signOut() {
  return await supabase.auth.signOut();
}

// Game save management
export async function saveGame(name: string, gameState: GameState) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    return { error: { message: 'User not authenticated' } };
  }
  
  // Check if save with this name exists
  const { data: existingSave } = await supabase
    .from('game_saves')
    .select('id')
    .eq('user_id', user.user.id)
    .eq('name', name)
    .single();
    
  if (existingSave) {
    // Update existing save
    return await supabase
      .from('game_saves')
      .update({
        state_data: gameState,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSave.id);
  } else {
    // Create new save
    return await supabase
      .from('game_saves')
      .insert({
        user_id: user.user.id,
        name,
        state_data: gameState,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
  }
}

export async function loadGame(saveId: string) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    return { error: { message: 'User not authenticated' } };
  }
  
  return await supabase
    .from('game_saves')
    .select('state_data')
    .eq('id', saveId)
    .eq('user_id', user.user.id)
    .single();
}

export async function listSaves() {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    return { error: { message: 'User not authenticated' } };
  }
  
  return await supabase
    .from('game_saves')
    .select('id, name, created_at, updated_at')
    .eq('user_id', user.user.id)
    .order('updated_at', { ascending: false });
}

export async function deleteSave(saveId: string) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    return { error: { message: 'User not authenticated' } };
  }
  
  return await supabase
    .from('game_saves')
    .delete()
    .eq('id', saveId)
    .eq('user_id', user.user.id);
}

```

# frontend/src/lib/wasm.ts

```ts
// src/lib/wasm.ts
import { writable, type Writable } from 'svelte/store';

// Define types from Rust
export interface Element {
  symbol: string;
  name: string;
  atomic_number: number;
  atomic_mass: number;
}

export enum MoleculeState {
  Solid = "Solid",
  Liquid = "Liquid",
  Gas = "Gas",
  Plasma = "Plasma"
}

export interface Molecule {
  formula: string;
  name: string;
  elements: Record<string, number>;
  energy_content: number;
  state: MoleculeState;
  density: number;
  specific_heat: number;
}

export interface Reaction {
  name: string;
  reactants: Record<string, number>;
  products: Record<string, number>;
  energy_delta: number;
  activation_energy: number;
  rate_constant: number;
  catalyst?: string;
  catalyst_effect: number;
  min_temperature: number;
  max_temperature: number;
  min_pressure: number;
  max_pressure: number;
}

export interface ReactionResult {
  reaction_name: string;
  reaction_amount: number;
  consumed: Record<string, number>;
  produced: Record<string, number>;
  energy_change: number;
  remaining_resources: Record<string, number>;
  catalyst_used: boolean;
  catalyst_name?: string;
  temperature: number;
  pressure: number;
}

// Create stores for our data
export const elements: Writable<Record<string, Element>> = writable({});
export const molecules: Writable<Record<string, Molecule>> = writable({});
export const reactions: Writable<Reaction[]> = writable([]);

// WASM module
let wasmModule: any;
let isInitialized = false;

// Initialize the WASM module
export async function initWasm() {
  if (isInitialized) return;
  
  try {
    console.log('Initializing WASM module...');
    
    // For development, we'll just set initialized to true
    // In production, we would actually import and initialize the WASM module
    isInitialized = true;
    
    /* Commented out for initial development
    // Dynamic import of the WASM module
    wasmModule = await import('../../rust/pkg/frankforge_core');
    
    // Initialize data
    const elementsData = wasmModule.initialize_elements();
    elements.set(elementsData);
    
    const moleculesData = wasmModule.initialize_molecules();
    molecules.set(moleculesData);
    
    const reactionsData = wasmModule.initialize_reactions();
    reactions.set(reactionsData);
    */
    
    console.log('WASM module initialized successfully');
  } catch (error) {
    console.error('Failed to initialize WASM module:', error);
    throw error;
  }
}

// Process a chemical reaction
export function processReaction(
  reaction: Reaction,
  availableResources: Record<string, number>,
  temperature: number,
  pressure: number,
  deltaTime: number,
  catalystPresent: boolean
): ReactionResult {
  if (!isInitialized) {
    throw new Error('WASM module not initialized');
  }
  
  // For development, return mock data
  return {
    reaction_name: reaction.name,
    reaction_amount: 1.0,
    consumed: { "methane": 1.0, "oxygen": 2.0 },
    produced: { "carbon_dioxide": 1.0, "water": 2.0 },
    energy_change: -890.0,
    remaining_resources: { ...availableResources },
    catalyst_used: catalystPresent,
    temperature: temperature,
    pressure: pressure
  };
  
  /* Commented out for initial development
  if (!wasmModule) {
    throw new Error('WASM module not initialized');
  }
  
  const reactionJson = JSON.stringify(reaction);
  const resourcesJson = JSON.stringify(availableResources);
  
  const resultJson = wasmModule.process_reaction(
    reactionJson,
    resourcesJson,
    temperature,
    pressure,
    deltaTime,
    catalystPresent
  );
  
  return JSON.parse(resultJson);
  */
}

```

# frontend/src/main.ts

```ts
import './app.css'
import App from './App.svelte'

// For Svelte 5, use this:
const target = document.getElementById('app')
if (target) {
  new App({ target })
}

export default App
```

# frontend/src/routes/Game.svelte

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import GameCanvas from '../components/world/GameCanvas.svelte';
  import BuildingControlPanel from '../components/ui/BuildingControlPanel.svelte';
  import { gameState, startGameLoop } from '../stores/gameState';
  import { initWasm } from '../wasm';
  
  let gameLoopStop: () => void;
  
  onMount(async () => {
    // Initialize WASM
    await initWasm();
    
    // Start game loop
    gameLoopStop = startGameLoop();
    
    return () => {
      if (gameLoopStop) gameLoopStop();
    };
  });
</script>

<div class="game-page">
  <header class="game-header">
    <h1>FrankForge</h1>
    <div class="controls">
      <button
        class="control-button"
        on:click={() => {
          gameState.update(state => ({
            ...state,
            isPaused: !state.isPaused
          }));
        }}
      >
        {$gameState.isPaused ? 'Resume' : 'Pause'}
      </button>
    </div>
  </header>
  
  <main class="game-content">
    <div class="sidebar">
      <BuildingControlPanel />
    </div>
    
    <div class="game-canvas-container">
      <GameCanvas />
    </div>
  </main>
</div>

<style>
  .game-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #0f0f1e;
    color: white;
  }
  
  .game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 24px;
    background-color: #1a1a2e;
  }
  
  h1 {
    margin: 0;
    font-size: 24px;
    color: #3498db;
  }
  
  .control-button {
    background-color: #2c3e50;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .game-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  
  .sidebar {
    width: 320px;
    padding: 16px;
    background-color: rgba(26, 26, 46, 0.9);
  }
  
  .game-canvas-container {
    flex: 1;
    overflow: hidden;
  }
</style>

```

# frontend/src/routes/game/+page.svelte

```svelte
<!-- src/routes/game/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import GameCanvas from '../../components/GameCanvas.svelte';
    import BuildingControlPanel from '../../components/BuildingControlPanel.svelte';
    import ResourceDisplay from '../../components/ResourceDisplay.svelte';
    import SaveLoadPanel from '../../components/SaveLoadPanel.svelte';
    import { gameState } from '../../lib/gameLoop';
    import { supabase } from '../../lib/supabase';
    // import { browser } from '$app/environment';
    // import { goto } from '$app/navigation';
    
    let gameCanvas: GameCanvas;
    let isLoading = true;
    let user: any = null;
    
    // Check if user is logged in
    onMount(async () => {
      if (browser) {
        const { data } = await supabase.auth.getUser();
        user = data.user;
        
        if (!user) {
          // Redirect to login page
          goto('/login');
          return;
        }
        
        // Initialize the game
        initializeGame();
      }
    });
    
    function initializeGame() {
      // Set up initial game state
      gameState.update(state => {
        // Initialize with default values if needed
        return {
          ...state,
          // Any additional initializations
        };
      });
      
      isLoading = false;
    }
    
    // Game controls
    function handlePause() {
      gameState.update(state => ({
        ...state,
        isPaused: !state.isPaused
      }));
    }
    
    // Handle keybindings
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        // Cancel current placement or selection
        // This would need to be implemented in the GameCanvas component
      } else if (event.key === ' ') {
        // Space bar to pause/unpause
        handlePause();
      }
    }
  </script>
  
  <svelte:window on:keydown={handleKeydown} />
  
  <div class="game-page">
    {#if isLoading}
      <div class="loading">
        <p>Loading FrankForge...</p>
      </div>
    {:else}
      <header class="game-header">
        <h1>FrankForge</h1>
        <div class="controls">
          <button class="control-button" on:click={handlePause}>
            {$gameState.isPaused ? 'Resume' : 'Pause'}
          </button>
          <button class="control-button" on:click={() => null}>Settings</button>
        </div>
      </header>
      
      <main class="game-content">
        <div class="sidebar left-sidebar">
          <BuildingControlPanel {gameCanvas} />
          <ResourceDisplay />
        </div>
        
        <div class="game-canvas-container">
          <GameCanvas bind:this={gameCanvas} />
        </div>
        
        <div class="sidebar right-sidebar">
          <SaveLoadPanel />
          
          <div class="info-panel">
            <h3>Game Info</h3>
            <p>Tick: {$gameState.tick}</p>
            <p>Buildings: {$gameState.buildings.length}</p>
            <p>Planet conditions: Normal</p>
          </div>
        </div>
      </main>
    {/if}
  </div>
  
  <style>
    .game-page {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background-color: #0f0f1e;
      color: white;
    }
    
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      font-size: 24px;
    }
    
    .game-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 24px;
      background-color: #1a1a2e;
      border-bottom: 1px solid #2a2a3e;
    }
    
    h1 {
      margin: 0;
      font-size: 24px;
      color: #3498db;
    }
    
    .controls {
      display: flex;
      gap: 12px;
    }
    
    .control-button {
      background-color: #2c3e50;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .control-button:hover {
      background-color: #3d566e;
    }
    
    .game-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    
    .sidebar {
      width: 320px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow-y: auto;
    }
    
    .left-sidebar {
      background-color: rgba(26, 26, 46, 0.9);
      border-right: 1px solid #2a2a3e;
    }
    
    .right-sidebar {
      background-color: rgba(26, 26, 46, 0.9);
      border-left: 1px solid #2a2a3e;
    }
    
    .game-canvas-container {
      flex: 1;
      overflow: hidden;
    }
    
    .info-panel {
      background-color: #2c3e50;
      border-radius: 4px;
      padding: 16px;
    }
    
    .info-panel h3 {
      margin-top: 0;
      border-bottom: 1px solid #34495e;
      padding-bottom: 8px;
    }
  </style>
```

# frontend/src/routes/game/+page.svelte.bak

```bak
<!-- src/routes/game/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import GameCanvas from '../../components/GameCanvas.svelte';
    import BuildingControlPanel from '../../components/BuildingControlPanel.svelte';
    import ResourceDisplay from '../../components/ResourceDisplay.svelte';
    import SaveLoadPanel from '../../components/SaveLoadPanel.svelte';
    import { gameState } from '../../lib/gameLoop';
    import { supabase } from '../../lib/supabase';
    // import { browser } from '$app/environment';
    import { goto } from '$app/navigation';
    
    let gameCanvas: GameCanvas;
    let isLoading = true;
    let user: any = null;
    
    // Check if user is logged in
    onMount(async () => {
      if (browser) {
        const { data } = await supabase.auth.getUser();
        user = data.user;
        
        if (!user) {
          // Redirect to login page
          goto('/login');
          return;
        }
        
        // Initialize the game
        initializeGame();
      }
    });
    
    function initializeGame() {
      // Set up initial game state
      gameState.update(state => {
        // Initialize with default values if needed
        return {
          ...state,
          // Any additional initializations
        };
      });
      
      isLoading = false;
    }
    
    // Game controls
    function handlePause() {
      gameState.update(state => ({
        ...state,
        isPaused: !state.isPaused
      }));
    }
    
    // Handle keybindings
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        // Cancel current placement or selection
        // This would need to be implemented in the GameCanvas component
      } else if (event.key === ' ') {
        // Space bar to pause/unpause
        handlePause();
      }
    }
  </script>
  
  <svelte:window on:keydown={handleKeydown} />
  
  <div class="game-page">
    {#if isLoading}
      <div class="loading">
        <p>Loading FrankForge...</p>
      </div>
    {:else}
      <header class="game-header">
        <h1>FrankForge</h1>
        <div class="controls">
          <button class="control-button" on:click={handlePause}>
            {$gameState.isPaused ? 'Resume' : 'Pause'}
          </button>
          <button class="control-button" on:click={() => null}>Settings</button>
        </div>
      </header>
      
      <main class="game-content">
        <div class="sidebar left-sidebar">
          <BuildingControlPanel {gameCanvas} />
          <ResourceDisplay />
        </div>
        
        <div class="game-canvas-container">
          <GameCanvas bind:this={gameCanvas} />
        </div>
        
        <div class="sidebar right-sidebar">
          <SaveLoadPanel />
          
          <div class="info-panel">
            <h3>Game Info</h3>
            <p>Tick: {$gameState.tick}</p>
            <p>Buildings: {$gameState.buildings.length}</p>
            <p>Planet conditions: Normal</p>
          </div>
        </div>
      </main>
    {/if}
  </div>
  
  <style>
    .game-page {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background-color: #0f0f1e;
      color: white;
    }
    
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      font-size: 24px;
    }
    
    .game-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 24px;
      background-color: #1a1a2e;
      border-bottom: 1px solid #2a2a3e;
    }
    
    h1 {
      margin: 0;
      font-size: 24px;
      color: #3498db;
    }
    
    .controls {
      display: flex;
      gap: 12px;
    }
    
    .control-button {
      background-color: #2c3e50;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .control-button:hover {
      background-color: #3d566e;
    }
    
    .game-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    
    .sidebar {
      width: 320px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow-y: auto;
    }
    
    .left-sidebar {
      background-color: rgba(26, 26, 46, 0.9);
      border-right: 1px solid #2a2a3e;
    }
    
    .right-sidebar {
      background-color: rgba(26, 26, 46, 0.9);
      border-left: 1px solid #2a2a3e;
    }
    
    .game-canvas-container {
      flex: 1;
      overflow: hidden;
    }
    
    .info-panel {
      background-color: #2c3e50;
      border-radius: 4px;
      padding: 16px;
    }
    
    .info-panel h3 {
      margin-top: 0;
      border-bottom: 1px solid #34495e;
      padding-bottom: 8px;
    }
  </style>
```

# frontend/src/stores/gameState.ts

```ts
import { writable } from 'svelte/store';

// Game state interface
export interface GameState {
  tick: number;
  isPaused: boolean;
  resources: Record<string, number>;
  buildings: Building[];
  energy: number;
}

export interface Building {
  id: string;
  type: string;
  position: { x: number; y: number };
  connections: string[];
}

// Initialize default game state
const createGameState = () => {
  return writable<GameState>({
    tick: 0,
    isPaused: false,
    resources: {
      methane: 100,
      oxygen: 100,
      water: 100,
    },
    buildings: [],
    energy: 1000,
  });
};

export const gameState = createGameState();

// Game loop function
export function startGameLoop() {
  let animationFrame: number;
  let lastTimestamp = performance.now();
  
  const update = (timestamp: number) => {
    // Calculate delta time in seconds
    const deltaTime = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;
    
    // Update game state
    gameState.update(state => {
      if (state.isPaused) return state;
      
      // Update tick counter
      state.tick += 1;
      
      // Process building operations
      // This will be implemented later
      
      return state;
    });
    
    // Request next frame
    animationFrame = requestAnimationFrame(update);
  };
  
  // Start the loop
  animationFrame = requestAnimationFrame(update);
  
  // Return a function to stop the loop
  return () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  };
}

```

# frontend/src/vite-env.d.ts

```ts
/// <reference types="svelte" />
/// <reference types="vite/client" />

```

# frontend/src/wasm/index.ts

```ts
// WASM integration will go here
// This will be used to load and interact with the Rust-generated WASM modules

let wasmModule: any;
let isInitialized = false;

export async function initWasm() {
  if (isInitialized) return;
  
  try {
    // This will be implemented once the WASM modules are built
    console.log('WASM module initialization placeholder');
    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize WASM module:', error);
    throw error;
  }
}

export function simulateChemicalReaction(
  reactants: Record<string, number>,
  reactionType: string
): Record<string, number> {
  // This is a placeholder until the actual WASM implementation
  console.log('Simulating reaction:', reactionType, reactants);
  
  // Return dummy products
  return {
    water: 10,
    carbon_dioxide: 5
  };
}

```

# frontend/svelte.config.js

```js
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
  // for more information about preprocessors
  preprocess: vitePreprocess(),
  
  // Add compatibility mode for Svelte 5
  compilerOptions: {
    compatibility: {
      componentApi: 4  // Use numeric value 4 instead of string "4"
    }
  }
}
```

# frontend/tsconfig.app.json

```json
{
  "extends": "@tsconfig/svelte/tsconfig.json",
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "resolveJsonModule": true,
    /**
     * Typecheck JS in `.svelte` and `.js` files by default.
     * Disable checkJs if you'd like to use dynamic types in JS.
     * Note that setting allowJs false does not prevent the use
     * of JS in `.svelte` files.
     */
    "allowJs": true,
    "checkJs": true,
    "isolatedModules": true,
    "moduleDetection": "force"
  },
  "include": ["src/**/*.ts", "src/**/*.js", "src/**/*.svelte"]
}

```

# frontend/tsconfig.json

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}

```

# frontend/tsconfig.node.json

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}

```

# frontend/vite.config.ts

```ts
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      '$lib': resolve(__dirname, './src/lib')
    }
  }
})

```

# README.md

```md
# 🧪 FrankForge 🔥

> *"In the beginning, there was chaos... then came the Engineer."*

![FrankForge](https://api.placeholder.com/800/300?text=FrankForge)

## 🚀 Welcome to the Strange New World

On a distant alien planet rich with exotic resources, you've crash-landed with nothing but your wits and engineering knowledge. **FrankForge** challenges you to master the mysterious elements of this world, building industrial marvels that would make even Dr. Frankenstein proud! 

Will you tame the volatile xenocrystals? Can you harness the planet's corrosive atmosphere? The future of this world—and your survival—depends on your chemical genius!

## ✨ Unleash Your Inner Mad Scientist

- 🧪 **Concoct Mind-Bending Reactions** - Balance chemical equations that would make your old professor faint
- 🌋 **Master the Elements** - Control heat, pressure, and exotic catalysts in a delicate dance of creation
- 🏭 **Build Industrial Empires** - From humble methane extractors to towering nuclear reactors
- 💥 **Face the Consequences** - One miscalculation and... BOOM! (Don't worry, you'll respawn)
- 💾 **Cloud Saves** - Your creations persist across the cosmos (or at least across devices)

## 🛠️ The Alchemy of Technology

This digital cauldron is brewed with:

- ⚡ **Svelte + TypeScript** - For lightning-fast interfaces
- 🦀 **Rust via WebAssembly** - Conjuring blazing performance from the void
- 🗄️ **Supabase** - Where your creations are immortalized
- 🌐 **Web Application** - Playable across dimensions (or just different browsers)

## 🗺️ The Grand Expedition

### 🌱 Phase 1: First Contact (2-3 weeks)
Your initial days on the alien world, establishing basic survival systems...

### 🔍 Phase 2: Strange Discoveries (4-6 weeks)
Venture deeper into the planet's secrets, unlocking new elements and reactions...

### 🏗️ Phase 3: Industrial Revolution (3-4 weeks)
As your understanding grows, so do your creations...

### ✨ Phase 4: Transcendence (3-4 weeks)
Master the planet's most exotic phenomena and bend physics to your will...

## 🌌 Alien Resources Awaiting Discovery

### 🔮 Basic Elements
- 🔥 **Methane (CH₄)** - Bubbling from mysterious vents
- 💨 **Oxygen (O₂)** - Rarer than you'd expect
- 💧 **Water (H₂O)** - The universal solvent, with unusual properties here
- ☁️ **Carbon Dioxide (CO₂)** - Waste or resource? You decide
- ⚡ **Hydrogen (H₂)** - The universe's building block
- 🟡 **Sulfur (S)** - Yellow crystals with pungent power

### 💎 Advanced Elements
- 🧪 **Sulfuric Acid (H₂SO₄)** - Handle with extreme care!
- 🌫️ **Ammonia (NH₃)** - A stinky but crucial compound
- 🟢 **Methanol (CH₃OH)** - Potent and versatile
- ✨ **Xenocrystals** - Mysterious alien formations that defy Earth chemistry
- 🔮 **Alien Enzymes** - Living catalysts with unpredictable properties

## 🏗️ Construct Remarkable Machines

### Resource Extraction
Extract the planet's bounty with specialized harvesters...

### Processing Wonders
Transform raw materials into industrial marvels...

### Storage & Transportation
Move resources through your growing empire...

### Power Generation
From simple combustion to exotic alien energy sources...

### Utility Structures
Support buildings that enhance your entire operation...

## 🧙‍♂️ Join the Experiment

### 📋 Prerequisites
- Node.js (v16+) - *The Conductor*
- Rust (1.65+) - *The Alchemist*
- wasm-pack - *The Translator*
- Supabase account - *The Archivist*

### 🔮 Summoning the Project

1. **Clone the ancient texts:**
   \`\`\`bash
   git clone https://github.com/your-username/frankforge.git
   cd frankforge
   \`\`\`

2. **Perform the initialization ritual:**
   \`\`\`bash
   ./setup.sh
   \`\`\`

3. **Connect to the ethereal plane (Supabase):**
   \`\`\`
   VITE_SUPABASE_URL=your_mystical_portal
   VITE_SUPABASE_ANON_KEY=your_arcane_key
   \`\`\`

4. **Awaken the development spirits:**
   \`\`\`bash
   cd frontend
   npm run dev
   \`\`\`

5. **Forge the WASM artifacts:**
   \`\`\`bash
   cd rust
   wasm-pack build --target web
   \`\`\`

## 🧩 The Architecture of Madness

\`\`\`
frankforge/
├── frontend/                  # The Interface to Your Creation
├── rust/                      # The Beating Heart of the Simulation
└── supabase/                  # The Memory of Your World
\`\`\`

## 🤝 Join Our Coven of Contributors

Have ideas for exotic new reactions? Discovered a bug in the space-time continuum? Contributions are welcome! Fork the repository, make your changes, and submit a Pull Request to join our mad science experiment!

## 📜 The Fine Print

This project is licensed under the MIT License - may your creations bring wonder, not destruction, to the universe.

## 💭 Mysterious Notes

*"The planet's atmosphere seems to react strangely during the third moon's eclipse..."*

*"Has anyone else noticed the xenocrystals glowing when exposed to methane gas?"*

*"Day 372: I've created something... unexpected. It moves on its own now..."*
```

# rust/.gitignore

```
/target

```

# rust/Cargo.toml

```toml
[package]
name = "frankforge_core"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = { version = "0.2.87", features = ["serde-serialize"] }
serde = { version = "1.0.188", features = ["derive"] }
serde_json = "1.0.107"
js-sys = "0.3.64"
web-sys = { version = "0.3.64", features = ["console"] }

[dev-dependencies]
wasm-bindgen-test = "0.3.37"

```

# rust/Cargo.toml.bak

```bak
[package]
name = "frankforge_core"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = { version = "0.2.87", features = ["serde-serialize"] }
serde = { version = "1.0.188", features = ["derive"] }
serde_json = "1.0.107"
js-sys = "0.3.64"
web-sys = { version = "0.3.64", features = ["console"] }

[dev-dependencies]
wasm-bindgen-test = "0.3.37"

```

# rust/pkg/.gitignore

```
*
```

# rust/pkg/frankforge_core_bg.wasm

This is a binary file of the type: WebAssembly

# rust/pkg/frankforge_core_bg.wasm.d.ts

```ts
/* tslint:disable */
/* eslint-disable */
export const memory: WebAssembly.Memory;
export const initialize_molecules: () => any;
export const calculate_reaction: (a: number, b: number, c: number, d: number, e: number) => [number, number];
export const update_game_state: (a: number, b: number, c: number) => [number, number];
export const __wbindgen_export_0: WebAssembly.Table;
export const __wbindgen_malloc: (a: number, b: number) => number;
export const __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
export const __wbindgen_free: (a: number, b: number, c: number) => void;
export const __wbindgen_start: () => void;

```

# rust/pkg/frankforge_core.d.ts

```ts
/* tslint:disable */
/* eslint-disable */
export function initialize_molecules(): any;
export function calculate_reaction(reactants_json: string, reaction_json: string, delta_time: number): string;
export function update_game_state(state_json: string, delta_time: number): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly initialize_molecules: () => any;
  readonly calculate_reaction: (a: number, b: number, c: number, d: number, e: number) => [number, number];
  readonly update_game_state: (a: number, b: number, c: number) => [number, number];
  readonly __wbindgen_export_0: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;

```

# rust/pkg/frankforge_core.js

```js
let wasm;

const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}
/**
 * @returns {any}
 */
export function initialize_molecules() {
    const ret = wasm.initialize_molecules();
    return ret;
}

let WASM_VECTOR_LEN = 0;

const cachedTextEncoder = (typeof TextEncoder !== 'undefined' ? new TextEncoder('utf-8') : { encode: () => { throw Error('TextEncoder not available') } } );

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}
/**
 * @param {string} reactants_json
 * @param {string} reaction_json
 * @param {number} delta_time
 * @returns {string}
 */
export function calculate_reaction(reactants_json, reaction_json, delta_time) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(reactants_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(reaction_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.calculate_reaction(ptr0, len0, ptr1, len1, delta_time);
        deferred3_0 = ret[0];
        deferred3_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * @param {string} state_json
 * @param {number} delta_time
 * @returns {string}
 */
export function update_game_state(state_json, delta_time) {
    let deferred2_0;
    let deferred2_1;
    try {
        const ptr0 = passStringToWasm0(state_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.update_game_state(ptr0, len0, delta_time);
        deferred2_0 = ret[0];
        deferred2_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbindgen_init_externref_table = function() {
        const table = wasm.__wbindgen_export_0;
        const offset = table.grow(4);
        table.set(0, undefined);
        table.set(offset + 0, undefined);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
        ;
    };
    imports.wbg.__wbindgen_json_parse = function(arg0, arg1) {
        const ret = JSON.parse(getStringFromWasm0(arg0, arg1));
        return ret;
    };

    return imports;
}

function __wbg_init_memory(imports, memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedUint8ArrayMemory0 = null;


    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('frankforge_core_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;

```

# rust/pkg/package.json

```json
{
  "name": "frankforge_core",
  "type": "module",
  "version": "0.1.0",
  "files": [
    "frankforge_core_bg.wasm",
    "frankforge_core.js",
    "frankforge_core.d.ts"
  ],
  "main": "frankforge_core.js",
  "types": "frankforge_core.d.ts",
  "sideEffects": [
    "./snippets/*"
  ]
}
```

# rust/src/chemistry/mod.rs

```rs
// src/chemistry/mod.rs
use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;

// Element data structure
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Element {
    pub symbol: String,
    pub name: String,
    pub atomic_number: u8,
    pub atomic_mass: f64,
}

// Molecule data structure
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Molecule {
    pub formula: String,
    pub name: String,
    pub elements: HashMap<String, u8>,  // Element symbol -> count
    pub energy_content: f64,            // kJ/mol
    pub state: MoleculeState,           // Physical state at standard conditions
    pub density: f64,                   // kg/m³
    pub specific_heat: f64,             // J/(kg·K)
}

// Physical state of a molecule
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum MoleculeState {
    Solid,
    Liquid,
    Gas,
    Plasma,
}

// Phase transition
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PhaseTransition {
    pub from_state: MoleculeState,
    pub to_state: MoleculeState,
    pub energy_required: f64,  // kJ/mol
    pub temperature: f64,      // Kelvin at standard pressure
}

// Chemical reaction
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Reaction {
    pub name: String,
    pub reactants: HashMap<String, f64>,   // Molecule formula -> mol
    pub products: HashMap<String, f64>,    // Molecule formula -> mol
    pub energy_delta: f64,                 // kJ (negative = exothermic)
    pub activation_energy: f64,            // kJ/mol
    pub rate_constant: f64,                // Base rate (mol/s)
    pub catalyst: Option<String>,          // Optional catalyst
    pub catalyst_effect: f64,              // Multiplier to rate when catalyst present
    pub min_temperature: f64,              // Minimum temperature (K) for reaction to occur
    pub max_temperature: f64,              // Maximum temperature (K) for reaction to occur
    pub min_pressure: f64,                 // Minimum pressure (Pa) for reaction to occur
    pub max_pressure: f64,                 // Maximum pressure (Pa) for reaction to occur
}

// Initialize a database of common elements
#[wasm_bindgen]
pub fn initialize_elements() -> JsValue {
    let mut elements = HashMap::new();
    
    elements.insert("H".to_string(), Element {
        symbol: "H".to_string(),
        name: "Hydrogen".to_string(),
        atomic_number: 1,
        atomic_mass: 1.008,
    });
    
    elements.insert("C".to_string(), Element {
        symbol: "C".to_string(),
        name: "Carbon".to_string(),
        atomic_number: 6,
        atomic_mass: 12.011,
    });
    
    elements.insert("O".to_string(), Element {
        symbol: "O".to_string(),
        name: "Oxygen".to_string(),
        atomic_number: 8,
        atomic_mass: 15.999,
    });
    
    elements.insert("N".to_string(), Element {
        symbol: "N".to_string(),
        name: "Nitrogen".to_string(),
        atomic_number: 7,
        atomic_mass: 14.007,
    });
    
    elements.insert("S".to_string(), Element {
        symbol: "S".to_string(),
        name: "Sulfur".to_string(),
        atomic_number: 16,
        atomic_mass: 32.06,
    });
    
    // Return as JS object
    JsValue::from_serde(&elements).unwrap()
}

// Initialize a database of common molecules
#[wasm_bindgen]
pub fn initialize_molecules() -> JsValue {
    let mut molecules = HashMap::new();
    
    // Methane
    let mut methane_elements = HashMap::new();
    methane_elements.insert("C".to_string(), 1);
    methane_elements.insert("H".to_string(), 4);
    
    molecules.insert("CH4".to_string(), Molecule {
        formula: "CH4".to_string(),
        name: "Methane".to_string(),
        elements: methane_elements,
        energy_content: 890.0,  // kJ/mol
        state: MoleculeState::Gas,
        density: 0.657,         // kg/m³ at STP
        specific_heat: 2.22,    // J/(g·K)
    });
    
    // Oxygen
    let mut oxygen_elements = HashMap::new();
    oxygen_elements.insert("O".to_string(), 2);
    
    molecules.insert("O2".to_string(), Molecule {
        formula: "O2".to_string(),
        name: "Oxygen".to_string(),
        elements: oxygen_elements,
        energy_content: 0.0,
        state: MoleculeState::Gas,
        density: 1.429,         // kg/m³ at STP
        specific_heat: 0.918,   // J/(g·K)
    });
    
    // Carbon Dioxide
    let mut co2_elements = HashMap::new();
    co2_elements.insert("C".to_string(), 1);
    co2_elements.insert("O".to_string(), 2);
    
    molecules.insert("CO2".to_string(), Molecule {
        formula: "CO2".to_string(),
        name: "Carbon Dioxide".to_string(),
        elements: co2_elements,
        energy_content: -393.5, // kJ/mol (formation energy)
        state: MoleculeState::Gas,
        density: 1.98,          // kg/m³ at STP
        specific_heat: 0.844,   // J/(g·K)
    });
    
    // Water
    let mut water_elements = HashMap::new();
    water_elements.insert("H".to_string(), 2);
    water_elements.insert("O".to_string(), 1);
    
    molecules.insert("H2O".to_string(), Molecule {
        formula: "H2O".to_string(),
        name: "Water".to_string(),
        elements: water_elements,
        energy_content: -285.8, // kJ/mol (formation energy)
        state: MoleculeState::Liquid,
        density: 997.0,         // kg/m³ at 25°C
        specific_heat: 4.184,   // J/(g·K)
    });
    
    // Return as JS object
    JsValue::from_serde(&molecules).unwrap()
}

// Initialize common reactions
#[wasm_bindgen]
pub fn initialize_reactions() -> JsValue {
    let mut reactions = Vec::new();
    
    // Methane combustion: CH4 + 2O2 -> CO2 + 2H2O
    let mut methane_combustion_reactants = HashMap::new();
    methane_combustion_reactants.insert("CH4".to_string(), 1.0);
    methane_combustion_reactants.insert("O2".to_string(), 2.0);
    
    let mut methane_combustion_products = HashMap::new();
    methane_combustion_products.insert("CO2".to_string(), 1.0);
    methane_combustion_products.insert("H2O".to_string(), 2.0);
    
    reactions.push(Reaction {
        name: "Methane Combustion".to_string(),
        reactants: methane_combustion_reactants,
        products: methane_combustion_products,
        energy_delta: -890.0,           // Exothermic
        activation_energy: 50.0,        // kJ/mol
        rate_constant: 10.0,            // Base rate in mol/s
        catalyst: None,
        catalyst_effect: 1.0,
        min_temperature: 400.0,         // K
        max_temperature: 2000.0,        // K
        min_pressure: 101325.0,         // Pa (1 atm)
        max_pressure: 10132500.0,       // Pa (100 atm)
    });
    
    // Water electrolysis: 2H2O -> 2H2 + O2
    let mut electrolysis_reactants = HashMap::new();
    electrolysis_reactants.insert("H2O".to_string(), 2.0);
    
    let mut electrolysis_products = HashMap::new();
    electrolysis_products.insert("H2".to_string(), 2.0);
    electrolysis_products.insert("O2".to_string(), 1.0);
    
    reactions.push(Reaction {
        name: "Water Electrolysis".to_string(),
        reactants: electrolysis_reactants,
        products: electrolysis_products,
        energy_delta: 571.6,            // Endothermic
        activation_energy: 80.0,        // kJ/mol
        rate_constant: 2.0,             // Base rate in mol/s
        catalyst: Some("Platinum".to_string()),
        catalyst_effect: 5.0,           // 5x faster with platinum catalyst
        min_temperature: 273.15,        // K (0°C)
        max_temperature: 373.15,        // K (100°C at 1 atm)
        min_pressure: 101325.0,         // Pa (1 atm)
        max_pressure: 10132500.0,       // Pa (100 atm)
    });
    
    // Return as JS object
    JsValue::from_serde(&reactions).unwrap()
}

// Process a chemical reaction with given conditions
#[wasm_bindgen]
pub fn process_reaction(
    reaction_json: &str,
    available_resources_json: &str,
    temperature: f64,
    pressure: f64,
    delta_time: f64,
    catalyst_present: bool
) -> String {
    // Parse inputs
    let reaction: Reaction = match serde_json::from_str(reaction_json) {
        Ok(r) => r,
        Err(_) => return json!({ "error": "Invalid reaction JSON" }).to_string(),
    };
    
    let available_resources: HashMap<String, f64> = match serde_json::from_str(available_resources_json) {
        Ok(r) => r,
        Err(_) => return json!({ "error": "Invalid resources JSON" }).to_string(),
    };
    
    // Check if reaction can occur at current temperature and pressure
    if temperature < reaction.min_temperature || temperature > reaction.max_temperature {
        return json!({ 
            "error": "Temperature out of range",
            "current": temperature,
            "range": { "min": reaction.min_temperature, "max": reaction.max_temperature }
        }).to_string();
    }
    
    if pressure < reaction.min_pressure || pressure > reaction.max_pressure {
        return json!({ 
            "error": "Pressure out of range",
            "current": pressure,
            "range": { "min": reaction.min_pressure, "max": reaction.max_pressure }
        }).to_string();
    }
    
    // Calculate limiting reactant
    let mut limiting_factor = f64::MAX;
    for (reactant, required_amount) in &reaction.reactants {
        let available = match available_resources.get(reactant) {
            Some(amount) => *amount,
            None => 0.0,
        };
        
        if available <= 0.0 {
            return json!({ 
                "error": "Missing reactant",
                "reactant": reactant 
            }).to_string();
        }
        
        let possible_reactions = available / required_amount;
        limiting_factor = limiting_factor.min(possible_reactions);
    }
    
    // Calculate actual reaction rate
    // Higher temperature increases rate (simplified Arrhenius equation)
    let temperature_factor = ((temperature - 273.15) / 100.0).exp();
    
    // Catalyst effect
    let catalyst_factor = if catalyst_present && reaction.catalyst.is_some() {
        reaction.catalyst_effect
    } else {
        1.0
    };
    
    // Calculate actual reaction amount
    let max_possible = limiting_factor;
    let rate = reaction.rate_constant * temperature_factor * catalyst_factor;
    let reaction_amount = max_possible.min(rate * delta_time);
    
    // Calculate consumed reactants
    let mut consumed = HashMap::new();
    for (reactant, amount) in &reaction.reactants {
        consumed.insert(reactant.clone(), amount * reaction_amount);
    }
    
    // Calculate produced products
    let mut produced = HashMap::new();
    for (product, amount) in &reaction.products {
        produced.insert(product.clone(), amount * reaction_amount);
    }
    
    // Calculate energy change
    let energy_change = reaction.energy_delta * reaction_amount;
    
    // Calculate remaining resources
    let mut remaining = available_resources.clone();
    for (reactant, amount) in &consumed {
        if let Some(remaining_amount) = remaining.get_mut(reactant) {
            *remaining_amount -= amount;
            // Prevent negative values due to floating point errors
            if *remaining_amount < 1e-10 {
                *remaining_amount = 0.0;
            }
        }
    }
    
    // Add produced resources to remaining
    for (product, amount) in &produced {
        *remaining.entry(product.clone()).or_insert(0.0) += amount;
    }
    
    // Prepare result
    json!({
        "reaction_name": reaction.name,
        "reaction_amount": reaction_amount,
        "consumed": consumed,
        "produced": produced,
        "energy_change": energy_change,
        "remaining_resources": remaining,
        "catalyst_used": catalyst_present && reaction.catalyst.is_some(),
        "catalyst_name": reaction.catalyst,
        "temperature": temperature,
        "pressure": pressure
    }).to_string()
}

// Helper function to create JSON
#[macro_export]
macro_rules! json {
    ($($json:tt)+) => {
        serde_json::json!($($json)+)
    };
}
```

# rust/src/lib.rs

```rs
// rust/src/lib.rs
use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;

// Define our chemical elements and compounds
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Molecule {
    pub formula: String,
    pub components: HashMap<String, u8>, // Element -> count
    pub energy_content: f64,             // in kJ/mol
}

// Chemical reaction definition
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Reaction {
    pub reactants: HashMap<String, f64>,  // Molecule -> mol
    pub products: HashMap<String, f64>,   // Molecule -> mol
    pub energy_delta: f64,                // in kJ (negative = exothermic)
    pub activation_energy: f64,           // in kJ/mol
    pub rate_constant: f64,               // reaction rate
}

// Building types
#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum BuildingType {
    Extractor,
    Reactor,
    Separator,
    Storage,
    PowerPlant,
    Pipe,
}

// Building definition
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Building {
    pub id: String,
    pub building_type: BuildingType,
    pub position: (f64, f64),
    pub connections: Vec<String>,
    pub input_rate: HashMap<String, f64>,    // substance -> mol/s
    pub output_rate: HashMap<String, f64>,   // substance -> mol/s
    pub temperature: f64,                    // in Kelvin
    pub pressure: f64,                       // in Pascal
    pub energy_consumption: f64,             // in Watts (J/s)
    pub energy_production: f64,              // in Watts (J/s)
}

// Game world state
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GameState {
    pub tick: u64,
    pub resources: HashMap<String, f64>,     // substance -> amount in mol
    pub buildings: Vec<Building>,
    pub energy_available: f64,               // in Joules
    pub ambient_temperature: f64,            // in Kelvin
}

// WASM exposed functions
#[wasm_bindgen]
pub fn initialize_molecules() -> JsValue {
    let mut molecules = HashMap::new();
    
    // Define some basic molecules
    let mut methane = Molecule {
        formula: "CH4".to_string(),
        components: HashMap::new(),
        energy_content: 890.0, // kJ/mol
    };
    methane.components.insert("C".to_string(), 1);
    methane.components.insert("H".to_string(), 4);
    
    let mut oxygen = Molecule {
        formula: "O2".to_string(),
        components: HashMap::new(),
        energy_content: 0.0,
    };
    oxygen.components.insert("O".to_string(), 2);
    
    // Add to our collection
    molecules.insert("methane".to_string(), methane);
    molecules.insert("oxygen".to_string(), oxygen);
    
    // Return as JS object
    JsValue::from_serde(&molecules).unwrap()
}

#[wasm_bindgen]
pub fn calculate_reaction(
    reactants_json: &str,
    reaction_json: &str,
    delta_time: f64
) -> String {
    // Parse input JSON
    let reactants: HashMap<String, f64> = serde_json::from_str(reactants_json).unwrap();
    let reaction: Reaction = serde_json::from_str(reaction_json).unwrap();
    
    // Find limiting reactant
    let mut limiting_factor = f64::MAX;
    for (reactant, required_amount) in &reaction.reactants {
        if let Some(available) = reactants.get(reactant) {
            let possible_reactions = available / required_amount;
            limiting_factor = limiting_factor.min(possible_reactions);
        } else {
            // Missing reactant
            limiting_factor = 0.0;
            break;
        }
    }
    
    // Calculate actual reaction amount based on rate and time
    let reaction_amount = limiting_factor.min(reaction.rate_constant * delta_time);
    
    // Calculate products
    let mut products = HashMap::new();
    let mut remaining_reactants = reactants.clone();
    
    // Consume reactants
    for (reactant, amount) in &reaction.reactants {
        let consumed = amount * reaction_amount;
        if let Some(remaining) = remaining_reactants.get_mut(reactant) {
            *remaining -= consumed;
        }
    }
    
    // Generate products
    for (product, amount) in &reaction.products {
        let produced = amount * reaction_amount;
        products.insert(product.clone(), produced);
    }
    
    // Calculate energy change
    let energy_change = reaction.energy_delta * reaction_amount;
    
    // Prepare result
    let result = serde_json::json!({
        "consumed": reaction.reactants.iter().map(|(k, v)| (k.clone(), v * reaction_amount)).collect::<HashMap<String, f64>>(),
        "produced": products,
        "energy_change": energy_change,
        "remaining_reactants": remaining_reactants,
        "reaction_amount": reaction_amount,
    });
    
    result.to_string()
}

#[wasm_bindgen]
pub fn update_game_state(state_json: &str, delta_time: f64) -> String {
    // Parse game state
    let mut state: GameState = serde_json::from_str(state_json).unwrap();
    
    // Process all buildings
    for building in &mut state.buildings {
        // Building-specific logic based on type
        match building.building_type {
            BuildingType::PowerPlant => {
                // Power plant consumes fuel and produces energy
                // Simplified example
                if let Some(fuel_amount) = state.resources.get_mut("methane") {
                    let fuel_consumed = building.input_rate.get("methane").unwrap_or(&0.0) * delta_time;
                    if *fuel_amount >= fuel_consumed {
                        *fuel_amount -= fuel_consumed;
                        state.energy_available += building.energy_production * delta_time;
                    }
                }
            },
            BuildingType::Reactor => {
                // Process chemical reactions
                // This is simplified - a real implementation would use the calculate_reaction function
            },
            // Handle other building types...
            _ => {}
        }
    }
    
    // Update tick
    state.tick += 1;
    
    // Return updated state
    serde_json::to_string(&state).unwrap()
}
```

# rust/src/physics/mod.rs

```rs

```

# rust/src/resources/mod.rs

```rs

```

# rust/src/thermodynamics/mod.rs

```rs

```

# setup.sh

```sh
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up FrankForge project...${NC}"

# Build Rust WASM component
echo -e "${YELLOW}Building Rust WASM components...${NC}"
cd rust
# Update Cargo.toml to include serde-serialize feature
sed -i.bak 's/wasm-bindgen = "0.2.87"/wasm-bindgen = { version = "0.2.87", features = ["serde-serialize"] }/g' Cargo.toml
wasm-pack build --target web
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build WASM components. See error above.${NC}"
    exit 1
fi
cd ..

# Set up frontend
echo -e "${YELLOW}Setting up frontend components...${NC}"
cd frontend

# Fix Game.svelte
echo -e "${YELLOW}Fixing Game.svelte...${NC}"
cat > src/routes/Game.svelte << 'EOL'
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import GameCanvas from '../components/world/GameCanvas.svelte';
  import BuildingControlPanel from '../components/ui/BuildingControlPanel.svelte';
  import { gameState, startGameLoop } from '../stores/gameState';
  import { initWasm } from '../wasm';
  
  let gameLoopStop: () => void;
  
  onMount(async () => {
    // Initialize WASM
    await initWasm();
    
    // Start game loop
    gameLoopStop = startGameLoop();
    
    return () => {
      if (gameLoopStop) gameLoopStop();
    };
  });
</script>

<div class="game-page">
  <header class="game-header">
    <h1>FrankForge</h1>
    <div class="controls">
      <button
        class="control-button"
        on:click={() => {
          gameState.update(state => ({
            ...state,
            isPaused: !state.isPaused
          }));
        }}
      >
        {$gameState.isPaused ? 'Resume' : 'Pause'}
      </button>
    </div>
  </header>
  
  <main class="game-content">
    <div class="sidebar">
      <BuildingControlPanel />
    </div>
    
    <div class="game-canvas-container">
      <GameCanvas />
    </div>
  </main>
</div>

<style>
  .game-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #0f0f1e;
    color: white;
  }
  
  .game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 24px;
    background-color: #1a1a2e;
  }
  
  h1 {
    margin: 0;
    font-size: 24px;
    color: #3498db;
  }
  
  .control-button {
    background-color: #2c3e50;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .game-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  
  .sidebar {
    width: 320px;
    padding: 16px;
    background-color: rgba(26, 26, 46, 0.9);
  }
  
  .game-canvas-container {
    flex: 1;
    overflow: hidden;
  }
</style>
EOL

# Install dependencies and start dev server
npm install
echo -e "${GREEN}Setup complete! Starting development server...${NC}"
npm run dev
```

# supabase/functions/save_game/index.ts

```ts
// Example Supabase Edge Function
// This is just a placeholder for future implementation

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Get request data
    const requestData = await req.json()
    
    // Process the save (this is a placeholder)
    // In a real implementation, you would validate and store the game state
    
    return new Response(
      JSON.stringify({ 
        message: 'Game saved successfully',
        userId: user.id,
        saveName: requestData.name
      }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 400 },
    )
  }
})

```

# supabase/migrations/001_initial_schema.sql

```sql
-- Create users profile table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Set up RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can update their own saves" ON public.game_saves
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saves" ON public.game_saves
  FOR DELETE USING (auth.uid() = user_id);

-- Achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User achievements junction table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  achievement_id UUID REFERENCES public.achievements(id) NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, achievement_id)
);

-- Set up RLS for user achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX user_id_idx ON public.user_achievements (user_id);
CREATE INDEX achievement_id_idx ON public.user_achievements (achievement_id);

-- Function to unlock achievements
CREATE OR REPLACE FUNCTION public.unlock_achievement(
  achievement_name TEXT
) RETURNS VOID AS $
DECLARE
  v_achievement_id UUID;
BEGIN
  -- Get the achievement ID
  SELECT id INTO v_achievement_id
  FROM public.achievements
  WHERE name = achievement_name;
  
  -- If achievement exists and not already unlocked
  IF v_achievement_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.user_achievements
    WHERE user_id = auth.uid() AND achievement_id = v_achievement_id
  ) THEN
    -- Insert new achievement for user
    INSERT INTO public.user_achievements (user_id, achievement_id)
    VALUES (auth.uid(), v_achievement_id);
  END IF;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create a trigger to create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Game saves table
CREATE TABLE IF NOT EXISTS public.game_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  state_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Set up RLS for game saves
ALTER TABLE public.game_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own saves" ON public.game_saves
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own saves" ON public.game_saves
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "
```

# tree.sh

```sh
#!/bin/bash

# Define colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}FrankForge Project Structure (AI Context)${NC}\n"

# Create a temporary file for the tree output
temp_file=$(mktemp)

# Run tree command with specific patterns to include
tree -I "node_modules|dist|target|.git|*.wasm|*.log|*.lock" --dirsfirst -a > $temp_file

# Process the tree output to highlight important files
cat $temp_file | sed -E \
    -e "s/(.*package.json|.*tsconfig.*|.*vite.config.ts)/\\${GREEN}&\\${NC}/" \
    -e "s/(.*lib\/.*\.ts)/\\${BLUE}&\\${NC}/" \
    -e "s/(.*Cargo\.toml|.*\/lib\.rs|.*\/mod\.rs)/\\${YELLOW}&\\${NC}/" \
    -e "s/(.*App\.svelte|.*Game\.svelte|.*Canvas\.svelte|.*\.svelte)/\\${BLUE}&\\${NC}/" 

# Remove the temporary file
rm $temp_file

echo -e "\n${YELLOW}Key Files for AI Understanding:${NC}"
echo -e "${GREEN}└── frontend/package.json${NC} - Dependencies and project setup"
echo -e "${GREEN}└── frontend/vite.config.ts${NC} - Build configuration"
echo -e "${BLUE}└── frontend/src/lib/gameLoop.ts${NC} - Core game state and simulation loop"
echo -e "${BLUE}└── frontend/src/lib/wasm.ts${NC} - Interface to Rust WASM simulation"
echo -e "${YELLOW}└── rust/Cargo.toml${NC} - Rust dependencies and configuration"
echo -e "${YELLOW}└── rust/src/lib.rs${NC} - Entry point for Rust code"
echo -e "${BLUE}└── frontend/src/App.svelte${NC} - Main application component"
echo -e "${BLUE}└── frontend/src/routes/Game.svelte${NC} - Game interface"
```

