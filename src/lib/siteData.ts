import type { IconProps } from "@components/Icons/icon";

export type NavItem = {
  name: string;
  path: string;
};

export const mainNavigation: NavItem[] = [
  { name: "Fonctionnement", path: "/fonctionnement" },
  { name: "Secteurs d'activités", path: "/secteurs" },
  { name: "Tarifs", path: "/tarifs" },
  { name: "Contact", path: "/contact" },
];

export type LogoAsset = {
  name: string;
  source: {
    src: string;
    alt: string;
  }
};

export type ContactItem = {
  type: "phone" | "mail";
  icon: IconProps["type"];
  href: string;
  label: string;
};

export type SocialLink = {
  name: string;
  icon?: IconProps["type"];
  href: string;
  ariaLabel?: string;
};

export type CompanyDetails = {
  name: string;
  address: string;
  zipCode: string;
  city: string;
  country?: string;
  contactItems: ContactItem[];
  socialLinks: SocialLink[];
  logos: LogoAsset[];
};

export const companyDetails: CompanyDetails = {
  name: "C'Com",
  address: "1 Rue de la Paix",
  zipCode: "75000",
  city: "Paris",
  country: "France",
  contactItems: [
    {
      type: "phone",
      icon: "phone",
      href: "tel:+33606060606",
      label: "06 06 06 06 06",
    },
    {
      type: "mail",
      icon: "mail",
      href: "mailto:contact@c-com.fr",
      label: "contact@c-com.fr",
    }],
  socialLinks: [
    {
      name: "Facebook",
      icon: "facebook",
      href: "https://www.facebook.com/",
      ariaLabel: "Rejoindre Facebook",
    },
    {
      name: "LinkedIn",
      icon: "linkedin",
      href: "https://www.linkedin.com/",
      ariaLabel: "Visiter LinkedIn",
    },
    {
      name: "GitHub",
      icon: "github",
      href: "https://github.com/",
      ariaLabel: "Accéder au GitHub",
    },
  ],
  logos: [
    {
      name: "Logo Principal",
      source: {
        src: "images/company-logo.svg",
        alt: "Logo C'com",
      }
    },
    {
      name: "Logo Full",
      source: {
        src: "images/company-logo-full.svg",
        alt: "Logo C'Com",
      }
    }
  ] 
};



