import { defineConfig } from 'vite';
import { resolve } from 'path';

// src/ contains index.html + style.css (Vite processes these)
// static/ contains files copied verbatim to dist/ (app.js, dexie.min.js, sw.js, manifest.json, icons/)
export default defineConfig({
  root: 'src',
  base: '/Claude-to-my-life/',
  publicDir: resolve(__dirname, 'static'),
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});
