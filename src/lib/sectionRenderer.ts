import type { CollectionEntry } from 'astro:content';

import CatalogueSection from '@components/Catalogue/CatalogueSection.astro';
import CtaBanner from '@components/CtaBanner.astro';
import FeatureGrid from '@components/FeatureGrid.astro';
import HeroSection from '@components/Home/HeroSection.astro';
import MarkdownSection from '@components/MarkdownSection.astro';
import FAQSection from '@components/FAQSection.astro';
import ParcoursSection from '@components/ParcoursSection.astro';
import ImagesGrid from '@components/ImagesGrid.astro';
import MapSection from '@components/MapSection.astro';
import TestimonialsSection from '@components/TestimonialsSection.astro';


const componentMap = {
  hero: HeroSection,
  'feature-grid': FeatureGrid,
  parcours: ParcoursSection,
  faq: FAQSection,
  markdown: MarkdownSection,
  map: MapSection,
  cta: CtaBanner,
  images: ImagesGrid,
  catalogue: CatalogueSection,
  testimonials: TestimonialsSection
} as const;

type SectionComponentName = keyof typeof componentMap;

type ResolvedSection = {
  Component: (typeof componentMap)[SectionComponentName];
  props: any;
};

export async function resolveSection(
  section: CollectionEntry<'sections'>,
): Promise<ResolvedSection> {
  const Component = componentMap[section.data.component as SectionComponentName];

  if (!Component) {
    throw new Error(`Section inconnue: ${section.id}`);
  }

  switch (section.data.component) {
    case 'hero':
      return {
        Component,
        props: {
          eyebrow: section.data.eyebrow,
          title: section.data.title,
          content: section.data.content,
          primaryCta: section.data.primaryCta,
          secondaryCta: section.data.secondaryCta,
          tertiaryCta: section.data.tertiaryCta,
          image: section.data.image,
        },
      };
    case 'feature-grid':
      return {
        Component,
        props: {
          eyebrow: section.data.eyebrow,
          title: section.data.title,
          description: section.data.description,
          features: section.data.features,
        },
      };
    case 'parcours':
      return {
        Component,
        props: {
          title: section.data.title,
          schema: section.data.schema,
          description: section.data.description,
          steps: section.data.steps,
        },
      };
    case 'faq':
      return {
        Component,
        props: {
          title: section.data.title,
          description: section.data.description,
          questions: section.data.questions,
        },
      };
    case 'markdown': {
      const { Content } = await section.render();
      return {
        Component,
        props: {
          title: section.data.title,
          description: section.data.description,
          images: section.data.images,
          Content,
        },
      };
    }
    case 'map':
      return {
        Component,
        props: {
          title: section.data.title,
          caption: section.data.caption,
          embedUrl: section.data.embedUrl,
        },
      };
    case 'cta':
      return {
        Component,
        props: {
          eyebrow: section.data.eyebrow,
          title: section.data.title,
          description: section.data.description,
          content: section.data.content,
          primaryCta: section.data.primaryCta,
          secondaryCta: section.data.secondaryCta,
        },
      };
    case 'images':
      return {
        Component,
        props: {
          images: section.data.images,
        },
      };
    case 'catalogue':
      return {
        Component,
        props: {
          eyebrow: section.data.eyebrow,
          title: section.data.title,
          intro: section.data.intro,
          categories: section.data.categories,
          defaultCategory: section.data.defaultCategory,
          footnote: section.data.footnote,
        },
      };
    case 'testimonials':
      return {
        Component,
        props: {
          title: section.data.title,
          description: section.data.description,
          testimonials: section.data.testimonials,
        },
      };
    default:
      throw new Error(`Section non gérée: ${section.id}`);
  }
}
