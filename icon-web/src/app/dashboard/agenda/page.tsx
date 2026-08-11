"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import { formatCurrency, onlyDigits } from "@/lib/format";
import {
  type BookingStatus,
  normalizeBookingStatus,
  BOOKING_STATUS_LABEL,
} from "@/lib/types";
import {
  Calendar,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Check,
  X,
  CheckCheck,
  Ban,
} from "lucide-react";

interface Barber {
  id: string;
  name: string;
  isActive: boolean;
}

interface Service {
  id: string;
  name: string;
  base_price: string | number;
  duration_minutes: number;
}

interface Client {
  id: string;
  name: string;
  phone: string;
}

/** Shape do agendamento retornado por GET /bookings (aninhado, específico desta tela). */
interface AgendaBooking {
  id: string;
  start_time: string;
  status: string;
  client: { name: string };
  items: Array<{
    catalog_item: { name: string };
    barber_profile: { id: string; user: { id: string } };
  }>;
  // Um Payment APPROVED = corte já pago online (PIX no agendamento).
  payments?: Array<{ status: string }>;
}

type PaymentMethod = "CASH" | "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "OTHER";

const PAYMENT_METHODS: Array<{ key: PaymentMethod; label: string }> = [
  { key: "CASH", label: "Dinheiro" },
  { key: "PIX", label: "PIX" },
  { key: "DEBIT_CARD", label: "Débito" },
  { key: "CREDIT_CARD", label: "Crédito" },
];

const isPaidOnline = (b: AgendaBooking) =>
  (b.payments ?? []).some((p) => p.status === "APPROVED");

const TIME_SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
];

type ViewMode = "grid" | "list";
type StatusFilter = "all" | BookingStatus;

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Pendentes" },
  { key: "confirmed", label: "Confirmados" },
  { key: "completed", label: "Concluídos" },
  { key: "cancelled", label: "Cancelados" },
  { key: "no-show", label: "Faltas" },
];

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  "no-show": "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
};

/**
 * Extrai HH:MM no fuso da barbearia (BR) de um ISO timestamp.
 *
 * Antes lia getUTCHours(): um corte das 17:30 BR está gravado como 20:30Z, então
 * o slot virava "20:30" e nunca casava com a linha "17:30" da grade — o
 * agendamento sumia da agenda e o horário aparecia como "Bloqueado".
 * Fuso fixo (não o do navegador): a grade e a disponibilidade do backend também
 * são calculadas no fuso da barbearia, e os três precisam concordar.
 */
const SLOT_TIME_FMT = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function slotOf(iso: string): string {
  return SLOT_TIME_FMT.format(new Date(iso));
}

