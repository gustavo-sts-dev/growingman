import type { PublicTenant } from "./types";

/**
 * Rodapé compartilhado pelos cinco templates da página pública: os documentos
 * legais da barbearia.
 *
 * "Meus agendamentos" morava aqui e subiu para o hero (ver
 * `MeusAgendamentosLink`). Em templates de página curta os dois apareciam juntos
 * na mesma tela, e o mesmo atalho duas vezes lado a lado lê como engano.
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

  // Sem documento publicado não há rodapé: um <nav> vazio ainda ocupa espaço no
  // layout e é anunciado por leitor de tela como uma navegação sem destino.
  if (politicas.length === 0) return null;

  const classe =
    "underline underline-offset-2 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2";

  return (
    <nav
      aria-label="Links da barbearia"
      className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs opacity-70"
    >
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
