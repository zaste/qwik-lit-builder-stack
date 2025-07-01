import type { RequestHandler } from '@builder.io/qwik-city';

export const onGet: RequestHandler = async ({ json, headers }) => {
  headers.set('Cache-Control', 'public, max-age=3600');
  
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