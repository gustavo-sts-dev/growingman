"use client";

import { useMemo, useState } from "react";
import { useResource } from "@/lib/use-resource";
import { apiPut } from "@/lib/api";
import { formatPhone, onlyDigits } from "@/lib/format";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
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
  Pencil,
  MessageCircle,
} from "lucide-react";

/**
 * Link de conversa no WhatsApp.
 *
 * Devolve `null` sem telefone — a alternativa seria um botão que abre o
 * WhatsApp em branco, e um botão que não faz o que promete é pior que um botão
 * ausente. O 55 só entra quando falta: número já salvo com DDI não vira 5555.
 */
function whatsappLink(phone: string | null): string | null {
  const d = onlyDigits(phone);
  if (d.length < 10) return null;
  const comDdi = d.length <= 11 ? `55${d}` : d;
  return `https://wa.me/${comDdi}`;
}

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
  const toast = useToast();
  const { data, loading, reload } = useResource<{ clients: Client[] }>(
    "/crm/clients",
    { clients: [] },
  );
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

  // ── Edição de cadastro ──────────────────────────────────
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [saving, setSaving] = useState(false);

  const openEdit = (client: Client) => {
    setEditing(client);
    setForm({
      name: client.name,
      phone: formatPhone(client.phone),
      email: client.email ?? "",
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (form.name.trim().length < 2) {
      toast.error("Informe o nome do cliente.");
      return;
    }
    const digits = onlyDigits(form.phone);
    // Vazio é permitido (apaga o telefone). Preenchido pela metade não é: um
    // número truncado some da busca do agendamento sem avisar ninguém.
    if (digits && digits.length < 10) {
      toast.error("Telefone incompleto. Deixe em branco ou complete o número.");
      return;
    }

    setSaving(true);
    try {
      await apiPut(`/crm/clients/${editing.id}`, {
        name: form.name.trim(),
        phone: digits,
        email: form.email.trim(),
      });
      toast.success("Cadastro atualizado.");
      setEditing(null);
      reload();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Não foi possível salvar.",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-neutral-600 font-semibold mb-1.5">
          CRM & Retenção
        </p>
        <h1 className="text-[1.75rem] font-black leading-tight tracking-tight sm:text-3xl">Clientes</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Gerencie seus clientes, fidelidade e retenção.
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
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
            type="search"
            placeholder="Buscar por nome ou telefone..."
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.02] pl-10 pr-4 text-sm text-white placeholder:text-neutral-600 focus:border-white/25 focus:outline-none lg:h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 lg:gap-3">
          {/* Filtros de status como trilho: quatro pílulas mais o par de
              ordenação não cabem numa linha de 390px sem quebrar a barra em
              duas alturas diferentes. */}
          <div className="rail min-w-0 flex-1 gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1 lg:flex-none lg:overflow-visible">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-all active:scale-95 lg:py-1.5 ${
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
              aria-label="Ordenar por"
              className="h-11 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-xs font-semibold text-neutral-300 focus:border-white/25 focus:outline-none lg:h-9 [&>option]:bg-zinc-900 [&>option]:text-white"
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
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-neutral-400 transition-all hover:border-white/20 hover:text-white active:scale-95 lg:h-9 lg:w-9"
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
          <>
          {/*
            Duas apresentações do mesmo dado.

            A tabela tem cinco colunas e 640px de largura mínima: no celular
            ela virava um bloco que só se lê arrastando de lado, com o nome do
            cliente saindo de vista justamente quando se olha a coluna de
            faltas. Num app, uma coleção desse tamanho é uma LISTA — cada
            cliente num cartão que cabe inteiro na tela.

            A tabela continua intacta a partir de `md`, onde comparar colunas é
            o que se quer fazer e há largura para isso.
          */}
          <div className="divide-y divide-white/[0.04] md:hidden">
            {visibleClients.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-5 py-12 text-center text-neutral-500">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04]">
                  <Users className="h-5 w-5 text-neutral-600" />
                </div>
                <p className="text-sm">
                  {search || statusFilter !== "all"
                    ? "Nenhum cliente encontrado com esses filtros."
                    : "Nenhum cliente cadastrado ainda."}
                </p>
              </div>
            ) : (
              visibleClients.map((client) => (
                <div key={client.id} className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-gradient-to-br from-zinc-700 to-zinc-800 text-sm font-black text-zinc-400">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">{client.name}</p>
                      <p className="truncate text-xs text-neutral-500">
                        {client.phone ? formatPhone(client.phone) : "sem telefone"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 font-semibold text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-amber-500" />
                      <span className="text-sm tabular-nums">{client.points}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <ClientActions client={client} onEdit={openEdit} full />
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 pl-13 text-xs text-neutral-500">
                    <RetentionBadge client={client} />
                    <span>
                      Última:{" "}
                      {client.last_visit
                        ? new Date(client.last_visit).toLocaleDateString("pt-BR")
                        : "nunca"}
                    </span>
                    {client.no_shows > 0 && (
                      <span className="font-semibold text-red-400">
                        {client.no_shows} falta{client.no_shows === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
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
                  <th className="px-5 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {visibleClients.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
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
                              {client.phone
                                ? formatPhone(client.phone)
                                : "sem telefone"}
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
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <ClientActions client={client} onEdit={openEdit} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Editar cliente"
        description="Corrige o cadastro. O histórico de visitas e a fidelidade não mudam."
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-neutral-400">Nome</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 text-sm focus:border-white/25 focus:outline-none"
              placeholder="Nome do cliente"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-neutral-400">
              Telefone <span className="text-neutral-600">(opcional)</span>
            </label>
            <input
              type="tel"
              inputMode="numeric"
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: formatPhone(e.target.value) })
              }
              className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 text-sm focus:border-white/25 focus:outline-none"
              placeholder="(00) 00000-0000"
            />
            {/*
              Trocar o telefone não é editar um rótulo: é ele que identifica o
              cliente ao agendar e que recebe o PIN de acesso. Dizer isso aqui
              custa uma linha e evita a descoberta pelo caminho ruim.
            */}
            <p className="mt-1.5 text-xs text-neutral-600">
              É por ele que o cliente é reconhecido ao agendar e recebe o código
              de acesso.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm text-neutral-400">
              E-mail <span className="text-neutral-600">(opcional)</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 text-sm focus:border-white/25 focus:outline-none"
              placeholder="cliente@email.com"
            />
          </div>

          <div className="flex flex-col-reverse gap-2.5 pt-2 sm:flex-row sm:gap-3">
            <Button
              onClick={() => setEditing(null)}
              variant="outline"
              className="h-12 flex-1 rounded-xl active:scale-[0.98] sm:h-10"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={saveEdit}
              className="h-12 flex-1 rounded-xl active:scale-[0.98] sm:h-10"
              disabled={saving}
            >
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ── Componentes auxiliares ─────────────────────────────── */

/**
 * Editar e falar no WhatsApp.
 *
 * `full` estica os botões: no cartão do celular eles ocupam a linha inteira
 * (alvo de toque grande), na tabela ficam compactos ao lado dos números.
 */
function ClientActions({
  client,
  onEdit,
  full = false,
}: {
  client: Client;
  onEdit: (c: Client) => void;
  full?: boolean;
}) {
  const wa = whatsappLink(client.phone);
  const base = full
    ? "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition-colors"
    : "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors";

  return (
    <>
      <button
        type="button"
        onClick={() => onEdit(client)}
        title="Editar cadastro"
        className={`${base} border-white/[0.08] text-neutral-400 hover:bg-white/[0.04] hover:text-white`}
      >
        <Pencil className="h-3.5 w-3.5" />
        {full && "Editar"}
      </button>

      {/*
        Sem telefone o botão não vira link: fica desabilitado e explica por quê.
        Esconder deixaria a linha diferente das outras sem motivo visível.
      */}
      {wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          title={`Falar com ${client.name} no WhatsApp`}
          className={`${base} border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400 hover:bg-emerald-500/15`}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {full && "WhatsApp"}
        </a>
      ) : (
        <span
          title="Cliente sem telefone cadastrado"
          className={`${base} cursor-not-allowed border-white/[0.04] text-neutral-700`}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {full && "Sem telefone"}
        </span>
      )}
    </>
  );
}

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
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 sm:p-4">
      <div className="mb-2 flex items-center gap-2 text-neutral-400">
        <span className="shrink-0">{growingman}</span>
        <span className="text-[0.7rem] font-semibold leading-tight sm:text-xs">{label}</span>
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
