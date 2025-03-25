import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/feeter/',
  plugins: [react()],
  server: {
    port: 3000,
  },
}); 