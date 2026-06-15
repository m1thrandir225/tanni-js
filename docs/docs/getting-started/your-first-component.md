---
id: your-first-component
title: Your First Component
sidebar_label: Your First Component
---

# Your first component

Let's build a counter. This mirrors the [`examples/counter`](https://github.com/m1thrandir225/tanni-js/tree/master/examples/counter)
project in the repository.

## The component

A Tanni component is a single `.tanni` file with `<script>`, `<template>`, and
(optionally) `<style>` blocks:

```html
<!-- src/App.tanni -->
<script lang="ts">
  import { createSignal } from 'tannijs';

  const [count, setCount] = createSignal(0);

  function increment() {
    setCount((c) => c + 1);
  }

  function decrement() {
    setCount((c) => c - 1);
  }

  function reset() {
    setCount(0);
  }
</script>

<template>
  <main>
    <h1>Tanni Counter</h1>
    <p>{{ count() }}</p>
    <button @click="increment">+</button>
    <button @click="decrement">−</button>
    <button @click="reset">Reset</button>
  </main>
</template>
```

A few things to notice:

- `createSignal(0)` returns a `[getter, setter]` pair. You **call** the getter
  (`count()`) to read the current value.
- `{{ count() }}` interpolates a reactive value into the DOM. When `count` changes,
  only that text node updates.
- `@click="increment"` attaches an event handler. See
  [Template Syntax](/guides/template-syntax) for the full set of bindings.

## Mounting the app

Every compiled `.tanni` component exports a **factory function** that returns a DOM
node. Mount it by appending the result to an element on the page:

```ts
// src/main.ts
import App from './App.tanni';

const root = document.getElementById('app')!;
root.append(App());
```

```html
<!-- index.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Tanni App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./src/main.ts"></script>
  </body>
</html>
```

## TypeScript: declaring `.tanni` modules

So TypeScript understands `.tanni` imports, add an ambient declaration (the starter
template includes this as `tanni-env.d.ts`):

```ts
// tanni-env.d.ts
declare module '*.tanni' {
  const component: (props?: Record<string, unknown>) => Node;
  export default component;
}
```

## Where to go next

- [Reactivity](/guides/reactivity) — `createSignal`, `createEffect`, `createMemo`.
- [Directives](/guides/directives) — `tn-if`, `tn-for`, `tn-model`, and more.
- [Components](/guides/components) — props, child components, and slots.
