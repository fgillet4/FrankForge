// frontend/src/lib/soundManager.ts
import { writable } from 'svelte/store';
import { AssetType } from './assetManager';

// Sound categories
export enum SoundCategory {
  MUSIC = 'music',
  AMBIENCE = 'ambience',
  SFX = 'sfx',
  UI = 'ui',
  VOICE = 'voice'
}

// Sound states
export interface SoundState {
  isMuted: boolean;
  masterVolume: number; // 0-1
  categoryVolumes: Record<SoundCategory, number>; // 0-1 for each category
  currentMusic?: string; // ID of current music track
  currentAmbience?: string; // ID of current ambient sound
}

// Create a store for sound state
export const soundState = writable<SoundState>({
  isMuted: false,
  masterVolume: 0.8,
  categoryVolumes: {
    [SoundCategory.MUSIC]: 0.7,
    [SoundCategory.AMBIENCE]: 0.5,
    [SoundCategory.SFX]: 1.0,
    [SoundCategory.UI]: 0.8,
    [SoundCategory.VOICE]: 1.0
  }
});

// Audio elements cache
const audioElements = new Map<string, HTMLAudioElement>();
const playingSounds = new Map<string, { element: HTMLAudioElement, category: SoundCategory }>();

// Active audio context
let audioContext: AudioContext;
let masterGainNode: GainNode;
const categoryGainNodes = new Map<SoundCategory, GainNode>();

// Initialize the sound system
export function initSoundSystem(): void {
  // Create audio context
  audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Set up master volume
  masterGainNode = audioContext.createGain();
  masterGainNode.gain.value = 0.8; // Default volume
  masterGainNode.connect(audioContext.destination);
  
  // Create gain nodes for each category
  Object.values(SoundCategory).forEach(category => {
    const gain = audioContext.createGain();
    gain.connect(masterGainNode);
    categoryGainNodes.set(category, gain);
  });
  
  // Subscribe to store changes to update volumes
  soundState.subscribe(state => {
    // Update master volume
    if (masterGainNode) {
      masterGainNode.gain.value = state.isMuted ? 0 : state.masterVolume;
    }
    
    // Update category volumes
    Object.entries(state.categoryVolumes).forEach(([category, volume]) => {
      const gainNode = categoryGainNodes.get(category as SoundCategory);
      if (gainNode) {
        gainNode.gain.value = volume;
      }
    });
  });
  
  console.log('Sound system initialized');
}

// Preload an audio asset
export async function preloadSound(id: string, path: string, category: SoundCategory): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.src = path;
    
    audio.addEventListener('canplaythrough', () => {
      audioElements.set(id, audio);
      resolve();
    }, { once: true });
    
    audio.addEventListener('error', () => {
      reject(new Error(`Failed to load audio: ${path}`));
    }, { once: true });
    
    audio.load();
  });
}

// Play a sound with various options
export function playSound(
  id: string, 
  category: SoundCategory,
  options: {
    volume?: number,
    loop?: boolean,
    fadeIn?: number,
    fadeOut?: number,
    playbackRate?: number,
    onEnd?: () => void
  } = {}
): { id: string, stop: () => void } {
  // Get audio element
  let audio = audioElements.get(id);
  if (!audio) {
    console.error(`Sound not found: ${id}`);
    return null;
  }
  
  // Clone the audio to allow multiple instances
  audio = audio.cloneNode() as HTMLAudioElement;
  
  // Create a unique ID for this playback instance
  const playbackId = `${id}_${Date.now()}`;
  
  // Set options
  if (options.volume !== undefined) audio.volume = options.volume;
  if (options.loop !== undefined) audio.loop = options.loop;
  if (options.playbackRate !== undefined) audio.playbackRate = options.playbackRate;
  
  // Apply category and master volume
  soundState.subscribe(state => {
    if (!audio) return;
    
    const categoryVolume = state.categoryVolumes[category] || 1;
    const masterVolume = state.isMuted ? 0 : state.masterVolume;
    const baseVolume = options.volume !== undefined ? options.volume : 1;
    
    audio.volume = baseVolume * categoryVolume * masterVolume;
  });
  
  // Handle fade in
  if (options.fadeIn && options.fadeIn > 0) {
    audio.volume = 0;
    let startTime = Date.now();
    const fadeInInterval = setInterval(() => {
      if (!audio) {
        clearInterval(fadeInInterval);
        return;
      }
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (options.fadeIn * 1000), 1);
      
      // Get current volume settings from store
      const state = get(soundState);
      const categoryVolume = state.categoryVolumes[category] || 1;
      const masterVolume = state.isMuted ? 0 : state.masterVolume;
      const baseVolume = options.volume !== undefined ? options.volume : 1;
      
      audio.volume = progress * baseVolume * categoryVolume * masterVolume;
      
      if (progress >= 1) {
        clearInterval(fadeInInterval);
      }
    }, 50);
  }
  
  // Register end handler
  if (options.onEnd) {
    audio.addEventListener('ended', options.onEnd, { once: true });
  }
  
  // Track this sound in playing sounds
  playingSounds.set(playbackId, { element: audio, category });
  
  // Start playback
  audio.play().catch(err => {
    console.error('Error playing sound:', err);
  });
  
  // Return control object
  return {
    id: playbackId,
    stop: () => stopSound(playbackId, options.fadeOut)
  };
}

