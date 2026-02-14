import { describe, expect, it } from 'vitest';

import { compileSfc } from './index';

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
    expect(code).toContain('const props = (__props as Props);');
    expect(code).toContain('export default function Component(__props = {}) {');
  });
});
