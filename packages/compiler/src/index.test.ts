import { describe, expect, it } from 'vitest';

import { compileSfc } from './index';
import { parseSfc } from './parser';

describe('script setup backward compatibility', () => {
  it('compiles <script setup> and <script> identically', () => {
    const withSetup = `
<script setup lang="ts">
const count = () => 1;
</script>
<template>
  <p>{{ count() }}</p>
</template>
`;
    const withoutSetup = `
<script lang="ts">
const count = () => 1;
</script>
<template>
  <p>{{ count() }}</p>
</template>
`;
    const opts = { runtimeModule: 'tanni-runtime' };
    const resultSetup = compileSfc(withSetup, opts);
    const resultPlain = compileSfc(withoutSetup, opts);
    expect(resultSetup.code).toBe(resultPlain.code);
    expect(resultSetup.css).toBe(resultPlain.css);
  });

  it('parses scriptSetup flag correctly', () => {
    const withSetup = parseSfc(`
<script setup lang="ts">
const x = 1;
</script>
<template><div /></template>
`);
    const withoutSetup = parseSfc(`
<script lang="ts">
const x = 1;
</script>
<template><div /></template>
`);
    expect(withSetup.scriptSetup).toBe(true);
    expect(withoutSetup.scriptSetup).toBe(false);
    expect(withSetup.script).toBe(withoutSetup.script);
  });
});

describe('compileSfc', () => {
  it('compiles interpolation, bindings, events, tn-if and tn-for', () => {
    const source = `
<script lang="ts">
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
<script lang="ts">
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
<script lang="ts">
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
<script lang="ts">
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
<script lang="ts">
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
<script lang="ts">
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
<script lang="ts">
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
<script lang="ts">
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
<script lang="ts">
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
<script lang="ts">
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
<script lang="ts">
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
<script lang="ts">
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
<script lang="ts">
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
<script lang="ts">
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
<script lang="ts">
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
<script lang="ts">
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

describe('conditional directives (tn-if / tn-else-if / tn-else)', () => {
  it('compiles a standalone tn-if', () => {
    const source = `
<script lang="ts">
const show = () => true;
</script>
<template>
  <p tn-if="show()">Visible</p>
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain("document.createComment('tn-if')");
    expect(code).toContain('if (show())');
    expect(code).not.toContain('else');
  });

  it('compiles tn-if + tn-else chain', () => {
    const source = `
<script lang="ts">
const ok = () => true;
</script>
<template>
  <p tn-if="ok()">Yes</p>
  <p tn-else>No</p>
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('if (ok())');
    expect(code).toContain('} else {');
  });

  it('compiles tn-if + tn-else-if + tn-else chain with comparison operators', () => {
    const source = `
<script lang="ts">
const count = () => 5;
</script>
<template>
  <div tn-if="count() > 10">High</div>
  <div tn-else-if="count() > 5">Medium</div>
  <div tn-else>Low</div>
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('if (count() > 10)');
    expect(code).toContain('} else if (count() > 5)');
    expect(code).toContain('} else {');
    const markerCount = (code.match(/document\.createComment\('tn-if'\)/g) ?? []).length;
    expect(markerCount).toBe(1);
  });

  it('compiles multiple tn-else-if branches', () => {
    const source = `
<script lang="ts">
const v = () => 2;
</script>
<template>
  <span tn-if="v() === 1">One</span>
  <span tn-else-if="v() === 2">Two</span>
  <span tn-else-if="v() === 3">Three</span>
  <span tn-else>Other</span>
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('if (v() === 1)');
    expect(code).toContain('} else if (v() === 2)');
    expect(code).toContain('} else if (v() === 3)');
    expect(code).toContain('} else {');
  });

  it('throws on tn-else without preceding tn-if', () => {
    const source = `
<script lang="ts">
</script>
<template>
  <p tn-else>Orphan</p>
</template>
`;
    expect(() => compileSfc(source, { runtimeModule: 'tanni-runtime' })).toThrow(
      'tn-else without a preceding tn-if'
    );
  });

  it('throws on tn-else-if without preceding tn-if', () => {
    const source = `
<script lang="ts">
</script>
<template>
  <p tn-else-if="true">Orphan</p>
</template>
`;
    expect(() => compileSfc(source, { runtimeModule: 'tanni-runtime' })).toThrow(
      'tn-else-if without a preceding tn-if'
    );
  });
});

describe('comparison operators in attribute values', () => {
  it('handles > in tn-if expressions', () => {
    const source = `
<script lang="ts">
const n = () => 5;
</script>
<template>
  <p tn-if="n() > 3">big</p>
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('if (n() > 3)');
  });

  it('handles < in tn-if expressions', () => {
    const source = `
<script lang="ts">
const n = () => 1;
</script>
<template>
  <p tn-if="n() < 10">small</p>
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('if (n() < 10)');
  });

  it('handles >= and <= in tn-if expressions', () => {
    const source = `
<script lang="ts">
const n = () => 5;
</script>
<template>
  <p tn-if="n() >= 5">gte</p>
  <p tn-if="n() <= 5">lte</p>
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('if (n() >= 5)');
    expect(code).toContain('if (n() <= 5)');
  });

  it('handles !== and === in tn-if expressions', () => {
    const source = `
<script lang="ts">
const s = () => 'a';
</script>
<template>
  <p tn-if="s() !== 'b'">not b</p>
  <p tn-if="s() === 'a'">is a</p>
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain("if (s() !== 'b')");
    expect(code).toContain("if (s() === 'a')");
  });

  it('handles != and == in tn-if expressions', () => {
    const source = `
<script lang="ts">
const n = () => 5;
</script>
<template>
  <p tn-if="n() != null">defined</p>
  <p tn-if="n() == 5">five</p>
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('if (n() != null)');
    expect(code).toContain('if (n() == 5)');
  });
});

