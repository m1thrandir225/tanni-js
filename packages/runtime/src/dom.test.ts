import { describe, expect, it, vi } from 'vitest';

import { createSignal } from './reactivity';
import { delegateEvents, insert, spread, template } from './dom';

describe('dom helpers', () => {
  it('creates cloneable template nodes', () => {
    const node = template('<button class="btn">Click</button>');
    const clone = node.cloneNode(true) as HTMLElement;

    expect(clone.tagName).toBe('BUTTON');
    expect(clone.className).toBe('btn');
    expect(clone.textContent).toBe('Click');
  });

  it('inserts reactive text updates', () => {
    const host = document.createElement('div');
    const [count, setCount] = createSignal(0);

    insert(host, () => `Count: ${count()}`);
    expect(host.textContent).toBe('Count: 0');

    setCount(2);
    expect(host.textContent).toBe('Count: 2');
  });

  it('replaces only content before marker in reactive inserts', () => {
    const host = document.createElement('div');
    const marker = document.createComment('marker');
    host.append(document.createTextNode('prefix-'));
    host.append(marker);
    host.append(document.createTextNode('-suffix'));

    const [value, setValue] = createSignal('one');
    insert(host, () => value(), marker);

    expect(host.textContent).toBe('prefix-one-suffix');
    setValue('two');
    expect(host.textContent).toBe('prefix-two-suffix');
    expect(host.lastChild).not.toBe(marker);
    expect(host.childNodes[1]?.nodeType).toBe(Node.TEXT_NODE);
  });

  it('applies properties and delegated events via spread', () => {
    delegateEvents(['click']);

    const host = document.createElement('div');
    const button = document.createElement('button');
    const onClick = vi.fn();

    spread(button, {
      id: 'counter-btn',
      '@click': onClick,
      children: 'Tap',
    });

    host.append(button);
    document.body.append(host);
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(button.id).toBe('counter-btn');
    expect(button.textContent).toBe('Tap');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('supports direct event listeners and replaces previous handlers', () => {
    const button = document.createElement('button');
    const first = vi.fn();
    const second = vi.fn();

    spread(button, { onMouseover: first });
    button.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

    spread(button, { onMouseover: second });
    button.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('supports delegated bubbling and stopPropagation semantics', () => {
    delegateEvents(['click']);
    const host = document.createElement('div');
    const parent = document.createElement('div');
    const button = document.createElement('button');
    const parentHandler = vi.fn();
    const childHandler = vi.fn((event: Event) => event.stopPropagation());

    spread(parent, { '@click': parentHandler });
    spread(button, { '@click': childHandler });

    parent.append(button);
    host.append(parent);
    document.body.append(host);

    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(childHandler).toHaveBeenCalledTimes(1);
    expect(parentHandler).toHaveBeenCalledTimes(0);
  });
});
