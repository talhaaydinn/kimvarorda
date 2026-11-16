import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  root: 'web',
  plugins: [react()],
  resolve: { alias: { '@shared': resolve('shared') } },
  build: { outDir: resolve('dist'), emptyOutDir: true },
  server: {
    port: 5173,
    fs: { allow: [resolve('.')] },
    proxy: { '/api': 'http://localhost:3001' },
  },
});
