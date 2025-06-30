import { component$, useSignal, useTask$ } from '@builder.io/qwik';

// Helper to handle optional Builder.io SDK
let builderSDK: any = null;
let builderQwikSDK: any = null;

// Try to load Builder.io SDKs
export async function initializeBuilder() {
  if (builderSDK || builderQwikSDK) return;
  
  try {
    const [sdk, qwikSdk] = await Promise.all([
      import('@builder.io/sdk').catch(() => null),
      import('@builder.io/sdk-qwik').catch(() => null)
    ]);
    
    builderSDK = sdk;
    builderQwikSDK = qwikSdk;
    
    if (builderSDK && builderQwikSDK) {
      // console.log('✅ Builder.io SDK loaded successfully');
    } else {
      // console.warn('⚠️ Builder.io SDK not available - CMS features disabled');
    }
  } catch (error) {
    // console.warn('⚠️ Failed to load Builder.io SDK:', error);
  }
}

// Check if Builder.io is available
export const hasBuilderSupport = () => Boolean(builderSDK && builderQwikSDK);

// Get Builder SDK (returns null if not available)
export const getBuilderSDK = () => builderSDK;
export const getBuilderQwikSDK = () => builderQwikSDK;

// Real Builder.io component wrapper
export const BuilderComponent = component$((props: any) => {
  const initialized = useSignal(false);
  
  useTask$(async () => {
    await initializeBuilder();
    initialized.value = true;
  });
  
  if (!initialized.value || !hasBuilderSupport()) {
    return <div>Loading Builder.io content...</div>;
  }
  
  const { RenderBuilderContent } = builderQwikSDK;
  return <RenderBuilderContent {...props} />;
});

// Real component registration
export async function registerBuilderComponents() {
  await initializeBuilder();
  
  if (!hasBuilderSupport()) {
    throw new Error('Builder.io SDK not available for component registration');
  }
  
  // Register design system components
  const { Builder } = builderSDK;
  
  // Register DS Button component
  Builder.registerComponent(
    (props: any) => {
      return <ds-button variant={props.variant} size={props.size} disabled={props.disabled}>{props.text}</ds-button>;
    },
    {
      name: 'DS Button',
      inputs: [
        {
          name: 'variant',
          type: 'select',
          options: [
            { label: 'Primary', value: 'primary' },
            { label: 'Secondary', value: 'secondary' }
          ],
          defaultValue: 'primary'
        },
        {
          name: 'size',
          type: 'select',
          options: [
            { label: 'Medium', value: 'medium' },
            { label: 'Large', value: 'large' }
          ],
          defaultValue: 'medium'
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: false
        },
        {
          name: 'text',
          type: 'string',
          defaultValue: 'Button Text'
        }
      ]
    }
  );
  
  // Register DS Card component
  Builder.registerComponent(
    (props: any) => {
      return (
        <ds-card variant={props.variant}>
          <div innerHTML={props.content} />
        </ds-card>
      );
    },
    {
      name: 'DS Card',
      inputs: [
        {
          name: 'variant',
          type: 'select',
          options: [
            { label: 'Default', value: 'default' },
            { label: 'Elevated', value: 'elevated' }
          ],
          defaultValue: 'default'
        },
        {
          name: 'content',
          type: 'richText',
          defaultValue: '<p>Card content</p>'
        }
      ]
    }
  );
  
  console.log('✅ Builder.io components registered successfully');
}
