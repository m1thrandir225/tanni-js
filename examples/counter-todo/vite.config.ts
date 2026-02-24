import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

import { tanniPlugin } from 'vite-plugin-tanni';

export default defineConfig({
  root: __dirname,
  plugins: [tanniPlugin(), tailwindcss()],
  server: {
    port: 8080,
  },
});
