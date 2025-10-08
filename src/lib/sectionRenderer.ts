import type { CollectionEntry } from 'astro:content';

import CatalogueSection from '@components/Catalogue/CatalogueSection.astro';
import CtaBanner from '@components/CTAs/CTABanner/CtaBanner.astro';
import CtaDownload from '@components/CTAs/CTADownload/CtaDownload.astro';
import FeatureGrid from '@components/Features/FeatureSecteur.astro';
import FeatureTarif from '@components/Features/FeatureTarif.astro';
import HeroSection from '@components/Home/HeroSection.astro';
import MarkdownSection from '@components/Markdown/MarkdownSection.astro';
import ContactFormSection from '@components/Form/HandmadeForm/ContactFormSection.astro';
import Tarifs from '@components/Tarifs/Tarifs.astro';
import GoogleFormSection from '@components/Form/GoogleForm/GoogleFormSection.astro';
import FAQSection from '@components/FAQSection.astro';
import ParcoursSection from '@components/ParcoursSection.astro';
import ImagesGrid from '@components/ImagesGrid.astro';
import MapSection from '@components/MapSection.astro';
import TestimonialsSection from '@components/TestimonialsSection.astro';


const componentMap = {
  hero: HeroSection,
  'feature-grid': FeatureGrid,
  parcours: ParcoursSection,
  tarifs: Tarifs,
  faq: FAQSection,
  'contact-form': ContactFormSection,
  markdown: MarkdownSection,
  map: MapSection,
  cta: CtaBanner,
  'google-form': GoogleFormSection,
  images: ImagesGrid,
  catalogue: CatalogueSection,
  testimonials: TestimonialsSection
} as const;

type SectionComponentName = keyof typeof componentMap;

type SectionComponentResult =
  | (typeof componentMap)[SectionComponentName]
  | typeof CtaDownload
  | typeof FeatureTarif;

type ResolvedSection = {
  Component: SectionComponentResult;
  props: any;
};

export async function resolveSection(
  section: CollectionEntry<'sections'>,
): Promise<ResolvedSection> {
  const componentKey = section.data.component as SectionComponentName;
  const Component = componentMap[componentKey];

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
          ctas: section.data.ctas,
          image: section.data.image,
        },
      };
    case 'tarifs':
      return {
        Component,
        props: {
          defaultPlan: section.data.defaultPlan,
          plans: section.data.plans,
          options: section.data.options,
          modal: section.data.modal,
        },
      };
    case 'feature-grid':
      if (section.data.key === 'grid-tarifs') {
        return {
          Component: FeatureTarif,
          props: {
            eyebrow: section.data.eyebrow,
            title: section.data.title,
            description: section.data.description,
            features: section.data.features,
          },
        };
      }
      
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
    case 'contact-form':
      return {
        Component,
        props: {
          title: section.data.title,
          subtitle: section.data.subtitle,
          highlights: section.data.highlights,
          formulas: section.data.formulas,
          defaultFormula: section.data.defaultFormula,
          submitLabel: section.data.submitLabel,
          successMessage: section.data.successMessage,
        },
      };
    case 'markdown': {
      const { Content } = await section.render();
      return {
        Component,
        props: {
          title: section.data.title,
          description: section.data.description,
          variant: section.data.variant,
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
    case 'google-form':
      return {
        Component,
        props: {
          title: section.data.title,
          description: section.data.description,
          formUrl: section.data.formUrl,
          height: section.data.height,
        },
      };
    case 'cta': {
      if (section.data.file) {
        return {
          Component: CtaDownload,
          props: {
            eyebrow: section.data.eyebrow,
            title: section.data.title,
            content: section.data.content,
            description: section.data.description,
            note: section.data.note,
            file: section.data.file,
            downloadName: section.data.downloadName,
          },
        };
      }

      return {
        Component,
        props: {
          eyebrow: section.data.eyebrow,
          title: section.data.title,
          description: section.data.description,
          content: section.data.content,
          ctas: section.data.ctas,
          note: section.data.note,
        },
      };
    }
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
