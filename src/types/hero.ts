import type { CallToAction } from "./cta";

export interface HeroImage {
  src: string;
  alt?: string;
}

export interface HeroProps {
  eyebrow?: string;
  title: string;
  content: string;
  ctas?: CallToAction[];
  image?: HeroImage;
}
