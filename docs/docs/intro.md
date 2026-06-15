---
id: intro
title: Introduction
sidebar_label: Introduction
slug: /
---

# Tanni (単に)

**Tanni** is a TypeScript-first frontend framework that pairs the developer-friendly
syntax of Vue single-file components with the fine-grained, signal-based reactivity
model popularized by Solid.

The name comes from the Japanese word *tan'ni* ("simply") — the goal is a small,
modern framework that's pleasant to write and fast at runtime.

:::info Work in progress
Tanni is pre-1.0 (currently `0.2.x`). The APIs documented here reflect what is
**actually implemented today**. Planned-but-unbuilt features are listed on the
[Roadmap](/roadmap).
:::

## Why Tanni?

- **Familiar syntax** — single-file components with `<template>`, `<script>`, and `<style>` blocks.
- **No virtual DOM** — templates compile ahead of time to direct, surgical DOM updates driven by signals.
- **TypeScript-first** — write plain TypeScript in your `<script>` block.
- **Small runtime** — the reactive runtime is intentionally tiny.

## How it works

Tanni compiles each `.tanni` single-file component into a plain JavaScript factory
function. Instead of re-rendering and diffing a virtual tree, the compiler wires each
dynamic expression to a signal so only the affected DOM node updates when state changes:

```
Virtual DOM (Vue/React):  State change → re-render → diff trees → patch DOM
Tanni (signals):          State change → update the specific DOM node(s)
```

## How it compares

| Feature      | Tanni          | Vue 3       | Solid       | Svelte 5      |
| ------------ | -------------- | ----------- | ----------- | ------------- |
| Syntax       | SFC            | SFC         | JSX         | SFC           |
| Reactivity   | Signals        | Proxy refs  | Signals     | Runes         |
| Rendering    | Compiled DOM   | Virtual DOM | Compiled DOM| Compiled DOM  |
| TypeScript   | First-class    | Good        | Excellent   | Good          |

## Next steps

- [Installation](/getting-started/installation) — scaffold a new project.
- [Your first component](/getting-started/your-first-component) — build a counter.
- [Reactivity](/guides/reactivity) — `createSignal`, `createEffect`, `createMemo`.
- [Components](/guides/components) — SFC anatomy, props, and slots.
