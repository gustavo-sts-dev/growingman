"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, TrendingUp, XCircle, UserX, Receipt } from "lucide-react";

import { useResource } from "@/lib/use-resource";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/format";
import {
  VizCard,
  VizTable,
  RankBars,
  ColumnBars,
  VIZ,
  type RankRow,
} from "@/components/analytics/viz";
import { RevenueTimeSeries } from "@/components/analytics/RevenueTimeSeries";
import type {
  AnalyticsResponse,
  Barber,
  Service,
} from "@/lib/types";

/** AAAA-MM-DD no fuso local — o mesmo formato que a API espera. */
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function diasAtras(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return ymd(d);
}

const ATALHOS = [
  { label: "7 dias", dias: 6 },
  { label: "30 dias", dias: 29 },
  { label: "90 dias", dias: 89 },
] as const;

export default function AnalisePage() {
  const toast = useToast();

  // Um estado de filtro só, acima de todos os gráficos. Filtro por cartão faria
  // dois gráficos vizinhos mostrarem períodos diferentes.
  const [from, setFrom] = useState(() => diasAtras(29));
  const [to, setTo] = useState(() => ymd(new Date()));
  const [barberId, setBarberId] = useState("");
  const [serviceId, setServiceId] = useState("");

  const { data: barbers } = useResource<Barber[]>("/barbers", []);
  const { data: services } = useResource<Service[]>("/services", []);

  /**
   * A URL É o estado da consulta.
   *
   * `useResource` refaz a busca quando o `path` muda, então derivar a query dos
   * filtros basta — sem effect próprio. Escrever o fetch à mão aqui significaria
   * repetir cancelamento de resposta obsoleta e chamar `setState` dentro do
   * effect, que é justamente o que o lint do React barra.
   */
  const path = useMemo(() => {
    const params = new URLSearchParams({ from, to });
    if (barberId) params.set("barberId", barberId);
    if (serviceId) params.set("serviceId", serviceId);
    return `/dashboard/analytics?${params}`;
  }, [from, to, barberId, serviceId]);

  const { data, loading, error } = useResource<AnalyticsResponse | null>(path, null);

  useEffect(() => {
    if (error) toast.error(error);
    // `toast` fora das deps: a instância muda a cada render do provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const s = data?.summary;

  const barbeirosRank: RankRow[] = useMemo(
    () =>
      (data?.byBarber ?? []).map((b) => ({
        id: b.id,
        label: b.name,
        value: b.revenue,
        display: formatCurrency(b.revenue),
        meta: `${b.count} ${b.count === 1 ? "item" : "itens"}`,
      })),
    [data],
  );

  const servicosRank: RankRow[] = useMemo(
    () =>
      (data?.byService ?? []).slice(0, 10).map((x) => ({
        id: x.id,
        label: x.name,
        value: x.revenue,
        display: formatCurrency(x.revenue),
        meta: `${x.count}×`,
      })),
    [data],
  );

  const totalClientes = (data?.clients.new ?? 0) + (data?.clients.returning ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.6rem] font-semibold leading-tight text-white sm:text-2xl">Análise</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Tudo que aconteceu na barbearia no período escolhido.
        </p>
      </div>

      {/* ── Filtros: uma linha só, acima de tudo que ela recorta ──────────── */}
      <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 sm:p-4">
        {/*
          No celular os filtros viram blocos empilhados de largura inteira; a
          partir de `sm` voltam a ser a linha única de antes. Espremidos numa
          linha só de 390px, os dois seletores caíam para menos de 100px cada e
          o nome do profissional escolhido ficava ilegível.
        */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="rail w-full gap-1.5 sm:w-auto sm:overflow-visible">
            {ATALHOS.map((a) => {
              const ativo = from === diasAtras(a.dias) && to === ymd(new Date());
              return (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => {
                    setFrom(diasAtras(a.dias));
                    setTo(ymd(new Date()));
                  }}
                  className={`flex-1 whitespace-nowrap rounded-lg border px-3 py-2.5 text-xs font-medium transition-all active:scale-95 sm:flex-none sm:py-2 ${
                    ativo
                      ? "bg-white text-black border-white"
                      : "border-white/[0.08] text-neutral-400 hover:text-neutral-200 hover:border-white/20"
                  }`}
                >
                  {a.label}
                </button>
              );
            })}
          </div>

          {/* As duas datas dividem uma linha: são valores curtos e formam um
              par — separá-las custaria uma linha inteira sem ganho nenhum. */}
          <div className="grid grid-cols-2 gap-3 sm:contents">
            <Campo label="De">
              <input
                type="date"
                value={from}
                max={to}
                onChange={(e) => setFrom(e.target.value)}
                className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/40 px-2 text-sm text-neutral-200 [color-scheme:dark] sm:h-9 sm:w-auto"
              />
            </Campo>

            <Campo label="Até">
              <input
                type="date"
                value={to}
                min={from}
                max={ymd(new Date())}
                onChange={(e) => setTo(e.target.value)}
                className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/40 px-2 text-sm text-neutral-200 [color-scheme:dark] sm:h-9 sm:w-auto"
              />
            </Campo>
          </div>

          <Campo label="Profissional">
            <select
              value={barberId}
              onChange={(e) => setBarberId(e.target.value)}
              className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/40 px-2 text-sm text-neutral-200 sm:h-9 sm:w-auto sm:min-w-[10rem]"
            >
              <option value="">Todos</option>
              {(barbers ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Campo>

          <Campo label="Serviço">
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/40 px-2 text-sm text-neutral-200 sm:h-9 sm:w-auto sm:min-w-[10rem]"
            >
              <option value="">Todos</option>
              {(services ?? []).map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </Campo>

          {loading && (
            <Loader2 className="mx-auto h-4 w-4 animate-spin text-neutral-500 sm:mx-0 sm:mb-2.5" />
          )}
        </div>
      </section>

      {/*
        Segura o render anterior com opacidade reduzida enquanto recarrega.
        Um esqueleto piscando a cada troca de filtro faria a página saltar.
      */}
      <div
        className={`space-y-6 transition-opacity ${
          loading && data ? "opacity-50" : ""
        }`}
      >
        {/* ── Números do topo ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          <Tile
            label="Faturamento"
            value={formatCurrency(s?.revenue ?? 0)}
            hint={`${s?.completed ?? 0} concluídos`}
            growingman={TrendingUp}
            color={VIZ.good}
          />
          <Tile
            label="Ticket médio"
            value={formatCurrency(s?.averageTicket ?? 0)}
            hint="por atendimento concluído"
            growingman={Receipt}
            color={VIZ.series1}
          />
          <Tile
            label="Cancelamento"
            value={`${s?.cancellationRate ?? 0}%`}
            hint={`${s?.cancelled ?? 0} de ${s?.total ?? 0} agendados`}
            growingman={XCircle}
            color={VIZ.critical}
          />
          <Tile
            label="Não compareceu"
            value={`${s?.noShowRate ?? 0}%`}
            hint={`${s?.noShow ?? 0} de ${s?.total ?? 0} agendados`}
            growingman={UserX}
            color={VIZ.warning}
          />
        </div>

        {/* ── Faturamento no tempo ───────────────────────────────────────── */}
        <VizCard
          title="Faturamento por dia"
          subtitle="Só atendimentos concluídos — agendamento confirmado ainda não é dinheiro."
          table={
            <VizTable
              head={["Dia", "Faturamento", "Agendamentos"]}
              rows={(data?.series ?? []).map((p) => [
                new Date(`${p.date}T12:00:00`).toLocaleDateString("pt-BR"),
                formatCurrency(p.revenue),
                p.bookings,
              ])}
            />
          }
        >
          <RevenueTimeSeries points={data?.series ?? []} />
        </VizCard>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* ── Por profissional ─────────────────────────────────────────── */}
          <VizCard
            title="Receita por profissional"
            subtitle="Somada por item do atendimento, não pelo total do agendamento."
            table={
              <VizTable
                head={["Profissional", "Receita", "Itens"]}
                rows={(data?.byBarber ?? []).map((b) => [
                  b.name,
                  formatCurrency(b.revenue),
                  b.count,
                ])}
              />
            }
          >
            <RankBars rows={barbeirosRank} />
          </VizCard>

          {/* ── Serviços ─────────────────────────────────────────────────── */}
          <VizCard
            title="Serviços que mais rendem"
            subtitle="Os 10 primeiros do período."
            table={
              <VizTable
                head={["Serviço", "Receita", "Vezes"]}
                rows={(data?.byService ?? []).map((x) => [
                  x.name,
                  formatCurrency(x.revenue),
                  x.count,
                ])}
              />
            }
          >
            <RankBars rows={servicosRank} />
          </VizCard>

          {/* ── Horários de pico ─────────────────────────────────────────── */}
          <VizCard
            title="Horários de pico"
            subtitle="Agendamentos por hora, em qualquer desfecho — é sobre lotação, não receita."
            table={
              <VizTable
                head={["Hora", "Agendamentos"]}
                rows={(data?.peakHours ?? []).map((h) => [
                  `${String(h.hour).padStart(2, "0")}h`,
                  h.count,
                ])}
              />
            }
          >
            <ColumnBars
              points={(data?.peakHours ?? []).map((h) => ({
                key: String(h.hour),
                label: `${String(h.hour).padStart(2, "0")}h`,
                value: h.count,
              }))}
              formatValue={(v) => String(v)}
            />
          </VizCard>

          {/* ── Dias da semana ───────────────────────────────────────────── */}
          <VizCard
            title="Movimento por dia da semana"
            table={
              <VizTable
                head={["Dia", "Agendamentos"]}
                rows={(data?.peakWeekdays ?? []).map((d) => [d.label, d.count])}
              />
            }
          >
            <ColumnBars
              points={(data?.peakWeekdays ?? []).map((d) => ({
                key: String(d.weekday),
                label: d.label,
                value: d.count,
              }))}
              formatValue={(v) => String(v)}
            />
          </VizCard>
        </div>

        {/* ── Clientes ───────────────────────────────────────────────────── */}
        <VizCard
          title="Clientes atendidos"
          subtitle="Recorrente é quem já tinha atendimento concluído antes deste período."
          table={
            <VizTable
              head={["Tipo", "Clientes"]}
              rows={[
                ["Novos", data?.clients.new ?? 0],
                ["Recorrentes", data?.clients.returning ?? 0],
              ]}
            />
          }
        >
          {totalClientes === 0 ? (
            <p className="text-sm text-neutral-500 py-6 text-center">
              Nenhum cliente identificado no período.
            </p>
          ) : (
            <div className="space-y-3">
              {/* Duas categorias na mesma figura → duas cores + legenda. */}
              <div className="flex h-3 gap-[2px] rounded-sm overflow-hidden">
                <div
                  style={{
                    width: `${((data!.clients.new || 0) / totalClientes) * 100}%`,
                    background: VIZ.series1,
                  }}
                />
                <div
                  style={{
                    width: `${((data!.clients.returning || 0) / totalClientes) * 100}%`,
                    background: VIZ.series2,
                  }}
                />
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <Legenda cor={VIZ.series1} rotulo="Novos" valor={data!.clients.new} />
                <Legenda
                  cor={VIZ.series2}
                  rotulo="Recorrentes"
                  valor={data!.clients.returning}
                />
              </div>
            </div>
          )}
        </VizCard>
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-600">
        {label}
      </span>
      {children}
    </label>
  );
}

function Tile({
  label,
  value,
  hint,
  growingman: Growingman,
  color,
}: {
  label: string;
  value: string;
  hint: string;
  growingman: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 sm:p-4">
      <div className="mb-2 flex items-center gap-2">
        <Growingman className="h-3.5 w-3.5 shrink-0" style={{ color }} />
        <span className="text-[0.7rem] leading-tight text-neutral-500 sm:text-xs">{label}</span>
      </div>
      {/* Figuras proporcionais no número grande: tabular deixa o valor frouxo. */}
      <div className="text-xl font-semibold text-white sm:text-2xl">{value}</div>
      <div className="mt-0.5 text-[11px] leading-tight text-neutral-600">{hint}</div>
    </div>
  );
}

function Legenda({
  cor,
  rotulo,
  valor,
}: {
  cor: string;
  rotulo: string;
  valor: number;
}) {
  return (
    <span className="flex items-center gap-2 text-sm">
      <span
        className="w-2.5 h-2.5 rounded-sm shrink-0"
        style={{ background: cor }}
      />
      {/* O texto usa token de texto, nunca a cor da série. */}
      <span className="text-neutral-400">{rotulo}</span>
      <span className="text-neutral-200 tabular-nums">{valor}</span>
    </span>
  );
}
