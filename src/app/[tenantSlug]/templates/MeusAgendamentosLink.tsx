import Link from "next/link";

/**
 * Atalho do cliente para os próprios horários, no hero.
 *
 * Vivia só no rodapé, junto das políticas — quem já é cliente e volta ao site
 * para ver ou desmarcar um corte não rola a página inteira à procura disso.
 * Continua no rodapé também: repetir um atalho de navegação embaixo é barato.
 *
 * O destino e o rótulo ficam AQUI, num lugar só; a aparência vem de cada
 * template, porque os cinco têm linguagens visuais diferentes e um botão
 * padronizado destoaria em pelo menos quatro deles.
 */
export function MeusAgendamentosLink({
  slug,
  className,
  style,
}: {
  slug: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <Link
      href={`/${slug}/meus-agendamentos`}
      className={className}
      style={style}
    >
      Meus agendamentos
    </Link>
  );
}
