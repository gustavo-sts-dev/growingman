import Link from "next/link";
import type { PublicTenant } from "./types";

/**
 * Rodapé compartilhado pelos cinco templates da página pública.
 *
 * Reúne o que precisa estar acessível de qualquer página da barbearia: a área do
 * cliente e os documentos legais.
 *
 * Chamava-se `TenantFooterLinks` e só trazia política e termos — mas ele também
 * retornava `null` quando a barbearia não preenchia nenhum dos dois, e pôr o
 * acesso do cliente lá dentro o esconderia justamente das barbearias sem
 * documento publicado.
 *
 * LGPD (Art. 9º): o aviso que de fato informa o titular fica no fluxo de
 * agendamento, junto do botão que entrega os dados. Estes links são o
 * complemento — o documento completo precisa ficar alcançável de qualquer lugar.
 *
 * Herda a cor do rodapé que o envolve (`inherit`), então serve a qualquer
 * template sem receber tema por prop.
 */
export function TenantFooterLinks({ tenant }: { tenant: PublicTenant }) {
  const politicas = [
    { href: tenant.privacy_policy_url, label: "Política de Privacidade" },
    { href: tenant.terms_of_service_url, label: "Termos de Uso" },
  ].filter((l): l is { href: string; label: string } => Boolean(l.href));

  const classe =
    "underline underline-offset-2 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2";

  return (
    <nav
      aria-label="Links da barbearia"
      className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs opacity-70"
    >
      {/* Sempre presente: é por aqui que o cliente chega aos próprios horários.
          A página pede a sessão — quem não tiver cai no login. */}
      <Link href={`/${tenant.slug}/meus-agendamentos`} className={classe} style={{ color: "inherit" }}>
        Meus agendamentos
      </Link>

      {politicas.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={classe}
          style={{ color: "inherit" }}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
