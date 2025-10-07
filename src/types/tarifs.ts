export type TarifOptionType = "base" | "video" | "extra";

export interface Plan {
  slug: string;
  badge?: string;
  icon?: string;
  subtitle?: string;
  price: string;
  footnote?: string;
  description?: string;
  moreInfoTitle?: string;
  moreInfoContent?: string;
}

export interface Option {
  id: string;
  label: string;
  description?: string;
  price: string;
  type?: TarifOptionType;
  defaultSelected?: boolean;
  disabled?: boolean;
  defaultQuantity?: number;
  minQuantity?: number;
  maxQuantity?: number;
  step?: number;
  unitPrice?: number;
  priceSuffix?: string;
  showCounter?: boolean;
}

export interface ModalContent {
  title?: string;
  content?: string;
}

export interface PlanConfig {
  slug: string;
  badge: string | null;
  moreInfoTitle: string | null;
  moreInfoContent: string | null;
}

export interface OptionConstraint {
  min: number;
  max: number | null;
  step: number;
}

export interface TarifClientConfig {
  defaultPlan: string;
  baseOptionIds: string[];
  videoOptionIds: string[];
  optionQuantities: Record<string, number>;
  optionConstraints: Record<string, OptionConstraint>;
  plans: PlanConfig[];
  modal: ModalContent | null;
}

export interface PlanDetailPayload {
  slug: string;
  badge: string | null;
  moreInfoTitle: string | null;
  moreInfoContent: string | null;
}

export interface TarifModalProps {
  id: string;
  fallbackTitle: string;
  fallbackContent?: string;
  defaultPlan: string;
  initialContent?: string;
  defaultIcon?: string | null;
  defaultBadge?: string | null;
}

export interface TarifsSectionProps {
  defaultPlan: string;
  plans: Plan[];
  options: Option[];
  modal?: ModalContent;
}
