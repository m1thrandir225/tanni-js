import { generate } from './codegen';
import { parseSfc, parseTemplate } from './parser';
import { transformTemplate } from './transform';
import type { CompileOptions, CompileResult } from './types';

export type { CompileOptions, CompileResult } from './types';

export function compileSfc(source: string, options: CompileOptions = {}): CompileResult {
  const descriptor = parseSfc(source);
  const parsedTemplate = parseTemplate(descriptor.template);
  const transformed = transformTemplate(parsedTemplate);
  const result = generate(transformed, descriptor.script, options);

  const css = descriptor.styles
    .map((s) => s.content)
    .filter((c) => c.length > 0)
    .join('\n\n');

  return { ...result, css };
}