describe('tn-model directive', () => {
  it('binds text input with .value and "input" event', () => {
    const source = `
<script lang="ts">
const [name, setName] = createSignal('');
</script>
<template>
  <input tn-model="name()" />
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('.value = name()');
    expect(code).toContain('addEventListener("input"');
    expect(code).toContain('setName(e.target.value)');
    expect(code).toContain('createEffect(() => {');
  });

  it('binds textarea with .value and "input" event', () => {
    const source = `
<script lang="ts">
const [content, setContent] = createSignal('');
</script>
<template>
  <textarea tn-model="content()"></textarea>
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('.value = content()');
    expect(code).toContain('addEventListener("input"');
    expect(code).toContain('setContent(e.target.value)');
  });

  it('binds checkbox with .checked and "change" event', () => {
    const source = `
<script lang="ts">
const [agreed, setAgreed] = createSignal(false);
</script>
<template>
  <input type="checkbox" tn-model="agreed()" />
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('.checked = agreed()');
    expect(code).toContain('addEventListener("change"');
    expect(code).toContain('setAgreed(e.target.checked)');
    expect(code).not.toContain('e.target.value');
  });

  it('binds radio with .checked comparison and "change" event', () => {
    const source = `
<script lang="ts">
const [color, setColor] = createSignal('red');
</script>
<template>
  <input type="radio" value="red" tn-model="color()" />
  <input type="radio" value="blue" tn-model="color()" />
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('.checked = (color() ===');
    expect(code).toContain('addEventListener("change"');
    expect(code).toContain('setColor(e.target.value)');
    expect(code).not.toContain('e.target.checked');
  });

  it('binds select with .value and "change" event', () => {
    const source = `
<script lang="ts">
const [choice, setChoice] = createSignal('a');
</script>
<template>
  <select tn-model="choice()">
    <option value="a">A</option>
    <option value="b">B</option>
  </select>
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('.value = choice()');
    expect(code).toContain('addEventListener("change"');
    expect(code).toContain('setChoice(e.target.value)');
  });

  it('supports expression without parentheses', () => {
    const source = `
<script lang="ts">
const [name, setName] = createSignal('');
</script>
<template>
  <input tn-model="name" />
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('.value = name()');
    expect(code).toContain('setName(e.target.value)');
  });

  it('wraps binding in createEffect for reactivity', () => {
    const source = `
<script lang="ts">
const [text, setText] = createSignal('');
</script>
<template>
  <input tn-model="text()" />
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    const effectCount = (code.match(/createEffect\(\(\) => \{/g) ?? []).length;
    expect(effectCount).toBeGreaterThanOrEqual(1);
    expect(code).toContain('.value = text()');
  });

  it('handles tn-model alongside other attributes', () => {
    const source = `
<script lang="ts">
const [email, setEmail] = createSignal('');
</script>
<template>
  <input type="text" class="field" placeholder="Email" tn-model="email()" />
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('setAttribute("type", "text")');
    expect(code).toContain('setAttribute("class", "field")');
    expect(code).toContain('setAttribute("placeholder", "Email")');
    expect(code).toContain('.value = email()');
    expect(code).toContain('setEmail(e.target.value)');
  });
});

