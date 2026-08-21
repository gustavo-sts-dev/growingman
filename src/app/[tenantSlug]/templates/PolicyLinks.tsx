import type { PublicTenant } from "./types";

/**
 * Links para a política de privacidade e os termos da barbearia, no rodapé da
 * página pública.
 *
 * A LGPD exige informar o titular sobre o tratamento (Art. 9º). O aviso que
 * cumpre isso de fato fica no fluxo de agendamento, junto do botão que entrega
 * os dados — estes links são o complemento: o documento completo precisa ficar
 * acessível de qualquer página, não só de dentro do formulário.
 *
 * Não renderiza nada quando a barbearia não preencheu nenhum dos dois. Rodapé
 * com "Política de Privacidade" apontando para lugar nenhum é pior que a
 * ausência: promete um documento que não existe.
 *
 * Herda cor do rodapé que o envolve (`currentColor` via `inherit`), então serve
 * a qualquer um dos cinco templates sem receber tema por prop.
 */
export function PolicyLinks({ tenant }: { tenant: PublicTenant }) {
  const links = [
    { href: tenant.privacy_policy_url, label: "Política de Privacidade" },
    { href: tenant.terms_of_service_url, label: "Termos de Uso" },
  ].filter((l): l is { href: string; label: string } => Boolean(l.href));

  if (links.length === 0) return null;

  return (
    <nav
      aria-label="Documentos legais"
      className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs opacity-70"
    >
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2"
          style={{ color: "inherit" }}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
