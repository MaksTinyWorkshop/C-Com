export interface Testimonial {
  quote: string;
  author: string;
  role?: string;
}

export interface TestimonialsSectionProps {
  title: string;
  description?: string;
  testimonials: Testimonial[];
}
