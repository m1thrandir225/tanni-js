import { createEffect } from './reactivity';

export type InsertValue =
  | Node
  | string
  | number
  | boolean
  | null
  | undefined
  | InsertValue[]
  | (() => InsertValue);

type EventHandler = (event: Event) => void;

const delegatedEvents = new Set<string>();
const listeningEvents = new Set<string>();
const directListeners = new WeakMap<Element, Map<string, EventHandler>>();

export function template(html: string): Node {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();

  if (tpl.content.childNodes.length === 1) {
    return tpl.content.firstChild as Node;
  }

  return tpl.content;
}

export function insert(parent: Node, value: InsertValue, marker: Node | null = null): void {
  if (typeof value === 'function') {
    let currentNodes: Node[] = [];
    createEffect(() => {
      const resolved = (value as () => InsertValue)();
      const nextNodes = normalizeNodes(resolved);
      currentNodes = replaceNodes(parent, currentNodes, nextNodes, marker);
    });
    return;
  }

  const nextNodes = normalizeNodes(value);
  replaceNodes(parent, [], nextNodes, marker);
}

export function spread(element: Element, props: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') {
      insert(element, value as InsertValue);
      continue;
    }

    if (key === 'style' && value && typeof value === 'object') {
      Object.assign((element as HTMLElement).style, value as Record<string, string>);
      continue;
    }

    const eventName = toEventName(key);
    if (eventName) {
      applyEventHandler(element, eventName, value);
      continue;
    }

    applyProperty(element, key, value);
  }
}

export function delegateEvents(eventNames: string[]): void {
  for (const eventName of eventNames) {
    const normalized = eventName.toLowerCase();
    delegatedEvents.add(normalized);

    if (listeningEvents.has(normalized)) {
      continue;
    }

    listeningEvents.add(normalized);
    document.addEventListener(normalized, handleDelegatedEvent);
  }
}

function handleDelegatedEvent(event: Event): void {
  const type = event.type.toLowerCase();
  let node: Node | null = event.target as Node | null;

  while (node && node !== document) {
    if (node instanceof Element) {
      const handlers = (node as DelegatedElement).__tnDelegatedHandlers;
      const handler = handlers?.[type];
      if (handler) {
        handler(event);
        if (event.cancelBubble) {
          return;
        }
      }
    }
    node = node.parentNode;
  }
}

function applyEventHandler(element: Element, eventName: string, value: unknown): void {
  if (typeof value !== 'function') {
    return;
  }

  const handler = value as EventHandler;
  if (delegatedEvents.has(eventName)) {
    const delegatedElement = element as DelegatedElement;
    delegatedElement.__tnDelegatedHandlers ??= {};
    delegatedElement.__tnDelegatedHandlers[eventName] = handler;
    return;
  }

  let listenersForElement = directListeners.get(element);
  if (!listenersForElement) {
    listenersForElement = new Map<string, EventHandler>();
    directListeners.set(element, listenersForElement);
  }

  const previous = listenersForElement.get(eventName);
  if (previous) {
    element.removeEventListener(eventName, previous);
  }

  listenersForElement.set(eventName, handler);
  element.addEventListener(eventName, handler);
}

function applyProperty(element: Element, key: string, value: unknown): void {
  const writableElement = element as unknown as Record<string, unknown>;

  if (value === false || value == null) {
    element.removeAttribute(key);
    if (key in element) {
      writableElement[key] = '';
    }
    return;
  }

  if (key in element && !key.startsWith('aria-') && !key.startsWith('data-')) {
    writableElement[key] = value;
    return;
  }

  element.setAttribute(key, String(value));
}

function toEventName(key: string): string | null {
  if (key.startsWith('on:')) {
    return key.slice(3).toLowerCase();
  }

  if (key.startsWith('@')) {
    return key.slice(1).toLowerCase();
  }

  if (key.startsWith('on') && key.length > 2) {
    return key.slice(2).toLowerCase();
  }

  return null;
}

function normalizeNodes(value: InsertValue): Node[] {
  if (value == null || value === false || value === true) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => normalizeNodes(entry));
  }

  if (value instanceof Node) {
    return [value];
  }

  return [document.createTextNode(String(value))];
}

function replaceNodes(parent: Node, currentNodes: Node[], nextNodes: Node[], marker: Node | null): Node[] {
  for (const node of currentNodes) {
    if (node.parentNode === parent) {
      parent.removeChild(node);
    }
  }

  for (const node of nextNodes) {
    parent.insertBefore(node, marker);
  }

  return nextNodes;
}

interface DelegatedElement extends Element {
  __tnDelegatedHandlers?: Record<string, EventHandler>;
}
