import type { ThemeSection } from "@grifto/contracts";
import { sectionDefaults } from "@grifto/theme-schemas";

/** Reads a section setting, falling back to the registry default. */
export function getSetting<T>(section: ThemeSection, key: string): T {
  const defaults = sectionDefaults(section.type);
  return (section.settings[key] ?? defaults[key]) as T;
}
