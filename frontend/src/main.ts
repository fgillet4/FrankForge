import './app.css';
import Phaser from 'phaser';
import { MenuScene }  from './scenes/MenuScene';
import { PauseScene } from './scenes/PauseScene';
import { WorldScene } from './lib/phaser/WorldScene';

// Make the #app div fill the screen
const app = document.getElementById('app')!;
Object.assign(app.style, { width: '100%', height: '100vh', overflow: 'hidden' });

new Phaser.Game({
  type:            Phaser.AUTO,
  parent:          app,
  backgroundColor: '#0a0a14',
  banner:          false,
  scene:           [MenuScene, WorldScene, PauseScene],
  scale: {
    mode:       Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width:      window.innerWidth,
    height:     window.innerHeight,
  },
});