describe('tn-show directive', () => {
  it('emits style.display toggle inside createEffect', () => {
    const source = `
<script lang="ts">
const visible = () => true;
</script>
<template>
  <div tn-show="visible()">Hello</div>
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('createEffect(() => {');
    expect(code).toContain(".style.display = (visible()) ? '' : 'none'");
  });

  it('works with a complex expression', () => {
    const source = `
<script lang="ts">
const count = () => 5;
</script>
<template>
  <p tn-show="count() > 0">Positive</p>
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain(".style.display = (count() > 0) ? '' : 'none'");
  });

  it('works alongside other attributes and bindings', () => {
    const source = `
<script lang="ts">
const active = () => true;
const cls = () => 'highlight';
</script>
<template>
  <span class="tag" :data-cls="cls()" tn-show="active()">Tag</span>
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('setAttribute("class", "tag")');
    expect(code).toContain('.setAttribute("data-cls"');
    expect(code).toContain(".style.display = (active()) ? '' : 'none'");
  });

  it('works alongside tn-for', () => {
    const source = `
<script lang="ts">
const items = () => [1, 2, 3];
const show = () => true;
</script>
<template>
  <ul>
    <li tn-for="item in items()" tn-show="show()">{{ item }}</li>
  </ul>
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain("document.createComment('tn-for')");
    expect(code).toContain(".style.display = (show()) ? '' : 'none'");
  });

  it('creates a separate effect from other bindings', () => {
    const source = `
<script lang="ts">
const visible = () => true;
</script>
<template>
  <div tn-show="visible()">content</div>
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    const effectCount = (code.match(/createEffect\(\(\) => \{/g) ?? []).length;
    expect(effectCount).toBeGreaterThanOrEqual(1);
    expect(code).toContain(".style.display = (visible()) ? '' : 'none'");
  });
});

describe('comparison operators in attribute values', () => {
  it('handles > in dynamic attribute bindings', () => {
    const source = `
<script lang="ts">
const n = () => 5;
</script>
<template>
  <div :data-big="n() > 3">test</div>
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('n() > 3');
  });

  it('handles > in tn-else-if expressions', () => {
    const source = `
<script lang="ts">
const n = () => 5;
</script>
<template>
  <p tn-if="n() > 10">high</p>
  <p tn-else-if="n() > 3">medium</p>
  <p tn-else>low</p>
</template>
`;
    const { code } = compileSfc(source, { runtimeModule: 'tanni-runtime' });
    expect(code).toContain('if (n() > 10)');
    expect(code).toContain('} else if (n() > 3)');
    expect(code).toContain('} else {');
  });
});
