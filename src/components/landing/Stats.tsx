import { CalendarDays, Check, LayoutTemplate, Users, Wallet } from "lucide-react";
import { Eyebrow, container, sectionPad } from "@/components/brand/ui";

const stats = [
  {
    value: "24/7",
    label: "Agenda sempre aberta",
    text: "O link da barbearia continua recebendo horários fora do expediente — ninguém precisa parar o corte para responder mensagem.",
    featured: true,
  },
  {
    value: "5",
    label: "Modelos de página",
    text: "Cinco layouts prontos para a página pública. Cores, textos e imagem de capa são ajustados no próprio painel.",
  },
  {
    value: "R$ 299",
    label: "Plano único mensal",
    text: "Todos os módulos liberados: agenda, equipe, clientes, serviços, estoque e financeiro. Sem pacote extra.",
  },
];

const chips = [CalendarDays, Users, Wallet];

export function Stats() {
  return (
    <section className={`relative ${sectionPad}`}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/3 flex justify-center">
        <div className="size-[34rem] rounded-full bg-[#0d0c0a]/[0.07] blur-[140px]" />
      </div>

      <div className={`relative ${container}`}>
        {/* Cabeçalho em duas colunas: título ancorado à esquerda, apoio à direita */}
        <div className="grid gap-5 border-b border-[#e4e0d8] pb-8 sm:gap-6 sm:pb-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16">
          <div>
            <Eyebrow>Em números</Eyebrow>
            <h2 className="mt-4 max-w-xl text-balance font-heading text-[clamp(1.65rem,3.4vw,2.9rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-[#0d0c0a] sm:mt-5 sm:leading-[1.08] sm:tracking-[-0.035em]">
              O que muda na rotina quando a agenda vive online
            </h2>
          </div>
          <p className="max-w-md text-[0.92rem] leading-6 text-[#6f6b64] sm:text-[0.97rem] sm:leading-7 lg:pb-1">
            Nada de listar horário no caderno ou confirmar por mensagem. O cliente marca sozinho e o
            painel registra tudo no mesmo lugar.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:mt-10 sm:gap-5 md:grid-cols-3">
          {stats.map((stat) =>
            stat.featured ? (
              <article
                key={stat.value}
                className="gm-mesh gm-grain relative overflow-hidden rounded-[1.35rem] p-6 text-white shadow-[0_28px_60px_-30px_rgba(13,12,10,0.9)] sm:rounded-[1.5rem] sm:p-8"
              >
                <div className="relative z-10">
                  <p className="font-heading text-[clamp(2.4rem,4.4vw,3.5rem)] font-semibold leading-none tracking-[-0.045em]">
                    {stat.value}
                  </p>
                  <p className="mt-3 text-[1rem] font-semibold tracking-tight text-white sm:text-[1.02rem]">
                    {stat.label}
                  </p>
                  <span className="mt-5 flex -space-x-2 sm:mt-6" aria-hidden="true">
                    {chips.map((Icon, i) => (
                      <span
                        key={i}
                        className="grid size-8 place-items-center rounded-full bg-white/20 text-white ring-2 ring-white/40 backdrop-blur-md sm:size-9"
                      >
                        <Icon className="size-3.5 sm:size-4" />
                      </span>
                    ))}
                  </span>
                  <p className="mt-5 text-[0.88rem] leading-6 text-white/85 sm:mt-6 sm:text-[0.9rem]">
                    {stat.text}
                  </p>
                </div>
              </article>
            ) : (
              <article
                key={stat.value}
                className="rounded-[1.35rem] border border-[#e4e0d8] bg-white p-6 shadow-[0_20px_44px_-34px_rgba(13,12,10,0.55)] transition-transform duration-300 hover:-translate-y-1 sm:rounded-[1.5rem] sm:p-8"
              >
                <p className="font-heading text-[clamp(2.4rem,4.4vw,3.5rem)] font-semibold leading-none tracking-[-0.045em] text-[#0d0c0a]">
                  {stat.value}
                </p>
                <p className="mt-3 text-[1rem] font-semibold tracking-tight text-[#0d0c0a] sm:text-[1.02rem]">
                  {stat.label}
                </p>
                <span
                  aria-hidden="true"
                  className="mt-5 grid size-8 place-items-center rounded-full bg-[#f3f1ec] text-[#0d0c0a] ring-1 ring-[#e4e0d8] sm:mt-6 sm:size-9"
                >
                  {stat.value === "5" ? (
                    <LayoutTemplate className="size-3.5 sm:size-4" />
                  ) : (
                    <Check className="size-3.5 sm:size-4" />
                  )}
                </span>
                <p className="mt-5 text-[0.88rem] leading-6 text-[#6f6b64] sm:mt-6 sm:text-[0.9rem]">
                  {stat.text}
                </p>
              </article>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
