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
codebase.md
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
    "@supabase/supabase-js": "^2.49.1",
    "canvas": "^3.1.0",
    "pixi.js": "^8.8.1",
    "seedrandom": "^3.0.5",
    "simplex-noise": "^4.0.3"
  }
}

```

# frontend/public/assets/sprites/buildings/extractor_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/buildings/extractor_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/buildings/pipe_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/buildings/pipe_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/buildings/power_plant_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/buildings/power_plant_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/buildings/reactor_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/buildings/reactor_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/buildings/storage_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/buildings/storage_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/decorations/bush_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/decorations/bush_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/decorations/bush_2.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/decorations/crater_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/decorations/crater_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/decorations/crystal_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/decorations/crystal_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/decorations/crystal_2.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/decorations/rock_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/decorations/rock_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/decorations/rock_2.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/decorations/ruins_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/decorations/ruins_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/decorations/ruins_2.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/decorations/ruins_3.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/decorations/ruins_4.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/copper_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/copper_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/copper_2.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/iron_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/iron_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/iron_2.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/methane_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/methane_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/methane_2.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/oxygen_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/oxygen_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/oxygen_2.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/rare_metals_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/rare_metals_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/rare_metals_2.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/silicon_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/silicon_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/silicon_2.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/sulfur_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/sulfur_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/sulfur_2.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/uranium_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/uranium_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/uranium_2.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/water_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/water_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/water_2.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/xenocrystals_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/xenocrystals_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/resources/xenocrystals_2.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/alien_crystal_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/alien_crystal_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/alien_crystal_2.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/alien_crystal_3.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/alien_forest_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/alien_forest_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/alien_grass_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/alien_grass_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/alien_grass_2.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/alien_grass_3.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/alien_tileset.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/cave_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/deep_water_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/deep_water_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/deep_water_2.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/deep_water_3.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/earth_tileset.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/forest_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/forest_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/grass_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/grass_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/grass_2.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/grass_3.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/hills_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/hills_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/hills_2.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/ice_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/ice_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/ice_2.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/ice_3.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/ice_tileset.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/lava_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/lava_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/lava_2.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/lava_3.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/mars_tileset.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/methane_lake_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/methane_lake_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/methane_lake_2.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/methane_lake_3.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/mountains_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/mountains_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/mountains_2.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/sand_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/sand_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/sand_2.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/sand_3.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/shallow_water_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/shallow_water_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/shallow_water_2.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/shallow_water_3.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/snow_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/snow_1.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/snow_2.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/snow_3.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/terrain_tileset.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/volcanic_0.png

This is a binary file of the type: Image

# frontend/public/assets/sprites/terrain/volcanic_1.png

This is a binary file of the type: Image

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
  import { fade } from 'svelte/transition';
  import BuildingControlPanel from './components/ui/BuildingControlPanel.svelte';
  import { gameState } from './stores/gameState';
  import { PlanetType } from './lib/types';
  
  // Game state
  let isPaused = false;
  let selectedBuilding = null;
  let debugMode = true;
  
  // Game world settings
  let mapWidth = 60;
  let mapHeight = 40;
  let tileSize = 24;
  let tiles = [];
  
  // Generate map
  function generateMap() {
    // Create an empty map
    tiles = [];
    
    // Generate tiles with interesting pattern
    for (let y = 0; y < mapHeight; y++) {
      let row = [];
      for (let x = 0; x < mapWidth; x++) {
        // Create varied terrain
        let tileType;
        
        // Create some large water bodies
        const distanceFromCenter = Math.sqrt(
          Math.pow(x - mapWidth/2, 2) + 
          Math.pow(y - mapHeight/2, 2)
        );
        
        if (distanceFromCenter < 10) {
          // Deep water in center
          tileType = 1;
        } else if (distanceFromCenter < 15) {
          // Shallow water surrounding
          tileType = 2;
        } else if (x < 10 || x > mapWidth - 10 || y < 10 || y > mapHeight - 10) {
          // Mountains around edges
          tileType = 3;
        } else if (Math.random() < 0.1) {
          // Random forest patches
          tileType = 4;
        } else {
          // Grassland for most of the map
          tileType = 0;
        }
        
        // Add some resources
        let resource = Math.random() < 0.05 ? Math.floor(Math.random() * 3) + 1 : 0;
        
        row.push({
          type: tileType,
          resource: resource,
          building: null
        });
      }
      tiles.push(row);
    }
    
    // Update game state
    gameState.update(state => ({
      ...state,
      map: { 
        name: "Beautiful Planet", 
        width: mapWidth, 
        height: mapHeight,
        tiles: tiles
      },
      resources: {
        energy: 1000,
        water: 500,
        oxygen: 200,
        methane: 300
      }
    }));
    
    console.log("Beautiful map generated!");
  }
  
  // Toggle pause
  function togglePause() {
    isPaused = !isPaused;
    console.log("Game " + (isPaused ? "paused" : "resumed"));
  }
  
  // Place building
  function placeBuilding(type, x, y) {
    // Check if cell is empty
    if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
      if (tiles[y][x].building === null) {
        // Place building
        tiles[y][x].building = type;
        
        // Update resources
        gameState.update(state => {
          const resources = {...state.resources};
          resources.energy -= 50;
          return {...state, resources};
        });
        
        console.log(`Building ${type} placed at (${x},${y})`);
      }
    }
  }
  
  // Get tile color based on type
  function getTileColor(tile) {
    // Base terrain colors
    const colors = {
      0: '#27ae60', // Grass - green
      1: '#2980b9', // Deep water - blue
      2: '#3498db', // Shallow water - light blue
      3: '#7f8c8d', // Mountains - gray
      4: '#2ecc71'  // Forest - dark green
    };
    
    // Resource indicator
    if (tile.resource > 0) {
      const resourceColors = [
        '#f1c40f', // Gold - energy
        '#3498db', // Blue - water
        '#e74c3c'  // Red - oxygen
      ];
      
      // Return resource color
      return resourceColors[tile.resource - 1];
    }
    
    // Building colors
    if (tile.building !== null) {
      const buildingColors = {
        'extractor': '#e67e22',
        'storage': '#f39c12',
        'reactor': '#c0392b',
        'powerPlant': '#d35400',
        'pipe': '#7f8c8d'
      };
      
      return buildingColors[tile.building] || '#9b59b6';
    }
    
    // Otherwise return terrain color
    return colors[tile.type] || '#2c3e50';
  }
  
  // Initialize on mount
  onMount(() => {
    console.log("Game initialized");
    
    // Generate map
    generateMap();
    
    // Add keyboard controls
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        togglePause();
      }
    });
    
    // Return cleanup function
    return () => {
      document.removeEventListener('keydown', togglePause);
    };
  });
</script>

<main class="game-container">
  <!-- Header -->
  <header class="game-header">
    <h1>FrankForge</h1>
    <div class="resources">
      <div class="resource">Energy: {$gameState.resources?.energy || 0}</div>
      <div class="resource">Water: {$gameState.resources?.water || 0}</div>
      <div class="resource">Oxygen: {$gameState.resources?.oxygen || 0}</div>
      <div class="resource">Methane: {$gameState.resources?.methane || 0}</div>
    </div>
    <button class="pause-button" on:click={togglePause}>
      {isPaused ? 'Resume Game' : 'Pause Game'}
    </button>
  </header>
  
  <!-- Game Content -->
  <div class="game-content">
    <!-- Sidebar with building controls -->
    <aside class="sidebar">
      <BuildingControlPanel />
    </aside>
    
    <!-- Main game area with map -->
    <div class="game-area">
      <div class="game-map">
        {#each tiles as row, y}
          <div class="map-row">
            {#each row as tile, x}
              <div
                class="map-tile"
                style="background-color: {getTileColor(tile)}; width: {tileSize}px; height: {tileSize}px;"
                on:click={() => placeBuilding('extractor', x, y)}
              >
                {#if tile.resource > 0}
                  <div class="resource-indicator"></div>
                {/if}
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  </div>
  
  <!-- Floating Action Button for pause -->
  <button class="floating-button" on:click={togglePause}>
    {isPaused ? '▶️' : '⏸️'}
  </button>
  
  <!-- Controls Info -->
  <div class="controls-info">
    Click on tiles to place extractors | ESC: Toggle Pause Menu
  </div>
  
  <!-- Pause Menu -->
  {#if isPaused}
    <div class="pause-overlay" transition:fade={{duration: 300}}>
      <div class="pause-menu">
        <h2>Game Paused</h2>
        
        <div class="menu-buttons">
          <button class="resume-button" on:click={togglePause}>Resume Game</button>
          <button class="new-game-button" on:click={generateMap}>New Game</button>
          <button class="settings-button">Game Settings</button>
          <button class="save-button">Save Game</button>
        </div>
        
        <div class="menu-footer">
          <p>Press ESC to resume game</p>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Debug Panel -->
  {#if debugMode}
    <div class="debug-panel">
      <h3>Debug Panel</h3>
      <button on:click={togglePause}>Toggle Pause</button>
      <button on:click={generateMap}>Regen Map</button>
      <div>
        <label>
          Tile Size: 
          <input type="range" min="10" max="40" bind:value={tileSize}>
          {tileSize}px
        </label>
      </div>
      <pre>
Game State:
Paused: {isPaused}
Map Size: {mapWidth}x{mapHeight}
Map Name: {$gameState.map?.name || 'None'}
Resources: {JSON.stringify($gameState.resources, null, 2)}
      </pre>
    </div>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #0f1924;
    color: white;
    overflow: hidden;
  }
  
  .game-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }
  
  /* Header Styles */
  .game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(to right, #1a2a3a, #2c3e50);
    padding: 10px 20px;
    height: 60px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    z-index: 100;
  }
  
  .game-header h1 {
    margin: 0;
    font-size: 24px;
    background: linear-gradient(to right, #3498db, #2ecc71);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  
  .resources {
    display: flex;
    gap: 15px;
  }
  
  .resource {
    background-color: rgba(0, 0, 0, 0.3);
    padding: 8px 12px;
    border-radius: 20px;
    font-size: 14px;
    box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.5);
  }
  
  .pause-button {
    background-color: #e74c3c;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.2s ease;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  }
  
  .pause-button:hover {
    background-color: #c0392b;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  }
  
  /* Game Content */
  .game-content {
    display: flex;
    flex: 1;
    position: relative;
    overflow: hidden;
  }
  
  .sidebar {
    width: 250px;
    background-color: rgba(26, 37, 47, 0.9);
    padding: 15px;
    overflow-y: auto;
    z-index: 50;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.5);
  }
  
  .game-area {
    flex: 1;
    position: relative;
    overflow: auto;
    background-color: #0a1016;
  }
  
  .game-map {
    padding: 20px;
    display: flex;
    flex-direction: column;
  }
  
  .map-row {
    display: flex;
  }
  
  .map-tile {
    position: relative;
    border: 1px solid rgba(0, 0, 0, 0.3);
    box-sizing: border-box;
    transition: all 0.1s ease;
    cursor: pointer;
  }
  
  .map-tile:hover {
    transform: scale(1.1);
    z-index: 10;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  }
  
  .resource-indicator {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 6px;
    height: 6px;
    background-color: white;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
    animation: pulse 2s infinite;
  }
  
  /* Controls Info */
  .controls-info {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    z-index: 200;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
  }
  
  /* Floating Button */
  .floating-button {
    position: fixed;
    right: 20px;
    bottom: 20px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(145deg, #e74c3c, #c0392b);
    color: white;
    border: none;
    font-size: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    z-index: 200;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
    transition: all 0.3s ease;
  }
  
  .floating-button:hover {
    transform: scale(1.1) rotate(10deg);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.6);
  }
  
  /* Pause Menu */
  .pause-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(5px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .pause-menu {
    background: linear-gradient(145deg, #1a2a3a, #2c3e50);
    border-radius: 20px;
    padding: 30px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .pause-menu h2 {
    margin-top: 0;
    margin-bottom: 30px;
    color: #3498db;
    font-size: 28px;
    text-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
  }
  
  .menu-buttons {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .menu-buttons button {
    padding: 15px;
    border: none;
    border-radius: 10px;
    background-color: #34495e;
    color: white;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  }
  
  .menu-buttons button:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
  }
  
  .resume-button {
    background: linear-gradient(145deg, #2ecc71, #27ae60) !important;
  }
  
  .new-game-button {
    background: linear-gradient(145deg, #3498db, #2980b9) !important;
  }
  
  .menu-footer {
    margin-top: 30px;
    font-size: 14px;
    color: #bdc3c7;
  }
  
  /* Debug Panel */
  .debug-panel {
    position: fixed;
    bottom: 0;
    right: 0;
    background-color: rgba(0, 0, 0, 0.8);
    padding: 10px;
    border-top-left-radius: 10px;
    z-index: 2000;
    max-width: 300px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
  }
  
  .debug-panel h3 {
    margin-top: 0;
    color: #3498db;
  }
  
  .debug-panel button {
    margin: 5px;
    padding: 5px 10px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .debug-panel button:hover {
    background-color: #2980b9;
  }
  
  .debug-panel pre {
    font-size: 12px;
    background-color: rgba(0, 0, 0, 0.3);
    padding: 8px;
    border-radius: 5px;
    max-height: 200px;
    overflow: auto;
  }
  
  /* Animations */
  @keyframes pulse {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
    50% {
      transform: translate(-50%, -50%) scale(1.5);
      opacity: 0.7;
    }
    100% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
  }
</style>
```

# frontend/src/App.svelte.bak

