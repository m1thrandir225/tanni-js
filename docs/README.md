# Tanni Documentation

The documentation site for [Tanni](../README.md), built with
[Docusaurus](https://docusaurus.io/).

This package (`tanni-docs`) is part of the pnpm workspace, so install dependencies
once from the repository root.

## Local development

From the repo root:

```bash
pnpm install
pnpm docs:dev
```

Starts a local dev server at http://localhost:3000 with live reload.

## Build

```bash
pnpm docs:build   # generates static files into docs/build
pnpm docs:serve   # serves the production build locally
```

The build fails on broken internal links, so it doubles as a link checker.

## Authoring

- Content lives in `docs/` as Markdown (`.md`, parsed as CommonMark).
- Navigation is defined explicitly in `sidebars.ts`.
- To add a page, create a Markdown file under `docs/` and add its id to the sidebar.

Document only features that are implemented; anything planned-but-unbuilt belongs on
the `Roadmap` page.
