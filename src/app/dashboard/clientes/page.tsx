"use client";

import { useMemo, useState } from "react";
import { useResource } from "@/lib/use-resource";
import type { Client } from "@/lib/types";
import {
  Users,
  Search,
  Star,
  Clock,
  AlertTriangle,
  UserPlus,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

/** Categoriza um cliente pelo tempo de ausência (mesma regra usada na tabela). */
type RetentionStatus = "new" | "active" | "absent";

function retentionStatus(client: Client): RetentionStatus {
  if (client.days_absent === null) return "new";
  if (client.days_absent > 30) return "absent";
  return "active";
}

type StatusFilter = "all" | RetentionStatus;
type SortKey = "name" | "points" | "last_visit" | "no_shows";
type SortDir = "asc" | "desc";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Ativos" },
  { key: "absent", label: "Ausentes" },
  { key: "new", label: "Novos" },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Nome" },
  { key: "points", label: "Fidelidade" },
  { key: "last_visit", label: "Última Visita" },
  { key: "no_shows", label: "Faltas" },
];

export default function ClientesPage() {
  const { data, loading } = useResource<{ clients: Client[] }>("/crm/clients", {
    clients: [],
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const clients = useMemo(() => data?.clients ?? [], [data]);

  // ── Cards de resumo (agregação client-side) ──────────────
  const summary = useMemo(() => {
    let active = 0;
    let absent = 0;
    let isNew = 0;
    let noShows = 0;
    for (const c of clients) {
      const status = retentionStatus(c);
      if (status === "active") active++;
      else if (status === "absent") absent++;
      else isNew++;
      noShows += c.no_shows ?? 0;
    }
    return { total: clients.length, active, absent, isNew, noShows };
  }, [clients]);

  // ── Filtro + ordenação (client-side) ─────────────────────
  const visibleClients = useMemo(() => {
    const term = search.toLowerCase();
    const filtered = clients.filter((c) => {
      const matchesSearch =
        c.name?.toLowerCase().includes(term) || c.phone?.includes(search);
      const matchesStatus =
        statusFilter === "all" || retentionStatus(c) === statusFilter;
      return matchesSearch && matchesStatus;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "points":
          return ((a.points ?? 0) - (b.points ?? 0)) * dir;
        case "no_shows":
          return ((a.no_shows ?? 0) - (b.no_shows ?? 0)) * dir;
        case "last_visit": {
          // Nunca visitou (null) vai para o fim independente da direção.
          const ta = a.last_visit ? new Date(a.last_visit).getTime() : null;
          const tb = b.last_visit ? new Date(b.last_visit).getTime() : null;
          if (ta === null && tb === null) return 0;
          if (ta === null) return 1;
          if (tb === null) return -1;
          return (ta - tb) * dir;
        }
        default:
          return 0;
      }
    });
  }, [clients, search, statusFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-neutral-600 font-semibold mb-1.5">
          CRM & Retenção
        </p>
        <h1 className="text-3xl font-black tracking-tight">Clientes</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Gerencie seus clientes, fidelidade e retenção.
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          growingman={<Users className="w-4 h-4 text-white" />}
          label="Total de Clientes"
          value={summary.total}
          loading={loading}
        />
        <SummaryCard
          growingman={<Clock className="w-4 h-4 text-emerald-400" />}
          label="Ativos"
          value={summary.active}
          loading={loading}
        />
        <SummaryCard
          growingman={<AlertTriangle className="w-4 h-4 text-red-400" />}
          label="Ausentes (+30d)"
          value={summary.absent}
          loading={loading}
        />
        <SummaryCard
          growingman={<UserPlus className="w-4 h-4 text-blue-400" />}
          label="Novos"
          value={summary.isNew}
          loading={loading}
        />
      </div>

      {/* Toolbar: busca + filtros de status + ordenação */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        {/* Busca */}
        <div className="relative flex-1 lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            className="w-full h-10 pl-10 pr-4 bg-white/[0.02] border border-white/10 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/25"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Filtros de status */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === f.key
                    ? "bg-white text-black"
                    : "text-neutral-500 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Ordenação */}
          <div className="flex items-center gap-1.5">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="h-9 px-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-xs font-semibold text-neutral-300 focus:outline-none focus:border-white/25 [&>option]:bg-zinc-900 [&>option]:text-white"
            >
              {SORT_OPTIONS.map((o) => (
                <option
                  key={o.key}
                  value={o.key}
                >
                  {o.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-neutral-400 hover:text-white hover:border-white/20 transition-colors"
              aria-label={sortDir === "asc" ? "Crescente" : "Decrescente"}
            >
              {sortDir === "asc" ? (
                <ArrowUp className="w-4 h-4" />
              ) : (
                <ArrowDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Contagem de resultados */}
      {!loading && (
        <p className="text-xs text-neutral-600">
          Exibindo {visibleClients.length} de {clients.length} cliente
          {clients.length === 1 ? "" : "s"}.
        </p>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="divide-y divide-white/[0.04]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-5 py-4 animate-pulse"
              >
                <div className="w-10 h-10 rounded-full bg-white/[0.04]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-40 bg-white/[0.05] rounded" />
                  <div className="h-2.5 w-24 bg-white/[0.03] rounded" />
                </div>
                <div className="h-3.5 w-16 bg-white/[0.04] rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[640px]">
              <thead className="text-xs uppercase bg-white/[0.02] border-b border-white/[0.06] text-neutral-500">
                <tr>
                  <SortableTh
                    label="Cliente"
                    active={sortKey === "name"}
                    dir={sortDir}
                    onClick={() => toggleSort("name")}
                  />
                  <SortableTh
                    label="Fidelidade"
                    active={sortKey === "points"}
                    dir={sortDir}
                    onClick={() => toggleSort("points")}
                  />
                  <SortableTh
                    label="Última Visita"
                    active={sortKey === "last_visit"}
                    dir={sortDir}
                    onClick={() => toggleSort("last_visit")}
                  />
                  <th className="px-5 py-3 font-semibold">
                    Status de Retenção
                  </th>
                  <SortableTh
                    label="Faltas (No-Show)"
                    active={sortKey === "no_shows"}
                    dir={sortDir}
                    onClick={() => toggleSort("no_shows")}
                    align="right"
                  />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {visibleClients.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-neutral-500"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                          <Users className="w-5 h-5 text-neutral-600" />
                        </div>
                        <p className="text-sm">
                          {search || statusFilter !== "all"
                            ? "Nenhum cliente encontrado com esses filtros."
                            : "Nenhum cliente cadastrado ainda."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleClients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border border-white/[0.08] flex items-center justify-center text-sm font-black text-zinc-400 shrink-0">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {client.name}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {client.phone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-amber-500 font-semibold">
                          <Star className="h-4 w-4 fill-amber-500" />
                          {client.points} pts
                        </div>
                      </td>
                      <td className="px-5 py-4 text-neutral-400">
                        {client.last_visit
                          ? new Date(client.last_visit).toLocaleDateString(
                              "pt-BR",
                            )
                          : "Nunca"}
                      </td>
                      <td className="px-5 py-4">
                        <RetentionBadge client={client} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span
                          className={
                            client.no_shows > 0
                              ? "text-red-400 font-semibold"
                              : "text-neutral-500"
                          }
                        >
                          {client.no_shows}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Componentes auxiliares ─────────────────────────────── */

function SummaryCard({
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
        <div className="h-7 w-12 bg-white/[0.05] rounded animate-pulse" />
      ) : (
        <p className="text-2xl font-black">{value}</p>
      )}
    </div>
  );
}

function SortableTh({
  label,
  active,
  dir,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-5 py-3 font-semibold ${align === "right" ? "text-right" : ""}`}
    >
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-1 uppercase transition-colors hover:text-white ${
          active ? "text-white" : ""
        } ${align === "right" ? "flex-row-reverse" : ""}`}
      >
        {label}
        {active &&
          (dir === "asc" ? (
            <ArrowUp className="w-3 h-3" />
          ) : (
            <ArrowDown className="w-3 h-3" />
          ))}
      </button>
    </th>
  );
}

function RetentionBadge({ client }: { client: Client }) {
  const status = retentionStatus(client);
  if (status === "new") {
    return <span className="text-neutral-500 text-xs">Novo Cliente</span>;
  }
  if (status === "absent") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-red-500/10 text-red-400">
        <AlertTriangle className="h-3.5 w-3.5" />
        Ausente há {client.days_absent} dias
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400">
      <Clock className="h-3.5 w-3.5" />
      Ativo ({client.days_absent} dias)
    </span>
  );
}
