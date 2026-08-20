import Link from "next/link";
import { ArrowRight, CalendarDays, Users, Wallet } from "lucide-react";
import { DashboardMock } from "./DashboardMock";
import { btn, containerFlush } from "@/components/brand/ui";

const chips = [
  { Icon: CalendarDays, from: "#6f6b64", to: "#3a3733" },
  { Icon: Users, from: "#3a3733", to: "#1c1a17" },
  { Icon: Wallet, from: "#1c1a17", to: "#000000" },
];

export function Hero() {
  return (
    <section className="relative px-3 pt-8 sm:px-6 sm:pt-14">
      {/* Halos desfocados: profundidade atrás do cartão, sem competir com o texto */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-[30rem] w-[52rem] -translate-x-1/2 rounded-full bg-[#0d0c0a]/[0.10] blur-[130px]" />
        <div className="absolute top-40 -left-20 size-80 rounded-full bg-[#c9c3b6]/50 blur-[110px]" />
        <div className="absolute top-56 -right-16 size-80 rounded-full bg-[#6f6b64]/25 blur-[110px]" />
      </div>

      <div className={`relative ${containerFlush}`}>
        <div className="gm-mesh gm-scrim gm-grain relative overflow-hidden rounded-[1.5rem] px-4 pt-14 sm:rounded-[2.25rem] sm:px-8 sm:pt-24 lg:rounded-[2.75rem] lg:px-12 lg:pt-28">
          <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
            <h1
              className="gm-rise text-balance font-heading text-[clamp(2.05rem,5.6vw,4.35rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:leading-[1.02] sm:tracking-[-0.035em]"
              style={{ textShadow: "0 2px 30px rgba(0,0,0,0.35)" }}
            >
              A agenda e a operação da sua barbearia{" "}
              <span className="bg-[linear-gradient(100deg,#ffffff_10%,#e4e0d8_55%,#b3ada0_100%)] bg-clip-text text-transparent">
                no mesmo lugar
              </span>
            </h1>

            <p
              className="gm-rise mt-5 max-w-xl text-pretty text-[0.92rem] leading-6 text-white/85 sm:mt-6 sm:text-[1.06rem] sm:leading-8"
              style={{ animationDelay: "90ms" }}
            >
              Publique horários, receba agendamentos pelo link da barbearia e acompanhe a rotina da
              equipe sem depender de planilhas ou mensagens espalhadas.
            </p>

            <div
              className="gm-rise mt-7 flex w-full flex-col items-center gap-3 sm:mt-9 sm:w-auto sm:flex-row sm:gap-4"
              style={{ animationDelay: "180ms" }}
            >
              <Link href="/onboarding" className={`${btn.onDarkSolid} w-full sm:w-auto`}>
                Criar conta
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
              <Link href="#recursos" className={`${btn.onDarkGhost} w-full sm:w-auto`}>
                Ver recursos
              </Link>
            </div>

            <p
              className="gm-rise mt-5 text-[0.75rem] text-white/70 sm:mt-6 sm:text-[0.8rem]"
              style={{ animationDelay: "240ms" }}
            >
              Plano único · R$ 299 por mês
            </p>
          </div>

          {/* O painel entra pela borda inferior do cartão: sugere continuidade sem cortar o layout */}
          <div
            className="gm-rise relative z-10 mx-auto mt-9 max-w-4xl sm:mt-16 lg:mt-20"
            style={{ animationDelay: "300ms" }}
          >
            <DashboardMock />
          </div>
        </div>

        {/* Selo sobreposto: ancora o topo do cartão e antecipa os três módulos */}
        <div className="absolute inset-x-0 top-0 z-20 flex justify-center px-4">
          <div className="flex max-w-full -translate-y-1/2 items-center gap-2 rounded-full border border-white/70 bg-white/90 py-1.5 pl-2 pr-3.5 shadow-[0_18px_40px_-20px_rgba(13,12,10,0.6)] backdrop-blur-xl sm:gap-3 sm:py-2 sm:pl-2.5 sm:pr-5">
            <span className="flex shrink-0 -space-x-1.5 sm:-space-x-2" aria-hidden="true">
              {chips.map(({ Icon, from, to }, i) => (
                <span
                  key={i}
                  className="grid size-6 place-items-center rounded-full text-white ring-2 ring-white sm:size-7"
                  style={{ background: `linear-gradient(140deg, ${from}, ${to})` }}
                >
                  <Icon className="size-3 sm:size-3.5" />
                </span>
              ))}
            </span>
            <span className="truncate text-[0.7rem] font-medium tracking-tight text-[#0d0c0a] sm:text-[0.78rem]">
              <span className="sm:hidden">Tudo num painel só</span>
              <span className="hidden sm:inline">Agenda, equipe e financeiro num painel só</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
