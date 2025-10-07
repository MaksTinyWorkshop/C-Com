export interface FeatureItem {
  title: string;
  description: string;
  icon?: string;
}

export interface FeatureSectionProps {
  eyebrow?: string;
  title: string;
  description?: string;
  features: FeatureItem[];
}

export interface FeatureTarifProps {
  features: FeatureItem[];
}