```bak
<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import MainMenu from './components/ui/MainMenu.svelte';
  import { mapGenerator } from './lib/mapGenerator';
  import { gameState } from './stores/gameState';
  import { PlanetType } from './lib/types';
  
  // For debugging purposes
  console.log("App.svelte is being evaluated");
  
  // Building interaction state
  let selectedBuildingType: string | null = null;
  let isPlacementMode = false;
  let selectedBuilding: any = null;
  let hoverPosition = { x: 0, y: 0 };
  
  // Helper functions for map rendering
  function getTileColor(terrainType: number): string {
    // Colors for different terrain types
    switch(terrainType) {
      case 0: return '#0a3b5c'; // DEEP_WATER
      case 1: return '#0e6ba8'; // SHALLOW_WATER
      case 2: return '#e4d6a7'; // SAND
      case 3: return '#7ab317'; // GRASS
      case 4: return '#3e7924'; // FOREST
      case 5: return '#6d8383'; // HILLS
      case 6: return '#8d8778'; // MOUNTAINS
      case 7: return '#ffffff'; // SNOW
      case 8: return '#7c3626'; // VOLCANIC
      case 9: return '#e25822'; // LAVA
      case 10: return '#3c2c3e'; // CAVE
      case 11: return '#a2d6a2'; // ALIEN_GRASS
      case 12: return '#5eaa5e'; // ALIEN_FOREST
      case 13: return '#bf62a6'; // ALIEN_CRYSTAL
      case 14: return '#39848b'; // METHANE_LAKE
      case 15: return '#c9e1ff'; // ICE
      default: return '#555555'; // DEFAULT
    }
  }
  
  function getResourceColor(resourceType: number): string {
    // Colors for different resource types
    switch(resourceType) {
      case 0: return 'transparent'; // NONE
      case 1: return '#39848b'; // METHANE
      case 2: return '#f5f5f5'; // OXYGEN
      case 3: return '#43aada'; // WATER
      case 4: return '#b77333'; // IRON
      case 5: return '#d4a276'; // COPPER
      case 6: return '#f0e68c'; // SILICON
      case 7: return '#fff44f'; // SULFUR
      case 8: return '#9bc400'; // URANIUM
      case 9: return '#c0c0c0'; // RARE_METALS
      case 10: return '#bf62a6'; // XENOCRYSTALS
      default: return '#888888'; // DEFAULT
    }
  }
  
  // Application state
  let showMainMenu = true;
  let showGame = false;
  let gameSettings: {
    planetType: PlanetType;
    mapWidth: number;
    mapHeight: number;
    resourceRichness: number;
  } | null = null;
  
  // Debug flags
  let debugMode = true;
  
  // Handle game start from main menu
  function handleStartGame(event: CustomEvent) {
    console.log("handleStartGame triggered in App.svelte");
    
    // Get settings from the event
    gameSettings = event.detail;
    console.log("Game settings received:", gameSettings);
    
    // Generate the map based on settings
    if (gameSettings) {
      console.log("Generating map for", gameSettings.planetType);
      const generatedMap = mapGenerator.generateMap({
        planetType: gameSettings.planetType,
        width: gameSettings.mapWidth,
        height: gameSettings.mapHeight,
        resourceRichness: gameSettings.resourceRichness,
        specialFeatureCount: 3 // Reduce for safety
      });
      
      console.log("Map generated successfully, updating game state");
      
      // Update the game state with the new map
      gameState.update(state => ({
        ...state,
        map: generatedMap,
        planetType: gameSettings.planetType,
        tick: 0,
        buildings: [],
        lastUpdated: Date.now()
      }));
      
      console.log("Game state updated, transitioning to game view");
      
      // Switch scenes: hide menu, show game
      showMainMenu = false;
      showGame = true;
      console.log("Transitioning from menu to game scene");
      
      // Initialize canvas after DOM update
      // Use a slightly longer delay to ensure DOM is fully updated
      setTimeout(() => {
        // Try to find the canvas element
        const canvas = document.getElementById('basic-canvas');
        console.log("Looking for canvas element after delay:", !!canvas);
        
        if (canvas) {
          initializeCanvas();
        } else {
          console.error("Canvas element still not found after delay");
        }
      }, 1000);
    }
  }
  
  // Handle load game
  function handleLoadGame() {
    // Placeholder for load game functionality
    console.log("Load game requested");
    
    // Example of loading a saved game - would come from storage in reality
    const savedGame = {
      planetType: PlanetType.EARTH_LIKE,
      buildings: [],
      resources: {},
      tick: 0
    };
    
    // Update game state with saved game
    gameState.update(state => ({
      ...state,
      ...savedGame,
      lastUpdated: Date.now()
    }));
    
    // Switch scenes: hide menu, show game
    showMainMenu = false;
    showGame = true;
    
    // Initialize canvas after a delay
    setTimeout(initializeCanvas, 500);
  }
  
  let canvasElement: HTMLCanvasElement;
  let savedGameState: any = null;
  
  // Scene transition functions
  function handleBackToMenu() {
    showGame = false;
    showMainMenu = true;
    console.log("Returning to main menu");
  }
  
  // Building interaction functions
  function selectBuildingType(type: string) {
    selectedBuildingType = type;
    console.log(`Selected building type: ${type}`);
    
    // Automatically enter placement mode when selecting a building type
    if (!isPlacementMode) {
      setPlacementMode(true);
    }
  }
  
  function setPlacementMode(enabled: boolean) {
    isPlacementMode = enabled;
    console.log(`Placement mode: ${enabled ? 'enabled' : 'disabled'}`);
    
    // Clear selection when entering placement mode
    if (enabled) {
      selectedBuilding = null;
    }
    
    // Re-initialize canvas to update cursor and preview
    initializeCanvas();
  }
  
  function handleCanvasClick(event: MouseEvent) {
    const canvas = document.getElementById('basic-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    // Get click position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Convert to world coordinates (accounting for any zoom/pan later)
    const worldX = clickX;
    const worldY = clickY;
    
    console.log(`Canvas click at (${clickX}, ${clickY})`);
    
    if (isPlacementMode && selectedBuildingType) {
      placeBuilding(worldX, worldY);
    } else {
      selectBuildingAtPosition(worldX, worldY);
    }
  }
  
  function handleCanvasHover(event: MouseEvent) {
    const canvas = document.getElementById('basic-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    // Get mouse position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Update hover position
    hoverPosition = { x, y };
    
    // Only redraw if in placement mode to show preview
    if (isPlacementMode && selectedBuildingType) {
      // Use requestAnimationFrame to avoid too many redraws
      requestAnimationFrame(initializeCanvas);
    }
  }
  
  function placeBuilding(x: number, y: number) {
    if (!selectedBuildingType) return;
    
    // Create a new building object
    const building = {
      id: crypto.randomUUID(),
      type: selectedBuildingType,
      position: { x, y },
      connections: [],
      efficiency: 1.0,
      isActive: true
    };
    
    // Add to game state
    gameState.update(state => {
      return {
        ...state,
        buildings: [...state.buildings, building]
      };
    });
    
    console.log(`Placed ${selectedBuildingType} at (${x}, ${y})`);
    
    // Redraw canvas to show new building
    initializeCanvas();
  }
  
  function selectBuildingAtPosition(x: number, y: number) {
    // Find if there's a building at the clicked position
    selectedBuilding = null;
    
    const buildings = $gameState.buildings || [];
    for (const building of buildings) {
      // Simple distance check (can be improved with proper hitbox)
      const distance = Math.sqrt(
        Math.pow(building.position.x - x, 2) + 
        Math.pow(building.position.y - y, 2)
      );
      
      // If within 20 pixels, select this building
      if (distance < 20) {
        selectedBuilding = building;
        console.log(`Selected building: ${building.type} (ID: ${building.id})`);
        break;
      }
    }
    
    // If nothing was selected, log it
    if (!selectedBuilding) {
      console.log("No building selected");
    }
    
    // Redraw to show selection
    initializeCanvas();
  }
  
  // Handle toggling buttons in debug panel
  function handleToggleMenu() {
    showMainMenu = !showMainMenu;
    console.log("Toggled menu visibility:", showMainMenu);
    
    // Make sure we're in a valid state
    if (showMainMenu && showGame) {
      showGame = false;
    } else if (!showMainMenu && !showGame) {
      showGame = true;
    }
  }
  
  function handleToggleGame() {
    showGame = !showGame;
    console.log("Toggled game visibility:", showGame);
    
    // Make sure we're in a valid state
    if (showGame && showMainMenu) {
      showMainMenu = false;
    }
    
    // If showing game, make sure canvas is initialized
    if (showGame) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        initializeCanvas();
      }, 100);
    }
  }
  
  // For debugging - save current game state
  function forceSaveGame() {
    savedGameState = JSON.parse(JSON.stringify($gameState));
    console.log("Game state saved:", savedGameState);
    alert("Game state saved (see console)");
  }
  
  // For debugging - restore saved game state
  function forceLoadGame() {
    if (!savedGameState) {
      console.error("No saved game state to load");
      alert("No saved game state to load");
      return;
    }
    
    gameState.set(savedGameState);
    console.log("Game state restored from saved state");
    
    if (showGame) {
      setTimeout(() => {
        initializeCanvas();
      }, 100);
    }
    
    alert("Game state restored - map should appear when game is visible");
  }
  
  // Initialize and draw on the canvas
  function initializeCanvas() {
    try {
      const canvas = document.getElementById('basic-canvas') as HTMLCanvasElement;
      if (!canvas) {
        console.error("Canvas element not found");
        return;
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error("Could not get canvas context");
        return;
      }
      
      // Clear the canvas
      ctx.fillStyle = '#0a0a18';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw map if available
      if ($gameState.map && $gameState.map.tiles) {
        // Calculate tile size to fit the map on screen
        const tileSize = Math.min(
          Math.floor(canvas.width / $gameState.map.width),
          Math.floor(canvas.height / $gameState.map.height)
        );
        
        // Maximum dimensions to render
        const maxTilesX = Math.min($gameState.map.width, Math.floor(canvas.width / tileSize));
        const maxTilesY = Math.min($gameState.map.height, Math.floor(canvas.height / tileSize));
        
        // Draw each map tile
        for (let y = 0; y < maxTilesY; y++) {
          for (let x = 0; x < maxTilesX; x++) {
            const tile = $gameState.map.tiles[y][x];
            
            // Get color based on terrain type
            const tileColor = getTileColor(tile.terrain);
            
            // Draw tile
            ctx.fillStyle = tileColor;
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            
            // Draw resource indicator if present
            if (tile.resource > 0) {
              ctx.fillStyle = getResourceColor(tile.resource);
              ctx.fillRect(
                x * tileSize + tileSize/4, 
                y * tileSize + tileSize/4, 
                tileSize/2, 
                tileSize/2
              );
            }
          }
        }
        
        // Draw grid lines
        ctx.strokeStyle = 'rgba(52, 152, 219, 0.3)';
        ctx.lineWidth = 0.5;
        
        for (let x = 0; x <= maxTilesX; x++) {
          ctx.beginPath();
          ctx.moveTo(x * tileSize, 0);
          ctx.lineTo(x * tileSize, maxTilesY * tileSize);
          ctx.stroke();
        }
        
        for (let y = 0; y <= maxTilesY; y++) {
          ctx.beginPath();
          ctx.moveTo(0, y * tileSize);
          ctx.lineTo(maxTilesX * tileSize, y * tileSize);
          ctx.stroke();
        }
        
        // Draw buildings
        if ($gameState.buildings && $gameState.buildings.length > 0) {
          for (const building of $gameState.buildings) {
            drawBuilding(ctx, building, selectedBuilding === building);
          }
        }
        
        // Draw building placement preview
        if (isPlacementMode && selectedBuildingType) {
          // Draw a preview of the building at hover position
          const previewBuilding = {
            type: selectedBuildingType,
            position: hoverPosition,
            isPreview: true
          };
          
          // Show placement preview with semi-transparency
          ctx.globalAlpha = 0.6;
          drawBuilding(ctx, previewBuilding, false);
          ctx.globalAlpha = 1.0;
        }
        
        // Draw planet information
        ctx.fillStyle = 'white';
        ctx.font = '18px Arial';
        ctx.fillText(`Planet: ${$gameState.map.name}`, 10, maxTilesY * tileSize + 25);
        ctx.fillText(`Type: ${$gameState.planetType}`, 10, maxTilesY * tileSize + 45);
        ctx.fillText(`Size: ${$gameState.map.width}x${$gameState.map.height}`, 10, maxTilesY * tileSize + 65);
        
        // Draw building info if selected
        if (selectedBuilding) {
          const infoX = 10;
          const infoY = maxTilesY * tileSize + 100;
          
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillRect(infoX - 5, infoY - 20, 250, 100);
          
          ctx.fillStyle = '#3498db';
          ctx.font = '16px Arial';
          ctx.fillText(`Selected: ${selectedBuilding.type}`, infoX, infoY);
          ctx.fillStyle = 'white';
          ctx.font = '14px Arial';
          ctx.fillText(`ID: ${selectedBuilding.id}`, infoX, infoY + 20);
          ctx.fillText(`Position: (${Math.round(selectedBuilding.position.x)}, ${Math.round(selectedBuilding.position.y)})`, infoX, infoY + 40);
          ctx.fillText(`Status: ${selectedBuilding.isActive ? 'Active' : 'Inactive'}`, infoX, infoY + 60);
        }
        
        // Draw mode indicator
        const modeText = isPlacementMode ? `Placement Mode: ${selectedBuildingType || 'None'}` : 'Selection Mode';
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText(modeText, canvas.width - 250, 30);
        
      } else {
        // Draw a test pattern if no map is available
        console.log("No map data available, drawing test pattern");
        
        // Draw a grid
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 1;
        
        const gridSize = 32;
        for (let x = 0; x < canvas.width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        
        for (let y = 0; y < canvas.height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
        
        // Draw text
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText('Debug Canvas View', 50, 50);
        ctx.fillText('No map data available', 50, 100);
        
        if (gameSettings) {
          ctx.fillText(`Attempted Planet Type: ${gameSettings.planetType}`, 50, 150);
        }
      }
      
      console.log("Canvas initialized and drawn");
    } catch (err) {
      console.error("Error initializing canvas:", err);
    }
  }
  
  // Helper function to draw a building
  function drawBuilding(ctx: CanvasRenderingContext2D, building: any, isSelected: boolean) {
    const size = 30;
    const x = building.position.x;
    const y = building.position.y;
    
    // Get color based on building type
    let color = '#3498db'; // default blue
    switch (building.type) {
      case 'extractor':
        color = '#3498db'; // blue
        break;
      case 'storage':
        color = '#f1c40f'; // yellow
        break;
      case 'powerPlant':
        color = '#2ecc71'; // green
        break;
      case 'reactor':
        color = '#e74c3c'; // red
        break;
      case 'pipe':
        color = '#95a5a6'; // gray
        break;
    }
    
    // Draw different shapes based on building type
    ctx.fillStyle = color;
    
    switch (building.type) {
      case 'extractor':
        // Circle
        ctx.beginPath();
        ctx.arc(x, y, size/2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'storage':
        // Square
        ctx.fillRect(x - size/2, y - size/2, size, size);
        break;
      case 'powerPlant':
        // Triangle
        ctx.beginPath();
        ctx.moveTo(x, y - size/2);
        ctx.lineTo(x + size/2, y + size/2);
        ctx.lineTo(x - size/2, y + size/2);
        ctx.closePath();
        ctx.fill();
        break;
      case 'reactor':
        // Diamond
        ctx.beginPath();
        ctx.moveTo(x, y - size/2);
        ctx.lineTo(x + size/2, y);
        ctx.lineTo(x, y + size/2);
        ctx.lineTo(x - size/2, y);
        ctx.closePath();
        ctx.fill();
        break;
      case 'pipe':
        // Line (would connect to other buildings)
        ctx.lineWidth = 6;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x - size/2, y);
        ctx.lineTo(x + size/2, y);
        ctx.stroke();
        break;
      default:
        // Default square
        ctx.fillRect(x - size/2, y - size/2, size, size);
    }
    
    // Draw selection outline if selected
    if (isSelected) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, size/2 + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Draw inactive indicator if building is not active
    if (building.isActive === false) {
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 2;
      
      // Draw X over building
      ctx.beginPath();
      ctx.moveTo(x - size/2, y - size/2);
      ctx.lineTo(x + size/2, y + size/2);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(x + size/2, y - size/2);
      ctx.lineTo(x - size/2, y + size/2);
      ctx.stroke();
    }
  }
  
  onMount(() => {
    console.log("App component mounted");
    
    // Check if we should initialize the canvas if game is already visible
    if (showGame) {
      console.log("Game is visible on mount, initializing canvas");
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const canvas = document.getElementById('basic-canvas');
        if (canvas) {
          console.log("Canvas found on mount, initializing");
          initializeCanvas();
        } else {
          console.error("Canvas not found on mount");
        }
      }, 500);
    }
  });
  
  afterUpdate(() => {
    console.log("App component updated, checking for canvas");
    canvasElement = document.getElementById('basic-canvas') as HTMLCanvasElement;
    if (canvasElement && showGame) {
      console.log("Canvas found after update:", canvasElement.id);
      initializeCanvas();
    }
  });
</script>

<main class="app">
  <!-- MENU SCENE - Always render, control visibility with CSS -->
  <div class="scene menu-scene" style="display: {showMainMenu ? 'block' : 'none'}">
    <MainMenu 
      on:startGame={handleStartGame}
      on:loadGame={handleLoadGame}
    />
  </div>
  
  <!-- GAME SCENE - Always render, control visibility with CSS -->
  <div class="scene game-scene" style="display: {showGame ? 'flex' : 'none'}">
    <div class="game-content">
      <canvas 
        id="basic-canvas" 
        width="1000" 
        height="800"
        on:click={handleCanvasClick}
        on:mousemove={handleCanvasHover}
      ></canvas>
      
      <!-- Game UI Overlay -->
      <div class="game-ui">
        <div class="top-bar">
          <h2 class="planet-name">
            {$gameState.map?.name || 'Unknown Planet'} 
            ({gameSettings?.planetType || 'unknown'})
          </h2>
          <button class="menu-button" on:click={handleBackToMenu}>Back to Menu</button>
        </div>
        
        <!-- Building Selection Toolbar -->
        <div class="building-toolbar">
          <div class="building-category">Basic</div>
          <div class="building-buttons">
            <button 
              class="building-button" 
              class:selected={selectedBuildingType === 'extractor'}
              on:click={() => selectBuildingType('extractor')}
              title="Extractor - Mines resources"
            >
              <div class="building-icon extractor"></div>
              <span>Extractor</span>
            </button>
            
            <button 
              class="building-button" 
              class:selected={selectedBuildingType === 'storage'}
              on:click={() => selectBuildingType('storage')}
              title="Storage - Stores resources"
            >
              <div class="building-icon storage"></div>
              <span>Storage</span>
            </button>
            
            <button 
              class="building-button" 
              class:selected={selectedBuildingType === 'powerPlant'}
              on:click={() => selectBuildingType('powerPlant')}
              title="Power Plant - Generates energy"
            >
              <div class="building-icon power-plant"></div>
              <span>Power</span>
            </button>
          </div>
          
          <div class="building-category">Production</div>
          <div class="building-buttons">
            <button 
              class="building-button" 
              class:selected={selectedBuildingType === 'reactor'}
              on:click={() => selectBuildingType('reactor')}
              title="Reactor - Processes resources"
            >
              <div class="building-icon reactor"></div>
              <span>Reactor</span>
            </button>
            
            <button 
              class="building-button" 
              class:selected={selectedBuildingType === 'pipe'}
              on:click={() => selectBuildingType('pipe')}
              title="Pipe - Transfers resources"
            >
              <div class="building-icon pipe"></div>
              <span>Pipe</span>
            </button>
          </div>
          
          <!-- Mode Controls -->
          <div class="mode-controls">
            <button 
              class="mode-button" 
              class:active={!isPlacementMode}
              on:click={() => setPlacementMode(false)}
              title="Select buildings"
            >
              <span>Select</span>
            </button>
            
            <button 
              class="mode-button" 
              class:active={isPlacementMode}
              on:click={() => setPlacementMode(true)}
              title="Place buildings"
            >
              <span>Place</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  {#if debugMode}
    <div class="debug-panel">
      <h3>Debug Panel</h3>
      <button on:click={handleToggleMenu}>
        Toggle Menu
      </button>
      <button on:click={handleToggleGame}>
        Toggle Game
      </button>
      <pre>
        State: 
        showMainMenu: {showMainMenu}
        showGame: {showGame}
        settings: {JSON.stringify(gameSettings, null, 2)}
        
        Game State:
        Map Name: {$gameState.map?.name || 'Not generated yet'}
        Planet Type: {$gameState.planetType || 'None'}
        Buildings: {$gameState.buildings?.length || 0}
        Map Available: {$gameState.map ? 'Yes' : 'No'}
        Map Tiles: {$gameState.map?.tiles ? 'Yes (' + $gameState.map.tiles.length + ' rows)' : 'No'}
        Resources: {JSON.stringify($gameState.resources, null, 2)}
      </pre>
      
      <div class="debug-actions">
        <button on:click={() => forceSaveGame()}>Force Save Game State</button>
        <button on:click={() => forceLoadGame()}>Force Restore Game State</button>
      </div>
    </div>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    background-color: #0f0f1e;
    color: white;
    overflow: hidden;
  }
  
  .app {
    width: 100%;
    height: 100vh;
    overflow: hidden;
    position: relative;
  }
  
  /* Scene Management */
  .scene {
    width: 100%;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 10;
    transition: opacity 0.3s ease;
  }
  
  .menu-scene {
    background-color: #0f0f1e;
    opacity: 1;
  }
  
  .game-scene {
    background-color: #1a1a2e;
    display: flex;
    flex-direction: column;
    opacity: 1;
  }
  
  .game-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
  }
  
  /* Game UI */
  .game-ui {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    pointer-events: none;
  }
  
  .game-ui .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
  }
  
  .planet-name {
    margin: 0;
    font-size: 1.2rem;
    color: #3498db;
  }
  
  .menu-button {
    pointer-events: auto;
    background-color: #e74c3c;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }
  
  /* Building toolbar */
  .building-toolbar {
    position: absolute;
    left: 10px;
    top: 60px;
    width: 200px;
    background-color: rgba(0, 0, 0, 0.7);
    border-radius: 8px;
    padding: 10px;
    color: white;
    backdrop-filter: blur(5px);
    pointer-events: auto;
  }
  
  .building-category {
    font-weight: bold;
    color: #3498db;
    margin: 5px 0;
    padding-bottom: 3px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .building-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-bottom: 15px;
  }
  
  .building-button {
    background-color: rgba(52, 73, 94, 0.7);
    border: 1px solid #2c3e50;
    border-radius: 4px;
    padding: 5px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 60px;
    height: 70px;
    font-size: 11px;
    transition: all 0.2s ease;
  }
  
  .building-button:hover {
    background-color: rgba(52, 73, 94, 0.9);
    transform: translateY(-2px);
  }
  
  .building-button.selected {
    background-color: #3498db;
    box-shadow: 0 0 10px rgba(52, 152, 219, 0.7);
  }
  
  .building-icon {
    width: 30px;
    height: 30px;
    margin-bottom: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* Building icons */
  .extractor {
    background-color: #3498db;
    border-radius: 50%;
  }
  
  .storage {
    background-color: #f1c40f;
  }
  
  .power-plant {
    width: 0;
    height: 0;
    border-left: 15px solid transparent;
    border-right: 15px solid transparent;
    border-bottom: 30px solid #2ecc71;
    margin-bottom: -5px;
  }
  
  .reactor {
    width: 30px;
    height: 30px;
    background-color: #e74c3c;
    transform: rotate(45deg);
  }
  
  .pipe {
    width: 30px;
    height: 6px;
    background-color: #95a5a6;
  }
  
  /* Mode controls */
  .mode-controls {
    display: flex;
    justify-content: space-between;
    gap: 5px;
  }
  
  .mode-button {
    flex: 1;
    background-color: #34495e;
    color: white;
    border: none;
    padding: 8px 0;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }
  
  .mode-button.active {
    background-color: #2ecc71;
  }
  
  canvas {
    border: 2px solid #3498db;
    background-color: #0f0f1e;
    max-width: 90vw;
    max-height: 70vh;
    box-shadow: 0 0 20px rgba(52, 152, 219, 0.5);
  }
  
  .canvas-text, .planet-info {
    color: white;
    font-size: 16px;
    margin-top: 10px;
    text-align: center;
  }
  
  .planet-info {
    color: #3498db;
    font-weight: bold;
  }
  
  .debug-panel {
    position: fixed;
    bottom: 0;
    right: 0;
    background-color: rgba(0, 0, 0, 0.8);
    padding: 10px;
    border-top-left-radius: 5px;
    z-index: 1000;
    max-width: 400px;
    font-size: 12px;
  }
  
  .debug-panel button {
    margin: 5px;
    padding: 4px 8px;
    font-size: 12px;
    background-color: #2c3e50;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
  }
  
  .debug-panel button:hover {
    background-color: #3498db;
  }
  
  .debug-panel pre {
    max-height: 250px;
    overflow: auto;
    font-size: 10px;
    background-color: rgba(0, 0, 0, 0.3);
    padding: 8px;
    border-radius: 3px;
  }
  
  .debug-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 10px;
  }
  
  .debug-actions button {
    background-color: #27ae60;
    flex: 1;
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

# frontend/src/components/debug/TileDisplay.svelte

```svelte
// frontend/src/components/debug/TileDisplay.svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { TerrainType, ResourceType } from '$lib/mapGenerator';
  
  // Props
  export let showTerrainTiles = true;
  export let showResourceTiles = true;
  export let showBuildingTiles = true;
  export let tileSize = 32;
  
  // Tile image reference
  let terrainTileset: HTMLImageElement;
  let resourceTileset: HTMLImageElement;
  let buildingTileset: HTMLImageElement;
  
  // Canvas reference
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  
  // Displayed tiles
  const terrainTypes = Object.values(TerrainType).filter(v => typeof v === 'number');
  const resourceTypes = Object.values(ResourceType).filter(v => typeof v === 'number');
  
  // Building types (matching the ones in our game)
  const buildingTypes = [
    { id: 'extractor', name: 'Extractor' },
    { id: 'reactor', name: 'Chemical Reactor' },
    { id: 'powerPlant', name: 'Power Plant' }
  ];
  
  // Canvas dimensions based on what we're showing
  $: canvasWidth = 16 * tileSize; // 16 tiles per row
  $: canvasHeight = calculateCanvasHeight();
  
  function calculateCanvasHeight() {
    let rows = 0;
    if (showTerrainTiles) rows += Math.ceil(terrainTypes.length / 16);
    if (showResourceTiles) rows += Math.ceil(resourceTypes.length / 16);
    if (showBuildingTiles) rows += Math.ceil(buildingTypes.length / 16);
    
    return rows * tileSize + (rows > 0 ? (rows - 1) * 20 : 0);
  }
  
  // Load tilesets
  onMount(() => {
    ctx = canvas.getContext('2d');
    
    // Load terrain tileset
    terrainTileset = new Image();
    terrainTileset.src = 'assets/sprites/terrain/terrain_tileset.png';
    terrainTileset.onload = renderTiles;
    
    // Load resource tileset
    resourceTileset = new Image();
    resourceTileset.src = 'assets/sprites/resources/resource_tileset.png';
    resourceTileset.onload = renderTiles;
    
    // Load building tileset
    buildingTileset = new Image();
    buildingTileset.src = 'assets/sprites/buildings/building_tileset.png';
    buildingTileset.onload = renderTiles;
    
    return () => {
      // Cleanup if needed
    };
  });
  
  // Render all the tiles
  function renderTiles() {
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    let yOffset = 0;
    
    // Render terrain tiles
    if (showTerrainTiles && terrainTileset && terrainTileset.complete) {
      renderTerrainTiles(yOffset);
      yOffset += Math.ceil(terrainTypes.length / 16) * tileSize + 20;
    }
    
    // Render resource tiles
    if (showResourceTiles && resourceTileset && resourceTileset.complete) {
      renderResourceTiles(yOffset);
      yOffset += Math.ceil(resourceTypes.length / 16) * tileSize + 20;
    }
    
    // Render building tiles
    if (showBuildingTiles && buildingTileset && buildingTileset.complete) {
      renderBuildingTiles(yOffset);
    }
  }
  
  // Render terrain tiles section
  function renderTerrainTiles(yOffset: number) {
    // Draw section header
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = 'white';
    ctx.fillText('Terrain Tiles', 10, yOffset - 5);
    
    // Draw tiles
    terrainTypes.forEach((terrainType, index) => {
      const row = Math.floor(index / 16);
      const col = index % 16;
      
      // Position on our canvas
      const x = col * tileSize;
      const y = yOffset + row * tileSize;
      
      // Position in the tileset (simplified mapping)
      const srcX = (terrainType % 16) * tileSize;
      const srcY = Math.floor(terrainType / 16) * tileSize;
      
      // Draw the tile
      ctx.drawImage(
        terrainTileset,
        srcX, srcY, tileSize, tileSize,
        x, y, tileSize, tileSize
      );
      
      // Draw tile index
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(x, y, tileSize, 16);
      ctx.fillStyle = 'white';
      ctx.font = '10px monospace';
      ctx.fillText(TerrainType[terrainType], x + 2, y + 12);
    });
  }
  
  // Render resource tiles section
  function renderResourceTiles(yOffset: number) {
    // Draw section header
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = 'white';
    ctx.fillText('Resource Tiles', 10, yOffset - 5);
    
    // Draw tiles
    resourceTypes.forEach((resourceType, index) => {
      if (resourceType === ResourceType.NONE) return; // Skip NONE type
      
      const row = Math.floor(index / 16);
      const col = index % 16;
      
      // Position on our canvas
      const x = col * tileSize;
      const y = yOffset + row * tileSize;
      
      // Draw a background for clarity (resources are often transparent)
      ctx.fillStyle = '#333';
      ctx.fillRect(x, y, tileSize, tileSize);
      
      // Position in the tileset (simplified mapping)
      // Resources typically start after terrain tiles
      const srcX = (resourceType % 16) * tileSize;
      const srcY = (Math.floor(resourceType / 16) + terrainTypes.length / 16) * tileSize;
      
      // Draw the tile
      ctx.drawImage(
        resourceTileset,
        srcX, srcY, tileSize, tileSize,
        x, y, tileSize, tileSize
      );
      
      // Draw resource name
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(x, y, tileSize, 16);
      ctx.fillStyle = 'white';
      ctx.font = '10px monospace';
      ctx.fillText(ResourceType[resourceType], x + 2, y + 12);
    });
  }
  
  // Render building tiles section
  function renderBuildingTiles(yOffset: number) {
    // Draw section header
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = 'white';
    ctx.fillText('Building Tiles', 10, yOffset - 5);
    
    // Draw tiles
    buildingTypes.forEach((building, index) => {
      const row = Math.floor(index / 16);
      const col = index % 16;
      
      // Position on our canvas
      const x = col * tileSize;
      const y = yOffset + row * tileSize;
      
      // Draw a background for clarity
      ctx.fillStyle = '#333';
      ctx.fillRect(x, y, tileSize, tileSize);
      
      // In a real implementation, we'd use actual building sprites
      // For now, draw placeholder colored squares
      ctx.fillStyle = getBuildingColor(building.id);
      ctx.fillRect(x + 4, y + 4, tileSize - 8, tileSize - 8);
      
      // Draw building name
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(x, y, tileSize, 16);
      ctx.fillStyle = 'white';
      ctx.font = '10px monospace';
      ctx.fillText(building.id, x + 2, y + 12);
    });
  }
  
  // Get building color based on type
  function getBuildingColor(type: string): string {
    switch (type) {
      case 'extractor': return '#3498db';
      case 'reactor': return '#e74c3c';
      case 'powerPlant': return '#2ecc71';
      default: return '#bdc3c7';
    }
  }
</script>

<div class="tile-display">
  <div class="controls">
    <label>
      <input type="checkbox" bind:checked={showTerrainTiles}>
      Terrain Tiles
    </label>
    
    <label>
      <input type="checkbox" bind:checked={showResourceTiles}>
      Resource Tiles
    </label>
    
    <label>
      <input type="checkbox" bind:checked={showBuildingTiles}>
      Building Tiles
    </label>
    
    <label>
      Tile Size:
      <input type="range" min="16" max="64" step="16" bind:value={tileSize}>
      {tileSize}px
    </label>
  </div>
  
  <div class="canvas-container">
    <canvas 
      bind:this={canvas}
      width={canvasWidth}
      height={canvasHeight}
    ></canvas>
  </div>
</div>

