import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: false,
    cors: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    cors: true,
  }
});
