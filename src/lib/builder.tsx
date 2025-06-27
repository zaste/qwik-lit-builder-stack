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
      console.log('✅ Builder.io SDK loaded successfully');
    } else {
      console.warn('⚠️ Builder.io SDK not available - CMS features disabled');
    }
  } catch (error) {
    console.warn('⚠️ Failed to load Builder.io SDK:', error);
  }
}

// Check if Builder.io is available
export const hasBuilderSupport = () => Boolean(builderSDK && builderQwikSDK);

// Get Builder SDK (returns null if not available)
export const getBuilderSDK = () => builderSDK;
export const getBuilderQwikSDK = () => builderQwikSDK;

// Safe Builder.io component wrapper
export const BuilderComponent = async (props: any) => {
  await initializeBuilder();
  
  if (!hasBuilderSupport()) {
    return (
      <div style={{ padding: '20px', background: '#f3f4f6', borderRadius: '8px' }}>
        <p>Builder.io content not available.</p>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          To enable CMS features, install Builder.io SDK.
        </p>
      </div>
    );
  }
  
  const { RenderBuilderContent } = builderQwikSDK;
  return <RenderBuilderContent {...props} />;
};

// Safe initialization function
export async function registerBuilderComponents() {
  await initializeBuilder();
  
  if (!hasBuilderSupport()) {
    console.info('Skipping Builder.io component registration');
    return;
  }
  
  // Register your custom components here
  // Example:
  // builderSDK.Builder.registerComponent(MyComponent, {
  //   name: 'MyComponent',
  //   inputs: [...]
  // });
}