<style>
  .tile-display {
    background-color: #1a1a2e;
    border-radius: 4px;
    padding: 16px;
    color: white;
  }
  
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 16px;
  }
  
  label {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .canvas-container {
    background-color: #0f0f1e;
    border-radius: 4px;
    padding: 16px;
    overflow: auto;
  }
  
  canvas {
    display: block;
  }
</style>
```

# frontend/src/components/ui/BuildingControlPanel.svelte

```svelte
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { gameState } from '../../stores/gameState';
    
    // Event dispatcher
    const dispatch = createEventDispatcher();
    
    // Available building types
    const buildingTypes = [
      { id: 'extractor', name: 'Extractor', description: 'Extracts resources from the environment', cost: { energy: 100 } },
      { id: 'storage', name: 'Storage', description: 'Stores resources for later use', cost: { energy: 80 } },
      { id: 'reactor', name: 'Chemical Reactor', description: 'Combines chemicals to create reactions', cost: { energy: 200, methane: 50 } },
      { id: 'powerPlant', name: 'Power Plant', description: 'Generates energy from fuel', cost: { energy: 150 } },
      { id: 'pipe', name: 'Pipe', description: 'Connects buildings to transfer resources', cost: { energy: 20 } }
    ];
    
    // Resources required to build
    function canBuild(buildingType) {
      const building = buildingTypes.find(b => b.id === buildingType);
      if (!building) return false;
      
      // Check if we have enough resources
      for (const [resource, amount] of Object.entries(building.cost)) {
        if (!$gameState.resources || $gameState.resources[resource] < amount) {
          return false;
        }
      }
      
      return true;
    }
    
    // Start building placement
    function selectBuilding(buildingType) {
      // Check if we can afford it
      if (!canBuild(buildingType)) {
        console.warn(`Not enough resources to build ${buildingType}`);
        return;
      }
      
      // Dispatch the select event to parent
      dispatch('select', { type: buildingType });
      
      console.log(`Selected building type: ${buildingType}`);
    }
    
    // Function to get color for building icon
    function getBuildingColor(buildingType) {
      switch (buildingType) {
        case 'extractor': return '#3498db';
        case 'storage': return '#f1c40f';
        case 'reactor': return '#e74c3c';
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
        on:click={() => selectBuilding(building.id)}
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

# frontend/src/components/ui/BuildingEfficiencyDisplay.svelte

```svelte
<script lang="ts">
    import { gameState } from '$lib/gameLoop';
    
    // Set up constants
    const KELVIN_TO_CELSIUS = 273.15;
    const PASCAL_TO_ATM = 101325;
    
    // Format temperature for display
    function formatTemperature(kelvin: number): string {
      return `${(kelvin - KELVIN_TO_CELSIUS).toFixed(1)}°C`;
    }
    
    // Format pressure for display
    function formatPressure(pascal: number): string {
      return `${(pascal / PASCAL_TO_ATM).toFixed(2)} atm`;
    }
    
    // Get efficiency color
    function getEfficiencyColor(efficiency: number): string {
      if (efficiency > 0.9) return '#2ecc71'; // Excellent (green)
      if (efficiency > 0.7) return '#27ae60'; // Good (darker green)
      if (efficiency > 0.5) return '#f39c12'; // Average (orange)
      if (efficiency > 0.3) return '#e67e22'; // Below average (darker orange)
      return '#e74c3c'; // Poor (red)
    }
    
    // Building type to friendly name
    function getBuildingTypeName(type: string): string {
      switch (type) {
        case 'extractor': return 'Resource Extractor';
        case 'reactor': return 'Chemical Reactor';
        case 'powerPlant': return 'Power Plant';
        default: return type.charAt(0).toUpperCase() + type.slice(1);
      }
    }
    
    // Get optimal temperature range for a building type
    function getOptimalTempRange(type: string): {min: number, max: number} {
      switch (type) {
        case 'extractor': return {min: 273, max: 293};
        case 'reactor': return {min: 430, max: 470};
        case 'powerPlant': return {min: 480, max: 520};
        default: return {min: 283, max: 303};
      }
    }
    
    // Get optimal pressure range for a building type
    function getOptimalPressureRange(type: string): {min: number, max: number} {
      switch (type) {
        case 'extractor': return {min: 90000, max: 110000};
        case 'reactor': return {min: 180000, max: 220000};
        case 'powerPlant': return {min: 90000, max: 110000};
        default: return {min: 90000, max: 110000};
      }
    }
    
    // Is this building in its optimal temperature range?
    function isTemperatureOptimal(building): boolean {
      const range = getOptimalTempRange(building.type);
      return building.temperature >= range.min && building.temperature <= range.max;
    }
    
    // Is this building in its optimal pressure range?
    function isPressureOptimal(building): boolean {
      const range = getOptimalPressureRange(building.type);
      return building.pressure >= range.min && building.pressure <= range.max;
    }
    
    // Whether to show the selected building details only or all buildings
    let showAllBuildings = false;
    
    // Get the selected building from game state
    $: selectedBuilding = $gameState.buildings.find(b => b.selected);
    
    // Buildings to display based on selection setting
    $: displayBuildings = showAllBuildings 
      ? $gameState.buildings 
      : (selectedBuilding ? [selectedBuilding] : []);
  </script>
  
  <div class="efficiency-display">
    <h2>Building Environment</h2>
    
    <div class="display-toggle">
      <button
        class:active={!showAllBuildings}
        on:click={() => showAllBuildings = false}
        disabled={!selectedBuilding && !showAllBuildings}
      >
        Selected Building
      </button>
      <button
        class:active={showAllBuildings}
        on:click={() => showAllBuildings = true}
      >
        All Buildings
      </button>
    </div>
    
    {#if displayBuildings.length === 0}
      <div class="no-selection">
        <p>Select a building to view its environmental data.</p>
      </div>
    {:else}
      <div class="buildings-list">
        {#each displayBuildings as building}
          <div class="building-card">
            <div class="building-header">
              <div class="building-icon" style="background-color: {getEfficiencyColor(building.efficiency)}"></div>
              <div class="building-title">
                <div class="building-type">{getBuildingTypeName(building.type)}</div>
                <div class="building-position">Position: ({building.position.x}, {building.position.y})</div>
              </div>
            </div>
            
            <div class="building-stats">
              <div class="stat">
                <div class="stat-label">Efficiency</div>
                <div class="stat-value" style="color: {getEfficiencyColor(building.efficiency)}">
                  {Math.round(building.efficiency * 100)}%
                </div>
              </div>
              
              <div class="stat">
                <div class="stat-label">Temperature</div>
                <div class="stat-value" class:optimal={isTemperatureOptimal(building)}>
                  {formatTemperature(building.temperature)}
                </div>
              </div>
              
              <div class="stat">
                <div class="stat-label">Pressure</div>
                <div class="stat-value" class:optimal={isPressureOptimal(building)}>
                  {formatPressure(building.pressure)}
                </div>
              </div>
            </div>
            
            <div class="building-advice">
              {#if !isTemperatureOptimal(building)}
                <div class="advice">
                  <span class="advice-icon">❗</span>
                  {building.temperature < getOptimalTempRange(building.type).min
                    ? `Temperature too low. Optimal range: ${formatTemperature(getOptimalTempRange(building.type).min)} to ${formatTemperature(getOptimalTempRange(building.type).max)}`
                    : `Temperature too high. Optimal range: ${formatTemperature(getOptimalTempRange(building.type).min)} to ${formatTemperature(getOptimalTempRange(building.type).max)}`
                  }
                </div>
              {/if}
              
              {#if !isPressureOptimal(building)}
                <div class="advice">
                  <span class="advice-icon">❗</span>
                  {building.pressure < getOptimalPressureRange(building.type).min
                    ? `Pressure too low. Optimal range: ${formatPressure(getOptimalPressureRange(building.type).min)} to ${formatPressure(getOptimalPressureRange(building.type).max)}`
                    : `Pressure too high. Optimal range: ${formatPressure(getOptimalPressureRange(building.type).min)} to ${formatPressure(getOptimalPressureRange(building.type).max)}`
                  }
                </div>
              {/if}
              
              {#if isTemperatureOptimal(building) && isPressureOptimal(building)}
                <div class="advice optimal">
                  <span class="advice-icon">✓</span>
                  Operating under optimal conditions.
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
  
  <style>
    .efficiency-display {
      background-color: #2c3e50;
      border-radius: 4px;
      padding: 16px;
      color: white;
      width: 100%;
    }
    
    h2 {
      margin-top: 0;
      border-bottom: 1px solid #34495e;
      padding-bottom: 8px;
    }
    
    .display-toggle {
      display: flex;
      margin-bottom: 16px;
    }
    
    .display-toggle button {
      flex: 1;
      background-color: #34495e;
      border: none;
      color: #bdc3c7;
      padding: 8px 0;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .display-toggle button:first-child {
      border-radius: 4px 0 0 4px;
    }
    
    .display-toggle button:last-child {
      border-radius: 0 4px 4px 0;
    }
    
    .display-toggle button.active {
      background-color: #3498db;
      color: white;
    }
    
    .display-toggle button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .no-selection {
      background-color: #34495e;
      padding: 16px;
      border-radius: 4px;
      text-align: center;
      color: #bdc3c7;
    }
    
    .buildings-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 400px;
      overflow-y: auto;
    }
    
    .building-card {
      background-color: #34495e;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .building-header {
      display: flex;
      align-items: center;
      padding: 12px;
      background-color: rgba(0, 0, 0, 0.2);
    }
    
    .building-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      margin-right: 12px;
    }
    
    .building-type {
      font-weight: bold;
    }
    
    .building-position {
      font-size: 12px;
      color: #bdc3c7;
    }
    
    .building-stats {
      display: flex;
      border-bottom: 1px solid rgba(0, 0, 0, 0.2);
    }
    
    .stat {
      flex: 1;
      padding: 12px;
      text-align: center;
      border-right: 1px solid rgba(0, 0, 0, 0.2);
    }
    
    .stat:last-child {
      border-right: none;
    }
    
    .stat-label {
      font-size: 12px;
      color: #bdc3c7;
      margin-bottom: 4px;
    }
    
    .stat-value {
      font-size: 16px;
      font-weight: bold;
    }
    
    .stat-value.optimal {
      color: #2ecc71;
    }
    
    .building-advice {
      padding: 12px;
    }
    
    .advice {
      font-size: 14px;
      padding: 4px 8px;
      background-color: rgba(231, 76, 60, 0.2);
      border-radius: 4px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
    }
    
    .advice.optimal {
      background-color: rgba(46, 204, 113, 0.2);
    }
    
    .advice-icon {
      margin-right: 8px;
      font-size: 16px;
    }
  </style>
```

# frontend/src/components/ui/EnvironmentControlPanel.svelte

```svelte
<script lang="ts">
    import { gameState } from '$lib/gameLoop';
    import { WeatherCondition } from '$lib/gameLoop';
    
    // Constants for temperature and pressure conversion
    const KELVIN_TO_CELSIUS = 273.15;
    const PASCAL_TO_ATM = 101325;
    
    // Formatted temperature display
    function formatTemperature(kelvin: number): string {
      const celsius = kelvin - KELVIN_TO_CELSIUS;
      return `${celsius.toFixed(1)}°C (${kelvin.toFixed(1)} K)`;
    }
    
    // Formatted pressure display
    function formatPressure(pascal: number): string {
      const atm = pascal / PASCAL_TO_ATM;
      return `${atm.toFixed(2)} atm (${(pascal / 1000).toFixed(1)} kPa)`;
    }
    
    // Calculate efficiency based on temperature and pressure
    function calculateEfficiency(temp: number, pressure: number): number {
      // Simplified model - could be much more complex based on your game mechanics
      const optimalTemp = 400; // Example: 400K is optimal
      const optimalPressure = 200000; // Example: 2 bar is optimal
      
      const tempFactor = 1 - Math.min(Math.abs(temp - optimalTemp) / 200, 0.8);
      const pressureFactor = 1 - Math.min(Math.abs(pressure - optimalPressure) / 100000, 0.8);
      
      return Math.round((tempFactor * pressureFactor) * 100);
    }
    
    // Environment control functions
    function increaseTemperature() {
      gameState.update(state => {
        state.temperature += 10;
        return state;
      });
    }
    
    function decreaseTemperature() {
      gameState.update(state => {
        // Don't go below absolute zero
        state.temperature = Math.max(state.temperature - 10, 0);
        return state;
      });
    }
    
    function increasePressure() {
      gameState.update(state => {
        state.pressure *= 1.2; // Increase by 20%
        return state;
      });
    }
    
    function decreasePressure() {
      gameState.update(state => {
        state.pressure /= 1.2; // Decrease by 20%
        return state;
      });
    }
    
    // Get color based on temperature
    function getTempColor(kelvin: number): string {
      // Blue for cold, red for hot
      if (kelvin < 273) return '#3498db'; // Very cold
      if (kelvin < 300) return '#2980b9'; // Cold
      if (kelvin < 400) return '#27ae60'; // Normal
      if (kelvin < 600) return '#f39c12'; // Hot
      return '#e74c3c'; // Very hot
    }
    
    // Get color based on pressure
    function getPressureColor(pascal: number): string {
      // Light for low pressure, dark for high pressure
      const atm = pascal / PASCAL_TO_ATM;
      if (atm < 0.5) return '#3498db'; // Very low
      if (atm < 0.9) return '#2980b9'; // Low
      if (atm < 1.1) return '#27ae60'; // Normal
      if (atm < 2.0) return '#f39c12'; // High
      return '#e74c3c'; // Very high
    }
    
    // Change weather (for testing)
    function changeWeather() {
      gameState.update(state => {
        const weatherTypes = Object.values(WeatherCondition);
        const currentIndex = weatherTypes.indexOf(state.weather);
        const nextIndex = (currentIndex + 1) % weatherTypes.length;
        state.weather = weatherTypes[nextIndex];
        return state;
      });
    }
    
    // Simulate day/night cycle
    function adjustTimeOfDay(amount) {
      gameState.update(state => {
        state.timeOfDay = (state.timeOfDay + amount) % 24;
        return state;
      });
    }
  </script>
  
  <div class="environment-panel">
    <h2>Environment Controls</h2>
    
    <div class="environment-gauges">
      <div class="gauge temperature" style="--gauge-color: {getTempColor($gameState.temperature)}">
        <div class="gauge-title">Temperature</div>
        <div class="gauge-value">{formatTemperature($gameState.temperature)}</div>
        <div class="gauge-bar">
          <div 
            class="gauge-fill" 
            style="width: {Math.min(100, ($gameState.temperature / 1000) * 100)}%"
          ></div>
        </div>
        <div class="gauge-controls">
          <button on:click={decreaseTemperature}>-</button>
          <button on:click={increaseTemperature}>+</button>
        </div>
      </div>
      
      <div class="gauge pressure" style="--gauge-color: {getPressureColor($gameState.pressure)}">
        <div class="gauge-title">Pressure</div>
        <div class="gauge-value">{formatPressure($gameState.pressure)}</div>
        <div class="gauge-bar">
          <div 
            class="gauge-fill" 
            style="width: {Math.min(100, ($gameState.pressure / 500000) * 100)}%"
          ></div>
        </div>
        <div class="gauge-controls">
          <button on:click={decreasePressure}>-</button>
          <button on:click={increasePressure}>+</button>
        </div>
      </div>
    </div>
    
    <div class="environment-controls">
      <div class="control-group">
        <h3>Weather</h3>
        <div class="weather-display">
          <div class="weather-icon">
            {#if $gameState.weather === 'Clear'}
              ☀️
            {:else if $gameState.weather === 'Cloudy'}
              ☁️
            {:else if $gameState.weather === 'Stormy'}
              ⛈️
            {:else if $gameState.weather === 'Cold'}
              ❄️
            {:else if $gameState.weather === 'Hot'}
              🔥
            {/if}
          </div>
          <div class="weather-name">{$gameState.weather}</div>
        </div>
        <button class="weather-button" on:click={changeWeather}>Change Weather</button>
      </div>
      
      <div class="control-group">
        <h3>Time of Day</h3>
        <div class="time-display">
          <div class="time-icon">
            {#if $gameState.timeOfDay >= 6 && $gameState.timeOfDay < 18}
              {#if $gameState.timeOfDay >= 6 && $gameState.timeOfDay < 10}
                🌅
              {:else if $gameState.timeOfDay >= 10 && $gameState.timeOfDay < 16}
                ☀️
              {:else}
                🌇
              {/if}
            {:else}
              {#if $gameState.timeOfDay >= 18 && $gameState.timeOfDay < 22}
                🌙
              {:else}
                🌚
              {/if}
            {/if}
          </div>
          <div class="time-value">
            {Math.floor($gameState.timeOfDay)}:{(($gameState.timeOfDay % 1) * 60).toFixed(0).padStart(2, '0')}
            {$gameState.timeOfDay >= 12 ? 'PM' : 'AM'}
          </div>
        </div>
        <div class="time-controls">
          <button on:click={() => adjustTimeOfDay(-1)}>◀</button>
          <div class="time-slider">
            <div 
              class="time-marker" 
              style="left: {($gameState.timeOfDay / 24) * 100}%"
            ></div>
          </div>
          <button on:click={() => adjustTimeOfDay(1)}>▶</button>
        </div>
      </div>
    </div>
    
    <div class="efficiency-display">
      <h3>Reaction Efficiency</h3>
      <div class="efficiency-meter">
        <div 
          class="efficiency-value"
          class:optimal={calculateEfficiency($gameState.temperature, $gameState.pressure) > 90}
          class:good={calculateEfficiency($gameState.temperature, $gameState.pressure) > 70 && calculateEfficiency($gameState.temperature, $gameState.pressure) <= 90}
          class:average={calculateEfficiency($gameState.temperature, $gameState.pressure) > 40 && calculateEfficiency($gameState.temperature, $gameState.pressure) <= 70}
          class:poor={calculateEfficiency($gameState.temperature, $gameState.pressure) <= 40}
        >
          {calculateEfficiency($gameState.temperature, $gameState.pressure)}%
        </div>
      </div>
      <div class="efficiency-info">
        <p>Current conditions {calculateEfficiency($gameState.temperature, $gameState.pressure) > 70 ? 'are favorable' : 'need adjustment'} for optimal reactions.</p>
      </div>
    </div>
    
    <div class="environment-tips">
      <h3>Tips</h3>
      <ul>
        {#if $gameState.temperature < 300}
          <li>Low temperature slows reactions but may increase yield for exothermic reactions.</li>
        {:else if $gameState.temperature > 600}
          <li>High temperature increases reaction rates but may damage some buildings.</li>
        {/if}
        
        {#if $gameState.pressure < 90000}
          <li>Low pressure is suitable for gas-producing reactions.</li>
        {:else if $gameState.pressure > 200000}
          <li>High pressure benefits reactions that reduce the number of molecules.</li>
        {/if}
      </ul>
    </div>
  </div>
  
  <style>
    .environment-panel {
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
    
    .environment-gauges {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .gauge {
      background-color: #34495e;
      border-radius: 4px;
      padding: 12px;
    }
    
    .gauge-title {
      font-weight: bold;
      margin-bottom: 4px;
    }
    
    .gauge-value {
      font-size: 18px;
      font-family: monospace;
      margin-bottom: 8px;
      color: var(--gauge-color, white);
    }
    
    .gauge-bar {
      height: 8px;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    
    .gauge-fill {
      height: 100%;
      background-color: var(--gauge-color, #3498db);
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    
    .gauge-controls {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    
    .gauge-controls button {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: bold;
      background-color: rgba(0, 0, 0, 0.2);
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .gauge-controls button:hover {
      background-color: rgba(0, 0, 0, 0.4);
    }
    
    .environment-controls {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .control-group {
      flex: 1;
      background-color: #34495e;
      border-radius: 4px;
      padding: 12px;
    }
    
    .weather-display {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 12px 0;
      gap: 8px;
    }
    
    .weather-icon {
      font-size: 24px;
    }
    
    .weather-name {
      font-size: 18px;
      font-weight: bold;
    }
    
    .weather-button {
      width: 100%;
      background-color: rgba(0, 0, 0, 0.2);
      border: none;
      border-radius: 4px;
      padding: 8px;
      color: white;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .weather-button:hover {
      background-color: rgba(0, 0, 0, 0.4);
    }
    
    .time-display {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 12px 0;
      gap: 8px;
    }
    
    .time-icon {
      font-size: 24px;
    }
    
    .time-value {
      font-size: 18px;
      font-weight: bold;
      font-family: monospace;
    }
    
    .time-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .time-controls button {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(0, 0, 0, 0.2);
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .time-controls button:hover {
      background-color: rgba(0, 0, 0, 0.4);
    }
    
    .time-slider {
      flex: 1;
      height: 8px;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      position: relative;
    }
    
    .time-marker {
      position: absolute;
      top: -4px;
      width: 16px;
      height: 16px;
      background-color: #3498db;
      border-radius: 50%;
      transform: translateX(-8px);
      transition: left 0.3s ease;
    }
    
    .efficiency-display {
      background-color: #34495e;
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 16px;
    }
    
    .efficiency-meter {
      display: flex;
      justify-content: center;
      margin: 12px 0;
    }
    
    .efficiency-value {
      font-size: 32px;
      font-weight: bold;
      padding: 8px 16px;
      border-radius: 4px;
      background-color: rgba(0, 0, 0, 0.2);
    }
    
    .optimal {
      color: #2ecc71;
    }
    
    .good {
      color: #3498db;
    }
    
    .average {
      color: #f39c12;
    }
    
    .poor {
      color: #e74c3c;
    }
    
    .efficiency-info {
      text-align: center;
      font-size: 14px;
      color: #bdc3c7;
    }
    
    .environment-tips {
      background-color: #34495e;
      border-radius: 4px;
      padding: 12px;
    }
    
    .environment-tips ul {
      margin: 0;
      padding-left: 20px;
      font-size: 14px;
      color: #bdc3c7;
    }
    
    .environment-tips li {
      margin-bottom: 8px;
    }
  </style>
```

# frontend/src/components/ui/MainMenu.svelte

```svelte
<!-- frontend/src/components/ui/MainMenu.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { PlanetType } from '../../lib/types';
    
    const dispatch = createEventDispatcher();
    
    // Available planet types for selection
    const planetTypes = [
      { id: PlanetType.EARTH_LIKE, name: 'Earth-like', description: 'A planet with conditions similar to Earth' },
      { id: PlanetType.MARS_LIKE, name: 'Mars-like', description: 'A dry, cold planet with thin atmosphere' },
      { id: PlanetType.DESERT, name: 'Desert', description: 'A hot, arid world with vast wastelands' },
      { id: PlanetType.ICE, name: 'Ice', description: 'A frozen world with freezing temperatures' },
      { id: PlanetType.VOLCANIC, name: 'Volcanic', description: 'A world of lava and extreme heat' },
      { id: PlanetType.ALIEN, name: 'Alien', description: 'A bizarre world with strange properties' },
      { id: PlanetType.OCEAN, name: 'Ocean', description: 'A world covered mostly in water' }
    ];
    
    // Game settings
    let selectedPlanet = PlanetType.EARTH_LIKE;
    let mapSize = "medium";
    let resourceRichness = 0.5;
    let mapWidth = 100;
    let mapHeight = 100;
    
    // Update map size based on selection
    function updateMapSize(size: string) {
      mapSize = size;
      switch (size) {
        case "small":
          mapWidth = 50;
          mapHeight = 50;
          break;
        case "medium":
          mapWidth = 100;
          mapHeight = 100;
          break;
        case "large":
          mapWidth = 200;
          mapHeight = 200;
          break;
      }
    }
    
    // Start game with current settings
    function startGame() {
    console.log("startGame function called in MainMenu");
    const settings = {
      planetType: selectedPlanet,
      mapWidth,
      mapHeight,
      resourceRichness
    };
    console.log("Dispatching startGame event with settings:", settings);
    
    // Force event to dispatch synchronously to parent
    setTimeout(() => {
      dispatch('startGame', settings);
      console.log("Event dispatched from MainMenu");
    }, 0);
    
    // Log dispatch to help debug
    console.log("IMPORTANT: If you don't see handleStartGame logs in App.svelte within a second, the event handling is broken");
  }
    
    // Load a saved game
    function loadGame() {
      console.log("loadGame function called in MainMenu");
      
      // Force event to dispatch synchronously to parent
      setTimeout(() => {
        dispatch('loadGame');
        console.log("loadGame event dispatched from MainMenu");
      }, 0);
    }
  </script>
  
  <div class="main-menu">
  <div class="menu-container">
    <div class="game-title">
      <h1>FrankForge</h1>
      <div class="tagline">Build, React, Evolve</div>
    </div>
    
    <div class="menu-content">

      <div class="planet-selection">
        <h2>Select Planet</h2>
        <div class="planet-grid">
          {#each planetTypes as planet}
            <button 
              class="planet-card" 
              class:selected={selectedPlanet === planet.id}
              on:click={() => selectedPlanet = planet.id}
              type="button"
            >
              <div class="planet-icon" style={`background-color: ${getPlanetColor(planet.id)};`}></div>
              <div class="planet-details">
                <div class="planet-name">{planet.name}</div>
                <div class="planet-description">{planet.description}</div>
              </div>
            </button>
          {/each}
        </div>
      </div>
      
      <div class="game-settings">
        <h2>Game Settings</h2>
        
        <!-- Map Size Selection -->
        <div class="setting">
          <label>Map Size:</label>
          <div class="setting-options">
            <button 
              class:active={mapSize === "small"} 
              on:click={() => updateMapSize("small")}
            >
              Small (50×50)
            </button>
            <button 
              class:active={mapSize === "medium"} 
              on:click={() => updateMapSize("medium")}
            >
              Medium (100×100)
            </button>
            <button 
              class:active={mapSize === "large"} 
              on:click={() => updateMapSize("large")}
            >
              Large (200×200)
            </button>
          </div>
        </div>
        
        <!-- Resource Richness -->
        <div class="setting">
          <label for="resource-slider">Resource Richness: {Math.round(resourceRichness * 100)}%</label>
          <input 
            id="resource-slider"
            type="range" 
            min="0.1" 
            max="1" 
            step="0.1" 
            bind:value={resourceRichness} 
          />
        </div>
      </div>
      
      <!-- Action Buttons - Moved to the top for visibility -->
      <div class="menu-actions">
        <!-- Added type="button" to prevent form submission behavior -->
        <button type="button" class="primary-button" on:click={startGame}>
          Start New Game
        </button>
        <button type="button" class="secondary-button" on:click={loadGame}>
          Load Saved Game
        </button>
      </div>
    </div>
  </div>
</div>
  
  <style>
    .main-menu {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100vh;
      background-color: #0f0f1e;
      background-image: radial-gradient(circle at 50% 50%, #1a1a2e 0%, #0f0f1e 100%);
      color: white;
      overflow: auto;
    }
    
    .menu-container {
      width: 90%;
      max-width: 1080px;
      height: 90vh;
      overflow-y: auto;
      background-color: rgba(26, 26, 46, 0.8);
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      padding: 1.5rem;
    }
    
    .game-title {
      text-align: center;
      margin-bottom: 1.5rem;
    }
    
    h1 {
      font-size: 2.5rem;
      margin: 0;
      background: linear-gradient(90deg, #3498db, #2ecc71, #e74c3c);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }
    
    .tagline {
      font-size: 1rem;
      margin-top: 0.5rem;
      color: #bdc3c7;
    }
    
    .menu-content {
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
    }
    
    .planet-selection {
      margin-bottom: 0.5rem;
    }
    
    .planet-selection label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    
    .planet-selection select {
      width: 100%;
      padding: 0.6rem;
      background-color: #2c3e50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .planet-selection select option {
      background-color: #2c3e50;
      color: white;
    }
    
    .setting {
      margin-bottom: 0.8rem;
    }
    
    .setting label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    
    .setting-options {
      display: flex;
      gap: 0.5rem;
    }
    
    .setting-options button {
      flex: 1;
      background-color: #34495e;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 0.5rem;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .setting-options button:hover {
      background-color: #3d566e;
    }
    
    .setting-options button.active {
      background-color: #3498db;
    }
    
    input[type="range"] {
      width: 100%;
      background-color: #34495e;
      height: 8px;
      border-radius: 4px;
      -webkit-appearance: none;
    }
    
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background-color: #3498db;
      cursor: pointer;
    }
    
    .menu-actions {
      display: flex;
      gap: 0.8rem;
      margin-top: 1.5rem;
    }
    
    .primary-button, .secondary-button {
      flex: 1;
      padding: 0.8rem;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative; /* For the active state effect */
    }
    
    .primary-button {
      background-color: #2ecc71;
      color: white;
    }
    
    .primary-button:hover {
      background-color: #27ae60;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(39, 174, 96, 0.3);
    }
    
    .primary-button:active {
      transform: translateY(1px);
      box-shadow: 0 2px 3px rgba(39, 174, 96, 0.3);
    }
    
    .secondary-button {
      background-color: #7f8c8d;
      color: white;
    }
    
    .secondary-button:hover {
      background-color: #95a5a6;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(127, 140, 141, 0.3);
    }
    
    .secondary-button:active {
      transform: translateY(1px);
      box-shadow: 0 2px 3px rgba(127, 140, 141, 0.3);
    }
  </style>
  
  <script context="module">
    // Helper function to get a color for each planet type
    function getPlanetColor(planetType: PlanetType): string {
      switch (planetType) {
        case PlanetType.EARTH_LIKE:
          return '#27ae60'; // Green for Earth
        case PlanetType.MARS_LIKE:
          return '#d35400'; // Red-orange for Mars
        case PlanetType.DESERT:
          return '#f39c12'; // Yellow-orange for Desert
        case PlanetType.ICE:
          return '#3498db'; // Blue for Ice
        case PlanetType.VOLCANIC:
          return '#c0392b'; // Red for Volcanic
        case PlanetType.ALIEN:
          return '#8e44ad'; // Purple for Alien
        case PlanetType.OCEAN:
          return '#2980b9'; // Darker blue for Ocean
        default:
          return '#bdc3c7'; // Gray for unknown
      }
    }
  </script>
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
<!-- src/components/GameCanvas.svelte -->
<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import { gameState, startGameLoop, type Building } from '../../stores/gameState';
  
  // Canvas properties
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  
  // Use simpler fixed dimensions for troubleshooting
  let width = 800;
  let height = 600;
  
  // Flag to track initialization
  let isInitialized = false;
  let debugMessage = "Component created";
  
  // Resize canvas when window changes
  function handleResize() {
    width = window.innerWidth;
    height = window.innerHeight;
    if (canvas && ctx) {
      canvas.width = width;
      canvas.height = height;
    }
  }
  
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
    console.log("GameCanvas: onMount triggered");
    
    // Initialize canvas
    if (!canvas) {
      console.error("GameCanvas: Canvas element not found on mount");
      return;
    }
    
    // Set initial canvas size
    canvas.width = width;
    canvas.height = height;
    
    ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error("GameCanvas: Could not get canvas context");
      return;
    }
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Start render loop
    const renderLoopCleanup = startRenderLoop();
    
    // Start game loop
    const gameLoopCleanup = startGameLoop();
    
    console.log("GameCanvas: Render and game loops started");
    
    return () => {
      console.log("GameCanvas: Cleaning up");
      renderLoopCleanup();
      gameLoopCleanup();
      window.removeEventListener('resize', handleResize);
    };
  });
  
  function startRenderLoop() {
    let animationFrame: number;
    let renderCount = 0;
    
    const render = () => {
      if (!ctx || !canvas) {
        console.warn("GameCanvas: Canvas or context not available, skipping render");
        animationFrame = requestAnimationFrame(render);
        return;
      }
      
      try {
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
        
        // Draw buildings if they exist
        if ($gameState.buildings && Array.isArray($gameState.buildings)) {
          $gameState.buildings.forEach(building => {
            drawBuilding(building);
          });
          
          // Draw connections between buildings
          drawConnections();
        }
        
        // Draw placement preview if in placement mode
        if (placementMode) {
          drawPlacementPreview();
        }
        
        // Reset transform
        ctx.restore();
        
        // Draw UI elements that don't move with camera
        drawUI();
        
        // Log only the first few frames for debugging
        renderCount++;
        if (renderCount <= 5) {
          console.log(`GameCanvas: Rendered frame #${renderCount}`);
        }
        if (renderCount === 60) {
          console.log("GameCanvas: Render loop running at 60fps");
        }
      } catch (err) {
        console.error("GameCanvas: Error in render loop:", err);
      }
      
      // Request next frame
      animationFrame = requestAnimationFrame(render);
    };
    
    console.log("GameCanvas: Starting render loop");
    animationFrame = requestAnimationFrame(render);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
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
    ctx.fillText(`Energy: ${$gameState.energy} J`, 10, y + 20);
    
    // Draw tick count
    ctx.fillText(`Tick: ${$gameState.tick}`, 10, y + 40);
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
    id="game-canvas-{canvasKey}"
  ></canvas>
  
  <div class="canvas-overlay">
    <div class="loading-indicator">
      {#if !ctx}
        Canvas initializing...
      {/if}
    </div>
  </div>
</div>

<style>
  .game-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: #1a1a2e;
  }
  
  canvas {
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  
  .canvas-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 10;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .loading-indicator {
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 1rem;
    border-radius: 0.5rem;
    font-family: monospace;
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

# frontend/src/components/world/PixiGame.svelte

```svelte
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
```

# frontend/src/lib/assetManager.ts

```ts
// frontend/src/lib/assetManager.ts
import { writable } from 'svelte/store';

// Define asset types
export enum AssetType {
  SOUND_EFFECT = 'sound_effect',
  MUSIC = 'music',
  AMBIENCE = 'ambience',
  FOLEY = 'foley',
  SPRITE = 'sprite',
  TILESET = 'tileset',
  ANIMATION = 'animation',
  BUILDING = 'building',
  CHARACTER = 'character',
  TERRAIN = 'terrain',
  DECORATION = 'decoration',
  UI = 'ui'
}

// Asset metadata
export interface AssetMetadata {
  id: string;
  type: AssetType;
  path: string;
  name: string;
  description?: string;
  tags?: string[];
  frameCount?: number;     // For animations
  frameRate?: number;      // For animations
  loop?: boolean;          // For audio/animations
  volume?: number;         // For audio
  dimensions?: {           // For images
    width: number;
    height: number;
  };
  variants?: string[];     // For sprites with variations
  author?: string;         // Credit information
  license?: string;        // License information
}

// Audio related assets
export interface AudioAsset extends AssetMetadata {
  type: AssetType.SOUND_EFFECT | AssetType.MUSIC | AssetType.AMBIENCE | AssetType.FOLEY;
  duration: number;
  fadeDuration?: number;
}

// Visual assets
export interface SpriteAsset extends AssetMetadata {
  type: AssetType.SPRITE | AssetType.BUILDING | AssetType.CHARACTER | AssetType.DECORATION | AssetType.UI;
  frames?: {               // For multi-frame sprites
    columns: number;
    rows: number;
    frameWidth: number;
    frameHeight: number;
  };
}

// Tileset assets
export interface TilesetAsset extends AssetMetadata {
  type: AssetType.TILESET | AssetType.TERRAIN;
  tileWidth: number;
  tileHeight: number;
  columns: number;
  rows: number;
  terrainTypes?: string[]; // Different terrain types in the tileset
  tileProperties?: Record<number, any>; // Properties for specific tiles (collision, etc.)
}

// Track loaded assets
export const loadedAssets = writable<Map<string, AssetMetadata>>(new Map());

// Audio elements cache
const audioCache = new Map<string, HTMLAudioElement>();

// Image elements cache
const imageCache = new Map<string, HTMLImageElement>();

// Asset loader functions
export async function loadImage(asset: SpriteAsset | TilesetAsset): Promise<HTMLImageElement> {
  // Check if already cached
  if (imageCache.has(asset.id)) {
    return imageCache.get(asset.id);
  }
  
  // Load the image
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(asset.id, img);
      loadedAssets.update(assets => {
        assets.set(asset.id, asset);
        return assets;
      });
      resolve(img);
    };
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${asset.path}`));
    };
    img.src = asset.path;
  });
}

