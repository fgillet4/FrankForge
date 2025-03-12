// frontend/src/lib/assetManager.ts
import { writable } from 'svelte/store';

// Define asset types
export enum AssetType {
  SOUND_EFFECT = 'sound_effect',
  MUSIC = 'music',
  AMBIENCE = 'ambience',
  FOLEY = 'foley',
  SPRITE = 'sprite',
  TILESET = 'tileset',
  ANIMATION = 'animation',
  BUILDING = 'building',
  CHARACTER = 'character',
  TERRAIN = 'terrain',
  DECORATION = 'decoration',
  UI = 'ui'
}

// Asset metadata
export interface AssetMetadata {
  id: string;
  type: AssetType;
  path: string;
  name: string;
  description?: string;
  tags?: string[];
  frameCount?: number;     // For animations
  frameRate?: number;      // For animations
  loop?: boolean;          // For audio/animations
  volume?: number;         // For audio
  dimensions?: {           // For images
    width: number;
    height: number;
  };
  variants?: string[];     // For sprites with variations
  author?: string;         // Credit information
  license?: string;        // License information
}

// Audio related assets
export interface AudioAsset extends AssetMetadata {
  type: AssetType.SOUND_EFFECT | AssetType.MUSIC | AssetType.AMBIENCE | AssetType.FOLEY;
  duration: number;
  fadeDuration?: number;
}

// Visual assets
export interface SpriteAsset extends AssetMetadata {
  type: AssetType.SPRITE | AssetType.BUILDING | AssetType.CHARACTER | AssetType.DECORATION | AssetType.UI;
  frames?: {               // For multi-frame sprites
    columns: number;
    rows: number;
    frameWidth: number;
    frameHeight: number;
  };
}

// Tileset assets
export interface TilesetAsset extends AssetMetadata {
  type: AssetType.TILESET | AssetType.TERRAIN;
  tileWidth: number;
  tileHeight: number;
  columns: number;
  rows: number;
  terrainTypes?: string[]; // Different terrain types in the tileset
  tileProperties?: Record<number, any>; // Properties for specific tiles (collision, etc.)
}

// Track loaded assets
export const loadedAssets = writable<Map<string, AssetMetadata>>(new Map());

// Audio elements cache
const audioCache = new Map<string, HTMLAudioElement>();

// Image elements cache
const imageCache = new Map<string, HTMLImageElement>();

