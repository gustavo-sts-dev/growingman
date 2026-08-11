/**
 * Presets da página pública (site do cliente).
 *
 * Cada preset é um TEMPLATE de página inteiro e independente — não uma variação
 * de tokens sobre um layout comum. O componente de cada template vive em
 * `src/app/[tenantSlug]/templates/` e tem composição, hero e seções próprios.
 * Aqui ficam só os METADADOS que o roteador (`page.tsx`) e o dashboard precisam:
 * rótulo, descrição, se pede imagem de capa, e a TIPOGRAFIA do template.
 *
 * A tipografia é parte da identidade do preset (não é mais escolha livre do dono
 * — isso deixava tudo com a mesma cara e permitia combinações ruins). O dono
 * escolhe: PRESET (layout + fonte) + CORES + IMAGENS. Fonte vem daqui.
 *
 * Fonte de verdade única: `tenant.site_preset`.
 */

export type SitePresetId =
  | "classic"
  | "editorial"
  | "showcase"
  | "split"
  | "minimal";

/** Seções conhecidas (cada template decide como/se usa). */
export type SectionId = "stats" | "team" | "services" | "reviews";

/**
 * Par tipográfico do template. `heading` e `body` são famílias do Google Fonts
 * (carregadas via @import no page.tsx). `weights` lista os pesos a importar.
 */
export interface PresetFonts {
  heading: string;
  body: string;
  /** Pesos a carregar do Google Fonts (heading + body somados). */
  weights: number[];
}

export interface SitePreset {
  id: SitePresetId;
  label: string;
  description: string;
  /** Precisa de imagem de capa (hero_image_url) para ficar pleno. */
  needsImage: boolean;
  /** Seções que o template exibe (informativo; o layout mora no componente). */
  sections: SectionId[];
  /** Tipografia fixa do template. */
  fonts: PresetFonts;
}

export const SITE_PRESETS: SitePreset[] = [
  {
    id: "classic",
    label: "Clássico",
    description:
      "Barbearia premium tradicional: topo centralizado e imponente, grade de serviços em cartões, seção de equipe e avaliações. A escolha segura.",
    needsImage: false,
    sections: ["stats", "services", "team", "reviews"],
    // Sans forte e confiável; corpo neutro legível.
    fonts: { heading: "Archivo", body: "Inter", weights: [400, 500, 600, 700, 800, 900] },
  },
  {
    id: "editorial",
    label: "Revista",
    description:
      "Cara de editorial de moda: serifa display gigante, colunas estreitas, muito respiro e fios finos. Sofisticado e diferente.",
    needsImage: true,
    sections: ["services", "team", "reviews"],
    // Serifa de alto contraste no display + grotesca clean no corpo.
    fonts: { heading: "Playfair Display", body: "DM Sans", weights: [400, 500, 700, 800, 900] },
  },
  {
    id: "showcase",
    label: "Vitrine",
    description:
      "Imersivo e visual: hero de tela cheia com imagem de fundo, serviços em mosaico denso, forte apelo fotográfico. Ideal com boas fotos.",
    needsImage: true,
    sections: ["services", "team", "reviews"],
    // Grotesca condensada com atitude; corpo neutro.
    fonts: { heading: "Oswald", body: "Inter", weights: [400, 500, 600, 700] },
  },
  {
    id: "split",
    label: "Conversão",
    description:
      "Focado em agendar rápido: tela dividida (texto + imagem), pouca rolagem, serviços em lista direta com botão. Menos é mais.",
    needsImage: true,
    sections: ["services", "team"],
    // Geométrica amigável e moderna; corpo da mesma família p/ coesão.
    fonts: { heading: "Poppins", body: "Poppins", weights: [400, 500, 600, 700, 800] },
  },
  {
    id: "minimal",
    label: "Minimalista",
    description:
      "Silêncio e tipografia: quase sem elementos, muito espaço em branco, linhas em vez de caixas, letras com espaçamento. Elegância pela ausência.",
    needsImage: false,
    sections: ["services", "team"],
    // Grotesca de baixo contraste, discreta; peso leve como identidade.
    fonts: { heading: "Space Grotesk", body: "Space Grotesk", weights: [300, 400, 500, 600, 700] },
  },
];

const DEFAULT_PRESET = SITE_PRESETS[0];

/** Resolve o preset a partir do id salvo (fallback seguro para "classic"). */
export function resolveSitePreset(id: string | null | undefined): SitePreset {
  return SITE_PRESETS.find((p) => p.id === id) ?? DEFAULT_PRESET;
}

/**
 * Monta a URL do Google Fonts para um preset (heading + body, pesos declarados).
 * Usada no @import da página pública. Ex.: fontsHref(preset) →
 * https://fonts.googleapis.com/css2?family=Archivo:wght@...&family=Inter:wght@...&display=swap
 */
export function fontsHref(preset: SitePreset): string {
  const fams = new Map<string, number[]>();
  fams.set(preset.fonts.heading, preset.fonts.weights);
  // Se body é outra família, entra também (mesma lista de pesos basta).
  if (preset.fonts.body !== preset.fonts.heading) {
    fams.set(preset.fonts.body, preset.fonts.weights);
  }
  const parts = [...fams.entries()].map(
    ([fam, w]) => `family=${fam.replace(/\s+/g, "+")}:wght@${w.join(";")}`
  );
  return `https://fonts.googleapis.com/css2?${parts.join("&")}&display=swap`;
}
