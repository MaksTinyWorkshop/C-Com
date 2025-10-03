import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import { webcore } from 'webcoreui/integration'


export default defineConfig({
  site: 'https://makstinyworkshop.github.io',

  scopedStyleStrategy: 'where',
  integrations: [tailwind(), mdx(), webcore()],
  // Rajout de ces deux lignes pour GithubPages
  //output: 'static',
  //base: '/Nom_du_Repo',
  //
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
