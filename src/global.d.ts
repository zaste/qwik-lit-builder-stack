/// <reference types="@cloudflare/workers-types" />

// Cloudflare Platform extensions
declare module '@builder.io/qwik-city/middleware/cloudflare-pages' {
  interface PlatformCloudflarePages {
    env: {
      // KV Namespaces
      KV: KVNamespace;
      
      // R2 Buckets
      R2: R2Bucket;
      
      // Environment Variables
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
      SUPABASE_SERVICE_KEY?: string;
      BUILDER_PUBLIC_KEY: string;
      BUILDER_WEBHOOK_SECRET?: string;
      DEPLOY_TARGET: string;
      ENVIRONMENT: 'development' | 'production';
    };
    cf?: IncomingRequestCfProperties;
  }
}

// Supabase types
type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Global Window extensions
declare global {
  interface Window {
    // Analytics
    datadog?: {
      rum: {
        addAction: (name: string, context: any) => void;
        addError: (error: Error, context?: any) => void;
        addTiming: (name: string, duration: number) => void;
      };
    };
    gtag?: (...args: any[]) => void;
    
    // Builder.io
    Builder?: any;
    
    // Development
    __DEV__?: boolean;
  }
}

// Vite env extensions
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_BUILDER_PUBLIC_KEY: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export {};