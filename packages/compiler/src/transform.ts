import type {
  DirectiveMap,
  ForDirective,
  TemplateNode,
  TemplateRoot,
  TextSegment,
  TransformElementNode,
  TransformNode,
  TransformRoot,
  TransformTextNode,
} from './types';

const FOR_PATTERN = /^\s*(\w+)(?:\s*,\s*(\w+))?\s+in\s+(.+)\s*$/;
const INTERPOLATION_PATTERN = /\{\{\s*([^}]+?)\s*\}\}/g;

export function transformTemplate(root: TemplateRoot): TransformRoot {
  return {
    type: 'Root',
    children: root.children.map((node) => transformNode(node)),
  };
}

function transformNode(node: TemplateNode): TransformNode {
  if (node.type === 'Text') {
    return transformText(node.content);
  }

  const directives: DirectiveMap = {};
  const attributes: TransformElementNode['attributes'] = [];
  const bindings: TransformElementNode['bindings'] = [];
  const events: TransformElementNode['events'] = [];

  for (const attr of node.attrs) {
    if (attr.name === 'tn-if') {
      if (!attr.value) {
        throw new Error('tn-if requires an expression value.');
      }
      directives.if = attr.value;
      continue;
    }

    if (attr.name === 'tn-for') {
      if (!attr.value) {
        throw new Error('tn-for requires an expression value.');
      }
      directives.for = parseForDirective(attr.value);
      continue;
    }

    if (attr.name.startsWith(':')) {
      if (!attr.value) {
        throw new Error(`${attr.name} requires an expression value.`);
      }
      bindings.push({
        name: attr.name.slice(1),
        expression: attr.value,
      });
      continue;
    }

    if (attr.name.startsWith('@')) {
      if (!attr.value) {
        throw new Error(`${attr.name} requires an event handler expression.`);
      }
      events.push({
        name: attr.name.slice(1),
        expression: attr.value,
      });
      continue;
    }

    attributes.push({
      name: attr.name,
      value: attr.value ?? '',
    });
  }

  return {
    type: 'Element',
    tag: node.tag,
    isComponent: /^[A-Z]/.test(node.tag),
    attributes,
    bindings,
    events,
    directives,
    children: node.children.map((child) => transformNode(child)),
  };
}

function parseForDirective(value: string): ForDirective {
  const match = value.match(FOR_PATTERN);
  if (!match) {
    throw new Error(`Invalid tn-for expression "${value}". Expected "item in list" or "item, index in list".`);
  }

  return {
    itemAlias: match[1] ?? 'item',
    indexAlias: match[2] ?? null,
    listExpression: (match[3] ?? '').trim(),
  };
}

function transformText(content: string): TransformTextNode {
  const segments = splitTextSegments(content);
  return {
    type: 'Text',
    segments: segments.length > 0 ? segments : [{ type: 'static', value: content }],
  };
}

function splitTextSegments(content: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const match of content.matchAll(INTERPOLATION_PATTERN)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      segments.push({ type: 'static', value: content.slice(cursor, start) });
    }

    const expression = match[1]?.trim();
    if (expression) {
      segments.push({ type: 'dynamic', expression });
    }

    cursor = start + match[0].length;
  }

  if (cursor < content.length) {
    segments.push({ type: 'static', value: content.slice(cursor) });
  }

  return segments;
}
