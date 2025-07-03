export default {
  async fetch(request, env, ctx) {
    return (await import("./entry.cloudflare-pages.js")).default(request, env, ctx);
  }
};