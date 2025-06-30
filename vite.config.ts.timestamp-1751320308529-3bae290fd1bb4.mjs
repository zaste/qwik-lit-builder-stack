// vite.config.ts
import { defineConfig } from "file:///app/code/node_modules/.pnpm/vite@5.4.19_@types+node@20.19.2/node_modules/vite/dist/node/index.js";
import { qwikVite } from "file:///app/code/node_modules/.pnpm/@builder.io+qwik@1.14.1_vite@5.4.19_@types+node@20.19.2_/node_modules/@builder.io/qwik/dist/optimizer.mjs";
import { qwikCity } from "file:///app/code/node_modules/.pnpm/@builder.io+qwik-city@1.14.1_acorn@8.15.0_rollup@4.44.1_typescript@5.8.3_vite@5.4.19_@types+node@20.19.2_/node_modules/@builder.io/qwik-city/lib/vite/index.mjs";
import tsconfigPaths from "file:///app/code/node_modules/.pnpm/vite-tsconfig-paths@4.3.2_typescript@5.8.3_vite@5.4.19_@types+node@20.19.2_/node_modules/vite-tsconfig-paths/dist/index.mjs";

// src/adapters/index.ts
async function importAdapters() {
  const [
    cfModule,
    staticModule
  ] = await Promise.allSettled([
    import("file:///app/code/node_modules/.pnpm/@builder.io+qwik-city@1.14.1_acorn@8.15.0_rollup@4.44.1_typescript@5.8.3_vite@5.4.19_@types+node@20.19.2_/node_modules/@builder.io/qwik-city/lib/adapters/cloudflare-pages/vite/index.mjs"),
    import("file:///app/code/node_modules/.pnpm/@builder.io+qwik-city@1.14.1_acorn@8.15.0_rollup@4.44.1_typescript@5.8.3_vite@5.4.19_@types+node@20.19.2_/node_modules/@builder.io/qwik-city/lib/adapters/static/vite/index.mjs")
  ]);
  return {
    cloudflareAdapter: cfModule.status === "fulfilled" ? cfModule.value.cloudflarePagesAdapter : null,
    staticAdapter: staticModule.status === "fulfilled" ? staticModule.value.staticAdapter : null
  };
}
async function getAdapter(target) {
  const deployTarget = target || process.env.DEPLOY_TARGET || "cloudflare";
  const adapters = await importAdapters();
  switch (deployTarget) {
    case "cloudflare":
      return adapters.cloudflareAdapter({
        ssg: {
          include: ["/*"],
          exclude: ["/api/*", "/admin/*", "/(app)/*"]
        }
      });
    default:
      return adapters.cloudflareAdapter();
  }
}

