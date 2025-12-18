/**
 * AudioContext setup module
 * Creates and configures the Web Audio API graph for pitch detection
 */

export interface AudioContextSetup {
  audioContext: AudioContext;
  sourceNode: MediaStreamAudioSourceNode;
  gainNode: GainNode;
  sampleRate: number;
}

/**
 * Create and configure AudioContext with the audio graph
 * @param stream - MediaStream from microphone
 * @returns AudioContext setup object
 */
export async function setupAudioContext(stream: MediaStream): Promise<AudioContextSetup> {
  // Create AudioContext (use default sample rate for best compatibility)
  const audioContext = new AudioContext();

  // Safari requires explicit resume inside user gesture
  if (audioContext.state === 'suspended') {
    console.log('⏸️ AudioContext suspended, resuming...');
    await audioContext.resume();
  }

  const sampleRate = audioContext.sampleRate;
  console.log(`🔊 AudioContext created with sample rate: ${sampleRate} Hz`);

  // Create source node from microphone stream
  const sourceNode = audioContext.createMediaStreamSource(stream);

  // Create gain node set to 0 (silent) to prevent feedback
  // Connected to destination to prevent garbage collection
  const gainNode = audioContext.createGain();
  gainNode.gain.value = 0;

  // Connect the basic graph: source -> gain -> destination
  // This keeps the graph alive without producing audio output
  sourceNode.connect(gainNode);
  gainNode.connect(audioContext.destination);

  console.log('🔗 Audio graph connected: Source → Gain(0) → Destination');

  return {
    audioContext,
    sourceNode,
    gainNode,
    sampleRate,
  };
}

/**
 * Close AudioContext and clean up resources
 * @param audioContext - AudioContext to close
 */
export async function closeAudioContext(audioContext: AudioContext): Promise<void> {
  if (audioContext.state !== 'closed') {
    await audioContext.close();
    console.log('🔇 AudioContext closed');
  }
}

/**
 * Resume AudioContext if suspended (Safari compatibility)
 * @param audioContext - AudioContext to resume
 */
export async function ensureAudioContextRunning(audioContext: AudioContext): Promise<void> {
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
    console.log('▶️ AudioContext resumed');
  }
}

/**
 * Get the current state of the AudioContext
 * @param audioContext - AudioContext to check
 */
export function getAudioContextState(audioContext: AudioContext): AudioContextState {
  return audioContext.state;
}

