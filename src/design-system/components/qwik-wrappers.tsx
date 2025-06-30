import { component$, Slot } from '@builder.io/qwik';

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

/**
 * Qwik wrapper for ds-file-upload web component
 */
export const DSFileUpload = component$<{
  endpoint?: string;
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  bucket?: string;
  class?: string;
  onUploadSuccess$?: (event: CustomEvent) => void;
  onUploadError$?: (event: CustomEvent) => void;
  onUploadComplete$?: (event: CustomEvent) => void;
}>((props) => {
  return (
    <ds-file-upload
      endpoint={props.endpoint || '/api/upload'}
      accept={props.accept || 'image/*,application/pdf,text/*'}
      maxSize={props.maxSize || 10 * 1024 * 1024}
      multiple={props.multiple || false}
      bucket={props.bucket || 'uploads'}
      class={props.class}
      onDsUploadSuccess$={props.onUploadSuccess$}
      onDsUploadError$={props.onUploadError$}
      onDsUploadComplete$={props.onUploadComplete$}
    />
  );
});

/**
 * Qwik wrapper for ds-input web component
 */
export const DSInput = component$<{
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  value?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'filled' | 'outlined';
  name?: string;
  autocomplete?: string;
  class?: string;
  onInput$?: (event: CustomEvent) => void;
  onChange$?: (event: CustomEvent) => void;
  onFocus$?: (event: CustomEvent) => void;
  onBlur$?: (event: CustomEvent) => void;
}>((props) => {
  return (
    <ds-input
      type={props.type || 'text'}
      placeholder={props.placeholder || ''}
      value={props.value || ''}
      label={props.label || ''}
      required={props.required || false}
      disabled={props.disabled || false}
      error={props.error || ''}
      helperText={props.helperText || ''}
      size={props.size || 'medium'}
      variant={props.variant || 'default'}
      name={props.name || ''}
      autocomplete={props.autocomplete || ''}
      class={props.class}
      onDsInput$={props.onInput$}
      onDsChange$={props.onChange$}
      onDsFocus$={props.onFocus$}
      onDsBlur$={props.onBlur$}
    />
  );
});

/**
 * Qwik wrapper for ds-card web component
 */
export const DSCard = component$<{
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
  shadow?: 'none' | 'small' | 'medium' | 'large';
  interactive?: boolean;
  header?: string;
  footer?: string;
  class?: string;
  onClick$?: (event: CustomEvent) => void;
}>((props) => {
  return (
    <ds-card
      variant={props.variant || 'default'}
      padding={props.padding || 'medium'}
      shadow={props.shadow || 'medium'}
      interactive={props.interactive || false}
      header={props.header || ''}
      footer={props.footer || ''}
      class={props.class}
      onDsCardClick$={props.onClick$}
    >
      <Slot />
    </ds-card>
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

    export interface DsFileUpload extends HTMLAttributes<HTMLElement> {
      endpoint?: string;
      accept?: string;
      maxSize?: number;
      multiple?: boolean;
      bucket?: string;
    }

    export interface DsInput extends Omit<HTMLAttributes<HTMLElement>, 'size'> {
      type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
      placeholder?: string;
      value?: string;
      label?: string;
      required?: boolean;
      disabled?: boolean;
      error?: string;
      helperText?: string;
      size?: 'small' | 'medium' | 'large';
      variant?: 'default' | 'filled' | 'outlined';
      name?: string;
      autocomplete?: string;
    }

    export interface DsCard extends HTMLAttributes<HTMLElement> {
      variant?: 'default' | 'elevated' | 'outlined';
      padding?: 'none' | 'small' | 'medium' | 'large';
      shadow?: 'none' | 'small' | 'medium' | 'large';
      interactive?: boolean;
      header?: string;
      footer?: string;
    }
    
    export interface IntrinsicElements {
      'ds-button': DsButton;
      'ds-file-upload': DsFileUpload;
      'ds-input': DsInput;
      'ds-card': DsCard;
    }
  }
}