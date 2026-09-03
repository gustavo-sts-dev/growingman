import { Suspense } from "react";
import { BrandHeader } from "@/components/brand/ui";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Confirmar cadastro — Growingman",
  description: "Confirmação de e-mail e criação da sua barbearia na plataforma Growingman.",
};

export default function ConfirmarCadastroLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="gm flex min-h-dvh flex-col overflow-x-hidden overflow-y-visible antialiased">
      <BrandHeader actionHref="/login" actionLabel="Já tenho conta" />

      <main className="relative flex flex-1 items-start px-3 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-12">
        {/* Halos desfocados */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-28 left-1/2 h-[26rem] w-[46rem] -translate-x-1/2 rounded-full bg-[#0d0c0a]/[0.09] blur-[130px]" />
          <div className="absolute top-64 -right-20 size-72 rounded-full bg-[#c9c3b6]/50 blur-[110px]" />
        </div>

        <div className="relative w-full">
          {/* Suspense obrigatório por causa do useSearchParams() na page */}
          <Suspense
            fallback={
              <div className="mx-auto flex w-full max-w-xl items-center justify-center py-24">
                <Loader2 className="size-8 animate-spin text-[#0d0c0a]" aria-label="Carregando…" />
              </div>
            }
          >
            {children}
          </Suspense>
        </div>
      </main>
    </div>
  );
}
