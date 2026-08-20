import {
  BarChart3,
  Bell,
  Briefcase,
  Calendar,
  ChevronRight,
  DollarSign,
  ExternalLink,
  Menu,
  Package,
  Plus,
  Scissors,
  Search,
  Settings,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

/** Mesmos módulos e rótulos da navegação real do painel. */
const nav = [
  { label: "Visão Geral", Icon: BarChart3, active: true },
  { label: "Agenda", Icon: Calendar },
  { label: "Profissionais", Icon: Users },
  { label: "Serviços", Icon: Briefcase },
  { label: "Estoque", Icon: Package },
  { label: "Financeiro & PDV", Icon: DollarSign },
  { label: "CRM & Clientes", Icon: Star },
];

/** Os três cartões da Visão Geral, na mesma ordem da tela. */
const stats = [
  { label: "Faturamento Hoje", value: "R$ 1.480", Icon: TrendingUp },
  { label: "Agendamentos", value: "18", Icon: Calendar },
  { label: "Novos Clientes", value: "4", Icon: Users },
];

/** Sete barras de faturamento, como no gráfico "Últimos 7 dias". */
const week = [
  { day: "Qui", height: "46%" },
  { day: "Sex", height: "72%" },
  { day: "Sáb", height: "100%" },
  { day: "Dom", height: "22%" },
  { day: "Seg", height: "38%" },
  { day: "Ter", height: "61%" },
  { day: "Qua", height: "54%" },
];

/**
 * Prévia da Visão Geral do painel, desenhada em CSS a partir da tela real.
 *
 * Responsivo pela mesma regra do app: abaixo de `md` a navegação lateral é um
 * drawer, então some daqui também — em vez de espremer o layout de desktop até
 * a tipografia ficar ilegível. Decorativa, fora da árvore de acessibilidade.
 */
export function DashboardMock() {
  return (
    <div
      aria-hidden="true"
      className="select-none overflow-hidden rounded-t-[1rem] bg-[#080808] shadow-[0_-10px_60px_-15px_rgba(0,0,0,0.8)] ring-1 ring-white/10 sm:rounded-t-[1.1rem]"
    >
      {/* Barra do navegador */}
      <div className="flex h-7 items-center gap-2 border-b border-white/[0.06] bg-[#111110] px-2.5 sm:h-8 sm:gap-3 sm:px-3">
        <div className="flex gap-1 sm:gap-1.5">
          <span className="size-1.5 rounded-full bg-white/25 sm:size-2" />
          <span className="size-1.5 rounded-full bg-white/15 sm:size-2" />
          <span className="size-1.5 rounded-full bg-white/10 sm:size-2" />
        </div>
        <div className="mx-auto rounded-md bg-white/[0.04] px-4 py-0.5 text-center text-[0.5rem] tracking-wide text-neutral-500 sm:px-10 sm:text-[0.55rem] lg:text-[0.62rem]">
          growingman.app/dashboard
        </div>
      </div>

      <div className="flex">
        {/* Navegação lateral — drawer no mobile, igual ao app */}
        <aside className="hidden w-[7.75rem] shrink-0 flex-col border-r border-white/[0.06] bg-[#080808] md:flex lg:w-[9.5rem]">
          <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-2.5 py-2.5 lg:px-3 lg:py-3">
            <span className="grid size-4 shrink-0 place-items-center rounded-[0.3rem] bg-white lg:size-5">
              <Scissors className="size-2.5 text-black lg:size-3" />
            </span>
            <span className="truncate font-heading text-[0.6rem] font-black tracking-tight text-white lg:text-[0.72rem]">
              Growingman
            </span>
          </div>

          <div className="flex-1 space-y-0.5 p-1.5 lg:p-2">
            <div className="mb-1.5 flex items-center gap-1.5 px-1.5">
              <span className="size-1 rounded-full bg-white/70" />
              <span className="truncate text-[0.4rem] font-semibold uppercase tracking-[0.12em] text-neutral-600 lg:text-[0.45rem]">
                Sistema Ativo
              </span>
            </div>

            {nav.map(({ label, Icon, active }) => (
              <div
                key={label}
                className={`flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[0.5rem] font-medium lg:gap-2 lg:px-2 lg:py-1.5 lg:text-[0.58rem] ${
                  active ? "bg-white text-black" : "text-neutral-500"
                }`}
              >
                <Icon className="size-2.5 shrink-0 lg:size-3" />
                <span className="truncate">{label}</span>
                {active && <span className="ml-auto size-1 shrink-0 rounded-full bg-black/40" />}
              </div>
            ))}

            <div className="mx-1.5 my-2 h-px bg-white/[0.06]" />
            <p className="truncate px-1.5 pb-1 text-[0.38rem] font-semibold uppercase tracking-[0.12em] text-neutral-600 lg:text-[0.43rem]">
              Configurações
            </p>
            <div className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[0.5rem] font-medium text-neutral-500 lg:gap-2 lg:px-2 lg:py-1.5 lg:text-[0.58rem]">
              <Settings className="size-2.5 shrink-0 lg:size-3" />
              <span className="truncate">Ajustes do App</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 border-t border-white/[0.06] px-3 py-2 text-[0.5rem] font-medium text-neutral-500 lg:gap-2 lg:text-[0.58rem]">
            <ExternalLink className="size-2.5 shrink-0 lg:size-3" />
            <span className="truncate">Meu App</span>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Barra superior */}
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-2.5 py-2 sm:px-3.5 lg:px-4 lg:py-2.5">
            <span className="grid size-5 shrink-0 place-items-center rounded-md border border-white/[0.06] bg-white/[0.03] text-neutral-500 md:hidden">
              <Menu className="size-2.5" />
            </span>
            <div className="flex h-5 min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-white/[0.04] px-2 lg:h-6">
              <Search className="size-2.5 shrink-0 text-neutral-600 lg:size-3" />
              <span className="truncate text-[0.5rem] text-neutral-600 lg:text-[0.58rem]">
                Buscar módulos...
              </span>
            </div>
            <span className="grid size-5 shrink-0 place-items-center rounded-md border border-white/[0.06] bg-white/[0.03] text-neutral-500 lg:size-6 lg:rounded-lg">
              <Bell className="size-2.5 lg:size-3" />
            </span>
          </div>

          {/* Conteúdo */}
          <div className="space-y-2.5 p-2.5 sm:p-3.5 lg:space-y-3.5 lg:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[0.4rem] font-semibold uppercase tracking-[0.16em] text-neutral-600 lg:text-[0.48rem]">
                  Visão Geral
                </p>
                <p className="mt-0.5 truncate font-heading text-[0.85rem] font-black tracking-tight text-white sm:text-[1rem] lg:text-[1.2rem]">
                  Barbearia Navalha
                </p>
                <p className="truncate text-[0.45rem] text-neutral-500 lg:text-[0.55rem]">
                  Bem-vindo de volta. Aqui está o resumo de hoje.
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1 rounded-lg bg-white px-1.5 py-1 text-[0.45rem] font-semibold text-black lg:px-2.5 lg:py-1.5 lg:text-[0.55rem]">
                <Plus className="size-2.5 lg:size-3" />
                <span className="hidden sm:inline">Novo Agendamento</span>
              </span>
            </div>

            {/* Cartões da Visão Geral */}
            <div className="grid grid-cols-3 gap-1.5 lg:gap-2.5">
              {stats.map(({ label, value, Icon }) => (
                <div
                  key={label}
                  className="min-w-0 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1.5 sm:p-2 lg:rounded-xl lg:p-3"
                >
                  <div className="mb-1.5 flex items-center justify-between lg:mb-2.5">
                    <span className="grid size-4 place-items-center rounded-md border border-white/[0.06] bg-white/5 text-neutral-400 lg:size-6 lg:rounded-lg">
                      <Icon className="size-2 lg:size-3" />
                    </span>
                    <ChevronRight className="size-2.5 shrink-0 text-neutral-700 lg:size-3" />
                  </div>
                  <p className="truncate text-[0.4rem] font-medium uppercase tracking-wider text-neutral-500 lg:text-[0.5rem]">
                    {label}
                  </p>
                  <p className="mt-0.5 truncate font-heading text-[0.8rem] font-black tracking-tight text-white sm:text-[0.95rem] lg:text-[1.25rem]">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Gráfico "Últimos 7 dias" */}
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 sm:p-2.5 lg:rounded-xl lg:p-3.5">
              <div className="mb-2 flex items-end justify-between gap-2 lg:mb-3">
                <div className="flex min-w-0 items-center gap-1.5 lg:gap-2">
                  <span className="grid size-4 shrink-0 place-items-center rounded-md border border-white/[0.06] bg-white/5 text-neutral-400 lg:size-6 lg:rounded-lg">
                    <TrendingUp className="size-2 lg:size-3" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[0.5rem] font-bold text-white lg:text-[0.62rem]">
                      Últimos 7 dias
                    </p>
                    <p className="truncate text-[0.42rem] text-neutral-500 lg:text-[0.5rem]">
                      Faturamento e agendamentos
                    </p>
                  </div>
                </div>
                <div className="hidden shrink-0 gap-3 sm:flex lg:gap-4">
                  <div className="text-right">
                    <p className="text-[0.4rem] uppercase tracking-wider text-neutral-500 lg:text-[0.46rem]">
                      Receita
                    </p>
                    <p className="font-heading text-[0.6rem] font-black text-white lg:text-[0.75rem]">
                      R$ 8.920
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[0.4rem] uppercase tracking-wider text-neutral-500 lg:text-[0.46rem]">
                      Agend.
                    </p>
                    <p className="font-heading text-[0.6rem] font-black text-white lg:text-[0.75rem]">96</p>
                  </div>
                </div>
              </div>

              <div className="flex items-end gap-1.5 lg:gap-2.5">
                {week.map(({ day, height }) => (
                  <div key={day} className="flex flex-1 flex-col items-center gap-1 lg:gap-1.5">
                    <div className="flex h-12 w-full items-end sm:h-16 lg:h-20">
                      <div
                        className="w-full rounded-t-[3px] bg-gradient-to-t from-white/15 to-white/55 lg:rounded-t-md"
                        style={{ height }}
                      />
                    </div>
                    <span className="text-[0.4rem] font-medium text-neutral-500 lg:text-[0.48rem]">
                      {day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
