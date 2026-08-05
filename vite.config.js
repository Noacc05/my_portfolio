import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/my_portfolio/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        spectrograph: resolve(__dirname, 'src/html_apps/spectrograph.html'),
        ascii: resolve(__dirname, 'src/html_apps/ascii.html'),
      },
    },
  },
});
