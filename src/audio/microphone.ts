/**
 * Microphone access module
 * Implements getUserMedia with constraints optimized for pitch detection
 */

export interface MicrophoneConstraints {
  echoCancellation: boolean;
  autoGainControl: boolean;
  noiseSuppression: boolean;
  channelCount: number;
  latency: number;
}

export interface MicrophoneResult {
  stream: MediaStream;
  actualSettings: MediaTrackSettings;
}

/**
 * Default constraints optimized for musical pitch detection
 * All processing disabled to preserve signal periodicity
 */
const DEFAULT_CONSTRAINTS: MicrophoneConstraints = {
  echoCancellation: false,
  autoGainControl: false,
  noiseSuppression: false,
  channelCount: 1,
  latency: 0,
};

/**
 * Request microphone access with constraints optimized for pitch detection
 * @param customConstraints - Optional override for default constraints
 * @returns Promise resolving to MediaStream and actual applied settings
 */
export async function getMicrophoneStream(
  customConstraints?: Partial<MicrophoneConstraints>
): Promise<MicrophoneResult> {
  const constraints: MediaStreamConstraints = {
    audio: {
      ...DEFAULT_CONSTRAINTS,
      ...customConstraints,
    },
    video: false,
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Get the audio track and verify settings
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) {
      throw new Error('No audio track found in stream');
    }

    const actualSettings = audioTrack.getSettings();

    // Log actual settings for debugging
    console.log('🎤 Microphone connected');
    console.log('📊 Audio track settings:', {
      deviceId: actualSettings.deviceId,
      channelCount: actualSettings.channelCount,
      sampleRate: actualSettings.sampleRate,
      echoCancellation: actualSettings.echoCancellation,
      autoGainControl: actualSettings.autoGainControl,
      noiseSuppression: actualSettings.noiseSuppression,
      latency: (actualSettings as MediaTrackSettings & { latency?: number }).latency,
    });

    // Warn if processing couldn't be disabled
    if (actualSettings.echoCancellation) {
      console.warn('⚠️ Echo cancellation could not be disabled - pitch detection may be affected');
    }
    if (actualSettings.autoGainControl) {
      console.warn('⚠️ Auto gain control could not be disabled - pitch detection may be affected');
    }
    if (actualSettings.noiseSuppression) {
      console.warn('⚠️ Noise suppression could not be disabled - pitch detection may be affected');
    }

    return { stream, actualSettings };
  } catch (error) {
    // Handle specific error types
    if (error instanceof DOMException) {
      switch (error.name) {
        case 'NotAllowedError':
          throw new Error(
            'Microphone permission denied. Please allow access in your browser settings and try again.'
          );
        case 'NotFoundError':
          throw new Error(
            'No microphone found. Please connect a microphone and reload the page.'
          );
        case 'NotReadableError':
          throw new Error(
            'Microphone is in use by another application. Please close other apps using the microphone.'
          );
        case 'OverconstrainedError':
          throw new Error(
            'Microphone does not support the required settings. Try a different microphone.'
          );
        case 'SecurityError':
          throw new Error(
            'Microphone access blocked due to security settings. Ensure you are using HTTPS.'
          );
        default:
          throw new Error(`Microphone error: ${error.message}`);
      }
    }
    throw error;
  }
}

/**
 * Stop all tracks in a media stream
 * @param stream - MediaStream to stop
 */
export function stopMicrophoneStream(stream: MediaStream): void {
  stream.getTracks().forEach((track) => {
    track.stop();
    console.log('🔇 Microphone track stopped');
  });
}

/**
 * Check if microphone access is available
 * @returns Promise resolving to true if microphone is available
 */
export async function isMicrophoneAvailable(): Promise<boolean> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some((device) => device.kind === 'audioinput');
  } catch {
    return false;
  }
}

