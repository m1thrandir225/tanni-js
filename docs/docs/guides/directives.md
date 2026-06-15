---
id: directives
title: Directives
sidebar_label: Directives
---

# Directives

Directives are special `tn-` attributes that control how elements render. They are
processed at compile time.

## `tn-if` / `tn-else-if` / `tn-else`

Conditionally render an element. The branches must be adjacent siblings:

```html
<template>
  <div tn-if="count() > 10">Count is high!</div>
  <div tn-else-if="count() > 5">Count is moderate.</div>
  <div tn-else>Count is low.</div>
</template>
```

The condition is reactive — when the signals it reads change, the rendered branch
swaps automatically. `tn-else-if` and `tn-else` only attach to a preceding `tn-if`;
using them on their own is a compile error.

## `tn-for`

Render a list. Two forms are supported:

```html
<!-- item only -->
<li tn-for="todo in todos()">{{ todo.label }}</li>

<!-- item with index -->
<li tn-for="todo, index in todos()">{{ index }}: {{ todo.label }}</li>
```

The expression after `in` is any array-returning expression (a missing/nullish value
is treated as an empty list). `tn-for` also works on components:

```html
<TodoComponent tn-for="todo in visibleTodos()" :key="todo.id" :todo="todo" />
```

:::note Keyed reconciliation is not implemented yet
The current implementation re-renders the list when its source changes. A `:key`
binding is accepted syntactically (as in the example above), but it is not yet used
for keyed diffing.
:::

## `tn-show`

Toggle an element's visibility with CSS. Unlike `tn-if`, the element stays in the DOM
and its `display` style is flipped:

```html
<div tn-show="isVisible()">Now you see me</div>
```

Use `tn-show` for things that toggle often; use `tn-if` to avoid rendering something
at all.

## `tn-model`

Two-way binding for form inputs. The value is the **base name of a signal**, and the
matching setter is inferred by capitalizing it and prefixing `set`:

```html
<script lang="ts">
  import { createSignal } from 'tannijs';
  // tn-model="newTodo" pairs the `newTodo` getter with the `setNewTodo` setter
  const [newTodo, setNewTodo] = createSignal('');
</script>

<template>
  <input type="text" tn-model="newTodo" />
</template>
```

For this inference to work, your signal and setter must follow the `x` / `setX`
naming convention (which `createSignal` destructuring naturally produces).

`tn-model` adapts to the input type:

| Element / type        | Reads / writes        | Listens on |
| --------------------- | --------------------- | ---------- |
| text inputs, textarea | `value`               | `input`    |
| `type="checkbox"`     | `checked`             | `change`   |
| `type="radio"`        | `checked` vs `value`  | `change`   |
| `<select>`            | `value`               | `change`   |

## Bindings and events recap

`:attr` (attribute binding) and `@event` (event handler) are documented on the
[Template Syntax](/guides/template-syntax) page.

## Not yet implemented

The following appear in the design spec but are **not implemented yet**. Avoid them
for now — track progress on the [Roadmap](/roadmap):

- `tn-html` — render raw HTML.
- `tn-text` — set text content via a directive (use `{{ }}` interpolation instead).