export async function loadAudio(asset: AudioAsset): Promise<HTMLAudioElement> {
  // Check if already cached
  if (audioCache.has(asset.id)) {
    return audioCache.get(asset.id);
  }
  
  // Load the audio
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.oncanplaythrough = () => {
      audioCache.set(asset.id, audio);
      loadedAssets.update(assets => {
        assets.set(asset.id, asset);
        return assets;
      });
      resolve(audio);
    };
    audio.onerror = () => {
      reject(new Error(`Failed to load audio: ${asset.path}`));
    };
    audio.src = asset.path;
    audio.load();
  });
}

// Play audio with various options
export function playAudio(
  assetId: string, 
  options: { 
    volume?: number, 
    loop?: boolean, 
    fadeIn?: number, 
    fadeOut?: number,
    onEnd?: () => void
  } = {}
): { audio: HTMLAudioElement, stop: () => void } {
  const audio = audioCache.get(assetId);
  if (!audio) {
    console.error(`Audio asset not loaded: ${assetId}`);
    return null;
  }
  
  // Clone the audio to allow multiple concurrent playback
  const audioInstance = audio.cloneNode() as HTMLAudioElement;
  
  // Apply options
  if (options.volume !== undefined) audioInstance.volume = options.volume;
  if (options.loop !== undefined) audioInstance.loop = options.loop;
  
  // Handle fade in
  if (options.fadeIn && options.fadeIn > 0) {
    audioInstance.volume = 0;
    let startTime = Date.now();
    const fadeInInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (options.fadeIn * 1000), 1);
      audioInstance.volume = progress * (options.volume || 1);
      
      if (progress >= 1) {
        clearInterval(fadeInInterval);
      }
    }, 50);
  }
  
  // Handle fade out and end
  if (options.onEnd || (options.fadeOut && options.fadeOut > 0)) {
    audioInstance.addEventListener('timeupdate', () => {
      const timeLeft = audioInstance.duration - audioInstance.currentTime;
      
      // Start fade out when approaching the end
      if (options.fadeOut && timeLeft <= options.fadeOut) {
        audioInstance.volume = (timeLeft / options.fadeOut) * (options.volume || 1);
      }
    });
    
    audioInstance.addEventListener('ended', () => {
      if (options.onEnd) options.onEnd();
    });
  }
  
  // Start playing
  audioInstance.play();
  
  // Return control object
  return {
    audio: audioInstance,
    stop: () => {
      if (options.fadeOut && options.fadeOut > 0) {
        // Start fade out
        let startVolume = audioInstance.volume;
        let startTime = Date.now();
        const fadeOutInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / (options.fadeOut * 1000), 1);
          audioInstance.volume = startVolume * (1 - progress);
          
          if (progress >= 1) {
            clearInterval(fadeOutInterval);
            audioInstance.pause();
            audioInstance.currentTime = 0;
          }
        }, 50);
      } else {
        // Stop immediately
        audioInstance.pause();
        audioInstance.currentTime = 0;
      }
    }
  };
}

// Preload commonly used assets
export async function preloadAssets(assetList: AssetMetadata[]): Promise<void> {
  const promises = assetList.map(asset => {
    if (
      asset.type === AssetType.SOUND_EFFECT || 
      asset.type === AssetType.MUSIC || 
      asset.type === AssetType.AMBIENCE ||
      asset.type === AssetType.FOLEY
    ) {
      return loadAudio(asset as AudioAsset);
    } else {
      return loadImage(asset as SpriteAsset | TilesetAsset);
    }
  });
  
  await Promise.all(promises);
  console.log(`Preloaded ${assetList.length} assets`);
}

// Define core assets for the game
export const CORE_ASSETS = {
  // Music
  MENU_MUSIC: {
    id: 'menu_music',
    type: AssetType.MUSIC,
    path: 'assets/audio/music/menu_theme.mp3',
    name: 'Menu Theme',
    loop: true,
    duration: 120,
    volume: 0.7
  } as AudioAsset,
  
  GAME_MUSIC: {
    id: 'game_music',
    type: AssetType.MUSIC,
    path: 'assets/audio/music/game_theme.mp3',
    name: 'Game Theme',
    loop: true,
    duration: 180,
    volume: 0.5
  } as AudioAsset,
  
  // Sound effects
  BUILD_SOUND: {
    id: 'build_sound',
    type: AssetType.SOUND_EFFECT,
    path: 'assets/audio/sfx/build.mp3',
    name: 'Building Placement',
    duration: 1.5,
    volume: 0.8
  } as AudioAsset,
  
  EXTRACT_SOUND: {
    id: 'extract_sound',
    type: AssetType.SOUND_EFFECT,
    path: 'assets/audio/sfx/extract.mp3',
    name: 'Resource Extraction',
    duration: 2.0,
    volume: 0.6,
    loop: true
  } as AudioAsset,
  
  // Ambient sounds
  WIND_AMBIENT: {
    id: 'wind_ambient',
    type: AssetType.AMBIENCE,
    path: 'assets/audio/ambience/wind.mp3',
    name: 'Wind Ambience',
    duration: 60,
    loop: true,
    volume: 0.3
  } as AudioAsset,
  
  // Building sprites
  EXTRACTOR_SPRITE: {
    id: 'extractor_sprite',
    type: AssetType.BUILDING,
    path: 'assets/sprites/buildings/extractor.png',
    name: 'Resource Extractor',
    dimensions: { width: 64, height: 64 },
    frames: {
      columns: 4,
      rows: 1,
      frameWidth: 64,
      frameHeight: 64
    }
  } as SpriteAsset,
  
  REACTOR_SPRITE: {
    id: 'reactor_sprite',
    type: AssetType.BUILDING,
    path: 'assets/sprites/buildings/reactor.png',
    name: 'Chemical Reactor',
    dimensions: { width: 64, height: 64 },
    frames: {
      columns: 4,
      rows: 1,
      frameWidth: 64,
      frameHeight: 64
    }
  } as SpriteAsset,
  
  POWER_PLANT_SPRITE: {
    id: 'power_plant_sprite',
    type: AssetType.BUILDING,
    path: 'assets/sprites/buildings/power_plant.png',
    name: 'Power Plant',
    dimensions: { width: 64, height: 64 },
    frames: {
      columns: 4,
      rows: 1,
      frameWidth: 64,
      frameHeight: 64
    }
  } as SpriteAsset,
  
  // Terrain tilesets
  TERRAIN_TILESET: {
    id: 'terrain_tileset',
    type: AssetType.TILESET,
    path: 'assets/sprites/terrain/terrain_tileset.png',
    name: 'Main Terrain Tileset',
    tileWidth: 32,
    tileHeight: 32,
    columns: 16,
    rows: 16,
    terrainTypes: ['grass', 'dirt', 'stone', 'water', 'lava', 'ice'],
    tileProperties: {
      // Properties for specific tile indexes
      0: { type: 'grass', passable: true },
      16: { type: 'dirt', passable: true },
      32: { type: 'stone', passable: true },
      48: { type: 'water', passable: false },
      64: { type: 'lava', passable: false, damage: 10 },
      80: { type: 'ice', passable: true, slippery: true }
    }
  } as TilesetAsset,
  
  // Add more assets as needed
};

// Audio context for advanced audio manipulation
let audioContext: AudioContext;

// Initialize the audio system
export function initAudioSystem(): void {
  // Create audio context
  audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Set up master volume
  const masterGain = audioContext.createGain();
  masterGain.gain.value = 1.0;
  masterGain.connect(audioContext.destination);
  
  console.log('Audio system initialized');
}

// Resume audio context when user interacts with the page
export function resumeAudio(): void {
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
}
```

# frontend/src/lib/canvasActions.ts

```ts
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
```

# frontend/src/lib/canvasStore.ts

```ts
import { writable } from 'svelte/store';

// Create a store with initial value of null
export const canvasStore = writable(null);
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
  pressure: number;
  weather: WeatherCondition;
  timeOfDay: number;    // 0-24 hour
}


