# Tanni (単に)

## Overview

Coming from the Japanese word Tan'ni which translates to simply, the goal of
this framework is to be a simple modern alternative easy to write with great
performance.

It leverages signals under the hood for modern reactivity and has a
SFC(single-file component) architecture similar to Vue.

It's inspired by:

- [Vue](https://vuejs.org/)
- [Solid](https://www.solidjs.com/)
- [Svelte](https://svelte.dev/)

***NOTE***: **work in progress**

## Extension

There is an experimental `VSCode` extension, you can download it from the releases and install it in your editor. The current implementation only supports syntax highlihting.

## Roadmap

### Current version: 0.1

- Reactive state ✔︎
- Computed Values ✔︎
- Side Effects ✔︎
- Text Interpolation ✔︎
- Attribute Binding ✔︎
- Event Handling ✔︎
- Conditional Rendering ✔︎
- List Rendering ✔︎
- Component Props ✔︎
- Typescript Support ✔︎

### Working on Version 0.2

- Scoped CSS with compile-time transformation
- `tn-model` two-way binding
- `tn-show` for CSS-based visibility toggle
- Slots for content distribution
- Lifecycle hooks (partially ✔︎)

### Version 0.3

- Async components and lazy loading
- Error boundaries
- Teleport for portals
- Transition support

### Version 0.4

- Server-side rendering (SSR)
- Hydration with partial hydration support
- Streaming SSR

### Version 1.0

- Stable API
- Official devtools extension
- Performance benchmarks
- Comprehensive documentation
- Migration guides from Vue/React
