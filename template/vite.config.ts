import { defineConfig } from 'vite';
import { tanniPlugin } from 'vite-plugin-tannijs';

export default defineConfig({
  plugins: [tanniPlugin()],
});
