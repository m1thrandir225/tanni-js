import { generate } from './codegen';
import { parseSfc, parseTemplate } from './parser';
import { transformTemplate } from './transform';
import type { CompileOptions, CompileResult } from './types';

export function compileSfc(source: string, options: CompileOptions = {}): CompileResult {
  const descriptor = parseSfc(source);
  const parsedTemplate = parseTemplate(descriptor.template);
  const transformed = transformTemplate(parsedTemplate);
  return generate(transformed, descriptor.script, options);
}

export { generate } from './codegen';
export { parseSfc, parseTemplate } from './parser';
export { transformTemplate } from './transform';
export type { CompileOptions, CompileResult } from './types';
