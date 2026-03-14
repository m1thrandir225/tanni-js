/**
 * Rewrites CSS selectors to include a scoping attribute selector,
 * ensuring styles don't leak outside the component.
 *
 * Handles common selectors: tag, .class, #id, combinators, pseudo-classes,
 * pseudo-elements, and comma-separated selector lists.
 */
export function scopeCSS(css: string, scopeId: string): string {
  const attr = `[${scopeId}]`;
  return css.replace(
    /([^{}@/]+)(\{[^}]*\})/g,
    (_match, selectorBlock: string, body: string) => {
      const scopedSelectors = selectorBlock
        .split(',')
        .map((selector) => scopeSelector(selector.trim(), attr))
        .join(', ');
      return `${scopedSelectors} ${body}`;
    },
  );
}

function scopeSelector(selector: string, attr: string): string {
  if (selector.length === 0) return selector;

  const pseudoElementRe = /(::[\w-]+(?:\([^)]*\))?)$/;
  const pseudoElementMatch = selector.match(pseudoElementRe);

  let base = selector;
  let pseudoSuffix = '';
  if (pseudoElementMatch) {
    base = selector.slice(0, -pseudoElementMatch[0].length);
    pseudoSuffix = pseudoElementMatch[0];
  }

  const parts = splitOnCombinators(base);
  if (parts.length === 0) return selector;

  const lastIdx = parts.length - 1;
  parts[lastIdx] = appendAttr(parts[lastIdx]!, attr);

  return parts.join('') + pseudoSuffix;
}

/**
 * Splits a compound selector on combinators (` `, `>`, `+`, `~`),
 * keeping the combinator tokens in the array so we can reconstruct.
 */
function splitOnCombinators(selector: string): string[] {
  const parts: string[] = [];
  const re = /(\s*[>+~]\s*|\s+)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(selector)) !== null) {
    if (match.index > last) {
      parts.push(selector.slice(last, match.index));
    }
    parts.push(match[0]);
    last = re.lastIndex;
  }
  if (last < selector.length) {
    parts.push(selector.slice(last));
  }
  return parts;
}

function appendAttr(segment: string, attr: string): string {
  const pseudoClassRe = /(:[\w-]+(?:\([^)]*\))?)$/;
  const pseudoMatch = segment.match(pseudoClassRe);
  if (pseudoMatch) {
    return segment.slice(0, -pseudoMatch[0].length) + attr + pseudoMatch[0];
  }
  return segment + attr;
}
