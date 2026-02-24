import { describe, expect, it } from 'vitest';

import { compileSfc } from './index';
import { parseSfc } from './parser';

describe('compileSfc', () => {
  it('compiles interpolation, bindings, events, tn-if and tn-for', () => {
    const source = `
<script setup lang="ts">
const count = () => 1;
const visible = () => true;
const items = () => ['a', 'b'];
function increment() {}
</script>
<template>
  <section :data-count="count()" @click="increment">
    <p>{{ count() }}</p>
    <span tn-if="visible()">Visible</span>
    <li tn-for="item, index in items()">{{ index }}-{{ item }}</li>
  </section>
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });

    expect(code).toContain("import { createEffect, delegateEvents } from 'tanni-runtime';");
    expect(code).toContain('createEffect(() => {');
    expect(code).toContain('.setAttribute("data-count"');
    expect(code).toContain('__tnDelegatedHandlers');
    expect(code).toContain("document.createComment('tn-if')");
    expect(code).toContain("document.createComment('tn-for')");
    expect(code).toContain('const item =');
    expect(code).toContain('const index = __i;');
    expect(code).toContain('delegateEvents(["click"]);');
  });

  it('rewrites defineProps macro to component props', () => {
    const source = `
<script setup lang="ts">
interface Props {
  title: string;
}
const props = defineProps<Props>();
</script>
<template>
  <h1>{{ props.title }}</h1>
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('const props = __props;');
    expect(code).toContain('export default function Component(__props = {}) {');
  });
});

describe('component detection', () => {
  it('detects PascalCase tags as components and emits function calls', () => {
    const source = `
<script setup lang="ts">
import Counter from './Counter.tanni';
</script>
<template>
  <div>
    <Counter />
  </div>
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('Counter(');
    expect(code).not.toContain('document.createElement("Counter")');
  });

  it('passes static attrs, bindings, and events as props to components', () => {
    const source = `
<script setup lang="ts">
import MyComp from './MyComp.tanni';
const val = () => 42;
function handleClick() {}
</script>
<template>
  <MyComp title="hello" :count="val()" @click="handleClick" />
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('MyComp(');
    expect(code).toContain('"title": "hello"');
    expect(code).toContain('get "count"() { return val(); }');
    expect(code).toContain('"onClick": handleClick');
  });

  it('emits getter props for dynamic bindings instead of wrapping in createEffect', () => {
    const source = `
<script setup lang="ts">
import Counter from './Counter.tanni';
const count = () => 5;
</script>
<template>
  <Counter :value="count()" />
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('Counter({');
    expect(code).toContain('get "value"() { return count(); }');
    expect(code).not.toContain("document.createComment('tn-component:Counter')");
  });

  it('treats lowercase tags as plain HTML elements', () => {
    const source = `
<script setup lang="ts">
</script>
<template>
  <div>
    <span>text</span>
  </div>
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('document.createElement("div")');
    expect(code).toContain('document.createElement("span")');
  });
});

describe('defineProps rewriting', () => {
  it('rewrites defineProps() with no args to __props', () => {
    const source = `
<script setup lang="ts">
const props = defineProps();
</script>
<template>
  <p>{{ props.title }}</p>
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('const props = __props;');
  });

  it('rewrites defineProps<T>() with generic only to __props', () => {
    const source = `
<script setup lang="ts">
interface Props { title: string; }
const props = defineProps<Props>();
</script>
<template>
  <p>{{ props.title }}</p>
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('const props = __props;');
    expect(code).not.toContain('interface Props');
  });

  it('rewrites defineProps<T>({ defaults }) to spread with __props', () => {
    const source = `
<script setup lang="ts">
interface Props { count: number; onIncrement: () => void; }
const props = defineProps<Props>({ count: 0 });
</script>
<template>
  <p>{{ props.count }}</p>
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('const props = Object.create({ count: 0 }, Object.getOwnPropertyDescriptors(__props));');
    expect(code).not.toContain('defineProps');
    expect(code).not.toContain('interface Props');
  });

  it('rewrites defineProps({ defaults }) without generic to Object.create with __props', () => {
    const source = `
<script setup lang="ts">
const props = defineProps({ count: 0 });
</script>
<template>
  <p>{{ props.count }}</p>
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('const props = Object.create({ count: 0 }, Object.getOwnPropertyDescriptors(__props));');
  });

  it('rewrites withDefaults(defineProps<T>(), { defaults }) to Object.create with __props', () => {
    const source = `
<script setup lang="ts">
interface Props { count: number; label: string; }
const props = withDefaults(defineProps<Props>(), { count: 0, label: "hello" });
</script>
<template>
  <p>{{ props.label }}: {{ props.count }}</p>
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('const props = Object.create({ count: 0, label: "hello" }, Object.getOwnPropertyDescriptors(__props));');
    expect(code).not.toContain('withDefaults');
    expect(code).not.toContain('defineProps');
  });

  it('rewrites withDefaults without generic to Object.create with __props', () => {
    const source = `
<script setup lang="ts">
const props = withDefaults(defineProps(), { count: 5 });
</script>
<template>
  <p>{{ props.count }}</p>
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('const props = Object.create({ count: 5 }, Object.getOwnPropertyDescriptors(__props));');
    expect(code).not.toContain('withDefaults');
  });
});

describe('style block extraction', () => {
  it('extracts a single style block', () => {
    const source = `
<script setup lang="ts">
</script>
<template>
  <div>hello</div>
</template>
<style>
.app { color: red; }
</style>
`;
    const result = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(result.css).toContain('.app { color: red; }');
  });

  it('extracts multiple style blocks and concatenates them', () => {
    const source = `
<script setup lang="ts">
</script>
<template>
  <div>hello</div>
</template>
<style>
.a { color: red; }
</style>
<style>
.b { color: blue; }
</style>
`;
    const result = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(result.css).toContain('.a { color: red; }');
    expect(result.css).toContain('.b { color: blue; }');
  });

  it('returns empty css when no style block is present', () => {
    const source = `
<script setup lang="ts">
</script>
<template>
  <div>hello</div>
</template>
`;
    const result = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(result.css).toBe('');
  });

  it('parses style block lang and scoped attributes', () => {
    const source = `
<script setup lang="ts">
</script>
<template>
  <div>hello</div>
</template>
<style lang="scss" scoped>
.app { color: red; }
</style>
`;
    const descriptor = parseSfc(source);
    expect(descriptor.styles).toHaveLength(1);
    expect(descriptor.styles[0]!.lang).toBe('scss');
    expect(descriptor.styles[0]!.scoped).toBe(true);
  });
});
