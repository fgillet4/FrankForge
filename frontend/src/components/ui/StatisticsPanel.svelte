<script lang="ts">
  import { gameState } from '../../stores/gameState';
  import { onMount } from 'svelte';
  
  // Imported Stats Data
  let productionHistory = [];
  let powerHistory = [];
  let pollutionHistory = [];
  let resourceProduction = {};
  let resourceConsumption = {};
  
  // Time selection for graphs
  let timeRangeOptions = ["Last 10m", "Last 30m", "Last 1h", "All Time"];
  let selectedTimeRange = "Last 30m";
  
  // Active tab for stats
  let activeTab = "production";
  
  // Chart size
  let chartWidth = 0;
  let chartHeight = 0;
  let chartContainer;
  
  onMount(() => {
    // Get initial chart dimensions
    updateChartDimensions();
    
    // Listen for resize events
    window.addEventListener('resize', updateChartDimensions);
    
    return () => {
      window.removeEventListener('resize', updateChartDimensions);
    };
  });
  
  function updateChartDimensions() {
    if (chartContainer) {
      chartWidth = chartContainer.clientWidth;
      chartHeight = 200; // Fixed height
    }
  }
  
  // Update data from game state
  $: {
    productionHistory = $gameState.statistics.production.history;
    powerHistory = $gameState.statistics.power.history;
    pollutionHistory = $gameState.statistics.pollution.history;
    resourceProduction = $gameState.statistics.resources.produced;
    resourceConsumption = $gameState.statistics.resources.consumed;
  }
  
  // Get data for a specific time range
  function getTimeRangeData(data, range) {
    if (!data || data.length === 0) return [];
    
    const now = $gameState.tick;
    let timeCutoff;
    
    switch (range) {
      case "Last 10m":
        timeCutoff = now - 600; // 10 minutes * 60 ticks
        break;
      case "Last 30m":
        timeCutoff = now - 1800; // 30 minutes * 60 ticks
        break;
      case "Last 1h":
        timeCutoff = now - 3600; // 60 minutes * 60 ticks
        break;
      default: // All time
        return data;
    }
    
    return data.filter(entry => entry.tick >= timeCutoff);
  }
  
  // Format resource data for production chart
  $: filteredProductionData = getTimeRangeData(productionHistory, selectedTimeRange);
  $: filteredPowerData = getTimeRangeData(powerHistory, selectedTimeRange);
  $: filteredPollutionData = getTimeRangeData(pollutionHistory, selectedTimeRange);
  
  // Create chart data points for production
  function getProductionChartPoints(resource) {
    if (!filteredProductionData || filteredProductionData.length === 0) {
      return "";
    }
    
    // Get min/max for scaling
    const minTick = filteredProductionData[0].tick;
    const maxTick = filteredProductionData[filteredProductionData.length - 1].tick;
    const tickRange = maxTick - minTick || 1;
    
    // Find resource min/max
    let maxValue = 0;
    filteredProductionData.forEach(entry => {
      const value = entry.resources[resource] || 0;
      if (value > maxValue) maxValue = value;
    });
    maxValue = maxValue || 100; // Avoid division by zero
    
    // Generate points
    return filteredProductionData.map((entry, i) => {
      const x = ((entry.tick - minTick) / tickRange) * chartWidth;
      const value = entry.resources[resource] || 0;
      const y = chartHeight - (value / maxValue) * (chartHeight - 20);
      
      return `${x},${y}`;
    }).join(" ");
  }
  
  // Create chart for power generation/consumption
  function getPowerChartPoints(type) {
    if (!filteredPowerData || filteredPowerData.length === 0) {
      return "";
    }
    
    // Get min/max for scaling
    const minTick = filteredPowerData[0].tick;
    const maxTick = filteredPowerData[filteredPowerData.length - 1].tick;
    const tickRange = maxTick - minTick || 1;
    
    // Find max value
    let maxValue = 0;
    filteredPowerData.forEach(entry => {
      const value = type === 'generation' ? entry.generated : entry.consumed;
      if (value > maxValue) maxValue = value;
    });
    maxValue = maxValue || 100; // Avoid division by zero
    
    // Generate points
    return filteredPowerData.map((entry, i) => {
      const x = ((entry.tick - minTick) / tickRange) * chartWidth;
      const value = type === 'generation' ? entry.generated : entry.consumed;
      const y = chartHeight - (value / maxValue) * (chartHeight - 20);
      
      return `${x},${y}`;
    }).join(" ");
  }
  
  // Create chart for pollution levels
  function getPollutionChartPoints() {
    if (!filteredPollutionData || filteredPollutionData.length === 0) {
      return "";
    }
    
    // Get min/max for scaling
    const minTick = filteredPollutionData[0].tick;
    const maxTick = filteredPollutionData[filteredPollutionData.length - 1].tick;
    const tickRange = maxTick - minTick || 1;
    
    // Find max pollution
    let maxValue = 0;
    filteredPollutionData.forEach(entry => {
      if (entry.level > maxValue) maxValue = entry.level;
    });
    maxValue = maxValue || 100; // Avoid division by zero
    
    // Generate points
    return filteredPollutionData.map((entry, i) => {
      const x = ((entry.tick - minTick) / tickRange) * chartWidth;
      const y = chartHeight - (entry.level / maxValue) * (chartHeight - 20);
      
      return `${x},${y}`;
    }).join(" ");
  }
  
  // Get color for resource lines
  function getResourceColor(resource) {
    const colors = {
      energy: '#f39c12',
      methane: '#1abc9c',
      water: '#3498db',
      oxygen: '#2ecc71',
      iron: '#e67e22',
      copper: '#e74c3c',
      silicon: '#7f8c8d',
      rare_metals: '#95a5a6',
      uranium: '#f1c40f',
      xenocrystals: '#9b59b6',
      science: '#9b59b6',
      sulfur: '#f39c12'
    };
    
    return colors[resource] || '#bdc3c7';
  }
  
  // Format number with K, M suffixes
  function formatNumber(num) {
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1) + 'M';
    } else if (num >= 1_000) {
      return (num / 1_000).toFixed(1) + 'K';
    } else {
      return num.toFixed(1);
    }
  }
  
  // Get current production/consumption rates
  function getResourceRate(resource, type) {
    const buildings = $gameState.buildings;
    let rate = 0;
    
    // Calculate based on building types and efficiencies
    buildings.forEach(building => {
      if (building.isActive && building.efficiency > 0.1) {
        if (building.type === 'extractor') {
          // Simplified - in reality would check resource type at position
          const resourceType = ['iron', 'copper', 'water', 'methane', 'oxygen'][Math.floor(Math.random() * 5)];
          if (resourceType === resource && type === 'production') {
            rate += 0.2 * building.efficiency;
          }
        } else if (building.type === 'researchLab' && resource === 'science' && type === 'production') {
          rate += 0.1 * building.efficiency;
        } else if (building.type === 'assembler') {
          // Would depend on recipes
        }
      }
    });
    
    return rate;
  }
  
  // Get total power generation/consumption
  function getTotalPower(type) {
    return type === 'generation' 
      ? $gameState.statistics.power.generated 
      : $gameState.statistics.power.consumed;
  }
  
  // Get resources to display sorted by amount
  $: productionResources = Object.entries(resourceProduction)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([resource]) => resource);
  
  // Tab switching
  function setActiveTab(tab) {
    activeTab = tab;
    // Reset chart when switching tabs
    setTimeout(updateChartDimensions, 50);
  }
