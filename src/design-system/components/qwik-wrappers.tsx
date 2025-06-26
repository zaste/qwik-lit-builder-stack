import { component$, Slot } from '@builder.io/qwik';
import type { QwikIntrinsicElements } from '@builder.io/qwik';

/**
 * Qwik wrapper for ds-button web component
 */
export const DSButton = component$<{
  variant?: 'primary' | 'secondary';
  size?: 'medium' | 'large';
  disabled?: boolean;
  class?: string;
  onClick$?: () => void;
}>((props) => {
  return (
    <ds-button
      variant={props.variant || 'primary'}
      size={props.size || 'medium'}
      disabled={props.disabled}
      class={props.class}
      onClick$={props.onClick$}
    >
      <Slot />
    </ds-button>
  );
});

// Type declarations for LIT components
declare module '@builder.io/qwik' {
  export namespace QwikIntrinsicElements {
    export interface DsButton extends Omit<HTMLAttributes<HTMLElement>, 'size'> {
      variant?: 'primary' | 'secondary';
      size?: 'medium' | 'large';
      disabled?: boolean;
    }
    
    export interface IntrinsicElements {
      'ds-button': DsButton;
    }
  }
}