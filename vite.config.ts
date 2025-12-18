import { defineConfig } from 'vite';

export default defineConfig({
  // Configure worker/worklet handling
  worker: {
    format: 'es'
  },
  // Ensure proper MIME types for worklet files
  assetsInclude: ['**/*.worklet.ts'],
  build: {
    target: 'esnext',
    sourcemap: true
  },
  server: {
    // Required for some browsers' audio features
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  }
});

