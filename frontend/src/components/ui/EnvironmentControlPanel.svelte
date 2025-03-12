<script lang="ts">
    import { gameState } from '$lib/gameLoop';
    import { WeatherCondition } from '$lib/gameLoop';
    
    // Constants for temperature and pressure conversion
    const KELVIN_TO_CELSIUS = 273.15;
    const PASCAL_TO_ATM = 101325;
    
    // Formatted temperature display
    function formatTemperature(kelvin: number): string {
      const celsius = kelvin - KELVIN_TO_CELSIUS;
      return `${celsius.toFixed(1)}°C (${kelvin.toFixed(1)} K)`;
    }
    
    // Formatted pressure display
    function formatPressure(pascal: number): string {
      const atm = pascal / PASCAL_TO_ATM;
      return `${atm.toFixed(2)} atm (${(pascal / 1000).toFixed(1)} kPa)`;
    }
    
    // Calculate efficiency based on temperature and pressure
    function calculateEfficiency(temp: number, pressure: number): number {
      // Simplified model - could be much more complex based on your game mechanics
      const optimalTemp = 400; // Example: 400K is optimal
      const optimalPressure = 200000; // Example: 2 bar is optimal
      
      const tempFactor = 1 - Math.min(Math.abs(temp - optimalTemp) / 200, 0.8);
      const pressureFactor = 1 - Math.min(Math.abs(pressure - optimalPressure) / 100000, 0.8);
      
      return Math.round((tempFactor * pressureFactor) * 100);
    }
    
    // Environment control functions
    function increaseTemperature() {
      gameState.update(state => {
        state.temperature += 10;
        return state;
      });
    }
    
    function decreaseTemperature() {
      gameState.update(state => {
        // Don't go below absolute zero
        state.temperature = Math.max(state.temperature - 10, 0);
        return state;
      });
    }
    
    function increasePressure() {
      gameState.update(state => {
        state.pressure *= 1.2; // Increase by 20%
        return state;
      });
    }
    
    function decreasePressure() {
      gameState.update(state => {
        state.pressure /= 1.2; // Decrease by 20%
        return state;
      });
    }
    
    // Get color based on temperature
    function getTempColor(kelvin: number): string {
      // Blue for cold, red for hot
      if (kelvin < 273) return '#3498db'; // Very cold
      if (kelvin < 300) return '#2980b9'; // Cold
      if (kelvin < 400) return '#27ae60'; // Normal
      if (kelvin < 600) return '#f39c12'; // Hot
      return '#e74c3c'; // Very hot
    }
    
    // Get color based on pressure
    function getPressureColor(pascal: number): string {
      // Light for low pressure, dark for high pressure
      const atm = pascal / PASCAL_TO_ATM;
      if (atm < 0.5) return '#3498db'; // Very low
      if (atm < 0.9) return '#2980b9'; // Low
      if (atm < 1.1) return '#27ae60'; // Normal
      if (atm < 2.0) return '#f39c12'; // High
      return '#e74c3c'; // Very high
    }
    
    // Change weather (for testing)
    function changeWeather() {
      gameState.update(state => {
        const weatherTypes = Object.values(WeatherCondition);
        const currentIndex = weatherTypes.indexOf(state.weather);
        const nextIndex = (currentIndex + 1) % weatherTypes.length;
        state.weather = weatherTypes[nextIndex];
        return state;
      });
    }
    
    // Simulate day/night cycle
    function adjustTimeOfDay(amount) {
      gameState.update(state => {
        state.timeOfDay = (state.timeOfDay + amount) % 24;
        return state;
      });
    }
  </script>
  
  <div class="environment-panel">
    <h2>Environment Controls</h2>
    
    <div class="environment-gauges">
      <div class="gauge temperature" style="--gauge-color: {getTempColor($gameState.temperature)}">
        <div class="gauge-title">Temperature</div>
        <div class="gauge-value">{formatTemperature($gameState.temperature)}</div>
        <div class="gauge-bar">
          <div 
            class="gauge-fill" 
            style="width: {Math.min(100, ($gameState.temperature / 1000) * 100)}%"
          ></div>
        </div>
        <div class="gauge-controls">
          <button on:click={decreaseTemperature}>-</button>
          <button on:click={increaseTemperature}>+</button>
        </div>
      </div>
      
      <div class="gauge pressure" style="--gauge-color: {getPressureColor($gameState.pressure)}">
        <div class="gauge-title">Pressure</div>
        <div class="gauge-value">{formatPressure($gameState.pressure)}</div>
        <div class="gauge-bar">
          <div 
            class="gauge-fill" 
            style="width: {Math.min(100, ($gameState.pressure / 500000) * 100)}%"
          ></div>
        </div>
        <div class="gauge-controls">
          <button on:click={decreasePressure}>-</button>
          <button on:click={increasePressure}>+</button>
        </div>
      </div>
    </div>
    
    <div class="environment-controls">
      <div class="control-group">
        <h3>Weather</h3>
        <div class="weather-display">
          <div class="weather-icon">
            {#if $gameState.weather === 'Clear'}
              ☀️
            {:else if $gameState.weather === 'Cloudy'}
              ☁️
            {:else if $gameState.weather === 'Stormy'}
              ⛈️
            {:else if $gameState.weather === 'Cold'}
              ❄️
            {:else if $gameState.weather === 'Hot'}
              🔥
            {/if}
          </div>
          <div class="weather-name">{$gameState.weather}</div>
        </div>
        <button class="weather-button" on:click={changeWeather}>Change Weather</button>
      </div>
      
      <div class="control-group">
        <h3>Time of Day</h3>
        <div class="time-display">
          <div class="time-icon">
            {#if $gameState.timeOfDay >= 6 && $gameState.timeOfDay < 18}
              {#if $gameState.timeOfDay >= 6 && $gameState.timeOfDay < 10}
                🌅
              {:else if $gameState.timeOfDay >= 10 && $gameState.timeOfDay < 16}
                ☀️
              {:else}
                🌇
              {/if}
            {:else}
              {#if $gameState.timeOfDay >= 18 && $gameState.timeOfDay < 22}
                🌙
              {:else}
                🌚
              {/if}
            {/if}
          </div>
          <div class="time-value">
            {Math.floor($gameState.timeOfDay)}:{(($gameState.timeOfDay % 1) * 60).toFixed(0).padStart(2, '0')}
            {$gameState.timeOfDay >= 12 ? 'PM' : 'AM'}
          </div>
        </div>
        <div class="time-controls">
          <button on:click={() => adjustTimeOfDay(-1)}>◀</button>
          <div class="time-slider">
            <div 
              class="time-marker" 
              style="left: {($gameState.timeOfDay / 24) * 100}%"
            ></div>
          </div>
          <button on:click={() => adjustTimeOfDay(1)}>▶</button>
        </div>
      </div>
    </div>
    
    <div class="efficiency-display">
      <h3>Reaction Efficiency</h3>
      <div class="efficiency-meter">
        <div 
          class="efficiency-value"
          class:optimal={calculateEfficiency($gameState.temperature, $gameState.pressure) > 90}
          class:good={calculateEfficiency($gameState.temperature, $gameState.pressure) > 70 && calculateEfficiency($gameState.temperature, $gameState.pressure) <= 90}
          class:average={calculateEfficiency($gameState.temperature, $gameState.pressure) > 40 && calculateEfficiency($gameState.temperature, $gameState.pressure) <= 70}
          class:poor={calculateEfficiency($gameState.temperature, $gameState.pressure) <= 40}
        >
          {calculateEfficiency($gameState.temperature, $gameState.pressure)}%
        </div>
      </div>
      <div class="efficiency-info">
        <p>Current conditions {calculateEfficiency($gameState.temperature, $gameState.pressure) > 70 ? 'are favorable' : 'need adjustment'} for optimal reactions.</p>
      </div>
    </div>
    
    <div class="environment-tips">
      <h3>Tips</h3>
      <ul>
        {#if $gameState.temperature < 300}
          <li>Low temperature slows reactions but may increase yield for exothermic reactions.</li>
        {:else if $gameState.temperature > 600}
          <li>High temperature increases reaction rates but may damage some buildings.</li>
        {/if}
        
        {#if $gameState.pressure < 90000}
          <li>Low pressure is suitable for gas-producing reactions.</li>
        {:else if $gameState.pressure > 200000}
          <li>High pressure benefits reactions that reduce the number of molecules.</li>
        {/if}
      </ul>
    </div>
  </div>
  
  <style>
    .environment-panel {
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
    
    .environment-gauges {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .gauge {
      background-color: #34495e;
      border-radius: 4px;
      padding: 12px;
    }
    
    .gauge-title {
      font-weight: bold;
      margin-bottom: 4px;
    }
    
    .gauge-value {
      font-size: 18px;
      font-family: monospace;
      margin-bottom: 8px;
      color: var(--gauge-color, white);
    }
    
    .gauge-bar {
      height: 8px;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    
    .gauge-fill {
      height: 100%;
      background-color: var(--gauge-color, #3498db);
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    
    .gauge-controls {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    
    .gauge-controls button {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: bold;
      background-color: rgba(0, 0, 0, 0.2);
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .gauge-controls button:hover {
      background-color: rgba(0, 0, 0, 0.4);
    }
    
    .environment-controls {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .control-group {
      flex: 1;
      background-color: #34495e;
      border-radius: 4px;
      padding: 12px;
    }
    
    .weather-display {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 12px 0;
      gap: 8px;
    }
    
    .weather-icon {
      font-size: 24px;
    }
    
    .weather-name {
      font-size: 18px;
      font-weight: bold;
    }
    
    .weather-button {
      width: 100%;
      background-color: rgba(0, 0, 0, 0.2);
      border: none;
      border-radius: 4px;
      padding: 8px;
      color: white;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .weather-button:hover {
      background-color: rgba(0, 0, 0, 0.4);
    }
    
    .time-display {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 12px 0;
      gap: 8px;
    }
    
    .time-icon {
      font-size: 24px;
    }
    
    .time-value {
      font-size: 18px;
      font-weight: bold;
      font-family: monospace;
    }
    
    .time-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .time-controls button {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(0, 0, 0, 0.2);
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .time-controls button:hover {
      background-color: rgba(0, 0, 0, 0.4);
    }
    
    .time-slider {
      flex: 1;
      height: 8px;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      position: relative;
    }
    
    .time-marker {
      position: absolute;
      top: -4px;
      width: 16px;
      height: 16px;
      background-color: #3498db;
      border-radius: 50%;
      transform: translateX(-8px);
      transition: left 0.3s ease;
    }
    
    .efficiency-display {
      background-color: #34495e;
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 16px;
    }
    
    .efficiency-meter {
      display: flex;
      justify-content: center;
      margin: 12px 0;
    }
    
    .efficiency-value {
      font-size: 32px;
      font-weight: bold;
      padding: 8px 16px;
      border-radius: 4px;
      background-color: rgba(0, 0, 0, 0.2);
    }
    
    .optimal {
      color: #2ecc71;
    }
    
    .good {
      color: #3498db;
    }
    
    .average {
      color: #f39c12;
    }
    
    .poor {
      color: #e74c3c;
    }
    
    .efficiency-info {
      text-align: center;
      font-size: 14px;
      color: #bdc3c7;
    }
    
    .environment-tips {
      background-color: #34495e;
      border-radius: 4px;
      padding: 12px;
    }
    
    .environment-tips ul {
      margin: 0;
      padding-left: 20px;
      font-size: 14px;
      color: #bdc3c7;
    }
    
    .environment-tips li {
      margin-bottom: 8px;
    }
  </style>