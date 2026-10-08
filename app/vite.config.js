import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 5180,
    open: false,
    cors: true,
    proxy: {
      '/ollama-proxy': {
        target: 'http://localhost:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ollama-proxy/, ''),
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 5180,
    cors: true,
  }
});
