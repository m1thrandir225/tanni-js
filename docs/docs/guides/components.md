---
id: components
title: Components
sidebar_label: Components
---

# Components

A Tanni component is a single `.tanni` file made up of up to three blocks.

## Anatomy of a single-file component

```html
<script lang="ts">
  // imports, state, derived values, and methods go here
  import { createSignal } from 'tannijs';
  const [open, setOpen] = createSignal(false);
</script>

<template>
  <!-- markup with bindings and directives -->
  <button @click="() => setOpen((v) => !v)">Toggle</button>
</template>

<style scoped>
  /* component styles (optional) */
  button { font-weight: 600; }
</style>
```

- **`<script>`** holds plain TypeScript: imports, signals, computed values, and
  functions. The code runs once each time the component is created.
- **`<template>`** is your markup. It may have more than one root element.
- **`<style>`** is optional styling — see [Styling](/guides/styling).

Each component compiles to a default-exported factory function that returns a DOM
node, which is why you mount it by calling it: `root.append(App())`.

## Props

Declare a component's props with `defineProps<T>()`. It returns an object of the
incoming props:

```html
<script lang="ts">
  import type { Todo } from '../types/todo';

  const props = defineProps<{ todo: Todo }>();
</script>

<template>
  <li>{{ props.todo.label }}</li>
</template>
```

### Default values

Use `withDefaults` to supply fallback values for optional props:

```html
<script lang="ts">
  interface Props {
    title: string;
    initialCount?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    initialCount: 0,
  });
</script>
```

`defineProps` and `withDefaults` are compile-time macros — you don't import them.

## Using child components

Import another `.tanni` file and use it as a PascalCase tag. Pass data with
attribute bindings:

```html
<script lang="ts">
  import TodoComponent from './components/Todo.tanni';
  import { createSignal } from 'tannijs';

  const [todos, setTodos] = createSignal([{ id: 1, label: 'Learn Tanni', isDone: false }]);
</script>

<template>
  <ul>
    <TodoComponent
      tn-for="todo in todos()"
      :key="todo.id"
      :todo="todo"
    />
  </ul>
</template>
```

- `:todo="todo"` passes a **reactive** prop (the expression is re-read when its
  signals change).
- `title="Hello"` (no colon) passes a **static string** prop.

## Component events

An `@event` on a component is delivered to the child as an `on<Event>` prop (the
event name is capitalized and prefixed with `on`). For example, `@toggle` becomes
`props.onToggle`:

```html title="Parent.tanni"
<TodoComponent
  :todo="todo"
  @toggle="toggleTodo"
  @delete="removeTodo"
/>
```

```html title="Todo.tanni (child)"
<script lang="ts">
  const props = defineProps<{ todo: Todo }>();
</script>

<template>
  <input type="checkbox" @change="props.onToggle(props.todo.id)" />
  <button @click="props.onDelete(props.todo.id)">×</button>
</template>
```

## Slots

Components can accept and render markup from their parent via slots.

### Default slot

Anything you place between a component's tags fills its default slot. The child
renders it with `<slot />`:

```html title="Card.tanni"
<template>
  <div class="card">
    <slot />
  </div>
</template>
```

```html title="Parent.tanni"
<Card>
  <p>Hello from the parent</p>
</Card>
```

### Named slots

Provide named content with `<template slot="name">`, and render it with a named
outlet:

```html title="Card.tanni"
<template>
  <div class="card">
    <header><slot name="header" /></header>
    <div class="body"><slot /></div>
  </div>
</template>
```

```html title="Parent.tanni"
<Card>
  <template slot="header">
    <h2>Title</h2>
  </template>
  <p>Body content goes in the default slot.</p>
</Card>
```

### Fallback content

Markup inside a `<slot>` outlet is rendered when the parent provides nothing for
that slot:

```html
<slot name="header">
  <h2>Default title</h2>
</slot>
```
