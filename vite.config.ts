import { defineConfig } from 'vite';

export default defineConfig({
  // Configure worker/worklet handling
  worker: {
    format: 'es',
  },
  // Ensure proper MIME types for worklet files
  assetsInclude: ['**/*.worklet.ts'],
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  server: {
    // Listen on all interfaces (required for Docker)
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // File watching configuration for Docker
    watch: {
      // Use polling for Docker/WSL2 compatibility
      usePolling: true,
      interval: 1000,
    },
    // Required headers for AudioWorklet and SharedArrayBuffer
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    // HMR configuration for Docker
    hmr: {
      // Use the host from environment or default to localhost
      host: process.env.VITE_HMR_HOST || 'localhost',
      port: 5173,
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
});

