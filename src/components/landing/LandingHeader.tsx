import Link from "next/link";
import { Wordmark } from "@/components/brand/ui";

const nav = [
  { href: "#recursos", label: "Recursos" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#plano", label: "Plano" },
];

/** Barra flutuante em vidro: separa o topo do herói sem cortar a página com uma borda. */
export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      <div className="mx-auto flex h-14 w-full max-w-[1520px] items-center justify-between gap-2 rounded-[1.15rem] border border-white/70 bg-white/75 px-2.5 shadow-[0_18px_50px_-28px_rgba(13,12,10,0.55)] backdrop-blur-xl sm:h-16 sm:gap-4 sm:px-5">
        <Link
          href="/"
          aria-label="Growingman — página inicial"
          className="min-w-0 shrink rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d0c0a] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <Wordmark />
        </Link>

        <nav aria-label="Navegação principal" className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-[#6f6b64] transition-colors hover:bg-[#f3f1ec] hover:text-[#0d0c0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d0c0a]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/login"
            className="hidden rounded-lg px-3.5 py-2 text-sm font-medium text-[#6f6b64] transition-colors hover:bg-[#f3f1ec] hover:text-[#0d0c0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d0c0a] sm:inline-flex"
          >
            Entrar
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-xl bg-[#0d0c0a] px-3 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-white shadow-[0_12px_26px_-14px_rgba(13,12,10,0.9)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d0c0a] focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:h-10 sm:px-5 sm:text-[0.7rem] sm:tracking-[0.13em]"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </header>
  );
}