export default function AgendaPage() {
  const toast = useToast();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [bookings, setBookings] = useState<AgendaBooking[]>([]);
  const [availability, setAvailability] = useState<Record<string, string[]>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  // Visualização e filtros
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [barberFilter, setBarberFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Modal de criação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBooking, setNewBooking] = useState({
    barberId: "",
    clientId: "",
    serviceIds: [] as string[],
    time: "",
    clientName: "",
    clientPhone: "",
  });
  const [saving, setSaving] = useState(false);

  // Modal de detalhe/ação de status
  const [detailBooking, setDetailBooking] = useState<AgendaBooking | null>(
    null,
  );
  const [statusSaving, setStatusSaving] = useState(false);

  // Checkout: concluir um atendimento exige informar como o cliente pagou — é o
  // que lança a receita no caixa e registra a comissão do barbeiro. Corte já pago
  // online (PIX no agendamento) dispensa: o webhook já lançou a receita.
  const [checkoutBooking, setCheckoutBooking] = useState<AgendaBooking | null>(
    null,
  );
  const [checkoutSaving, setCheckoutSaving] = useState(false);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [me, barbersData, servicesData, clientsData] = await Promise.all([
        apiGet<{ id: string; role: string }>("/auth/me").catch(() => null),
        apiGet<Barber[]>("/barbers").catch(() => []),
        apiGet<Service[]>("/services").catch(() => []),
        apiGet<{ clients: Client[] }>("/crm/clients").catch(() => ({
          clients: [],
        })),
      ]);

      setRole(me?.role ?? null);

      let activeBarbers = Array.isArray(barbersData)
        ? barbersData.filter((b) => b.isActive)
        : [];

      // Barbeiro só enxerga a própria coluna na agenda.
      if (me?.role === "BARBER") {
        activeBarbers = activeBarbers.filter((b) => b.id === me.id);
      }

      setBarbers(activeBarbers);
      setServices(Array.isArray(servicesData) ? servicesData : []);
      setClients(clientsData?.clients ?? []);
    } catch {
      toast.error("Erro ao carregar dados iniciais.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchBookings = useCallback(async () => {
    try {
      const data = await apiGet<AgendaBooking[]>(
        `/bookings?date=${selectedDate}`,
      );
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      setBookings([]);
    }
  }, [selectedDate]);

  const fetchAvailability = useCallback(async () => {
    const avail: Record<string, string[]> = {};
    await Promise.all(
      barbers.map(async (barber) => {
        try {
          const data = await apiGet<{ availableSlots: string[] }>(
            `/bookings/availability?barberId=${barber.id}&date=${selectedDate}&serviceId=any`,
          );
          avail[barber.id] = data.availableSlots || [];
        } catch {
          avail[barber.id] = [];
        }
      }),
    );
    setAvailability(avail);
  }, [barbers, selectedDate]);

  // Busca inicial e refetch ao trocar de data são sincronizações legítimas com a
  // API externa (caso de uso válido de effect). O setLoading síncrono dispara a
  // regra do lint, que desabilitamos pontualmente aqui.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (selectedDate && barbers.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchBookings();
      void fetchAvailability();
    }
  }, [selectedDate, barbers.length, fetchBookings, fetchAvailability]);

  // Barbeiros visíveis conforme o filtro
  const visibleBarbers = useMemo(
    () =>
      barberFilter === "all"
        ? barbers
        : barbers.filter((b) => b.id === barberFilter),
    [barbers, barberFilter],
  );

  const handleCreateBooking = async () => {
    if (
      !newBooking.barberId ||
      !newBooking.time ||
      newBooking.serviceIds.length === 0
    ) {
      toast.error("Preencha barbeiro, horário e ao menos um serviço.");
      return;
    }
    if (
      !newBooking.clientId &&
      (!newBooking.clientName || !newBooking.clientPhone)
    ) {
      toast.error("Selecione um cliente ou preencha nome e telefone.");
      return;
    }

    setSaving(true);
    try {
      // Backend aceita 1 serviço por vez (serviceId singular).
      // Cliente já cadastrado → manda clientId. Antes enviávamos nome/telefone
      // VAZIOS e o id escondido em `notes`, o que o backend rejeitava ("Too small").
      const payload = {
        barberId: newBooking.barberId,
        serviceId: newBooking.serviceIds[0],
        date: selectedDate,
        time: newBooking.time,
        ...(newBooking.clientId
          ? { clientId: newBooking.clientId }
          : {
              customerName: newBooking.clientName,
              customerPhone: onlyDigits(newBooking.clientPhone),
            }),
      };

      await apiPost("/bookings", payload);
      toast.success("Agendamento criado com sucesso!");
      setIsModalOpen(false);
      setNewBooking({
        barberId: "",
        clientId: "",
        serviceIds: [],
        time: "",
        clientName: "",
        clientPhone: "",
      });
      void fetchBookings();
      void fetchAvailability();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Erro ao criar agendamento.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (
    booking: AgendaBooking,
    status: BookingStatus,
  ) => {
    setStatusSaving(true);
    try {
      // O backend espera o status em minúsculo (schema Zod).
      await apiPatch(`/bookings/${booking.id}/status`, { status });
      toast.success(
        `Agendamento marcado como "${BOOKING_STATUS_LABEL[status]}".`,
      );
      setDetailBooking(null);
      void fetchBookings();
      void fetchAvailability();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar status.");
    } finally {
      setStatusSaving(false);
    }
  };

  /**
   * Finaliza o atendimento de verdade: COMPLETED + comissão no ledger + fidelidade
   * + receita no caixa. Antes, "Concluir" chamava PATCH /status e pulava tudo isso.
   * `paymentMethod` é omitido quando o corte já foi pago online.
   */
  const handleCheckout = async (
    booking: AgendaBooking,
    paymentMethod?: PaymentMethod,
  ) => {
    setCheckoutSaving(true);
    try {
      await apiPost(
        `/bookings/${booking.id}/checkout`,
        paymentMethod ? { paymentMethod } : {},
      );
      toast.success("Atendimento finalizado e receita lançada no caixa.");
      setCheckoutBooking(null);
      setDetailBooking(null);
      void fetchBookings();
      void fetchAvailability();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Erro ao finalizar atendimento.",
      );
    } finally {
      setCheckoutSaving(false);
    }
  };

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const bookingMatchesBarber = useCallback(
    (b: AgendaBooking, barberId: string) =>
      b.items.some((item) => item.barber_profile?.user?.id === barberId),
    [],
  );

  const getBookingAtSlot = (barberId: string, time: string) =>
    bookings.find(
      (b) => slotOf(b.start_time) === time && bookingMatchesBarber(b, barberId),
    );

  const isSlotAvailable = (barberId: string, time: string) =>
    availability[barberId]?.includes(time) ?? false;

  // Lista cronológica filtrada (para a visão lista)
  const listBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        const matchesStatus =
          statusFilter === "all" ||
          normalizeBookingStatus(b.status) === statusFilter;
        const matchesBarber =
          barberFilter === "all" || bookingMatchesBarber(b, barberFilter);
        return matchesStatus && matchesBarber;
      })
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [bookings, statusFilter, barberFilter, bookingMatchesBarber]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-600 font-semibold mb-1.5">
            Gestão de Horários
          </p>
          <h1 className="text-3xl font-black tracking-tight">Agenda</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Visualize e gerencie os agendamentos por barbeiro e horário.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="h-9 px-4 rounded-xl text-sm font-semibold bg-white text-black hover:bg-zinc-100 shrink-0"
        >
          <Calendar className="w-4 h-4 mr-1.5" /> Novo Agendamento
        </Button>
      </div>

      {/* Toolbar: data + visão + filtros */}
      <div className="space-y-3">
        {/* Date Selector */}
        <div className="flex items-center justify-center gap-4 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <button
            onClick={() => changeDate(-1)}
            className="w-8 h-8 rounded-lg hover:bg-white/[0.08] flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
            aria-label="Dia anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neutral-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-lg font-bold text-white focus:outline-none"
            />
          </div>
          <button
            onClick={() => changeDate(1)}
            className="w-8 h-8 rounded-lg hover:bg-white/[0.08] flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
            aria-label="Próximo dia"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Filtro barbeiro (oculto para o próprio barbeiro, que só vê a si) */}
            {role !== "BARBER" && (
              <select
                value={barberFilter}
                onChange={(e) => setBarberFilter(e.target.value)}
                className="h-9 px-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-xs font-semibold text-neutral-300 focus:outline-none focus:border-white/25 [&>option]:bg-zinc-900 [&>option]:text-white"
              >
                <option value="all">Todos os barbeiros</option>
                {barbers.map((b) => (
                  <option
                    key={b.id}
                    value={b.id}
                  >
                    {b.name}
                  </option>
                ))}
              </select>
            )}

            {/* Filtro status */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] flex-wrap">
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
          </div>

          {/* Toggle de visão */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "grid"
                  ? "bg-white text-black"
                  : "text-neutral-500 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Grade
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "list"
                  ? "bg-white text-black"
                  : "text-neutral-500 hover:text-white"
              }`}
            >
              <List className="w-3.5 h-3.5" /> Lista
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="py-20 text-center text-neutral-500">
          Carregando agenda...
        </div>
      ) : visibleBarbers.length === 0 ? (
        <div className="py-20 text-center text-neutral-500">
          {barberFilter === "all"
            ? "Nenhum barbeiro ativo cadastrado."
            : "Nenhum barbeiro corresponde ao filtro."}
        </div>
      ) : viewMode === "grid" ? (
        /* ── VISÃO GRADE ────────────────────────────────────── */
        <div className="isolate rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="overflow-x-auto overscroll-x-contain">
            <table
              className="w-full table-fixed text-sm"
              style={{ minWidth: 96 + visibleBarbers.length * 180 }}
            >
              <colgroup>
                <col className="w-24" />
                {visibleBarbers.map((barber) => (
                  <col
                    key={barber.id}
                    className="w-[180px]"
                  />
                ))}
              </colgroup>
              <thead className="bg-white/[0.02] border-b border-white/[0.06]">
                <tr>
                  <th className="sticky left-0 z-10 w-24 border-r border-white/[0.06] bg-[#080808] px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500 whitespace-nowrap">
                    Horário
                  </th>
                  {visibleBarbers.map((barber) => (
                    <th
                      key={barber.id}
                      className="px-4 py-3 text-center text-xs font-semibold uppercase text-neutral-500 min-w-[180px]"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <User className="w-3.5 h-3.5" />
                        {barber.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {TIME_SLOTS.map((time) => (
                  <tr
                    key={time}
                    className="hover:bg-white/[0.01]"
                  >
                    <td className="sticky left-0 z-10 w-24 border-r border-white/[0.06] bg-[#080808] px-4 py-2 font-semibold text-neutral-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-neutral-600" />
                        {time}
                      </div>
                    </td>
                    {visibleBarbers.map((barber) => {
                      const booking = getBookingAtSlot(barber.id, time);
                      const available = isSlotAvailable(barber.id, time);

                      if (booking) {
                        const status = normalizeBookingStatus(booking.status);
                        // Esmaece se não casar com o filtro de status ativo.
                        const dimmed =
                          statusFilter !== "all" && status !== statusFilter;
                        return (
                          <td
                            key={barber.id}
                            className="px-2 py-2"
                          >
                            <button
                              onClick={() => setDetailBooking(booking)}
                              className={`w-full text-left p-2 rounded-lg border transition-opacity ${STATUS_STYLE[status]} ${
                                dimmed ? "opacity-30" : "hover:opacity-80"
                              }`}
                            >
                              <p className="text-xs font-semibold truncate">
                                {booking.client.name}
                              </p>
                              <p className="text-[10px] text-neutral-500 truncate">
                                {booking.items
                                  .map((i) => i.catalog_item.name)
                                  .join(", ")}
                              </p>
                              <p className="text-[9px] uppercase tracking-wide mt-0.5 opacity-80">
                                {BOOKING_STATUS_LABEL[status]}
                              </p>
                            </button>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={barber.id}
                          className="px-2 py-2"
                        >
                          {available ? (
                            <button
                              onClick={() => {
                                setNewBooking({
                                  ...newBooking,
                                  barberId: barber.id,
                                  time,
                                });
                                setIsModalOpen(true);
                              }}
                              className="w-full p-2 rounded-lg border border-dashed border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors text-xs text-neutral-600 hover:text-emerald-400"
                            >
                              Disponível
                            </button>
                          ) : (
                            <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                              <p className="text-xs text-neutral-700 text-center">
                                Bloqueado
                              </p>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── VISÃO LISTA ────────────────────────────────────── */
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
          {listBookings.length === 0 ? (
            <div className="py-16 text-center text-neutral-500 text-sm">
              Nenhum agendamento para os filtros selecionados.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {listBookings.map((b) => {
                const status = normalizeBookingStatus(b.status);
                return (
                  <button
                    key={b.id}
                    onClick={() => setDetailBooking(b)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-neutral-300 shrink-0 w-16">
                      <Clock className="w-3.5 h-3.5 text-neutral-600" />
                      {slotOf(b.start_time)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">
                        {b.client.name}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        {b.items.map((i) => i.catalog_item.name).join(", ")}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-md text-[10px] font-bold border shrink-0 ${STATUS_STYLE[status]}`}
                    >
                      {BOOKING_STATUS_LABEL[status]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Novo Agendamento */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Novo Agendamento"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-400 mb-1">
              Barbeiro
            </label>
            <select
              value={newBooking.barberId}
              onChange={(e) =>
                setNewBooking({ ...newBooking, barberId: e.target.value })
              }
              className="w-full h-10 px-3 bg-white/[0.02] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/25 [&>option]:bg-zinc-900 [&>option]:text-white"
            >
              <option value="">Selecione...</option>
              {barbers.map((b) => (
                <option
                  key={b.id}
                  value={b.id}
                >
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-1">
              Horário
            </label>
            <input
              type="time"
              value={newBooking.time}
              onChange={(e) =>
                setNewBooking({ ...newBooking, time: e.target.value })
              }
              className="w-full h-10 px-3 bg-white/[0.02] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/25"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-1">
              Cliente
            </label>
            <select
              value={newBooking.clientId}
              onChange={(e) =>
                setNewBooking({ ...newBooking, clientId: e.target.value })
              }
              className="w-full h-10 px-3 bg-white/[0.02] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/25 [&>option]:bg-zinc-900 [&>option]:text-white"
            >
              <option value="">Novo cliente (preencha abaixo)</option>
              {clients.map((c) => (
                <option
                  key={c.id}
                  value={c.id}
                >
                  {c.name} - {c.phone}
                </option>
              ))}
            </select>
          </div>

          {!newBooking.clientId && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={newBooking.clientName}
                  onChange={(e) =>
                    setNewBooking({ ...newBooking, clientName: e.target.value })
                  }
                  className="w-full h-10 px-3 bg-white/[0.02] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/25"
                  placeholder="Nome do cliente"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  value={newBooking.clientPhone}
                  onChange={(e) =>
                    setNewBooking({
                      ...newBooking,
                      clientPhone: e.target.value,
                    })
                  }
                  className="w-full h-10 px-3 bg-white/[0.02] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/25"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-neutral-400 mb-1">
              Serviços
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {services.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.02] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={newBooking.serviceIds.includes(s.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewBooking({
                          ...newBooking,
                          serviceIds: [...newBooking.serviceIds, s.id],
                        });
                      } else {
                        setNewBooking({
                          ...newBooking,
                          serviceIds: newBooking.serviceIds.filter(
                            (id) => id !== s.id,
                          ),
                        });
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm text-white">{s.name}</span>
                    <span className="text-xs text-neutral-500">
                      {formatCurrency(s.base_price)} · {s.duration_minutes}min
                    </span>
                  </div>
                </label>
              ))}
            </div>
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
              onClick={handleCreateBooking}
              disabled={saving}
              className="flex-1 rounded-xl bg-white text-black hover:bg-neutral-200"
            >
              {saving ? "Criando..." : "Criar Agendamento"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Detalhe + Ações de status */}
      <Modal
        open={!!detailBooking}
        onClose={() => setDetailBooking(null)}
        title="Detalhes do Agendamento"
      >
        {detailBooking && (
          <div className="space-y-4">
            <div className="space-y-2">
              <DetailRow
                label="Cliente"
                value={detailBooking.client.name}
              />
              <DetailRow
                label="Horário"
                value={slotOf(detailBooking.start_time)}
              />
              <DetailRow
                label="Serviços"
                value={detailBooking.items
                  .map((i) => i.catalog_item.name)
                  .join(", ")}
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Status atual</span>
                <span
                  className={`px-2 py-1 rounded-md text-[10px] font-bold border ${
                    STATUS_STYLE[normalizeBookingStatus(detailBooking.status)]
                  }`}
                >
                  {
                    BOOKING_STATUS_LABEL[
                      normalizeBookingStatus(detailBooking.status)
                    ]
                  }
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.06]">
              <p className="text-xs font-semibold text-neutral-500 uppercase mb-3">
                Alterar status
              </p>
              <div className="grid grid-cols-2 gap-2">
                <StatusButton
                  growingman={<Check className="w-4 h-4" />}
                  label="Confirmar"
                  className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                  disabled={statusSaving}
                  onClick={() => handleUpdateStatus(detailBooking, "confirmed")}
                />
                {/* Concluir passa pelo checkout: é lá que a receita entra no caixa
                    e a comissão do barbeiro é registrada. */}
                <StatusButton
                  growingman={<CheckCheck className="w-4 h-4" />}
                  label="Concluir"
                  className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                  disabled={statusSaving}
                  onClick={() => setCheckoutBooking(detailBooking)}
                />
                <StatusButton
                  growingman={<Ban className="w-4 h-4" />}
                  label="Não compareceu"
                  className="bg-neutral-500/10 text-neutral-300 hover:bg-neutral-500/20"
                  disabled={statusSaving}
                  onClick={() => handleUpdateStatus(detailBooking, "no-show")}
                />
                <StatusButton
                  growingman={<X className="w-4 h-4" />}
                  label="Cancelar"
                  className="bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  disabled={statusSaving}
                  onClick={() => handleUpdateStatus(detailBooking, "cancelled")}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Checkout — fecha o atendimento lançando receita e comissão. */}
      <Modal
        open={!!checkoutBooking}
        onClose={() => setCheckoutBooking(null)}
        title="Finalizar atendimento"
      >
        {checkoutBooking && (
          <div className="space-y-4">
            <div className="space-y-2">
              <DetailRow
                label="Cliente"
                value={checkoutBooking.client.name}
              />
              <DetailRow
                label="Horário"
                value={slotOf(checkoutBooking.start_time)}
              />
              <DetailRow
                label="Serviços"
                value={checkoutBooking.items
                  .map((i) => i.catalog_item.name)
                  .join(", ")}
              />
            </div>

            {isPaidOnline(checkoutBooking) ? (
              // Já pago no agendamento: pedir a forma de pagamento aqui faria a
              // receita ser contada duas vezes no fechamento do dia.
              <div className="pt-2 border-t border-white/[0.06] space-y-4">
                <p className="text-sm text-emerald-400 font-medium">
                  Este corte já foi pago online. A receita já está no caixa.
                </p>
                <Button
                  className="w-full"
                  disabled={checkoutSaving}
                  onClick={() => handleCheckout(checkoutBooking)}
                >
                  {checkoutSaving ? "Finalizando..." : "Concluir atendimento"}
                </Button>
              </div>
            ) : (
              <div className="pt-2 border-t border-white/[0.06]">
                <p className="text-xs font-semibold text-neutral-500 uppercase mb-3">
                  Como o cliente pagou?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.key}
                      disabled={checkoutSaving}
                      onClick={() => handleCheckout(checkoutBooking, m.key)}
                      className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-neutral-500 mt-3">
                  A receita entra no caixa aberto e a comissão do barbeiro é
                  registrada.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ── Componentes auxiliares ─────────────────────────────── */

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm gap-4">
      <span className="text-neutral-500 shrink-0">{label}</span>
      <span className="text-white font-medium text-right truncate">
        {value}
      </span>
    </div>
  );
}

function StatusButton({
  growingman,
  label,
  className,
  disabled,
  onClick,
}: {
  growingman: React.ReactNode;
  label: string;
  className: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 ${className}`}
    >
      {growingman}
      {label}
    </button>
  );
}
