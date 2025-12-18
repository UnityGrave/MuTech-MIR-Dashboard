/**
 * Pitch Graph Renderer Module
 * Renders the scrolling pitch visualization on canvas
 */

import { frequencyToY, getOctaveGridLines, DEFAULT_MIN_FREQ, DEFAULT_MAX_FREQ } from './frequency-mapping';
import { getCanvasLogicalSize } from './canvas';

// Rendering configuration
const CONFIG = {
  // Line styling
  lineColor: '#00e5cc',
  lineWidth: 2.5,
  lineCap: 'round' as CanvasLineCap,
  lineJoin: 'round' as CanvasLineJoin,

  // Glow effect
  glowColor: 'rgba(0, 229, 204, 0.4)',
  glowBlur: 8,

  // Background
  backgroundColor: '#121820',

  // Grid styling
  gridColor: 'rgba(255, 255, 255, 0.08)',
  gridLineWidth: 1,
  gridLabelColor: 'rgba(255, 255, 255, 0.3)',
  gridLabelFont: '10px JetBrains Mono, monospace',

  // Frequency range
  minFreq: DEFAULT_MIN_FREQ,
  maxFreq: DEFAULT_MAX_FREQ,
};

/**
 * Clear the canvas with background color
 * @param ctx - Canvas 2D context
 * @param width - Canvas width
 * @param height - Canvas height
 */
function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = CONFIG.backgroundColor;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Draw reference grid lines at octave intervals
 * @param ctx - Canvas 2D context
 * @param width - Canvas width
 * @param height - Canvas height
 */
function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const gridLines = getOctaveGridLines(height, CONFIG.minFreq, CONFIG.maxFreq);

  ctx.strokeStyle = CONFIG.gridColor;
  ctx.lineWidth = CONFIG.gridLineWidth;
  ctx.font = CONFIG.gridLabelFont;
  ctx.fillStyle = CONFIG.gridLabelColor;
  ctx.textBaseline = 'middle';

  for (const line of gridLines) {
    // Draw horizontal line
    ctx.beginPath();
    ctx.moveTo(0, line.y);
    ctx.lineTo(width, line.y);
    ctx.stroke();

    // Draw note label
    ctx.fillText(line.note, 8, line.y - 2);
  }
}

/**
 * Draw the pitch path
 * @param ctx - Canvas 2D context
 * @param data - Array of frequency values (null for gaps)
 * @param width - Canvas width
 * @param height - Canvas height
 */
function drawPitchPath(
  ctx: CanvasRenderingContext2D,
  data: (number | null)[],
  width: number,
  height: number
): void {
  if (data.length === 0) {
    return;
  }

  // Calculate x step based on data length
  const xStep = width / Math.max(data.length - 1, 1);

  // Set up line style
  ctx.strokeStyle = CONFIG.lineColor;
  ctx.lineWidth = CONFIG.lineWidth;
  ctx.lineCap = CONFIG.lineCap;
  ctx.lineJoin = CONFIG.lineJoin;

  // Add glow effect
  ctx.shadowColor = CONFIG.glowColor;
  ctx.shadowBlur = CONFIG.glowBlur;

  // Draw the path
  ctx.beginPath();
  let pathStarted = false;
  let lastValidY: number | null = null;

  for (let i = 0; i < data.length; i++) {
    const freq = data[i];
    const x = i * xStep;

    if (freq !== null && freq > 0) {
      const y = frequencyToY(freq, height, CONFIG.minFreq, CONFIG.maxFreq);

      if (!pathStarted) {
        ctx.moveTo(x, y);
        pathStarted = true;
      } else if (lastValidY === null) {
        // Coming back from a gap, start a new sub-path segment
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      lastValidY = y;
    } else {
      // Gap in data
      lastValidY = null;
    }
  }

  ctx.stroke();

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

/**
 * Draw a dot at the current (rightmost) pitch position
 * @param ctx - Canvas 2D context
 * @param data - Array of frequency values
 * @param width - Canvas width
 * @param height - Canvas height
 */
function drawCurrentPitchDot(
  ctx: CanvasRenderingContext2D,
  data: (number | null)[],
  width: number,
  height: number
): void {
  if (data.length === 0) {
    return;
  }

  // Find the last valid frequency
  let lastFreq: number | null = null;
  let lastIndex = data.length - 1;

  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i] !== null && data[i]! > 0) {
      lastFreq = data[i];
      lastIndex = i;
      break;
    }
  }

  if (lastFreq === null) {
    return;
  }

  const xStep = width / Math.max(data.length - 1, 1);
  const x = lastIndex * xStep;
  const y = frequencyToY(lastFreq, height, CONFIG.minFreq, CONFIG.maxFreq);

  // Draw outer glow
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fillStyle = CONFIG.glowColor;
  ctx.fill();

  // Draw inner dot
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fillStyle = CONFIG.lineColor;
  ctx.fill();
}

/**
 * Main render function - draws the complete pitch visualization
 * @param ctx - Canvas 2D context
 * @param canvas - Canvas element
 * @param data - Array of frequency values from circular buffer
 */
export function renderPitchGraph(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: (number | null)[]
): void {
  const { width, height } = getCanvasLogicalSize(canvas);

  // Clear canvas
  clearCanvas(ctx, width, height);

  // Draw grid
  drawGrid(ctx, width, height);

  // Draw pitch path
  drawPitchPath(ctx, data, width, height);

  // Draw current position dot
  drawCurrentPitchDot(ctx, data, width, height);
}

/**
 * Update rendering configuration
 * @param newConfig - Partial configuration to merge
 */
export function updateRenderConfig(newConfig: Partial<typeof CONFIG>): void {
  Object.assign(CONFIG, newConfig);
}