export interface Building {
  id: string;
  type: string;
  position: { x: number; y: number };
  connections: string[];
  // Building-specific properties
}
// Weather conditions that affect temperature and pressure
export enum WeatherCondition {
    Clear = "Clear",
    Cloudy = "Cloudy",
    Stormy = "Stormy",
    Cold = "Cold",
    Hot = "Hot"
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
  pressure: 101325,    // 1 atm in Pascal
  weather: WeatherCondition.Clear,
  timeOfDay: 12,       // Noon
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

# frontend/src/lib/index.ts

```ts
// src/lib/index.ts
export * from './mapGenerator';
```

# frontend/src/lib/mapGenerator.ts

```ts
// frontend/src/lib/mapGenerator.ts
import { createNoise2D } from 'simplex-noise';
import seedrandom from 'seedrandom';
import * as Types from './types';

const {
  TerrainType,
  ResourceType,
  MapTile,
  PlanetMap,
  AtmosphereType,
  SpecialFeature,
  BiomeDistribution,
  MapGeneratorParams,
  PlanetType,
  planetTemplates
} = Types;

// Export the mapGenerator object for use in other files
export const mapGenerator = {
  generateMap: generatePlanetMap,
  generateMars
};

// Helper function to initialize noise generators
function initNoiseGenerators(seed: number) {
  // Create different noise generators for various map aspects using seedrandom
  const heightNoise = createNoise2D(seedrandom(seed.toString()));
  const moistureNoise = createNoise2D(seedrandom((seed + 1).toString()));
  const temperatureNoise = createNoise2D(seedrandom((seed + 2).toString()));
  const resourceNoise = createNoise2D(seedrandom((seed + 3).toString()));
  const biomeNoise = createNoise2D(seedrandom((seed + 4).toString()));
  
  return {
    heightNoise,
    moistureNoise,
    temperatureNoise,
    resourceNoise,
    biomeNoise
  };
}

// Determine terrain type based on height, moisture, temperature
function determineTerrainType(
  height: number, 
  moisture: number, 
  temperature: number,
  oceanLevel: number,
  mountainLevel: number,
  alienness: number
): TerrainType {
  // Ocean
  if (height < oceanLevel) {
    if (height < oceanLevel - 0.2) {
      return TerrainType.DEEP_WATER;
    }
    
    // Check for methane lakes if the planet is very alien
    if (alienness > 0.7 && Math.random() < alienness - 0.7) {
      return TerrainType.METHANE_LAKE;
    }
    
    return TerrainType.SHALLOW_WATER;
  }
  
  // Very cold areas become ice
  if (temperature < 0.2) {
    return TerrainType.ICE;
  }
  
  // Mountains
  if (height > mountainLevel) {
    if (height > mountainLevel + 0.2) {
      return temperature < 0.3 ? TerrainType.SNOW : TerrainType.MOUNTAINS;
    }
    return TerrainType.HILLS;
  }
  
  // Alien features
  if (Math.random() < alienness * 0.3) {
    if (moisture > 0.6) {
      return TerrainType.ALIEN_FOREST;
    } else if (moisture > 0.3) {
      return TerrainType.ALIEN_GRASS;
    } else {
      return TerrainType.ALIEN_CRYSTAL;
    }
  }
  
  // Volcanic areas
  if (temperature > 0.8 && Math.random() < 0.3) {
    return height > 0.6 ? TerrainType.VOLCANIC : TerrainType.LAVA;
  }
  
  // Normal biomes
  if (moisture > 0.65) {
    return TerrainType.FOREST;
  } else if (moisture > 0.3) {
    return TerrainType.GRASS;
  } else {
    return TerrainType.SAND;
  }
}

// Determine resource type based on terrain and random factor
function determineResourceType(
  terrain: TerrainType,
  resourceNoise: number,
  resourceRichness: number
): { type: ResourceType, density: number } {
  let possibleResources: ResourceType[] = [];
  let density = 0;
  
  // Base chance of resource based on richness
  const hasResource = resourceNoise < resourceRichness * 0.5;
  
  if (!hasResource) {
    return { type: ResourceType.NONE, density: 0 };
  }
  
  // Different terrains have different resource probabilities
  switch (terrain) {
    case TerrainType.DEEP_WATER:
    case TerrainType.SHALLOW_WATER:
      possibleResources = [ResourceType.WATER, ResourceType.OXYGEN];
      density = resourceNoise * 0.5 + resourceRichness * 0.5;
      break;
    
    case TerrainType.METHANE_LAKE:
      return { type: ResourceType.METHANE, density: 0.7 + resourceNoise * 0.3 };
    
    case TerrainType.SAND:
      possibleResources = [ResourceType.SILICON, ResourceType.IRON];
      density = resourceNoise * 0.4 + resourceRichness * 0.3;
      break;
    
    case TerrainType.MOUNTAINS:
    case TerrainType.HILLS:
      possibleResources = [ResourceType.IRON, ResourceType.COPPER, ResourceType.RARE_METALS];
      density = resourceNoise * 0.6 + resourceRichness * 0.4;
      break;
    
    case TerrainType.VOLCANIC:
    case TerrainType.LAVA:
      possibleResources = [ResourceType.SULFUR, ResourceType.RARE_METALS];
      density = resourceNoise * 0.7 + resourceRichness * 0.3;
      break;
    
    case TerrainType.ALIEN_CRYSTAL:
      return { type: ResourceType.XENOCRYSTALS, density: 0.5 + resourceNoise * 0.5 };
    
    case TerrainType.GRASS:
    case TerrainType.FOREST:
    case TerrainType.ALIEN_GRASS:
    case TerrainType.ALIEN_FOREST:
      possibleResources = [ResourceType.OXYGEN, ResourceType.WATER];
      density = resourceNoise * 0.5 + resourceRichness * 0.2;
      break;
    
    case TerrainType.SNOW:
    case TerrainType.ICE:
      possibleResources = [ResourceType.WATER];
      density = resourceNoise * 0.6 + resourceRichness * 0.2;
      break;
    
    default:
      possibleResources = [ResourceType.NONE];
      density = 0;
  }
  
  // Rarely add uranium or other special resources
  if (resourceNoise > 0.95 && resourceRichness > 0.7) {
    possibleResources.push(ResourceType.URANIUM);
    density = Math.max(density, 0.8);
  }
  
  // Select a random resource from the possible ones
  const resourceIndex = Math.floor(Math.random() * possibleResources.length);
  return { 
    type: possibleResources[resourceIndex], 
    density: Math.min(Math.max(density, 0), 1) 
  };
}

// Add special features to the map
function addSpecialFeatures(map: PlanetMap, count: number): void {
  if (!map || !map.tiles || map.tiles.length === 0) {
    console.warn("Cannot add special features: Map is not properly initialized");
    return;
  }

  // Use string enum values directly
  const features = [
    'meteor_crater',
    'volcano',
    'canyon',
    'cave_system',
    'alien_ruins',
    'geothermal_area',
    'crystal_formation',
    'abandoned_base',
    'strange_signal',
    'ancient_technology'
  ];
  
  const selectedFeatures: string[] = [];
  
  // Randomly select features
  for (let i = 0; i < count; i++) {
    const feature = features[Math.floor(Math.random() * features.length)];
    
    // Avoid duplicates unless we've used all features
    if (!selectedFeatures.includes(feature) || selectedFeatures.length >= features.length) {
      selectedFeatures.push(feature);
    }
  }
  
  map.specialFeatures = selectedFeatures;
  
  // For each feature, modify the map (this would be expanded in a full implementation)
  for (const feature of selectedFeatures) {
    // Make sure map dimensions are valid
    if (!map.width || !map.height || map.width <= 0 || map.height <= 0) {
      console.warn("Invalid map dimensions for feature placement");
      continue;
    }
    
    const x = Math.floor(Math.random() * map.width);
    const y = Math.floor(Math.random() * map.height);
    
    // Make sure indices are valid
    if (!map.tiles[y] || !map.tiles[y][x]) {
      console.warn(`Invalid map coordinates (${x},${y}) for feature placement`);
      continue;
    }
    
    // Ensure we're not placing in deep water
    if (map.tiles[y][x].terrain === TerrainType.DEEP_WATER) {
      continue;
    }
    
    // Create the feature based on type
    switch (feature) {
      case 'meteor_crater':
        createMeteorCrater(map, x, y);
        break;
      case 'volcano':
        createVolcano(map, x, y);
        break;
      case 'alien_ruins':
        createAlienRuins(map, x, y);
        break;
      // For other features, we'll add them in the future
      default:
        // Just add a basic decoration for now
        if (map.tiles[y][x]) {
          map.tiles[y][x].decorations = [Math.floor(Math.random() * 10)];
        }
    }
  }
}

// Create a meteor crater at the specified location
function createMeteorCrater(map: PlanetMap, centerX: number, centerY: number): void {
  const radius = 5 + Math.floor(Math.random() * 10);
  
  // Modify terrain in a circle around the center
  for (let y = Math.max(0, centerY - radius); y < Math.min(map.height, centerY + radius); y++) {
    for (let x = Math.max(0, centerX - radius); x < Math.min(map.width, centerX + radius); x++) {
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      
      if (distance <= radius) {
        const tile = map.tiles[y][x];
        
        // Center of crater has rare resources
        if (distance < radius * 0.3) {
          tile.terrain = TerrainType.ALIEN_CRYSTAL;
          tile.resource = ResourceType.RARE_METALS;
          tile.resourceDensity = 0.8;
          tile.radiation = 0.5; // Some radiation
        } 
        // Crater rim
        else if (distance > radius * 0.8) {
          tile.terrain = TerrainType.HILLS;
          tile.height = 0.6;
        }
        // Crater floor
        else {
          tile.terrain = TerrainType.SAND;
          tile.height = 0.45;
        }
      }
    }
  }
}

// Create a volcano at the specified location
function createVolcano(map: PlanetMap, centerX: number, centerY: number): void {
  const radius = 7 + Math.floor(Math.random() * 8);
  
  // Modify terrain in a circle around the center
  for (let y = Math.max(0, centerY - radius); y < Math.min(map.height, centerY + radius); y++) {
    for (let x = Math.max(0, centerX - radius); x < Math.min(map.width, centerX + radius); x++) {
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      
      if (distance <= radius) {
        const tile = map.tiles[y][x];
        
        // Center is lava
        if (distance < radius * 0.2) {
          tile.terrain = TerrainType.LAVA;
          tile.temperature = 873; // 600°C in Kelvin
          tile.traversable = false;
        } 
        // Inner slopes are volcanic
        else if (distance < radius * 0.6) {
          tile.terrain = TerrainType.VOLCANIC;
          tile.temperature = 373 + (radius * 0.6 - distance) * 100; // Gets hotter closer to center
          tile.resource = ResourceType.SULFUR;
          tile.resourceDensity = 0.5 + Math.random() * 0.5;
        }
        // Outer slopes are mountains/hills
        else {
          tile.terrain = distance < radius * 0.8 ? TerrainType.MOUNTAINS : TerrainType.HILLS;
          tile.height = 0.7 + (radius - distance) / radius * 0.3;
          tile.temperature = 323 + (radius * 0.8 - distance) * 30; // Gets hotter closer to center
        }
      }
    }
  }
}

// Create alien ruins at the specified location
function createAlienRuins(map: PlanetMap, centerX: number, centerY: number): void {
  const radius = 4 + Math.floor(Math.random() * 6);
  
  // Modify terrain in a circle around the center
  for (let y = Math.max(0, centerY - radius); y < Math.min(map.height, centerY + radius); y++) {
    for (let x = Math.max(0, centerX - radius); x < Math.min(map.width, centerX + radius); x++) {
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      
      if (distance <= radius) {
        const tile = map.tiles[y][x];
        
        // Center has alien crystals and technology
        if (distance < radius * 0.5) {
          tile.terrain = TerrainType.ALIEN_CRYSTAL;
          tile.resource = Math.random() < 0.3 ? ResourceType.XENOCRYSTALS : ResourceType.RARE_METALS;
          tile.resourceDensity = 0.7 + Math.random() * 0.3;
          // Add decoration for ruins
          tile.decorations = [100 + Math.floor(Math.random() * 10)]; // Specific decoration IDs for ruins
        } 
        // Outer area has some scattered resources
        else {
          // Keep original terrain but add some resources
          if (Math.random() < 0.3) {
            tile.resource = ResourceType.SILICON;
            tile.resourceDensity = 0.3 + Math.random() * 0.4;
          }
          // Add sparse decorations
          if (Math.random() < 0.2) {
            tile.decorations = [110 + Math.floor(Math.random() * 5)]; // Scattered ruins decorations
          }
        }
      }
    }
  }
}

// Main map generation function
export function generatePlanetMap(params: MapGeneratorParams): PlanetMap {
  // Set defaults for optional parameters
  const seed = params.seed || Math.floor(Math.random() * 1000000);
  const oceanLevel = params.oceanLevel || 0.4;
  const mountainLevel = params.mountainLevel || 0.7;
  const resourceRichness = params.resourceRichness || 0.5;
  const alienness = params.alienness || 0.3;
  const smoothness = params.smoothness || 0.5;
  const moistureScale = params.moistureScale || 0.01;
  const heightScale = params.heightScale || 0.005;
  const temperatureScale = params.temperatureScale || 0.008;
  const biomeScale = params.biomeScale || 0.02;
  const specialFeatureCount = params.specialFeatureCount || 5;
  
  // Get planet template
  const planetType = params.planetType || PlanetType.EARTH_LIKE;
  const template = planetTemplates[planetType];
  
  // Initialize noise generators
  const noise = initNoiseGenerators(seed);
  
  // Create empty map
  const map: PlanetMap = {
    name: generatePlanetName(seed),
    width: params.width,
    height: params.height,
    seed,
    tiles: [],
    biomes: { ...template.biomes },
    resourceRichness,
    baseTemperature: template.baseTemperature,
    basePressure: template.basePressure,
    gravity: template.gravity,
    atmosphere: template.atmosphere,
    specialFeatures: []
  };
  
  // Initialize tiles array
  for (let y = 0; y < params.height; y++) {
    map.tiles[y] = [];
    for (let x = 0; x < params.width; x++) {
      // Generate base noise values
      const nx = x * heightScale;
      const ny = y * heightScale;
      
      // Height is a combination of different octaves for more natural-looking terrain
      let height = 0;
      const octaves = 4;
      let amplitude = 1;
      let frequency = 1;
      let maxValue = 0;
      
      for (let o = 0; o < octaves; o++) {
        height += noise.heightNoise(nx * frequency, ny * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2;
      }
      
      // Normalize to 0-1
      height = (height / maxValue + 1) / 2;
      
      // Apply smoothness factor (higher smoothness = more plateaus and less extreme variations)
      height = Math.pow(height, 1 - smoothness * 0.5);
      
      // Generate moisture
      const moistureNoise = noise.moistureNoise(x * moistureScale, y * moistureScale);
      const moisture = (moistureNoise + 1) / 2;
      
      // Generate temperature with latitude effect (poles are colder)
      const latitudeFactor = 1 - Math.abs((y / params.height) - 0.5) * 2;
      const temperatureNoise = noise.temperatureNoise(x * temperatureScale, y * temperatureScale);
      const temperature = (temperatureNoise + 1) / 4 + latitudeFactor * 0.5;
      
      // Resources
      const resourceNoise = noise.resourceNoise(x * 0.02, y * 0.02);
      const resourceData = determineResourceType(
        determineTerrainType(height, moisture, temperature, oceanLevel, mountainLevel, alienness),
        (resourceNoise + 1) / 2,
        resourceRichness
      );
      
      // Create the tile
      map.tiles[y][x] = {
        terrain: determineTerrainType(height, moisture, temperature, oceanLevel, mountainLevel, alienness),
        resource: resourceData.type,
        resourceDensity: resourceData.density,
        temperature: template.baseTemperature + (temperature - 0.5) * 40, // Adjust based on planet template
        pressure: template.basePressure + (height - 0.5) * 10000, // Higher elevation = lower pressure
        radiation: template.atmosphere === AtmosphereType.THIN ? 0.2 + Math.random() * 0.1 : 0,
        height,
        moisture,
        traversable: true, // Will be updated later
        decorations: []
      };
      
      // Some terrain types are not traversable
      if (
        map.tiles[y][x].terrain === TerrainType.DEEP_WATER ||
        map.tiles[y][x].terrain === TerrainType.LAVA
      ) {
        map.tiles[y][x].traversable = false;
      }
    }
  }
  
  // Add special features
  addSpecialFeatures(map, specialFeatureCount);
  
  return map;
}

// Generate a unique name for the planet
function generatePlanetName(seed: number): string {
    // Simple name generator
    const prefixes = [
      'Nova', 'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 
      'Kappa', 'Lambda', 'Mu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon', 
      'Phi', 'Chi', 'Psi', 'Omega'
    ];
    
    const middles = [
      'Proxi', 'Cen', 'Siri', 'Veg', 'Alt', 'Ant', 'Arc', 'Alde', 'Caph', 'Dene', 
      'Elec', 'Fomal', 'Gem', 'Hyad', 'Iol', 'Jup', 'Keid', 'Lyr', 'Mira', 'Nix'
    ];
    
    const suffixes = [
      'a', 'b', 'c', 'd', 'e', 'i', 'ia', 'on', 'us', 'um', 'is', 'ar', 'oid', 
      'or', 'ium', 'ix', 'an', 'ius', 'ese', 'ov', 'ax', 'es', 'ine'
    ];
    
    // Use seed to deterministically generate name
    const random = seedrandom(seed.toString());
    
    let name = '';
    
    // 20% chance of using a prefix
    if (random() < 0.2) {
      name += prefixes[Math.floor(random() * prefixes.length)] + ' ';
    }
    
    // Main name - either a middle + suffix or a completely random generated name
    if (random() < 0.7) {
      name += middles[Math.floor(random() * middles.length)];
      name += suffixes[Math.floor(random() * suffixes.length)];
    } else {
      // Generate a unique name with alternating consonants and vowels
      const consonants = 'bcdfghjklmnpqrstvwxyz';
      const vowels = 'aeiou';
      const nameLength = 4 + Math.floor(random() * 5);
      
      for (let i = 0; i < nameLength; i++) {
        if (i % 2 === 0) {
          name += consonants[Math.floor(random() * consonants.length)];
        } else {
          name += vowels[Math.floor(random() * vowels.length)];
        }
      }
      
      // 50% chance to add a suffix
      if (random() < 0.5) {
        name += suffixes[Math.floor(random() * suffixes.length)];
      }
    }
    
    // 30% chance to add a designation
    if (random() < 0.3) {
      name += ' ' + (Math.floor(random() * 999) + 1);
    }
    
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  
  // Export a function to generate Mars
  export function generateMars(width: number, height: number): PlanetMap {
    return generatePlanetMap({
      width,
      height,
      planetType: PlanetType.MARS_LIKE,
      oceanLevel: 0.1,   // Very little water
      mountainLevel: 0.6,
      resourceRichness: 0.4,
      alienness: 0.1,    // Not very alien, just barren
    });
  }
```

# frontend/src/lib/mapRenderer.ts

```ts
// frontend/src/lib/mapRenderer.ts
import { createNoise2D } from 'simplex-noise';
import seedrandom from 'seedrandom';
import * as Types from './types';
const { 
  MapTile, 
  PlanetMap, 
  TerrainType, 
  ResourceType, 
  TilesetAsset 
} = Types;


export const TILE_SIZE = 32; // 32x32 pixel tiles

/// Tile rendering configuration
interface TerrainRenderConfig {
    tilesetIndex: number;  // Index in the tileset
    variants?: number[];   // Optional variant tiles
    animated?: boolean;    // Whether the tile is animated
    frames?: number;       // Number of animation frames
    animationSpeed?: number; // Animation speed in ms per frame
  }
  
  // Resource rendering configuration
  interface ResourceRenderConfig {
    tilesetIndex: number;
    density: {
      low: number;
      medium: number;
      high: number;
    };
    animated?: boolean;
    frames?: number;
    animationSpeed?: number;
  }
  
  // Mapping of terrain types to their tileset indices
  const terrainRenderConfig: Record<TerrainType, TerrainRenderConfig> = {
    [TerrainType.DEEP_WATER]: { 
      tilesetIndex: 0, 
      animated: true, 
      frames: 4, 
      animationSpeed: 800 
    },
    [TerrainType.SHALLOW_WATER]: { 
      tilesetIndex: 4, 
      animated: true, 
      frames: 4, 
      animationSpeed: 600 
    },
    [TerrainType.SAND]: { 
      tilesetIndex: 8, 
      variants: [8, 9, 10, 11]
    },
    [TerrainType.GRASS]: { 
      tilesetIndex: 12, 
      variants: [12, 13, 14, 15]
    },
    [TerrainType.FOREST]: { 
      tilesetIndex: 16 
    },
    [TerrainType.HILLS]: { 
      tilesetIndex: 20, 
      variants: [20, 21]
    },
    [TerrainType.MOUNTAINS]: { 
      tilesetIndex: 24, 
      variants: [24, 25, 26]
    },
    [TerrainType.SNOW]: { 
      tilesetIndex: 28, 
      variants: [28, 29, 30, 31]
    },
    [TerrainType.VOLCANIC]: { 
      tilesetIndex: 32 
    },
    [TerrainType.LAVA]: { 
      tilesetIndex: 36, 
      animated: true, 
      frames: 4, 
      animationSpeed: 500 
    },
    [TerrainType.CAVE]: { 
      tilesetIndex: 40 
    },
    [TerrainType.ALIEN_GRASS]: { 
      tilesetIndex: 44, 
      variants: [44, 45, 46, 47]
    },
    [TerrainType.ALIEN_FOREST]: { 
      tilesetIndex: 48, 
      variants: [48, 49]
    },
    [TerrainType.ALIEN_CRYSTAL]: { 
      tilesetIndex: 52, 
      animated: true, 
      frames: 4, 
      animationSpeed: 1000 
    },
    [TerrainType.METHANE_LAKE]: { 
      tilesetIndex: 56, 
      animated: true, 
      frames: 4, 
      animationSpeed: 700 
    },
    [TerrainType.ICE]: { 
      tilesetIndex: 60, 
      variants: [60, 61, 62, 63]
    }
  };

// Mapping of resource types to their tileset indices
const resourceRenderConfig: Record<ResourceType, ResourceRenderConfig> = {
  [ResourceType.NONE]: { 
    tilesetIndex: -1, 
    density: { low: -1, medium: -1, high: -1 } 
  },
  [ResourceType.METHANE]: { 
    tilesetIndex: 64, 
    density: { low: 64, medium: 65, high: 66 },
    animated: true,
    frames: 3,
    animationSpeed: 600
  },
  [ResourceType.OXYGEN]: { 
    tilesetIndex: 70, 
    density: { low: 70, medium: 71, high: 72 } 
  },
  [ResourceType.WATER]: { 
    tilesetIndex: 76, 
    density: { low: 76, medium: 77, high: 78 } 
  },
  [ResourceType.IRON]: { 
    tilesetIndex: 82, 
    density: { low: 82, medium: 83, high: 84 } 
  },
  [ResourceType.COPPER]: { 
    tilesetIndex: 88, 
    density: { low: 88, medium: 89, high: 90 } 
  },
  [ResourceType.SILICON]: { 
    tilesetIndex: 94, 
    density: { low: 94, medium: 95, high: 96 } 
  },
  [ResourceType.SULFUR]: { 
    tilesetIndex: 100, 
    density: { low: 100, medium: 101, high: 102 } 
  },
  [ResourceType.URANIUM]: { 
    tilesetIndex: 106, 
    density: { low: 106, medium: 107, high: 108 } 
  },
  [ResourceType.RARE_METALS]: { 
    tilesetIndex: 112, 
    density: { low: 112, medium: 113, high: 114 } 
  },
  [ResourceType.XENOCRYSTALS]: { 
    tilesetIndex: 118, 
    density: { low: 118, medium: 119, high: 120 },
    animated: true,
    frames: 3,
    animationSpeed: 800
  }
};

// Animation state tracking
interface AnimationState {
  currentFrame: number;
  lastFrameTime: number;
}

// Map of current animations
const animations = new Map<string, AnimationState>();

// Get the tile index for a specific terrain type, considering variants and animation
export function getTerrainTileIndex(
  terrain: TerrainType, 
  x: number, 
  y: number, 
  time: number = Date.now()
): number {
  const config = terrainRenderConfig[terrain];
  
  // Handle animation
  if (config.animated && config.frames > 1) {
    const key = `terrain_${terrain}_${x}_${y}`;
    
    // Initialize animation state if needed
    if (!animations.has(key)) {
      animations.set(key, {
        currentFrame: Math.floor(Math.random() * config.frames),
        lastFrameTime: time
      });
    }
    
    // Update animation frame
    const anim = animations.get(key);
    if (time - anim.lastFrameTime > config.animationSpeed) {
      anim.currentFrame = (anim.currentFrame + 1) % config.frames;
      anim.lastFrameTime = time;
    }
    
    return config.tilesetIndex + anim.currentFrame;
  }
  
  // Handle variants
  if (config.variants && config.variants.length > 0) {
    // Use position to deterministically select variant
    const variantIndex = Math.abs(Math.sin(x * 0.3 + y * 0.7) * config.variants.length) | 0;
    return config.variants[variantIndex];
  }
  
  return config.tilesetIndex;
}

// Get the tile index for a resource, considering density
export function getResourceTileIndex(
  resource: ResourceType, 
  density: number, 
  x: number, 
  y: number, 
  time: number = Date.now()
): number {
  // If no resource, return -1 (no tile)
  if (resource === ResourceType.NONE) {
    return -1;
  }
  
  const config = resourceRenderConfig[resource];
  
  // Determine density level
  let densityTile: number;
  if (density < 0.3) {
    densityTile = config.density.low;
  } else if (density < 0.7) {
    densityTile = config.density.medium;
  } else {
    densityTile = config.density.high;
  }
  
  // Handle animation
  if (config.animated && config.frames > 1) {
    const key = `resource_${resource}_${x}_${y}`;
    
    // Initialize animation state if needed
    if (!animations.has(key)) {
      animations.set(key, {
        currentFrame: Math.floor(Math.random() * config.frames),
        lastFrameTime: time
      });
    }
    
    // Update animation frame
    const anim = animations.get(key);
    if (time - anim.lastFrameTime > config.animationSpeed) {
      anim.currentFrame = (anim.currentFrame + 1) % config.frames;
      anim.lastFrameTime = time;
    }
    
    return densityTile + anim.currentFrame;
  }
  
  return densityTile;
}

// Render a map tile to a canvas context
export function renderTile(
  ctx: CanvasRenderingContext2D,
  tileset: HTMLImageElement,
  tilesetInfo: TilesetAsset,
  tile: MapTile,
  x: number,
  y: number,
  screenX: number,
  screenY: number,
  time: number = Date.now(),
  debug: boolean = false
): void {
  const { tileWidth, tileHeight, columns } = tilesetInfo;
  
  // Get terrain tile index
  const terrainIndex = getTerrainTileIndex(tile.terrain, x, y, time);
  
  // Calculate source position in tileset
  const srcX = (terrainIndex % columns) * tileWidth;
  const srcY = Math.floor(terrainIndex / columns) * tileHeight;
  
  // Draw terrain tile
  ctx.drawImage(
    tileset,
    srcX, srcY, tileWidth, tileHeight,
    screenX, screenY, TILE_SIZE, TILE_SIZE
  );
  
  // If there's a resource, draw it on top
  if (tile.resource !== ResourceType.NONE && tile.resourceDensity > 0) {
    const resourceIndex = getResourceTileIndex(tile.resource, tile.resourceDensity, x, y, time);
    
    if (resourceIndex >= 0) {
      const resourceSrcX = (resourceIndex % columns) * tileWidth;
      const resourceSrcY = Math.floor(resourceIndex / columns) * tileHeight;
      
      ctx.drawImage(
        tileset,
        resourceSrcX, resourceSrcY, tileWidth, tileHeight,
        screenX, screenY, TILE_SIZE, TILE_SIZE
      );
    }
  }
  
  // Draw any decorations
  if (tile.decorations && tile.decorations.length > 0) {
    for (const decorationIndex of tile.decorations) {
      const decorationSrcX = (decorationIndex % columns) * tileWidth;
      const decorationSrcY = Math.floor(decorationIndex / columns) * tileHeight;
      
      ctx.drawImage(
        tileset,
        decorationSrcX, decorationSrcY, tileWidth, tileHeight,
        screenX, screenY, TILE_SIZE, TILE_SIZE
      );
    }
  }
  
  // Debug overlay
  if (debug) {
    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    
    // Coordinates
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(screenX + 2, screenY + 2, 28, 12);
    ctx.fillStyle = 'white';
    ctx.font = '8px Arial';
    ctx.fillText(`${x},${y}`, screenX + 4, screenY + 10);
    
    // Resource info if present
    if (tile.resource !== ResourceType.NONE) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(screenX + 2, screenY + TILE_SIZE - 14, 28, 12);
      ctx.fillStyle = 'yellow';
      ctx.fillText(`R:${tile.resourceDensity.toFixed(1)}`, screenX + 4, screenY + TILE_SIZE - 4);
    }
  }
}

// Render map to canvas
export function renderMap(
  ctx: CanvasRenderingContext2D,
  map: PlanetMap,
  tileset: HTMLImageElement,
  tilesetInfo: TilesetAsset,
  cameraX: number,
  cameraY: number,
  viewportWidth: number,
  viewportHeight: number,
  debug: boolean = false
): void {
  const time = Date.now();
  
  // Calculate visible range
  const startX = Math.max(0, Math.floor(cameraX / TILE_SIZE));
  const startY = Math.max(0, Math.floor(cameraY / TILE_SIZE));
  const endX = Math.min(map.width, startX + Math.ceil(viewportWidth / TILE_SIZE) + 1);
  const endY = Math.min(map.height, startY + Math.ceil(viewportHeight / TILE_SIZE) + 1);
  
  // Clear canvas (or draw background)
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);
  
  // Draw visible tiles
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const tile = map.tiles[y][x];
      const screenX = Math.floor(x * TILE_SIZE - cameraX);
      const screenY = Math.floor(y * TILE_SIZE - cameraY);
      
      renderTile(
        ctx, 
        tileset, 
        tilesetInfo, 
        tile, 
        x, y, 
        screenX, screenY, 
        time, 
        debug
      );
    }
  }
  
  // Optional: Render map border
  if (debug) {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      -cameraX, 
      -cameraY, 
      map.width * TILE_SIZE, 
      map.height * TILE_SIZE
    );
  }
}

// Calculate tile transitions for smooth terrain blending
export function calculateTileTransitions(map: PlanetMap): void {
  // This would implement auto-tiling logic to handle transitions
  // between different terrain types (e.g., grass to sand)
  
  // Placeholder implementation:
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      // Check neighboring tiles and calculate appropriate transition tiles
      // This would be expanded in a full implementation
    }
  }
}

// Optimize animations - stop animations for offscreen tiles
export function optimizeAnimations(
  map: PlanetMap,
  cameraX: number,
  cameraY: number,
  viewportWidth: number,
  viewportHeight: number
): void {
  // Calculate visible range with buffer
  const buffer = 3; // Buffer of tiles
  const startX = Math.max(0, Math.floor(cameraX / TILE_SIZE) - buffer);
  const startY = Math.max(0, Math.floor(cameraY / TILE_SIZE) - buffer);
  const endX = Math.min(map.width, startX + Math.ceil(viewportWidth / TILE_SIZE) + buffer + 1);
  const endY = Math.min(map.height, startY + Math.ceil(viewportHeight / TILE_SIZE) + buffer + 1);
  
  // Check all animations
  for (const [key, _] of animations) {
    // Parse coordinates from key
    const parts = key.split('_');
    const type = parts[0]; // 'terrain' or 'resource'
    const x = parseInt(parts[2]);
    const y = parseInt(parts[3]);
    
    // If outside visible range, remove the animation
    if (x < startX || x >= endX || y < startY || y >= endY) {
      animations.delete(key);
    }
  }
}
```

# frontend/src/lib/pixiManager.ts

```ts
// PixiJS Game Manager
import * as PIXI from 'pixi.js';
import { writable, get } from 'svelte/store';
import { gameState } from '../stores/gameState';
import { TerrainType, ResourceType, PlanetType } from './types';

// Store for the PIXI Application
export const pixiApp = writable<PIXI.Application | null>(null);

// Game layers
let worldContainer: PIXI.Container;
let terrainLayer: PIXI.Container;
let resourceLayer: PIXI.Container;
let buildingLayer: PIXI.Container;
let characterLayer: PIXI.Container;
let uiLayer: PIXI.Container;

// Player character sprite
let playerCharacter: PIXI.Sprite | null = null;

// Textures for different entities
const terrainTextures: Record<number, PIXI.Texture> = {};
const resourceTextures: Record<number, PIXI.Texture> = {};
const buildingTextures: Record<string, PIXI.Texture> = {};

// Game state tracking
let tileSize = 16;
let mapWidth = 0;
let mapHeight = 0;
let isDragging = false;
let lastPosition = { x: 0, y: 0 };
let selectedBuilding: any = null;
let hoverPosition = { x: 0, y: 0 };
let isPlacementMode = false;
let selectedBuildingType: string | null = null;

// Building ghost (for placement preview)
let buildingGhost: PIXI.Sprite | null = null;

// Initialize PixiJS Application
export function initPixiApp(parentElement: HTMLElement): PIXI.Application {
  console.log("initPixiApp called with parent element:", parentElement);
  
  // Check if parent already has a canvas child, clean it up
  const existingCanvas = parentElement.querySelector('canvas');
  if (existingCanvas) {
    console.log("Found existing canvas, removing it");
    parentElement.removeChild(existingCanvas);
  }
  
  // Create PIXI Application
  const app = new PIXI.Application({
    width: parentElement.clientWidth || 800,
    height: parentElement.clientHeight || 600,
    backgroundColor: 0x0f0f1e,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    antialias: true,
  });

  // Add canvas to DOM
  console.log("Appending canvas to parent element");
  parentElement.appendChild(app.view as HTMLCanvasElement);

  // Store the app in our store
  console.log("Storing app in pixiApp store");
  pixiApp.set(app);

  // Create layers
  console.log("Setting up layers");
  setupLayers(app);

  // Generate textures
  console.log("Generating textures");
  generateTextures(app);

  // Set up event handlers
  console.log("Setting up event handlers");
  setupEvents(app);

  // Save the unsubscriber so we can clean it up later
  let unsubscribe: (() => void) | null = null;
  
  // Subscribe to game state changes
  console.log("Subscribing to game state changes");
  unsubscribe = gameState.subscribe(state => {
    console.log("Game state updated:", state);
    if (state.map) {
      console.log("Rendering map:", state.map.name);
      renderMap(state.map);
    }
    if (state.buildings) {
      console.log("Rendering buildings:", state.buildings.length);
      renderBuildings(state.buildings);
    }
  });
  
  // Add cleanup method to the app for more reliable cleanup
  (app as any).cleanupResources = () => {
    console.log("Cleaning up PIXI resources");
    // Unsubscribe from game state
    if (unsubscribe) {
      console.log("Unsubscribing from game state");
      unsubscribe();
      unsubscribe = null;
    }
    
    // Clear containers
    if (worldContainer) worldContainer.removeChildren();
    if (terrainLayer) terrainLayer.removeChildren();
    if (resourceLayer) resourceLayer.removeChildren();
    if (buildingLayer) buildingLayer.removeChildren();
    if (uiLayer) uiLayer.removeChildren();
    
    // Remove event listeners
    if (app.view) {
      console.log("Removing wheel event listener");
      app.view.removeEventListener('wheel', handleWheel);
    }
  };

  return app;
}

// Wheel event handler reference to be able to remove it
function handleWheel(event: WheelEvent) {
  event.preventDefault();
  const app = get(pixiApp);
  if (!app) return;
  
  // Calculate zoom factor
  const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
  
  // Get current mouse position relative to world container
  const lastPosition = { x: event.clientX, y: event.clientY };
  const mouseX = lastPosition.x - worldContainer.x;
  const mouseY = lastPosition.y - worldContainer.y;
  
  // Apply zoom
  worldContainer.scale.x *= zoomFactor;
  worldContainer.scale.y *= zoomFactor;
  
  // Adjust world container position to zoom in/out from mouse position
  worldContainer.x = lastPosition.x - mouseX * zoomFactor;
  worldContainer.y = lastPosition.y - mouseY * zoomFactor;
}

// Set up basic layers for our game
function setupLayers(app: PIXI.Application) {
  // World container (can be moved, scaled, etc)
  worldContainer = new PIXI.Container();
  app.stage.addChild(worldContainer);

  // Terrain layer (bottom)
  terrainLayer = new PIXI.Container();
  worldContainer.addChild(terrainLayer);

  // Resource layer (above terrain)
  resourceLayer = new PIXI.Container();
  worldContainer.addChild(resourceLayer);

  // Building layer (above resources)
  buildingLayer = new PIXI.Container();
  worldContainer.addChild(buildingLayer);
  
  // Character layer (above buildings)
  characterLayer = new PIXI.Container();
  worldContainer.addChild(characterLayer);

  // UI layer (top, fixed position)
  uiLayer = new PIXI.Container();
  app.stage.addChild(uiLayer);
}

// Generate simple textures for game elements
function generateTextures(app: PIXI.Application) {
  // Create terrain textures
  for (let i = 0; i <= 15; i++) {
    const graphics = new PIXI.Graphics();
    
    // Fill with color based on terrain type
    switch (i) {
      case TerrainType.DEEP_WATER:
        graphics.beginFill(0x0a3b5c);
        break;
      case TerrainType.SHALLOW_WATER:
        graphics.beginFill(0x0e6ba8);
        break;
      case TerrainType.SAND:
        graphics.beginFill(0xe4d6a7);
        break;
      case TerrainType.GRASS:
        graphics.beginFill(0x7ab317);
        break;
      case TerrainType.FOREST:
        graphics.beginFill(0x3e7924);
        break;
      case TerrainType.HILLS:
        graphics.beginFill(0x6d8383);
        break;
      case TerrainType.MOUNTAINS:
        graphics.beginFill(0x8d8778);
        break;
      case TerrainType.SNOW:
        graphics.beginFill(0xffffff);
        break;
      case TerrainType.VOLCANIC:
        graphics.beginFill(0x7c3626);
        break;
      case TerrainType.LAVA:
        graphics.beginFill(0xe25822);
        break;
      case TerrainType.CAVE:
        graphics.beginFill(0x3c2c3e);
        break;
      case TerrainType.ALIEN_GRASS:
        graphics.beginFill(0xa2d6a2);
        break;
      case TerrainType.ALIEN_FOREST:
        graphics.beginFill(0x5eaa5e);
        break;
      case TerrainType.ALIEN_CRYSTAL:
        graphics.beginFill(0xbf62a6);
        break;
      case TerrainType.METHANE_LAKE:
        graphics.beginFill(0x39848b);
        break;
      case TerrainType.ICE:
        graphics.beginFill(0xc9e1ff);
        break;
      default:
        graphics.beginFill(0x555555);
    }
    
    graphics.drawRect(0, 0, tileSize, tileSize);
    graphics.endFill();
    
    // Add border
    graphics.lineStyle(1, 0x000000, 0.2);
    graphics.drawRect(0, 0, tileSize, tileSize);
    
    terrainTextures[i] = app.renderer.generateTexture(graphics);
  }

  // Create resource textures
  for (let i = 0; i <= 10; i++) {
    const graphics = new PIXI.Graphics();
    
    // Fill with color based on resource type
    switch (i) {
      case ResourceType.NONE:
        graphics.beginFill(0x000000, 0); // Transparent
        break;
      case ResourceType.METHANE:
        graphics.beginFill(0x39848b);
        break;
      case ResourceType.OXYGEN:
        graphics.beginFill(0xf5f5f5);
        break;
      case ResourceType.WATER:
        graphics.beginFill(0x43aada);
        break;
      case ResourceType.IRON:
        graphics.beginFill(0xb77333);
        break;
      case ResourceType.COPPER:
        graphics.beginFill(0xd4a276);
        break;
      case ResourceType.SILICON:
        graphics.beginFill(0xf0e68c);
        break;
      case ResourceType.SULFUR:
        graphics.beginFill(0xfff44f);
        break;
      case ResourceType.URANIUM:
        graphics.beginFill(0x9bc400);
        break;
      case ResourceType.RARE_METALS:
        graphics.beginFill(0xc0c0c0);
        break;
      case ResourceType.XENOCRYSTALS:
        graphics.beginFill(0xbf62a6);
        break;
      default:
        graphics.beginFill(0x888888);
    }
    
    // Draw circle for resources
    graphics.drawCircle(tileSize / 2, tileSize / 2, tileSize / 3);
    graphics.endFill();
    
    resourceTextures[i] = app.renderer.generateTexture(graphics);
  }

  // Create building textures
  const buildingTypes = ['extractor', 'storage', 'powerPlant', 'reactor', 'pipe'];
  
  buildingTypes.forEach(type => {
    const graphics = new PIXI.Graphics();
    
    // Fill with color based on building type
    switch (type) {
      case 'extractor':
        graphics.beginFill(0x3498db);
        graphics.drawCircle(tileSize, tileSize, tileSize);
        break;
      case 'storage':
        graphics.beginFill(0xf1c40f);
        graphics.drawRect(0, 0, tileSize * 2, tileSize * 2);
        break;
      case 'powerPlant':
        graphics.beginFill(0x2ecc71);
        graphics.moveTo(tileSize, 0);
        graphics.lineTo(tileSize * 2, tileSize * 2);
        graphics.lineTo(0, tileSize * 2);
        graphics.closePath();
        break;
      case 'reactor':
        graphics.beginFill(0xe74c3c);
        graphics.moveTo(tileSize, 0);
        graphics.lineTo(tileSize * 2, tileSize);
        graphics.lineTo(tileSize, tileSize * 2);
        graphics.lineTo(0, tileSize);
        graphics.closePath();
        break;
      case 'pipe':
        graphics.beginFill(0x95a5a6);
        graphics.drawRoundedRect(0, tileSize / 2, tileSize * 2, tileSize / 2, 5);
        break;
    }
    
    graphics.endFill();
    
    buildingTextures[type] = app.renderer.generateTexture(graphics);
  });

  // Create selection indicator
  const selectionGraphics = new PIXI.Graphics();
  selectionGraphics.lineStyle(2, 0xffffff, 1);
  selectionGraphics.drawCircle(tileSize, tileSize, tileSize + 5);
  buildingTextures['selection'] = app.renderer.generateTexture(selectionGraphics);

  // Create building ghost (transparent version for placement preview)
  const ghostGraphics = new PIXI.Graphics();
  ghostGraphics.lineStyle(2, 0xffffff, 0.8);
  ghostGraphics.beginFill(0xffffff, 0.3);
  ghostGraphics.drawCircle(tileSize, tileSize, tileSize);
  ghostGraphics.endFill();
  buildingTextures['ghost'] = app.renderer.generateTexture(ghostGraphics);
}

// Set up event handlers for user interactions
function setupEvents(app: PIXI.Application) {
  console.log("Setting up event handlers");
  
  // Add interactive capabilities
  worldContainer.eventMode = 'static';
  worldContainer.cursor = 'pointer';

  // Mouse down
  worldContainer.on('pointerdown', (event) => {
    const position = event.global;
    lastPosition = { x: position.x, y: position.y };
    
    if (isPlacementMode && selectedBuildingType) {
      // Place building at mouse position
      const worldPos = event.getLocalPosition(worldContainer);
      placeBuilding(selectedBuildingType, worldPos.x, worldPos.y);
    } else {
      // Select building under cursor
      const worldPos = event.getLocalPosition(worldContainer);
      selectBuildingAt(worldPos.x, worldPos.y);
      
      // Start dragging if not in placement mode
      isDragging = true;
    }
  });

  // Mouse move
  worldContainer.on('pointermove', (event) => {
    const position = event.global;
    
    if (isDragging) {
      // Move the world container (panning)
      worldContainer.x += position.x - lastPosition.x;
      worldContainer.y += position.y - lastPosition.y;
    }
    
    lastPosition = { x: position.x, y: position.y };
    
    // Update hover position
    const worldPos = event.getLocalPosition(worldContainer);
    hoverPosition = { x: worldPos.x, y: worldPos.y };
    
    // Update ghost position in placement mode
    if (isPlacementMode && buildingGhost) {
      buildingGhost.position.set(
        Math.floor(worldPos.x / tileSize) * tileSize,
        Math.floor(worldPos.y / tileSize) * tileSize
      );
    }
  });

  // Mouse up
  worldContainer.on('pointerup', () => {
    isDragging = false;
  });

  // Mouse wheel for zoom - use our separate handleWheel function
  app.view.addEventListener('wheel', handleWheel);
  
  console.log("Event handlers setup complete");
}

// Render map from game state
function renderMap(map: any) {
  console.log("Rendering map with dimensions:", map.width, "x", map.height);
  
  // Clear existing terrain and resources
  terrainLayer.removeChildren();
  resourceLayer.removeChildren();
  
  // Store map dimensions
  mapWidth = map.width;
  mapHeight = map.height;
  
  // Calculate appropriate tile size based on map dimensions
  const app = get(pixiApp);
  if (app) {
    console.log("Screen dimensions:", app.screen.width, "x", app.screen.height);
    
    // Set a visible background color for the app
    app.renderer.background.color = 0x123456; // Dark blue background
    
    // Use a fixed tile size to ensure consistent appearance
    tileSize = 32; // Larger tiles make it easier to see the map
    
    console.log("Using tile size:", tileSize);
  }
  
  // Render each tile in the map
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      // Skip if the tile doesn't exist
      if (!map.tiles[y] || !map.tiles[y][x]) continue;
      
      const tile = map.tiles[y][x];
      
      // Create terrain sprite
      const terrainSprite = new PIXI.Sprite(terrainTextures[tile.terrain]);
      terrainSprite.position.set(x * tileSize, y * tileSize);
      terrainSprite.width = tileSize;
      terrainSprite.height = tileSize;
      terrainLayer.addChild(terrainSprite);
      
      // Add resource sprite if the tile has a resource
      if (tile.resource > 0) {
        const resourceSprite = new PIXI.Sprite(resourceTextures[tile.resource]);
        resourceSprite.position.set(x * tileSize + tileSize / 4, y * tileSize + tileSize / 4);
        resourceSprite.width = tileSize / 2;
        resourceSprite.height = tileSize / 2;
        resourceLayer.addChild(resourceSprite);
      }
    }
  }
  
  // Center the map in the view
  if (app) {
    console.log("Centering map in view");
    worldContainer.position.set(
      (app.screen.width - mapWidth * tileSize) / 2,
      (app.screen.height - mapHeight * tileSize) / 2
    );
  }
}

// Render buildings from game state
function renderBuildings(buildings: any[]) {
  // Clear existing buildings
  buildingLayer.removeChildren();
  
  // Create and add building sprites
  buildings.forEach(building => {
    if (buildingTextures[building.type]) {
      const sprite = new PIXI.Sprite(buildingTextures[building.type]);
      sprite.position.set(building.position.x, building.position.y);
      sprite.anchor.set(0.5, 0.5);
      sprite.interactive = true;
      
      // Store building data in sprite
      (sprite as any).buildingData = building;
      
      // Add to building layer
      buildingLayer.addChild(sprite);
      
      // Add selection indicator if this building is selected
      if (selectedBuilding && selectedBuilding.id === building.id) {
        const selection = new PIXI.Sprite(buildingTextures['selection']);
        selection.position.set(building.position.x, building.position.y);
        selection.anchor.set(0.5, 0.5);
        buildingLayer.addChild(selection);
      }
    }
  });
  
  // Add building ghost for placement preview
  if (isPlacementMode && selectedBuildingType) {
    if (buildingGhost) {
      buildingLayer.removeChild(buildingGhost);
    }
    
    buildingGhost = new PIXI.Sprite(buildingTextures[selectedBuildingType]);
    buildingGhost.position.set(
      Math.floor(hoverPosition.x / tileSize) * tileSize,
      Math.floor(hoverPosition.y / tileSize) * tileSize
    );
    buildingGhost.anchor.set(0.5, 0.5);
    buildingGhost.alpha = 0.6;
    buildingLayer.addChild(buildingGhost);
  }
}

// Place a new building
function placeBuilding(type: string, x: number, y: number) {
  // Create a new building object
  const building = {
    id: crypto.randomUUID(),
    type,
    position: { x, y },
    connections: [],
    efficiency: 1.0,
    isActive: true
  };
  
  // Update game state
  gameState.update(state => {
    return {
      ...state,
      buildings: [...(state.buildings || []), building]
    };
  });
  
  console.log(`Placed ${type} at (${x}, ${y})`);
}

// Select a building at a position
function selectBuildingAt(x: number, y: number) {
  const state = get(gameState);
  selectedBuilding = null;
  
  if (state.buildings) {
    for (const building of state.buildings) {
      // Simple distance check
      const distance = Math.sqrt(
        Math.pow(building.position.x - x, 2) + 
        Math.pow(building.position.y - y, 2)
      );
      
      // If within the radius of the building, select it
      if (distance < tileSize) {
        selectedBuilding = building;
        console.log(`Selected building: ${building.type} (ID: ${building.id})`);
        break;
      }
    }
  }
  
  if (!selectedBuilding) {
    console.log("No building selected");
  }
  
  // Re-render buildings to show selection
  renderBuildings(state.buildings || []);
}

// Set placement mode
export function setPlacementMode(enabled: boolean, buildingType?: string) {
  isPlacementMode = enabled;
  
  if (enabled && buildingType) {
    selectedBuildingType = buildingType;
    console.log(`Placement mode enabled for ${buildingType}`);
  } else {
    console.log("Placement mode disabled");
  }
  
  // Update ghost visibility
  if (!enabled && buildingGhost) {
    buildingLayer.removeChild(buildingGhost);
    buildingGhost = null;
  } else if (enabled && selectedBuildingType) {
    // Will be created on next render
    const state = get(gameState);
    renderBuildings(state.buildings || []);
  }
}

// Set selected building
export function setSelectedBuilding(building: any) {
  selectedBuilding = building;
  
  // Update rendering
  const state = get(gameState);
  renderBuildings(state.buildings || []);
}

// Reset view
export function resetView() {
  // Reset zoom and position
  worldContainer.scale.set(1, 1);
  
  const app = get(pixiApp);
  if (app) {
    worldContainer.position.set(
      (app.screen.width - mapWidth * tileSize) / 2,
      (app.screen.height - mapHeight * tileSize) / 2
    );
  }
}

// Move world container with WASD controls
export function moveWorld(dx: number, dy: number) {
  if (!worldContainer) return;
  
  // Update world container position
  worldContainer.x += dx;
  worldContainer.y += dy;
  
  // Log position for debugging
  if (dx !== 0 || dy !== 0) {
    console.log(`Moving world: dx=${dx}, dy=${dy}, position=(${worldContainer.x}, ${worldContainer.y})`);
  }
}

// Add a player character to the game
export function addPlayerCharacter() {
  const app = get(pixiApp);
  if (!app || !characterLayer) {
    console.error("Can't add player character - app or character layer not available");
    return;
  }
  
  console.log("Creating player character");
  
  // Create a simple character sprite
  const graphics = new PIXI.Graphics();
  
  // Draw character (a simple colored circle with an arrow for direction)
  graphics.lineStyle(2, 0xFFFFFF, 1);
  graphics.beginFill(0x3498db);
  graphics.drawCircle(0, 0, 16);
  graphics.endFill();
  
  // Draw direction indicator
  graphics.lineStyle(2, 0xFFFFFF, 1);
  graphics.moveTo(0, 0);
  graphics.lineTo(16, 0);
  
  // Create texture from graphics
  const texture = app.renderer.generateTexture(graphics);
  
  // Create sprite from texture
  playerCharacter = new PIXI.Sprite(texture);
  playerCharacter.anchor.set(0.5, 0.5);
  
  // Position at center of the screen
  const screenCenter = {
    x: app.screen.width / 2,
    y: app.screen.height / 2
  };
  
  // Convert screen center to world coordinates
  const worldPos = {
    x: (screenCenter.x - worldContainer.x) / worldContainer.scale.x,
    y: (screenCenter.y - worldContainer.y) / worldContainer.scale.y
  };
  
  playerCharacter.position.set(worldPos.x, worldPos.y);
  
  // Add to character layer
  characterLayer.addChild(playerCharacter);
  
  console.log("Player character added at position:", playerCharacter.position);
  
  return playerCharacter;
}
```

# frontend/src/lib/soundManager.ts

```ts
// frontend/src/lib/soundManager.ts
import { writable } from 'svelte/store';
import { AssetType } from './assetManager';

// Sound categories
export enum SoundCategory {
  MUSIC = 'music',
  AMBIENCE = 'ambience',
  SFX = 'sfx',
  UI = 'ui',
  VOICE = 'voice'
}

// Sound states
export interface SoundState {
  isMuted: boolean;
  masterVolume: number; // 0-1
  categoryVolumes: Record<SoundCategory, number>; // 0-1 for each category
  currentMusic?: string; // ID of current music track
  currentAmbience?: string; // ID of current ambient sound
}

// Create a store for sound state
export const soundState = writable<SoundState>({
  isMuted: false,
  masterVolume: 0.8,
  categoryVolumes: {
    [SoundCategory.MUSIC]: 0.7,
    [SoundCategory.AMBIENCE]: 0.5,
    [SoundCategory.SFX]: 1.0,
    [SoundCategory.UI]: 0.8,
    [SoundCategory.VOICE]: 1.0
  }
});

// Audio elements cache
const audioElements = new Map<string, HTMLAudioElement>();
const playingSounds = new Map<string, { element: HTMLAudioElement, category: SoundCategory }>();

// Active audio context
let audioContext: AudioContext;
let masterGainNode: GainNode;
const categoryGainNodes = new Map<SoundCategory, GainNode>();

// Initialize the sound system
export function initSoundSystem(): void {
  // Create audio context
  audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Set up master volume
  masterGainNode = audioContext.createGain();
  masterGainNode.gain.value = 0.8; // Default volume
  masterGainNode.connect(audioContext.destination);
  
  // Create gain nodes for each category
  Object.values(SoundCategory).forEach(category => {
    const gain = audioContext.createGain();
    gain.connect(masterGainNode);
    categoryGainNodes.set(category, gain);
  });
  
  // Subscribe to store changes to update volumes
  soundState.subscribe(state => {
    // Update master volume
    if (masterGainNode) {
      masterGainNode.gain.value = state.isMuted ? 0 : state.masterVolume;
    }
    
    // Update category volumes
    Object.entries(state.categoryVolumes).forEach(([category, volume]) => {
      const gainNode = categoryGainNodes.get(category as SoundCategory);
      if (gainNode) {
        gainNode.gain.value = volume;
      }
    });
  });
  
  console.log('Sound system initialized');
}

// Preload an audio asset
export async function preloadSound(id: string, path: string, category: SoundCategory): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.src = path;
    
    audio.addEventListener('canplaythrough', () => {
      audioElements.set(id, audio);
      resolve();
    }, { once: true });
    
    audio.addEventListener('error', () => {
      reject(new Error(`Failed to load audio: ${path}`));
    }, { once: true });
    
    audio.load();
  });
}

// Play a sound with various options
export function playSound(
  id: string, 
  category: SoundCategory,
  options: {
    volume?: number,
    loop?: boolean,
    fadeIn?: number,
    fadeOut?: number,
    playbackRate?: number,
    onEnd?: () => void
  } = {}
): { id: string, stop: () => void } {
  // Get audio element
  let audio = audioElements.get(id);
  if (!audio) {
    console.error(`Sound not found: ${id}`);
    return null;
  }
  
  // Clone the audio to allow multiple instances
  audio = audio.cloneNode() as HTMLAudioElement;
  
  // Create a unique ID for this playback instance
  const playbackId = `${id}_${Date.now()}`;
  
  // Set options
  if (options.volume !== undefined) audio.volume = options.volume;
  if (options.loop !== undefined) audio.loop = options.loop;
  if (options.playbackRate !== undefined) audio.playbackRate = options.playbackRate;
  
  // Apply category and master volume
  soundState.subscribe(state => {
    if (!audio) return;
    
    const categoryVolume = state.categoryVolumes[category] || 1;
    const masterVolume = state.isMuted ? 0 : state.masterVolume;
    const baseVolume = options.volume !== undefined ? options.volume : 1;
    
    audio.volume = baseVolume * categoryVolume * masterVolume;
  });
  
  // Handle fade in
  if (options.fadeIn && options.fadeIn > 0) {
    audio.volume = 0;
    let startTime = Date.now();
    const fadeInInterval = setInterval(() => {
      if (!audio) {
        clearInterval(fadeInInterval);
        return;
      }
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (options.fadeIn * 1000), 1);
      
      // Get current volume settings from store
      const state = get(soundState);
      const categoryVolume = state.categoryVolumes[category] || 1;
      const masterVolume = state.isMuted ? 0 : state.masterVolume;
      const baseVolume = options.volume !== undefined ? options.volume : 1;
      
      audio.volume = progress * baseVolume * categoryVolume * masterVolume;
      
      if (progress >= 1) {
        clearInterval(fadeInInterval);
      }
    }, 50);
  }
  
  // Register end handler
  if (options.onEnd) {
    audio.addEventListener('ended', options.onEnd, { once: true });
  }
  
  // Track this sound in playing sounds
  playingSounds.set(playbackId, { element: audio, category });
  
  // Start playback
  audio.play().catch(err => {
    console.error('Error playing sound:', err);
  });
  
  // Return control object
  return {
    id: playbackId,
    stop: () => stopSound(playbackId, options.fadeOut)
  };
}

// Stop a playing sound
function stopSound(playbackId: string, fadeOut?: number): void {
  const sound = playingSounds.get(playbackId);
  if (!sound) return;
  
  const { element: audio } = sound;
  
  if (fadeOut && fadeOut > 0) {
    // Fade out
    const startVolume = audio.volume;
    const startTime = Date.now();
    
    const fadeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (fadeOut * 1000), 1);
      
      audio.volume = startVolume * (1 - progress);
      
      if (progress >= 1) {
        clearInterval(fadeInterval);
        audio.pause();
        audio.currentTime = 0;
        playingSounds.delete(playbackId);
      }
    }, 50);
  } else {
    // Stop immediately
    audio.pause();
    audio.currentTime = 0;
    playingSounds.delete(playbackId);
  }
}

// Play music track (only one can play at a time)
export function playMusic(
  id: string,
  options: {
    volume?: number,
    fadeIn?: number,
    fadeOut?: number,
    crossFade?: boolean
  } = {}
): void {
  // Get current state
  const state = get(soundState);
  
  // If the requested track is already playing, do nothing
  if (state.currentMusic === id) return;
  
  // Stop current music if any
  if (state.currentMusic) {
    // Use crossfade if specified
    const fadeOut = options.crossFade ? (options.fadeOut || 2) : (options.fadeOut || 0);
    stopMusic({ fadeOut });
  }
  
  // Play the new track
  const musicControl = playSound(id, SoundCategory.MUSIC, {
    loop: true,
    volume: options.volume || 1,
    fadeIn: options.fadeIn || 2
  });
  
  // Update current music in state
  if (musicControl) {
    soundState.update(state => ({
      ...state,
      currentMusic: id
    }));
  }
}

// Stop current music
export function stopMusic(options: { fadeOut?: number } = {}): void {
  // Get current state
  const state = get(soundState);
  
  // Find all playing sounds in the MUSIC category
  for (const [id, sound] of playingSounds.entries()) {
    if (sound.category === SoundCategory.MUSIC) {
      stopSound(id, options.fadeOut);
    }
  }
  
  // Update state
  soundState.update(state => ({
    ...state,
    currentMusic: undefined
  }));
}

// Play ambient sound
export function playAmbience(
  id: string,
  options: {
    volume?: number,
    fadeIn?: number,
    fadeOut?: number,
    crossFade?: boolean
  } = {}
): void {
  // Get current state
  const state = get(soundState);
  
  // If the requested ambience is already playing, do nothing
  if (state.currentAmbience === id) return;
  
  // Stop current ambience if any
  if (state.currentAmbience) {
    // Use crossfade if specified
    const fadeOut = options.crossFade ? (options.fadeOut || 2) : (options.fadeOut || 0);
    stopAmbience({ fadeOut });
  }
  
  // Play the new ambience
  const ambienceControl = playSound(id, SoundCategory.AMBIENCE, {
    loop: true,
    volume: options.volume || 1,
    fadeIn: options.fadeIn || 2
  });
  
  // Update current ambience in state
  if (ambienceControl) {
    soundState.update(state => ({
      ...state,
      currentAmbience: id
    }));
  }
}

// Stop current ambience
export function stopAmbience(options: { fadeOut?: number } = {}): void {
  // Get current state
  const state = get(soundState);
  
  // Find all playing sounds in the AMBIENCE category
  for (const [id, sound] of playingSounds.entries()) {
    if (sound.category === SoundCategory.AMBIENCE) {
      stopSound(id, options.fadeOut);
    }
  }
  
  // Update state
  soundState.update(state => ({
    ...state,
    currentAmbience: undefined
  }));
}

// Toggle mute state
export function toggleMute(): void {
  soundState.update(state => ({
    ...state,
    isMuted: !state.isMuted
  }));
}

// Set master volume
export function setMasterVolume(volume: number): void {
  soundState.update(state => ({
    ...state,
    masterVolume: Math.max(0, Math.min(1, volume))
  }));
}

// Set category volume
export function setCategoryVolume(category: SoundCategory, volume: number): void {
  soundState.update(state => ({
    ...state,
    categoryVolumes: {
      ...state.categoryVolumes,
      [category]: Math.max(0, Math.min(1, volume))
    }
  }));
}

// Resume audio context (needed for browsers that suspend it until user interaction)
export function resumeAudioContext(): void {
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

// Helper function to get store value synchronously
function get<T>(store: { subscribe: (callback: (value: T) => void) => void }): T {
  let value: T;
  const unsubscribe = store.subscribe((v: T) => {
    value = v;
  });
  unsubscribe();
  return value;
}
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

# frontend/src/lib/types.ts

```ts
// src/lib/types.ts
  
