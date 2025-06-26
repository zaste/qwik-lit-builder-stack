// plopfile.mjs - Code generation configuration

export default function (plop) {
  // Qwik Component Generator
  plop.setGenerator('component', {
    description: 'Create a new Qwik component',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Component name (e.g., UserCard):',
        validate: (input) => /^[A-Z][a-zA-Z0-9]*$/.test(input) || 'Must be PascalCase'
      },
      {
        type: 'list',
        name: 'type',
        message: 'Component type:',
        choices: ['ui', 'layout', 'features'],
        default: 'ui'
      }
    ],
    actions: [
      {
        type: 'add',
        path: 'src/components/{{type}}/{{pascalCase name}}/{{pascalCase name}}.tsx',
        template: `import { component$ } from '@builder.io/qwik';
import type { PropFunction } from '@builder.io/qwik';

export interface {{pascalCase name}}Props {
  class?: string;
  onClick$?: PropFunction<() => void>;
}

export const {{pascalCase name}} = component$<{{pascalCase name}}Props>((props) => {
  return (
    <div class={props.class}>
      {{pascalCase name}} Component
    </div>
  );
});`
      },
      {
        type: 'add',
        path: 'src/components/{{type}}/{{pascalCase name}}/index.ts',
        template: "export { {{pascalCase name}} } from './{{pascalCase name}}';\n"
      }
    ]
  });

  // LIT Component Generator
  plop.setGenerator('lit-component', {
    description: 'Create a new LIT web component',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Component name (e.g., button):',
        validate: (input) => /^[a-z-]+$/.test(input) || 'Must be kebab-case'
      }
    ],
    actions: [
      {
        type: 'add',
        path: 'src/design-system/components/ds-{{kebabCase name}}.ts',
        template: `import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokens } from '../tokens';

@customElement('ds-{{kebabCase name}}')
export class DS{{pascalCase name}} extends LitElement {
  static styles = css\`
    :host {
      display: block;
    }
  \`;

  @property() value = '';

  render() {
    return html\`
      <div>
        ds-{{kebabCase name}} Component
      </div>
    \`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ds-{{kebabCase name}}': DS{{pascalCase name}};
  }
}`
      }
    ]
  });

  // Helper functions
  plop.setHelper('pascalCase', (text) => {
    return text.replace(/(\w)(\w*)/g, (g0, g1, g2) => g1.toUpperCase() + g2.toLowerCase());
  });

  plop.setHelper('kebabCase', (text) => {
    return text
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  });
}