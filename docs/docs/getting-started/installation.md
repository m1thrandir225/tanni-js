---
id: installation
title: Installation
sidebar_label: Installation
---

# Installation

The fastest way to start a Tanni project is the official starter template.

## Requirements

- **Node.js** `>= 21`
- A package manager — `npm`, `yarn`, or `pnpm`

## Scaffold a project

Create a new project from the template with [`degit`](https://github.com/Rich-Harris/degit):

```bash
npx degit m1thrandir225/tanni-js/template <project_name>
```

Then run the setup script with Node:

```bash
cd <project_name> && node setup.js
```

The setup script asks whether you want **Tailwind CSS** support, then prepares the
project files accordingly.

## Install dependencies and start the dev server

Use whichever package manager you prefer:

```bash
npm install
npm run dev
```

```bash
yarn
yarn dev
```

```bash
pnpm install
pnpm dev
```

The dev server is powered by [Vite](https://vite.dev/) and the Tanni Vite plugin,
which compiles your `.tanni` components on the fly. See [Tooling](/guides/tooling)
for how the plugin is wired up.

## Packages

A Tanni project uses these packages:

| Package               | Role                                                        |
| --------------------- | ----------------------------------------------------------- |
| `tannijs`             | The reactive runtime (`createSignal`, `onMount`, and more). |
| `tannijs-compiler`    | Compiles `.tanni` SFCs to JavaScript.                       |
| `vite-plugin-tannijs` | Vite integration that runs the compiler during dev/build.   |

You normally only import from `tannijs` directly in your component scripts — the
compiler and Vite plugin work behind the scenes.

## Editor support

There is an experimental **VSCode extension** that provides syntax highlighting for
`.tanni` files. You can download it from the project's GitHub releases and install it
in your editor.
