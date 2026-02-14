import { describe, expect, it, vi } from 'vitest';

import { batch, createEffect, createMemo, createSignal, onCleanup, untrack } from './reactivity';

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
});
