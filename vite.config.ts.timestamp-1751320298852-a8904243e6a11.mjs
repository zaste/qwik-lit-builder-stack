// vite.config.ts
import { defineConfig } from "file:///app/code/node_modules/.pnpm/vite@5.4.19_@types+node@20.19.2/node_modules/vite/dist/node/index.js";
import { qwikVite } from "file:///app/code/node_modules/.pnpm/@builder.io+qwik@1.14.1_vite@5.4.19_@types+node@20.19.2_/node_modules/@builder.io/qwik/dist/optimizer.mjs";
import { qwikCity } from "file:///app/code/node_modules/.pnpm/@builder.io+qwik-city@1.14.1_acorn@8.15.0_rollup@4.44.1_typescript@5.8.3_vite@5.4.19_@types+node@20.19.2_/node_modules/@builder.io/qwik-city/lib/vite/index.mjs";
import tsconfigPaths from "file:///app/code/node_modules/.pnpm/vite-tsconfig-paths@4.3.2_typescript@5.8.3_vite@5.4.19_@types+node@20.19.2_/node_modules/vite-tsconfig-paths/dist/index.mjs";

// src/adapters/index.ts
async function importAdapters() {
  const [
    cfModule
  ] = await Promise.all([
    import("file:///app/code/node_modules/.pnpm/@builder.io+qwik-city@1.14.1_acorn@8.15.0_rollup@4.44.1_typescript@5.8.3_vite@5.4.19_@types+node@20.19.2_/node_modules/@builder.io/qwik-city/lib/adapters/cloudflare-pages/vite/index.mjs")
  ]);
  return {
    cloudflareAdapter: cfModule.cloudflarePagesAdapter
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAic3JjL2FkYXB0ZXJzL2luZGV4LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2FwcC9jb2RlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvYXBwL2NvZGUvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2FwcC9jb2RlL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgeyBxd2lrVml0ZSB9IGZyb20gJ0BidWlsZGVyLmlvL3F3aWsvb3B0aW1pemVyJztcbmltcG9ydCB7IHF3aWtDaXR5IH0gZnJvbSAnQGJ1aWxkZXIuaW8vcXdpay1jaXR5L3ZpdGUnO1xuaW1wb3J0IHRzY29uZmlnUGF0aHMgZnJvbSAndml0ZS10c2NvbmZpZy1wYXRocyc7XG5pbXBvcnQgeyBnZXRBZGFwdGVyIH0gZnJvbSAnLi9zcmMvYWRhcHRlcnMnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoYXN5bmMgKHsgY29tbWFuZCwgbW9kZSB9KSA9PiB7XG4gIGNvbnN0IGlzUHJvZCA9IG1vZGUgPT09ICdwcm9kdWN0aW9uJztcbiAgY29uc3QgYWRhcHRlciA9IGF3YWl0IGdldEFkYXB0ZXIocHJvY2Vzcy5lbnYuREVQTE9ZX1RBUkdFVCk7XG4gIFxuICAvLyBDaGVjayBpZiBCdWlsZGVyLmlvIGRlcGVuZGVuY2llcyBhcmUgYXZhaWxhYmxlXG4gIGxldCBoYXNCdWlsZGVyRGVwcyA9IGZhbHNlO1xuICB0cnkge1xuICAgIGF3YWl0IGltcG9ydCgnQGJ1aWxkZXIuaW8vc2RrJyk7XG4gICAgYXdhaXQgaW1wb3J0KCdAYnVpbGRlci5pby9zZGstcXdpaycpO1xuICAgIGhhc0J1aWxkZXJEZXBzID0gdHJ1ZTtcbiAgfSBjYXRjaCB7XG4gICAgY29uc29sZS53YXJuKCdCdWlsZGVyLmlvIGRlcGVuZGVuY2llcyBub3QgZm91bmQgLSBDTVMgZmVhdHVyZXMgd2lsbCBiZSBkaXNhYmxlZCcpO1xuICB9XG4gIFxuICAvLyBCYXNlIGRlcGVuZGVuY2llcyB0byBvcHRpbWl6ZVxuICBjb25zdCBiYXNlRGVwc1RvSW5jbHVkZSA9IFtcbiAgICAnQGJ1aWxkZXIuaW8vcXdpaycsXG4gICAgJ0BidWlsZGVyLmlvL3F3aWstY2l0eScsXG4gICAgJ2xpdCcsXG4gICAgJ0BsaXQvcmVhY3RpdmUtZWxlbWVudCcsXG4gICAgJ0BsaXQvdGFzaydcbiAgXTtcbiAgXG4gIC8vIEFkZCBCdWlsZGVyLmlvIGRlcHMgb25seSBpZiBhdmFpbGFibGVcbiAgY29uc3Qgb3B0aW1pemVEZXBzSW5jbHVkZSA9IGhhc0J1aWxkZXJEZXBzIFxuICAgID8gWy4uLmJhc2VEZXBzVG9JbmNsdWRlLCAnQGJ1aWxkZXIuaW8vc2RrJywgJ0BidWlsZGVyLmlvL3Nkay1xd2lrJ11cbiAgICA6IGJhc2VEZXBzVG9JbmNsdWRlO1xuICBcbiAgcmV0dXJuIHtcbiAgICBwbHVnaW5zOiBbXG4gICAgICBxd2lrQ2l0eSh7XG4gICAgICAgIGFkYXB0ZXJcbiAgICAgIH0pLFxuICAgICAgcXdpa1ZpdGUoe1xuICAgICAgICAvLyBPcHRpbWl6YXRpb24gc2V0dGluZ3NcbiAgICAgICAgZW50cnlTdHJhdGVneTogeyB0eXBlOiAnc21hcnQnIH0sXG4gICAgICAgIHNyY0RpcjogJ3NyYycsXG4gICAgICAgIHRzY29uZmlnRmlsZU5hbWVzOiBbJ3RzY29uZmlnLmpzb24nXSxcbiAgICAgICAgLy8gTElUIGludGVncmF0aW9uXG4gICAgICAgIG9wdGltaXplRGVwczoge1xuICAgICAgICAgIGluY2x1ZGU6IFsnbGl0JywgJ2xpdC9kZWNvcmF0b3JzLmpzJ11cbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgICB0c2NvbmZpZ1BhdGhzKClcbiAgICBdLFxuICAgIFxuICAgIC8vIExJVC1zcGVjaWZpYyBjb25maWdcbiAgICBidWlsZDoge1xuICAgICAgdGFyZ2V0OiAnZXMyMDIwJyxcbiAgICAgIG91dERpcjogJ2Rpc3QnLFxuICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICBleHRlcm5hbDogaXNQcm9kID8gW10gOiBbJ2xpdCddXG4gICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvLyBPcHRpbWl6YXRpb24gZm9yIGRlcGVuZGVuY2llc1xuICAgIG9wdGltaXplRGVwczoge1xuICAgICAgaW5jbHVkZTogb3B0aW1pemVEZXBzSW5jbHVkZSxcbiAgICAgIGV4Y2x1ZGU6IFsnQGJ1aWxkZXIuaW8vcXdpay1jaXR5J11cbiAgICB9LFxuICAgIFxuICAgIC8vIEVudmlyb25tZW50IHZhcmlhYmxlc1xuICAgIGRlZmluZToge1xuICAgICAgJ2ltcG9ydC5tZXRhLmVudi5CVUlMREVSX1BVQkxJQ19LRVknOiBKU09OLnN0cmluZ2lmeShwcm9jZXNzLmVudi5CVUlMREVSX1BVQkxJQ19LRVkgfHwgJycpLFxuICAgICAgJ2ltcG9ydC5tZXRhLmVudi5ERVBMT1lfVEFSR0VUJzogSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnYuREVQTE9ZX1RBUkdFVCB8fCAnY2xvdWRmbGFyZScpLFxuICAgICAgJ2ltcG9ydC5tZXRhLmVudi5WSVRFX1NVUEFCQVNFX1VSTCc6IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8ICcnKSxcbiAgICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWSc6IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfQU5PTl9LRVkgfHwgJycpXG4gICAgfSxcblxuICAgIC8vIERldmVsb3BtZW50IHNlcnZlclxuICAgIHNlcnZlcjoge1xuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ2FjaGUtQ29udHJvbCc6ICdwdWJsaWMsIG1heC1hZ2U9MCdcbiAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIHByZXZpZXc6IHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NhY2hlLUNvbnRyb2wnOiAncHVibGljLCBtYXgtYWdlPTYwMCdcbiAgICAgIH1cbiAgICB9XG4gIH07XG59KTtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2FwcC9jb2RlL3NyYy9hZGFwdGVyc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2FwcC9jb2RlL3NyYy9hZGFwdGVycy9pbmRleC50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vYXBwL2NvZGUvc3JjL2FkYXB0ZXJzL2luZGV4LnRzXCI7aW1wb3J0IHR5cGUgeyBRd2lrQ2l0eVZpdGVQbHVnaW5PcHRpb25zIH0gZnJvbSAnQGJ1aWxkZXIuaW8vcXdpay1jaXR5L3ZpdGUnO1xuXG4vKipcbiAqIEltcG9ydCBhZGFwdGVycyBkeW5hbWljYWxseSB0byBhdm9pZCBidWlsZCBlcnJvcnNcbiAqL1xuYXN5bmMgZnVuY3Rpb24gaW1wb3J0QWRhcHRlcnMoKSB7XG4gIGNvbnN0IFtcbiAgICBjZk1vZHVsZVxuICBdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgIGltcG9ydCgnQGJ1aWxkZXIuaW8vcXdpay1jaXR5L2FkYXB0ZXJzL2Nsb3VkZmxhcmUtcGFnZXMvdml0ZScpXG4gIF0pO1xuXG4gIHJldHVybiB7XG4gICAgY2xvdWRmbGFyZUFkYXB0ZXI6IGNmTW9kdWxlLmNsb3VkZmxhcmVQYWdlc0FkYXB0ZXJcbiAgfTtcbn1cblxuZXhwb3J0IHR5cGUgRGVwbG95VGFyZ2V0ID0gJ2Nsb3VkZmxhcmUnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QWRhcHRlcih0YXJnZXQ/OiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICBjb25zdCBkZXBsb3lUYXJnZXQgPSAodGFyZ2V0IHx8IHByb2Nlc3MuZW52LkRFUExPWV9UQVJHRVQgfHwgJ2Nsb3VkZmxhcmUnKSBhcyBEZXBsb3lUYXJnZXQ7XG5cbiAgY29uc3QgYWRhcHRlcnMgPSBhd2FpdCBpbXBvcnRBZGFwdGVycygpO1xuXG4gIHN3aXRjaCAoZGVwbG95VGFyZ2V0KSB7XG4gICAgY2FzZSAnY2xvdWRmbGFyZSc6XG4gICAgICByZXR1cm4gYWRhcHRlcnMuY2xvdWRmbGFyZUFkYXB0ZXIoe1xuICAgICAgICBzc2c6IHtcbiAgICAgICAgICBpbmNsdWRlOiBbJy8qJ10sXG4gICAgICAgICAgZXhjbHVkZTogWycvYXBpLyonLCAnL2FkbWluLyonLCAnLyhhcHApLyonXSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBhZGFwdGVycy5jbG91ZGZsYXJlQWRhcHRlcigpO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTZNLFNBQVMsb0JBQW9CO0FBQzFPLFNBQVMsZ0JBQWdCO0FBQ3pCLFNBQVMsZ0JBQWdCO0FBQ3pCLE9BQU8sbUJBQW1COzs7QUNFMUIsZUFBZSxpQkFBaUI7QUFDOUIsUUFBTTtBQUFBLElBQ0o7QUFBQSxFQUNGLElBQUksTUFBTSxRQUFRLElBQUk7QUFBQSxJQUNwQixPQUFPLCtOQUFzRDtBQUFBLEVBQy9ELENBQUM7QUFFRCxTQUFPO0FBQUEsSUFDTCxtQkFBbUIsU0FBUztBQUFBLEVBQzlCO0FBQ0Y7QUFJQSxlQUFzQixXQUFXLFFBQStCO0FBQzlELFFBQU0sZUFBZ0IsVUFBVSxRQUFRLElBQUksaUJBQWlCO0FBRTdELFFBQU0sV0FBVyxNQUFNLGVBQWU7QUFFdEMsVUFBUSxjQUFjO0FBQUEsSUFDcEIsS0FBSztBQUNILGFBQU8sU0FBUyxrQkFBa0I7QUFBQSxRQUNoQyxLQUFLO0FBQUEsVUFDSCxTQUFTLENBQUMsSUFBSTtBQUFBLFVBQ2QsU0FBUyxDQUFDLFVBQVUsWUFBWSxVQUFVO0FBQUEsUUFDNUM7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUVIO0FBQ0UsYUFBTyxTQUFTLGtCQUFrQjtBQUFBLEVBQ3RDO0FBQ0Y7OztBRDlCQSxJQUFPLHNCQUFRLGFBQWEsT0FBTyxFQUFFLFNBQVMsS0FBSyxNQUFNO0FBQ3ZELFFBQU0sU0FBUyxTQUFTO0FBQ3hCLFFBQU0sVUFBVSxNQUFNLFdBQVcsUUFBUSxJQUFJLGFBQWE7QUFHMUQsTUFBSSxpQkFBaUI7QUFDckIsTUFBSTtBQUNGLFVBQU0sT0FBTywwR0FBaUI7QUFDOUIsVUFBTSxPQUFPLHFMQUFzQjtBQUNuQyxxQkFBaUI7QUFBQSxFQUNuQixRQUFRO0FBQ04sWUFBUSxLQUFLLG1FQUFtRTtBQUFBLEVBQ2xGO0FBR0EsUUFBTSxvQkFBb0I7QUFBQSxJQUN4QjtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGO0FBR0EsUUFBTSxzQkFBc0IsaUJBQ3hCLENBQUMsR0FBRyxtQkFBbUIsbUJBQW1CLHNCQUFzQixJQUNoRTtBQUVKLFNBQU87QUFBQSxJQUNMLFNBQVM7QUFBQSxNQUNQLFNBQVM7QUFBQSxRQUNQO0FBQUEsTUFDRixDQUFDO0FBQUEsTUFDRCxTQUFTO0FBQUE7QUFBQSxRQUVQLGVBQWUsRUFBRSxNQUFNLFFBQVE7QUFBQSxRQUMvQixRQUFRO0FBQUEsUUFDUixtQkFBbUIsQ0FBQyxlQUFlO0FBQUE7QUFBQSxRQUVuQyxjQUFjO0FBQUEsVUFDWixTQUFTLENBQUMsT0FBTyxtQkFBbUI7QUFBQSxRQUN0QztBQUFBLE1BQ0YsQ0FBQztBQUFBLE1BQ0QsY0FBYztBQUFBLElBQ2hCO0FBQUE7QUFBQSxJQUdBLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxNQUNSLFFBQVE7QUFBQSxNQUNSLGVBQWU7QUFBQSxRQUNiLFVBQVUsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLO0FBQUEsTUFDaEM7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUdBLGNBQWM7QUFBQSxNQUNaLFNBQVM7QUFBQSxNQUNULFNBQVMsQ0FBQyx1QkFBdUI7QUFBQSxJQUNuQztBQUFBO0FBQUEsSUFHQSxRQUFRO0FBQUEsTUFDTixzQ0FBc0MsS0FBSyxVQUFVLFFBQVEsSUFBSSxzQkFBc0IsRUFBRTtBQUFBLE1BQ3pGLGlDQUFpQyxLQUFLLFVBQVUsUUFBUSxJQUFJLGlCQUFpQixZQUFZO0FBQUEsTUFDekYscUNBQXFDLEtBQUssVUFBVSxRQUFRLElBQUkscUJBQXFCLEVBQUU7QUFBQSxNQUN2RiwwQ0FBMEMsS0FBSyxVQUFVLFFBQVEsSUFBSSwwQkFBMEIsRUFBRTtBQUFBLElBQ25HO0FBQUE7QUFBQSxJQUdBLFFBQVE7QUFBQSxNQUNOLFNBQVM7QUFBQSxRQUNQLGlCQUFpQjtBQUFBLE1BQ25CO0FBQUEsSUFDRjtBQUFBLElBRUEsU0FBUztBQUFBLE1BQ1AsU0FBUztBQUFBLFFBQ1AsaUJBQWlCO0FBQUEsTUFDbkI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