// Asset loader functions
export async function loadImage(asset: SpriteAsset | TilesetAsset): Promise<HTMLImageElement> {
  // Check if already cached
  if (imageCache.has(asset.id)) {
    return imageCache.get(asset.id);
  }
  
  // Load the image
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(asset.id, img);
      loadedAssets.update(assets => {
        assets.set(asset.id, asset);
        return assets;
      });
      resolve(img);
    };
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${asset.path}`));
    };
    img.src = asset.path;
  });
}

export async function loadAudio(asset: AudioAsset): Promise<HTMLAudioElement> {
  // Check if already cached
  if (audioCache.has(asset.id)) {
    return audioCache.get(asset.id);
  }
  
  // Load the audio
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.oncanplaythrough = () => {
      audioCache.set(asset.id, audio);
      loadedAssets.update(assets => {
        assets.set(asset.id, asset);
        return assets;
      });
      resolve(audio);
    };
    audio.onerror = () => {
      reject(new Error(`Failed to load audio: ${asset.path}`));
    };
    audio.src = asset.path;
    audio.load();
  });
}

// Play audio with various options
export function playAudio(
  assetId: string, 
  options: { 
    volume?: number, 
    loop?: boolean, 
    fadeIn?: number, 
    fadeOut?: number,
    onEnd?: () => void
  } = {}
): { audio: HTMLAudioElement, stop: () => void } {
  const audio = audioCache.get(assetId);
  if (!audio) {
    console.error(`Audio asset not loaded: ${assetId}`);
    return null;
  }
  
  // Clone the audio to allow multiple concurrent playback
  const audioInstance = audio.cloneNode() as HTMLAudioElement;
  
  // Apply options
  if (options.volume !== undefined) audioInstance.volume = options.volume;
  if (options.loop !== undefined) audioInstance.loop = options.loop;
  
  // Handle fade in
  if (options.fadeIn && options.fadeIn > 0) {
    audioInstance.volume = 0;
    let startTime = Date.now();
    const fadeInInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (options.fadeIn * 1000), 1);
      audioInstance.volume = progress * (options.volume || 1);
      
      if (progress >= 1) {
        clearInterval(fadeInInterval);
      }
    }, 50);
  }
  
  // Handle fade out and end
  if (options.onEnd || (options.fadeOut && options.fadeOut > 0)) {
    audioInstance.addEventListener('timeupdate', () => {
      const timeLeft = audioInstance.duration - audioInstance.currentTime;
      
      // Start fade out when approaching the end
      if (options.fadeOut && timeLeft <= options.fadeOut) {
        audioInstance.volume = (timeLeft / options.fadeOut) * (options.volume || 1);
      }
    });
    
    audioInstance.addEventListener('ended', () => {
      if (options.onEnd) options.onEnd();
    });
  }
  
  // Start playing
  audioInstance.play();
  
  // Return control object
  return {
    audio: audioInstance,
    stop: () => {
      if (options.fadeOut && options.fadeOut > 0) {
        // Start fade out
        let startVolume = audioInstance.volume;
        let startTime = Date.now();
        const fadeOutInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / (options.fadeOut * 1000), 1);
          audioInstance.volume = startVolume * (1 - progress);
          
          if (progress >= 1) {
            clearInterval(fadeOutInterval);
            audioInstance.pause();
            audioInstance.currentTime = 0;
          }
        }, 50);
      } else {
        // Stop immediately
        audioInstance.pause();
        audioInstance.currentTime = 0;
      }
    }
  };
}

// Preload commonly used assets
export async function preloadAssets(assetList: AssetMetadata[]): Promise<void> {
  const promises = assetList.map(asset => {
    if (
      asset.type === AssetType.SOUND_EFFECT || 
      asset.type === AssetType.MUSIC || 
      asset.type === AssetType.AMBIENCE ||
      asset.type === AssetType.FOLEY
    ) {
      return loadAudio(asset as AudioAsset);
    } else {
      return loadImage(asset as SpriteAsset | TilesetAsset);
    }
  });
  
  await Promise.all(promises);
  console.log(`Preloaded ${assetList.length} assets`);
}

// Define core assets for the game
export const CORE_ASSETS = {
  // Music
  MENU_MUSIC: {
    id: 'menu_music',
    type: AssetType.MUSIC,
    path: 'assets/audio/music/menu_theme.mp3',
    name: 'Menu Theme',
    loop: true,
    duration: 120,
    volume: 0.7
  } as AudioAsset,
  
  GAME_MUSIC: {
    id: 'game_music',
    type: AssetType.MUSIC,
    path: 'assets/audio/music/game_theme.mp3',
    name: 'Game Theme',
    loop: true,
    duration: 180,
    volume: 0.5
  } as AudioAsset,
  
  // Sound effects
  BUILD_SOUND: {
    id: 'build_sound',
    type: AssetType.SOUND_EFFECT,
    path: 'assets/audio/sfx/build.mp3',
    name: 'Building Placement',
    duration: 1.5,
    volume: 0.8
  } as AudioAsset,
  
  EXTRACT_SOUND: {
    id: 'extract_sound',
    type: AssetType.SOUND_EFFECT,
    path: 'assets/audio/sfx/extract.mp3',
    name: 'Resource Extraction',
    duration: 2.0,
    volume: 0.6,
    loop: true
  } as AudioAsset,
  
  // Ambient sounds
  WIND_AMBIENT: {
    id: 'wind_ambient',
    type: AssetType.AMBIENCE,
    path: 'assets/audio/ambience/wind.mp3',
    name: 'Wind Ambience',
    duration: 60,
    loop: true,
    volume: 0.3
  } as AudioAsset,
  
  // Building sprites
  EXTRACTOR_SPRITE: {
    id: 'extractor_sprite',
    type: AssetType.BUILDING,
    path: 'assets/sprites/buildings/extractor.png',
    name: 'Resource Extractor',
    dimensions: { width: 64, height: 64 },
    frames: {
      columns: 4,
      rows: 1,
      frameWidth: 64,
      frameHeight: 64
    }
  } as SpriteAsset,
  
  REACTOR_SPRITE: {
    id: 'reactor_sprite',
    type: AssetType.BUILDING,
    path: 'assets/sprites/buildings/reactor.png',
    name: 'Chemical Reactor',
    dimensions: { width: 64, height: 64 },
    frames: {
      columns: 4,
      rows: 1,
      frameWidth: 64,
      frameHeight: 64
    }
  } as SpriteAsset,
  
  POWER_PLANT_SPRITE: {
    id: 'power_plant_sprite',
    type: AssetType.BUILDING,
    path: 'assets/sprites/buildings/power_plant.png',
    name: 'Power Plant',
    dimensions: { width: 64, height: 64 },
    frames: {
      columns: 4,
      rows: 1,
      frameWidth: 64,
      frameHeight: 64
    }
  } as SpriteAsset,
  
  // Terrain tilesets
  TERRAIN_TILESET: {
    id: 'terrain_tileset',
    type: AssetType.TILESET,
    path: 'assets/sprites/terrain/terrain_tileset.png',
    name: 'Main Terrain Tileset',
    tileWidth: 32,
    tileHeight: 32,
    columns: 16,
    rows: 16,
    terrainTypes: ['grass', 'dirt', 'stone', 'water', 'lava', 'ice'],
    tileProperties: {
      // Properties for specific tile indexes
      0: { type: 'grass', passable: true },
      16: { type: 'dirt', passable: true },
      32: { type: 'stone', passable: true },
      48: { type: 'water', passable: false },
      64: { type: 'lava', passable: false, damage: 10 },
      80: { type: 'ice', passable: true, slippery: true }
    }
  } as TilesetAsset,
  
  // Add more assets as needed
};

// Audio context for advanced audio manipulation
let audioContext: AudioContext;

// Initialize the audio system
export function initAudioSystem(): void {
  // Create audio context
  audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Set up master volume
  const masterGain = audioContext.createGain();
  masterGain.gain.value = 1.0;
  masterGain.connect(audioContext.destination);
  
  console.log('Audio system initialized');
}

// Resume audio context when user interacts with the page
export function resumeAudio(): void {
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
}