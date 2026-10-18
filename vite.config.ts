import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the build works on Cloudflare Pages, Netlify, GitHub Pages
// sub-paths or any static host without changes.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    // Hashed bundles go to /static so /assets stays for owner-replaceable media.
    assetsDir: 'static',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
          motion: ['framer-motion'],
        },
      },
    },
  },
});
