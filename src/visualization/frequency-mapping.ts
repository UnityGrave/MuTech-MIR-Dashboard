/**
 * Frequency Mapping Module
 * Converts frequencies to canvas Y coordinates using logarithmic scale
 */

// Default frequency range (covers guitar and vocals)
export const DEFAULT_MIN_FREQ = 80; // Low E on guitar ~82 Hz
export const DEFAULT_MAX_FREQ = 1000; // B5 ~987 Hz

/**
 * Convert frequency to Y pixel coordinate using logarithmic scale
 * @param frequency - Frequency in Hz
 * @param canvasHeight - Height of canvas in pixels
 * @param minFreq - Minimum frequency of range (bottom of canvas)
 * @param maxFreq - Maximum frequency of range (top of canvas)
 * @returns Y coordinate (0 at top for high freq, height at bottom for low freq)
 */
export function frequencyToY(
  frequency: number,
  canvasHeight: number,
  minFreq: number = DEFAULT_MIN_FREQ,
  maxFreq: number = DEFAULT_MAX_FREQ
): number {
  // Handle edge cases
  if (frequency <= 0) {
    return canvasHeight; // Off the bottom
  }

  // Clamp frequency to range
  const clampedFreq = Math.max(minFreq, Math.min(maxFreq, frequency));

  // Convert to logarithmic scale
  const logFreq = Math.log2(clampedFreq);
  const logMin = Math.log2(minFreq);
  const logMax = Math.log2(maxFreq);

  // Normalize to 0-1 range
  const normalizedPosition = (logFreq - logMin) / (logMax - logMin);

  // Map to canvas coordinates (inverted: low freq at bottom, high freq at top)
  return canvasHeight * (1 - normalizedPosition);
}

/**
 * Convert Y pixel coordinate back to frequency
 * @param y - Y coordinate in pixels
 * @param canvasHeight - Height of canvas in pixels
 * @param minFreq - Minimum frequency of range
 * @param maxFreq - Maximum frequency of range
 * @returns Frequency in Hz
 */
export function yToFrequency(
  y: number,
  canvasHeight: number,
  minFreq: number = DEFAULT_MIN_FREQ,
  maxFreq: number = DEFAULT_MAX_FREQ
): number {
  // Convert Y to normalized position (inverted)
  const normalizedPosition = 1 - y / canvasHeight;

  // Convert from log scale
  const logMin = Math.log2(minFreq);
  const logMax = Math.log2(maxFreq);
  const logFreq = normalizedPosition * (logMax - logMin) + logMin;

  return Math.pow(2, logFreq);
}

/**
 * Get Y positions for grid lines at octave intervals
 * @param canvasHeight - Height of canvas in pixels
 * @param minFreq - Minimum frequency of range
 * @param maxFreq - Maximum frequency of range
 * @returns Array of {y, frequency, note} for each grid line
 */
export function getOctaveGridLines(
  canvasHeight: number,
  minFreq: number = DEFAULT_MIN_FREQ,
  maxFreq: number = DEFAULT_MAX_FREQ
): { y: number; frequency: number; note: string }[] {
  const gridLines: { y: number; frequency: number; note: string }[] = [];

  // Standard note frequencies for C notes (reference)
  const cNotes = [
    { freq: 65.41, note: 'C2' },
    { freq: 130.81, note: 'C3' },
    { freq: 261.63, note: 'C4' },
    { freq: 523.25, note: 'C5' },
    { freq: 1046.5, note: 'C6' },
  ];

  for (const cNote of cNotes) {
    if (cNote.freq >= minFreq && cNote.freq <= maxFreq) {
      gridLines.push({
        y: frequencyToY(cNote.freq, canvasHeight, minFreq, maxFreq),
        frequency: cNote.freq,
        note: cNote.note,
      });
    }
  }

  return gridLines;
}

/**
 * Get Y positions for grid lines at every note
 * @param canvasHeight - Height of canvas in pixels
 * @param minFreq - Minimum frequency of range
 * @param maxFreq - Maximum frequency of range
 * @returns Array of {y, frequency, note} for each note
 */
export function getNoteGridLines(
  canvasHeight: number,
  minFreq: number = DEFAULT_MIN_FREQ,
  maxFreq: number = DEFAULT_MAX_FREQ
): { y: number; frequency: number; note: string }[] {
  const gridLines: { y: number; frequency: number; note: string }[] = [];
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // A4 = 440 Hz, MIDI note 69
  // Calculate frequencies for all notes in range
  for (let midiNote = 24; midiNote <= 96; midiNote++) {
    const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);

    if (frequency >= minFreq && frequency <= maxFreq) {
      const noteName = noteNames[midiNote % 12];
      const octave = Math.floor(midiNote / 12) - 1;

      gridLines.push({
        y: frequencyToY(frequency, canvasHeight, minFreq, maxFreq),
        frequency,
        note: `${noteName}${octave}`,
      });
    }
  }

  return gridLines;
}

