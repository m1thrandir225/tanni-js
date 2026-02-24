#!/usr/bin/env node

import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';

const rl = createInterface({ input: process.stdin, output: process.stdout });

async function main() {
  const cwd = process.cwd();
  const defaultName = basename(cwd);

  console.log('\n  Tanni Project Setup\n');

  const nameAnswer = await rl.question(`  Project name (${defaultName}): `);
  const projectName = nameAnswer.trim() || defaultName;

  const twAnswer = await rl.question('  Use Tailwind CSS? (y/N): ');
  const useTailwind = twAnswer.trim().toLowerCase() === 'y';

  rl.close();

  const pkgPath = resolve(cwd, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  pkg.name = projectName;

  if (useTailwind) {
    pkg.devDependencies['tailwindcss'] = '^4.2.0';
    pkg.devDependencies['@tailwindcss/vite'] = '^4.2.0';

    const viteConfigPath = resolve(cwd, 'vite.config.ts');
    writeFileSync(
      viteConfigPath,
      [
        "import tailwindcss from '@tailwindcss/vite';",
        "import { defineConfig } from 'vite';",
        "import { tanniPlugin } from 'vite-plugin-tannijs';",
        '',
        'export default defineConfig({',
        '  plugins: [tanniPlugin(), tailwindcss()],',
        '});',
        '',
      ].join('\n'),
      'utf-8',
    );

    const cssPath = resolve(cwd, 'assets', 'style.css');
    writeFileSync(cssPath, '@import "tailwindcss";\n', 'utf-8');
  }

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');

  console.log('');
  console.log('  Done! Next steps:');
  console.log('');
  console.log('    pnpm install');
  console.log('    pnpm dev');
  console.log('');

  unlinkSync(resolve(cwd, 'setup.js'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
