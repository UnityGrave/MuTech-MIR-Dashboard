/**
 * Type definitions for AudioWorklet API
 * These extend the built-in types for AudioWorklet processor context
 */

// Extend MediaTrackSettings to include latency (not in all browser type defs)
interface MediaTrackSettings {
  latency?: number;
}

// AudioWorklet globals available in processor context
declare const currentTime: number;
declare const currentFrame: number;
declare const sampleRate: number;

// AudioWorkletProcessor base class
declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  constructor(options?: AudioWorkletNodeOptions);
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean;
}

// Register processor function
declare function registerProcessor(
  name: string,
  processorCtor: new (options?: AudioWorkletNodeOptions) => AudioWorkletProcessor
): void;

// Module declaration for worklet URL imports
declare module '*?worker&url' {
  const url: string;
  export default url;
}

