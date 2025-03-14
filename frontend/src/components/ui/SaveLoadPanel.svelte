<!-- src/components/SaveLoadPanel.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { saveGame, loadGame, listSaves, deleteSave } from '../../lib/supabase';
    import { gameState } from '../../lib/gameLoop';
    
    let saves = [];
    let isLoading = true;
    let saveName = 'Game 1';
    let saveStatus = '';
    let showConfirmDelete = false;
    let saveToDelete = null;
    
    onMount(async () => {
      await refreshSaves();
    });
    
    async function refreshSaves() {
      isLoading = true;
      const { data, error } = await listSaves();
      
      if (error) {
        console.error('Error loading saves:', error);
      } else {
        saves = data || [];
      }
      
      isLoading = false;
    }
    
    async function handleSave() {
      saveStatus = 'Saving...';
      
      const { error } = await saveGame(saveName, $gameState);
      
      if (error) {
        saveStatus = `Error: ${error.message}`;
        console.error('Error saving game:', error);
      } else {
        saveStatus = 'Game saved successfully!';
        await refreshSaves();
        
        // Clear status after 3 seconds
        setTimeout(() => {
          saveStatus = '';
        }, 3000);
      }
    }
    
    async function handleLoad(saveId) {
      isLoading = true;
      
      const { data, error } = await loadGame(saveId);
      
      if (error) {
        console.error('Error loading game:', error);
      } else if (data) {
        // Update game state with loaded data
        gameState.set(data.state_data);
      }
      
      isLoading = false;
    }
    
    function confirmDelete(saveId) {
      saveToDelete = saveId;
      showConfirmDelete = true;
    }
    
    async function handleDelete() {
      if (!saveToDelete) return;
      
      const { error } = await deleteSave(saveToDelete);
      
      if (error) {
        console.error('Error deleting save:', error);
      } else {
        await refreshSaves();
      }
      
      showConfirmDelete = false;
      saveToDelete = null;
    }
    
    function formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString();
    }
  </script>
  
  <div class="save-panel">
    <h2>Save/Load Game</h2>
    
    <div class="save-form">
      <div class="input-group">
        <input type="text" bind:value={saveName} placeholder="Save name">
        <button on:click={handleSave}>Save Game</button>
      </div>
      
      {#if saveStatus}
        <div class="status-message">{saveStatus}</div>
      {/if}
    </div>
    
    <div class="saves-list">
      <h3>Saved Games</h3>
      
      {#if isLoading}
        <div class="loading">Loading saves...</div>
      {:else if saves.length === 0}
        <div class="no-saves">No saved games found</div>
      {:else}
        {#each saves as save}
          <div class="save-item">
            <div class="save-info">
              <div class="save-name">{save.name}</div>
              <div class="save-date">
                Last saved: {formatDate(save.updated_at)}
              </div>
            </div>
            
            <div class="save-actions">
              <button class="action-button load" on:click={() => handleLoad(save.id)}>
                Load
              </button>
              <button class="action-button delete" on:click={() => confirmDelete(save.id)}>
                Delete
              </button>
            </div>
          </div>
        {/each}
      {/if}
    </div>
    
    {#if showConfirmDelete}
      <div class="modal-overlay">
        <div class="modal">
          <h3>Confirm Delete</h3>
          <p>Are you sure you want to delete this save?</p>
          <div class="modal-actions">
            <button class="cancel" on:click={() => showConfirmDelete = false}>Cancel</button>
            <button class="delete" on:click={handleDelete}>Delete</button>
          </div>
        </div>
      </div>
    {/if}
  </div>
  
  <style>
    .save-panel {
      background-color: #2c3e50;
      border-radius: 4px;
      padding: 16px;
      color: white;
      position: relative;
    }
    
    h2, h3 {
      margin-top: 0;
      border-bottom: 1px solid #34495e;
      padding-bottom: 8px;
    }
    
    .save-form {
      margin-bottom: 16px;
    }
    
    .input-group {
      display: flex;
      gap: 8px;
    }
    
    input {
      flex: 1;
      padding: 8px 12px;
      border-radius: 4px;
      border: none;
      background-color: #34495e;
      color: white;
    }
    
    button {
      background-color: #3498db;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    button:hover {
      background-color: #2980b9;
    }
    
    .status-message {
      margin-top: 8px;
      padding: 4px 8px;
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
      font-size: 14px;
    }
    
    .saves-list {
      max-height: 300px;
      overflow-y: auto;
    }
    
    .save-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #34495e;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    
    .save-name {
      font-weight: bold;
    }
    
    .save-date {
      font-size: 12px;
      color: #bdc3c7;
    }
    
    .save-actions {
      display: flex;
      gap: 8px;
    }
    
    .action-button {
      font-size: 12px;
      padding: 4px 8px;
    }
    
    .action-button.load {
      background-color: #2ecc71;
    }
    
    .action-button.load:hover {
      background-color: #27ae60;
    }
    
    .action-button.delete {
      background-color: #e74c3c;
    }
    
    .action-button.delete:hover {
      background-color: #c0392b;
    }
    
    .loading, .no-saves {
      padding: 16px;
      text-align: center;
      color: #bdc3c7;
    }
    
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 100;
    }
    
    .modal {
      background-color: #2c3e50;
      border-radius: 4px;
      padding: 24px;
      width: 300px;
    }
    
    .modal h3 {
      margin-top: 0;
      color: #e74c3c;
    }
    
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }
    
    .modal-actions .cancel {
      background-color: #7f8c8d;
    }
    
    .modal-actions .delete {
      background-color: #e74c3c;
    }
  </style>