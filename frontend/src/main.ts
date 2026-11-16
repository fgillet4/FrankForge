import './app.css';
import Phaser from 'phaser';
import { MenuScene }  from './scenes/MenuScene';
import { GroundScene } from './lib/phaser/GroundScene';
import { WorldScene } from './lib/phaser/WorldScene';
import { authGate } from './ui/gate';

// Production builds are for FrankStation accounts with FrankForge access.
if (import.meta.env.PROD) await authGate();

// Make the #app div fill the screen
const app = document.getElementById('app')!;
Object.assign(app.style, { width: '100%', height: '100vh', overflow: 'hidden' });

const game = new Phaser.Game({
  type:            Phaser.AUTO,
  parent:          app,
  backgroundColor: '#0b0e13',
  banner:          false,
  scene:           [MenuScene, GroundScene, WorldScene],
  scale: {
    mode:       Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width:      window.innerWidth,
    height:     window.innerHeight,
  },
});

// Handle for browser tests and debugging.
if (import.meta.env.DEV) (window as unknown as { game: Phaser.Game }).game = game;
