import { describe, expect, it, vi } from 'vitest';

import { batch, createEffect, createMemo, createSignal, onCleanup, onMount, untrack } from './reactivity';

describe('reactivity core', () => {
  it('tracks signal reads and reruns effects on updates', () => {
    const [count, setCount] = createSignal(0);
    const values: number[] = [];

    createEffect(() => {
      values.push(count());
    });

    setCount(1);
    setCount((prev) => prev + 1);

    expect(values).toEqual([0, 1, 2]);
  });

  it('batches updates and runs effects once', () => {
    const [count, setCount] = createSignal(0);
    const spy = vi.fn();

    createEffect(() => {
      count();
      spy();
    });

    batch(() => {
      setCount(1);
      setCount(2);
      setCount(3);
    });

    expect(spy).toHaveBeenCalledTimes(2);
    expect(count()).toBe(3);
  });

  it('supports memoized derived values', () => {
    const [count, setCount] = createSignal(2);
    const doubled = createMemo(() => count() * 2);

    expect(doubled()).toBe(4);
    setCount(5);
    expect(doubled()).toBe(10);
  });

  it('recomputes memo only when dependencies change', () => {
    const [count, setCount] = createSignal(1);
    const compute = vi.fn(() => count() * 10);
    const value = createMemo(compute);
    const effectSpy = vi.fn();

    createEffect(() => {
      value();
      effectSpy();
    });

    expect(value()).toBe(10);
    expect(compute).toHaveBeenCalledTimes(1);
    expect(effectSpy).toHaveBeenCalledTimes(1);

    setCount(1);
    expect(compute).toHaveBeenCalledTimes(1);
    expect(effectSpy).toHaveBeenCalledTimes(1);

    setCount(2);
    expect(value()).toBe(20);
    expect(compute).toHaveBeenCalledTimes(2);
    expect(effectSpy).toHaveBeenCalledTimes(2);
  });

  it('supports untrack and effect cleanups', () => {
    const [count, setCount] = createSignal(0);
    const sideEffect = vi.fn();
    const cleanup = vi.fn();

    createEffect(() => {
      sideEffect(untrack(() => count()));
      onCleanup(cleanup);
      count();
    });

    setCount(1);

    expect(sideEffect).toHaveBeenCalledTimes(2);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('runs previous cleanup before the next effect pass', () => {
    const [value, setValue] = createSignal('a');
    const callOrder: string[] = [];

    createEffect(() => {
      const current = value();
      callOrder.push(`effect:${current}`);
      onCleanup(() => {
        callOrder.push(`cleanup:${current}`);
      });
    });

    setValue('b');
    setValue('c');

    expect(callOrder).toEqual([
      'effect:a',
      'cleanup:a',
      'effect:b',
      'cleanup:b',
      'effect:c',
    ]);
  });

  it('supports nested batching with a single downstream rerun', () => {
    const [count, setCount] = createSignal(0);
    const spy = vi.fn();

    createEffect(() => {
      count();
      spy();
    });

    batch(() => {
      setCount(1);
      batch(() => {
        setCount(2);
        setCount(3);
      });
      setCount(4);
    });

    expect(count()).toBe(4);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('preserves explicit TypeScript generics on createSignal', () => {
    interface User {
      name: string;
      age: number;
    }

    const [user, setUser] = createSignal<User>({ name: 'Alice', age: 30 });
    expect(user().name).toBe('Alice');
    expect(user().age).toBe(30);

    setUser({ name: 'Bob', age: 25 });
    expect(user().name).toBe('Bob');

    setUser((prev) => ({ ...prev, age: prev.age + 1 }));
    expect(user().age).toBe(26);
  });

  it('preserves explicit TypeScript generics on createMemo', () => {
    interface Stats {
      total: number;
      label: string;
    }

    const [count, setCount] = createSignal(3);
    const stats = createMemo<Stats>(() => ({
      total: count() * 2,
      label: `Items: ${count()}`,
    }));

    expect(stats().total).toBe(6);
    expect(stats().label).toBe('Items: 3');

    setCount(5);
    expect(stats().total).toBe(10);
    expect(stats().label).toBe('Items: 5');
  });

  it('supports union and nullable types in createSignal', () => {
    const [value, setValue] = createSignal<string | null>(null);
    expect(value()).toBeNull();

    setValue('hello');
    expect(value()).toBe('hello');

    setValue(null);
    expect(value()).toBeNull();
  });

  it('runs onMount callback asynchronously after synchronous setup', async () => {
    const order: string[] = [];

    order.push('before');
    onMount(() => {
      order.push('mounted');
    });
    order.push('after');

    expect(order).toEqual(['before', 'after']);

    await new Promise<void>((resolve) => queueMicrotask(resolve));

    expect(order).toEqual(['before', 'after', 'mounted']);
  });
});
