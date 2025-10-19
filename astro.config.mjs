import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: process.env.CF_PAGES // eslint-disable-line no-undef
    ? cloudflare({
        mode: "advanced",
      })
    : node({
        mode: "standalone",
      }),
  server: process.env.CF_PAGES // eslint-disable-line no-undef
    ? undefined
    : {
        port: 3000,
        host: "localhost",
      },
  env: {
    schema: {
      // Supabase
      SUPABASE_URL: envField.string({ context: "server", access: "secret" }),
      PUBLIC_SUPABASE_KEY: envField.string({ context: "client", access: "public" }),
      SUPABASE_SERVICE_ROLE_KEY: envField.string({ context: "server", access: "secret" }),

      // AI Service
      OPENROUTER_API_KEY: envField.string({ context: "server", access: "secret" }),

      // Feature Flags
      PUBLIC_ENV_NAME: envField.string({ context: "client", access: "public", optional: true }),
    },
  },
  integrations: [react()],
  vite: {
    // @ts-expect-error - Tailwind Vite plugin has type compatibility issues with Astro
    plugins: [tailwindcss()],
  },
});
