---
id: styling
title: Styling
sidebar_label: Styling
---

# Styling

Add a `<style>` block to a component to style it. During compilation the CSS is
extracted and injected into the page (via a virtual stylesheet handled by the
[Vite plugin](/guides/tooling)).

## Global styles

A plain `<style>` block is global — its rules apply to the whole page:

```html
<template>
  <main class="counter">…</main>
</template>

<style>
  body {
    background-color: #f5f5f5;
  }
  .counter {
    padding: 2rem;
  }
</style>
```

## Scoped styles

Add the `scoped` attribute to limit styles to the current component. The compiler
gives every element in the component a unique `data-tn-<hash>` attribute and rewrites
each selector in the block to require it, so the rules can't leak to other
components:

```html
<template>
  <button class="primary">Save</button>
</template>

<style scoped>
  .primary {
    background: #2563eb;
    color: white;
  }
</style>
```

Here `.primary` effectively becomes `.primary[data-tn-<hash>]`, matching only this
component's elements.

## Multiple style blocks

A component can have more than one `<style>` block, and you can mix global and scoped
blocks in the same file:

```html
<style>
  /* global reset for this view */
  * { box-sizing: border-box; }
</style>

<style scoped>
  /* scoped to this component */
  .card { border-radius: 12px; }
</style>
```

## Preprocessors

A `lang` attribute (e.g. `lang="scss"` or `lang="less"`) is recognized by the parser,
but the block's content is currently emitted **as-is** without preprocessing. For now,
write standard CSS in your `<style>` blocks.

## Using Tailwind

The starter template can set up [Tailwind CSS](https://tailwindcss.com/) for you
during `node setup.js`. When enabled, you simply use utility classes directly in your
templates — no `<style>` block required:

```html
<template>
  <button class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
    Save
  </button>
</template>
```
