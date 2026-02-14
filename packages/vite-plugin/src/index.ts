import path from 'node:path';
import type { Plugin } from 'vite';

import { compileSfc } from '../../compiler/src/index';

export interface TanniPluginOptions {
  runtimeModule?: string;
}

const TANNI_EXTENSION = '.tanni';

export function tanniPlugin(options: TanniPluginOptions = {}): Plugin {
  return {
    name: 'tanni-plugin',
    enforce: 'pre',
    transform(source, id) {
      if (!id.endsWith(TANNI_EXTENSION)) {
        return null;
      }

      const runtimeModule =
        options.runtimeModule ?? toRuntimeImport(path.dirname(id), path.resolve(process.cwd(), 'packages/runtime/src/index.ts'));
      const result = compileSfc(source, {
        id,
        componentName: inferComponentName(id),
        runtimeModule,
      });

      return {
        code: result.code,
        map: null,
      };
    },
  };
}

function toRuntimeImport(fromDirectory: string, runtimeEntry: string): string {
  const relative = path.relative(fromDirectory, runtimeEntry);
  const withPosixSeparators = relative.split(path.sep).join('/');
  const withoutExtension = withPosixSeparators.replace(/\.ts$/, '');
  return withoutExtension.startsWith('.') ? withoutExtension : `./${withoutExtension}`;
}

function inferComponentName(filePath: string): string {
  const fileName = path.basename(filePath, TANNI_EXTENSION);
  const sanitized = fileName.replace(/[^A-Za-z0-9_$]/g, '_');
  if (sanitized.length === 0) {
    return 'Component';
  }
  if (/^[0-9]/.test(sanitized)) {
    return `Component_${sanitized}`;
  }
  return sanitized;
}
