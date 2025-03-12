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