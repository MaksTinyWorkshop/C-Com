import mdx from "@astrojs/mdx";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import { webcore } from "webcoreui/integration";
import { rehypeBaseImages } from "./src/lib/rehypeBaseImages";

const siteUrl = "https://makstinyworkshop.github.io";
const siteBase = ""; // /C-Com

export default defineConfig({
  site: siteUrl,

  scopedStyleStrategy: "where",
  integrations: [tailwind(), mdx(), webcore()],
  output: "server",
  adapter: node({
    mode: "standalone", // indispensable pour le déploiement
  }),
  base: siteBase,
  markdown: {
    syntaxHighlight: "prism",
    rehypePlugins: [[rehypeBaseImages, { base: siteBase }]],
  },
  vite: { base: siteBase },
  alias: {
    "@components": "./src/components",
    "@layouts": "./src/layouts",
    "@lib": "./src/lib",
    "@styles": "./src/styles",
    "@content": "./src/content",
  },
});
