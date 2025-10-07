export interface MarkdownImage {
  src: string;
  alt?: string;
  caption?: string;
}

export interface MarkdownSectionProps<Content = unknown> {
  title?: string;
  description?: string;
  variant?: string;
  images?: MarkdownImage[];
  Content: Content;
}
