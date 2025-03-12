<script lang="ts">
  import { gameState } from '../../stores/gameState';
  
  // Available building types
  const buildingTypes = [
    { id: 'extractor', name: 'Extractor', description: 'Extracts resources from the environment', cost: { energy: 100 } },
    { id: 'reactor', name: 'Chemical Reactor', description: 'Combines chemicals to create reactions', cost: { energy: 200 } },
    { id: 'powerPlant', name: 'Power Plant', description: 'Generates energy from fuel', cost: { energy: 300 } }
  ];
  
  // Start building placement
  function startPlacement(buildingType) {
  // Check if we can afford it
  if (!canBuild(buildingType)) return;
  
  // Start placement mode in the game canvas
  if (gameCanvas && gameCanvas.startPlacement) {
    gameCanvas.startPlacement(buildingType);
  } else {
    console.error('GameCanvas reference not available');
  }
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
