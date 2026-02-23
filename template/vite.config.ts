import { defineConfig } from 'vite';
import { tanniPlugin } from 'vite-plugin-tanni';

export default defineConfig({
  plugins: [tanniPlugin()],
});
