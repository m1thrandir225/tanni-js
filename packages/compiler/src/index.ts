import { generate } from './codegen';
import { parseSfc, parseTemplate } from './parser';
import { scopeCSS } from './scopeCSS';
import { transformTemplate } from './transform';
import type { CompileOptions, CompileResult } from './types';

export type { CompileOptions, CompileResult } from './types';

export function compileSfc(source: string, options: CompileOptions = {}): CompileResult {
  const descriptor = parseSfc(source);
  const hasScoped = descriptor.styles.some((s) => s.scoped);

  let scopeId: string | undefined;
  if (hasScoped) {
    const hash = simpleHash(options.id ?? source);
    scopeId = `data-tn-${hash}`;
  }

  const parsedTemplate = parseTemplate(descriptor.template);
  const transformed = transformTemplate(parsedTemplate);
  const compileOpts: CompileOptions = { ...options, ...(scopeId ? { scopeId } : {}) };
  const result = generate(transformed, descriptor.script, compileOpts);

  const cssBlocks: string[] = [];
  for (const style of descriptor.styles) {
    if (style.content.length === 0) continue;
    if (style.scoped && scopeId) {
      cssBlocks.push(scopeCSS(style.content, scopeId));
    } else {
      cssBlocks.push(style.content);
    }
  }

  return { ...result, css: cssBlocks.join('\n\n') };
}

function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36).slice(0, 8);
}
