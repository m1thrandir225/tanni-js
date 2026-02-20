import { describe, expect, it } from 'vitest';

import { compileSfc, parseSfc } from './index';

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
    expect(code).toContain('"count": val()');
    expect(code).toContain('"onClick": handleClick');
  });

  it('wraps component with dynamic bindings in createEffect', () => {
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
    expect(code).toContain("document.createComment('tn-component:Counter')");
    expect(code).toContain('createEffect(() => {');
    expect(code).toContain('Counter({');
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
