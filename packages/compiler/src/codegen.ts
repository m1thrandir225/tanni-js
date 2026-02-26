import type { CompileOptions, CompileResult, TransformElementNode, TransformNode, TransformRoot } from './types';

interface CodegenContext {
  lines: string[];
  indent: number;
  identifier: number;
  delegatedEvents: Set<string>;
}

const DEFAULT_RUNTIME_MODULE = 'tannijs/internals';

export function generate(root: TransformRoot, script: string, options: CompileOptions = {}): CompileResult {
  const runtimeModule = options.runtimeModule ?? DEFAULT_RUNTIME_MODULE;
  const componentName = options.componentName ?? 'Component';
  const preparedScript = rewriteScriptSetupProps(script);
  const scriptParts = splitScriptParts(preparedScript);
  const context: CodegenContext = {
    lines: [],
    indent: 0,
    identifier: 0,
    delegatedEvents: new Set<string>(),
  };

  for (const scriptImport of scriptParts.imports) {
    pushLine(context, scriptImport);
  }
  if (scriptParts.imports.length > 0) {
    pushLine(context, '');
  }

  pushLine(context, `import { createEffect, delegateEvents } from '${runtimeModule}';`);
  pushLine(context, '');
  pushLine(context, `export default function ${componentName}(__props = {}) {`);
  context.indent += 1;

  if (scriptParts.body.length > 0) {
    for (const line of scriptParts.body.split('\n')) {
      pushLine(context, line);
    }
    pushLine(context, '');
  }

  const rootNodeName = declareNode(context, 'document.createDocumentFragment()');
  emitChildren(context, root.children, rootNodeName);

  if (context.delegatedEvents.size > 0) {
    const eventList = Array.from(context.delegatedEvents)
      .sort()
      .map((eventName) => JSON.stringify(eventName))
      .join(', ');
    pushLine(context, `delegateEvents([${eventList}]);`);
  }

  pushLine(context, `return ${rootNodeName};`);
  context.indent -= 1;
  pushLine(context, '}');

  return { code: `${context.lines.join('\n')}\n`, css: '' };
}

function emitChildren(context: CodegenContext, children: TransformNode[], parentName: string): void {
  let i = 0;
  while (i < children.length) {
    const child = children[i]!;

    if (child.type === 'Element' && child.directives.if) {
      const chain: TransformElementNode[] = [child];
      let j = i + 1;
      while (j < children.length) {
        const sibling = children[j]!;
        if (sibling.type === 'Text') {
          const isWhitespace = sibling.segments.every(
            (s) => s.type === 'static' && s.value.trim().length === 0
          );
          if (isWhitespace) {
            j += 1;
            continue;
          }
          break;
        }
        if (sibling.type === 'Element' && (sibling.directives.elseIf || sibling.directives.else)) {
          chain.push(sibling);
          j += 1;
          if (sibling.directives.else) break;
          continue;
        }
        break;
      }
      emitConditionalChain(context, chain, parentName);
      i = j;
      continue;
    }

    if (child.type === 'Element' && (child.directives.elseIf || child.directives.else)) {
      throw new Error(`${child.directives.elseIf ? 'tn-else-if' : 'tn-else'} without a preceding tn-if on <${child.tag}>.`);
    }

    emitNode(context, child, parentName);
    i += 1;
  }
}

function emitNode(context: CodegenContext, node: TransformNode, parentName: string): void {
  if (node.type === 'Text') {
    emitTextNode(context, node, parentName);
    return;
  }

  if (node.directives.for) {
    emitForNode(context, node, parentName);
    return;
  }

  if (node.directives.if) {
    emitConditionalChain(context, [node], parentName);
    return;
  }

  emitPlainElement(context, node, parentName);
}

function emitTextNode(context: CodegenContext, node: Extract<TransformNode, { type: 'Text' }>, parentName: string): void {
  const textNodeName = declareNode(context, "document.createTextNode('')");
  pushLine(context, `${parentName}.append(${textNodeName});`);

  const hasDynamic = node.segments.some((segment) => segment.type === 'dynamic');
  if (!hasDynamic) {
    const staticValue = node.segments
      .map((segment) => (segment.type === 'static' ? segment.value : ''))
      .join('');
    pushLine(context, `${textNodeName}.data = ${JSON.stringify(staticValue)};`);
    return;
  }

  pushLine(context, 'createEffect(() => {');
  context.indent += 1;
  const valueExpression = node.segments
    .map((segment) => {
      if (segment.type === 'static') {
        return JSON.stringify(segment.value);
      }
      return `String(${segment.expression})`;
    })
    .join(' + ');
  pushLine(context, `${textNodeName}.data = ${valueExpression};`);
  context.indent -= 1;
  pushLine(context, '});');
}

