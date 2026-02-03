/**
 * @fileoverview Control real time music with a MIDI controller
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PlaybackState, Prompt } from './types';
import { GoogleGenAI, LiveMusicFilteredPrompt } from '@google/genai';
import { PromptDjMidi } from './components/PromptDjMidi';
import { ToastMessage } from './components/ToastMessage';
import { LiveMusicHelper } from './utils/LiveMusicHelper';
import { AudioAnalyser } from './utils/AudioAnalyser';

// Global references to allow initialization after loading
let ai: GoogleGenAI;
let liveMusicHelper: LiveMusicHelper;
let audioAnalyser: AudioAnalyser;
const model = 'models/lyria-realtime-exp';

// Main function now just sets up the UI and basic event listeners
function main() {
  const initialPrompts = buildInitialPrompts();

  const pdjMidi = new PromptDjMidi(initialPrompts);
  document.body.appendChild(pdjMidi);

  const toastMessage = new ToastMessage();
  document.body.appendChild(toastMessage);

  // Function to initialize the music engine with a provided API Key
  const initializeMusicEngine = (apiKey: string, prompts: Map<string, Prompt>) => {
    if (liveMusicHelper) return; // Already initialized

    console.log('Initializing Music Engine with API Key:', apiKey.slice(0, 5) + '...');

    try {
      ai = new GoogleGenAI({ apiKey, apiVersion: 'v1alpha' });
      liveMusicHelper = new LiveMusicHelper(ai, model);
      
      // Update prompts immediately
      liveMusicHelper.setWeightedPrompts(prompts);

      audioAnalyser = new AudioAnalyser(liveMusicHelper.audioContext);
      liveMusicHelper.extraDestination = audioAnalyser.node;

      // Re-attach event listeners that depend on liveMusicHelper
      liveMusicHelper.addEventListener('playback-state-changed', ((e: Event) => {
        const customEvent = e as CustomEvent<PlaybackState>;
        const playbackState = customEvent.detail;
        pdjMidi.playbackState = playbackState;
        playbackState === 'playing' ? audioAnalyser.start() : audioAnalyser.stop();
        
        // Send state back to Native UI
        window.postMessage(JSON.stringify({
          type: 'PLAYBACK_STATE',
          state: playbackState
        }), '*');
      }));

      liveMusicHelper.addEventListener('filtered-prompt', ((e: Event) => {
        const customEvent = e as CustomEvent<LiveMusicFilteredPrompt>;
        const filteredPrompt = customEvent.detail;
        toastMessage.show(filteredPrompt.filteredReason!)
        pdjMidi.addFilteredPrompt(filteredPrompt.text!);
      }));

      liveMusicHelper.addEventListener('error', ((e: Event) => {
        const customEvent = e as CustomEvent<string>;
        const error = customEvent.detail;
        toastMessage.show(error);
      }));

      audioAnalyser.addEventListener('audio-level-changed', ((e: Event) => {
        const customEvent = e as CustomEvent<number>;
        const level = customEvent.detail;
        pdjMidi.audioLevel = level;
      }));

      // Auto-start playback
      liveMusicHelper.play();
      toastMessage.show('Engine initialized and playing...');

    } catch (e: any) {
      toastMessage.show('Failed to initialize engine: ' + e.message);
    }
  };

  // UI Event Listeners
  pdjMidi.addEventListener('prompts-changed', ((e: Event) => {
    const customEvent = e as CustomEvent<Map<string, Prompt>>;
    const prompts = customEvent.detail;
    if (liveMusicHelper) {
      liveMusicHelper.setWeightedPrompts(prompts);
    }
  }));

  pdjMidi.addEventListener('play-pause', () => {
    if (liveMusicHelper) {
      liveMusicHelper.playPause();
    }
  });

  pdjMidi.addEventListener('error', ((e: Event) => {
    const customEvent = e as CustomEvent<string>;
    const error = customEvent.detail;
    toastMessage.show(error);
  }));

  // Listen for messages from React Native WebView
  // @ts-ignore
  window.addEventListener('message', (event) => {
    try {
      const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      
      if (message.type === 'SET_CONFIG' && message.data) {
        const { apiKey, prompts } = message.data;
        
        if (prompts && Array.isArray(prompts)) {
          const newPrompts = new Map<string, Prompt>();
          prompts.forEach((p: any) => {
            if (p.promptId && p.text) {
               newPrompts.set(p.promptId, p);
            }
          });
          
          // Update UI
          pdjMidi.prompts = newPrompts;

          // Initialize Engine if API Key is provided
          if (apiKey) {
            initializeMusicEngine(apiKey, newPrompts);
          } else if (liveMusicHelper) {
            // Just update prompts if engine already exists
            liveMusicHelper.setWeightedPrompts(newPrompts);
          }
        }
      }
    } catch (e) {
      console.error('Failed to process message from RN', e);
    }
  });

  // Listen for control events from Native
  // @ts-ignore
  document.querySelector('prompt-dj-midi')?.addEventListener('play-pause', () => {
    if (liveMusicHelper) {
      liveMusicHelper.playPause();
    }
  });
}

function buildInitialPrompts() {
  // Pick 3 random prompts to start at weight = 1
  const startOn = [...DEFAULT_PROMPTS]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const prompts = new Map<string, Prompt>();

  for (let i = 0; i < DEFAULT_PROMPTS.length; i++) {
    const promptId = `prompt-${i}`;
    const prompt = DEFAULT_PROMPTS[i];
    const { text, color } = prompt;
    prompts.set(promptId, {
      promptId,
      text,
      weight: startOn.includes(prompt) ? 1 : 0,
      cc: i,
      color,
    });
  }

  return prompts;
}

const DEFAULT_PROMPTS = [
  { color: '#9900ff', text: 'Bossa Nova' },
  { color: '#5200ff', text: 'Chillwave' },
  { color: '#ff25f6', text: 'Drum and Bass' },
  { color: '#2af6de', text: 'Post Punk' },
  { color: '#ffdd28', text: 'Shoegaze' },
  { color: '#2af6de', text: 'Funk' },
  { color: '#9900ff', text: 'Chiptune' },
  { color: '#3dffab', text: 'Lush Strings' },
  { color: '#d8ff3e', text: 'Sparkling Arpeggios' },
  { color: '#d9b2ff', text: 'Staccato Rhythms' },
  { color: '#3dffab', text: 'Punchy Kick' },
  { color: '#ffdd28', text: 'Dubstep' },
  { color: '#ff25f6', text: 'K Pop' },
  { color: '#d8ff3e', text: 'Neo Soul' },
  { color: '#5200ff', text: 'Trip Hop' },
  { color: '#d9b2ff', text: 'Thrash' },
];

main();
