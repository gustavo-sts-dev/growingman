import Link from "next/link";
import { ArrowRight, CalendarClock, PanelsTopLeft, Wallet } from "lucide-react";
import { BookingMock } from "./BookingMock";
import { Eyebrow, btn, container, sectionPad } from "@/components/brand/ui";

const features = [
  {
    Icon: PanelsTopLeft,
    title: "Uma página de agendamento com a sua marca",
    text: "Link público com as cores, os textos e a capa da barbearia. O cliente escolhe serviço, profissional, data e horário sem instalar nada.",
  },
  {
    Icon: CalendarClock,
    title: "Uma agenda que a equipe entende",
    text: "Atendimentos e bloqueios de horário por profissional, com a visão do dia inteiro para quem está no balcão coordenando a fila.",
  },
  {
    Icon: Wallet,
    title: "Financeiro e estoque no mesmo painel",
    text: "Serviços, clientes, produtos e movimentações ficam juntos — e o Mercado Pago pode ser ligado quando você quiser cobrar pelo sistema.",
  },
];

export function Features() {
  return (
    <section id="recursos" className={`relative scroll-mt-24 ${sectionPad}`}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 size-[26rem] rounded-full bg-[#0d0c0a]/[0.08] blur-[130px]" />
      </div>

      <div className={`relative ${container}`}>
        <div className="grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
          {/* Visual: forma assimétrica que quebra a grade de retângulos da página */}
          <div className="relative mx-auto w-full max-w-sm sm:max-w-md lg:mx-0">
            <div className="gm-grain relative grid aspect-[4/4.3] place-items-center overflow-hidden rounded-[3rem_1.25rem_3rem_1.25rem] bg-[linear-gradient(150deg,#4a4640_0%,#211f1b_40%,#0d0c0a_74%,#000000_100%)] shadow-[0_40px_90px_-45px_rgba(13,12,10,0.95)] sm:aspect-[4/4.6] sm:rounded-[5rem_1.75rem_5rem_1.75rem] lg:rounded-[7rem_2rem_7rem_2rem]">
              <div className="gm-float relative z-10">
                <BookingMock />
              </div>
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-6 -left-6 size-32 rounded-full bg-[#0d0c0a]/15 blur-[60px]"
            />
          </div>

          {/* Conteúdo: à direita só quando há duas colunas; empilhado, alinha à esquerda */}
          <div>
            <Eyebrow align="right">Recursos</Eyebrow>
            <h2 className="mt-4 text-balance font-heading text-[clamp(1.65rem,3.4vw,2.9rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-[#0d0c0a] sm:mt-5 sm:leading-[1.08] sm:tracking-[-0.035em] lg:text-right">
              Tudo o que a barbearia usa todo dia, em um só sistema
            </h2>

            <div className="mt-8 space-y-3 sm:mt-10 sm:space-y-3.5">
              {features.map(({ Icon, title, text }) => (
                <article
                  key={title}
                  className="group flex gap-3.5 rounded-[1.15rem] border border-[#e4e0d8] bg-white p-4 shadow-[0_18px_44px_-36px_rgba(13,12,10,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c9c3b6] hover:shadow-[0_26px_54px_-34px_rgba(13,12,10,0.6)] sm:gap-4 sm:rounded-[1.25rem] sm:p-6"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f3f1ec] text-[#0d0c0a] ring-1 ring-[#e4e0d8] transition-colors duration-300 group-hover:bg-[#0d0c0a] group-hover:text-white sm:size-10"
                  >
                    <Icon className="size-4 sm:size-[1.1rem]" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[0.98rem] font-semibold leading-snug tracking-tight text-[#0d0c0a] sm:text-[1.02rem]">
                      {title}
                    </h3>
                    <p className="mt-1.5 text-[0.88rem] leading-6 text-[#6f6b64] sm:mt-2 sm:text-[0.9rem]">
                      {text}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:gap-4 lg:justify-end">
              <Link href="/onboarding" className={`${btn.primary} w-full sm:w-auto`}>
                Criar conta
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
              <Link href="#plano" className={`${btn.secondary} w-full sm:w-auto`}>
                Ver o plano
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
