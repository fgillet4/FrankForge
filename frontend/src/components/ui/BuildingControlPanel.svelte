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