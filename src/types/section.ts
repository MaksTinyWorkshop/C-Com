export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export interface SectionHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  class?: string;
  headingLevel?: HeadingLevel;
  as?: string;
}
