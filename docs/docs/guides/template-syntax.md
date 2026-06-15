---
id: template-syntax
title: Template Syntax
sidebar_label: Template Syntax
---

# Template syntax

Templates are HTML with three additions: text interpolation, attribute bindings, and
event handlers. Structural [directives](/guides/directives) (`tn-if`, `tn-for`, …)
are covered separately.

## Text interpolation

Use `{{ }}` to render a reactive value into text. Remember that signals are read by
**calling** them:

```html
<script lang="ts">
  import { createSignal } from 'tannijs';
  const [name, setName] = createSignal('World');
</script>

<template>
  <p>Hello, {{ name() }}!</p>
</template>
```

Interpolations can be mixed with static text and contain any JavaScript expression.
When a signal used inside an interpolation changes, only that text node is updated.

## Attribute bindings

Prefix an attribute with `:` to bind it to an expression:

```html
<img :src="avatarUrl()" :alt="userName()" />
<button :class="isActive() ? 'active' : ''">Save</button>
<input type="checkbox" :checked="done()" />
```

The binding re-evaluates whenever its signals change. If the expression evaluates to
`null`, `undefined`, or `false`, the attribute is **removed**; otherwise its value is
set to `String(value)`.

## Event handlers

Prefix an event name with `@` to attach a handler. Several forms are accepted:

```html
<!-- a function reference -->
<button @click="increment">+</button>

<!-- an inline arrow function (receives the event) -->
<input @input="(e) => setName(e.target.value)" />

<!-- a statement; `event` is available inside it -->
<button @click="setCount(0)">Reset</button>
```

Events on native elements use event delegation under the hood, so handlers are
efficient even across large lists.

:::tip Component events
Putting `@event` on a **component** (a PascalCase tag) doesn't attach a DOM listener —
it passes the handler to the child as an `on<Event>` prop. See
[Component events](/guides/components#component-events).
:::