  // Biome distribution - percentage of map covered by each biome
  export interface BiomeDistribution {
    water: number;
    plains: number;
    forest: number;
    mountains: number;
    desert: number;
    tundra: number;
    volcanic: number;
    alienFeatures: number;
  }
  
  // Map generator parameters
  export interface MapGeneratorParams {
    width: number;
    height: number;
    seed?: number;
    oceanLevel?: number; // 0-1, default 0.4
    mountainLevel?: number; // 0-1, default 0.7
    resourceRichness?: number; // 0-1, default 0.5
    alienness?: number; // 0-1, how "alien" the landscape is, default 0.3
    smoothness?: number; // 0-1, terrain smoothness, default 0.5
    moistureScale?: number; // Scale for moisture noise, default 0.01
    heightScale?: number; // Scale for height noise, default 0.005
    temperatureScale?: number; // Scale for temperature noise, default 0.008
    biomeScale?: number; // Scale for biome noise, default 0.02
    specialFeatureCount?: number; // Number of special features, default 5
    planetType?: PlanetType; // Planet template to use
  }
  

  export enum AssetType {
        SOUND_EFFECT = 'sound_effect',
        MUSIC = 'music',
        AMBIENCE = 'ambience',
        FOLEY = 'foley',
        SPRITE = 'sprite',
        TILESET = 'tileset',
        ANIMATION = 'animation',
        BUILDING = 'building',
        CHARACTER = 'character',
        TERRAIN = 'terrain',
        DECORATION = 'decoration',
        UI = 'ui'
    }
  
