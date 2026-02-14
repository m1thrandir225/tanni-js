export interface SfcDescriptor {
  template: string;
  script: string;
  scriptLang: string | null;
}

export interface TemplateRoot {
  type: 'Root';
  children: TemplateNode[];
}

export type TemplateNode = ElementNode | TextNode;

export interface ElementNode {
  type: 'Element';
  tag: string;
  attrs: RawAttribute[];
  children: TemplateNode[];
}

export interface TextNode {
  type: 'Text';
  content: string;
}

export interface RawAttribute {
  name: string;
  value: string | null;
}

export interface TransformRoot {
  type: 'Root';
  children: TransformNode[];
}

export type TransformNode = TransformElementNode | TransformTextNode;

export interface TransformTextNode {
  type: 'Text';
  segments: TextSegment[];
}

export type TextSegment =
  | {
      type: 'static';
      value: string;
    }
  | {
      type: 'dynamic';
      expression: string;
    };

export interface TransformElementNode {
  type: 'Element';
  tag: string;
  attributes: StaticAttribute[];
  bindings: DynamicBinding[];
  events: EventBinding[];
  directives: DirectiveMap;
  children: TransformNode[];
}

export interface StaticAttribute {
  name: string;
  value: string;
}

export interface DynamicBinding {
  name: string;
  expression: string;
}

export interface EventBinding {
  name: string;
  expression: string;
}

export interface DirectiveMap {
  if?: string;
  for?: ForDirective;
}

export interface ForDirective {
  itemAlias: string;
  indexAlias: string | null;
  listExpression: string;
}

export interface CompileOptions {
  id?: string;
  runtimeModule?: string;
  componentName?: string;
}

export interface CompileResult {
  code: string;
}
