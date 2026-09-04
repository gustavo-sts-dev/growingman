import { Check, ChevronDown, ChevronLeft, Clock, Scissors } from "lucide-react";

/**
 * Prévia da página pública de agendamento.
 *
 * As cores são as do tema PADRÃO da página real (`[tenantSlug]/agendar/page.tsx`):
 * fundo ônix #080808, títulos brancos, texto #A1A1AA e botão branco sobre preto.
 * A barbearia pode trocar tudo isso no painel — mas quem chega aqui sem tema
 * escolhido vê exatamente esta tela, então é ela que a landing deve mostrar.
 *
 * Antes o mock era um cartão branco: bonito, e de um produto que não existe.
 */

/** Fatias do tema real, resolvidas em hex — aqui não há tenant para o `color-mix`. */
const c = {
  bg: "#080808",
  title: "#ffffff",
  text: "#a1a1aa",
  /** `color-mix(--theme-text 65%, --theme-bg)`, calculado. */
  muted: "#6b6b71",
  surface: "rgba(255,255,255,0.06)",
  surfaceStrong: "rgba(255,255,255,0.12)",
  border: "rgba(255,255,255,0.18)",
  borderStrong: "rgba(255,255,255,0.35)",
};

const services = [
  { name: "Corte Social", time: "40 min", price: "R$ 55,00", active: true },
  { name: "Corte + Barba", time: "1h 10min", price: "R$ 90,00" },
  { name: "Barboterapia", time: "30 min", price: "R$ 45,00" },
];

/** Etapas 2 a 4 já respondidas — recolhidas, com o resumo sob o título. */
const answered = [
  { step: 2, title: "Com quem?", answer: "Rafael" },
  { step: 3, title: "Quando?", answer: "21/08 · 10:30" },
  { step: 4, title: "Seus Dados", answer: "João Silva" },
];

export function BookingMock() {
  return (
    <div
      aria-hidden="true"
      className="w-56 select-none overflow-hidden rounded-[1.25rem] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.95)] ring-1 ring-white/12 sm:w-64 sm:rounded-[1.4rem] lg:w-[17rem]"
      style={{ backgroundColor: c.bg }}
    >
      {/* Cabeçalho da página pública: voltar ao site + marca da barbearia */}
      <div
        className="flex items-center justify-between border-b px-3 py-2"
        style={{ borderColor: "rgba(255,255,255,0.12)" }}
      >
        <span className="flex items-center gap-1 text-[0.5rem] font-medium" style={{ color: c.text }}>
          <ChevronLeft className="size-2" />
          Voltar ao site
        </span>
        <span
          className="flex items-center gap-1 text-[0.58rem] font-bold tracking-tight"
          style={{ color: c.title }}
        >
          <span
            className="grid size-3 place-items-center rounded-[0.25rem]"
            style={{ backgroundColor: c.surfaceStrong }}
          >
            <Scissors className="size-1.5" />
          </span>
          Barbearia Navalha
        </span>
      </div>

      <div className="p-3">
        <p className="font-heading text-[0.9rem] font-extrabold tracking-tight" style={{ color: c.title }}>
          Agendamento
        </p>
        <p className="mt-0.5 text-[0.5rem] font-medium" style={{ color: c.text }}>
          Preencha os dados abaixo para reservar seu horário.
        </p>

        <div className="mt-2.5 space-y-1.5">
          {/* Etapa 1, aberta: casca destacada, como na tela real */}
          <div
            className="rounded-xl border p-2.5"
            style={{ backgroundColor: c.surface, borderColor: c.borderStrong }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="grid size-4 shrink-0 place-items-center rounded-full text-[0.45rem] font-bold"
                  style={{ backgroundColor: c.surfaceStrong, color: c.title }}
                >
                  1
                </span>
                <p className="text-[0.68rem] font-bold" style={{ color: c.title }}>
                  O que você deseja?
                </p>
              </div>
              <ChevronDown className="size-2.5 rotate-180" style={{ color: c.muted }} />
            </div>

            <div className="mt-2 space-y-1">
              {services.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between rounded-lg border px-2 py-1.5"
                  style={
                    service.active
                      ? { backgroundColor: c.surfaceStrong, borderColor: c.borderStrong }
                      : { borderColor: c.border }
                  }
                >
                  <div>
                    <p className="text-[0.6rem] font-bold" style={{ color: c.title }}>
                      {service.name}
                    </p>
                    <p
                      className="mt-0.5 flex items-center gap-0.5 text-[0.48rem] font-medium"
                      style={{ color: c.muted }}
                    >
                      <Clock className="size-1.5" />
                      {service.time}
                    </p>
                  </div>
                  <p className="text-[0.62rem] font-extrabold" style={{ color: c.title }}>
                    {service.price}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Etapas 2 a 4, recolhidas: círculo preenchido e resposta sob o título */}
          {answered.map(({ step, title, answer }) => (
            <div
              key={step}
              className="flex items-center justify-between gap-2 rounded-xl border px-2.5 py-2"
              style={{ borderColor: c.border }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="grid size-4 shrink-0 place-items-center rounded-full"
                  style={{ backgroundColor: c.title, color: c.bg }}
                >
                  <Check className="size-2" strokeWidth={3.5} />
                </span>
                <div>
                  <p className="text-[0.62rem] font-bold leading-tight" style={{ color: c.title }}>
                    {title}
                  </p>
                  <p className="text-[0.5rem] font-medium" style={{ color: c.muted }}>
                    {answer}
                  </p>
                </div>
              </div>
              <ChevronDown className="size-2.5 shrink-0" style={{ color: c.muted }} />
            </div>
          ))}
        </div>

        {/* Resumo e confirmação */}
        <div
          className="mt-2.5 flex items-center justify-between border-t pt-2"
          style={{ borderColor: c.border }}
        >
          <span className="text-[0.52rem] font-medium" style={{ color: c.muted }}>
            Total do serviço
          </span>
          <span className="font-heading text-[0.85rem] font-bold tracking-tight" style={{ color: c.title }}>
            R$ 55,00
          </span>
        </div>

        <div
          className="mt-2 rounded-xl py-2 text-center text-[0.62rem] font-bold"
          style={{ backgroundColor: "#ffffff", color: "#000000" }}
        >
          Confirmar Agendamento
        </div>
        <p className="mt-1.5 text-center text-[0.45rem] font-medium" style={{ color: c.muted }}>
          O pagamento é combinado diretamente com a barbearia.
        </p>
      </div>
    </div>
  );
}
