/// <reference types="@cloudflare/workers-types" />

declare module '@builder.io/qwik-city/middleware/cloudflare-pages' {
  interface PlatformCloudflarePages {
    env: {
      KV: KVNamespace;
      R2: R2Bucket;
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
      SUPABASE_SERVICE_KEY?: string;
      // BUILDER_PUBLIC_KEY: string; // Removed - Builder.io CMS not currently integrated
      ENVIRONMENT?: string;
    };
  }
}

declare module '@builder.io/qwik-city/middleware/vercel-edge' {
  interface PlatformVercel {
    env: {
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
      SUPABASE_SERVICE_KEY?: string;
      // BUILDER_PUBLIC_KEY: string; // Removed - Builder.io CMS not currently integrated
      ENVIRONMENT?: string;
    };
  }
}

declare global {
  interface Window {
    dataLayer: any[];
  }
}

export {};
