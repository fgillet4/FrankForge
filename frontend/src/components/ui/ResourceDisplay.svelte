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