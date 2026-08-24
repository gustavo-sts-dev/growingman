"use client";

import { useResource } from "@/lib/use-resource";
import type { RevenueSeriesPoint } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { TrendingUp } from "lucide-react";

const WEEKDAY = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function dayLabel(isoDate: string): string {
  // isoDate = yyyy-MM-dd → rótulo curto do dia da semana (em horário local seguro).
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return WEEKDAY[date.getDay()];
}

/**
 * Gráfico de barras (CSS puro, sem libs) do faturamento dos últimos 7 dias.
 * Responsivo: ocupa a largura do contêiner e as barras se ajustam.
 */
export function RevenueChart() {
  const { data, loading } = useResource<RevenueSeriesPoint[]>(
    "/dashboard/revenue-series",
    []
  );
  const series = data ?? [];

  const maxRevenue = Math.max(1, ...series.map((p) => p.revenue));
  const totalRevenue = series.reduce((s, p) => s + p.revenue, 0);
  const totalBookings = series.reduce((s, p) => s + p.bookings, 0);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/[0.06] flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm">Últimos 7 dias</h2>
            <p className="text-xs text-neutral-500">Faturamento e agendamentos</p>
          </div>
        </div>
        <div className="flex gap-5 sm:gap-5">
          <div>
            <p className="text-[11px] text-neutral-500 uppercase tracking-wider">Receita</p>
            <p className="text-lg font-black text-white">{formatCurrency(totalRevenue)}</p>
          </div>
          <div>
            <p className="text-[11px] text-neutral-500 uppercase tracking-wider">Agend.</p>
            <p className="text-lg font-black text-white">{totalBookings}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-40 flex items-end gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 bg-white/[0.04] rounded-t-lg animate-pulse" style={{ height: `${30 + (i % 4) * 20}%` }} />
          ))}
        </div>
      ) : (
        <div className="flex items-end gap-2 sm:gap-3">
          {series.map((p) => {
            // Altura em px relativa a um trilho de 160px (h-40) — evita o problema
            // de height:% dentro de containers flex sem altura explícita.
            const heightPx = Math.round((p.revenue / maxRevenue) * 160);
            return (
              <div key={p.date} className="flex-1 flex flex-col items-center gap-2 group">
                {/* Trilho de altura fixa; a barra cresce de baixo para cima. */}
                <div className="w-full h-40 flex items-end">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-emerald-500/30 to-emerald-400/60 group-hover:from-emerald-500/50 group-hover:to-emerald-400 transition-all relative"
                    style={{ height: `${p.revenue > 0 ? Math.max(heightPx, 6) : 2}px` }}
                    title={`${formatCurrency(p.revenue)} · ${p.bookings} agend.`}
                  >
                    {p.revenue > 0 && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {formatCurrency(p.revenue)}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-neutral-500 font-medium">{dayLabel(p.date)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
