import './app.css'
import App from './App.svelte'

// For Svelte 5, use this:
const target = document.getElementById('app')
if (target) {
  new App({ target })
}

export default App