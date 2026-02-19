import type { CompileOptions, CompileResult, TransformElementNode, TransformNode, TransformRoot } from './types';

interface CodegenContext {
  lines: string[];
  indent: number;
  identifier: number;
  delegatedEvents: Set<string>;
}

const DEFAULT_RUNTIME_MODULE = '../../runtime/src/index';

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
  for (const child of root.children) {
    emitNode(context, child, rootNodeName);
  }

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

  return { code: `${context.lines.join('\n')}\n` };
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
    emitIfNode(context, node, parentName);
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

  for (const child of node.children) {
    emitNode(context, child, elementName);
  }

  return elementName;
}

function emitIfNode(context: CodegenContext, node: TransformElementNode, parentName: string): void {
  const endMarker = declareNode(context, "document.createComment('tn-if')");
  pushLine(context, `${parentName}.append(${endMarker});`);
  const nodesName = createIdentifier(context, 'ifNodes');
  pushLine(context, `let ${nodesName} = [];`);
  pushLine(context, 'createEffect(() => {');
  context.indent += 1;
  pushLine(context, `for (const node of ${nodesName}) {`);
  context.indent += 1;
  pushLine(context, `if (node.parentNode === ${parentName}) ${parentName}.removeChild(node);`);
  context.indent -= 1;
  pushLine(context, '}');
  pushLine(context, `${nodesName} = [];`);
  pushLine(context, `if (${node.directives.if}) {`);
  context.indent += 1;
  const fragmentName = declareNode(context, 'document.createDocumentFragment()');
  emitPlainElement(context, removeControlFlow(node), fragmentName);
  const nextNodesName = createIdentifier(context, 'nextIfNodes');
  pushLine(context, `const ${nextNodesName} = Array.from(${fragmentName}.childNodes);`);
  pushLine(context, `for (const node of ${nextNodesName}) ${parentName}.insertBefore(node, ${endMarker});`);
  pushLine(context, `${nodesName} = ${nextNodesName};`);
  context.indent -= 1;
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
    .replace(/defineProps\s*<([^>]+)>\s*\(\s*\)/g, '(__props as $1)')
    .replace(/defineProps\s*\(\s*\)/g, '__props');
}

function splitScriptParts(script: string): { imports: string[]; body: string } {
  const imports: string[] = [];
  const bodyLines: string[] = [];

  for (const line of script.split('\n')) {
    if (line.trim().startsWith('import ')) {
      imports.push(line);
      continue;
    }
    bodyLines.push(line);
  }

  return {
    imports: imports.filter((line) => line.trim().length > 0),
    body: bodyLines.join('\n').trim(),
  };
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
