import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Eyebrow, btn, container, sectionPad } from "@/components/brand/ui";

const included = [
  "Página de agendamento com a marca da barbearia",
  "Cadastro de serviços, profissionais e clientes",
  "Agenda e bloqueio de horários",
  "Painel financeiro e controle de estoque",
  "Personalização de cores, conteúdo e capa",
  "Integração opcional com Mercado Pago",
];

export function Pricing() {
  return (
    <section id="plano" className={`relative scroll-mt-24 ${sectionPad}`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-10 flex justify-center overflow-hidden"
      >
        <div className="size-[38rem] rounded-full bg-[#0d0c0a]/[0.08] blur-[150px]" />
      </div>

      <div className={`relative ${container}`}>
        <header className="mx-auto max-w-2xl text-center">
          <Eyebrow align="center">Assinatura</Eyebrow>
          <h2 className="mt-4 text-balance font-heading text-[clamp(1.65rem,3.6vw,3rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-[#0d0c0a] sm:mt-5 sm:leading-[1.06] sm:tracking-[-0.035em]">
            Um plano só, com a operação inteira dentro
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-pretty text-[0.92rem] leading-6 text-[#6f6b64] sm:mt-5 sm:text-[0.97rem] sm:leading-7">
            Você informa os dados da barbearia, gera a cobrança por Pix e recebe o acesso ao painel.
          </p>
        </header>

        {/* Borda em gradiente: destaca o cartão sem pesar com sombra */}
        <div className="mt-8 rounded-[1.6rem] bg-[linear-gradient(160deg,#c9c3b6_0%,#e4e0d8_45%,rgba(228,224,216,0)_100%)] p-px shadow-[0_40px_90px_-50px_rgba(13,12,10,0.7)] sm:mt-12 sm:rounded-[1.85rem]">
          <div className="grid overflow-hidden rounded-[1.55rem] bg-white sm:rounded-[1.8rem] lg:grid-cols-[0.88fr_1.12fr]">
            {/* Preço: a única peça nesta escala tipográfica em toda a página */}
            <div className="gm-mesh gm-grain relative overflow-hidden p-6 text-white sm:p-8 lg:p-10">
              <div className="relative z-10 flex h-full flex-col">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/70 sm:text-[0.68rem]">
                  Growingman Premium
                </p>
                <p className="mt-6 flex flex-wrap items-end gap-x-2 sm:mt-8">
                  <span className="font-heading text-[clamp(2.6rem,6vw,4.25rem)] font-semibold leading-none tracking-[-0.05em]">
                    R$ 299
                  </span>
                  <span className="pb-1.5 text-[0.9rem] text-white/75 sm:pb-2 sm:text-[0.95rem]">/mês</span>
                </p>
                <p className="mt-4 max-w-xs text-[0.88rem] leading-6 text-white/85 sm:text-[0.92rem] sm:leading-7">
                  Sem cobrança por agendamento e sem módulo vendido à parte.
                </p>

                <div className="mt-8 lg:mt-auto lg:pt-10">
                  <Link href="/onboarding" className={`${btn.onDarkSolid} w-full`}>
                    Começar cadastro
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                  <p className="mt-4 text-[0.75rem] leading-5 text-white/65 sm:text-[0.78rem]">
                    A cobrança inicial é gerada via Pix pelo Asaas e vence em 3 dias.
                  </p>
                </div>
              </div>
            </div>

            {/* Escopo: uma linha por item, no mesmo eixo de leitura do preço */}
            <div className="p-6 sm:p-8 lg:p-10">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[#6f6b64] sm:text-[0.68rem]">
                O que está incluído
              </p>
              <ul className="mt-5 grid gap-x-8 sm:mt-7 xl:grid-cols-2">
                {included.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 border-b border-[#eae7e0] py-3.5 text-[0.9rem] leading-6 text-[#3a3733] last:border-b-0 sm:py-4 sm:text-[0.93rem]"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#f3f1ec] text-[#0d0c0a]"
                    >
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
