import type { Metadata } from "next";
import { cache } from "react";
import { apiUrl } from "@/lib/config";

/**
 * Metadados das páginas públicas de uma barbearia.
 *
 * Este layout existe só para o título: quem chega pela página de uma barbearia
 * é cliente dela, não usuário da Growingman — a aba do navegador e o link
 * compartilhado no WhatsApp precisam dizer o nome da barbearia.
 *
 * `title.template` aqui SUBSTITUI o template do layout raiz para toda esta
 * subárvore. Então `/[slug]/agendar`, que define `title: "Agendar"`, vira
 * "Agendar | Barbearia do Zé" em vez de "Agendar | Growingman".
 */

interface TenantMeta {
  name: string;
  page_subheadline?: string | null;
}

/**
 * `cache` do React: `generateMetadata` e a página renderizam no mesmo passe e
 * ambos precisam do tenant. Sem isso seriam duas idas à API por visita — e
 * `cache: "no-store"` impede a deduplicação automática do fetch.
 */
const getTenantMeta = cache(async (slug: string): Promise<TenantMeta | null> => {
  try {
    const res = await fetch(apiUrl(`/tenants/${slug}`), { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as TenantMeta;
  } catch {
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}): Promise<Metadata> {
  const { tenantSlug } = await params;
  const tenant = await getTenantMeta(tenantSlug);

  // Barbearia inexistente ou API fora: cai no título da plataforma em vez de
  // estampar "undefined" na aba.
  if (!tenant?.name) return {};

  return {
    title: {
      // `absolute` e não `default`: a home da barbearia deve ser só o nome dela.
      // Com `default`, o template da raiz ainda embrulhava e saía "Barbearia |
      // Growingman" — o cliente dela não precisa ver a marca da plataforma.
      // `absolute` ignora o template do pai; o `template` abaixo segue valendo
      // para as filhas (agendar, entrar).
      absolute: tenant.name,
      template: `%s | ${tenant.name}`,
    },
    description:
      tenant.page_subheadline?.trim() ||
      `Agende seu horário na ${tenant.name} pelo celular, sem ligação.`,
    // A página de uma barbearia é feita para ser compartilhada por link.
    openGraph: {
      title: tenant.name,
      description:
        tenant.page_subheadline?.trim() ||
        `Agende seu horário na ${tenant.name}.`,
      type: "website",
    },
  };
}

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
