---
id: reactivity
title: Reactivity
sidebar_label: Reactivity
---

# Reactivity

Tanni's reactivity is built on **signals**. A signal holds a value and tracks which
computations read it; when the value changes, only those computations re-run. All of
the primitives below are imported from `tannijs`.

```ts
import { createSignal, createEffect, createMemo, batch, untrack } from 'tannijs';
```

## `createSignal`

```ts
function createSignal<T>(initialValue: T): [Accessor<T>, Setter<T>];
```

Creates a reactive value. Returns a `[getter, setter]` tuple:

```ts
const [count, setCount] = createSignal(0);

count();        // read → 0
setCount(5);    // write → 5
setCount((c) => c + 1); // functional update → 6
```

- **Read** by calling the getter: `count()`. Reading inside an effect or memo
  registers a dependency.
- **Write** by calling the setter with a new value or an updater function.
- Updates are skipped when the new value is identical to the current one
  (compared with `Object.is`), so setting a signal to its existing value won't
  trigger re-runs.

## `createEffect`

```ts
function createEffect(fn: () => void): void;
```

Runs `fn` immediately and re-runs it whenever any signal it read changes:

```ts
const [name, setName] = createSignal('Tanni');

createEffect(() => {
  console.log('Name is', name());
});

setName('World'); // logs: "Name is World"
```

Dependencies are tracked automatically on each run, so effects always reflect the
signals they currently read. `effect` is exported as an alias for `createEffect`.

## `createMemo`

```ts
function createMemo<T>(fn: () => T): Accessor<T>;
```

Creates a cached derived value. The memo recomputes only when one of its
dependencies changes, and notifies its own subscribers only when the result
actually changes:

```ts
const [count, setCount] = createSignal(2);
const doubled = createMemo(() => count() * 2);

doubled(); // 4
setCount(5);
doubled(); // 10
```

Use a memo (rather than calling a function inline) when a derived value is expensive
or read in several places.

## `batch`

```ts
function batch<T>(fn: () => T): T;
```

Groups multiple signal writes so dependent computations run **once** after the batch
completes, instead of after each individual write:

```ts
const [first, setFirst] = createSignal('Ada');
const [last, setLast] = createSignal('Lovelace');

createEffect(() => console.log(first(), last()));

batch(() => {
  setFirst('Grace');
  setLast('Hopper');
}); // effect runs a single time after both updates
```

## `untrack`

```ts
function untrack<T>(fn: () => T): T;
```

Reads signals **without** creating a dependency. Useful inside an effect when you
want the current value of a signal but don't want changes to it to re-trigger the
effect:

```ts
createEffect(() => {
  // re-runs when `a` changes, but NOT when `b` changes
  console.log(a(), untrack(() => b()));
});
```

## Lifecycle helpers

`onMount` and `onCleanup` also live in the reactivity module. They're covered in
detail on the [Lifecycle](/guides/lifecycle) page.
