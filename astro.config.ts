import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  site: "https://orifude.com",
  trailingSlash: "never",
  vite: {
    plugins: [tailwindcss()],
  },
});
