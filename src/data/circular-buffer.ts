/**
 * Circular Buffer Implementation
 * Fixed-size buffer for storing pitch data for visualization
 */

export class CircularBuffer<T> {
  private buffer: T[];
  private writeIndex: number = 0;
  private size: number;
  private count: number = 0;

  /**
   * Create a new circular buffer
   * @param size - Maximum number of elements to store
   * @param fillValue - Initial fill value (default: null for nullable types)
   */
  constructor(size: number, fillValue?: T) {
    this.size = size;
    this.buffer = new Array(size).fill(fillValue ?? null);
  }

  /**
   * Add a value to the buffer (overwrites oldest if full)
   * @param value - Value to add
   */
  push(value: T): void {
    this.buffer[this.writeIndex] = value;
    this.writeIndex = (this.writeIndex + 1) % this.size;
    if (this.count < this.size) {
      this.count++;
    }
  }

  /**
   * Get all values in chronological order (oldest to newest)
   * @returns Array of values from oldest to newest
   */
  getAll(): T[] {
    if (this.count < this.size) {
      // Buffer not yet full, return from start to current position
      return this.buffer.slice(0, this.count);
    }

    // Buffer is full, unwrap circular data
    // writeIndex points to the oldest data (will be overwritten next)
    return [...this.buffer.slice(this.writeIndex), ...this.buffer.slice(0, this.writeIndex)];
  }

  /**
   * Get the most recent value
   * @returns Most recent value or undefined if empty
   */
  getLast(): T | undefined {
    if (this.count === 0) {
      return undefined;
    }
    const lastIndex = (this.writeIndex - 1 + this.size) % this.size;
    return this.buffer[lastIndex];
  }

  /**
   * Get value at a specific position (0 = oldest)
   * @param index - Position in chronological order
   * @returns Value at position or undefined if out of range
   */
  getAt(index: number): T | undefined {
    if (index < 0 || index >= this.count) {
      return undefined;
    }

    if (this.count < this.size) {
      return this.buffer[index];
    }

    // Translate to actual buffer position
    const actualIndex = (this.writeIndex + index) % this.size;
    return this.buffer[actualIndex];
  }

  /**
   * Get the number of values currently stored
   */
  getCount(): number {
    return this.count;
  }

  /**
   * Get the maximum capacity
   */
  getCapacity(): number {
    return this.size;
  }

  /**
   * Check if the buffer is full
   */
  isFull(): boolean {
    return this.count >= this.size;
  }

  /**
   * Clear all values from the buffer
   * @param fillValue - Value to fill with (default: null)
   */
  clear(fillValue?: T): void {
    this.buffer.fill(fillValue ?? (null as unknown as T));
    this.writeIndex = 0;
    this.count = 0;
  }

  /**
   * Get an iterator over values (oldest to newest)
   */
  *[Symbol.iterator](): Iterator<T> {
    const all = this.getAll();
    for (const value of all) {
      yield value;
    }
  }
}