function emitPlainElement(context: CodegenContext, node: TransformElementNode, parentName: string): string {
  if (node.isComponent) {
    return emitComponentElement(context, node, parentName);
  }

  const elementName = declareNode(context, `document.createElement(${JSON.stringify(node.tag)})`);
  pushLine(context, `${parentName}.append(${elementName});`);

  for (const attr of node.attributes) {
    pushLine(context, `${elementName}.setAttribute(${JSON.stringify(attr.name)}, ${JSON.stringify(attr.value)});`);
  }

  for (const binding of node.bindings) {
    pushLine(context, 'createEffect(() => {');
    context.indent += 1;
    const valueName = createIdentifier(context, 'attrValue');
    pushLine(context, `const ${valueName} = ${binding.expression};`);
    pushLine(context, `if (${valueName} == null || ${valueName} === false) {`);
    context.indent += 1;
    pushLine(context, `${elementName}.removeAttribute(${JSON.stringify(binding.name)});`);
    context.indent -= 1;
    pushLine(context, '} else {');
    context.indent += 1;
    pushLine(context, `${elementName}.setAttribute(${JSON.stringify(binding.name)}, String(${valueName}));`);
    context.indent -= 1;
    pushLine(context, '}');
    context.indent -= 1;
    pushLine(context, '});');
  }

  for (const eventBinding of node.events) {
    context.delegatedEvents.add(eventBinding.name.toLowerCase());
    pushLine(
      context,
      `${elementName}.__tnDelegatedHandlers ??= {};`
    );
    const handlerExpr = toEventHandler(eventBinding.expression);
    pushLine(
      context,
      `${elementName}.__tnDelegatedHandlers[${JSON.stringify(eventBinding.name.toLowerCase())}] = ${handlerExpr};`
    );
  }

  emitChildren(context, node.children, elementName);

  return elementName;
}

function emitComponentElement(context: CodegenContext, node: TransformElementNode, parentName: string): string {
  const propEntries: string[] = [];

  for (const attr of node.attributes) {
    propEntries.push(`${JSON.stringify(attr.name)}: ${JSON.stringify(attr.value)}`);
  }

  for (const binding of node.bindings) {
    propEntries.push(`get ${JSON.stringify(binding.name)}() { return ${binding.expression}; }`);
  }

  for (const eventBinding of node.events) {
    const eventPropName = `on${eventBinding.name.charAt(0).toUpperCase()}${eventBinding.name.slice(1)}`;
    const handlerExpr = toEventHandler(eventBinding.expression);
    propEntries.push(`${JSON.stringify(eventPropName)}: ${handlerExpr}`);
  }

  const propsArg = propEntries.length > 0 ? `{ ${propEntries.join(', ')} }` : '{}';

  const componentName = declareNode(context, `${node.tag}(${propsArg})`);
  pushLine(context, `${parentName}.append(${componentName});`);

  emitChildren(context, node.children, componentName);

  return componentName;
}

function emitConditionalChain(context: CodegenContext, chain: TransformElementNode[], parentName: string): void {
  const endMarker = declareNode(context, "document.createComment('tn-if')");
  pushLine(context, `${parentName}.append(${endMarker});`);
  const nodesName = createIdentifier(context, 'ifNodes');
  pushLine(context, `let ${nodesName} = [];`);
  pushLine(context, 'createEffect(() => {');
  context.indent += 1;
  pushLine(context, `for (const __n of ${nodesName}) {`);
  context.indent += 1;
  pushLine(context, `if (__n.parentNode === ${parentName}) ${parentName}.removeChild(__n);`);
  context.indent -= 1;
  pushLine(context, '}');
  pushLine(context, `${nodesName} = [];`);

  for (let branchIdx = 0; branchIdx < chain.length; branchIdx += 1) {
    const branch = chain[branchIdx]!;

    if (branch.directives.if) {
      pushLine(context, `if (${branch.directives.if}) {`);
    } else if (branch.directives.elseIf) {
      pushLine(context, `} else if (${branch.directives.elseIf}) {`);
    } else {
      pushLine(context, '} else {');
    }
    context.indent += 1;

    const fragmentName = declareNode(context, 'document.createDocumentFragment()');
    emitPlainElement(context, removeControlFlow(branch), fragmentName);
    const branchNodes = createIdentifier(context, 'branchNodes');
    pushLine(context, `const ${branchNodes} = Array.from(${fragmentName}.childNodes);`);
    pushLine(context, `for (const __n of ${branchNodes}) ${parentName}.insertBefore(__n, ${endMarker});`);
    pushLine(context, `${nodesName} = ${branchNodes};`);
    context.indent -= 1;
  }

  pushLine(context, '}');
  context.indent -= 1;
  pushLine(context, '});');
}

