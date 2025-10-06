<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { 
    initWasm, 
    getElements, 
    getMolecules, 
    getReactions, 
    simulateChemicalReaction,
    getReactionByName
  } from '../../wasm';
  import type { Reaction, Molecule, Element } from '../../wasm/types';
  
  const dispatch = createEventDispatcher();
  
  // Local state
  let elements: Record<string, Element> = {};
  let molecules: Record<string, Molecule> = {};
  let reactions: Reaction[] = [];
  let selectedReaction: Reaction | null = null;
  let isLoading = true;
  let error: string | null = null;
  let reactionResults: any | null = null;
  
  // Simulation parameters
  let temperature = 298.15; // 25°C in Kelvin
  let pressure = 101325;    // 1 atm in Pascal
  let deltaTime = 1.0;      // 1 second
  let catalystPresent = false;
  
  // Resource amounts (reactants)
  let reactantAmounts: Record<string, number> = {};
  
  // Initialize WASM
  onMount(async () => {
    try {
      await initWasm();
      elements = getElements();
      molecules = getMolecules();
      reactions = getReactions();
      
      // Initialize first reaction
      if (reactions.length > 0) {
        selectedReaction = reactions[0];
        initializeReactants();
      }
      
      isLoading = false;
    } catch (err) {
      error = `Failed to initialize chemistry: ${err.message}`;
      isLoading = false;
    }
  });
  
  // Initialize reactant amounts when reaction changes
  function initializeReactants() {
    if (!selectedReaction) return;
    
    reactantAmounts = {};
    for (const [reactant, amount] of Object.entries(selectedReaction.reactants)) {
      reactantAmounts[reactant] = amount * 10; // Start with 10x the required amount
    }
  }
  
  // Handle reaction selection
  function handleReactionSelect(event: Event) {
    const select = event.target as HTMLSelectElement;
    const reactionName = select.value;
    selectedReaction = getReactionByName(reactionName);
    initializeReactants();
    reactionResults = null;
  }
  
  // Run the reaction simulation
  function runReaction() {
    if (!selectedReaction) return;
    
    try {
      reactionResults = simulateChemicalReaction(
        reactantAmounts,
        selectedReaction.name,
        temperature,
        pressure,
        deltaTime,
        catalystPresent
      );
      
      // Update reactant amounts with remaining values
      if (reactionResults && reactionResults.consumed) {
        for (const [reactant, amount] of Object.entries(reactionResults.consumed)) {
          reactantAmounts[reactant] -= amount;
          if (reactantAmounts[reactant] < 0) reactantAmounts[reactant] = 0;
        }
      }
    } catch (err) {
      error = `Error running reaction: ${err.message}`;
    }
  }
  
  // Format temperature for display (K to °C)
  function formatTemperature(kelvin: number): string {
    return `${(kelvin - 273.15).toFixed(1)}°C`;
  }
  
  // Format energy for display
  function formatEnergy(energy: number): string {
    if (Math.abs(energy) > 1000) {
      return `${(energy / 1000).toFixed(2)} MJ`;
    }
    return `${energy.toFixed(2)} kJ`;
  }
</script>

