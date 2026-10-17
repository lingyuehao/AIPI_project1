import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' lets the built site run from any sub-path, including GitHub Pages.
export default defineConfig({
  plugins: [react()],
  base: './',
});
