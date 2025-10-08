import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import { webcore } from "webcoreui/integration";
import node from "@astrojs/node";
import { rehypeBaseImages } from "./src/lib/rehypeBaseImages";

const siteUrl = "https://makstinyworkshop.github.io";
const siteBase = "/C-com";

export default defineConfig({
  site: siteUrl,

  scopedStyleStrategy: "where",
  integrations: [tailwind(), mdx(), webcore()],
  adapter: node({
    mode: "standalone",
  }),
  output: "static",
  base: siteBase,
  markdown: {
    syntaxHighlight: "prism",
    rehypePlugins: [[rehypeBaseImages, { base: siteBase }]],
  },
  alias: {
    "@components": "./src/components",
    "@layouts": "./src/layouts",
    "@lib": "./src/lib",
    "@styles": "./src/styles",
    "@content": "./src/content",
  },
});
