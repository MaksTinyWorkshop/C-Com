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
  defaultQuantity: z.number().optional(),
  minQuantity: z.number().optional(),
  maxQuantity: z.number().optional(),
  step: z.number().optional(),
  unitPrice: z.number().optional(),
  priceSuffix: z.string().optional(),
  showCounter: z.boolean().optional(),
});

const tarifsPlanSchema = z.object({
  slug: z.string(),
  badge: z.string().optional(),
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
  ctas: z.array(callToActionSchema).optional(),
});

const featureGridSchema = z.object({
  component: z.literal('feature-grid'),
  key: z.string(),
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

const contactFormFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  placeholder: z.string().optional(),
  type: z
    .enum(['text', 'email', 'tel', 'number', 'textarea', 'select'])
    .default('text'),
  required: z.boolean().default(true),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  options: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      }),
    )
    .optional(),
});

const contactFormFormulaSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  helper: z.string().optional(),
  fields: z.array(contactFormFieldSchema).min(1),
  submitLabel: z.string().optional(),
});

const contactFormHighlightSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  targetFormula: z.string().optional(),
});

const contactFormSchema = z.object({
  component: z.literal('contact-form'),
  title: z.string(),
  subtitle: z.string().optional(),
  highlights: z.array(contactFormHighlightSchema).optional(),
  formulas: z.array(contactFormFormulaSchema).min(1),
  defaultFormula: z.string().optional(),
  submitLabel: z.string().optional(),
  successMessage: z.string().optional(),
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
  note: z.string().optional(),
  ctas: z.array(callToActionSchema).optional(),
  downloadName: z.string().optional(),
  file: callToActionSchema.optional(),
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
  contactFormSchema,
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
