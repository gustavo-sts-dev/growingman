"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import {
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Search,
  Users,
  UserCheck,
  Percent,
  BarChart3,
  Loader2,
} from "lucide-react";

import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/format";
import { ImageUpload } from "@/components/ui/ImageUpload";
import type {
  Barber,
  BarberStats,
  CreateBarberInput,
  UpdateBarberInput,
} from "@/lib/types";

type StatusFilter = "all" | "active" | "inactive";

export default function BarbersPage() {
  const toast = useToast();
  const {
    data,
    loading,
    reload: fetchBarbers,
  } = useResource<Barber[]>("/barbers", []);
  const barbers = useMemo(() => data ?? [], [data]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Modal de desempenho (stats)
  const [statsBarber, setStatsBarber] = useState<Barber | null>(null);
  const [stats, setStats] = useState<BarberStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const openStats = async (barber: Barber) => {
    setStatsBarber(barber);
    setStats(null);
    setStatsLoading(true);
    try {
      const data = await apiGet<BarberStats>(`/barbers/${barber.id}/stats`);
      setStats(data);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao carregar desempenho.",
      );
      setStatsBarber(null);
    } finally {
      setStatsLoading(false);
    }
  };

  // Cards de resumo (agregação client-side).
  const summary = useMemo(() => {
    const active = barbers.filter((b) => b.isActive).length;
    const rates = barbers
      .map((b) => Number(b.commissionPercentage))
      .filter((n) => !Number.isNaN(n) && n > 0);
    const avgCommission = rates.length
      ? Math.round(rates.reduce((s, n) => s + n, 0) / rates.length)
      : 0;
    return { total: barbers.length, active, avgCommission };
  }, [barbers]);

  // Filtro por busca + status (client-side).
  const visibleBarbers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return barbers.filter((b) => {
      const matchesSearch =
        !term ||
        b.name?.toLowerCase().includes(term) ||
        b.email?.toLowerCase().includes(term) ||
        b.phone?.includes(search);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? b.isActive : !b.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [barbers, search, statusFilter]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    commissionPercentage: 0,
    password: "",
    isActive: true,
    avatarUrl: null as string | null,
  });

  // Confirmação de exclusão
  const [deleteTarget, setDeleteTarget] = useState<Barber | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleOpenModal = (b?: Barber) => {
    if (b) {
      setEditingId(b.id);
      setFormData({
        name: b.name,
        email: b.email || "",
        phone: b.phone || "",
        commissionPercentage: b.commissionPercentage
          ? Number(b.commissionPercentage)
          : 0,
        password: "",
        isActive: b.isActive !== false,
        avatarUrl: b.avatarUrl || null,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        commissionPercentage: 0,
        password: "",
        isActive: true,
        avatarUrl: null,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (formData.name.trim().length < 2) {
      toast.error("Informe o nome completo do profissional.");
      return;
    }
    if (!editingId && !formData.password.trim()) {
      toast.error("Defina uma senha de acesso para o novo profissional.");
      return;
    }
    if (formData.password && formData.password.length < 12) {
      toast.error("A senha deve ter pelo menos 12 caracteres.");
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/barbers/${editingId}` : "/barbers";

      const payload: UpdateBarberInput = {
        fullName: formData.name,
        email: formData.email,
        phone: formData.phone,
        isActive: formData.isActive,
        avatarUrl: formData.avatarUrl,
      };

      if (
        formData.commissionPercentage !== undefined &&
        formData.commissionPercentage !== 0
      ) {
        payload.commissionPercentage = formData.commissionPercentage;
      }

      if (!editingId || formData.password) {
        payload.password = formData.password;
      }

      if (editingId) {
        await apiPut(url, payload);
      } else {
        await apiPost(url, payload as CreateBarberInput);
      }

      setIsModalOpen(false);
      toast.success(
        editingId ? "Profissional atualizado." : "Profissional criado.",
      );
      fetchBarbers();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Erro de rede ao salvar profissional",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDelete(`/barbers/${deleteTarget.id}`);
      toast.success("Profissional excluído.");
      setDeleteTarget(null);
      fetchBarbers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header — empilhado no celular: título e ação não disputam a mesma
          linha de 390px, e o botão vira alvo de largura inteira. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-600 font-semibold mb-1.5">
            Equipe
          </p>
          <h1 className="text-[1.75rem] font-black leading-tight tracking-tight sm:text-3xl">Profissionais</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Gerencie a equipe da sua barbearia.
          </p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="h-11 w-full shrink-0 rounded-xl bg-white px-4 text-sm font-semibold text-black shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-transform hover:bg-zinc-100 active:scale-[0.98] sm:h-9 sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Novo Profissional
        </Button>
      </div>

      {/* Cards de resumo — três números curtos numa linha só, apertados no
          celular e folgados a partir de `sm`. Empilhá-los custaria meia tela
          de rolagem para mostrar três inteiros. */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <SummaryCard
          growingman={<Users className="w-4 h-4 text-white" />}
          label="Total"
          value={String(summary.total)}
          loading={loading}
        />
        <SummaryCard
          growingman={<UserCheck className="w-4 h-4 text-emerald-400" />}
          label="Ativos"
          value={String(summary.active)}
          loading={loading}
        />
        <SummaryCard
          growingman={<Percent className="w-4 h-4 text-amber-400" />}
          label="Comissão média"
          value={`${summary.avgCommission}%`}
          loading={loading}
        />
      </div>

      {/* Toolbar: busca + filtro de status */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            type="search"
            placeholder="Buscar por nome, e-mail ou telefone..."
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.02] pl-10 pr-4 text-sm text-white placeholder:text-neutral-600 focus:border-white/25 focus:outline-none sm:h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="rail w-full gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1 sm:w-fit sm:overflow-visible">
          {(
            [
              { key: "all", label: "Todos" },
              { key: "active", label: "Ativos" },
              { key: "inactive", label: "Inativos" },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-all active:scale-95 sm:flex-none sm:py-1.5 ${
                statusFilter === f.key
                  ? "bg-white text-black"
                  : "text-neutral-500 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="py-20 text-center text-neutral-600 text-sm">
          Carregando profissionais...
        </div>
      ) : barbers.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-neutral-600 text-sm">
            Nenhum profissional cadastrado ainda.
          </p>
        </div>
      ) : visibleBarbers.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-neutral-600 text-sm">
            Nenhum profissional encontrado com esses filtros.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleBarbers.map((barber) => (
            <div
              key={barber.id}
              className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-200 hover:border-white/[0.1] hover:bg-white/[0.04] sm:p-5"
            >
              {/* Avatar + name */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/[0.08] shrink-0">
                  {barber.avatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={barber.avatarUrl}
                      alt={barber.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-xl font-black text-zinc-400">
                      {(barber.name?.charAt(0) ?? "?").toUpperCase()}
                    </div>
                  )}
                  {barber.isActive && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-[#080808]" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white text-sm truncate">
                    {barber.name || "Sem nome"}
                  </p>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    {barber.isActive ? "Ativo" : "Inativo"}
                    {barber.commissionPercentage
                      ? ` · ${barber.commissionPercentage}% comissão`
                      : ""}
                  </p>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-1.5 text-xs text-neutral-500 mb-4">
                {barber.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
                    <span className="truncate">{barber.email}</span>
                  </div>
                )}
                {barber.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
                    <span>{barber.phone}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-white/[0.05]">
                {/* Três ações num rodapé de cartão: com 32px de altura elas
                    ficavam abaixo do alvo mínimo do dedo, e as duas de ícone —
                    editar e excluir — encostadas uma na outra. Excluir não pode
                    estar a um erro de mira de distância. */}
                <button
                  onClick={() => openStats(barber)}
                  className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/[0.04] text-xs font-medium text-neutral-400 transition-all hover:bg-white/[0.08] hover:text-white active:scale-95 sm:h-8"
                >
                  <BarChart3 className="w-3.5 h-3.5" /> Desempenho
                </button>
                <button
                  onClick={() => handleOpenModal(barber)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04] text-neutral-400 transition-all hover:bg-white/[0.08] hover:text-white active:scale-95 sm:h-8 sm:w-8"
                  aria-label="Editar"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(barber)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-600 transition-all hover:bg-red-500/10 hover:text-red-400 active:scale-95 active:bg-red-500/10 sm:h-8 sm:w-8"
                  aria-label="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Editar Profissional" : "Novo Profissional"}
      >
        <div className="space-y-4">
          {/* Upload de avatar */}
          <ImageUpload
            value={formData.avatarUrl}
            onChange={(url) => setFormData({ ...formData, avatarUrl: url })}
            folder="barbers"
            shape="circle"
            size={96}
            label="Foto do profissional"
            onError={(msg) => toast.error(msg)}
            placeholder={
              <span className="text-2xl font-black text-zinc-500">
                {formData.name ? formData.name.charAt(0).toUpperCase() : "?"}
              </span>
            }
          />
          <div>
            <label className="block text-sm text-neutral-400 mb-1">
              Nome Completo
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full h-10 px-3 bg-white/[0.02] border border-white/10 rounded-xl text-sm"
              placeholder="Ex: João Silva"
            />
          </div>
          {/* E-mail e telefone empilham no celular: são campos de texto
             livre, e meia largura de 390px corta o valor enquanto se digita. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-neutral-400 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full h-10 px-3 bg-white/[0.02] border border-white/10 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full h-10 px-3 bg-white/[0.02] border border-white/10 rounded-xl text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-neutral-400 mb-1">
                Comissão (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={formData.commissionPercentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    commissionPercentage: Number(e.target.value),
                  })
                }
                className="w-full h-10 px-3 bg-white/[0.02] border border-white/10 rounded-xl text-sm"
              />
              <p className="mt-1.5 text-xs leading-5 text-neutral-500">
                Calculada sobre o valor bruto e registrada em Comissões &amp; Vales.
              </p>
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1">
                Senha (Login)
              </label>
              <input
                type="password"
                value={formData.password}
                minLength={12}
                autoComplete="new-password"
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder={
                  editingId
                    ? "(Deixe em branco para não alterar)"
                    : "Senha de acesso"
                }
                className="w-full h-10 px-3 bg-white/[0.02] border border-white/10 rounded-xl text-sm"
              />
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-y border-white/10">
            <div>
              <p className="text-sm font-medium text-white">
                Status do Profissional
              </p>
              <p className="text-xs text-neutral-500">
                Barbeiros inativos não aparecem no agendamento online.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, isActive: !formData.isActive })
              }
              role="switch"
              aria-checked={formData.isActive}
              aria-label="Profissional ativo"
              className={`flex h-7 w-12 shrink-0 items-center rounded-full px-1 transition-colors ${formData.isActive ? "bg-green-500" : "bg-neutral-600"}`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-white transition-transform ${formData.isActive ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>
          {/* Na folha do celular a ação principal fica embaixo, onde o
              polegar chega primeiro; no diálogo do desktop, à direita. */}
          <div className="flex flex-col-reverse gap-2.5 pt-4 sm:flex-row sm:gap-3">
            <Button
              onClick={() => setIsModalOpen(false)}
              variant="outline"
              className="h-12 flex-1 rounded-xl active:scale-[0.98] sm:h-10"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-12 flex-1 rounded-xl bg-white text-black transition-transform hover:bg-neutral-200 active:scale-[0.98] sm:h-10"
            >
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Desempenho */}
      <Modal
        open={!!statsBarber}
        onClose={() => setStatsBarber(null)}
        title={statsBarber ? `Desempenho · ${statsBarber.name}` : "Desempenho"}
      >
        {statsLoading || !stats ? (
          <div className="py-12 flex items-center justify-center text-neutral-500">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <StatBox
                label="Agendamentos"
                value={String(stats.totalBookings)}
              />
              <StatBox
                label="Concluídos"
                value={String(stats.completedBookings)}
                accent="text-emerald-400"
              />
              <StatBox
                label="Cancelados"
                value={String(stats.cancelledBookings)}
                accent="text-red-400"
              />
              <StatBox
                label="Faltas (no-show)"
                value={String(stats.noShowBookings)}
                accent="text-amber-400"
              />
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Receita gerada</span>
                <span className="font-bold text-white">
                  {formatCurrency(stats.totalRevenue)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Taxa de comissão</span>
                <span className="font-semibold text-neutral-300">
                  {stats.commissionRate}%
                </span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-white/[0.06]">
                <span className="text-neutral-400 font-semibold">
                  Comissão estimada
                </span>
                <span className="font-bold text-emerald-400">
                  {formatCurrency(stats.estimatedCommission)}
                </span>
              </div>
            </div>
            <p className="text-xs text-neutral-600">
              Considerando todo o histórico de atendimentos concluídos.
            </p>
          </div>
        )}
      </Modal>

      {/* Confirmação de exclusão */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir profissional"
        message={`Tem certeza que deseja excluir "${deleteTarget?.name ?? ""}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        destructive
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:p-4">
      <p className="mb-1 text-xs text-neutral-500">{label}</p>
      <p className={`text-xl font-black sm:text-2xl ${accent ?? "text-white"}`}>{value}</p>
    </div>
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
  value: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 sm:p-4">
      <div className="mb-2 flex items-center gap-1.5 text-neutral-400 sm:gap-2">
        <span className="shrink-0">{growingman}</span>
        <span className="text-[0.65rem] font-semibold leading-tight sm:text-xs">{label}</span>
      </div>
      {loading ? (
        <div className="h-7 w-12 bg-white/[0.05] rounded animate-pulse" />
      ) : (
        <p className="text-xl font-black sm:text-2xl">{value}</p>
      )}
    </div>
  );
}
