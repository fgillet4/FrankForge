<script lang="ts">
  import { gameState } from '../../stores/gameState';
  import { onMount, createEventDispatcher } from 'svelte';
  import type { Quest } from '../../lib/types';
  
  // Local reactive variables
  let activeQuests: Quest[] = [];
  
  // Subscribe to game state changes
  const unsubscribe = gameState.subscribe(state => {
    if (state.exploration && state.exploration.activeQuests) {
      activeQuests = state.exploration.activeQuests;
    } else {
      activeQuests = [];
    }
  });
  
  // Clean up on unmount
  onMount(() => {
    return () => {
      unsubscribe();
    };
  });
  
  // Toggle quest details
  let expandedQuests: Record<string, boolean> = {};
  
  function toggleQuest(questId: string) {
    expandedQuests[questId] = !expandedQuests[questId];
  }
  
  // Format progress
  function formatProgress(current: number, max: number): string {
    return `${current}/${max}`;
  }
  
  // Calculate progress percentage
  function calculateProgress(current: number, max: number): number {
    return (current / max) * 100;
  }
</script>

<div class="objective-tracker">
  <h2>Objectives</h2>
  
  {#if activeQuests.length > 0}
    <div class="quest-list">
      {#each activeQuests as quest (quest.id)}
        <div class="quest {expandedQuests[quest.id] ? 'expanded' : ''}">
          <div class="quest-header" on:click={() => toggleQuest(quest.id)}>
            <div class="quest-name">{quest.name}</div>
            <div class="quest-toggle">{expandedQuests[quest.id] ? '-' : '+'}</div>
          </div>
          
          {#if expandedQuests[quest.id]}
            <div class="quest-details">
              <div class="quest-description">{quest.description}</div>
              
              <div class="objectives">
                {#each quest.objectives as objective (objective.id)}
                  <div class="objective {objective.completed ? 'completed' : ''}">
                    <div class="objective-info">
                      <div class="objective-description">{objective.description}</div>
                      {#if objective.quantity > 1}
                        <div class="objective-progress">{formatProgress(objective.progress, objective.quantity)}</div>
                      {/if}
                    </div>
                    
                    {#if objective.quantity > 1}
                      <div class="progress-bar">
                        <div 
                          class="progress-fill" 
                          style="width: {calculateProgress(objective.progress, objective.quantity)}%"
                        ></div>
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <div class="no-quests">
      <p>No active objectives</p>
      <p class="hint">Explore the world to discover new tasks!</p>
    </div>
  {/if}
</div>

<style>
  .objective-tracker {
    background-color: rgba(30, 30, 40, 0.85);
    padding: 12px;
    border-radius: 6px;
    width: 300px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    color: #eee;
    font-size: 14px;
  }
  
  h2 {
    margin: 0 0 12px 0;
    font-size: 16px;
    padding-bottom: 6px;
    border-bottom: 1px solid #555;
  }
  
  .quest-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .quest {
    background-color: rgba(50, 50, 60, 0.6);
    border-radius: 4px;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  
  .quest.expanded {
    background-color: rgba(60, 60, 70, 0.6);
  }
  
  .quest-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .quest-header:hover {
    background-color: rgba(70, 70, 80, 0.6);
  }
  
  .quest-name {
    font-weight: 500;
  }
  
  .quest-toggle {
    font-weight: bold;
    font-size: 16px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background-color: rgba(80, 80, 90, 0.5);
  }
  
  .quest-details {
    padding: 10px;
    border-top: 1px solid rgba(80, 80, 90, 0.8);
  }
  
  .quest-description {
    font-size: 12px;
    color: #bbb;
    margin-bottom: 10px;
    font-style: italic;
  }
  
  .objectives {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .objective {
    padding: 8px;
    background-color: rgba(40, 40, 50, 0.6);
    border-radius: 4px;
  }
  
  .objective.completed {
    opacity: 0.7;
  }
  
  .objective-info {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 5px;
  }
  
  .objective-description {
    font-size: 13px;
    flex: 1;
  }
  
  .objective.completed .objective-description {
    text-decoration: line-through;
    color: #aaa;
  }
  
  .objective-progress {
    font-size: 12px;
    font-weight: bold;
    min-width: 40px;
    text-align: right;
    color: #aaa;
  }
  
  .progress-bar {
    height: 4px;
    background-color: rgba(30, 30, 40, 0.8);
    border-radius: 2px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background-color: #5ae;
    border-radius: 2px;
    transition: width 0.3s ease;
  }
  
  .objective.completed .progress-fill {
    background-color: #5c5;
  }
  
  .no-quests {
    text-align: center;
    padding: 16px;
    color: #999;
  }
  
  .hint {
    font-size: 12px;
    font-style: italic;
    opacity: 0.7;
    margin-top: 8px;
  }
</style>