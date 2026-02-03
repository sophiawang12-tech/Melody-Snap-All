/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import type { PlaybackState, Prompt } from '../types';
import type { AudioChunk, GoogleGenAI, LiveMusicFilteredPrompt, LiveMusicServerMessage, LiveMusicSession } from '@google/genai';
import { decode, decodeAudioData } from './audio';
import { throttle } from './throttle';

export class LiveMusicHelper extends EventTarget {

  private ai: GoogleGenAI;
  private model: string;

  private session: LiveMusicSession | null = null;
  private sessionPromise: Promise<LiveMusicSession> | null = null;

  private connectionError = true;

  private filteredPrompts = new Set<string>();
  private nextStartTime = 0;
  private bufferTime = 2;

  public readonly audioContext: AudioContext;
  public extraDestination: AudioNode | null = null;

  private outputNode: GainNode;
  private playbackState: PlaybackState = 'stopped';
  private mockMode = true; // Enable Mock Mode
  private mockSourceNode: AudioBufferSourceNode | null = null;
  private mockBuffer: AudioBuffer | null = null;
  private mockAudioUrl = 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3'; // Lofi Study

  private prompts: Map<string, Prompt>;

  constructor(ai: GoogleGenAI, model: string) {
    super();
    this.ai = ai;
    this.model = model;
    this.prompts = new Map();
    this.audioContext = new AudioContext({ sampleRate: 44100 });
    this.outputNode = this.audioContext.createGain();
  }

  private getSession(): Promise<LiveMusicSession> {
    if (!this.sessionPromise) this.sessionPromise = this.connect();
    return this.sessionPromise;
  }

  private async connect(): Promise<LiveMusicSession> {
    if (this.mockMode) {
        console.log("Mock Mode: Simulating connection...");
        this.connectionError = false;
        // Return a mock session object
        return {
            play: () => console.log("Mock Session: play"),
            pause: () => console.log("Mock Session: pause"),
            stop: () => console.log("Mock Session: stop"),
            setWeightedPrompts: async () => console.log("Mock Session: setWeightedPrompts"),
            setMusicGenerationConfig: async () => console.log("Mock Session: setMusicGenerationConfig"),
        } as any as LiveMusicSession;
    }

    this.sessionPromise = this.ai.live.music.connect({
      model: this.model,
      callbacks: {
        onmessage: async (e: LiveMusicServerMessage) => {
          if (e.setupComplete) {
            this.connectionError = false;
          }
          if (e.filteredPrompt) {
            this.filteredPrompts = new Set([...this.filteredPrompts, e.filteredPrompt.text!])
            this.dispatchEvent(new CustomEvent<LiveMusicFilteredPrompt>('filtered-prompt', { detail: e.filteredPrompt }));
          }
          if (e.serverContent?.audioChunks) {
            await this.processAudioChunks(e.serverContent.audioChunks);
          }
        },
        onerror: () => {
          this.connectionError = true;
          this.stop();
          this.dispatchEvent(new CustomEvent('error', { detail: 'Connection error, please restart audio.' }));
        },
        onclose: () => {
          this.connectionError = true;
          this.stop();
          this.dispatchEvent(new CustomEvent('error', { detail: 'Connection error, please restart audio.' }));
        },
      },
    });
    return this.sessionPromise;
  }

  private setPlaybackState(state: PlaybackState) {
    this.playbackState = state;
    this.dispatchEvent(new CustomEvent('playback-state-changed', { detail: state }));
  }

