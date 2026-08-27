import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { apiUrl } from "@/lib/config";
import { MeusAgendamentos } from "./MeusAgendamentos";

/** O layout da barbearia compõe: "Meus agendamentos | Barbearia do Zé". */
export const metadata: Metadata = { title: "Meus agendamentos" };

interface PageProps {
  params: Promise<{ tenantSlug: string }>;
}

async function getTenant(slug: string) {
  try {
    const res = await fetch(apiUrl(`/tenants/${slug}`), { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * Área do cliente: os cortes dele, com opção de cancelar.
 *
 * O tema da barbearia é aplicado aqui, no servidor, como nas outras páginas
 * públicas — o cliente reconhece a barbearia, não a plataforma.
 *
 * Quem valida a sessão é a API: esta página monta e a lista pede os dados. Se
 * não houver sessão de cliente, a resposta é 401 e o componente manda para o
 * login. Bloquear aqui exigiria ler o cookie no servidor e duplicaria a regra
 * que o backend já aplica.
 */
export default async function MeusAgendamentosPage({ params }: PageProps) {
  const { tenantSlug } = await params;
  const tenant = await getTenant(tenantSlug);
  if (!tenant) notFound();

  return (
    <div
      className="min-h-screen px-4 py-10 sm:py-14"
      style={
        {
          backgroundColor: tenant.theme_bg || "#080808",
          color: tenant.theme_text || "#A1A1AA",
          ["--theme-title" as string]: tenant.theme_title || "#FFFFFF",
          ["--theme-card" as string]: tenant.theme_card || "#121212",
          ["--theme-button-bg" as string]: tenant.theme_button_bg || "#FFFFFF",
          ["--theme-button-text" as string]: tenant.theme_button_text || "#000000",
        } as React.CSSProperties
      }
    >
      <MeusAgendamentos tenantSlug={tenant.slug} tenantName={tenant.name} />
    </div>
  );
}
