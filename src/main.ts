/**
 * Main Application Entry Point
 * Orchestrates audio capture, pitch detection, and visualization
 */

import { getMicrophoneStream, stopMicrophoneStream } from './audio/microphone';
import { setupAudioContext, closeAudioContext } from './audio/audio-context';
import {
  createTestOscillator,
  startTestOscillator,
  stopTestOscillator,
  TestOscillatorSetup,
} from './audio/test-oscillator';
import { CircularBuffer } from './data/circular-buffer';
import { setupCanvas, startRenderLoop, stopRenderLoop } from './visualization/canvas';
import { renderPitchGraph } from './visualization/renderer';
import { frequencyToNote } from './utils/music-theory';

// Import processor as URL for AudioWorklet
import PitchProcessorUrl from './audio/pitch-processor.ts?worker&url';

// Application state
interface AppState {
  isRunning: boolean;
  isTestMode: boolean;
  audioContext: AudioContext | null;
  sourceNode: MediaStreamAudioSourceNode | null;
  workletNode: AudioWorkletNode | null;
  mediaStream: MediaStream | null;
  testOscillator: TestOscillatorSetup | null;
  pitchBuffer: CircularBuffer<number | null>;
  lastPitch: { frequency: number; clarity: number } | null;
}

const state: AppState = {
  isRunning: false,
  isTestMode: false,
  audioContext: null,
  sourceNode: null,
  workletNode: null,
  mediaStream: null,
  testOscillator: null,
  pitchBuffer: new CircularBuffer<number | null>(2000),
  lastPitch: null,
};

// DOM Elements
const startBtn = document.getElementById('start-btn') as HTMLButtonElement;
const testBtn = document.getElementById('test-btn') as HTMLButtonElement;
const testFrequencySelect = document.getElementById('test-frequency') as HTMLSelectElement;
const statusIndicator = document.getElementById('status') as HTMLDivElement;
const statusText = statusIndicator.querySelector('.status-text') as HTMLSpanElement;
const noteNameDisplay = document.getElementById('note-name') as HTMLSpanElement;
const centsDisplay = document.getElementById('cents-display') as HTMLSpanElement;
const frequencyDisplay = document.getElementById('frequency-display') as HTMLSpanElement;
const sampleRateDisplay = document.getElementById('sample-rate') as HTMLSpanElement;
const clarityDisplay = document.getElementById('clarity-display') as HTMLSpanElement;
const canvas = document.getElementById('pitch-canvas') as HTMLCanvasElement;

/**
 * Update status indicator UI
 */
function updateStatus(status: 'ready' | 'active' | 'error', message: string): void {
  statusIndicator.classList.remove('active', 'error');
  if (status === 'active') {
    statusIndicator.classList.add('active');
  } else if (status === 'error') {
    statusIndicator.classList.add('error');
  }
  statusText.textContent = message;
}

/**
 * Update pitch display UI
 */
function updatePitchDisplay(frequency: number | null, clarity: number | null): void {
  if (frequency === null || clarity === null) {
    noteNameDisplay.textContent = '---';
    centsDisplay.textContent = '+0¢';
    centsDisplay.className = 'cents-display';
    frequencyDisplay.textContent = '--- Hz';
    clarityDisplay.textContent = '---';
    return;
  }

  const { note, cents } = frequencyToNote(frequency);

  noteNameDisplay.textContent = note;
  frequencyDisplay.textContent = `${frequency.toFixed(1)} Hz`;
  clarityDisplay.textContent = clarity.toFixed(2);

  // Format cents with sign
  const centsStr = cents >= 0 ? `+${cents}¢` : `${cents}¢`;
  centsDisplay.textContent = centsStr;

  // Color code cents display
  centsDisplay.className = 'cents-display';
  if (Math.abs(cents) <= 5) {
    centsDisplay.classList.add('in-tune');
  } else if (cents > 0) {
    centsDisplay.classList.add('sharp');
  } else {
    centsDisplay.classList.add('flat');
  }
}

/**
 * Handle pitch data from AudioWorklet
 */
function handlePitchMessage(event: MessageEvent): void {
  const data = event.data;

  if (data.type === 'ready') {
    console.log('✅ Pitch processor ready');
    return;
  }

  if (data.type === 'pitch') {
    const { frequency, clarity } = data;
    state.lastPitch = { frequency, clarity };
    state.pitchBuffer.push(frequency);
    updatePitchDisplay(frequency, clarity);
  }
}

/**
 * Initialize audio pipeline
 */