  private async processAudioChunks(audioChunks: AudioChunk[]) {
    if (this.playbackState === 'paused' || this.playbackState === 'stopped') return;
    const audioBuffer = await decodeAudioData(
      decode(audioChunks[0].data!),
      this.audioContext,
      44100,
      2,
    );
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputNode);
    if (this.nextStartTime === 0) {
      this.nextStartTime = this.audioContext.currentTime + this.bufferTime;
      setTimeout(() => {
        this.setPlaybackState('playing');
      }, this.bufferTime * 1000);
    }
    if (this.nextStartTime < this.audioContext.currentTime) {
      this.setPlaybackState('loading');
      this.nextStartTime = 0;
      return;
    }
    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
  }

  public get activePrompts() {
    return Array.from(this.prompts.values())
      .filter((p) => {
        return !this.filteredPrompts.has(p.text) && p.weight !== 0;
      })
  }

  public readonly setWeightedPrompts = throttle(async (prompts: Map<string, Prompt>) => {
    this.prompts = prompts;

    if (this.activePrompts.length === 0) {
      this.dispatchEvent(new CustomEvent('error', { detail: 'There needs to be one active prompt to play.' }));
      this.pause();
      return;
    }

    // store the prompts to set later if we haven't connected yet
    // there should be a user interaction before calling setWeightedPrompts
    if (!this.session) return;

    const weightedPrompts = this.activePrompts.map((p) => {
      return {text: p.text, weight: p.weight};
    });
    try {
      await this.session.setWeightedPrompts({
        weightedPrompts,
      });
    } catch (e: any) {
      this.dispatchEvent(new CustomEvent('error', { detail: e.message }));
      this.pause();
    }
  }, 200);

  public async play() {
    this.setPlaybackState('loading');
    this.session = await this.getSession();
    
    // In Mock Mode, skip API calls and start local audio
    if (this.mockMode) {
        console.log("Mock Mode: Playing MP3...");
        this.audioContext.resume();
        
        try {
            if (!this.mockBuffer) {
                console.log("Loading MP3...");
                const response = await fetch(this.mockAudioUrl);
                const arrayBuffer = await response.arrayBuffer();
                this.mockBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                console.log("MP3 Loaded");
            }

            this.mockSourceNode = this.audioContext.createBufferSource();
            this.mockSourceNode.buffer = this.mockBuffer;
            this.mockSourceNode.loop = true; // Loop the music
            
            // Connect to output
            this.mockSourceNode.connect(this.outputNode);
            this.outputNode.connect(this.audioContext.destination);
            if (this.extraDestination) this.outputNode.connect(this.extraDestination);

            this.mockSourceNode.start();
            
            // Fade in
            this.outputNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            this.outputNode.gain.linearRampToValueAtTime(1.0, this.audioContext.currentTime + 2);
            
            this.setPlaybackState('playing');
        } catch (e) {
            console.error("Failed to play mock audio", e);
            this.dispatchEvent(new CustomEvent('error', { detail: 'Failed to play mock audio' }));
            this.setPlaybackState('stopped');
        }
        return;
    }

    await this.setWeightedPrompts(this.prompts);

    await this.session.setMusicGenerationConfig({
      musicGenerationConfig: {
        temperature: 1.0,
        // @ts-ignore: audioFormat may not be in the type definition yet, but is required by the API
        audioFormat: 'pcm16',
        sampleRateHz: 44100,
      },
    });

    this.audioContext.resume();
    this.session.play();
    this.outputNode.connect(this.audioContext.destination);
    if (this.extraDestination) this.outputNode.connect(this.extraDestination);
    this.outputNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.outputNode.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + 0.1);
  }

  public pause() {
    if (this.mockMode) {
        if (this.mockSourceNode) {
            this.outputNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);
            setTimeout(() => {
                this.mockSourceNode?.stop();
                this.mockSourceNode?.disconnect();
                this.mockSourceNode = null;
            }, 500);
        }
        this.setPlaybackState('paused');
        return;
    }

    if (this.session) this.session.pause();
    this.setPlaybackState('paused');
    this.outputNode.gain.setValueAtTime(1, this.audioContext.currentTime);
    this.outputNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
    this.nextStartTime = 0;
    this.outputNode = this.audioContext.createGain();
  }

  public stop() {
    if (this.mockMode) {
        if (this.mockSourceNode) {
            this.mockSourceNode.stop();
            this.mockSourceNode.disconnect();
            this.mockSourceNode = null;
        }
        this.setPlaybackState('stopped');
        this.session = null;
        this.sessionPromise = null;
        return;
    }

    if (this.session) this.session.stop();
    this.setPlaybackState('stopped');
    this.outputNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.outputNode.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + 0.1);
    this.nextStartTime = 0;
    this.session = null;
    this.sessionPromise = null;
  }

  public async playPause() {
    switch (this.playbackState) {
      case 'playing':
        return this.pause();
      case 'paused':
      case 'stopped':
        return this.play();
      case 'loading':
        return this.stop();
    }
  }

}
