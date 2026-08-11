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
    asaasWalletId: "",
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
        asaasWalletId: b.asaasWalletId || "",
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
        asaasWalletId: "",
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

      if (formData.asaasWalletId) {
        payload.asaasWalletId = formData.asaasWalletId;
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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-600 font-semibold mb-1.5">
            Equipe
          </p>
          <h1 className="text-3xl font-black tracking-tight">Profissionais</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Gerencie a equipe da sua barbearia.
          </p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="h-9 px-4 rounded-xl text-sm font-semibold bg-white text-black hover:bg-zinc-100 shadow-[0_0_20px_rgba(255,255,255,0.15)] shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Novo Profissional
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-4">
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
            type="text"
            placeholder="Buscar por nome, e-mail ou telefone..."
            className="w-full h-10 pl-10 pr-4 bg-white/[0.02] border border-white/10 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/25"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
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
              className="group p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-200"
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
                <button
                  onClick={() => openStats(barber)}
                  className="flex-1 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  <BarChart3 className="w-3.5 h-3.5" /> Desempenho
                </button>
                <button
                  onClick={() => handleOpenModal(barber)}
                  className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                  aria-label="Editar"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(barber)}
                  className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-neutral-600 hover:text-red-400 transition-colors"
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
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-1">
                Comissão (%)
              </label>
              <input
                type="number"
                value={formData.commissionPercentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    commissionPercentage: Number(e.target.value),
                  })
                }
                className="w-full h-10 px-3 bg-white/[0.02] border border-white/10 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1">
                Senha (Login)
              </label>
              <input
                type="password"
                value={formData.password}
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
          <div>
            <label className="block text-sm text-neutral-400 mb-1">
              Asaas Wallet ID (Split Automático)
            </label>
            <input
              type="text"
              value={formData.asaasWalletId}
              onChange={(e) =>
                setFormData({ ...formData, asaasWalletId: e.target.value })
              }
              placeholder="Ex: wal_XXXXXXXXXXXX"
              className="w-full h-10 px-3 bg-white/[0.02] border border-white/10 rounded-xl text-sm"
            />
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
              className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${formData.isActive ? "bg-green-500" : "bg-neutral-600"}`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${formData.isActive ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => setIsModalOpen(false)}
              variant="outline"
              className="flex-1 rounded-xl"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-xl bg-white text-black hover:bg-neutral-200"
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
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="text-xs text-neutral-500 mb-1">{label}</p>
      <p className={`text-2xl font-black ${accent ?? "text-white"}`}>{value}</p>
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