  // Basic Asset Metadata
  export interface AssetMetadata {
    id: string;
    type: AssetType;
    path: string;
    name: string;
    description?: string;
    tags?: string[];
    frameCount?: number;
    frameRate?: number;
    loop?: boolean;
    volume?: number;
    dimensions?: {
      width: number;
      height: number;
    };
    variants?: string[];
    author?: string;
    license?: string;
  }
  
  // Tileset Asset
  export interface TilesetAsset extends AssetMetadata {
    type: AssetType.TILESET | AssetType.TERRAIN;
    tileWidth: number;
    tileHeight: number;
    columns: number;
    rows: number;
    terrainTypes?: string[];
    tileProperties?: Record<number, any>;
  }
  
  // Terrain types
  export enum TerrainType {
    DEEP_WATER = 0,
    SHALLOW_WATER = 1,
    SAND = 2,
    GRASS = 3,
    FOREST = 4,
    HILLS = 5,
    MOUNTAINS = 6,
    SNOW = 7,
    VOLCANIC = 8,
    LAVA = 9,
    CAVE = 10,
    ALIEN_GRASS = 11,
    ALIEN_FOREST = 12,
    ALIEN_CRYSTAL = 13,
    METHANE_LAKE = 14,
    ICE = 15
  }
  
  // Resource deposits
  export enum ResourceType {
    NONE = 0,
    METHANE = 1,
    OXYGEN = 2,
    WATER = 3,
    IRON = 4,
    COPPER = 5,
    SILICON = 6,
    SULFUR = 7,
    URANIUM = 8,
    RARE_METALS = 9,
    XENOCRYSTALS = 10
  }
  
  // Map tile interface
  export interface MapTile {
    terrain: TerrainType;
    resource: ResourceType;
    resourceDensity: number; // 0-1
    temperature: number; // Kelvin
    pressure: number; // Pascal
    radiation: number; // 0-1
    height: number; // 0-1
    moisture: number; // 0-1
    traversable: boolean;
    decorations: number[]; // IDs of decorative elements
  }
  
  // Planet map
  export interface PlanetMap {
    name: string;
    width: number;
    height: number;
    seed: number;
    tiles: MapTile[][];
    biomes: BiomeDistribution;
    resourceRichness: number; // 0-1
    baseTemperature: number; // Kelvin
    basePressure: number; // Pascal
    gravity: number; // 1 = Earth
    atmosphere: AtmosphereType;
    specialFeatures: SpecialFeature[];
  }
  
  // Atmosphere types
  export enum AtmosphereType {
    NONE = 'none',
    THIN = 'thin',
    EARTH_LIKE = 'earth_like',
    THICK = 'thick',
    TOXIC = 'toxic',
    METHANE = 'methane',
    REDUCING = 'reducing',
    OXIDIZING = 'oxidizing'
  }
  
  // Special map features
  export enum SpecialFeature {
    METEOR_CRATER = 'meteor_crater',
    VOLCANO = 'volcano',
    CANYON = 'canyon',
    CAVE_SYSTEM = 'cave_system',
    ALIEN_RUINS = 'alien_ruins',
    GEOTHERMAL_AREA = 'geothermal_area',
    CRYSTAL_FORMATION = 'crystal_formation',
    ABANDONED_BASE = 'abandoned_base',
    STRANGE_SIGNAL = 'strange_signal',
    ANCIENT_TECHNOLOGY = 'ancient_technology'
  }
  
  // Biome distribution - percentage of map covered by each biome
  export interface BiomeDistribution {
    water: number;
    plains: number;
    forest: number;
    mountains: number;
    desert: number;
    tundra: number;
    volcanic: number;
    alienFeatures: number;
  }
  
  // Map generator parameters
  export interface MapGeneratorParams {
    width: number;
    height: number;
    seed?: number;
    oceanLevel?: number; // 0-1, default 0.4
    mountainLevel?: number; // 0-1, default 0.7
    resourceRichness?: number; // 0-1, default 0.5
    alienness?: number; // 0-1, how "alien" the landscape is, default 0.3
    smoothness?: number; // 0-1, terrain smoothness, default 0.5
    moistureScale?: number; // Scale for moisture noise, default 0.01
    heightScale?: number; // Scale for height noise, default 0.005
    temperatureScale?: number; // Scale for temperature noise, default 0.008
    biomeScale?: number; // Scale for biome noise, default 0.02
    specialFeatureCount?: number; // Number of special features, default 5
    planetType?: PlanetType; // Planet template to use
  }
  
  // Predefined planet types
  export enum PlanetType {
    EARTH_LIKE = 'earth_like',
    DESERT = 'desert',
    ICE = 'ice',
    VOLCANIC = 'volcanic',
    ALIEN = 'alien',
    OCEAN = 'ocean',
    MARS_LIKE = 'mars_like'
  }
  
  // Predefined planet templates
  export const planetTemplates = {
    [PlanetType.EARTH_LIKE]: {
      baseTemperature: 288, // 15°C in Kelvin
      basePressure: 101325, // 1 atm in Pascal
      atmosphere: AtmosphereType.EARTH_LIKE,
      gravity: 1.0,
      biomes: {
        water: 0.7,
        plains: 0.15,
        forest: 0.1,
        mountains: 0.03,
        desert: 0.01,
        tundra: 0.01,
        volcanic: 0,
        alienFeatures: 0
      }
    },
    [PlanetType.DESERT]: {
      baseTemperature: 313, // 40°C in Kelvin
      basePressure: 90000, // Slightly less than Earth
      atmosphere: AtmosphereType.THIN,
      gravity: 0.8,
      biomes: {
        water: 0.05,
        plains: 0.05,
        forest: 0.01,
        mountains: 0.04,
        desert: 0.85,
        tundra: 0,
        volcanic: 0,
        alienFeatures: 0
      }
    },
    [PlanetType.ICE]: {
      baseTemperature: 233, // -40°C in Kelvin
      basePressure: 60000, // Much less than Earth
      atmosphere: AtmosphereType.THIN,
      gravity: 0.7,
      biomes: {
        water: 0.3,
        plains: 0.05,
        forest: 0.01,
        mountains: 0.04,
        desert: 0,
        tundra: 0.6,
        volcanic: 0,
        alienFeatures: 0
      }
    },
    [PlanetType.VOLCANIC]: {
      baseTemperature: 373, // 100°C in Kelvin
      basePressure: 202650, // 2 atm in Pascal
      atmosphere: AtmosphereType.TOXIC,
      gravity: 1.2,
      biomes: {
        water: 0.1,
        plains: 0.1,
        forest: 0,
        mountains: 0.1,
        desert: 0.2,
        tundra: 0,
        volcanic: 0.5,
        alienFeatures: 0
      }
    },
    [PlanetType.ALIEN]: {
      baseTemperature: 293, // 20°C in Kelvin
      basePressure: 80000, // Less than Earth
      atmosphere: AtmosphereType.METHANE,
      gravity: 0.9,
      biomes: {
        water: 0.3,
        plains: 0.1,
        forest: 0.1,
        mountains: 0.1,
        desert: 0.1,
        tundra: 0.05,
        volcanic: 0.05,
        alienFeatures: 0.2
      }
    },
    [PlanetType.OCEAN]: {
      baseTemperature: 283, // 10°C in Kelvin
      basePressure: 101325, // 1 atm in Pascal
      atmosphere: AtmosphereType.EARTH_LIKE,
      gravity: 1.0,
      biomes: {
        water: 0.9,
        plains: 0.05,
        forest: 0.02,
        mountains: 0.01,
        desert: 0.01,
        tundra: 0.01,
        volcanic: 0,
        alienFeatures: 0
      }
    },
    [PlanetType.MARS_LIKE]: {
      baseTemperature: 210, // -63°C in Kelvin (Mars average)
      basePressure: 600, // Martian atmospheric pressure (~0.6% of Earth)
      atmosphere: AtmosphereType.THIN,
      gravity: 0.38, // Mars gravity relative to Earth
      biomes: {
        water: 0.01, // Very small amount of water ice
        plains: 0.40, // Martian plains
        forest: 0,    // No forests
        mountains: 0.20, // Olympus Mons and other Martian mountains
        desert: 0.39, // Mars is mostly desert-like
        tundra: 0,    // No tundra
        volcanic: 0,  // Dormant volcanic features
        alienFeatures: 0 // No alien features (yet!)
      }
    }
  };
```

# frontend/src/lib/wasm.ts

```ts
// frontend/src/lib/wasm.ts 

// Enhanced types to include temperature and pressure
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
    // New fields for temperature-dependent properties
    boiling_point?: number;   // Kelvin
    melting_point?: number;   // Kelvin
    vapor_pressure?: number;  // Function of temperature
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
  
  export interface EnhancedReactionResult {
    reaction_name: string;
    reaction_amount: number;
    consumed: Record<string, number>;
    produced: Record<string, number>;
    energy_change: number;
    temperature_factor: number;
    pressure_factor: number;
    final_temperature: number;
    reaction_rate: number;
    catalyst_used: boolean;
    catalyst_name?: string;
    temperature: number;
    pressure: number;
    error?: string;
  }
  
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

  // Enhanced version of the processReaction function
  export function processReactionEnhanced(
    reaction: Reaction,
    availableResources: Record<string, number>,
    temperature: number,
    pressure: number,
    deltaTime: number,
    catalystPresent: boolean
  ): EnhancedReactionResult {
    if (!isInitialized) {
      throw new Error('WASM module not initialized');
    }
    
    // For development, simulate the enhanced reaction with temperature and pressure effects
    const temperatureFactor = Math.exp(-reaction.activation_energy / (0.008314 * temperature));
    
    // Simplified pressure effect
    const pressureFactor = (pressure / 101325.0);
    
    // Simplified reaction calculation
    let reactionAmount = 1.0 * temperatureFactor * pressureFactor * deltaTime;
    
    // Calculate limitingFactor based on available resources
    const limitingFactors = Object.entries(reaction.reactants).map(([reactant, amount]) => {
      const available = availableResources[reactant] || 0;
      return available / amount;
    });
    
    const limitingFactor = Math.min(...limitingFactors);
    reactionAmount = Math.min(reactionAmount, limitingFactor);
    
    // Calculate consumed and produced
    const consumed: Record<string, number> = {};
    const produced: Record<string, number> = {};
    
    Object.entries(reaction.reactants).forEach(([reactant, amount]) => {
      consumed[reactant] = amount * reactionAmount;
    });
    
    Object.entries(reaction.products).forEach(([product, amount]) => {
      produced[product] = amount * reactionAmount;
    });
    
    // Energy change
    const energyChange = reaction.energy_delta * reactionAmount;
    
    // Calculate final temperature (simple model)
    const systemHeatCapacity = 10.0; // J/K
    const finalTemperature = temperature + energyChange / systemHeatCapacity;
    
    // Return the enhanced result
    return {
      reaction_name: reaction.name,
      reaction_amount: reactionAmount,
      consumed,
      produced,
      energy_change: energyChange,
      temperature_factor: temperatureFactor,
      pressure_factor: pressureFactor,
      final_temperature: finalTemperature,
      reaction_rate: reaction.rate_constant * temperatureFactor * pressureFactor,
      catalyst_used: catalystPresent && reaction.catalyst !== undefined,
      catalyst_name: reaction.catalyst,
      temperature,
      pressure
    };
    
    /* When the WASM implementation is ready, replace with:
    
    const reactionJson = JSON.stringify(reaction);
    const resourcesJson = JSON.stringify(availableResources);
    
    const resultJson = wasmModule.process_reaction_enhanced(
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
  import PixiGame from '../components/world/PixiGame.svelte';
  import BuildingControlPanel from '../components/ui/BuildingControlPanel.svelte';
  import { gameState } from '../stores/gameState';
  import { mapGenerator } from '../lib/mapGenerator';
  import { PlanetType } from '../lib/types';
  import { initWasm } from '../wasm';
  
  // Game component references
  let pixiGameComponent: PixiGame;
  
  // Game settings from URL or default
  const params = new URLSearchParams(window.location.search);
  let planetType = (params.get('planet') as PlanetType) || PlanetType.EARTH_LIKE;
  let mapWidth = parseInt(params.get('width') || '100');
  let mapHeight = parseInt(params.get('height') || '100');
  let resourceRichness = parseFloat(params.get('resources') || '0.5');
  
  // UI state
  let selectedBuildingType: string | null = null;
  let isPlacementMode = false;
  
  // Resources display
  let resources = {
    energy: $gameState.resources?.energy || 100,
    water: $gameState.resources?.water || 100,
    oxygen: $gameState.resources?.oxygen || 100,
    methane: $gameState.resources?.methane || 100
  };
  
  // Navigate back to menu
  function handleBackToMenu() {
    window.location.href = '/';
  }
  
  // Handle building selection from control panel
  function handleBuildingSelect(event: CustomEvent) {
    selectedBuildingType = event.detail.type;
    isPlacementMode = true;
    
    if (pixiGameComponent) {
      pixiGameComponent.selectBuildingType(selectedBuildingType);
    }
  }
  
  // Generate a new map if needed
  function ensureMapExists() {
    const state = $gameState;
    if (!state.map) {
      console.log(`Generating ${planetType} map (${mapWidth}x${mapHeight})`);
      
      const generatedMap = mapGenerator.generateMap({
        planetType,
        width: mapWidth,
        height: mapHeight,
        resourceRichness,
        specialFeatureCount: 3
      });
      
      gameState.update(state => ({
        ...state,
        map: generatedMap,
        planetType,
        tick: 0,
        buildings: [],
        lastUpdated: Date.now()
      }));
      
      console.log('Map generated:', generatedMap.name);
    }
  }
  
  // Process game ready event from PixiGame component
  function handleGameReady(event: CustomEvent) {
    console.log('PixiJS game initialized and ready', event.detail);
  }
  
  onMount(async () => {
    console.log("Game component mounted!");
    console.debug("Props received:", { planetType, mapWidth, mapHeight, resourceRichness });
    
    // Initialize WASM
    await initWasm();
    
    // Ensure we have a map
    ensureMapExists();
    
    // Log when game is ready
    console.log("Game component fully initialized");
  });
</script>

<div class="game-page">
  <header class="game-header">
    <h1>FrankForge</h1>
    <div class="resources">
      <div class="resource">
        <div class="resource-icon energy"></div>
        <div class="resource-value">{resources.energy}</div>
      </div>
      <div class="resource">
        <div class="resource-icon water"></div>
        <div class="resource-value">{resources.water}</div>
      </div>
      <div class="resource">
        <div class="resource-icon oxygen"></div>
        <div class="resource-value">{resources.oxygen}</div>
      </div>
      <div class="resource">
        <div class="resource-icon methane"></div>
        <div class="resource-value">{resources.methane}</div>
      </div>
    </div>
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
      <button class="menu-button" on:click={handleBackToMenu}>
        Back to Menu
      </button>
    </div>
  </header>
  
  <main class="game-content">
    <div class="sidebar">
      <BuildingControlPanel on:select={handleBuildingSelect} />
    </div>
    
    <div class="game-canvas-container">
      <PixiGame
        bind:this={pixiGameComponent}
        on:ready={handleGameReady}
      />
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
    background-color: rgba(26, 26, 46, 0.9);
    backdrop-filter: blur(5px);
    z-index: 100;
  }
  
  h1 {
    margin: 0;
    font-size: 24px;
    color: #3498db;
  }
  
  .resources {
    display: flex;
    gap: 20px;
  }
  
  .resource {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  .resource-icon {
    width: 20px;
    height: 20px;
    border-radius: 50%;
  }
  
  .energy {
    background-color: #f1c40f; /* Yellow for energy */
  }
  
  .water {
    background-color: #3498db; /* Blue for water */
  }
  
  .oxygen {
    background-color: #ecf0f1; /* Light gray/white for oxygen */
  }
  
  .methane {
    background-color: #9b59b6; /* Purple for methane */
  }
  
  .resource-value {
    font-size: 1rem;
    font-weight: bold;
    color: white;
  }
  
  .controls {
    display: flex;
    gap: 10px;
  }
  
