import { Eyebrow, containerFlush } from "@/components/brand/ui";

const steps = [
  {
    number: "01",
    title: "O cliente agenda pelo link",
    text: "Na página pública da barbearia ele escolhe serviço, profissional, data e horário direto do navegador — sem baixar aplicativo, sem cadastro longo.",
  },
  {
    number: "02",
    title: "A equipe segue a agenda",
    text: "Cada profissional enxerga os próprios atendimentos e bloqueios do dia. Quem está no balcão vê a agenda inteira sem abrir conversa nenhuma.",
  },
  {
    number: "03",
    title: "Você acompanha o negócio",
    text: "Clientes, serviços, estoque e movimentações financeiras ficam registrados no mesmo painel, prontos para fechar o mês.",
  },
];

export function Steps() {
  return (
    <section id="como-funciona" className="scroll-mt-24 px-3 sm:px-6">
      <div className={containerFlush}>
        <div className="gm-mesh-band gm-grain relative overflow-hidden rounded-[1.5rem] px-4 py-12 sm:rounded-[2.25rem] sm:px-10 sm:py-20 lg:rounded-[2.75rem] lg:px-14 lg:py-24">
          <div className="relative z-10">
            <header className="mx-auto max-w-2xl text-center">
              <Eyebrow align="center" tone="dark">
                Como funciona
              </Eyebrow>
              <h2 className="mt-4 text-balance font-heading text-[clamp(1.65rem,3.6vw,3rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-white sm:mt-5 sm:leading-[1.06] sm:tracking-[-0.035em]">
                Três passos entre o link publicado e o caixa fechado
              </h2>
            </header>

            <div className="relative mt-10 sm:mt-14">
              {/* Fio que costura as três etapas — só onde há espaço horizontal */}
              <div
                aria-hidden="true"
                className="absolute inset-x-[12%] top-[3.6rem] hidden border-t border-dashed border-white/20 lg:block"
              />

              <ol className="relative grid gap-3 sm:gap-5 md:grid-cols-3">
                {steps.map((step) => (
                  <li
                    key={step.number}
                    className="rounded-[1.25rem] border border-white/15 bg-white/[0.07] p-5 backdrop-blur-xl transition-colors duration-300 hover:border-white/30 hover:bg-white/[0.12] sm:rounded-[1.35rem] sm:p-8"
                  >
                    <span className="grid size-12 place-items-center rounded-full bg-[linear-gradient(145deg,#5a564e_0%,#1c1a17_60%,#000000_100%)] font-heading text-[0.9rem] font-semibold text-white shadow-[0_12px_28px_-12px_rgba(0,0,0,0.9)] ring-1 ring-white/25 sm:size-[3.25rem] sm:text-[0.95rem]">
                      {step.number}
                    </span>
                    <h3 className="mt-5 text-[1.05rem] font-semibold leading-snug tracking-tight text-white sm:mt-6 sm:text-[1.12rem]">
                      {step.title}
                    </h3>
                    <p className="mt-2.5 text-[0.88rem] leading-6 text-white/75 sm:mt-3 sm:text-[0.92rem] sm:leading-7">
                      {step.text}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
