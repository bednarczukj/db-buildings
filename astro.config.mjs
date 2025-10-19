import { defineConfig } from "astro/config";

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
  integrations: [react()],
  vite: {
    // @ts-expect-error - Tailwind Vite plugin has type compatibility issues with Astro
    plugins: [tailwindcss()],
  },
});
