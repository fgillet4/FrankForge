<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { gameState } from '../../stores/gameState';
    
    // Event dispatcher
    const dispatch = createEventDispatcher();
    
    // Available building types with more detailed info
    const buildingTypesData = {
      extractor: { 
        name: 'Extractor', 
        description: 'Extracts resources from the environment', 
        cost: { energy: 100, iron: 25 },
        category: 'production',
        powerUsage: 10,
        unlockTech: 'basicExtraction'
      },
      storageSmall: { 
        name: 'Small Storage', 
        description: 'Stores resources for later use', 
        cost: { energy: 80, iron: 15 },
        category: 'logistics',
        powerUsage: 5,
        unlockTech: 'basicExtraction'
      },
      storageFluid: { 
        name: 'Fluid Tank', 
        description: 'Stores liquid resources', 
        cost: { energy: 80, iron: 20 },
        category: 'logistics',
        powerUsage: 5,
        unlockTech: 'basicLogistics'
      },
      reactor: { 
        name: 'Chemical Reactor', 
        description: 'Combines chemicals to create reactions', 
        cost: { energy: 200, methane: 50, iron: 40 },
        category: 'production',
        powerUsage: 25,
        unlockTech: 'advancedMaterials'
      },
      powerPlant: { 
        name: 'Power Plant', 
        description: 'Generates energy from fuel', 
        cost: { energy: 150, iron: 30, copper: 15 },
        category: 'power',
        powerGeneration: 50,
        unlockTech: 'powerGeneration'
      },
      solarPanel: {
        name: 'Solar Panel',
        description: 'Generates clean energy from sunlight',
        cost: { energy: 120, silicon: 20, copper: 10 },
        category: 'power',
        powerGeneration: 30,
        unlockTech: 'powerGeneration'
      },
      pipe: { 
        name: 'Pipe', 
        description: 'Connects buildings to transfer fluid resources', 
        cost: { energy: 20, iron: 5 },
        category: 'logistics',
        powerUsage: 0,
        unlockTech: 'basicLogistics'
      },
      conveyor: { 
        name: 'Conveyor Belt', 
        description: 'Transports solid resources between buildings', 
        cost: { energy: 25, iron: 10 },
        category: 'logistics',
        powerUsage: 1,
        unlockTech: 'basicLogistics'
      },
      assembler: {
        name: 'Assembler',
        description: 'Crafts advanced components from basic resources',
        cost: { energy: 300, iron: 50, copper: 30 },
        category: 'production',
        powerUsage: 30,
        unlockTech: 'automation'
      },
      researchLab: {
        name: 'Research Lab',
        description: 'Generates science points for research',
        cost: { energy: 250, iron: 30, copper: 20 },
        category: 'research',
        powerUsage: 40,
        unlockTech: 'researchEfficiency'
      },
      dronePort: {
        name: 'Drone Port',
        description: 'Enables aerial transport of resources',
        cost: { energy: 500, iron: 100, copper: 50, silicon: 25 },
        category: 'logistics',
        powerUsage: 60,
        unlockTech: 'advancedLogistics'
      }
    };
    
    // Filter to show only unlocked buildings or buildings ready to unlock
    $: availableBuildings = Object.entries(buildingTypesData)
      .filter(([id, data]) => $gameState.unlocked.buildings.includes(id))
      .map(([id, data]) => ({
        id,
        ...data
      }));
      
    // Group buildings by category for the UI
    $: buildingsByCategory = availableBuildings.reduce((groups, building) => {
      const category = building.category || 'other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(building);
      return groups;
    }, {});
    
    // Sort categories for display
    const categoryOrder = ['production', 'power', 'logistics', 'research', 'other'];
    $: sortedCategories = Object.keys(buildingsByCategory)
      .sort((a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b));
    
    // Currently selected category for filter
    let selectedCategory = 'all';
    
    // Filter buildings by selected category
    $: filteredBuildings = selectedCategory === 'all' 
      ? availableBuildings 
      : availableBuildings.filter(b => b.category === selectedCategory);
    
    // Resources required to build
    function canBuild(buildingType) {
      const building = buildingTypesData[buildingType];
      if (!building) return false;
      
      // Check if building is unlocked
      if (!$gameState.unlocked.buildings.includes(buildingType)) {
        return false;
      }
      
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
      const categoryColors = {
        production: '#3498db',
        power: '#2ecc71',
        logistics: '#95a5a6',
        research: '#9b59b6',
        other: '#bdc3c7'
      };
      
      const building = buildingTypesData[buildingType];
      if (building && building.category) {
        return categoryColors[building.category];
      }
      
      // Fallback colors for specific buildings
      switch (buildingType) {
        case 'extractor': return '#3498db';
        case 'storageSmall': 
        case 'storage': return '#f1c40f';
        case 'reactor': return '#e74c3c';
        case 'powerPlant': return '#2ecc71';
        case 'solarPanel': return '#f1c40f';
        case 'pipe': return '#95a5a6';
        case 'conveyor': return '#7f8c8d';
        case 'assembler': return '#e67e22';
        case 'researchLab': return '#9b59b6';
        default: return '#bdc3c7';
      }
    }
    
    // Get icon for the building
    function getBuildingIcon(buildingType) {
      // In a real implementation, this would return the path to the icon
      return `/assets/sprites/buildings/${buildingType}_0.png`;
    }
