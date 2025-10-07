export interface ParcoursStep {
  title: string;
  description: string;
  icon?: string;
}

export interface ParcoursSectionProps {
  title: string;
  description?: string;
  steps: ParcoursStep[];
}
