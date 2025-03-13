<script lang="ts">
  import { gameState, technologies } from '../../stores/gameState';
  import { onMount } from 'svelte';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  
  let availableTechnologies = [];
  let completedTechnologies = [];
  let queuedTechnologies = [];
  let currentResearch = null;
  
  // Progress bar animation
  const progress = tweened(0, {
    duration: 800,
    easing: cubicOut
  });
  
  // Tech info panel
  let selectedTech = null;
  let canResearch = false;
  
  // Update available technologies based on completed research and prerequisites
  $: {
    currentResearch = $gameState.research.currentResearch;
    
    // Sync progress bar
    if (currentResearch) {
      const tech = technologies[currentResearch];
      if (tech) {
        progress.set($gameState.research.progress / tech.cost);
      }
    } else {
      progress.set(0);
    }
    
    // Filter completed technologies
    completedTechnologies = $gameState.research.completed;
    
    // Get queued technologies
    queuedTechnologies = $gameState.research.unlockQueue;
    
    // Update available technologies
    availableTechnologies = Object.entries(technologies)
      .filter(([id, tech]) => {
        // Skip completed and queued technologies
        if (completedTechnologies.includes(id) || 
            queuedTechnologies.includes(id) || 
            currentResearch === id) {
          return false;
        }
        
        // Check prerequisites
        return tech.prerequisites.every(prereq => 
          completedTechnologies.includes(prereq));
      })
      .map(([id, tech]) => ({
        id,
        ...tech
      }));
      
    // Check if selected tech can be researched
    if (selectedTech) {
      canResearch = !currentResearch || currentResearch === selectedTech.id;
    }
  }
  
  // Start researching a technology
  function startResearch(techId) {
    if (!techId || (currentResearch && currentResearch !== techId)) return;
    
    // If already queued, remove from queue first
    const queueIndex = queuedTechnologies.indexOf(techId);
    if (queueIndex !== -1) {
      queuedTechnologies.splice(queueIndex, 1);
    }
    
    // Set as current research if no current research
    if (!currentResearch) {
      gameState.update(state => {
        state.research.currentResearch = techId;
        state.research.progress = 0;
        return state;
      });
    }
  }
  
  // Queue a technology for research
  function queueResearch(techId) {
    if (!techId || completedTechnologies.includes(techId)) return;
    
    // Don't add if already in queue or current research
    if (queuedTechnologies.includes(techId) || currentResearch === techId) return;
    
    gameState.update(state => {
      // If no current research, make this the current research
      if (!state.research.currentResearch) {
        state.research.currentResearch = techId;
        state.research.progress = 0;
      } else {
        // Otherwise add to queue
        state.research.unlockQueue.push(techId);
      }
      return state;
    });
  }
  
  // Cancel research
  function cancelResearch(techId) {
    if (!techId) return;
    
    gameState.update(state => {
      // If it's the current research
      if (state.research.currentResearch === techId) {
        state.research.currentResearch = state.research.unlockQueue.shift() || null;
        state.research.progress = 0;
      } else {
        // If it's in the queue
        const index = state.research.unlockQueue.indexOf(techId);
        if (index !== -1) {
          state.research.unlockQueue.splice(index, 1);
        }
      }
      return state;
    });
  }
  
  // Get CSS class for tech to show research state
  function getTechClass(techId) {
    if (completedTechnologies.includes(techId)) {
      return 'completed';
    } else if (currentResearch === techId) {
      return 'current';
    } else if (queuedTechnologies.includes(techId)) {
      return 'queued';
    } else if (isResearchable(techId)) {
      return 'available';
    } else {
      return 'locked';
    }
  }
  
  // Check if a tech is researchable
  function isResearchable(techId) {
    const tech = technologies[techId];
    if (!tech) return false;
    
    // Check if all prerequisites are completed
    return tech.prerequisites.every(prereq => completedTechnologies.includes(prereq));
  }
  
  // Get tech icon path
  function getTechIcon(tech) {
    return `/assets/research/${tech.icon || 'default'}.png`;
  }
  
  // Select a tech to show details
  function selectTech(tech) {
    selectedTech = tech;
    canResearch = isResearchable(tech.id) && (!currentResearch || currentResearch === tech.id);
  }
  
  // Get the current progress in percentage
  $: progressPercent = $progress * 100;
  
  // Estimate time to completion based on science production
  function getTimeEstimate() {
    if (!currentResearch) return 'N/A';
    
    const tech = technologies[currentResearch];
    if (!tech) return 'N/A';
    
    // Get science production rate
    const scienceRate = $gameState.resources.science || 0.1;
    
    // Calculate remaining science needed
    const remaining = tech.cost - $gameState.research.progress;
    
    // Calculate estimated seconds
    const seconds = remaining / scienceRate;
    
    if (seconds < 60) {
      return `${Math.ceil(seconds)}s`;
    } else if (seconds < 3600) {
      return `${Math.ceil(seconds / 60)}m`;
    } else {
      return `${Math.floor(seconds / 3600)}h ${Math.ceil((seconds % 3600) / 60)}m`;
    }
  }
  
  // Connect tech nodes in a force-directed layout (simplified for this implementation)
  // In a real implementation, this would use a proper graph layout algorithm
  function getTechPosition(techId, index) {
    const angleStep = 2 * Math.PI / Object.keys(technologies).length;
    const radius = 180;
    const tech = technologies[techId];
    
    let angle = index * angleStep;
    
    // Prerequisites pull nodes closer together
    if (tech.prerequisites.length > 0) {
      let sumX = 0;
      let sumY = 0;
      let count = 0;
      
      tech.prerequisites.forEach(prereq => {
        const prereqIndex = Object.keys(technologies).indexOf(prereq);
        if (prereqIndex !== -1) {
          const prereqAngle = prereqIndex * angleStep;
          sumX += Math.cos(prereqAngle);
          sumY += Math.sin(prereqAngle);
          count++;
        }
      });
      
      if (count > 0) {
        angle = Math.atan2(sumY / count, sumX / count);
      }
    }
    
    const x = radius * Math.cos(angle) + 250;
    const y = radius * Math.sin(angle) + 250;
    
    return { x, y };
  }
  
  // Get connections between tech nodes
  function getTechConnections() {
    const connections = [];
    
    Object.entries(technologies).forEach(([id, tech]) => {
      const targetIndex = Object.keys(technologies).indexOf(id);
      const target = getTechPosition(id, targetIndex);
      
      tech.prerequisites.forEach(prereq => {
        const sourceIndex = Object.keys(technologies).indexOf(prereq);
        const source = getTechPosition(prereq, sourceIndex);
        
        connections.push({
          x1: source.x,
          y1: source.y,
          x2: target.x,
          y2: target.y,
          state: getTechClass(id)
        });
      });
    });
    
    return connections;
  }
