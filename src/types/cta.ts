import type { IconProps } from "@components/Icons/icon";

export type CallToAction = {
  label: string;
  href: string;
  icon?: string;
};

export interface CTABannerProps {
  eyebrow?: string;
  title: string;
  description?: string;
  content?: string;
  note?: string;
  ctas?: CallToAction[];
}

export interface CTADownloadProps extends CallToAction {
  icon?: string;
}

export interface CTADevisProps extends CallToAction {
  icon?: string;
  iconProps?: Partial<IconProps>;
}

export interface CTAtoCallbackProps {
  label?: string;
}

export interface CTADownloadSectionProps {
  title: string;
  content?: string;
  file: CTADownloadProps;
  downloadName?: string;
}
