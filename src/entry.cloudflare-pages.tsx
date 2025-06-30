import { createQwikCity } from '@builder.io/qwik-city/middleware/cloudflare-pages';
import qwikCityPlan from '@qwik-city-plan';
import { manifest } from '@qwik-client-manifest';
import render from './entry.ssr';

const fetch = createQwikCity({ render, qwikCityPlan, manifest });

export default {
  fetch,
} satisfies ExportedHandler<{
  ASSETS: { fetch: (req: Request) => Response };
  KV: KVNamespace;
  R2: R2Bucket;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY?: string;
  BUILDER_PUBLIC_KEY: string;
}>;
