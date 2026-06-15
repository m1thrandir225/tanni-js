import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Tanni',
  tagline: 'A TypeScript-first frontend framework with Vue-like syntax and signal-based reactivity',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here.
  // Update these when you pick a host (e.g. GitHub Pages).
  url: 'https://tanni.dev',
  // Set the /<baseUrl>/ pathname under which your site is served.
  baseUrl: '/',

  // GitHub repo metadata (used for "Edit this page" links).
  organizationName: 'm1thrandir225',
  projectName: 'tanni-js',

  onBrokenLinks: 'throw',

  // Parse .md as CommonMark (and .mdx as MDX). Our docs contain a lot of
  // `{{ }}`, `<template>` and `<T>`-style syntax that MDX would try to
  // interpret; CommonMark keeps it literal.
  markdown: {
    format: 'detect',
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          // Docs-only mode: serve the docs at the site root.
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/m1thrandir225/tanni-js/tree/master/docs/',
        },
        // No blog for the docs site.
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Tanni',
      logo: {
        alt: 'Tanni Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://github.com/m1thrandir225/tanni-js',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Introduction', to: '/' },
            { label: 'Getting Started', to: '/getting-started/installation' },
            { label: 'Roadmap', to: '/roadmap' },
          ],
        },
        {
          title: 'Guides',
          items: [
            { label: 'Reactivity', to: '/guides/reactivity' },
            { label: 'Components', to: '/guides/components' },
            { label: 'Directives', to: '/guides/directives' },
          ],
        },
        {
          title: 'More',
          items: [{ label: 'GitHub', href: 'https://github.com/m1thrandir225/tanni-js' }],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Tanni. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'typescript', 'tsx', 'scss', 'diff', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
