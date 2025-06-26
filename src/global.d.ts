/// <reference types="@cloudflare/workers-types" />

declare module '@builder.io/qwik-city/middleware/cloudflare-pages' {
  interface PlatformCloudflarePages {
    env: {
      KV?: KVNamespace;
      R2?: R2Bucket;
      SUPABASE_URL?: string;
      SUPABASE_ANON_KEY?: string;
      BUILDER_PUBLIC_KEY?: string;
      DEPLOY_TARGET?: string;
      CF_REGION?: string;
    };
  }
}

// Extend Window for client-side globals
declare global {
  interface Window {
    // Supabase
    supabase?: any;
    
    // Monitoring
    datadog?: {
      rum: {
        addAction: (name: string, context: any) => void;
      };
    };
    
    // Analytics
    gtag?: (...args: any[]) => void;
    
    // Builder.io
    builder?: any;
  }
}

export {};