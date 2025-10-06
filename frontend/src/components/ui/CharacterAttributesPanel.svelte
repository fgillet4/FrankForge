<script lang="ts">
  import { gameState } from '../../stores/gameState';
  import { onMount, createEventDispatcher } from 'svelte';
  import type { Character } from '../../lib/types';
  
  const dispatch = createEventDispatcher();
  
  // Local reactive variables
  let player: Character | null = null;
  let discoveredTiles = 0;
  let discoveredPOIs = 0;
  
  // Subscribe to game state changes
  const unsubscribe = gameState.subscribe(state => {
    player = state.player;
    discoveredTiles = state.exploration?.discoveredTiles || 0;
    discoveredPOIs = state.exploration?.discoveredPOIs?.length || 0;
  });
  
  onMount(() => {
    return () => {
      unsubscribe();
    };
  });
  
  // Format values for display
  function formatSkill(value: number): string {
    const level = Math.floor(value);
    const stars = '★'.repeat(level) + '☆'.repeat(5 - level);
    return `${stars} (Lvl ${level})`;
  }
  
  function formatProgress(current: number, max: number): string {
    return `${Math.floor(current)}/${max}`;
  }
</script>

<div class="character-panel">
  <h2>Character <button class="close-button" on:click={() => dispatch('close')}>×</button></h2>
  
  {#if player}
    <div class="character-section">
      <h3>Stats</h3>
      
      <div class="stat-grid">
        <div class="stat">
          <div class="stat-name">Health</div>
          <div class="progress-bar">
            <div class="progress-fill health" style="width: {player.stats.health / player.stats.maxHealth * 100}%"></div>
          </div>
          <div class="stat-value">{formatProgress(player.stats.health, player.stats.maxHealth)}</div>
        </div>
        
        <div class="stat">
          <div class="stat-name">Energy</div>
          <div class="progress-bar">
            <div class="progress-fill energy" style="width: {player.stats.energy / player.stats.maxEnergy * 100}%"></div>
          </div>
          <div class="stat-value">{formatProgress(player.stats.energy, player.stats.maxEnergy)}</div>
        </div>
        
        <div class="stat">
          <div class="stat-name">Speed</div>
          <div class="stat-value">{player.stats.speed.toFixed(1)}</div>
        </div>
        
        <div class="stat">
          <div class="stat-name">Carrying Capacity</div>
          <div class="stat-value">{player.stats.carryingCapacity}</div>
        </div>
      </div>
    </div>
    
    <div class="character-section">
      <h3>Skills</h3>
      
      <div class="skill-grid">
        {#if player.skills}
          {#each Object.entries(player.skills) as [skillName, skillValue]}
            <div class="skill">
              <div class="skill-name">{skillName}</div>
              <div class="skill-value">{formatSkill(skillValue)}</div>
            </div>
          {/each}
        {/if}
      </div>
    </div>
    
    <div class="character-section">
      <h3>Exploration</h3>
      
      <div class="exploration-stats">
        <div class="exploration-stat">
          <div class="exploration-name">Tiles Discovered</div>
          <div class="exploration-value">{discoveredTiles}</div>
        </div>
        
        <div class="exploration-stat">
          <div class="exploration-name">Points of Interest</div>
          <div class="exploration-value">{discoveredPOIs}</div>
        </div>
      </div>
    </div>
    
    <div class="character-section">
      <h3>Inventory</h3>
      
      {#if player.inventory && player.inventory.length > 0}
        <div class="inventory-grid">
          {#each player.inventory as item}
            <div class="inventory-item">
              <div class="item-name">{item.name}</div>
              <div class="item-quantity">x{item.quantity}</div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="empty-inventory">Inventory is empty</div>
      {/if}
    </div>
  {:else}
    <div class="loading">Loading character data...</div>
  {/if}
</div>

<style>
  .character-panel {
    background-color: rgba(30, 30, 40, 0.9);
    border-radius: 8px;
    padding: 16px;
    width: 320px;
    color: #eee;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    max-height: 80vh;
    overflow-y: auto;
  }
  
  h2 {
    margin-top: 0;
    border-bottom: 1px solid #444;
    padding-bottom: 8px;
    font-size: 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  h3 {
    margin-top: 0;
    font-size: 16px;
    color: #bbb;
    border-bottom: 1px solid #333;
    padding-bottom: 4px;
    margin-bottom: 12px;
  }
  
  .character-section {
    margin-bottom: 20px;
  }
  
  .stat-grid, .skill-grid, .inventory-grid {
    display: grid;
    gap: 10px;
  }
  
  .stat-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .stat-name, .skill-name, .exploration-name {
    font-size: 12px;
    color: #aaa;
  }
  
  .stat-value, .skill-value, .exploration-value {
    font-size: 14px;
    font-weight: bold;
  }
  
  .progress-bar {
    background-color: #222;
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
  }
  
  .progress-fill.health {
    background-color: #e55;
  }
  
  .progress-fill.energy {
    background-color: #5ae;
  }
  
  .skill-grid {
    grid-template-columns: 1fr;
  }
  
  .skill {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
    border-bottom: 1px dotted #333;
  }
  
  .exploration-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  
  .exploration-stat {
    background-color: rgba(50, 50, 60, 0.5);
    padding: 8px;
    border-radius: 4px;
    text-align: center;
  }
  
  .inventory-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  
  .inventory-item {
    background-color: rgba(50, 50, 60, 0.5);
    padding: 8px;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
  }
  
  .item-name {
    font-size: 14px;
  }
  
  .item-quantity {
    font-size: 14px;
    font-weight: bold;
    color: #aaa;
  }
  
  .empty-inventory {
    color: #888;
    text-align: center;
    font-style: italic;
    padding: 10px;
  }
  
  .close-button {
    background: none;
    border: none;
    color: #aaa;
    font-size: 18px;
    cursor: pointer;
    padding: 0;
    margin: 0;
    line-height: 1;
  }
  
  .close-button:hover {
    color: #fff;
  }
  
  .loading {
    text-align: center;
    color: #aaa;
    padding: 20px;
  }
</style>