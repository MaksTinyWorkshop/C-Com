export interface GalleryImage {
  src: string;
  alt?: string;
  caption?: string;
}

export interface ImagesGridProps {
  title?: string;
  images: GalleryImage[];
}
