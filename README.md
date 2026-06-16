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

## Create a project

You can create a project using the following command:

```bash
npx degit m1thrandir225/tanni-js/template <project_name>
```

Next if run the setup.js file using Node:

```bash
cd <project_name> && node setup.js
```

where you will be asked to choose if you want Tailwind support or not & finally you can install the dependencies using any package manager of your choosing:

```bash
npm/yarn/pnpm install 
npm/yarn/pnpm run dev
```

## Documentation

[Check out the docs](https://docs.tannijs.sebastijanzindl.me/)

The docs site lives in [`/docs`](./docs) and is built with
[Docusaurus](https://docusaurus.io/). It's part of the pnpm workspace, so a single
install from the repo root covers it.

Run the docs locally:

```bash
pnpm install
pnpm docs:dev
```

This starts the site at [http://localhost:3000](http://localhost:3000).

Build the static site (also the link-checking gate — the build fails on broken
internal links) and preview the production output:

```bash
pnpm docs:build
pnpm docs:serve
```

Content lives in `docs/docs/**` as Markdown; the navigation is defined in
`docs/sidebars.ts`. To add a page, create a Markdown file under `docs/docs/` and add
its id to the sidebar.

## Roadmap

### Version: 0.1

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

### Current Version 0.2

- Scoped CSS with compile-time transformation
- `tn-model` two-waybinding ✔︎
- `tn-show` for CSS-based visibility toggle ✔︎
- Slots for content distribution ✔ ︎
- Lifecycle hooks ✔︎

### Version 0.3 (TODO)

- Async components and lazy loading
- Error boundaries
- Teleport for portals
- Transition support

### Version 0.4 (TODO)

- Server-side rendering (SSR)
- Hydration with partial hydration support
- Streaming SSR

### Version 1.0

- Stable API
- Official devtools extension
- Performance benchmarks
- Comprehensive documentation
- Migration guides from Vue/React
