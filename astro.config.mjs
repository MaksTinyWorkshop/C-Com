import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import { webcore } from 'webcoreui/integration';
import node from '@astrojs/node';


export default defineConfig({
  site: 'https://makstinyworkshop.github.io',

  scopedStyleStrategy: 'where',
  integrations: [tailwind(), mdx(), webcore()],
  adapter: node({
    mode: 'standalone',
  }),
  output: 'static',
  // Conserve ce sous-chemin si le site est servi à partir de /CCom
  base: '/C-Com',
  markdown: {
    syntaxHighlight: 'prism',
  },
  alias: {
    '@components': './src/components',
    '@layouts': './src/layouts',
    '@lib': './src/lib',
    '@styles': './src/styles',
    '@content': './src/content',
  },
});
