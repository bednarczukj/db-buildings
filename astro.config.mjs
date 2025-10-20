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
        mode: "directory",
      })
    : node({
        mode: "standalone",
      }),
  server: process.env.CF_PAGES // eslint-disable-line no-undef
    ? undefined
    : {
        port: process.env.PORT ? parseInt(process.env.PORT) : 3000, // eslint-disable-line no-undef
        host: "localhost",
      },
  integrations: [react()],
  vite: {
    // @ts-expect-error - Tailwind Vite plugin has type compatibility issues with Astro
    plugins: [tailwindcss()],
  },
});