</script>

<div class="research-panel">
  <h2>Research</h2>
  
  <!-- Research tree visualization -->
  <div class="research-tree-container">
    <svg class="research-tree" viewBox="0 0 500 500">
      <!-- Connection lines between technologies -->
      {#each getTechConnections() as connection}
        <line 
          x1={connection.x1} 
          y1={connection.y1} 
          x2={connection.x2} 
          y2={connection.y2}
          class="tech-connection {connection.state}"
        />
      {/each}
      
      <!-- Technology nodes -->
      {#each Object.entries(technologies) as [id, tech], i}
        {@const position = getTechPosition(id, i)}
        <g 
          class="tech-node {getTechClass(id)}"
          transform="translate({position.x}, {position.y})"
          on:click={() => selectTech({id, ...tech})}
        >
          <circle r="22" />
          <image 
            href={getTechIcon(tech)} 
            x="-16" 
            y="-16" 
            width="32" 
            height="32"
          />
          <title>{tech.name}</title>
        </g>
      {/each}
    </svg>
  </div>
  
  <!-- Current research progress -->
  <div class="current-research">
    <h3>Current Research</h3>
    
    {#if currentResearch}
      <div class="research-progress">
        <div class="progress-info">
          <img 
            src={getTechIcon(technologies[currentResearch])} 
            alt={technologies[currentResearch].name}
            class="tech-icon"
          />
          <div>
            <h4>{technologies[currentResearch].name}</h4>
            <div class="progress-stats">
              <span>{Math.floor($gameState.research.progress)}/{technologies[currentResearch].cost} points</span>
              <span class="time-estimate">Est: {getTimeEstimate()}</span>
            </div>
          </div>
          <button class="cancel-button" on:click={() => cancelResearch(currentResearch)}>✕</button>
        </div>
        
        <div class="progress-bar">
          <div class="progress-fill" style="width: {progressPercent}%"></div>
        </div>
      </div>
      
      <!-- Research queue -->
      {#if queuedTechnologies.length > 0}
        <div class="research-queue">
          <h4>Queue</h4>
          <ul>
            {#each queuedTechnologies as techId}
              <li>
                <img 
                  src={getTechIcon(technologies[techId])} 
                  alt={technologies[techId].name}
                  class="queue-icon"
                />
                <span>{technologies[techId].name}</span>
                <button class="remove-button" on:click={() => cancelResearch(techId)}>✕</button>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    {:else}
      <div class="no-research">
        <p>No active research</p>
        <p class="hint">Select a technology from the tree or list to begin research</p>
      </div>
    {/if}
  </div>
  
  <!-- Technology details -->
  {#if selectedTech}
    <div class="tech-details">
      <h3>{selectedTech.name}</h3>
      <p class="tech-description">{selectedTech.description}</p>
      
      <div class="tech-info">
        <div class="tech-cost">
          <span class="label">Cost:</span>
          <span class="value">{selectedTech.cost} science points</span>
        </div>
        
        <div class="tech-time">
          <span class="label">Research time:</span>
          <span class="value">{selectedTech.time}s base time</span>
        </div>
        
        {#if selectedTech.prerequisites.length > 0}
          <div class="tech-prerequisites">
            <span class="label">Prerequisites:</span>
            <ul>
              {#each selectedTech.prerequisites as prereqId}
                <li class={completedTechnologies.includes(prereqId) ? 'completed' : 'missing'}>
                  {technologies[prereqId].name}
                </li>
              {/each}
            </ul>
          </div>
        {/if}
        
        <div class="tech-unlocks">
          <span class="label">Unlocks:</span>
          <ul>
            {#each selectedTech.unlocks as unlock}
              <li>{unlock}</li>
            {/each}
          </ul>
        </div>
      </div>
      
      <div class="tech-actions">
        <button 
          class="research-button" 
          disabled={!canResearch || completedTechnologies.includes(selectedTech.id)}
          on:click={() => startResearch(selectedTech.id)}
        >
          {#if completedTechnologies.includes(selectedTech.id)}
            Researched
          {:else if currentResearch === selectedTech.id}
            Researching
          {:else}
            Research Now
          {/if}
        </button>
        
        <button 
          class="queue-button" 
          disabled={
            !isResearchable(selectedTech.id) || 
            completedTechnologies.includes(selectedTech.id) || 
            queuedTechnologies.includes(selectedTech.id) ||
            currentResearch === selectedTech.id
          }
          on:click={() => queueResearch(selectedTech.id)}
        >
          {#if queuedTechnologies.includes(selectedTech.id)}
            In Queue
          {:else}
            Queue Research
          {/if}
        </button>
      </div>
    </div>
  {:else}
    <div class="tech-details empty">
      <p>Select a technology to view details</p>
    </div>
  {/if}
  
  <!-- Available technologies list -->
  <div class="available-techs">
    <h3>Available Research</h3>
    
    {#if availableTechnologies.length > 0}
      <div class="tech-list">
        {#each availableTechnologies as tech}
          <button 
            class="tech-item" 
            class:active={selectedTech && selectedTech.id === tech.id}
            on:click={() => selectTech(tech)}
          >
            <img src={getTechIcon(tech)} alt={tech.name} class="tech-list-icon" />
            <div class="tech-list-info">
              <span class="tech-list-name">{tech.name}</span>
              <span class="tech-list-cost">{tech.cost} points</span>
            </div>
          </button>
        {/each}
      </div>
    {:else}
      <div class="no-available-techs">
        <p>No available technologies to research</p>
        {#if completedTechnologies.length === 0}
          <p class="hint">Research basic technologies to unlock more options</p>
        {:else}
          <p class="hint">All available technologies are researched or in queue</p>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .research-panel {
    background-color: rgba(16, 24, 36, 0.95);
    color: white;
    border-radius: 8px;
    padding: 16px;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-rows: auto auto auto 1fr;
    gap: 16px;
    overflow-y: auto;
  }
  
  h2 {
    margin: 0 0 8px;
    border-bottom: 1px solid rgba(155, 89, 182, 0.3);
    padding-bottom: 12px;
    font-size: 1.2rem;
    color: #9b59b6;
    letter-spacing: 0.5px;
  }
  
  h3 {
    font-size: 1rem;
    margin: 0 0 12px;
    color: #3498db;
  }
  
  h4 {
    font-size: 14px;
    margin: 0 0 4px;
  }
  
  /* Research tree visualization */
  .research-tree-container {
    width: 100%;
    height: 300px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    background-color: rgba(16, 22, 36, 0.8);
    position: relative;
  }
  
  .research-tree {
    width: 100%;
    height: 100%;
  }
  
  .tech-connection {
    stroke-width: 2;
    stroke: rgba(52, 152, 219, 0.3);
    stroke-dasharray: 4;
  }
  
  .tech-connection.completed {
    stroke: rgba(46, 204, 113, 0.6);
    stroke-width: 3;
    stroke-dasharray: none;
  }
  
  .tech-connection.current, .tech-connection.queued {
    stroke: rgba(155, 89, 182, 0.6);
    stroke-width: 2.5;
    animation: pulse 2s infinite;
  }
  
  .tech-node {
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .tech-node circle {
    fill: rgba(28, 40, 55, 0.9);
    stroke: rgba(52, 152, 219, 0.5);
    stroke-width: 2;
    transition: all 0.3s ease;
  }
  
  .tech-node:hover circle {
    fill: rgba(52, 73, 94, 0.9);
    stroke: rgba(52, 152, 219, 0.8);
    stroke-width: 3;
  }
  
  .tech-node.locked circle {
    fill: rgba(28, 40, 55, 0.7);
    stroke: rgba(127, 140, 141, 0.5);
  }
  
  .tech-node.available circle {
    fill: rgba(28, 40, 55, 0.9);
    stroke: rgba(52, 152, 219, 0.7);
  }
  
  .tech-node.current circle {
    fill: rgba(155, 89, 182, 0.2);
    stroke: rgba(155, 89, 182, 0.8);
    stroke-width: 3;
    animation: pulse 2s infinite;
  }
  
  .tech-node.queued circle {
    fill: rgba(155, 89, 182, 0.1);
    stroke: rgba(155, 89, 182, 0.5);
    stroke-dasharray: 4;
  }
  
  .tech-node.completed circle {
    fill: rgba(46, 204, 113, 0.2);
    stroke: rgba(46, 204, 113, 0.7);
    stroke-width: 2;
  }
  
  /* Current research display */
  .current-research {
    padding: 12px;
    background: linear-gradient(to right, rgba(28, 40, 55, 0.8), rgba(20, 29, 47, 0.8));
    border-radius: 6px;
    border: 1px solid rgba(155, 89, 182, 0.2);
  }
  
  .research-progress {
    margin-bottom: 12px;
  }
  
  .progress-info {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .tech-icon {
    width: 32px;
    height: 32px;
    margin-right: 10px;
    border-radius: 4px;
    background-color: rgba(0, 0, 0, 0.3);
    padding: 4px;
  }
  
  .progress-stats {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: #bdc3c7;
  }
  
  .time-estimate {
    color: #3498db;
  }
  
  .cancel-button {
    margin-left: auto;
    background: none;
    border: none;
    color: #e74c3c;
    font-size: 16px;
    cursor: pointer;
    opacity: 0.7;
    transition: all 0.2s ease;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .cancel-button:hover {
    opacity: 1;
    background-color: rgba(231, 76, 60, 0.2);
  }
  
  .progress-bar {
    width: 100%;
    height: 8px;
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(to right, #9b59b6, #3498db);
    border-radius: 4px;
    transition: width 0.5s ease;
  }
  
  .research-queue {
    margin-top: 16px;
  }
  
  .research-queue h4 {
    font-size: 13px;
    margin-bottom: 8px;
    color: #bdc3c7;
  }
  
  .research-queue ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .research-queue li {
    display: flex;
    align-items: center;
    padding: 6px 8px;
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    margin-bottom: 6px;
    font-size: 13px;
  }
  
  .queue-icon {
    width: 20px;
    height: 20px;
    margin-right: 8px;
  }
  
  .remove-button {
    margin-left: auto;
    background: none;
    border: none;
    color: #e74c3c;
    font-size: 14px;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }
  
  .remove-button:hover {
    opacity: 1;
  }
  
  .no-research {
    padding: 20px;
    text-align: center;
  }
  
  .no-research p {
    margin: 4px 0;
  }
  
  .no-research .hint {
    font-size: 12px;
    color: #bdc3c7;
    margin-top: 8px;
  }
  
  /* Technology details panel */
  .tech-details {
    padding: 12px;
    background: linear-gradient(to right, rgba(28, 40, 55, 0.8), rgba(20, 29, 47, 0.8));
    border-radius: 6px;
    border: 1px solid rgba(52, 152, 219, 0.2);
  }
  
  .tech-details.empty {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #bdc3c7;
    font-style: italic;
  }
  
  .tech-description {
    font-size: 14px;
    line-height: 1.4;
    color: #bdc3c7;
    margin-bottom: 16px;
  }
  
  .tech-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .tech-info > div {
    font-size: 13px;
  }
  
  .tech-prerequisites, .tech-unlocks {
    grid-column: 1 / -1;
  }
  
  .label {
    color: #3498db;
    display: block;
    margin-bottom: 4px;
  }
  
  .tech-info ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .tech-info li {
    padding: 2px 0;
  }
  
  .tech-prerequisites li.completed {
    color: #2ecc71;
  }
  
  .tech-prerequisites li.missing {
    color: #e74c3c;
  }
  
  .tech-actions {
    display: flex;
    gap: 10px;
  }
  
  .research-button, .queue-button {
    flex: 1;
    padding: 8px 12px;
    border: none;
    border-radius: 4px;
    font-weight: 500;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .research-button {
    background: linear-gradient(to right, #9b59b6, #8e44ad);
    color: white;
  }
  
  .research-button:hover:not(:disabled) {
    background: linear-gradient(to right, #a569bd, #9b59b6);
    transform: translateY(-2px);
  }
  
  .queue-button {
    background: rgba(52, 152, 219, 0.2);
    color: #3498db;
    border: 1px solid rgba(52, 152, 219, 0.5);
  }
  
  .queue-button:hover:not(:disabled) {
    background: rgba(52, 152, 219, 0.3);
    transform: translateY(-2px);
  }
  
  .research-button:disabled, .queue-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  /* Available technologies list */
  .available-techs {
    overflow-y: auto;
  }
  
  .tech-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 10px;
  }
  
  .tech-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    background-color: rgba(28, 40, 55, 0.8);
    border: 1px solid rgba(52, 152, 219, 0.1);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    color: white;
  }
  
  .tech-item:hover {
    background-color: rgba(52, 73, 94, 0.8);
    transform: translateY(-2px);
    border-color: rgba(52, 152, 219, 0.3);
  }
  
  .tech-item.active {
    background-color: rgba(52, 152, 219, 0.2);
    border-color: rgba(52, 152, 219, 0.5);
  }
  
  .tech-list-icon {
    width: 28px;
    height: 28px;
    border-radius: 4px;
    background-color: rgba(0, 0, 0, 0.3);
    padding: 4px;
  }
  
  .tech-list-info {
    display: flex;
    flex-direction: column;
  }
  
  .tech-list-name {
    font-size: 13px;
    font-weight: 500;
  }
  
  .tech-list-cost {
    font-size: 11px;
    color: #bdc3c7;
  }
  
  .no-available-techs {
    padding: 24px;
    text-align: center;
    background-color: rgba(28, 40, 55, 0.5);
    border-radius: 8px;
    border: 1px dashed rgba(255, 255, 255, 0.1);
  }
  
  .hint {
    font-size: 12px;
    color: #bdc3c7;
    margin-top: 8px;
  }
  
  /* Animations */
  @keyframes pulse {
    0% {
      opacity: 0.6;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.6;
    }
  }
</style>