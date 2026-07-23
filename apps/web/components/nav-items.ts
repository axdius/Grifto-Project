/**
 * Primary navigation config — single source for desktop nav and mobile drawer.
 * Later this can be fed from CMS/theme settings without touching components.
 */
export interface NavItem {
  label: string;
  href: string;
}

export const primaryNavItems: NavItem[] = [
  { label: "FAQ", href: "/faq" },
  { label: "Contact Us", href: "/contact" },
];

export const brand = {
  name: "Grifto",
  homeHref: "/",
} as const;
