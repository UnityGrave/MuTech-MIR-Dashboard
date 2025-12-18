/**
 * AudioWorklet Processor for Pitch Detection
 * Runs on the audio thread, accumulates samples, and performs pitch detection
 */

import { PitchDetector } from 'pitchy';

// Message types for communication with main thread
interface PitchMessage {
  type: 'pitch';
  frequency: number;
  clarity: number;
  timestamp: number;
}

interface ReadyMessage {
  type: 'ready';
}

type WorkerMessage = PitchMessage | ReadyMessage;

// Processor configuration
const BUFFER_SIZE = 2048; // Samples needed for pitch detection
const HOP_SIZE = 512; // Samples between detections (~86 Hz update rate at 44.1kHz)
const MIN_CLARITY = 0.7; // Minimum clarity threshold to send pitch data

class PitchProcessor extends AudioWorkletProcessor {
  private buffer: Float32Array;
  private writeIndex: number = 0;
  private samplesAccumulated: number = 0;
  private detector: PitchDetector<Float32Array>;
  private sampleRate: number;
  private lastMessageTime: number = 0;
  private minMessageInterval: number; // Minimum ms between messages

  constructor(options?: AudioWorkletNodeOptions) {
    super();

    // Get sample rate from processor options
    this.sampleRate = options?.processorOptions?.sampleRate ?? 44100;
    this.minMessageInterval = 1000 / 60; // ~60 Hz max message rate

    // Pre-allocate ring buffer (no allocations in process())
    this.buffer = new Float32Array(BUFFER_SIZE);

    // Initialize pitch detector from Pitchy
    this.detector = PitchDetector.forFloat32Array(BUFFER_SIZE);

    console.log(`🎵 PitchProcessor initialized (sample rate: ${this.sampleRate} Hz)`);

    // Notify main thread that processor is ready
    this.port.postMessage({ type: 'ready' } as ReadyMessage);
  }

  /**
   * Process audio samples - called ~344 times/second at 44.1kHz (128 samples each)
   */
  process(
    inputs: Float32Array[][],
    _outputs: Float32Array[][],
    _parameters: Record<string, Float32Array>
  ): boolean {
    const input = inputs[0];

    // Check if we have input data
    if (!input || input.length === 0) {
      return true; // Keep processor alive
    }

    const samples = input[0]; // First channel (mono)
    if (!samples || samples.length === 0) {
      return true;
    }

    // Accumulate samples into ring buffer
    for (let i = 0; i < samples.length; i++) {
      this.buffer[this.writeIndex] = samples[i];
      this.writeIndex = (this.writeIndex + 1) % BUFFER_SIZE;
      this.samplesAccumulated++;
    }

    // Run pitch detection every HOP_SIZE samples
    if (this.samplesAccumulated >= HOP_SIZE) {
      this.detectPitch();
      this.samplesAccumulated = 0;
    }

    return true; // Keep processor alive
  }

  /**
   * Run pitch detection and send results to main thread
   */
  private detectPitch(): void {
    // Rate limit messages to prevent overwhelming main thread
    const now = currentTime * 1000;
    if (now - this.lastMessageTime < this.minMessageInterval) {
      return;
    }

    // Create properly ordered buffer for detection (unwrap circular buffer)
    const orderedBuffer = this.getOrderedBuffer();

    // Run pitch detection
    const [frequency, clarity] = this.detector.findPitch(orderedBuffer, this.sampleRate);

    // Only send if clarity meets threshold
    if (clarity >= MIN_CLARITY && frequency > 0) {
      const message: PitchMessage = {
        type: 'pitch',
        frequency,
        clarity,
        timestamp: currentTime,
      };

      this.port.postMessage(message);
      this.lastMessageTime = now;
    }
  }

  /**
   * Get buffer contents in chronological order (unwrap circular buffer)
   */
  private getOrderedBuffer(): Float32Array {
    // The data before writeIndex is newer, after is older
    // We need to return oldest to newest
    const result = new Float32Array(BUFFER_SIZE);
    const olderPart = this.buffer.subarray(this.writeIndex);
    const newerPart = this.buffer.subarray(0, this.writeIndex);

    result.set(olderPart, 0);
    result.set(newerPart, BUFFER_SIZE - this.writeIndex);

    return result;
  }
}

// Register the processor
registerProcessor('pitch-processor', PitchProcessor);

// Export for type checking (not used at runtime)
export type { WorkerMessage, PitchMessage, ReadyMessage };

