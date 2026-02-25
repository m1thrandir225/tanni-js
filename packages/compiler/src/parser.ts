import type { ElementNode, RawAttribute, SfcDescriptor, SfcStyleBlock, TemplateNode, TemplateRoot, TextNode } from './types';

const TEMPLATE_BLOCK = /<template\b[^>]*>([\s\S]*?)<\/template>/i;
const SCRIPT_BLOCK = /<script\b([^>]*)>([\s\S]*?)<\/script>/i;
const STYLE_BLOCK = /<style\b([^>]*)>([\s\S]*?)<\/style>/gi;
const LANG_ATTR = /\blang\s*=\s*["']([^"']+)["']/i;
const SCOPED_ATTR = /\bscoped\b/i;

export function parseSfc(source: string): SfcDescriptor {
  const templateMatch = source.match(TEMPLATE_BLOCK);
  if (!templateMatch) {
    throw new Error('Missing <template> block in .tanni file.');
  }
  const templateBlock = templateMatch[1];
  if (!templateBlock) {
    throw new Error('Template block is empty.');
  }

  const scriptMatch = source.match(SCRIPT_BLOCK);
  const scriptAttrs = scriptMatch?.[1] ?? '';
  const scriptLangMatch = scriptAttrs.match(LANG_ATTR);

  const styles: SfcStyleBlock[] = [];
  for (const styleMatch of source.matchAll(STYLE_BLOCK)) {
    const attrs = styleMatch[1] ?? '';
    const langMatch = attrs.match(LANG_ATTR);
    styles.push({
      content: (styleMatch[2] ?? '').trim(),
      lang: langMatch?.[1] ?? null,
      scoped: SCOPED_ATTR.test(attrs),
    });
  }

  return {
    template: templateBlock.trim(),
    script: scriptMatch?.[2]?.trim() ?? '',
    scriptLang: scriptLangMatch?.[1] ?? null,
    styles,
  };
}

export function parseTemplate(templateSource: string): TemplateRoot {
  const root: TemplateRoot = { type: 'Root', children: [] };
  const stack: ElementNode[] = [];

  let index = 0;
  while (index < templateSource.length) {
    if (templateSource[index] === '<') {
      if (templateSource.startsWith('<!--', index)) {
        const closeIndex = templateSource.indexOf('-->', index + 4);
        index = closeIndex === -1 ? templateSource.length : closeIndex + 3;
        continue;
      }

      if (templateSource.startsWith('</', index)) {
        const closeTag = templateSource.slice(index).match(/^<\/\s*([A-Za-z][\w-]*)\s*>/);
        if (!closeTag) {
          throw new Error(`Invalid closing tag near: ${templateSource.slice(index, index + 20)}`);
        }

        const [, tag] = closeTag;
        const current = stack.pop();
        if (!current || current.tag !== tag) {
          throw new Error(`Mismatched closing tag </${tag}>.`);
        }
        index += closeTag[0].length;
        continue;
      }

      const openTag = matchOpenTag(templateSource, index);
      if (!openTag) {
        throw new Error(`Invalid opening tag near: ${templateSource.slice(index, index + 20)}`);
      }

      const tag = openTag.tag;
      const selfClosing = openTag.selfClosing;
      const cleanAttrs = openTag.attrs;

      const node: ElementNode = {
        type: 'Element',
        tag,
        attrs: parseAttributes(cleanAttrs),
        children: [],
      };

      appendChild(stack, root, node);
      index += openTag.length;

      if (!selfClosing) {
        stack.push(node);
      }
      continue;
    }

    const nextTagIndex = templateSource.indexOf('<', index);
    const textContent =
      nextTagIndex === -1 ? templateSource.slice(index) : templateSource.slice(index, nextTagIndex);
    index = nextTagIndex === -1 ? templateSource.length : nextTagIndex;

    if (textContent.trim().length === 0) {
      continue;
    }

    const textNode: TextNode = {
      type: 'Text',
      content: textContent,
    };
    appendChild(stack, root, textNode);
  }

  if (stack.length > 0) {
    const unclosed = stack[stack.length - 1];
    if (!unclosed) {
      throw new Error('Unexpected parser state.');
    }
    throw new Error(`Unclosed tag <${unclosed.tag}>.`);
  }

  return root;
}

function appendChild(stack: ElementNode[], root: TemplateRoot, node: TemplateNode): void {
  if (stack.length === 0) {
    root.children.push(node);
    return;
  }
  const parent = stack[stack.length - 1];
  if (!parent) {
    throw new Error('Unexpected parser state.');
  }
  parent.children.push(node);
}

interface OpenTagMatch {
  tag: string;
  attrs: string;
  selfClosing: boolean;
  length: number;
}

function matchOpenTag(source: string, start: number): OpenTagMatch | null {
  const tagNameMatch = source.slice(start).match(/^<\s*([A-Za-z][\w-]*)/);
  if (!tagNameMatch) {
    return null;
  }
  const tag = tagNameMatch[1]!;
  let cursor = start + tagNameMatch[0].length;

  while (cursor < source.length) {
    const ch = source[cursor];

    if (ch === '"' || ch === "'") {
      const closeQuote = source.indexOf(ch, cursor + 1);
      if (closeQuote === -1) {
        return null;
      }
      cursor = closeQuote + 1;
      continue;
    }

    if (ch === '>') {
      const attrsRaw = source.slice(start + tagNameMatch[0].length, cursor);
      const selfClosing = attrsRaw.trim().endsWith('/');
      const attrs = selfClosing ? attrsRaw.replace(/\/\s*$/, '') : attrsRaw;
      return {
        tag,
        attrs,
        selfClosing,
        length: cursor - start + 1,
      };
    }

    cursor += 1;
  }

  return null;
}

function parseAttributes(raw: string): RawAttribute[] {
  const attributes: RawAttribute[] = [];
  const attrRegex = /([:@A-Za-z_][\w:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

  for (const match of raw.matchAll(attrRegex)) {
    const name = match[1];
    if (!name) {
      continue;
    }
    const value = match[2] ?? match[3] ?? match[4] ?? null;
    attributes.push({ name, value });
  }

  return attributes;
}
