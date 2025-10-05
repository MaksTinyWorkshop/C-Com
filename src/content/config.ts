import { defineCollection, z } from 'astro:content';

const callToActionSchema = z.object({
  label: z.string(),
  href: z.string(),
  icon: z.string().optional(),
});

const tarifsOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  price: z.string(),
  type: z.enum(['base', 'video', 'extra']).default('extra'),
  defaultSelected: z.boolean().optional(),
  disabled: z.boolean().optional(),
});

const tarifsPlanSchema = z.object({
  slug: z.string(),
  icon: z.string().optional(),
  subtitle: z.string().optional(),
  price: z.string(),
  footnote: z.string().optional(),
  description: z.string().optional(),
  moreInfoTitle: z.string().optional(),
  moreInfoContent: z.string().optional(),
});

const tarifsSchema = z.object({
  component: z.literal('tarifs'),
  defaultPlan: z.string(),
  plans: z.array(tarifsPlanSchema).min(1),
  options: z.array(tarifsOptionSchema).min(1),
  modal: z
    .object({
      title: z.string().optional(),
      content: z.string(),
    })
    .optional(),
});


const heroSchema = z.object({
  component: z.literal('hero'),
  eyebrow: z.string().optional(),
  title: z.string(),
  content: z.string(),
  image: z
    .object({
      src: z.string(),
      alt: z.string().optional(),
    })
    .optional(),
  primaryCta: callToActionSchema.optional(),
  secondaryCta: callToActionSchema.optional(),
  tertiaryCta: callToActionSchema.optional(),
});

const featureGridSchema = z.object({
  component: z.literal('feature-grid'),
  eyebrow: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  features: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        icon: z.string().optional(),
      }),
    )
    .min(1),
});

const parcoursSchema = z.object({
  component: z.literal('parcours'),
  title: z.string(),
  schema: z.string().optional(),
  description: z.string().optional(),
  steps: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        icon: z.string().optional(),
      }),
    )
    .min(1),
});

const faqSchema = z.object({
  component: z.literal('faq'),
  title: z.string(),
  description: z.string().optional(),
  questions: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
        role: z.string().optional(),
      }),
    )
    .min(1),
});

const markdownSchema = z.object({
  component: z.literal('markdown'),
  title: z.string().optional(),
  variant: z.string().optional(),
  description: z.string().optional(),
  images: z
    .array(
      z.object({
        src: z.string(),
        alt: z.string().optional(),
        caption: z.string().optional(),
      }),
    )
    .optional()
});

const mapSchema = z.object({
  component: z.literal('map'),
  title: z.string().optional(),
  caption: z.string().optional(),
  embedUrl: z.string(),
});

const ctaSchema = z.object({
  component: z.literal('cta'),
  eyebrow: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  content: z.string().optional(),
  primaryCta: callToActionSchema.optional(),
  secondaryCta: callToActionSchema.optional(),
});

const imagesSchema = z.object({
  component: z.literal('images'),
  images: z
    .array(
      z.object({
        src: z.string(),
        alt: z.string().optional(),
        caption: z.string().optional(),
      }),
    )
    .min(1),
});

const catalogueItemSchema = z.object({
  title: z.string(),
  reference: z.string().optional(),
  description: z.string().optional(),
  price: z.string().optional(),
  image: z
    .object({
      src: z.string(),
      alt: z.string().optional(),
    })
    .optional(),
  cta: callToActionSchema.optional(),
});

const catalogueCategorySchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  note: z.string().optional(),
  items: z.array(catalogueItemSchema).min(1),
});

const catalogueSchema = z.object({
  component: z.literal('catalogue'),
  eyebrow: z.string().optional(),
  title: z.string().optional(),
  intro: z.string().optional(),
  categories: z.array(catalogueCategorySchema).min(1),
  defaultCategory: z.string().optional(),
  footnote: z.string().optional(),
});

const testimonialsSchema = z.object({
  component: z.literal('testimonials'),
  title: z.string(),
  description: z.string().optional(),
  testimonials: z
    .array(
      z.object({
        quote: z.string(),
        author: z.string(),
        role: z.string().optional(),
      }),
    )
    .min(1),
});

const sectionSchema = z.discriminatedUnion('component', [
  heroSchema,
  featureGridSchema,
  parcoursSchema,
  faqSchema,
  markdownSchema,
  mapSchema,
  ctaSchema,
  imagesSchema,
  catalogueSchema,
  testimonialsSchema,
  tarifsSchema,
]);

const sections = defineCollection({
  type: 'content',
  schema: sectionSchema,
});

const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    draft: z.boolean().default(false),
    order: z.number().optional(),
    sections: z.array(
      z.object({
        slug: z.string(),
      }),
    ),
  }),
});

export const collections = {
  pages,
  sections,
};
