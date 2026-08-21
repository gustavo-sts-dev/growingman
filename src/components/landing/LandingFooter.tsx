import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import { Wordmark, container } from "@/components/brand/ui";

/**
 * Contato direto. O número vai cru (com DDI 55) no link do WhatsApp e
 * formatado na tela — o wa.me só aceita dígitos, e quem lê espera a máscara.
 */
const WHATSAPP_DIGITS = "5579996352942";
const WHATSAPP_LABEL = "(79) 99635-2942";
const EMAIL = "tech_gustavo@proton.me";

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
        <div className="grid gap-8 border-b border-white/10 pb-10 sm:grid-cols-2 sm:gap-10 sm:pb-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
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

          {/* Links externos (wa.me e mailto) — <a>, não <Link>: o roteador do
              Next não tem o que pré-carregar aqui.

              `sm:col-span-2` porque na faixa de duas colunas o e-mail não cabe
              em meia largura e quebraria no meio; ali ele ocupa a linha toda. */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h2 className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[#b3ada0] sm:text-[0.68rem]">
              Contato
            </h2>
            <ul className="mt-4 space-y-3 sm:mt-5">
              <li>
                <a
                  href={`https://wa.me/${WHATSAPP_DIGITS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2.5 rounded text-[0.9rem] text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:text-[0.92rem]"
                >
                  <MessageCircle
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-white/40 transition-colors group-hover:text-white/70"
                  />
                  {WHATSAPP_LABEL}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${EMAIL}`}
                  className="group inline-flex items-center gap-2.5 rounded text-[0.9rem] break-all text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:text-[0.92rem]"
                >
                  <Mail
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-white/40 transition-colors group-hover:text-white/70"
                  />
                  {EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-6 text-[0.78rem] text-white/45 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:text-[0.82rem]">
          <p>© 2026 Growingman. Todos os direitos reservados.</p>
          <p>Pagamentos processados por Asaas.</p>
        </div>
      </div>
    </footer>
  );
}
