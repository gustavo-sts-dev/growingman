import { notFound } from "next/navigation";
import { apiUrl } from "@/lib/config";
import { resolveSitePreset, fontsHref } from "@/lib/site-presets";
import type { PublicTenant, PublicService, PublicBarber } from "./templates/types";
import { ClassicTemplate } from "./templates/ClassicTemplate";
import { EditorialTemplate } from "./templates/EditorialTemplate";
import { ShowcaseTemplate } from "./templates/ShowcaseTemplate";
import { SplitTemplate } from "./templates/SplitTemplate";
import { MinimalTemplate } from "./templates/MinimalTemplate";

interface TenantPageProps {
  params: Promise<{ tenantSlug: string }>;
}

async function getTenantData(slug: string): Promise<PublicTenant | null> {
  try {
    const res = await fetch(apiUrl(`/tenants/${slug}`), { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getServices(tenantId: string): Promise<PublicService[]> {
  try {
    const res = await fetch(apiUrl(`/services?tenantId=${tenantId}`), { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getBarbers(tenantId: string): Promise<PublicBarber[]> {
  try {
    const res = await fetch(apiUrl(`/barbers?tenantId=${tenantId}&isActive=true`), { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

/**
 * Roteador da página pública do tenant.
 *
 * Responsabilidades (o LAYOUT vive nos templates, não aqui):
 *  1. Buscar tenant + serviços + barbeiros.
 *  2. Injetar as cores do tema como CSS vars (--theme-*).
 *  3. Injetar a TIPOGRAFIA do preset como --font-heading / --font-body e
 *     importar as fontes (Google Fonts). A fonte é do preset, não do tenant.
 *  4. Renderizar o template correspondente ao preset escolhido.
 */
export default async function TenantPage({ params }: TenantPageProps) {
  const { tenantSlug } = await params;
  const tenant = await getTenantData(tenantSlug);
  if (!tenant) notFound();

  const [services, barbers] = await Promise.all([
    getServices(tenant.id),
    getBarbers(tenant.id),
  ]);

  const preset = resolveSitePreset(
    typeof tenant.site_preset === "string" ? tenant.site_preset : null
  );

  // Cores do tema (fallbacks = defaults do schema do backend).
  const themeVars = {
    backgroundColor: (tenant.theme_bg as string) || "#080808",
    color: (tenant.theme_text as string) || "#A1A1AA",
    "--theme-bg": (tenant.theme_bg as string) || "#080808",
    "--theme-card": (tenant.theme_card as string) || "#121212",
    "--theme-text": (tenant.theme_text as string) || "#A1A1AA",
    "--theme-title": (tenant.theme_title as string) || "#FFFFFF",
    "--theme-button-bg": (tenant.theme_button_bg as string) || "#FFFFFF",
    "--theme-button-text": (tenant.theme_button_text as string) || "#000000",
    "--theme-accent": (tenant.theme_accent as string) || "#4ade80",
    // Tipografia vem do PRESET (não do tenant).
    "--font-heading": `"${preset.fonts.heading}", sans-serif`,
    "--font-body": `"${preset.fonts.body}", sans-serif`,
  } as React.CSSProperties;

  const templateProps = { tenant, services, barbers };

  return (
    <div className="min-h-screen overflow-x-hidden" style={themeVars}>
      {/* Fontes do preset (Google Fonts). */}
      <style dangerouslySetInnerHTML={{ __html: `@import url('${fontsHref(preset)}');` }} />

      {preset.id === "editorial" ? (
        <EditorialTemplate {...templateProps} />
      ) : preset.id === "showcase" ? (
        <ShowcaseTemplate {...templateProps} />
      ) : preset.id === "split" ? (
        <SplitTemplate {...templateProps} />
      ) : preset.id === "minimal" ? (
        <MinimalTemplate {...templateProps} />
      ) : (
        <ClassicTemplate {...templateProps} />
      )}
    </div>
  );
}
