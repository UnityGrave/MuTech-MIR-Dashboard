/**
 * Test Oscillator module
 * Generates known frequencies for validating pitch detection accuracy
 */

export interface TestOscillatorSetup {
  oscillator: OscillatorNode;
  gainNode: GainNode;
  frequency: number;
}

/**
 * Create a test oscillator at a specified frequency
 * @param audioContext - AudioContext to use
 * @param frequency - Frequency in Hz (default 440)
 * @param gain - Volume level 0-1 (default 0.3)
 */
export function createTestOscillator(
  audioContext: AudioContext,
  frequency: number = 440,
  gain: number = 0.3
): TestOscillatorSetup {
  // Create oscillator
  const oscillator = audioContext.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;

  // Create gain node for volume control
  const gainNode = audioContext.createGain();
  gainNode.gain.value = gain;

  // Connect oscillator to gain
  oscillator.connect(gainNode);

  console.log(`🎹 Test oscillator created at ${frequency} Hz`);

  return {
    oscillator,
    gainNode,
    frequency,
  };
}

/**
 * Start the test oscillator and connect to destination
 * @param setup - TestOscillatorSetup from createTestOscillator
 * @param destination - AudioNode to connect to
 */
export function startTestOscillator(
  setup: TestOscillatorSetup,
  destination: AudioNode
): void {
  setup.gainNode.connect(destination);
  setup.oscillator.start();
  console.log(`▶️ Test oscillator started at ${setup.frequency} Hz`);
}

/**
 * Stop and disconnect the test oscillator
 * @param setup - TestOscillatorSetup to stop
 */
export function stopTestOscillator(setup: TestOscillatorSetup): void {
  try {
    setup.oscillator.stop();
    setup.oscillator.disconnect();
    setup.gainNode.disconnect();
    console.log('⏹️ Test oscillator stopped');
  } catch (error) {
    // Oscillator may already be stopped
    console.log('Test oscillator already stopped');
  }
}

/**
 * Change the frequency of a running oscillator
 * @param setup - TestOscillatorSetup to modify
 * @param frequency - New frequency in Hz
 */
export function setTestOscillatorFrequency(
  setup: TestOscillatorSetup,
  frequency: number
): void {
  setup.oscillator.frequency.value = frequency;
  setup.frequency = frequency;
  console.log(`🔄 Test oscillator frequency changed to ${frequency} Hz`);
}

/**
 * Preset test frequencies with musical note names
 */
export const TEST_FREQUENCIES = {
  A3: 220,
  A4: 440,
  A5: 880,
  C4: 261.63,
  E4: 329.63,
  G4: 392,
  B4: 493.88,
} as const;

export type TestFrequencyName = keyof typeof TEST_FREQUENCIES;

