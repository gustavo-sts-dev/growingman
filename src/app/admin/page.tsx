"use client";

import { useEffect, useState } from "react";
import { Building2, Users, Scissors, CalendarCheck, Loader2 } from "lucide-react";
import { apiGet } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { BOOKING_STATUS_LABEL, normalizeBookingStatus } from "@/lib/types";
import type { AdminOverview, AdminTenantRow } from "@/lib/types";

export default function AdminPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [tenants, setTenants] = useState<AdminTenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let cancelado = false;

    Promise.all([
      apiGet<AdminOverview>("/admin/overview"),
      apiGet<AdminTenantRow[]>("/admin/tenants"),
    ])
      .then(([resumo, lista]) => {
        if (cancelado) return;
        setOverview(resumo);
        setTenants(Array.isArray(lista) ? lista : []);
      })
      .catch((e) => {
        if (!cancelado) {
          setErro(e instanceof Error ? e.message : "Falha ao carregar os dados.");
        }
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-600" />
      </div>
    );
  }

  if (erro || !overview) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-red-500/15 bg-red-500/[0.03] p-6 text-center">
        <p className="text-sm text-red-400">{erro || "Sem dados."}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-16">
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-600">
          Visão da plataforma
        </p>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
          Administração
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Números de todas as barbearias. Atualizado em{" "}
          {new Date(overview.generatedAt).toLocaleString("pt-BR")}.
        </p>
      </div>

      {/* Receita primeiro: é o número que responde "como o negócio está". */}
      <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-r from-white/[0.02] to-transparent p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Receita recorrente mensal
        </p>
        <p className="mt-2 text-4xl font-black tracking-tight tabular-nums">
          {formatCurrency(overview.revenue.monthlyRecurringRevenue)}
        </p>
        <p className="mt-1.5 text-sm text-neutral-500">
          {overview.revenue.billableTenants}{" "}
          {overview.revenue.billableTenants === 1
            ? "barbearia pagante"
            : "barbearias pagantes"}
          {overview.tenants.inTrial > 0 &&
            ` · ${overview.tenants.inTrial} ainda em cortesia`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          growingman={<Building2 className="h-4 w-4" />}
          label="Barbearias ativas"
          value={overview.tenants.active}
          hint={`${overview.tenants.total} no total · +${overview.tenants.newLast30Days} em 30 dias`}
        />
        <Metric
          growingman={<Scissors className="h-4 w-4" />}
          label="Profissionais"
          value={overview.barbers.active}
          hint="Ativos, somando todas"
        />
        <Metric
          growingman={<Users className="h-4 w-4" />}
          label="Clientes"
          value={overview.customers.total}
          hint="Cadastrados na plataforma"
        />
        <Metric
          growingman={<CalendarCheck className="h-4 w-4" />}
          label="Agendamentos"
          value={overview.bookings.total}
          hint={`${overview.bookings.last30Days} nos últimos 30 dias`}
        />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Agendamentos por situação</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(overview.bookings.byStatus).map(([status, total]) => (
            <span
              key={status}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm"
            >
              <span className="text-neutral-500">
                {/* A API devolve o status do banco (CONFIRMED...); o rótulo em
                    português já existe no front, reaproveitado aqui. */}
                {BOOKING_STATUS_LABEL[normalizeBookingStatus(status)]}
              </span>{" "}
              <span className="font-bold tabular-nums">{total}</span>
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Barbearias</h2>
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead className="border-b border-white/[0.06] bg-white/[0.02] text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Barbearia</th>
                  <th className="px-5 py-3 font-semibold text-right">Profissionais</th>
                  <th className="px-5 py-3 font-semibold text-right">Clientes</th>
                  <th className="px-5 py-3 font-semibold text-right">Agendamentos</th>
                  <th className="px-5 py-3 font-semibold text-right">Mensalidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {tenants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-neutral-600">
                      Nenhuma barbearia cadastrada ainda.
                    </td>
                  </tr>
                ) : (
                  tenants.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3">
                        <span className="font-medium text-white">{t.name}</span>
                        <span className="ml-2 text-xs text-neutral-600">/{t.slug}</span>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {!t.isActive && <Tag tone="off">Inativa</Tag>}
                          {t.inTrial && <Tag tone="trial">Cortesia</Tag>}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">{t.activeBarbers}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{t.customers}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{t.bookings}</td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`font-semibold tabular-nums ${
                            t.billedNow ? "text-green-400" : "text-neutral-600"
                          }`}
                        >
                          {formatCurrency(t.monthlyPrice)}
                        </span>
                        {/* Em cortesia a mensalidade é calculada mas não cobrada —
                            mostrar o valor apagado deixa isso explícito. */}
                        {!t.billedNow && (
                          <span className="ml-1.5 text-xs text-neutral-600">
                            não cobrada
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({
  growingman,
  label,
  value,
  hint,
}: {
  growingman: React.ReactNode;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-center gap-2 text-neutral-500">
        {growingman}
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-2 text-3xl font-black tabular-nums">{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-neutral-600">{hint}</p>
    </div>
  );
}

function Tag({ tone, children }: { tone: "off" | "trial"; children: React.ReactNode }) {
  const cor =
    tone === "off"
      ? "bg-red-500/10 text-red-400"
      : "bg-amber-500/10 text-amber-400";
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${cor}`}>
      {children}
    </span>
  );
}
