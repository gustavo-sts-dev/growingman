/**
 * Contrato compartilhado dos templates de página pública.
 *
 * Cada template (ClassicTemplate, EditorialTemplate, …) recebe estas props e é
 * livre para compor a página como quiser. As cores vêm sempre das CSS vars do
 * tema (--theme-*) injetadas pelo page.tsx; a fonte (heading/body) idem, via as
 * vars --font-heading / --font-body. Nenhum template usa cor ou fonte fixa.
 */

export interface PublicTenant {
  id: string;
  slug: string;
  name: string;
  address?: string | null;
  description?: string | null;
  logo_url?: string | null;
  hero_image_url?: string | null;
  page_headline?: string | null;
  page_subheadline?: string | null;
  show_stats?: boolean | null;
  show_team?: boolean | null;
  show_reviews?: boolean | null;
  stat_clients?: string | null;
  stat_rating?: string | null;
  stat_experience?: string | null;
  [key: string]: unknown;
}

export interface PublicService {
  id: string;
  name: string;
  description?: string | null;
  base_price: string | number;
  duration_minutes: number;
  image_url?: string | null;
}

export interface PublicBarber {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface TemplateProps {
  tenant: PublicTenant;
  services: PublicService[];
  barbers: PublicBarber[];
}

/** Formata um preço em BRL — helper comum a todos os templates. */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);
}

export function bookingHref(tenantSlug: string, serviceId: string): string {
  return `/${encodeURIComponent(tenantSlug)}/agendar?serviceId=${encodeURIComponent(serviceId)}`;
}

/** Estatísticas configuradas pelo dono, já filtradas (sem inventar números). */
export function realStats(tenant: PublicTenant): { label: string; value: string }[] {
  return [
    { label: "Clientes atendidos", value: tenant.stat_clients?.trim() || "" },
    { label: "Avaliação média", value: tenant.stat_rating?.trim() || "" },
    { label: "Anos de experiência", value: tenant.stat_experience?.trim() || "" },
  ].filter((s) => s.value);
}