async function initAudio(): Promise<void> {
  try {
    updateStatus('active', 'Requesting microphone...');

    // Get microphone stream
    const { stream } = await getMicrophoneStream();
    state.mediaStream = stream;

    // Set up AudioContext
    const audioSetup = await setupAudioContext(stream);
    state.audioContext = audioSetup.audioContext;
    state.sourceNode = audioSetup.sourceNode;

    // Update sample rate display
    sampleRateDisplay.textContent = `${audioSetup.sampleRate} Hz`;

    // Load AudioWorklet module
    updateStatus('active', 'Loading pitch processor...');
    await state.audioContext.audioWorklet.addModule(PitchProcessorUrl);
    console.log('✅ AudioWorklet module loaded');

    // Create AudioWorklet node
    state.workletNode = new AudioWorkletNode(state.audioContext, 'pitch-processor', {
      processorOptions: {
        sampleRate: audioSetup.sampleRate,
      },
    });

    // Set up message handler
    state.workletNode.port.onmessage = handlePitchMessage;

    // Connect source to worklet
    state.sourceNode.connect(state.workletNode);

    // Connect worklet to destination (required to keep processing)
    // Using the existing gain node at 0 volume
    state.workletNode.connect(audioSetup.gainNode);

    state.isRunning = true;
    updateStatus('active', 'Microphone Active');

    // Enable test button
    testBtn.disabled = false;
    testFrequencySelect.disabled = false;

    // Start render loop
    const ctx = setupCanvas(canvas);
    startRenderLoop(() => {
      renderPitchGraph(ctx, canvas, state.pitchBuffer.getAll());
    });

    console.log('🎤 Audio pipeline initialized');
  } catch (error) {
    console.error('Failed to initialize audio:', error);
    updateStatus('error', error instanceof Error ? error.message : 'Unknown error');
    await cleanup();
  }
}

/**
 * Clean up audio resources
 */
async function cleanup(): Promise<void> {
  // Stop render loop
  stopRenderLoop();

  // Stop test oscillator if running
  if (state.testOscillator) {
    stopTestOscillator(state.testOscillator);
    state.testOscillator = null;
    state.isTestMode = false;
    testBtn.classList.remove('active');
    testBtn.innerHTML = '<span class="btn-icon">♪</span>Test Tone';
  }

  // Disconnect worklet
  if (state.workletNode) {
    state.workletNode.disconnect();
    state.workletNode.port.onmessage = null;
    state.workletNode = null;
  }

  // Disconnect source
  if (state.sourceNode) {
    state.sourceNode.disconnect();
    state.sourceNode = null;
  }

  // Close AudioContext
  if (state.audioContext) {
    await closeAudioContext(state.audioContext);
    state.audioContext = null;
  }

  // Stop microphone
  if (state.mediaStream) {
    stopMicrophoneStream(state.mediaStream);
    state.mediaStream = null;
  }

  state.isRunning = false;
  testBtn.disabled = true;
  testFrequencySelect.disabled = true;
  updatePitchDisplay(null, null);
  updateStatus('ready', 'Ready');

  console.log('🧹 Audio resources cleaned up');
}

/**
 * Toggle test oscillator
 */
function toggleTestOscillator(): void {
  if (!state.audioContext || !state.workletNode) {
    console.warn('Audio context not initialized');
    return;
  }

  if (state.isTestMode && state.testOscillator) {
    // Stop test oscillator
    stopTestOscillator(state.testOscillator);
    state.testOscillator = null;
    state.isTestMode = false;
    testBtn.classList.remove('active');
    testBtn.innerHTML = '<span class="btn-icon">♪</span>Test Tone';

    // Reconnect microphone
    if (state.sourceNode) {
      state.sourceNode.connect(state.workletNode);
    }
  } else {
    // Disconnect microphone
    if (state.sourceNode) {
      state.sourceNode.disconnect(state.workletNode);
    }

    // Start test oscillator
    const frequency = parseInt(testFrequencySelect.value, 10);
    state.testOscillator = createTestOscillator(state.audioContext, frequency, 0.5);
    startTestOscillator(state.testOscillator, state.workletNode);

    state.isTestMode = true;
    testBtn.classList.add('active');
    testBtn.innerHTML = '<span class="btn-icon">⏹</span>Stop Test';
  }
}

/**
 * Handle test frequency change
 */
function handleFrequencyChange(): void {
  if (state.isTestMode && state.testOscillator) {
    const frequency = parseInt(testFrequencySelect.value, 10);
    state.testOscillator.oscillator.frequency.value = frequency;
    console.log(`🔄 Test frequency changed to ${frequency} Hz`);
  }
}

/**
 * Toggle start/stop
 */
async function toggleAudio(): Promise<void> {
  if (state.isRunning) {
    await cleanup();
    startBtn.classList.remove('active');
    startBtn.innerHTML = '<span class="btn-icon">▶</span>Start';
  } else {
    startBtn.classList.add('active');
    startBtn.innerHTML = '<span class="btn-icon">⏹</span>Stop';
    await initAudio();
  }
}

// Event listeners
startBtn.addEventListener('click', toggleAudio);
testBtn.addEventListener('click', toggleTestOscillator);
testFrequencySelect.addEventListener('change', handleFrequencyChange);

// Handle page visibility changes
document.addEventListener('visibilitychange', async () => {
  if (document.hidden && state.isRunning) {
    console.log('📱 Page hidden, audio continues in background');
  }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (state.isRunning) {
    cleanup();
  }
});

// Initial state
updateStatus('ready', 'Ready');
console.log('🎵 Pitch Visualizer loaded');

