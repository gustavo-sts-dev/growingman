import Link from "next/link";
import { Wordmark, container } from "@/components/brand/ui";

const columns = [
  {
    title: "Produto",
    links: [
      { href: "#recursos", label: "Recursos" },
      { href: "#como-funciona", label: "Como funciona" },
      { href: "#plano", label: "Plano" },
    ],
  },
  {
    title: "Conta",
    links: [
      { href: "/onboarding", label: "Criar conta" },
      { href: "/login", label: "Entrar" },
      { href: "/recuperar-senha", label: "Recuperar senha" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="bg-[#0d0c0a] pb-8 pt-12 text-white sm:pt-20">
      <div className={container}>
        <div className="grid gap-8 border-b border-white/10 pb-10 sm:grid-cols-2 sm:gap-10 sm:pb-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Wordmark tone="dark" />
            <p className="mt-4 max-w-xs text-[0.88rem] leading-6 text-white/60 sm:mt-5 sm:text-[0.9rem]">
              Agenda online, equipe, clientes, serviços, estoque e financeiro em um só sistema para
              barbearias.
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[#b3ada0] sm:text-[0.68rem]">
                {column.title}
              </h2>
              <ul className="mt-4 space-y-3 sm:mt-5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded text-[0.9rem] text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:text-[0.92rem]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-6 text-[0.78rem] text-white/45 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:text-[0.82rem]">
          <p>© 2026 Growingman. Todos os direitos reservados.</p>
          <p>Pagamentos processados por Asaas.</p>
        </div>
      </div>
    </footer>
  );
}
