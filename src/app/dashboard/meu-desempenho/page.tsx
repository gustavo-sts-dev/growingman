"use client";

import { useResource } from "@/lib/use-resource";
import { formatCurrency } from "@/lib/format";
import type { BarberStats } from "@/lib/types";
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  Ban,
  DollarSign,
  Wallet,
} from "lucide-react";

export default function MeuDesempenhoPage() {
  const { data, loading } = useResource<BarberStats>("/dashboard/my-stats", {
    totalBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    noShowBookings: 0,
    totalRevenue: 0,
    commissionRate: 0,
    estimatedCommission: 0,
  });

  const s = data;
  const isEmpty = !loading && (s?.totalBookings ?? 0) === 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-neutral-600 font-semibold mb-1.5">
          Minha Performance
        </p>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Meu Desempenho
        </h1>
        <p className="text-neutral-500 text-sm mt-1">
          Resumo dos seus atendimentos e comissões.
        </p>
      </div>

      {/* Cards de atendimentos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          growingman={<BarChart3 className="w-4 h-4 text-white" />}
          label="Agendamentos"
          value={s?.totalBookings ?? 0}
          loading={loading}
        />
        <StatCard
          growingman={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          label="Concluídos"
          value={s?.completedBookings ?? 0}
          loading={loading}
        />
        <StatCard
          growingman={<XCircle className="w-4 h-4 text-red-400" />}
          label="Cancelados"
          value={s?.cancelledBookings ?? 0}
          loading={loading}
        />
        <StatCard
          growingman={<Ban className="w-4 h-4 text-amber-400" />}
          label="Faltas"
          value={s?.noShowBookings ?? 0}
          loading={loading}
        />
      </div>

      {/* Financeiro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 text-neutral-400 mb-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold">Receita Gerada</span>
          </div>
          {loading ? (
            <div className="h-8 w-28 bg-white/[0.05] rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-black">
              {formatCurrency(s?.totalRevenue ?? 0)}
            </p>
          )}
          <p className="text-[11px] text-neutral-600 mt-1">
            Em atendimentos concluídos.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 text-neutral-400 mb-2">
            <Wallet className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold">Comissão Estimada</span>
          </div>
          {loading ? (
            <div className="h-8 w-28 bg-white/[0.05] rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-black text-emerald-400">
              {formatCurrency(s?.estimatedCommission ?? 0)}
            </p>
          )}
          <p className="text-[11px] text-neutral-600 mt-1">
            Taxa de {s?.commissionRate ?? 0}% sobre a receita.
          </p>
        </div>
      </div>

      {isEmpty && (
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4 text-neutral-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              Ainda sem atendimentos registrados
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Seus números aparecem aqui assim que os agendamentos concluídos
              começarem a entrar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  growingman,
  label,
  value,
  loading,
}: {
  growingman: React.ReactNode;
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center gap-2 text-neutral-400 mb-2">
        {growingman}
        <span className="text-xs font-semibold">{label}</span>
      </div>
      {loading ? (
        <div className="h-7 w-10 bg-white/[0.05] rounded animate-pulse" />
      ) : (
        <p className="text-2xl font-black">{value}</p>
      )}
    </div>
  );
}