<div class="chemistry-panel">
  <h2>Chemistry Simulator <button class="close-button" on:click={() => dispatch('close')}>×</button></h2>
  
  {#if isLoading}
    <div class="loading">
      <p>Loading chemistry data...</p>
    </div>
  {:else if error}
    <div class="error">
      <p>{error}</p>
      <button on:click={() => error = null}>Dismiss</button>
    </div>
  {:else}
    <div class="reaction-selector">
      <label for="reaction">Select Reaction:</label>
      <select id="reaction" on:change={handleReactionSelect}>
        {#each reactions as reaction}
          <option value={reaction.name}>{reaction.name}</option>
        {/each}
      </select>
    </div>
    
    {#if selectedReaction}
      <div class="reaction-details">
        <h3>{selectedReaction.name}</h3>
        
        <div class="reaction-equation">
          {#each Object.entries(selectedReaction.reactants) as [reactant, amount]}
            {#if amount > 0}
              {#if amount !== 1}<span class="coefficient">{amount}</span>{/if}
              <span class="molecule">{reactant}</span>
              {#if reactant !== Object.keys(selectedReaction.reactants).pop()}
                <span class="plus">+</span>
              {/if}
            {/if}
          {/each}
          
          <span class="arrow">→</span>
          
          {#each Object.entries(selectedReaction.products) as [product, amount]}
            {#if amount > 0}
              {#if amount !== 1}<span class="coefficient">{amount}</span>{/if}
              <span class="molecule">{product}</span>
              {#if product !== Object.keys(selectedReaction.products).pop()}
                <span class="plus">+</span>
              {/if}
            {/if}
          {/each}
        </div>
        
        <div class="reaction-properties">
          <div class="property">
            <span class="label">Energy:</span>
            <span class="value {selectedReaction.energy_delta < 0 ? 'exothermic' : 'endothermic'}">
              {selectedReaction.energy_delta < 0 ? 'Exothermic' : 'Endothermic'} 
              ({formatEnergy(selectedReaction.energy_delta)})
            </span>
          </div>
          
          <div class="property">
            <span class="label">Temperature Range:</span>
            <span class="value">
              {formatTemperature(selectedReaction.min_temperature)} to {formatTemperature(selectedReaction.max_temperature)}
            </span>
          </div>
          
          {#if selectedReaction.catalyst}
            <div class="property">
              <span class="label">Catalyst:</span>
              <span class="value">{selectedReaction.catalyst} (×{selectedReaction.catalyst_effect} rate)</span>
            </div>
          {/if}
        </div>
        
        <div class="simulation-inputs">
          <h4>Simulation Parameters</h4>
          
          <div class="input-group">
            <label for="temperature">Temperature (°C):</label>
            <input 
              type="range" 
              id="temperature" 
              min={0} 
              max={500} 
              bind:value={temperature} 
              step="1"
            />
            <span class="value">{formatTemperature(temperature)}</span>
          </div>
          
          <div class="input-group">
            <label for="pressure">Pressure (atm):</label>
            <input 
              type="range" 
              id="pressure" 
              min={1} 
              max={10} 
              bind:value={pressure} 
              step="0.1"
            />
            <span class="value">{(pressure / 101325).toFixed(1)} atm</span>
          </div>
          
          {#if selectedReaction.catalyst}
            <div class="input-group catalyst-toggle">
              <label for="catalyst">Use Catalyst:</label>
              <input 
                type="checkbox" 
                id="catalyst"
                bind:checked={catalystPresent}
              />
              <span class="catalyst-name">{selectedReaction.catalyst}</span>
            </div>
          {/if}
          
          <h4>Reactants</h4>
          
          <div class="reactants">
            {#each Object.entries(selectedReaction.reactants) as [reactant, requiredAmount]}
              <div class="reactant">
                <label for={`reactant-${reactant}`}>{reactant}:</label>
                <input 
                  type="number" 
                  id={`reactant-${reactant}`}
                  min="0"
                  step="0.1"
                  bind:value={reactantAmounts[reactant]}
                />
                <span class="unit">mol</span>
              </div>
            {/each}
          </div>
          
          <button class="run-button" on:click={runReaction}>Run Reaction</button>
        </div>
        
        {#if reactionResults}
          <div class="results">
            <h4>Results</h4>
            
            <div class="result-section">
              <h5>Consumed</h5>
              <ul>
                {#each Object.entries(reactionResults.consumed) as [reactant, amount]}
                  <li>
                    <span class="molecule">{reactant}</span>: 
                    <span class="amount">{amount.toFixed(2)} mol</span>
                  </li>
                {/each}
              </ul>
            </div>
            
            <div class="result-section">
              <h5>Produced</h5>
              <ul>
                {#each Object.entries(reactionResults.produced) as [product, amount]}
                  <li>
                    <span class="molecule">{product}</span>: 
                    <span class="amount">{amount.toFixed(2)} mol</span>
                  </li>
                {/each}
              </ul>
            </div>
            
            <div class="energy-result">
              <span class="label">Energy Change:</span>
              <span class="value {reactionResults.energyChange < 0 ? 'exothermic' : 'endothermic'}">
                {formatEnergy(reactionResults.energyChange)}
              </span>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div>

<style>
  .chemistry-panel {
    background-color: rgba(30, 30, 40, 0.9);
    border-radius: 8px;
    padding: 16px;
    width: 400px;
    color: #eee;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    max-height: 90vh;
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
    font-size: 16px;
    margin-top: 10px;
    margin-bottom: 5px;
    color: #3498db;
  }
  
  h4 {
    font-size: 14px;
    margin-top: 15px;
    margin-bottom: 10px;
    color: #bbb;
    border-bottom: 1px dotted #444;
    padding-bottom: 4px;
  }
  
  h5 {
    font-size: 13px;
    margin: 8px 0;
    color: #aaa;
  }
  
  .loading, .error {
    padding: 20px;
    text-align: center;
  }
  
  .error {
    color: #e74c3c;
    background-color: rgba(231, 76, 60, 0.1);
    border: 1px solid rgba(231, 76, 60, 0.3);
    border-radius: 4px;
    padding: 10px;
  }
  
  .reaction-selector {
    margin-bottom: 15px;
  }
  
  select {
    width: 100%;
    padding: 8px;
    background-color: #2c3e50;
    color: white;
    border: 1px solid #3498db;
    border-radius: 4px;
    margin-top: 5px;
  }
  
  .reaction-equation {
    background-color: rgba(50, 50, 60, 0.6);
    padding: 10px;
    border-radius: 4px;
    margin: 10px 0;
    font-size: 16px;
    text-align: center;
  }
  
  .coefficient {
    font-weight: bold;
    font-size: 0.9em;
    position: relative;
    top: -0.2em;
    margin-right: 1px;
  }
  
  .molecule {
    font-family: monospace;
  }
  
  .plus {
    margin: 0 5px;
    color: #aaa;
  }
  
  .arrow {
    margin: 0 10px;
    color: #3498db;
  }
  
  .reaction-properties {
    margin: 15px 0;
  }
  
  .property {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    border-bottom: 1px dotted #333;
    padding-bottom: 3px;
  }
  
  .label {
    color: #aaa;
    font-size: 0.9em;
  }
  
  .value {
    font-weight: bold;
  }
  
  .exothermic {
    color: #2ecc71;
  }
  
  .endothermic {
    color: #e74c3c;
  }
  
  .input-group {
    margin-bottom: 12px;
  }
  
  input[type="range"] {
    width: 70%;
    background-color: #2c3e50;
  }
  
  input[type="number"] {
    width: 100px;
    padding: 5px;
    background-color: #2c3e50;
    color: white;
    border: 1px solid #3498db;
    border-radius: 3px;
  }
  
  .catalyst-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .catalyst-name {
    font-size: 0.9em;
    font-style: italic;
    color: #f39c12;
  }
  
  .reactants {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  
  .reactant {
    display: flex;
    flex-direction: column;
  }
  
  .unit {
    font-size: 0.8em;
    color: #aaa;
    margin-top: 2px;
  }
  
  .run-button {
    width: 100%;
    padding: 10px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
    margin-top: 15px;
  }
  
  .run-button:hover {
    background-color: #2980b9;
  }
  
  .results {
    margin-top: 20px;
    background-color: rgba(50, 50, 60, 0.4);
    padding: 15px;
    border-radius: 4px;
    border-left: 3px solid #3498db;
  }
  
  .result-section {
    margin-bottom: 15px;
  }
  
  ul {
    list-style: none;
    padding-left: 10px;
    margin: 5px 0;
  }
  
  li {
    margin-bottom: 5px;
    display: flex;
    justify-content: space-between;
  }
  
  .amount {
    font-weight: bold;
  }
  
  .energy-result {
    padding-top: 10px;
    border-top: 1px dotted #555;
    display: flex;
    justify-content: space-between;
    font-weight: bold;
  }
  
  .close-button {
    background: none;
    border: none;
    color: #aaa;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    margin: 0;
    line-height: 1;
  }
  
  .close-button:hover {
    color: #fff;
  }
</style>