</script>

<div class="stats-panel">
  <h2>Statistics</h2>
  
  <!-- Tab selector -->
  <div class="tabs">
    <button 
      class="tab-button" 
      class:active={activeTab === "production"}
      on:click={() => setActiveTab("production")}
    >
      Production
    </button>
    <button 
      class="tab-button" 
      class:active={activeTab === "power"}
      on:click={() => setActiveTab("power")}
    >
      Power
    </button>
    <button 
      class="tab-button" 
      class:active={activeTab === "pollution"}
      on:click={() => setActiveTab("pollution")}
    >
      Pollution
    </button>
  </div>
  
  <!-- Time range selector -->
  <div class="time-range">
    <span class="range-label">Time Range:</span>
    {#each timeRangeOptions as range}
      <button 
        class="range-button" 
        class:active={selectedTimeRange === range}
        on:click={() => selectedTimeRange = range}
      >
        {range}
      </button>
    {/each}
  </div>
  
  <!-- Charts -->
  <div class="chart-container" bind:this={chartContainer}>
    {#if activeTab === "production"}
      <div class="chart-title">Resource Levels</div>
      
      {#if chartWidth > 0 && chartHeight > 0}
        <svg class="chart" width={chartWidth} height={chartHeight}>
          <!-- Grid lines -->
          <line x1="0" y1={chartHeight - 10} x2={chartWidth} y2={chartHeight - 10} class="grid-line" />
          
          <!-- Resource lines -->
          {#each productionResources as resource}
            <polyline 
              points={getProductionChartPoints(resource)} 
              class="chart-line"
              style="stroke: {getResourceColor(resource)}"
            />
          {/each}
          
          <!-- Legend -->
          <g class="chart-legend">
            {#each productionResources as resource, i}
              <g transform="translate(10, {20 + i * 20})">
                <rect width="10" height="10" fill={getResourceColor(resource)} />
                <text x="15" y="9">{resource} ({formatNumber($gameState.resources[resource] || 0)})</text>
              </g>
            {/each}
          </g>
        </svg>
      {/if}
      
      <!-- Production stats -->
      <div class="stats-grid">
        <h3>Production Rates</h3>
        
        <div class="stats-row header">
          <div class="resource-name">Resource</div>
          <div class="rate-value">Production</div>
          <div class="rate-value">Consumption</div>
          <div class="rate-value">Net</div>
        </div>
        
        {#each Object.keys($gameState.resources) as resource}
          {@const prodRate = getResourceRate(resource, 'production')}
          {@const consRate = getResourceRate(resource, 'consumption')}
          {@const netRate = prodRate - consRate}
          
          {#if prodRate > 0 || consRate > 0}
            <div class="stats-row">
              <div class="resource-name">
                <span class="resource-dot" style="background-color: {getResourceColor(resource)}"></span>
                {resource}
              </div>
              <div class="rate-value">{prodRate.toFixed(1)}/s</div>
              <div class="rate-value">{consRate.toFixed(1)}/s</div>
              <div class="rate-value {netRate > 0 ? 'positive' : netRate < 0 ? 'negative' : ''}">
                {netRate > 0 ? '+' : ''}{netRate.toFixed(1)}/s
              </div>
            </div>
          {/if}
        {/each}
      </div>
    {:else if activeTab === "power"}
      <div class="chart-title">Power Generation & Consumption</div>
      
      {#if chartWidth > 0 && chartHeight > 0}
        <svg class="chart" width={chartWidth} height={chartHeight}>
          <!-- Grid lines -->
          <line x1="0" y1={chartHeight - 10} x2={chartWidth} y2={chartHeight - 10} class="grid-line" />
          
          <!-- Power generation line -->
          <polyline 
            points={getPowerChartPoints('generation')} 
            class="chart-line"
            style="stroke: #2ecc71"
          />
          
          <!-- Power consumption line -->
          <polyline 
            points={getPowerChartPoints('consumption')} 
            class="chart-line"
            style="stroke: #e74c3c"
          />
          
          <!-- Legend -->
          <g class="chart-legend">
            <g transform="translate(10, 20)">
              <rect width="10" height="10" fill="#2ecc71" />
              <text x="15" y="9">Generation ({formatNumber(getTotalPower('generation'))}/s)</text>
            </g>
            <g transform="translate(10, 40)">
              <rect width="10" height="10" fill="#e74c3c" />
              <text x="15" y="9">Consumption ({formatNumber(getTotalPower('consumption'))}/s)</text>
            </g>
          </g>
        </svg>
      {/if}
      
      <!-- Power stats by building type -->
      <div class="stats-grid">
        <h3>Power Production</h3>
        
        <div class="stats-row header">
          <div class="resource-name">Building Type</div>
          <div class="rate-value">Count</div>
          <div class="rate-value">Total Output</div>
          <div class="rate-value">Efficiency</div>
        </div>
        
        {#each ['powerPlant', 'solarPanel', 'nuclearReactor'] as buildingType}
          {#if $gameState.buildings.filter(b => b.type === buildingType).length > 0}
            {#if buildingType === 'powerPlant'}
              <div class="stats-row">
                <div class="resource-name">{buildingType}</div>
                <div class="rate-value">{$gameState.buildings.filter(b => b.type === buildingType).length}</div>
                <div class="rate-value positive">
                  {($gameState.buildings.filter(b => b.type === buildingType)
                    .reduce((sum, b) => sum + (b.productionRate || 0), 0)).toFixed(1)}/s
                </div>
                <div class="rate-value">
                  {($gameState.buildings.filter(b => b.type === buildingType).length > 0 
                    ? $gameState.buildings.filter(b => b.type === buildingType)
                      .reduce((sum, b) => sum + (b.efficiency || 0), 0) 
                      / $gameState.buildings.filter(b => b.type === buildingType).length * 100
                    : 0).toFixed(0)}%
                </div>
              </div>
            {:else if buildingType === 'solarPanel'}
              <div class="stats-row">
                <div class="resource-name">{buildingType}</div>
                <div class="rate-value">{$gameState.buildings.filter(b => b.type === buildingType).length}</div>
                <div class="rate-value positive">
                  {($gameState.buildings.filter(b => b.type === buildingType)
                    .reduce((sum, b) => sum + (b.productionRate || 0), 0)).toFixed(1)}/s
                </div>
                <div class="rate-value">
                  {($gameState.buildings.filter(b => b.type === buildingType).length > 0 
                    ? $gameState.buildings.filter(b => b.type === buildingType)
                      .reduce((sum, b) => sum + (b.efficiency || 0), 0) 
                      / $gameState.buildings.filter(b => b.type === buildingType).length * 100
                    : 0).toFixed(0)}%
                </div>
              </div>
            {:else if buildingType === 'nuclearReactor'}
              <div class="stats-row">
                <div class="resource-name">{buildingType}</div>
                <div class="rate-value">{$gameState.buildings.filter(b => b.type === buildingType).length}</div>
                <div class="rate-value positive">
                  {($gameState.buildings.filter(b => b.type === buildingType)
                    .reduce((sum, b) => sum + (b.productionRate || 0), 0)).toFixed(1)}/s
                </div>
                <div class="rate-value">
                  {($gameState.buildings.filter(b => b.type === buildingType).length > 0 
                    ? $gameState.buildings.filter(b => b.type === buildingType)
                      .reduce((sum, b) => sum + (b.efficiency || 0), 0) 
                      / $gameState.buildings.filter(b => b.type === buildingType).length * 100
                    : 0).toFixed(0)}%
                </div>
              </div>
            {/if}
          {/if}
        {/each}
        
        <h3>Power Consumption</h3>
        
        <div class="stats-row header">
          <div class="resource-name">Building Type</div>
          <div class="rate-value">Count</div>
          <div class="rate-value">Total Usage</div>
        </div>
        
        {#each ['extractor', 'reactor', 'assembler', 'researchLab'] as buildingType}
          {#if $gameState.buildings.filter(b => b.type === buildingType).length > 0}
            <div class="stats-row">
              <div class="resource-name">{buildingType}</div>
              <div class="rate-value">{$gameState.buildings.filter(b => b.type === buildingType).length}</div>
              <div class="rate-value negative">
                {($gameState.buildings.filter(b => b.type === buildingType)
                  .reduce((sum, b) => sum + (b.powerConsumption || 0), 0)).toFixed(1)}/s
              </div>
            </div>
          {/if}
        {/each}
      </div>
    {:else if activeTab === "pollution"}
      <div class="chart-title">Pollution Levels</div>
      
      {#if chartWidth > 0 && chartHeight > 0}
        <svg class="chart" width={chartWidth} height={chartHeight}>
          <!-- Grid lines -->
          <line x1="0" y1={chartHeight - 10} x2={chartWidth} y2={chartHeight - 10} class="grid-line" />
          
          <!-- Pollution line -->
          <polyline 
            points={getPollutionChartPoints()} 
            class="chart-line"
            style="stroke: #e74c3c"
          />
          
          <!-- Legend -->
          <g class="chart-legend">
            <g transform="translate(10, 20)">
              <rect width="10" height="10" fill="#e74c3c" />
              <text x="15" y="9">Pollution ({formatNumber($gameState.statistics.pollution.level)}) units</text>
            </g>
          </g>
        </svg>
      {/if}
      
      <!-- Pollution summary -->
      <div class="pollution-summary">
        <div class="pollution-level">
          <h3>Current Pollution Level</h3>
          <div class="pollution-meter">
            <div class="pollution-bar" style="width: {Math.min(100, $gameState.statistics.pollution.level / 2)}%"></div>
          </div>
          <div class="pollution-value">{formatNumber($gameState.statistics.pollution.level)} units</div>
        </div>
        
        <div class="pollution-effects">
          <h3>Effects</h3>
          <ul class="effects-list">
            {#if $gameState.statistics.pollution.level < 10}
              <li class="effect good">Minimal environmental impact</li>
            {:else if $gameState.statistics.pollution.level < 50}
              <li class="effect warning">Slightly increased chances of adverse weather</li>
            {:else if $gameState.statistics.pollution.level < 100}
              <li class="effect warning">Moderate weather effects</li>
              <li class="effect warning">Reduced solar panel efficiency</li>
            {:else}
              <li class="effect danger">Severe weather effects</li>
              <li class="effect danger">Significantly reduced solar panel efficiency</li>
              <li class="effect danger">Increased maintenance requirements</li>
            {/if}
          </ul>
        </div>
        
        <div class="pollution-sources">
          <h3>Major Sources</h3>
          <div class="source-list">
            <!-- Power plants -->
            {#if $gameState.buildings.filter(b => b.type === 'powerPlant').length > 0}
              {@const powerPlants = $gameState.buildings.filter(b => b.type === 'powerPlant').length}
              <div class="source-item">
                <div class="source-name">Power Plants</div>
                <div class="source-value">{(powerPlants * 0.2).toFixed(1)} units/s</div>
              </div>
            {/if}
            
            <!-- Extractors -->
            {#if $gameState.buildings.filter(b => b.type === 'extractor').length > 0}
              {@const extractors = $gameState.buildings.filter(b => b.type === 'extractor').length}
              <div class="source-item">
                <div class="source-name">Extractors</div>
                <div class="source-value">{(extractors * 0.1).toFixed(1)} units/s</div>
              </div>
            {/if}
            
            <div class="source-item">
              <div class="source-name">Natural Decay</div>
              <div class="source-value">-{($gameState.statistics.pollution.level * 0.0001).toFixed(3)} units/s</div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .stats-panel {
    background-color: rgba(16, 24, 36, 0.95);
    color: white;
    border-radius: 8px;
    padding: 16px;
    width: 100%;
    height: 100%;
    overflow-y: auto;
  }
  
  h2 {
    margin: 0 0 16px;
    border-bottom: 1px solid rgba(52, 152, 219, 0.3);
    padding-bottom: 12px;
    font-size: 1.2rem;
    color: #3498db;
    letter-spacing: 0.5px;
  }
  
  h3 {
    font-size: 1rem;
    margin: 16px 0 12px;
    color: #bdc3c7;
  }
  
  /* Tabs */
  .tabs {
    display: flex;
    gap: 2px;
    margin-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .tab-button {
    padding: 8px 16px;
    background-color: rgba(26, 32, 44, 0.7);
    border: none;
    color: #bdc3c7;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
  }
  
  .tab-button.active {
    background-color: rgba(52, 152, 219, 0.2);
    color: white;
    box-shadow: inset 0 3px 0 rgba(52, 152, 219, 0.8);
  }
  
  .tab-button:hover:not(.active) {
    background-color: rgba(52, 73, 94, 0.7);
  }
  
  /* Time range */
  .time-range {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  
  .range-label {
    font-size: 13px;
    color: #bdc3c7;
  }
  
  .range-button {
    padding: 4px 10px;
    font-size: 12px;
    background-color: rgba(26, 32, 44, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #bdc3c7;
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .range-button.active {
    background-color: rgba(52, 152, 219, 0.2);
    color: white;
    border-color: rgba(52, 152, 219, 0.5);
  }
  
  .range-button:hover:not(.active) {
    background-color: rgba(52, 73, 94, 0.7);
  }
  
  /* Chart */
  .chart-container {
    background-color: rgba(20, 29, 47, 0.5);
    border-radius: 6px;
    padding: 16px;
    margin-bottom: 16px;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .chart-title {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 10px;
    color: #bdc3c7;
    text-align: center;
  }
  
  .chart {
    width: 100%;
    height: 200px;
    margin-bottom: 16px;
  }
  
  .chart-line {
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  
  .grid-line {
    stroke: rgba(255, 255, 255, 0.1);
    stroke-width: 1;
  }
  
  .chart-legend text {
    fill: #bdc3c7;
    font-size: 12px;
  }
  
  /* Stats grid */
  .stats-grid {
    overflow-x: auto;
  }
  
  .stats-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    padding: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    font-size: 13px;
  }
  
  .stats-row.header {
    font-weight: 500;
    color: #bdc3c7;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .resource-name {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .resource-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  
  .rate-value {
    text-align: center;
  }
  
  .positive {
    color: #2ecc71;
  }
  
  .negative {
    color: #e74c3c;
  }
  
  /* Pollution section */
  .pollution-summary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  
  .pollution-level {
    grid-column: 1 / -1;
  }
  
  .pollution-meter {
    height: 24px;
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
  }
  
  .pollution-bar {
    height: 100%;
    background: linear-gradient(to right, #2ecc71, #f1c40f, #e74c3c);
    border-radius: 4px;
    transition: width 0.5s ease;
  }
  
  .pollution-value {
    text-align: center;
    font-size: 20px;
    font-weight: 600;
  }
  
  .effects-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .effect {
    padding: 8px;
    margin-bottom: 6px;
    border-radius: 4px;
    font-size: 13px;
  }
  
  .effect.good {
    background-color: rgba(46, 204, 113, 0.2);
    color: #2ecc71;
  }
  
  .effect.warning {
    background-color: rgba(241, 196, 15, 0.2);
    color: #f1c40f;
  }
  
  .effect.danger {
    background-color: rgba(231, 76, 60, 0.2);
    color: #e74c3c;
  }
  
  .source-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .source-item {
    display: flex;
    justify-content: space-between;
    padding: 8px;
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    font-size: 13px;
  }
</style>