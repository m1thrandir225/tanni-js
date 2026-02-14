import { describe, expect, it } from 'vitest';

import { tanniPlugin } from './index';

describe('tanniPlugin', () => {
  it('transforms .tanni files through compiler', async () => {
    const plugin = tanniPlugin({ runtimeModule: 'tanni-runtime' });
    const transformHook =
      typeof plugin.transform === 'function' ? plugin.transform : plugin.transform?.handler;
    expect(transformHook).toBeTypeOf('function');
    const source = `
<script setup lang="ts">
const value = () => 'ok';
</script>
<template>
  <p>{{ value() }}</p>
</template>
`;

    const output = await transformHook?.call(
      {} as never,
      source,
      '/demo/components/HelloWorld.tanni'
    );

    expect(output).toBeTruthy();
    const result = output as { code: string };
    expect(result.code).toContain("import { createEffect, delegateEvents } from 'tanni-runtime';");
    expect(result.code).toContain('function HelloWorld(__props = {})');
    expect(result.code).toContain('document.createTextNode');
  });

  it('ignores non-tanni files', async () => {
    const plugin = tanniPlugin();
    const transformHook =
      typeof plugin.transform === 'function' ? plugin.transform : plugin.transform?.handler;
    expect(transformHook).toBeTypeOf('function');
    const output = await transformHook?.call(
      {} as never,
      'export const a = 1;',
      '/demo/a.ts'
    );
    expect(output).toBeNull();
  });
});