  .control-button {
    background-color: #2c3e50;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .menu-button {
    background-color: #e74c3c;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  }
  
  .menu-button:hover {
    background-color: #c0392b;
  }
  
  .game-content {
    display: flex;
    flex: 1;
    overflow: hidden;
    position: relative;
  }
  
  .sidebar {
    width: 250px;
    padding: 16px;
    background-color: rgba(26, 26, 46, 0.8);
    backdrop-filter: blur(5px);
    z-index: 50;
    border-right: 1px solid rgba(52, 152, 219, 0.3);
  }
  
  .game-canvas-container {
    flex: 1;
    overflow: hidden;
    position: relative;
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

# frontend/src/scripts/README.md

```md
### To run this schript
\`\`\`bash
node src/scripts/terrainGenerator.js
\`\`\`
from the frontend folder

```

# frontend/src/scripts/terrainGenerator.js

```js
// frontend/src/scripts/terrainGenerator.js

/**
 * Terrain Asset Generator
 * 
 * This script generates placeholder terrain tiles and other game assets
 * for use in development until final assets are created.
 * 
 * Run this script with Node.js to generate a set of basic assets:
 * node src/scripts/terrainGenerator.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas } from 'canvas';

// Get current directory (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const TILE_SIZE = 32;
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'public', 'assets', 'sprites');

// Ensure output directories exist
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Create terrain directory structure
ensureDirectoryExists(path.join(OUTPUT_DIR, 'terrain'));
ensureDirectoryExists(path.join(OUTPUT_DIR, 'buildings'));
ensureDirectoryExists(path.join(OUTPUT_DIR, 'resources'));
ensureDirectoryExists(path.join(OUTPUT_DIR, 'decorations'));

// Terrain types and their colors
const terrainTypes = {
  DEEP_WATER: { color: '#0077BE', variants: 4 },
  SHALLOW_WATER: { color: '#39A0ED', variants: 4 },
  SAND: { color: '#E8D68A', variants: 4 },
  GRASS: { color: '#7EC850', variants: 4 },
  FOREST: { color: '#228B22', variants: 2 },
  HILLS: { color: '#8B7355', variants: 3 },
  MOUNTAINS: { color: '#6D6552', variants: 3 },
  SNOW: { color: '#EEEEFF', variants: 4 },
  VOLCANIC: { color: '#333333', variants: 2 },
  LAVA: { color: '#FF4500', variants: 4 },
  CAVE: { color: '#353535', variants: 1 },
  ALIEN_GRASS: { color: '#8A5FAF', variants: 4 },
  ALIEN_FOREST: { color: '#6A0DAD', variants: 2 },
  ALIEN_CRYSTAL: { color: '#00FFFF', variants: 4 },
  METHANE_LAKE: { color: '#30D5C8', variants: 4 },
  ICE: { color: '#BBDDFF', variants: 4 }
};

// Resource types and their colors
const resourceTypes = {
  METHANE: { color: '#26734D', density: 3 },
  OXYGEN: { color: '#90EE90', density: 3 },
  WATER: { color: '#4169E1', density: 3 },
  IRON: { color: '#A19D94', density: 3 },
  COPPER: { color: '#B87333', density: 3 },
  SILICON: { color: '#DAA520', density: 3 },
  SULFUR: { color: '#FFFF00', density: 3 },
  URANIUM: { color: '#00FF33', density: 3 },
  RARE_METALS: { color: '#D4AF37', density: 3 },
  XENOCRYSTALS: { color: '#E6E6FA', density: 3 }
};

// Building types and their colors
const buildingTypes = {
  EXTRACTOR: { color: '#3498db', variants: 1 },
  REACTOR: { color: '#e74c3c', variants: 1 },
  POWER_PLANT: { color: '#2ecc71', variants: 1 },
  STORAGE: { color: '#f1c40f', variants: 1 },
  PIPE: { color: '#95a5a6', variants: 1 }
};

// Decoration elements
const decorationTypes = {
  ROCK: { color: '#777777', variants: 3 },
  BUSH: { color: '#446644', variants: 3 },
  CRYSTAL: { color: '#AA66FF', variants: 3 },
  CRATER: { color: '#555555', variants: 2 },
  RUINS: { color: '#AAAAAA', variants: 5 }
};

// Generate noise texture (for randomness in tiles)
function generateNoiseTexture(canvas, context, intensity = 0.1) {
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() * 2 - 1) * intensity * 255;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));     // r
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // g
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // b
  }
  
  context.putImageData(imageData, 0, 0);
}

// Generate a single terrain tile
function generateTerrainTile(type, variant, animated = false) {
  const terrainInfo = terrainTypes[type];
  if (!terrainInfo) {
    console.error(`Unknown terrain type: ${type}`);
    return;
  }
  
  const canvas = createCanvas(TILE_SIZE, TILE_SIZE);
  const ctx = canvas.getContext('2d');
  
  // Set base color for terrain
  ctx.fillStyle = terrainInfo.color;
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  
  // Add some variation based on variant number
  const hueShift = variant * 5;
  const darken = (variant % 2) * 0.05;
  
  const imageData = ctx.getImageData(0, 0, TILE_SIZE, TILE_SIZE);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    // Adjust color slightly based on variant
    data[i] = Math.max(0, Math.min(255, data[i] - darken * 255));     // r
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + hueShift)); // g
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] - hueShift)); // b
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  // Add noise for texture
  generateNoiseTexture(canvas, ctx, 0.1);
  
  // Add features specific to terrain type
  switch (type) {
    case 'DEEP_WATER':
    case 'SHALLOW_WATER':
    case 'METHANE_LAKE':
      // Add wave pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      for (let i = 0; i < 3; i++) {
        const y = 10 + i * 8 + (animated ? variant * 2 : 0);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(TILE_SIZE / 4, y + 3, TILE_SIZE * 3 / 4, y - 3, TILE_SIZE, y);
        ctx.stroke();
      }
      break;
      
    case 'GRASS':
    case 'ALIEN_GRASS':
      // Add grass tufts
      ctx.fillStyle = type === 'GRASS' ? '#5C9B3A' : '#5A3D8F';
      for (let i = 0; i < 10; i++) {
        const x = Math.random() * TILE_SIZE;
        const y = Math.random() * TILE_SIZE;
        const size = 2 + Math.random() * 2;
        ctx.fillRect(x, y, size, size);
      }
      break;
      
    case 'FOREST':
    case 'ALIEN_FOREST':
      // Add tree trunks
      ctx.fillStyle = type === 'FOREST' ? '#664D36' : '#432569';
      ctx.fillRect(TILE_SIZE / 2 - 2, TILE_SIZE / 2 + 2, 4, 8);
      
      // Add tree canopy
      ctx.fillStyle = type === 'FOREST' ? '#1E7D1E' : '#5A3D8F';
      ctx.beginPath();
      ctx.arc(TILE_SIZE / 2, TILE_SIZE / 2 - 4, 8, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'MOUNTAINS':
      // Add mountain peaks
      ctx.fillStyle = '#5A5A5A';
      ctx.beginPath();
      ctx.moveTo(TILE_SIZE / 4, TILE_SIZE);
      ctx.lineTo(TILE_SIZE / 2, TILE_SIZE / 4);
      ctx.lineTo(TILE_SIZE * 3 / 4, TILE_SIZE);
      ctx.fill();
      
      // Add snow caps
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.moveTo(TILE_SIZE / 2 - 4, TILE_SIZE / 4 + 4);
      ctx.lineTo(TILE_SIZE / 2, TILE_SIZE / 4);
      ctx.lineTo(TILE_SIZE / 2 + 4, TILE_SIZE / 4 + 4);
      ctx.fill();
      break;
      
    case 'LAVA':
      // Add lava bubbles
      ctx.fillStyle = 'rgba(255, 255, 0, 0.6)';
      for (let i = 0; i < 3; i++) {
        const x = 5 + Math.random() * (TILE_SIZE - 10);
        const y = 5 + Math.random() * (TILE_SIZE - 10);
        const size = 2 + Math.random() * 3;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
      
    case 'ALIEN_CRYSTAL':
      // Add crystal formations
      ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.moveTo(TILE_SIZE / 2, 5);
      ctx.lineTo(TILE_SIZE - 5, TILE_SIZE / 2);
      ctx.lineTo(TILE_SIZE / 2, TILE_SIZE - 5);
      ctx.lineTo(5, TILE_SIZE / 2);
      ctx.closePath();
      ctx.fill();
      
      // Add glow effect if animated
      if (animated) {
        ctx.globalAlpha = 0.2 + (variant * 0.1);
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(TILE_SIZE / 2, TILE_SIZE / 2, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
      break;
  }
  
  // Add edge noise/detail
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
  
  return canvas;
}

// Generate resource overlay
function generateResourceTile(type, density) {
  const resourceInfo = resourceTypes[type];
  if (!resourceInfo) {
    console.error(`Unknown resource type: ${type}`);
    return;
  }
  
  const canvas = createCanvas(TILE_SIZE, TILE_SIZE);
  const ctx = canvas.getContext('2d');
  
  // Make the background transparent
  ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
  
  // Draw resource indicators based on density
  const count = 3 + density * 2; // Number of resource indicators
  const size = 3 + density * 2;  // Size of each indicator
  
  for (let i = 0; i < count; i++) {
    // Position resource indicators more centrally for higher density
    let margin = 10 - density * 2;
    let x = margin + Math.random() * (TILE_SIZE - margin * 2);
    let y = margin + Math.random() * (TILE_SIZE - margin * 2);
    
    ctx.fillStyle = resourceInfo.color;
    
    // Different shapes for different resources
    switch (type) {
      case 'METHANE':
      case 'OXYGEN':
        // Bubble-like
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(x - size / 3, y - size / 3, size / 3, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'IRON':
      case 'COPPER':
      case 'RARE_METALS':
        // Solid chunks
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
        break;
        
      case 'XENOCRYSTALS':
        // Crystal shape
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size, y);
        ctx.closePath();
        ctx.fill();
        break;
        
      default:
        // Default circular shape
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
  }
  
  return canvas;
}

// Generate building tile
function generateBuildingTile(type, variant) {
  const buildingInfo = buildingTypes[type];
  if (!buildingInfo) {
    console.error(`Unknown building type: ${type}`);
    return;
  }
  
  const canvas = createCanvas(TILE_SIZE, TILE_SIZE);
  const ctx = canvas.getContext('2d');
  
  // Clear background
  ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
  
  // Draw building based on type
  switch (type) {
    case 'EXTRACTOR':
      // Base
      ctx.fillStyle = '#3498db';
      ctx.beginPath();
      ctx.arc(TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner mechanism
      ctx.fillStyle = '#2980b9';
      ctx.beginPath();
      ctx.arc(TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE / 4, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'REACTOR':
      // Base
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
      
      // Inner details (warning stripes)
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(TILE_SIZE / 4, TILE_SIZE / 4, TILE_SIZE / 2, TILE_SIZE / 2);
      break;
      
    case 'POWER_PLANT':
      // Triangle shape
      ctx.fillStyle = '#2ecc71';
      ctx.beginPath();
      ctx.moveTo(TILE_SIZE / 2, 2);
      ctx.lineTo(TILE_SIZE - 2, TILE_SIZE - 2);
      ctx.lineTo(2, TILE_SIZE - 2);
      ctx.closePath();
      ctx.fill();
      break;
      
    case 'STORAGE':
      // Cylindrical tank
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(4, 8, TILE_SIZE - 8, TILE_SIZE - 12);
      
      // Tank top
      ctx.beginPath();
      ctx.ellipse(TILE_SIZE / 2, 8, TILE_SIZE / 2 - 4, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Tank bottom
      ctx.beginPath();
      ctx.ellipse(TILE_SIZE / 2, TILE_SIZE - 4, TILE_SIZE / 2 - 4, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'PIPE':
      // Pipe body
      ctx.fillStyle = '#95a5a6';
      ctx.fillRect(TILE_SIZE / 3, 0, TILE_SIZE / 3, TILE_SIZE);
      
      // Joint
      ctx.fillStyle = '#7f8c8d';
      ctx.beginPath();
      ctx.arc(TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE / 4, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
  
  // Add detail based on variant
  if (variant > 0) {
    // For animated buildings or different states
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    if (variant === 1) {
      // Working state
      ctx.beginPath();
      ctx.arc(TILE_SIZE * 3 / 4, TILE_SIZE / 4, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (variant === 2) {
      // Alert/Warning state
      ctx.fillStyle = 'rgba(255, 200, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(TILE_SIZE * 3 / 4, TILE_SIZE / 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  return canvas;
}

// Generate a decoration element
function generateDecorationTile(type, variant) {
  const decorationInfo = decorationTypes[type];
  if (!decorationInfo) {
    console.error(`Unknown decoration type: ${type}`);
    return;
  }
  
  const canvas = createCanvas(TILE_SIZE, TILE_SIZE);
  const ctx = canvas.getContext('2d');
  
  // Make the background transparent
  ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
  
  // Draw decoration based on type
  switch (type) {
    case 'ROCK':
      // Draw random rock shape
      ctx.fillStyle = decorationInfo.color;
      ctx.beginPath();
      
      // Create random rock polygon
      const centerX = TILE_SIZE / 2;
      const centerY = TILE_SIZE / 2 + 4;
      const radius = 6 + variant * 2;
      const points = 5 + variant;
      
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const r = radius * (0.8 + Math.random() * 0.4);
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.closePath();
      ctx.fill();
      
      // Add shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + 8, radius * 0.8, radius * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'BUSH':
      // Draw bush
      ctx.fillStyle = decorationInfo.color;
      
      // Bush foliage (multiple circles)
      for (let i = 0; i < 3 + variant; i++) {
        const x = TILE_SIZE / 2 + (Math.random() - 0.5) * 8;
        const y = TILE_SIZE / 2 + (Math.random() - 0.5) * 6;
        const size = 4 + Math.random() * 3;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
      
    case 'CRYSTAL':
      // Draw crystal formation
      ctx.fillStyle = decorationInfo.color;
      
      // Multiple crystal shards
      for (let i = 0; i < 2 + variant; i++) {
        const x = TILE_SIZE / 2 + (Math.random() - 0.5) * 12;
        const y = TILE_SIZE / 2 + (Math.random() - 0.5) * 8;
        const height = 6 + Math.random() * 8;
        const width = 2 + Math.random() * 3;
        
        ctx.beginPath();
        ctx.moveTo(x, y + height / 2);
        ctx.lineTo(x + width / 2, y - height / 2);
        ctx.lineTo(x - width / 2, y - height / 2);
        ctx.closePath();
        ctx.fill();
      }
      
      // Add glow effect
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(TILE_SIZE / 2, TILE_SIZE / 2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
      break;
      
    case 'CRATER':
      // Draw crater
      ctx.fillStyle = decorationInfo.color;
      
      // Crater pit
      ctx.beginPath();
      ctx.arc(TILE_SIZE / 2, TILE_SIZE / 2, 8 + variant * 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Crater rim
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(TILE_SIZE / 2, TILE_SIZE / 2, 10 + variant * 2, 0, Math.PI * 2);
      ctx.stroke();
      break;
      
    case 'RUINS':
      // Draw alien ruins
      ctx.fillStyle = decorationInfo.color;
      
      // Different ruin types based on variant
      if (variant === 0) {
        // Broken column
        ctx.fillRect(TILE_SIZE / 2 - 3, TILE_SIZE / 2 - 8, 6, 16);
        
        // Broken top
        ctx.beginPath();
        ctx.moveTo(TILE_SIZE / 2 - 5, TILE_SIZE / 2 - 8);
        ctx.lineTo(TILE_SIZE / 2 + 5, TILE_SIZE / 2 - 8);
        ctx.lineTo(TILE_SIZE / 2 + 3, TILE_SIZE / 2 - 12);
        ctx.lineTo(TILE_SIZE / 2 - 3, TILE_SIZE / 2 - 12);
        ctx.closePath();
        ctx.fill();
      } else if (variant === 1) {
        // Wall segment
        ctx.fillRect(TILE_SIZE / 3, TILE_SIZE / 2, TILE_SIZE / 3, TILE_SIZE / 3);
        
        // Broken edges
        ctx.beginPath();
        ctx.moveTo(TILE_SIZE / 3, TILE_SIZE / 2);
        ctx.lineTo(TILE_SIZE * 2 / 3, TILE_SIZE / 2);
        ctx.lineTo(TILE_SIZE * 2 / 3 - 2, TILE_SIZE / 2 - 4);
        ctx.lineTo(TILE_SIZE / 3 + 2, TILE_SIZE / 2 - 4);
        ctx.closePath();
        ctx.fill();
      } else {
        // Strange alien artifact
        ctx.beginPath();
        ctx.arc(TILE_SIZE / 2, TILE_SIZE / 2, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Alien glyphs
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          const angle = (i / 3) * Math.PI * 2;
          const x1 = TILE_SIZE / 2 + Math.cos(angle) * 10;
          const y1 = TILE_SIZE / 2 + Math.sin(angle) * 10;
          const x2 = TILE_SIZE / 2 + Math.cos(angle + Math.PI) * 10;
          const y2 = TILE_SIZE / 2 + Math.sin(angle + Math.PI) * 10;
          
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
      break;
  }
  
  return canvas;
}

// Generate all tiles and save them
async function generateAllTiles() {
  console.log('Generating terrain tiles...');
  
  // Create tileset canvas
  const TILESET_COLUMNS = 16;
  const TOTAL_TILES = Object.keys(terrainTypes).length * 4 + // terrain (4 variants each)
                      Object.keys(resourceTypes).length * 3 + // resources (3 densities each)
                      Object.keys(buildingTypes).length * 2 + // buildings (2 states each)
                      Object.keys(decorationTypes).length * 3; // decorations (3 variants each)
                      
  const TILESET_ROWS = Math.ceil(TOTAL_TILES / TILESET_COLUMNS);
  
  const tilesetCanvas = createCanvas(TILESET_COLUMNS * TILE_SIZE, TILESET_ROWS * TILE_SIZE);
  const tilesetCtx = tilesetCanvas.getContext('2d');
  
  // Fill with transparent background
  tilesetCtx.clearRect(0, 0, tilesetCanvas.width, tilesetCanvas.height);
  
  let tileIndex = 0;
  
  // Generate terrain tiles
  for (const [type, info] of Object.entries(terrainTypes)) {
    for (let variant = 0; variant < info.variants; variant++) {
      // Determine position in tileset
      const row = Math.floor(tileIndex / TILESET_COLUMNS);
      const col = tileIndex % TILESET_COLUMNS;
      
      // Generate tile
      const isAnimated = ['DEEP_WATER', 'SHALLOW_WATER', 'LAVA', 'METHANE_LAKE', 'ALIEN_CRYSTAL'].includes(type);
      const tileCanvas = generateTerrainTile(type, variant, isAnimated);
      
      // Draw to tileset
      tilesetCtx.drawImage(tileCanvas, col * TILE_SIZE, row * TILE_SIZE);
      
      // Save individual tile for reference
      const buffer = tileCanvas.toBuffer('image/png');
      fs.writeFileSync(path.join(OUTPUT_DIR, 'terrain', `${type.toLowerCase()}_${variant}.png`), buffer);
      
      tileIndex++;
    }
  }
  
  // Generate resource tiles
  for (const [type, info] of Object.entries(resourceTypes)) {
    for (let density = 0; density < info.density; density++) {
      // Determine position in tileset
      const row = Math.floor(tileIndex / TILESET_COLUMNS);
      const col = tileIndex % TILESET_COLUMNS;
      
      // Generate tile
      const tileCanvas = generateResourceTile(type, density);
      
      // Draw to tileset
      tilesetCtx.drawImage(tileCanvas, col * TILE_SIZE, row * TILE_SIZE);
      
      // Save individual tile for reference
      const buffer = tileCanvas.toBuffer('image/png');
      fs.writeFileSync(path.join(OUTPUT_DIR, 'resources', `${type.toLowerCase()}_${density}.png`), buffer);
      
      tileIndex++;
    }
  }
  
  // Generate building tiles
  for (const [type, info] of Object.entries(buildingTypes)) {
    for (let variant = 0; variant < info.variants + 1; variant++) {
      // Determine position in tileset
      const row = Math.floor(tileIndex / TILESET_COLUMNS);
      const col = tileIndex % TILESET_COLUMNS;
      
      // Generate tile
      const tileCanvas = generateBuildingTile(type, variant);
      
      // Draw to tileset
      tilesetCtx.drawImage(tileCanvas, col * TILE_SIZE, row * TILE_SIZE);
      
      // Save individual tile for reference
      const buffer = tileCanvas.toBuffer('image/png');
      fs.writeFileSync(path.join(OUTPUT_DIR, 'buildings', `${type.toLowerCase()}_${variant}.png`), buffer);
      
      tileIndex++;
    }
  }
  
  // Generate decoration tiles
  for (const [type, info] of Object.entries(decorationTypes)) {
    for (let variant = 0; variant < info.variants; variant++) {
      // Determine position in tileset
      const row = Math.floor(tileIndex / TILESET_COLUMNS);
      const col = tileIndex % TILESET_COLUMNS;
      
      // Generate tile
      const tileCanvas = generateDecorationTile(type, variant);
      
      // Draw to tileset
      tilesetCtx.drawImage(tileCanvas, col * TILE_SIZE, row * TILE_SIZE);
      
      // Save individual tile for reference
      // Save individual tile for reference
      const buffer = tileCanvas.toBuffer('image/png');
      fs.writeFileSync(path.join(OUTPUT_DIR, 'decorations', `${type.toLowerCase()}_${variant}.png`), buffer);
      
      tileIndex++;
    }
  }
  
  // Save complete tileset
  const tilesetBuffer = tilesetCanvas.toBuffer('image/png');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'terrain', 'terrain_tileset.png'), tilesetBuffer);
  
  console.log(`Generated ${tileIndex} tiles successfully!`);
  console.log(`Tileset saved to: ${path.join(OUTPUT_DIR, 'terrain', 'terrain_tileset.png')}`);
}

// Generate a terrain tileset for specific planet types
function generatePlanetTerrainSet(planetType) {
  console.log(`Generating tileset for planet type: ${planetType}...`);
  
  // Adjust colors based on planet type
  const colorAdjustments = {
    'earth': {},  // Default colors
    'mars': {
      // Reddish tint for Mars
      GRASS: { color: '#AA6C39' },
      SAND: { color: '#D9A066' },
      DEEP_WATER: { color: '#79553D' },  // Dark dried river beds
      SHALLOW_WATER: { color: '#9C7F65' }, // Light dried river beds
      MOUNTAINS: { color: '#8D6E63' },
      HILLS: { color: '#A1887F' },
    },
    'alien': {
      // Exotic colors for alien world
      GRASS: { color: '#7D3C98' },  // Purple grass
      SAND: { color: '#D0F5A9' },   // Light green sand
      DEEP_WATER: { color: '#D35400' }, // Orange liquid
      SHALLOW_WATER: { color: '#E67E22' }, // Light orange liquid
      MOUNTAINS: { color: '#34495E' }, // Dark blue-gray mountains
      HILLS: { color: '#5D6D7E' },
      FOREST: { color: '#6C3483' }, // Purple forest
    },
    'ice': {
      // Blue-white palette for ice world
      GRASS: { color: '#D6EAF8' },
      SAND: { color: '#EBF5FB' },
      DEEP_WATER: { color: '#2874A6' },
      SHALLOW_WATER: { color: '#3498DB' },
      MOUNTAINS: { color: '#D6DBDF' },
      HILLS: { color: '#F0F3F4' },
      FOREST: { color: '#A9CCE3' },
    }
  };
  
  // Apply color adjustments
  const originalColors = {};
  const adjustments = colorAdjustments[planetType.toLowerCase()] || {};
  
  for (const [type, info] of Object.entries(terrainTypes)) {
    // Save original color
    originalColors[type] = { ...info };
    
    // Apply adjustment if available
    if (adjustments[type]) {
      terrainTypes[type] = { ...info, ...adjustments[type] };
    }
  }
  
  // Generate the tileset
  const tilesetPath = path.join(OUTPUT_DIR, 'terrain', `${planetType.toLowerCase()}_tileset.png`);
  
  // Create a reduced tileset with just the main terrain types
  const TILESET_COLUMNS = 8;
  const mainTerrainTypes = ['DEEP_WATER', 'SHALLOW_WATER', 'SAND', 'GRASS', 'FOREST', 'HILLS', 'MOUNTAINS', 'SNOW'];
  const TOTAL_TILES = mainTerrainTypes.length * 4; // 4 variants per type
  
  const TILESET_ROWS = Math.ceil(TOTAL_TILES / TILESET_COLUMNS);
  
  const tilesetCanvas = createCanvas(TILESET_COLUMNS * TILE_SIZE, TILESET_ROWS * TILE_SIZE);
  const tilesetCtx = tilesetCanvas.getContext('2d');
  
  // Fill with transparent background
  tilesetCtx.clearRect(0, 0, tilesetCanvas.width, tilesetCanvas.height);
  
  let tileIndex = 0;
  
  // Generate only the main terrain tiles
  for (const type of mainTerrainTypes) {
    const info = terrainTypes[type];
    for (let variant = 0; variant < 4; variant++) { // Always generate 4 variants for consistency
      // Determine position in tileset
      const row = Math.floor(tileIndex / TILESET_COLUMNS);
      const col = tileIndex % TILESET_COLUMNS;
      
      // Generate tile
      const isAnimated = ['DEEP_WATER', 'SHALLOW_WATER'].includes(type);
      const tileCanvas = generateTerrainTile(type, variant, isAnimated);
      
      // Draw to tileset
      tilesetCtx.drawImage(tileCanvas, col * TILE_SIZE, row * TILE_SIZE);
      
      tileIndex++;
    }
  }
  
  // Save planet-specific tileset
  const tilesetBuffer = tilesetCanvas.toBuffer('image/png');
  fs.writeFileSync(tilesetPath, tilesetBuffer);
  
  console.log(`Generated planet tileset with ${tileIndex} tiles.`);
  console.log(`Planet tileset saved to: ${tilesetPath}`);
  
  // Restore original colors
  for (const [type, info] of Object.entries(originalColors)) {
    terrainTypes[type] = info;
  }
}

// Main execution
async function main() {
  try {
    // Generate main tileset
    await generateAllTiles();
    
    // Generate planet-specific tilesets
    await generatePlanetTerrainSet('earth');
    await generatePlanetTerrainSet('mars');
    await generatePlanetTerrainSet('alien');
    await generatePlanetTerrainSet('ice');
    
    console.log("All assets generated successfully!");
  } catch (error) {
    console.error("Error generating assets:", error);
  }
}

// Run the script
main();
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
  map?: any;
  planetType?: number;
  lastUpdated?: number;
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

On a distant alien planet rich with exotic resources, you've crash-landed with nothing but your wits and engineering knowledge. **FrankForge** challenges you to master the mysterious elements of this world, building industrial solutions to real world problems!
Want to experience the engineering challenge of life on mars? 

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


// Calculate the temperature effect on reaction rate using the Arrhenius equation
pub fn calculate_temperature_effect(temperature: f64, activation_energy: f64) -> f64 {
    // Gas constant in kJ/(mol·K)
    const R: f64 = 0.008314;
    
    // Reference temperature (standard conditions) in Kelvin
    const T_REF: f64 = 298.15; // 25°C
    
    // Arrhenius equation: k = A * exp(-Ea/RT)
    // We're calculating the ratio of rates at different temperatures
    // k2/k1 = exp[-Ea/R * (1/T2 - 1/T1)]
    let exponent = -activation_energy / R * (1.0 / temperature - 1.0 / T_REF);
    exponent.exp()
}

// Calculate the pressure effect on reaction rate
pub fn calculate_pressure_effect(pressure: f64, reaction_order: f64, base_pressure: f64) -> f64 {
    // For a gas-phase reaction, rate is generally proportional to P^n
    // where n is the order of reaction with respect to total pressure
    // P_ratio^n gives us how much faster/slower the reaction is at current pressure
    let pressure_ratio = pressure / base_pressure;
    pressure_ratio.powf(reaction_order)
}

// Enhanced reaction result with temperature and pressure effects
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct EnhancedReactionResult {
    pub reaction_name: String,
    pub reaction_amount: f64,
    pub consumed: HashMap<String, f64>,
    pub produced: HashMap<String, f64>,
    pub energy_change: f64,
    pub temperature_factor: f64,
    pub pressure_factor: f64,
    pub final_temperature: f64,
    pub reaction_rate: f64,
    pub catalyst_used: bool,
    pub catalyst_name: Option<String>,
}

// Enhanced process_reaction function with better temperature and pressure effects
#[wasm_bindgen]
pub fn process_reaction_enhanced(
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
    
    // Calculate advanced temperature effect
    // Use order of reaction with respect to temperature
    // (simplified as 1.0 here, could be molecule-specific)
    let temperature_order = 1.0;
    let temperature_factor = calculate_temperature_effect(temperature, reaction.activation_energy);
    
    // Calculate pressure effect based on reaction type
    // Gas-phase reactions are most affected by pressure
    // Determine reaction phase based on reactants
    let is_gas_phase = true; // Simplified, could be determined from molecule states
    let pressure_order = if is_gas_phase { 
        // Count total moles of gas in reaction
        let reactant_moles: f64 = reaction.reactants.values().sum();
        let product_moles: f64 = reaction.products.values().sum();
        // Reaction order with respect to pressure is related to change in moles
        product_moles - reactant_moles
    } else {
        0.0 // Negligible pressure effect for liquid/solid reactions
    };
    
    let standard_pressure = 101325.0; // Pa (1 atm)
    let pressure_factor = calculate_pressure_effect(pressure, pressure_order, standard_pressure);
    
    // Catalyst effect
    let catalyst_factor = if catalyst_present && reaction.catalyst.is_some() {
        reaction.catalyst_effect
    } else {
        1.0
    };
    
    // Calculate actual reaction rate
    let base_rate = reaction.rate_constant;
    let modified_rate = base_rate * temperature_factor * pressure_factor * catalyst_factor;
    
    // Calculate actual reaction amount
    let max_possible = limiting_factor;
    let reaction_amount = max_possible.min(modified_rate * delta_time);
    
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
    
    // Calculate final temperature based on energy release/consumption
    // This is a simplified model - in reality, would need heat capacity of the system
    let system_heat_capacity = 10.0; // J/K (placeholder, could be calculated based on molecules present)
    let final_temperature = temperature + energy_change / system_heat_capacity;
    
    // Prepare enhanced result
    json!({
        "reaction_name": reaction.name,
        "reaction_amount": reaction_amount,
        "consumed": consumed,
        "produced": produced,
        "energy_change": energy_change,
        "temperature_factor": temperature_factor,
        "pressure_factor": pressure_factor,
        "final_temperature": final_temperature,
        "reaction_rate": modified_rate,
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