// vite.config.ts
var vite_config_default = defineConfig(async ({ command, mode }) => {
  const isProd = mode === "production";
  const adapter = await getAdapter(process.env.DEPLOY_TARGET);
  let hasBuilderDeps = false;
  try {
    await import("file:///app/code/node_modules/.pnpm/@builder.io+sdk@2.2.9/node_modules/@builder.io/sdk/dist/index.cjs.js");
    await import("file:///app/code/node_modules/.pnpm/@builder.io+sdk-qwik@0.21.1_@builder.io+qwik@1.14.1_vite@5.4.19_@types+node@20.19.2__/node_modules/@builder.io/sdk-qwik/lib/node/index.qwik.mjs");
    hasBuilderDeps = true;
  } catch {
    console.warn("Builder.io dependencies not found - CMS features will be disabled");
  }
  const baseDepsToInclude = [
    "@builder.io/qwik",
    "@builder.io/qwik-city",
    "lit",
    "@lit/reactive-element",
    "@lit/task"
  ];
  const optimizeDepsInclude = hasBuilderDeps ? [...baseDepsToInclude, "@builder.io/sdk", "@builder.io/sdk-qwik"] : baseDepsToInclude;
  return {
    plugins: [
      qwikCity({
        adapter
      }),
      qwikVite({
        // Optimization settings
        entryStrategy: { type: "smart" },
        srcDir: "src",
        tsconfigFileNames: ["tsconfig.json"],
        // LIT integration
        optimizeDeps: {
          include: ["lit", "lit/decorators.js"]
        }
      }),
      tsconfigPaths()
    ],
    // LIT-specific config
    build: {
      target: "es2020",
      outDir: "dist",
      rollupOptions: {
        external: isProd ? [] : ["lit"]
      }
    },
    // Optimization for dependencies
    optimizeDeps: {
      include: optimizeDepsInclude,
      exclude: ["@builder.io/qwik-city"]
    },
    // Environment variables
    define: {
      "import.meta.env.BUILDER_PUBLIC_KEY": JSON.stringify(process.env.BUILDER_PUBLIC_KEY || ""),
      "import.meta.env.DEPLOY_TARGET": JSON.stringify(process.env.DEPLOY_TARGET || "cloudflare"),
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(process.env.VITE_SUPABASE_URL || ""),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || "")
    },
    // Development server
    server: {
      headers: {
        "Cache-Control": "public, max-age=0"
      }
    },
    preview: {
      headers: {
        "Cache-Control": "public, max-age=600"
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAic3JjL2FkYXB0ZXJzL2luZGV4LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2FwcC9jb2RlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvYXBwL2NvZGUvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2FwcC9jb2RlL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgeyBxd2lrVml0ZSB9IGZyb20gJ0BidWlsZGVyLmlvL3F3aWsvb3B0aW1pemVyJztcbmltcG9ydCB7IHF3aWtDaXR5IH0gZnJvbSAnQGJ1aWxkZXIuaW8vcXdpay1jaXR5L3ZpdGUnO1xuaW1wb3J0IHRzY29uZmlnUGF0aHMgZnJvbSAndml0ZS10c2NvbmZpZy1wYXRocyc7XG5pbXBvcnQgeyBnZXRBZGFwdGVyIH0gZnJvbSAnLi9zcmMvYWRhcHRlcnMnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoYXN5bmMgKHsgY29tbWFuZCwgbW9kZSB9KSA9PiB7XG4gIGNvbnN0IGlzUHJvZCA9IG1vZGUgPT09ICdwcm9kdWN0aW9uJztcbiAgY29uc3QgYWRhcHRlciA9IGF3YWl0IGdldEFkYXB0ZXIocHJvY2Vzcy5lbnYuREVQTE9ZX1RBUkdFVCk7XG4gIFxuICAvLyBDaGVjayBpZiBCdWlsZGVyLmlvIGRlcGVuZGVuY2llcyBhcmUgYXZhaWxhYmxlXG4gIGxldCBoYXNCdWlsZGVyRGVwcyA9IGZhbHNlO1xuICB0cnkge1xuICAgIGF3YWl0IGltcG9ydCgnQGJ1aWxkZXIuaW8vc2RrJyk7XG4gICAgYXdhaXQgaW1wb3J0KCdAYnVpbGRlci5pby9zZGstcXdpaycpO1xuICAgIGhhc0J1aWxkZXJEZXBzID0gdHJ1ZTtcbiAgfSBjYXRjaCB7XG4gICAgY29uc29sZS53YXJuKCdCdWlsZGVyLmlvIGRlcGVuZGVuY2llcyBub3QgZm91bmQgLSBDTVMgZmVhdHVyZXMgd2lsbCBiZSBkaXNhYmxlZCcpO1xuICB9XG4gIFxuICAvLyBCYXNlIGRlcGVuZGVuY2llcyB0byBvcHRpbWl6ZVxuICBjb25zdCBiYXNlRGVwc1RvSW5jbHVkZSA9IFtcbiAgICAnQGJ1aWxkZXIuaW8vcXdpaycsXG4gICAgJ0BidWlsZGVyLmlvL3F3aWstY2l0eScsXG4gICAgJ2xpdCcsXG4gICAgJ0BsaXQvcmVhY3RpdmUtZWxlbWVudCcsXG4gICAgJ0BsaXQvdGFzaydcbiAgXTtcbiAgXG4gIC8vIEFkZCBCdWlsZGVyLmlvIGRlcHMgb25seSBpZiBhdmFpbGFibGVcbiAgY29uc3Qgb3B0aW1pemVEZXBzSW5jbHVkZSA9IGhhc0J1aWxkZXJEZXBzIFxuICAgID8gWy4uLmJhc2VEZXBzVG9JbmNsdWRlLCAnQGJ1aWxkZXIuaW8vc2RrJywgJ0BidWlsZGVyLmlvL3Nkay1xd2lrJ11cbiAgICA6IGJhc2VEZXBzVG9JbmNsdWRlO1xuICBcbiAgcmV0dXJuIHtcbiAgICBwbHVnaW5zOiBbXG4gICAgICBxd2lrQ2l0eSh7XG4gICAgICAgIGFkYXB0ZXJcbiAgICAgIH0pLFxuICAgICAgcXdpa1ZpdGUoe1xuICAgICAgICAvLyBPcHRpbWl6YXRpb24gc2V0dGluZ3NcbiAgICAgICAgZW50cnlTdHJhdGVneTogeyB0eXBlOiAnc21hcnQnIH0sXG4gICAgICAgIHNyY0RpcjogJ3NyYycsXG4gICAgICAgIHRzY29uZmlnRmlsZU5hbWVzOiBbJ3RzY29uZmlnLmpzb24nXSxcbiAgICAgICAgLy8gTElUIGludGVncmF0aW9uXG4gICAgICAgIG9wdGltaXplRGVwczoge1xuICAgICAgICAgIGluY2x1ZGU6IFsnbGl0JywgJ2xpdC9kZWNvcmF0b3JzLmpzJ11cbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgICB0c2NvbmZpZ1BhdGhzKClcbiAgICBdLFxuICAgIFxuICAgIC8vIExJVC1zcGVjaWZpYyBjb25maWdcbiAgICBidWlsZDoge1xuICAgICAgdGFyZ2V0OiAnZXMyMDIwJyxcbiAgICAgIG91dERpcjogJ2Rpc3QnLFxuICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICBleHRlcm5hbDogaXNQcm9kID8gW10gOiBbJ2xpdCddXG4gICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvLyBPcHRpbWl6YXRpb24gZm9yIGRlcGVuZGVuY2llc1xuICAgIG9wdGltaXplRGVwczoge1xuICAgICAgaW5jbHVkZTogb3B0aW1pemVEZXBzSW5jbHVkZSxcbiAgICAgIGV4Y2x1ZGU6IFsnQGJ1aWxkZXIuaW8vcXdpay1jaXR5J11cbiAgICB9LFxuICAgIFxuICAgIC8vIEVudmlyb25tZW50IHZhcmlhYmxlc1xuICAgIGRlZmluZToge1xuICAgICAgJ2ltcG9ydC5tZXRhLmVudi5CVUlMREVSX1BVQkxJQ19LRVknOiBKU09OLnN0cmluZ2lmeShwcm9jZXNzLmVudi5CVUlMREVSX1BVQkxJQ19LRVkgfHwgJycpLFxuICAgICAgJ2ltcG9ydC5tZXRhLmVudi5ERVBMT1lfVEFSR0VUJzogSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnYuREVQTE9ZX1RBUkdFVCB8fCAnY2xvdWRmbGFyZScpLFxuICAgICAgJ2ltcG9ydC5tZXRhLmVudi5WSVRFX1NVUEFCQVNFX1VSTCc6IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8ICcnKSxcbiAgICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWSc6IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfQU5PTl9LRVkgfHwgJycpXG4gICAgfSxcblxuICAgIC8vIERldmVsb3BtZW50IHNlcnZlclxuICAgIHNlcnZlcjoge1xuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ2FjaGUtQ29udHJvbCc6ICdwdWJsaWMsIG1heC1hZ2U9MCdcbiAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIHByZXZpZXc6IHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NhY2hlLUNvbnRyb2wnOiAncHVibGljLCBtYXgtYWdlPTYwMCdcbiAgICAgIH1cbiAgICB9XG4gIH07XG59KTtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2FwcC9jb2RlL3NyYy9hZGFwdGVyc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2FwcC9jb2RlL3NyYy9hZGFwdGVycy9pbmRleC50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vYXBwL2NvZGUvc3JjL2FkYXB0ZXJzL2luZGV4LnRzXCI7aW1wb3J0IHR5cGUgeyBRd2lrQ2l0eVZpdGVQbHVnaW5PcHRpb25zIH0gZnJvbSAnQGJ1aWxkZXIuaW8vcXdpay1jaXR5L3ZpdGUnO1xuXG4vKipcbiAqIEltcG9ydCBhZGFwdGVycyBkeW5hbWljYWxseSB0byBhdm9pZCBidWlsZCBlcnJvcnNcbiAqL1xuYXN5bmMgZnVuY3Rpb24gaW1wb3J0QWRhcHRlcnMoKSB7XG4gIGNvbnN0IFtcbiAgICBjZk1vZHVsZSxcbiAgICBzdGF0aWNNb2R1bGVcbiAgXSA9IGF3YWl0IFByb21pc2UuYWxsU2V0dGxlZChbXG4gICAgaW1wb3J0KCdAYnVpbGRlci5pby9xd2lrLWNpdHkvYWRhcHRlcnMvY2xvdWRmbGFyZS1wYWdlcy92aXRlJyksXG4gICAgaW1wb3J0KCdAYnVpbGRlci5pby9xd2lrLWNpdHkvYWRhcHRlcnMvc3RhdGljL3ZpdGUnKVxuICBdKTtcblxuICByZXR1cm4ge1xuICAgIGNsb3VkZmxhcmVBZGFwdGVyOiBjZk1vZHVsZS5zdGF0dXMgPT09ICdmdWxmaWxsZWQnID8gY2ZNb2R1bGUudmFsdWUuY2xvdWRmbGFyZVBhZ2VzQWRhcHRlciA6IG51bGwsXG4gICAgc3RhdGljQWRhcHRlcjogc3RhdGljTW9kdWxlLnN0YXR1cyA9PT0gJ2Z1bGZpbGxlZCcgPyBzdGF0aWNNb2R1bGUudmFsdWUuc3RhdGljQWRhcHRlciA6IG51bGxcbiAgfTtcbn1cblxuZXhwb3J0IHR5cGUgRGVwbG95VGFyZ2V0ID0gJ2Nsb3VkZmxhcmUnIHwgJ3N0YXRpYyc7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRBZGFwdGVyKHRhcmdldD86IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gIGNvbnN0IGRlcGxveVRhcmdldCA9ICh0YXJnZXQgfHwgcHJvY2Vzcy5lbnYuREVQTE9ZX1RBUkdFVCB8fCAnY2xvdWRmbGFyZScpIGFzIERlcGxveVRhcmdldDtcblxuICBjb25zdCBhZGFwdGVycyA9IGF3YWl0IGltcG9ydEFkYXB0ZXJzKCk7XG5cbiAgc3dpdGNoIChkZXBsb3lUYXJnZXQpIHtcbiAgICBjYXNlICdjbG91ZGZsYXJlJzpcbiAgICAgIHJldHVybiBhZGFwdGVycy5jbG91ZGZsYXJlQWRhcHRlcih7XG4gICAgICAgIHNzZzoge1xuICAgICAgICAgIGluY2x1ZGU6IFsnLyonXSxcbiAgICAgICAgICBleGNsdWRlOiBbJy9hcGkvKicsICcvYWRtaW4vKicsICcvKGFwcCkvKiddLFxuICAgICAgICB9LFxuICAgICAgfSk7XG5cbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGFkYXB0ZXJzLmNsb3VkZmxhcmVBZGFwdGVyKCk7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNk0sU0FBUyxvQkFBb0I7QUFDMU8sU0FBUyxnQkFBZ0I7QUFDekIsU0FBUyxnQkFBZ0I7QUFDekIsT0FBTyxtQkFBbUI7OztBQ0UxQixlQUFlLGlCQUFpQjtBQUM5QixRQUFNO0FBQUEsSUFDSjtBQUFBLElBQ0E7QUFBQSxFQUNGLElBQUksTUFBTSxRQUFRLFdBQVc7QUFBQSxJQUMzQixPQUFPLCtOQUFzRDtBQUFBLElBQzdELE9BQU8scU5BQTRDO0FBQUEsRUFDckQsQ0FBQztBQUVELFNBQU87QUFBQSxJQUNMLG1CQUFtQixTQUFTLFdBQVcsY0FBYyxTQUFTLE1BQU0seUJBQXlCO0FBQUEsSUFDN0YsZUFBZSxhQUFhLFdBQVcsY0FBYyxhQUFhLE1BQU0sZ0JBQWdCO0FBQUEsRUFDMUY7QUFDRjtBQUlBLGVBQXNCLFdBQVcsUUFBK0I7QUFDOUQsUUFBTSxlQUFnQixVQUFVLFFBQVEsSUFBSSxpQkFBaUI7QUFFN0QsUUFBTSxXQUFXLE1BQU0sZUFBZTtBQUV0QyxVQUFRLGNBQWM7QUFBQSxJQUNwQixLQUFLO0FBQ0gsYUFBTyxTQUFTLGtCQUFrQjtBQUFBLFFBQ2hDLEtBQUs7QUFBQSxVQUNILFNBQVMsQ0FBQyxJQUFJO0FBQUEsVUFDZCxTQUFTLENBQUMsVUFBVSxZQUFZLFVBQVU7QUFBQSxRQUM1QztBQUFBLE1BQ0YsQ0FBQztBQUFBLElBRUg7QUFDRSxhQUFPLFNBQVMsa0JBQWtCO0FBQUEsRUFDdEM7QUFDRjs7O0FEakNBLElBQU8sc0JBQVEsYUFBYSxPQUFPLEVBQUUsU0FBUyxLQUFLLE1BQU07QUFDdkQsUUFBTSxTQUFTLFNBQVM7QUFDeEIsUUFBTSxVQUFVLE1BQU0sV0FBVyxRQUFRLElBQUksYUFBYTtBQUcxRCxNQUFJLGlCQUFpQjtBQUNyQixNQUFJO0FBQ0YsVUFBTSxPQUFPLDBHQUFpQjtBQUM5QixVQUFNLE9BQU8scUxBQXNCO0FBQ25DLHFCQUFpQjtBQUFBLEVBQ25CLFFBQVE7QUFDTixZQUFRLEtBQUssbUVBQW1FO0FBQUEsRUFDbEY7QUFHQSxRQUFNLG9CQUFvQjtBQUFBLElBQ3hCO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0Y7QUFHQSxRQUFNLHNCQUFzQixpQkFDeEIsQ0FBQyxHQUFHLG1CQUFtQixtQkFBbUIsc0JBQXNCLElBQ2hFO0FBRUosU0FBTztBQUFBLElBQ0wsU0FBUztBQUFBLE1BQ1AsU0FBUztBQUFBLFFBQ1A7QUFBQSxNQUNGLENBQUM7QUFBQSxNQUNELFNBQVM7QUFBQTtBQUFBLFFBRVAsZUFBZSxFQUFFLE1BQU0sUUFBUTtBQUFBLFFBQy9CLFFBQVE7QUFBQSxRQUNSLG1CQUFtQixDQUFDLGVBQWU7QUFBQTtBQUFBLFFBRW5DLGNBQWM7QUFBQSxVQUNaLFNBQVMsQ0FBQyxPQUFPLG1CQUFtQjtBQUFBLFFBQ3RDO0FBQUEsTUFDRixDQUFDO0FBQUEsTUFDRCxjQUFjO0FBQUEsSUFDaEI7QUFBQTtBQUFBLElBR0EsT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLE1BQ1IsUUFBUTtBQUFBLE1BQ1IsZUFBZTtBQUFBLFFBQ2IsVUFBVSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUs7QUFBQSxNQUNoQztBQUFBLElBQ0Y7QUFBQTtBQUFBLElBR0EsY0FBYztBQUFBLE1BQ1osU0FBUztBQUFBLE1BQ1QsU0FBUyxDQUFDLHVCQUF1QjtBQUFBLElBQ25DO0FBQUE7QUFBQSxJQUdBLFFBQVE7QUFBQSxNQUNOLHNDQUFzQyxLQUFLLFVBQVUsUUFBUSxJQUFJLHNCQUFzQixFQUFFO0FBQUEsTUFDekYsaUNBQWlDLEtBQUssVUFBVSxRQUFRLElBQUksaUJBQWlCLFlBQVk7QUFBQSxNQUN6RixxQ0FBcUMsS0FBSyxVQUFVLFFBQVEsSUFBSSxxQkFBcUIsRUFBRTtBQUFBLE1BQ3ZGLDBDQUEwQyxLQUFLLFVBQVUsUUFBUSxJQUFJLDBCQUEwQixFQUFFO0FBQUEsSUFDbkc7QUFBQTtBQUFBLElBR0EsUUFBUTtBQUFBLE1BQ04sU0FBUztBQUFBLFFBQ1AsaUJBQWlCO0FBQUEsTUFDbkI7QUFBQSxJQUNGO0FBQUEsSUFFQSxTQUFTO0FBQUEsTUFDUCxTQUFTO0FBQUEsUUFDUCxpQkFBaUI7QUFBQSxNQUNuQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
