import type { SitePresetId } from "@/lib/site-presets";

export const SITE_SECTION_IDS = ["hero", "stats", "services", "team", "cta"] as const;

export type SiteSectionId = (typeof SITE_SECTION_IDS)[number];
export type HeroAlignment = "left" | "center";
export type HeroMobileHeight = "compact" | "screen";
export type HeroImagePosition = "top" | "center" | "bottom";

export interface SiteSectionConfig {
  id: SiteSectionId;
  visible: boolean;
}

export interface SiteLayoutConfig {
  version: 1;
  sections: SiteSectionConfig[];
  hero: {
    alignment: HeroAlignment;
    mobileHeight: HeroMobileHeight;
    imagePosition: HeroImagePosition;
  };
}

const PRESET_SECTIONS: Record<SitePresetId, SiteSectionId[]> = {
  classic: ["hero", "stats", "services", "team", "cta"],
  editorial: ["hero", "services", "team", "cta"],
  showcase: ["hero", "services", "team", "cta"],
  split: ["hero", "services", "team"],
  minimal: ["hero", "services", "team", "cta"],
};

const PRESET_HERO: Record<
  SitePresetId,
  SiteLayoutConfig["hero"]
> = {
  classic: { alignment: "center", mobileHeight: "screen", imagePosition: "center" },
  editorial: { alignment: "left", mobileHeight: "compact", imagePosition: "center" },
  showcase: { alignment: "left", mobileHeight: "compact", imagePosition: "center" },
  split: { alignment: "left", mobileHeight: "screen", imagePosition: "center" },
  minimal: { alignment: "left", mobileHeight: "compact", imagePosition: "center" },
};

export function defaultSiteLayout(
  presetId: SitePresetId,
  visibility?: { stats?: boolean | null; team?: boolean | null },
): SiteLayoutConfig {
  return {
    version: 1,
    sections: PRESET_SECTIONS[presetId].map((id) => ({
      id,
      visible:
        id === "stats"
          ? visibility?.stats !== false
          : id === "team"
            ? visibility?.team !== false
            : true,
    })),
    hero: { ...PRESET_HERO[presetId] },
  };
}

function isSectionId(value: unknown): value is SiteSectionId {
  return typeof value === "string" && SITE_SECTION_IDS.includes(value as SiteSectionId);
}

/**
 * Lê configuração persistida sem confiar no JSON vindo da API.
 * Campos desconhecidos são descartados e seções essenciais são restauradas.
 */
export function normalizeSiteLayout(
  value: unknown,
  presetId: SitePresetId,
  visibility?: { stats?: boolean | null; team?: boolean | null },
): SiteLayoutConfig {
  const fallback = defaultSiteLayout(presetId, visibility);
  if (!value || typeof value !== "object") return fallback;

  const candidate = value as Partial<SiteLayoutConfig>;
  const supported = new Set(PRESET_SECTIONS[presetId]);
  const seen = new Set<SiteSectionId>();
  const sections: SiteSectionConfig[] = [];

  if (Array.isArray(candidate.sections)) {
    for (const raw of candidate.sections) {
      if (!raw || typeof raw !== "object") continue;
      const section = raw as Partial<SiteSectionConfig>;
      if (!isSectionId(section.id) || !supported.has(section.id) || seen.has(section.id)) continue;
      seen.add(section.id);
      sections.push({
        id: section.id,
        visible:
          section.id === "hero" || section.id === "services"
            ? true
            : section.visible !== false,
      });
    }
  }

  for (const section of fallback.sections) {
    if (!seen.has(section.id)) sections.push(section);
  }

  const hero: Partial<SiteLayoutConfig["hero"]> =
    candidate.hero && typeof candidate.hero === "object" ? candidate.hero : {};

  return {
    version: 1,
    sections,
    hero: {
      alignment: hero.alignment === "center" || hero.alignment === "left"
        ? hero.alignment
        : fallback.hero.alignment,
      mobileHeight: hero.mobileHeight === "screen" || hero.mobileHeight === "compact"
        ? hero.mobileHeight
        : fallback.hero.mobileHeight,
      imagePosition: hero.imagePosition === "top" || hero.imagePosition === "bottom" || hero.imagePosition === "center"
        ? hero.imagePosition
        : fallback.hero.imagePosition,
    },
  };
}

export function siteSectionOrder(layout: SiteLayoutConfig, id: SiteSectionId): number {
  const index = layout.sections.findIndex((section) => section.id === id);
  return index === -1 ? 90 : index;
}

export function isSiteSectionVisible(layout: SiteLayoutConfig, id: SiteSectionId): boolean {
  return layout.sections.find((section) => section.id === id)?.visible ?? false;
}
