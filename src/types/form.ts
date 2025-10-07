export type FormFieldType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "textarea"
  | "select";

export interface FormField {
  id: string;
  label: string;
  placeholder?: string;
  type?: FormFieldType;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string }[];
}

export interface FormFormula {
  id: string;
  label: string;
  description?: string;
  helper?: string;
  submitLabel?: string;
  fields: FormField[];
}

export interface ContactFormSectionProps {
  title: string;
  subtitle?: string;
  formulas: FormFormula[];
  defaultFormula?: string;
  submitLabel?: string;
  successMessage?: string;
}
