import type { RequestHandler } from '@builder.io/qwik-city';

export const onGet: RequestHandler = async ({ json, headers }) => {
  // Cache headers
  headers.set('Cache-Control', 'public, max-age=3600');
  
  // CORS headers for GitHub Codespaces and cross-origin requests
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  // Manifest-specific headers
  headers.set('Content-Type', 'application/manifest+json');
  
  json(200, {
    name: "Qwik + LIT + Builder.io Stack",
    short_name: "Qwik Stack",
    description: "Modern web application with Qwik, LIT, and Builder.io",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  });
};