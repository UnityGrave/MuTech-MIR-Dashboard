/**
 * Music Theory Utilities
 * Converts frequencies to musical note names and cents deviation
 */

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

// Alternative note names with flats
const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

export type NoteName = (typeof NOTE_NAMES)[number];
export type NoteNameFlat = (typeof NOTE_NAMES_FLAT)[number];

export interface NoteInfo {
  /** Note name with octave (e.g., "A4", "C#5") */
  note: string;
  /** Just the note name without octave (e.g., "A", "C#") */
  noteName: NoteName;
  /** Octave number (e.g., 4 for A4) */
  octave: number;
  /** MIDI note number (A4 = 69) */
  midiNote: number;
  /** Cents deviation from perfect pitch (-50 to +50) */
  cents: number;
  /** Perfect frequency of the note in Hz */
  perfectFrequency: number;
}

/**
 * Reference frequency for A4
 */
const A4_FREQUENCY = 440;

/**
 * MIDI note number for A4
 */
const A4_MIDI_NOTE = 69;

/**
 * Convert frequency to note information
 * @param frequency - Frequency in Hz
 * @returns NoteInfo object with note details
 */
export function frequencyToNote(frequency: number): NoteInfo {
  if (frequency <= 0) {
    return {
      note: '---',
      noteName: 'C',
      octave: 0,
      midiNote: 0,
      cents: 0,
      perfectFrequency: 0,
    };
  }

  // Calculate MIDI note number (can be fractional)
  const midiNoteFloat = 12 * Math.log2(frequency / A4_FREQUENCY) + A4_MIDI_NOTE;

  // Round to nearest note
  const midiNote = Math.round(midiNoteFloat);

  // Calculate cents deviation
  const cents = Math.round((midiNoteFloat - midiNote) * 100);

  // Calculate note name and octave
  const noteIndex = ((midiNote % 12) + 12) % 12; // Handle negative modulo
  const noteName = NOTE_NAMES[noteIndex];
  const octave = Math.floor(midiNote / 12) - 1;

  // Calculate perfect frequency for this note
  const perfectFrequency = A4_FREQUENCY * Math.pow(2, (midiNote - A4_MIDI_NOTE) / 12);

  return {
    note: `${noteName}${octave}`,
    noteName,
    octave,
    midiNote,
    cents,
    perfectFrequency,
  };
}

/**
 * Convert MIDI note number to frequency
 * @param midiNote - MIDI note number (0-127)
 * @returns Frequency in Hz
 */
export function midiToFrequency(midiNote: number): number {
  return A4_FREQUENCY * Math.pow(2, (midiNote - A4_MIDI_NOTE) / 12);
}

/**
 * Convert note name and octave to frequency
 * @param noteName - Note name (e.g., "A", "C#")
 * @param octave - Octave number (e.g., 4 for A4)
 * @returns Frequency in Hz
 */
export function noteToFrequency(noteName: string, octave: number): number {
  const noteIndex = NOTE_NAMES.indexOf(noteName as NoteName);
  if (noteIndex === -1) {
    // Try flat notation
    const flatIndex = NOTE_NAMES_FLAT.indexOf(noteName as NoteNameFlat);
    if (flatIndex === -1) {
      throw new Error(`Invalid note name: ${noteName}`);
    }
    const midiNote = (octave + 1) * 12 + flatIndex;
    return midiToFrequency(midiNote);
  }

  const midiNote = (octave + 1) * 12 + noteIndex;
  return midiToFrequency(midiNote);
}

/**
 * Get the interval in cents between two frequencies
 * @param freq1 - First frequency in Hz
 * @param freq2 - Second frequency in Hz
 * @returns Interval in cents
 */
export function getIntervalCents(freq1: number, freq2: number): number {
  if (freq1 <= 0 || freq2 <= 0) {
    return 0;
  }
  return Math.round(1200 * Math.log2(freq2 / freq1));
}

/**
 * Check if a frequency is within a certain cent tolerance of a target note
 * @param frequency - Frequency to check
 * @param targetMidiNote - Target MIDI note number
 * @param tolerance - Tolerance in cents (default 50)
 * @returns True if within tolerance
 */
export function isInTune(
  frequency: number,
  targetMidiNote: number,
  tolerance: number = 50
): boolean {
  const targetFreq = midiToFrequency(targetMidiNote);
  const cents = Math.abs(getIntervalCents(targetFreq, frequency));
  return cents <= tolerance;
}

/**
 * Format cents value with sign
 * @param cents - Cents value
 * @returns Formatted string (e.g., "+12¢", "-5¢")
 */
export function formatCents(cents: number): string {
  if (cents === 0) {
    return '0¢';
  }
  return cents > 0 ? `+${cents}¢` : `${cents}¢`;
}

/**
 * Get all note frequencies in a given range
 * @param minFreq - Minimum frequency
 * @param maxFreq - Maximum frequency
 * @returns Array of {frequency, note, midiNote}
 */
export function getNotesInRange(
  minFreq: number,
  maxFreq: number
): { frequency: number; note: string; midiNote: number }[] {
  const notes: { frequency: number; note: string; midiNote: number }[] = [];

  // Start from MIDI note 0 and go up
  for (let midiNote = 0; midiNote <= 127; midiNote++) {
    const frequency = midiToFrequency(midiNote);
    if (frequency >= minFreq && frequency <= maxFreq) {
      const noteIndex = midiNote % 12;
      const octave = Math.floor(midiNote / 12) - 1;
      notes.push({
        frequency,
        note: `${NOTE_NAMES[noteIndex]}${octave}`,
        midiNote,
      });
    }
    if (frequency > maxFreq) {
      break;
    }
  }

  return notes;
}

