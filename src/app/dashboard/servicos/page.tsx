"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { apiPost, apiPut, apiDelete } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import {
  formatCurrency,
  formatDuration,
  currencyInputValue,
  parseCurrencyInput,
} from "@/lib/format";
import { Plus, Edit2, Trash2, Clock, Scissors, EyeOff, Search, ArrowUp, ArrowDown } from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";

type StatusFilter = "all" | "active" | "inactive";
type SortKey = "name" | "price" | "duration";
type SortDir = "asc" | "desc";

interface Service {
  id: string;
  name: string;
  description: string | null;
  base_price: string | number;
  duration_minutes: number;
  category: string;
  image_url: string | null;
  is_active: boolean;
}

const CATEGORIES = [
  { value: "corte", label: "Corte" },
  { value: "barba", label: "Barba" },
  { value: "combo", label: "Combo" },
  { value: "tratamento", label: "Tratamento" },
  { value: "outros", label: "Outros" },
];

interface FormState {
  name: string;
  description: string;
  durationMinutes: number;
  basePrice: number;
  category: string;
  imageUrl: string | null;
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  durationMinutes: 30,
  basePrice: 0,
  category: "corte",
  imageUrl: null,
};

export default function ServicesPage() {
  const toast = useToast();
  const { data: services, loading, reload } = useResource<Service[]>("/services", []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filtros e ordenação (client-side)
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const all = useMemo(() => services ?? [], [services]);

  const list = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = all.filter((s) => {
      const matchesSearch = !term || s.name.toLowerCase().includes(term);
      const matchesCategory =
        categoryFilter === "all" || s.category?.toLowerCase() === categoryFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? s.is_active : !s.is_active);
      return matchesSearch && matchesCategory && matchesStatus;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "price":
          return (Number(a.base_price) - Number(b.base_price)) * dir;
        case "duration":
          return (a.duration_minutes - b.duration_minutes) * dir;
        default:
          return a.name.localeCompare(b.name) * dir;
      }
    });
  }, [all, search, categoryFilter, statusFilter, sortKey, sortDir]);

  const handleOpenModal = (svc?: Service) => {
    setErrors({});
    if (svc) {
      setEditingId(svc.id);
      setFormData({
        name: svc.name,
        description: svc.description || "",
        durationMinutes: svc.duration_minutes,
        basePrice: Number(svc.base_price),
        category: svc.category?.toLowerCase() || "outros",
        imageUrl: svc.image_url || null,
      });
    } else {
      setEditingId(null);
      setFormData(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (formData.name.trim().length < 3) next.name = "Nome deve ter ao menos 3 caracteres.";
    if (formData.durationMinutes < 5) next.duration = "Duração mínima de 5 minutos.";
    if (formData.basePrice < 0) next.price = "Preço inválido.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      duration: formData.durationMinutes,
      price: formData.basePrice,
      category: formData.category,
      imageUrl: formData.imageUrl,
    };
    try {
      if (editingId) {
        await apiPut(`/services/${editingId}`, payload);
        toast.success("Serviço atualizado com sucesso.");
      } else {
        await apiPost("/services", payload);
        toast.success("Serviço criado com sucesso.");
      }
      setIsModalOpen(false);
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar serviço.");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await apiDelete<{ deactivated?: boolean; message?: string }>(
        `/services/${deleteTarget.id}`
      ).catch(() => null);
      if (res?.deactivated) {
        toast.info(res.message || "Serviço desativado (possui histórico).");
      } else {
        toast.success("Serviço excluído com sucesso.");
      }
      setDeleteTarget(null);
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir serviço.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header — empilhado no celular; o botão vira alvo de largura inteira. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-600 font-semibold mb-1.5">Catálogo</p>
          <h1 className="text-[1.75rem] font-black leading-tight tracking-tight sm:text-3xl">Serviços</h1>
          <p className="text-neutral-500 text-sm mt-1">Gerencie os serviços oferecidos pela sua barbearia.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="h-11 w-full shrink-0 rounded-xl bg-white px-4 text-sm font-semibold text-black shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-transform hover:bg-zinc-100 active:scale-[0.98] sm:h-9 sm:w-auto">
          <Plus className="w-4 h-4 mr-1.5" /> Novo Serviço
        </Button>
      </div>

      {/* Toolbar: busca + categoria + status + ordenação */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="relative flex-1 lg:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            type="search"
            placeholder="Buscar serviço..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.02] pl-10 pr-4 text-sm text-white placeholder:text-neutral-600 focus:border-white/25 focus:outline-none lg:h-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filtrar por categoria"
            className="order-1 h-11 min-w-0 flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-xs font-semibold text-neutral-300 focus:border-white/25 focus:outline-none lg:h-9 lg:flex-none [&>option]:bg-zinc-900 [&>option]:text-white"
          >
            <option value="all">Todas categorias</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          {/* Estado e ordenação disputam a linha com a categoria; o trilho
              mantém tudo numa altura só em vez de quebrar a barra. */}
          <div className="rail order-3 w-full gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1 lg:order-2 lg:w-auto lg:overflow-visible">
            {([
              { key: "all", label: "Todos" },
              { key: "active", label: "Ativos" },
              { key: "inactive", label: "Inativos" },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-all active:scale-95 lg:flex-none lg:py-1.5 ${
                  statusFilter === f.key ? "bg-white text-black" : "text-neutral-500 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="order-2 ml-auto flex shrink-0 items-center gap-1.5 lg:order-3">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              aria-label="Ordenar por"
              className="h-11 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-xs font-semibold text-neutral-300 focus:border-white/25 focus:outline-none lg:h-9 [&>option]:bg-zinc-900 [&>option]:text-white"
            >
              <option value="name">Nome</option>
              <option value="price">Preço</option>
              <option value="duration">Duração</option>
            </select>
            <button
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-neutral-400 transition-all hover:border-white/20 hover:text-white active:scale-95 lg:h-9 lg:w-9"
              aria-label={sortDir === "asc" ? "Crescente" : "Decrescente"}
            >
              {sortDir === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="divide-y divide-white/[0.04]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-9 h-9 rounded-lg bg-white/[0.04]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-40 bg-white/[0.05] rounded" />
                  <div className="h-2.5 w-24 bg-white/[0.03] rounded" />
                </div>
                <div className="h-3.5 w-16 bg-white/[0.04] rounded" />
              </div>
            ))}
          </div>
        ) : all.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <Scissors className="w-5 h-5 text-neutral-600" />
            </div>
            <p className="text-neutral-500 text-sm">Nenhum serviço cadastrado ainda.</p>
            <Button onClick={() => handleOpenModal()} className="mt-4 h-9 px-4 rounded-xl text-sm bg-white text-black hover:bg-zinc-100">
              <Plus className="w-4 h-4 mr-1.5" /> Criar primeiro serviço
            </Button>
          </div>
        ) : list.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-neutral-500 text-sm">Nenhum serviço encontrado com esses filtros.</p>
          </div>
        ) : (
          <>
          {/*
            Cartões no celular, grade de colunas no desktop.

            A grade tem 560px de largura mínima: no telefone ela obrigava a
            arrastar de lado para ver preço e ações, com o nome do serviço
            saindo de vista no caminho. Cada serviço vira um cartão que cabe
            inteiro na tela, com duração e preço na mesma linha e as ações à
            direita — sem rolagem horizontal alguma.
          */}
          <div className="divide-y divide-white/[0.04] md:hidden">
            {list.map((svc) => (
              <div
                key={svc.id}
                className={`flex items-center gap-3 px-4 py-3.5 ${svc.is_active ? "" : "opacity-50"}`}
              >
                {svc.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={svc.image_url}
                    alt={svc.name}
                    className="h-11 w-11 shrink-0 rounded-lg border border-white/[0.08] object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]">
                    <Scissors className="h-4 w-4 text-neutral-600" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-white">{svc.name}</p>
                    {!svc.is_active && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded bg-white/[0.05] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                        <EyeOff className="h-3 w-3" /> Inativo
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className="font-bold text-white">{formatCurrency(svc.base_price)}</span>
                    <span className="text-neutral-700">·</span>
                    <span className="flex items-center gap-1 text-neutral-500">
                      <Clock className="h-3 w-3" />
                      {formatDuration(svc.duration_minutes)}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => handleOpenModal(svc)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-500 transition-all hover:bg-white/8 hover:text-white active:scale-95 active:bg-white/10"
                    aria-label={`Editar ${svc.name}`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(svc)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-500 transition-all hover:bg-red-500/10 hover:text-red-400 active:scale-95 active:bg-red-500/10"
                    aria-label={`Excluir ${svc.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <div className="min-w-[560px]">
            <div className="grid grid-cols-[1fr_120px_120px_88px] gap-4 px-5 py-3 bg-white/[0.02] border-b border-white/[0.06] text-xs font-semibold uppercase tracking-wider text-neutral-600">
              <span>Serviço</span>
              <span>Duração</span>
              <span>Preço Base</span>
              <span className="text-right">Ações</span>
            </div>
            {list.map((svc) => (
              <div
                key={svc.id}
                className={`grid grid-cols-[1fr_120px_120px_88px] gap-4 items-center px-5 py-4 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors last:border-0 ${
                  svc.is_active ? "" : "opacity-50"
                }`}
              >
                <div>
                  <div className="flex items-center gap-3">
                    {svc.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={svc.image_url}
                        alt={svc.name}
                        className="w-9 h-9 rounded-lg object-cover border border-white/[0.08] shrink-0"
                      />
                    ) : null}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white text-sm">{svc.name}</p>
                        {!svc.is_active && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-500 bg-white/[0.05] px-1.5 py-0.5 rounded">
                            <EyeOff className="w-3 h-3" /> Inativo
                          </span>
                        )}
                      </div>
                      {svc.description && (
                        <p className="text-neutral-600 text-xs mt-0.5 line-clamp-1">{svc.description}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-neutral-400">
                  <Clock className="w-3.5 h-3.5 text-neutral-600" />
                  {formatDuration(svc.duration_minutes)}
                </div>
                <div className="font-bold text-white text-sm">{formatCurrency(svc.base_price)}</div>
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => handleOpenModal(svc)} className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-neutral-500 hover:text-white transition-colors" aria-label="Editar">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(svc)} className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-neutral-500 hover:text-red-400 transition-colors" aria-label="Excluir">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            </div>
          </div>
          </>
        )}
      </div>

      {/* Modal de criar/editar */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Editar Serviço" : "Novo Serviço"}
      >
        <div className="space-y-4">
          {/* Upload de imagem */}
          <ImageUpload
            value={formData.imageUrl}
            onChange={(url) => setFormData({ ...formData, imageUrl: url })}
            folder="services"
            shape="square"
            size={96}
            label="Imagem do serviço"
            onError={(msg) => toast.error(msg)}
            placeholder={<Scissors className="w-6 h-6 text-neutral-600" />}
          />
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-10 px-3 bg-white/[0.02] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/25"
              placeholder="Ex: Corte Degradê"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Categoria</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full h-10 px-3 bg-white/[0.02] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/25 [&>option]:bg-zinc-900 [&>option]:text-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 bg-white/[0.02] border border-white/10 rounded-xl text-sm h-20 resize-none focus:outline-none focus:border-white/25"
              placeholder="Detalhes do serviço..."
            />
          </div>
          {/* Duração e preço são valores curtos: continuam lado a lado até
              no celular, onde meia largura ainda sobra para os dois. */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Duração (min)</label>
              <input
                type="number"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                className="w-full h-10 px-3 bg-white/[0.02] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/25"
              />
              {errors.duration && <p className="text-red-400 text-xs mt-1">{errors.duration}</p>}
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Preço Base (R$)</label>
              <input
                type="text"
                inputMode="numeric"
                value={currencyInputValue(formData.basePrice)}
                onChange={(e) => setFormData({ ...formData, basePrice: parseCurrencyInput(e.target.value) })}
                className="w-full h-10 px-3 bg-white/[0.02] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/25"
              />
              {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price}</p>}
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2.5 pt-4 sm:flex-row sm:gap-3">
            <Button onClick={() => setIsModalOpen(false)} variant="outline" className="h-12 flex-1 rounded-xl active:scale-[0.98] sm:h-10" disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="h-12 flex-1 rounded-xl bg-white text-black transition-transform hover:bg-neutral-200 active:scale-[0.98] sm:h-10">
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmação de exclusão */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir serviço"
        message={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Caso possua agendamentos, ele será apenas desativado.`}
        confirmLabel="Excluir"
        destructive
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
