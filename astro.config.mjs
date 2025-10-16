import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
  server: {
    port: 3000,
  },
  integrations: [react()],
  vite: {
    // @ts-expect-error - Tailwind Vite plugin has type compatibility issues with Astro
    plugins: [tailwindcss()],
  },
});
