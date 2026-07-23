/**
 * Theme component registry (architecture doc 07): every section the editor can
 * place is described here — its settings schema drives BOTH the inspector UI
 * and the renderer defaults. Adding a section = adding an entry + a renderer.
 */

export type SettingFieldType = "text" | "textarea" | "color" | "number" | "select" | "toggle";

export interface SettingField {
  key: string;
  label: string;
  type: SettingFieldType;
  default: unknown;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
}

export interface SectionDefinition {
  type: string;
  label: string;
  description: string;
  fields: SettingField[];
}

export const sectionRegistry: Record<string, SectionDefinition> = {
  hero_carousel: {
    type: "hero_carousel",
    label: "Hero Carousel",
    description: "Rotating hero slides sourced from CMS banners (max 4).",
    fields: [
      {
        key: "autoplayDelayMs",
        label: "Autoplay delay (ms)",
        type: "number",
        default: 5000,
        min: 2000,
        max: 15000,
      },
      { key: "showOverlay", label: "Dark overlay for readability", type: "toggle", default: true },
      {
        key: "heightVariant",
        label: "Height",
        type: "select",
        default: "standard",
        options: [
          { value: "compact", label: "Compact" },
          { value: "standard", label: "Standard" },
          { value: "tall", label: "Tall" },
        ],
      },
    ],
  },
  hero_banner: {
    type: "hero_banner",
    label: "Hero Banner",
    description: "Large headline with call-to-action buttons.",
    fields: [
      { key: "heading", label: "Heading", type: "text", default: "Gift what they truly want" },
      { key: "highlight", label: "Highlighted word(s)", type: "text", default: "truly want" },
      {
        key: "subheading",
        label: "Subheading",
        type: "textarea",
        default:
          "Create your wedding wishlist, share it with a link or QR code, and let your guests contribute to gifts that matter.",
      },
      { key: "ctaLabel", label: "Primary button label", type: "text", default: "Create your wishlist" },
      { key: "ctaHref", label: "Primary button link", type: "text", default: "/register" },
      { key: "secondaryLabel", label: "Secondary button label", type: "text", default: "How it works" },
      { key: "secondaryHref", label: "Secondary button link", type: "text", default: "/about" },
      { key: "background", label: "Background tint", type: "color", default: "#fdf2f4" },
    ],
  },
  rich_text: {
    type: "rich_text",
    label: "Rich Text",
    description: "Heading and paragraph for storytelling.",
    fields: [
      { key: "heading", label: "Heading", type: "text", default: "A new way to celebrate together" },
      {
        key: "body",
        label: "Body",
        type: "textarea",
        default:
          "Grifto turns wedding gifting into a shared experience. Couples build a wishlist of things they love; family and friends contribute any amount.",
      },
      {
        key: "align",
        label: "Alignment",
        type: "select",
        default: "left",
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
        ],
      },
    ],
  },
  testimonials: {
    type: "testimonials",
    label: "Testimonials",
    description: "Published testimonials from the CMS.",
    fields: [
      { key: "heading", label: "Heading", type: "text", default: "Loved by couples" },
      { key: "maxItems", label: "Max items", type: "number", default: 3, min: 1, max: 12 },
      { key: "showBackground", label: "Tinted background", type: "toggle", default: true },
    ],
  },
  faq_list: {
    type: "faq_list",
    label: "FAQ List",
    description: "Published FAQs from the CMS.",
    fields: [
      { key: "heading", label: "Heading", type: "text", default: "Frequently Asked Questions" },
      { key: "maxItems", label: "Max items", type: "number", default: 4, min: 1, max: 20 },
    ],
  },
  cta_banner: {
    type: "cta_banner",
    label: "CTA Banner",
    description: "Full-width call to action strip.",
    fields: [
      { key: "heading", label: "Heading", type: "text", default: "Ready to start your wishlist?" },
      { key: "ctaLabel", label: "Button label", type: "text", default: "Sign up free" },
      { key: "ctaHref", label: "Button link", type: "text", default: "/register" },
      { key: "background", label: "Background color", type: "color", default: "#c02952" },
    ],
  },
  spacer: {
    type: "spacer",
    label: "Spacer",
    description: "Vertical breathing room.",
    fields: [{ key: "height", label: "Height (px)", type: "number", default: 48, min: 8, max: 240 }],
  },
};

export function sectionDefaults(type: string): Record<string, unknown> {
  const def = sectionRegistry[type];
  if (!def) return {};
  return Object.fromEntries(def.fields.map((f) => [f.key, f.default]));
}

export function listSections(): SectionDefinition[] {
  return Object.values(sectionRegistry);
}
