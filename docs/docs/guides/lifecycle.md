---
id: lifecycle
title: Lifecycle Hooks
sidebar_label: Lifecycle Hooks
---

# Lifecycle hooks

Tanni provides two lifecycle helpers, both imported from `tannijs`:

```ts
import { onMount, onCleanup } from 'tannijs';
```

When you reference them in a component's `<script>`, the compiler imports them for you
automatically.

## `onMount`

```ts
function onMount(fn: () => void): void;
```

Runs `fn` after the component's setup completes and its nodes have been created. It's
the place for work that needs the DOM to exist — fetching data, measuring elements, or
starting timers:

```html
<script lang="ts">
  import { createSignal, onMount } from 'tannijs';

  const [user, setUser] = createSignal(null);

  onMount(async () => {
    const res = await fetch('/api/me');
    setUser(await res.json());
  });
</script>
```

You can call `onMount` directly in your component's script body.

## `onCleanup`

```ts
function onCleanup(fn: () => void): void;
```

Registers a teardown function. `onCleanup` must be called **inside a tracked
computation** (a `createEffect` or `createMemo`); its callback runs the next time that
computation re-runs, and when it is disposed. This makes it ideal for cleaning up
subscriptions or listeners created inside an effect:

```html
<script lang="ts">
  import { createSignal, createEffect, onCleanup } from 'tannijs';

  const [roomId, setRoomId] = createSignal(1);

  createEffect(() => {
    const socket = connectTo(roomId());

    // runs before the effect re-runs (e.g. when roomId changes)
    // and when the effect is disposed
    onCleanup(() => socket.close());
  });
</script>
```

:::warning
Calling `onCleanup` outside of a tracked computation throws. If you need cleanup tied
to a value that changes, create the resource inside a `createEffect` and register the
cleanup there, as shown above.
:::
