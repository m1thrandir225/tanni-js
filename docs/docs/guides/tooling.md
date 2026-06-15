---
id: tooling
title: Tooling (Vite)
sidebar_label: Tooling (Vite)
---

# Tooling

Tanni compiles `.tanni` files with [Vite](https://vite.dev/) using the official
plugin, `vite-plugin-tannijs`. The starter template wires this up for you; this page
explains the setup so you can configure an existing project.

## Install

```bash
npm install tannijs
npm install -D vite vite-plugin-tannijs
```

- `tannijs` — the runtime you import from in components.
- `vite-plugin-tannijs` — the Vite plugin (it pulls in `tannijs-compiler` for you).

## Configure Vite

Add `tanniPlugin()` to your Vite config:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { tanniPlugin } from 'vite-plugin-tannijs';

export default defineConfig({
  plugins: [tanniPlugin()],
});
```

With Tailwind, add the Tailwind Vite plugin alongside it:

```ts
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { tanniPlugin } from 'vite-plugin-tannijs';

export default defineConfig({
  plugins: [tanniPlugin(), tailwindcss()],
});
```

## What the plugin does

- Compiles every `.tanni` import into a JavaScript factory function.
- Extracts each component's `<style>` blocks into a virtual stylesheet and adds the
  corresponding import automatically, so styles ship with the component.

## TypeScript declarations

Add an ambient module declaration so TypeScript understands `.tanni` imports:

```ts
// tanni-env.d.ts
declare module '*.tanni' {
  const component: (props?: Record<string, unknown>) => Node;
  export default component;
}
```

## Plugin options

```ts
interface TanniPluginOptions {
  // Module the compiled output imports its runtime helpers from.
  // Defaults to 'tannijs/internals'.
  runtimeModule?: string;
}
```

You rarely need to set `runtimeModule` — the default works for standard projects.
