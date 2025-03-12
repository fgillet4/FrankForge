<script lang="ts">
  export let type: string = 'generic';
  export let x: number = 0;
  export let y: number = 0;
  export let size: number = 32;
  export let selected: boolean = false;
  
  // Building colors based on type
  const colors = {
    extractor: '#3498db',
    reactor: '#e74c3c',
    powerPlant: '#2ecc71',
    default: '#bdc3c7'
  };
  
  function getColor() {
    return colors[type] || colors.default;
  }
</script>

<!-- This component will be used for rendering buildings on the canvas -->
<div 
  class="building"
  class:selected
  style="
    left: {x - size/2}px;
    top: {y - size/2}px;
    width: {size}px;
    height: {size}px;
    background-color: {getColor()};
  "
>
</div>

<style>
  .building {
    position: absolute;
    border-radius: 4px;
  }
  
  .selected {
    outline: 2px solid white;
  }
</style>
