---
id: roadmap
title: Roadmap
sidebar_label: Roadmap
---

# Roadmap

Tanni is pre-1.0 and under active development. This page tracks what works today and
what's planned, so the rest of the docs can stay focused on shipped features.

## Implemented

### 0.1 — Core

- Reactive state — `createSignal`
- Computed values — `createMemo`
- Side effects — `createEffect`
- Text interpolation — `{{ }}`
- Attribute binding — `:attr`
- Event handling — `@event`
- Conditional rendering — `tn-if` / `tn-else-if` / `tn-else`
- List rendering — `tn-for`
- Component props — `defineProps`
- TypeScript support

### 0.2 — Current

- Scoped CSS with compile-time transformation
- `tn-model` two-way binding
- `tn-show` visibility toggle
- Slots for content distribution
- Lifecycle hooks — `onMount`, `onCleanup`

## Planned

### 0.3

- Async components and lazy loading
- Error boundaries
- Teleport / portals
- Transitions

### 0.4

- Server-side rendering (SSR)
- Hydration (including partial hydration)
- Streaming SSR

### 1.0

- Stable API
- Official devtools extension
- Performance benchmarks
- Migration guides from Vue/React

## Not implemented yet

These appear in the design spec but are **not available today**. The documentation
deliberately does not cover them as working features:

- **`tn-html` / `tn-text` directives** — use `{{ }}` interpolation for text in the meantime.
- **Keyed reconciliation for `tn-for`** — a `:key` is accepted syntactically, but the
  list currently re-renders when its source changes.
- **Control-flow components** — `<Show>`, `<For>`, `<Switch>`, `<Match>`. Use the
  `tn-*` directives instead.
- **Provide / inject** — dependency injection.
- **Teleport** — rendering outside the component tree.
- **Async / lazy components.**
- **SSR & hydration.**
- **Devtools and HMR.**
- **Official router and global state library.**
