import { Check } from "lucide-react";

const services = [
  { name: "Corte Social", time: "40 min", price: "R$ 55", active: true },
  { name: "Corte + Barba", time: "1h 10min", price: "R$ 90" },
  { name: "Barboterapia", time: "30 min", price: "R$ 45" },
];

/** Etapas 2 a 4 do fluxo, já respondidas — como aparecem recolhidas na tela real. */
const answered = [
  { step: 2, title: "Com quem?", answer: "Rafael" },
  { step: 3, title: "Quando?", answer: "21/08 às 10:30" },
  { step: 4, title: "Seus Dados", answer: "João Silva" },
];

/**
 * Prévia da página pública de agendamento, com os mesmos quatro passos
 * do fluxo real: serviço, profissional, data/horário e dados do cliente.
 */
export function BookingMock() {
  return (
    <div
      aria-hidden="true"
      className="w-56 select-none overflow-hidden rounded-[1.25rem] bg-white shadow-[0_40px_80px_-30px_rgba(0,0,0,0.85)] ring-1 ring-black/10 sm:w-64 sm:rounded-[1.4rem] lg:w-[17rem]"
    >
      {/* Cabeçalho da página pública */}
      <div className="border-b border-[#eae7e0] bg-[#0d0c0a] px-4 py-3.5">
        <p className="font-heading text-[0.95rem] font-extrabold tracking-tight text-white">Agendamento</p>
        <p className="mt-0.5 text-[0.55rem] font-medium text-neutral-400">
          Preencha os dados abaixo para reservar seu horário.
        </p>
      </div>

      <div className="space-y-1.5 p-3">
        {/* Etapa 1, aberta */}
        <div className="rounded-xl border border-[#0d0c0a] bg-white p-2.5">
          <div className="flex items-center gap-2">
            <span className="grid size-4 shrink-0 place-items-center rounded-full bg-[#0d0c0a] text-[0.45rem] font-bold text-white">
              1
            </span>
            <p className="text-[0.68rem] font-bold tracking-tight text-[#0d0c0a]">O que você deseja?</p>
          </div>

          <div className="mt-2 space-y-1">
            {services.map((service) => (
              <div
                key={service.name}
                className={`flex items-center justify-between rounded-lg border px-2 py-1.5 ${
                  service.active ? "border-[#0d0c0a] bg-[#f3f1ec]" : "border-[#eae7e0] bg-white"
                }`}
              >
                <div>
                  <p className="text-[0.6rem] font-semibold tracking-tight text-[#0d0c0a]">{service.name}</p>
                  <p className="text-[0.48rem] text-[#8a857c]">{service.time}</p>
                </div>
                <p className="text-[0.6rem] font-bold text-[#0d0c0a]">{service.price}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Etapas 2 a 4, recolhidas */}
        {answered.map(({ step, title, answer }) => (
          <div
            key={step}
            className="flex items-center gap-2 rounded-xl border border-[#eae7e0] bg-white px-2.5 py-2"
          >
            <span className="grid size-4 shrink-0 place-items-center rounded-full bg-[#e4e0d8] text-[#0d0c0a]">
              <Check className="size-2" strokeWidth={3.5} />
            </span>
            <p className="text-[0.62rem] font-bold tracking-tight text-[#0d0c0a]">{title}</p>
            <p className="ml-auto text-[0.52rem] font-medium text-[#8a857c]">{answer}</p>
          </div>
        ))}

        {/* Resumo e confirmação */}
        <div className="flex items-center justify-between px-1 pt-1.5">
          <span className="text-[0.52rem] font-medium uppercase tracking-wider text-[#8a857c]">
            Total do Serviço
          </span>
          <span className="font-heading text-[0.8rem] font-black tracking-tight text-[#0d0c0a]">R$ 55,00</span>
        </div>
        <div className="rounded-xl bg-[#0d0c0a] py-2 text-center text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white">
          Confirmar Agendamento
        </div>
      </div>
    </div>
  );
}