</script>
  
<div class="control-panel">
  <h2>Buildings</h2>
  
  <!-- Category filters -->
  <div class="category-filters">
    <button 
      class="category-button" 
      class:active={selectedCategory === 'all'}
      on:click={() => selectedCategory = 'all'}
    >
      All
    </button>
    
    {#each sortedCategories as category}
      <button 
        class="category-button" 
        class:active={selectedCategory === category}
        on:click={() => selectedCategory = category}
        style="--category-color: {getBuildingColor(buildingsByCategory[category][0].id)}"
      >
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </button>
    {/each}
  </div>
  
  <!-- Building list grid -->
  <div class="building-grid">
    {#each filteredBuildings as building}
      <button 
        class="building-card" 
        class:disabled={!canBuild(building.id)}
        on:click={() => selectBuilding(building.id)}
      >
        <div class="building-icon" style="background-image: url({getBuildingIcon(building.id)}); background-color: {getBuildingColor(building.id)}"></div>
        <div class="building-info">
          <span class="building-name">{building.name}</span>
          
          <div class="building-stats">
            {#if building.powerGeneration}
              <span class="stat power-gen">+{building.powerGeneration} ⚡</span>
            {:else if building.powerUsage}
              <span class="stat power-use">-{building.powerUsage} ⚡</span>
            {/if}
          </div>
          
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
    
    {#if filteredBuildings.length === 0}
      <div class="empty-state">
        <p>No buildings available in this category yet.</p>
        <p>Research new technologies to unlock more buildings.</p>
      </div>
    {/if}
  </div>
</div>
  
<style>
  .control-panel {
    background-color: rgba(16, 24, 36, 0.95);
    color: white;
    border-radius: 8px;
    padding: 16px;
    width: 100%;
    height: 100%;
    overflow-y: auto;
  }
  
  h2 {
    margin-top: 0;
    border-bottom: 1px solid rgba(52, 152, 219, 0.3);
    padding-bottom: 12px;
    font-size: 1.2rem;
    color: #3498db;
    letter-spacing: 0.5px;
    margin-bottom: 16px;
  }
  
  .category-filters {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .category-button {
    background-color: rgba(26, 32, 44, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #bdc3c7;
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
  }
  
  .category-button.active {
    background-color: var(--category-color, #3498db);
    color: white;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  .category-button:hover:not(.active) {
    background-color: rgba(52, 73, 94, 0.8);
    transform: translateY(-1px);
  }
  
  .building-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }
  
  .building-card {
    display: flex;
    flex-direction: column;
    background: linear-gradient(to bottom, rgba(28, 40, 55, 0.9), rgba(16, 24, 36, 0.9));
    border: 1px solid rgba(52, 152, 219, 0.1);
    border-radius: 8px;
    overflow: hidden;
    padding: 0;
    text-align: left;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    position: relative;
  }
  
  .building-card:hover:not(.disabled) {
    transform: translateY(-4px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    border-color: rgba(52, 152, 219, 0.5);
  }
  
  .building-card.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    filter: grayscale(70%);
  }
  
  .building-card.disabled:hover {
    transform: none;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .building-icon {
    width: 100%;
    height: 100px;
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    background-color: rgba(0, 0, 0, 0.3);
    position: relative;
    transition: all 0.3s ease;
  }
  
  .building-card:hover:not(.disabled) .building-icon {
    filter: brightness(1.2);
  }
  
  .building-info {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .building-name {
    font-weight: 600;
    font-size: 16px;
    margin-bottom: 2px;
    color: white;
  }
  
  .building-stats {
    display: flex;
    gap: 8px;
    margin-bottom: 4px;
  }
  
  .stat {
    font-size: 12px;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: 4px;
    background-color: rgba(0, 0, 0, 0.2);
  }
  
  .power-gen {
    color: #2ecc71;
  }
  
  .power-use {
    color: #e74c3c;
  }
  
  .building-desc {
    font-size: 12px;
    line-height: 1.4;
    color: #bdc3c7;
    margin-bottom: 8px;
  }
  
  .building-cost {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    font-size: 11px;
    margin-top: auto;
  }
  
  .resource-cost {
    background-color: rgba(0, 0, 0, 0.2);
    padding: 3px 6px;
    border-radius: 3px;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  }
  
  .resource-cost.insufficient {
    color: #e74c3c;
    box-shadow: inset 0 0 0 1px rgba(231, 76, 60, 0.3);
  }
  
  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 24px;
    background-color: rgba(28, 40, 55, 0.5);
    border-radius: 8px;
    border: 1px dashed rgba(255, 255, 255, 0.1);
  }
  
  .empty-state p {
    margin: 4px 0;
    color: #bdc3c7;
    font-size: 14px;
  }
  
  .empty-state p:first-child {
    font-weight: 500;
    color: white;
  }
</style>