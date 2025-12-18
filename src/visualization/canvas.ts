/**
 * Canvas Setup Module
 * Handles high-DPI canvas configuration and render loop
 */

let animationFrameId: number | null = null;
let lastFrameTime = 0;
let frameCount = 0;
let fps = 0;

// Get FPS counter element
const fpsCounter = document.getElementById('fps-counter');

/**
 * Set up canvas for high-DPI (Retina) displays
 * @param canvas - Canvas element to configure
 * @returns Canvas 2D rendering context
 */
export function setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D canvas context');
  }

  // Initial resize
  resizeCanvas(canvas, ctx);

  // Handle window resize
  const resizeObserver = new ResizeObserver(() => {
    resizeCanvas(canvas, ctx);
  });
  resizeObserver.observe(canvas.parentElement || canvas);

  return ctx;
}

/**
 * Resize canvas to match container with high-DPI support
 * @param canvas - Canvas element
 * @param ctx - Canvas 2D context
 */
function resizeCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  // Set canvas buffer size to physical pixels
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  // Scale context for high-DPI
  ctx.scale(dpr, dpr);

  // Maintain CSS display size
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  console.log(
    `📐 Canvas resized: ${rect.width}x${rect.height} CSS px, ${canvas.width}x${canvas.height} buffer px (DPR: ${dpr})`
  );
}

/**
 * Get the logical (CSS) dimensions of the canvas
 * @param canvas - Canvas element
 * @returns Object with width and height
 */
export function getCanvasLogicalSize(canvas: HTMLCanvasElement): {
  width: number;
  height: number;
} {
  const rect = canvas.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
  };
}

/**
 * Start the animation render loop
 * @param renderCallback - Function to call each frame
 */
export function startRenderLoop(renderCallback: () => void): void {
  if (animationFrameId !== null) {
    console.warn('Render loop already running');
    return;
  }

  lastFrameTime = performance.now();
  frameCount = 0;

  function render(timestamp: number): void {
    // Calculate FPS
    frameCount++;
    const elapsed = timestamp - lastFrameTime;
    if (elapsed >= 1000) {
      fps = Math.round((frameCount * 1000) / elapsed);
      frameCount = 0;
      lastFrameTime = timestamp;
      if (fpsCounter) {
        fpsCounter.textContent = `${fps}`;
      }
    }

    // Call render function
    renderCallback();

    // Schedule next frame
    animationFrameId = requestAnimationFrame(render);
  }

  animationFrameId = requestAnimationFrame(render);
  console.log('▶️ Render loop started');
}

/**
 * Stop the animation render loop
 */
export function stopRenderLoop(): void {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
    console.log('⏹️ Render loop stopped');
  }

  if (fpsCounter) {
    fpsCounter.textContent = '---';
  }
}

/**
 * Get the current FPS
 */
export function getCurrentFPS(): number {
  return fps;
}

