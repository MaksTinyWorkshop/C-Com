export interface CatalogueLink {
  label: string;
  href: string;
}

export interface CatalogueImage {
  src: string;
  alt?: string;
}

export interface CatalogueItem {
  title: string;
  reference?: string;
  description?: string;
  price?: string;
  image?: CatalogueImage;
  cta?: CatalogueLink;
}

export interface CatalogueCategory {
  id: string;
  label: string;
  description?: string;
  note?: string;
  items: CatalogueItem[];
}

export interface CatalogueSectionProps {
  eyebrow?: string;
  title?: string;
  intro?: string;
  categories?: CatalogueCategory[];
  defaultCategory?: string;
  footnote?: string;
}
