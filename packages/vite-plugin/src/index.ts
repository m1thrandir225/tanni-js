import path from 'node:path';
import type { Plugin } from 'vite';

import { compileSfc } from '../../compiler/src/index';

export interface TanniPluginOptions {
  runtimeModule?: string;
}

const TANNI_EXTENSION = '.tanni';
const VIRTUAL_CSS_SUFFIX = '.tanni.css';
const VIRTUAL_CSS_PREFIX = '\0';

export function tanniPlugin(options: TanniPluginOptions = {}): Plugin {
  const cssCache = new Map<string, string>();

  return {
    name: 'tanni-plugin',
    enforce: 'pre',

    resolveId(source) {
      if (source.endsWith(VIRTUAL_CSS_SUFFIX)) {
        return VIRTUAL_CSS_PREFIX + source;
      }
      return null;
    },

    load(id) {
      if (id.startsWith(VIRTUAL_CSS_PREFIX) && id.endsWith(VIRTUAL_CSS_SUFFIX)) {
        const realId = id.slice(VIRTUAL_CSS_PREFIX.length);
        return cssCache.get(realId) ?? '';
      }
      return null;
    },

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

      let code = result.code;

      if (result.css.length > 0) {
        const virtualCssId = id + '.css';
        cssCache.set(virtualCssId, result.css);
        code = `import ${JSON.stringify(virtualCssId)};\n${code}`;
      }

      return {
        code,
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
