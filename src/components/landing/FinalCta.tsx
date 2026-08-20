import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { btn, containerFlush } from "@/components/brand/ui";

export function FinalCta() {
  return (
    <section className="px-3 pb-16 sm:px-6 sm:pb-28">
      <div className={containerFlush}>
        <div className="gm-mesh-deep gm-grain relative overflow-hidden rounded-[1.5rem] px-5 py-12 text-center sm:rounded-[2.25rem] sm:px-12 sm:py-20 lg:rounded-[2.75rem] lg:py-24">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 left-1/2 size-[30rem] -translate-x-1/2 rounded-full bg-white/10 blur-[110px]"
          />
          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="text-balance font-heading text-[clamp(1.65rem,3.8vw,3.1rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-white sm:leading-[1.06] sm:tracking-[-0.035em]">
              Publique o link da sua barbearia ainda hoje
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-pretty text-[0.92rem] leading-6 text-white/80 sm:mt-5 sm:text-[0.98rem] sm:leading-7">
              Cadastro, cobrança por Pix e acesso ao painel no mesmo fluxo. Sem instalação e sem
              contrato de fidelidade.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:mt-9 sm:flex-row sm:justify-center sm:gap-4">
              <Link href="/onboarding" className={`${btn.onDarkSolid} w-full sm:w-auto`}>
                Criar conta
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
              <Link href="/login" className={`${btn.onDarkGhost} w-full sm:w-auto`}>
                Já sou cliente
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
