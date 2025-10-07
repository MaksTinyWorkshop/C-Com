export interface FAQQuestion {
  question: string;
  answer: string;
  role?: string;
}

export interface FAQSectionProps {
  title: string;
  description?: string;
  questions: FAQQuestion[];
}