function emitForNode(context: CodegenContext, node: TransformElementNode, parentName: string): void {
  const forDirective = node.directives.for;
  if (!forDirective) {
    return;
  }

  const endMarker = declareNode(context, "document.createComment('tn-for')");
  pushLine(context, `${parentName}.append(${endMarker});`);
  const renderedName = createIdentifier(context, 'forNodes');
  pushLine(context, `let ${renderedName} = [];`);
  pushLine(context, 'createEffect(() => {');
  context.indent += 1;
  pushLine(context, `for (const node of ${renderedName}) {`);
  context.indent += 1;
  pushLine(context, `if (node.parentNode === ${parentName}) ${parentName}.removeChild(node);`);
  context.indent -= 1;
  pushLine(context, '}');
  pushLine(context, `${renderedName} = [];`);
  const listName = createIdentifier(context, 'forList');
  pushLine(context, `const ${listName} = ${forDirective.listExpression} ?? [];`);
  pushLine(context, `for (let __i = 0; __i < ${listName}.length; __i += 1) {`);
  context.indent += 1;
  pushLine(context, `const ${forDirective.itemAlias} = ${listName}[__i];`);
  if (forDirective.indexAlias) {
    pushLine(context, `const ${forDirective.indexAlias} = __i;`);
  }
  const fragmentName = declareNode(context, 'document.createDocumentFragment()');
  emitPlainElement(context, removeControlFlow(node), fragmentName);
  const loopNodes = createIdentifier(context, 'loopNodes');
  pushLine(context, `const ${loopNodes} = Array.from(${fragmentName}.childNodes);`);
  pushLine(context, `for (const node of ${loopNodes}) ${parentName}.insertBefore(node, ${endMarker});`);
  pushLine(context, `${renderedName}.push(...${loopNodes});`);
  context.indent -= 1;
  pushLine(context, '}');
  context.indent -= 1;
  pushLine(context, '});');
}

function removeControlFlow(node: TransformElementNode): TransformElementNode {
  return {
    ...node,
    directives: {},
  };
}

function rewriteScriptSetupProps(script: string): string {
  if (script.trim().length === 0) {
    return '';
  }

  return script
    .replace(/withDefaults\s*\(\s*defineProps\s*(?:<[^>]+>\s*)?\(\s*\)\s*,\s*(\{[^}]*\})\s*\)/g, 'Object.create($1, Object.getOwnPropertyDescriptors(__props))')
    .replace(/defineProps\s*(?:<[^>]+>\s*)?\(\s*(\{[^}]*\})\s*\)/g, 'Object.create($1, Object.getOwnPropertyDescriptors(__props))')
    .replace(/defineProps\s*<[^>]+>\s*\(\s*\)/g, '__props')
    .replace(/defineProps\s*\(\s*\)/g, '__props');
}

function splitScriptParts(script: string): { imports: string[]; body: string } {
  const imports: string[] = [];
  const bodyLines: string[] = [];

  const lines = script.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    const trimmed = line.trim();

    if (trimmed.startsWith('import ')) {
      const stripped = stripTypeOnlyImport(trimmed);
      if (stripped !== null) {
        imports.push(stripped);
      }
      i += 1;
      continue;
    }

    if (isTypeOnlyDeclaration(trimmed)) {
      i = skipBracedBlock(lines, i);
      continue;
    }

    bodyLines.push(line);
    i += 1;
  }

  return {
    imports: imports.filter((line) => line.trim().length > 0),
    body: bodyLines.join('\n').trim(),
  };
}

/**
 * Returns null for pure type-only imports (should be dropped entirely).
 * For mixed imports with inline `type` specifiers, strips the `type` keyword.
 */
function stripTypeOnlyImport(line: string): string | null {
  if (/^import\s+type\s+/.test(line)) {
    return null;
  }

  return line.replace(/\btype\s+(?=\w)/g, '');
}

function isTypeOnlyDeclaration(trimmedLine: string): boolean {
  return (
    /^(export\s+)?interface\s+/.test(trimmedLine) ||
    /^(export\s+)?type\s+\w+\s*[=<]/.test(trimmedLine)
  );
}

function skipBracedBlock(lines: string[], startIndex: number): number {
  let depth = 0;
  let i = startIndex;
  while (i < lines.length) {
    const line = lines[i]!;
    for (const ch of line) {
      if (ch === '{') depth += 1;
      if (ch === '}') depth -= 1;
    }
    i += 1;
    if (depth <= 0) break;
  }
  return i;
}

function declareNode(context: CodegenContext, expression: string): string {
  const name = createIdentifier(context, 'node');
  pushLine(context, `const ${name} = ${expression};`);
  return name;
}

function createIdentifier(context: CodegenContext, base: string): string {
  const id = context.identifier;
  context.identifier += 1;
  return `__${base}${id}`;
}

function toEventHandler(expression: string): string {
  const trimmed = expression.trim();

  if (/^\w+$/.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('(') || trimmed.startsWith('function') || /^\w+\s*=>/.test(trimmed)) {
    return trimmed;
  }

  return `(event) => { ${trimmed}; }`;
}

function pushLine(context: CodegenContext, line: string): void {
  context.lines.push(`${'  '.repeat(context.indent)}${line}`);
}
