import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react'; // I'll assume this is available

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
