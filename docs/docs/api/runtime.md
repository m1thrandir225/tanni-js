---
id: runtime
title: Runtime API (tannijs)
sidebar_label: Runtime (tannijs)
---

# Runtime API

This is the complete public surface of the `tannijs` package. Most apps only use the
reactivity and lifecycle functions; the DOM utilities are low-level helpers that the
compiler also emits.

```ts
import {
  createSignal,
  createEffect,
  createMemo,
  effect,
  batch,
  untrack,
  onMount,
  onCleanup,
  template,
  insert,
  spread,
  delegateEvents,
} from 'tannijs';
```

## Reactivity

See the [Reactivity guide](/guides/reactivity) for examples.

| Export                            | Signature                                                | Description                                                              |
| --------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------ |
| `createSignal`                    | `<T>(initialValue: T) => [Accessor<T>, Setter<T>]`       | Creates a reactive value as a `[getter, setter]` tuple.                  |
| `createEffect`                    | `(fn: () => void) => void`                               | Runs `fn` immediately and re-runs it when its tracked signals change.   |
| `effect`                          | `(fn: () => void) => void`                               | Alias for `createEffect`.                                                |
| `createMemo`                      | `<T>(fn: () => T) => Accessor<T>`                        | Cached derived value; recomputes only when dependencies change.         |
| `batch`                           | `<T>(fn: () => T) => T`                                  | Defers dependent computations until the batch completes.                |
| `untrack`                         | `<T>(fn: () => T) => T`                                  | Reads signals inside `fn` without registering them as dependencies.     |

## Lifecycle

See the [Lifecycle guide](/guides/lifecycle).

| Export      | Signature                  | Description                                                                         |
| ----------- | -------------------------- | ----------------------------------------------------------------------------------- |
| `onMount`   | `(fn: () => void) => void` | Runs `fn` after the component's setup completes.                                    |
| `onCleanup` | `(fn: () => void) => void` | Registers teardown; must be called inside a tracked computation (effect or memo).  |

## Types

```ts
type Accessor<T> = () => T;
type Setter<T> = (value: T | ((prev: T) => T)) => T;
```

- `Accessor<T>` — a signal getter; call it to read the value.
- `Setter<T>` — a signal setter; pass a new value or an updater function. Returns the
  resulting value.

## DOM utilities

These low-level helpers are used by compiled component output. You generally won't
call them directly, but they're part of the public API.

| Export           | Signature                                                              | Description                                                                                  |
| ---------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `template`       | `(html: string) => Node`                                              | Builds a DOM node (or fragment) from an HTML string.                                          |
| `insert`         | `(parent: Node, value: InsertValue, marker?: Node \| null) => void`  | Inserts a value into `parent`; if `value` is a function it's tracked and updated reactively. |
| `spread`         | `(element: Element, props: Record<string, unknown>) => void`         | Applies a props object to an element (attributes, `style`, `children`, and event handlers).  |
| `delegateEvents` | `(eventNames: string[]) => void`                                     | Registers delegated listeners on `document` for the given event names.                       |

### `InsertValue`

```ts
type InsertValue =
  | Node
  | string
  | number
  | boolean
  | null
  | undefined
  | InsertValue[]
  | (() => InsertValue);
```

:::note `tannijs/internals`
Compiled components import their runtime helpers from `tannijs/internals`. That
subpath is an implementation detail used by the compiler — in your own code, import
from `tannijs`.
:::