// Stop a playing sound
function stopSound(playbackId: string, fadeOut?: number): void {
  const sound = playingSounds.get(playbackId);
  if (!sound) return;
  
  const { element: audio } = sound;
  
  if (fadeOut && fadeOut > 0) {
    // Fade out
    const startVolume = audio.volume;
    const startTime = Date.now();
    
    const fadeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (fadeOut * 1000), 1);
      
      audio.volume = startVolume * (1 - progress);
      
      if (progress >= 1) {
        clearInterval(fadeInterval);
        audio.pause();
        audio.currentTime = 0;
        playingSounds.delete(playbackId);
      }
    }, 50);
  } else {
    // Stop immediately
    audio.pause();
    audio.currentTime = 0;
    playingSounds.delete(playbackId);
  }
}

// Play music track (only one can play at a time)
export function playMusic(
  id: string,
  options: {
    volume?: number,
    fadeIn?: number,
    fadeOut?: number,
    crossFade?: boolean
  } = {}
): void {
  // Get current state
  const state = get(soundState);
  
  // If the requested track is already playing, do nothing
  if (state.currentMusic === id) return;
  
  // Stop current music if any
  if (state.currentMusic) {
    // Use crossfade if specified
    const fadeOut = options.crossFade ? (options.fadeOut || 2) : (options.fadeOut || 0);
    stopMusic({ fadeOut });
  }
  
  // Play the new track
  const musicControl = playSound(id, SoundCategory.MUSIC, {
    loop: true,
    volume: options.volume || 1,
    fadeIn: options.fadeIn || 2
  });
  
  // Update current music in state
  if (musicControl) {
    soundState.update(state => ({
      ...state,
      currentMusic: id
    }));
  }
}

// Stop current music
export function stopMusic(options: { fadeOut?: number } = {}): void {
  // Get current state
  const state = get(soundState);
  
  // Find all playing sounds in the MUSIC category
  for (const [id, sound] of playingSounds.entries()) {
    if (sound.category === SoundCategory.MUSIC) {
      stopSound(id, options.fadeOut);
    }
  }
  
  // Update state
  soundState.update(state => ({
    ...state,
    currentMusic: undefined
  }));
}

// Play ambient sound
export function playAmbience(
  id: string,
  options: {
    volume?: number,
    fadeIn?: number,
    fadeOut?: number,
    crossFade?: boolean
  } = {}
): void {
  // Get current state
  const state = get(soundState);
  
  // If the requested ambience is already playing, do nothing
  if (state.currentAmbience === id) return;
  
  // Stop current ambience if any
  if (state.currentAmbience) {
    // Use crossfade if specified
    const fadeOut = options.crossFade ? (options.fadeOut || 2) : (options.fadeOut || 0);
    stopAmbience({ fadeOut });
  }
  
  // Play the new ambience
  const ambienceControl = playSound(id, SoundCategory.AMBIENCE, {
    loop: true,
    volume: options.volume || 1,
    fadeIn: options.fadeIn || 2
  });
  
  // Update current ambience in state
  if (ambienceControl) {
    soundState.update(state => ({
      ...state,
      currentAmbience: id
    }));
  }
}

// Stop current ambience
export function stopAmbience(options: { fadeOut?: number } = {}): void {
  // Get current state
  const state = get(soundState);
  
  // Find all playing sounds in the AMBIENCE category
  for (const [id, sound] of playingSounds.entries()) {
    if (sound.category === SoundCategory.AMBIENCE) {
      stopSound(id, options.fadeOut);
    }
  }
  
  // Update state
  soundState.update(state => ({
    ...state,
    currentAmbience: undefined
  }));
}

// Toggle mute state
export function toggleMute(): void {
  soundState.update(state => ({
    ...state,
    isMuted: !state.isMuted
  }));
}

// Set master volume
export function setMasterVolume(volume: number): void {
  soundState.update(state => ({
    ...state,
    masterVolume: Math.max(0, Math.min(1, volume))
  }));
}

// Set category volume
export function setCategoryVolume(category: SoundCategory, volume: number): void {
  soundState.update(state => ({
    ...state,
    categoryVolumes: {
      ...state.categoryVolumes,
      [category]: Math.max(0, Math.min(1, volume))
    }
  }));
}

// Resume audio context (needed for browsers that suspend it until user interaction)
export function resumeAudioContext(): void {
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

// Helper function to get store value synchronously
function get<T>(store: { subscribe: (callback: (value: T) => void) => void }): T {
  let value: T;
  const unsubscribe = store.subscribe((v: T) => {
    value = v;
  });
  unsubscribe();
  return value;
}