"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { apiDelete, apiGet, apiPost, apiPatch } from "@/lib/api";
import { formatCurrency, formatPhone, onlyDigits } from "@/lib/format";
import {
  type BookingStatus,
  type BlockedSlot,
  type UserRole,
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
  CalendarOff,
  LockKeyhole,
  Trash2,
} from "lucide-react";

/**
 * Serviços combináveis num mesmo agendamento. Precisa bater com
 * MAX_SERVICES_PER_BOOKING no backend.
 */
const MAX_SERVICES = 3;

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
  client: { name: string; phone: string | null };
  items: Array<{
    catalog_item: { name: string };
    barber_profile: { id: string; user: { id: string } };
  }>;
  // Um Payment APPROVED = cobrança do atendimento já quitada online.
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

/**
 * A grade de horários vem do BACKEND, não daqui.
 *
 * Antes era um array fixo (08:00 às 17:30, de 30 em 30, com o almoço já pulado)
 * escrito neste arquivo. Isso ignorava por completo o expediente que a
 * barbearia configura: abertura, fechamento, intervalo, almoço, dias em que
 * abre e o horário próprio de sábado. Quem mudava o expediente nos Ajustes via
 * a página pública mudar e a agenda do painel continuar igual.
 *
 * `GET /bookings/day-grid` devolve as linhas do dia usando as MESMAS funções que
 * resolvem a disponibilidade pública — uma grade só, sem como divergir.
 */
interface DayGrid {
  open: boolean;
  slots: string[];
  intervalMinutes: number;
}


type ViewMode = "grid" | "list";
type StatusFilter = "all" | BookingStatus;
type BlockReason = "lunch" | "break" | "meeting" | "personal" | "maintenance" | "other";

const BLOCK_REASONS: Array<{ value: BlockReason; label: string }> = [
  { value: "lunch", label: "Almoço" },
  { value: "break", label: "Pausa" },
  { value: "meeting", label: "Reunião" },
  { value: "personal", label: "Compromisso pessoal" },
  { value: "maintenance", label: "Manutenção" },
  { value: "other", label: "Outro" },
];

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

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Fim sugerido ao criar um bloqueio: um slot depois do início.
 *
 * O passo vem do expediente, não de 30 fixo — numa barbearia com slots de 20 ou
 * 60 minutos, o sugerido contradizia a grade desenhada ao lado.
 */
function defaultEndTime(startTime: string, intervalMinutes: number): string {
  const passo = intervalMinutes > 0 ? intervalMinutes : 30;
  const total = Math.min(timeToMinutes(startTime) + passo, 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export default function AgendaPage() {
  const toast = useToast();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [barbers, setBarbers] = useState<Barber[]>([]);
  // `null` = ainda carregando; distingue "sem grade" de "fechado nesse dia".
  const [dayGrid, setDayGrid] = useState<DayGrid | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [bookings, setBookings] = useState<AgendaBooking[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [availability, setAvailability] = useState<Record<string, string[]>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);

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

  // Bloqueios: ação disponível somente para o dono e para o próprio barbeiro.
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<BlockedSlot | null>(null);
  const [blockSaving, setBlockSaving] = useState(false);
  const [blockDeleting, setBlockDeleting] = useState(false);
  const [blockForm, setBlockForm] = useState({
    barberId: "",
    date: selectedDate,
    startTime: "12:00",
    endTime: "13:00",
    reason: "personal" as BlockReason,
    description: "",
  });

  // Modal de detalhe/ação de status
  const [detailBooking, setDetailBooking] = useState<AgendaBooking | null>(
    null,
  );
  const [statusSaving, setStatusSaving] = useState(false);

  // Checkout: concluir um atendimento exige informar como o cliente pagou — é o
  // que lança a receita no caixa e registra a comissão do barbeiro. Corte já pago
  // online antes do fechamento dispensa: o webhook já lançou a receita.
  const [checkoutBooking, setCheckoutBooking] = useState<AgendaBooking | null>(
    null,
  );
  const [checkoutSaving, setCheckoutSaving] = useState(false);
  const canManageBlocks = role === "TENANT_ADMIN" || role === "BARBER";

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [me, barbersData, servicesData, clientsData] = await Promise.all([
        apiGet<{ id: string; role: UserRole }>("/auth/me").catch(() => null),
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

  const fetchBlockedSlots = useCallback(async () => {
    if (!canManageBlocks || barbers.length === 0) {
      setBlockedSlots([]);
      return;
    }

    const results = await Promise.all(
      barbers.map(async (barber) => {
        try {
          return await apiGet<BlockedSlot[]>(
            `/bookings/blocked-slots?barberId=${barber.id}&date=${selectedDate}`,
          );
        } catch {
          return [];
        }
      }),
    );
    setBlockedSlots(results.flat());
  }, [barbers, canManageBlocks, selectedDate]);

  /** Grade do dia: muda com a data, porque o expediente varia por dia da semana. */
  const fetchDayGrid = useCallback(async () => {
    try {
      setDayGrid(
        await apiGet<DayGrid>(`/bookings/day-grid?date=${selectedDate}`),
      );
    } catch {
      // Mantém a grade anterior — zerar a agenda por uma falha de rede seria pior.
      // Mas AVISA: sem isso a tela mostraria os horários de outro dia como se
      // fossem deste, e num dia fechado isso é ativamente enganoso.
      toast.error("Não foi possível atualizar a grade de horários deste dia.");
    }
    // `toast` fora das deps: a instância muda a cada render do provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

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
      void fetchBlockedSlots();
    }
  }, [selectedDate, barbers.length, fetchBookings, fetchAvailability, fetchBlockedSlots]);

  /**
   * Efeito PRÓPRIO para a grade, dependendo só da data.
   *
   * Junto do efeito acima, ela era rebuscada toda vez que qualquer um daqueles
   * callbacks era recriado — quatro requisições para a mesma data em um único
   * carregamento, medidas no navegador. A grade só muda quando o dia muda.
   */
  useEffect(() => {
    // Mesma justificativa dos efeitos acima: sincronização com API externa. O
    // `setDayGrid` só acontece depois do `await`, mas o lint não enxerga isso.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchDayGrid();
  }, [fetchDayGrid]);

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
        // A UI aqui sempre foi de múltipla escolha (checkboxes), mas o envio
        // truncava em [0] porque a API só aceitava um. Agora vai a lista toda.
        serviceIds: newBooking.serviceIds,
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

  const openBlockModal = (barberId?: string, startTime = "12:00") => {
    const defaultBarberId =
      role === "BARBER"
        ? (barbers[0]?.id ?? "")
        : (barberId ?? (barberFilter !== "all" ? barberFilter : barbers[0]?.id) ?? "");

    setBlockForm({
      barberId: defaultBarberId,
      date: selectedDate,
      startTime,
      endTime: defaultEndTime(startTime, dayGrid?.intervalMinutes ?? 30),
      reason: "personal",
      description: "",
    });
    setIsBlockModalOpen(true);
  };

  const handleCreateBlock = async () => {
    if (!blockForm.barberId || !blockForm.date || !blockForm.startTime || !blockForm.endTime) {
      toast.error("Preencha profissional, data e período do bloqueio.");
      return;
    }
    if (timeToMinutes(blockForm.startTime) >= timeToMinutes(blockForm.endTime)) {
      toast.error("O horário final deve ser depois do horário inicial.");
      return;
    }

    setBlockSaving(true);
    try {
      await apiPost("/bookings/blocked-slots", {
        barberId: blockForm.barberId,
        date: blockForm.date,
        startTime: blockForm.startTime,
        endTime: blockForm.endTime,
        reason: blockForm.reason,
        description: blockForm.description.trim() || undefined,
        isRecurring: false,
        recurringDays: [],
      });
      toast.success("Horário bloqueado na agenda.");
      setIsBlockModalOpen(false);

      if (blockForm.date !== selectedDate) {
        setSelectedDate(blockForm.date);
      } else {
        void fetchBlockedSlots();
        void fetchAvailability();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao bloquear horário.");
    } finally {
      setBlockSaving(false);
    }
  };

  const handleDeleteBlock = async () => {
    if (!selectedBlock) return;
    setBlockDeleting(true);
    try {
      await apiDelete(`/bookings/blocked-slots/${selectedBlock.id}`);
      toast.success("Horário liberado na agenda.");
      setSelectedBlock(null);
      void fetchBlockedSlots();
      void fetchAvailability();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao liberar horário.");
    } finally {
      setBlockDeleting(false);
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

  const getBlockAtSlot = (barberId: string, time: string) =>
    blockedSlots.find(
      (slot) =>
        slot.barberId === barberId &&
        timeToMinutes(time) >= timeToMinutes(slot.startTime) &&
        timeToMinutes(time) < timeToMinutes(slot.endTime),
    );

  const filteredBlocks = useMemo(
    () =>
      blockedSlots
        .filter((slot) => barberFilter === "all" || slot.barberId === barberFilter)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [barberFilter, blockedSlots],
  );

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
    <div className="space-y-5 sm:space-y-6">
      {/*
        Cabeçalho empilhado no celular.

        Título e ações lado a lado numa tela de 390px espremiam os dois: o
        subtítulo quebrava em quatro linhas para caber ao lado de um botão que
        não encolhe. Empilhado, o texto usa a largura toda e as ações viram uma
        dupla de botões largos — alvo generoso, do jeito que se toca num app.
      */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-600 font-semibold mb-1.5">
            Gestão de Horários
          </p>
          <h1 className="text-[1.75rem] font-black leading-tight tracking-tight sm:text-3xl">Agenda</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Visualize e gerencie os agendamentos por barbeiro e horário.
          </p>
        </div>
        <div className="flex shrink-0 gap-2 sm:flex-row-reverse">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="h-11 flex-1 rounded-xl bg-white px-4 text-sm font-semibold text-black transition-transform hover:bg-zinc-100 active:scale-[0.98] sm:h-9 sm:flex-none"
          >
            <Calendar className="w-4 h-4 mr-1.5" /> Novo Agendamento
          </Button>
          {canManageBlocks && (
            <Button
              onClick={() => openBlockModal()}
              variant="outline"
              disabled={barbers.length === 0}
              className="h-11 flex-1 rounded-xl border-white/10 px-4 text-sm font-semibold transition-transform active:scale-[0.98] sm:h-9 sm:flex-none"
            >
              <CalendarOff className="w-4 h-4 mr-1.5" /> Bloquear horário
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar: data + visão + filtros */}
      <div className="space-y-3">
        {/*
          Seletor de data.

          As setas de dia são o controle mais tocado desta tela e tinham 32px —
          abaixo do alvo de 44px, e coladas no campo de data, que abre o seletor
          nativo. Errar a mira significava abrir o calendário sem querer. Agora
          cada seta ocupa o canto inteiro, com o campo respirando no meio.
        */}
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1.5 sm:justify-center sm:gap-4 sm:p-4">
          <button
            onClick={() => changeDate(-1)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-neutral-400 transition-all hover:bg-white/[0.08] hover:text-white active:scale-90 active:bg-white/[0.12] sm:h-9 sm:w-9"
            aria-label="Dia anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex min-w-0 items-center justify-center gap-2">
            <Calendar className="hidden h-4 w-4 shrink-0 text-neutral-500 sm:block" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="min-w-0 border-none bg-transparent text-center text-base font-bold text-white focus:outline-none sm:text-lg"
            />
          </div>
          <button
            onClick={() => changeDate(1)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-neutral-400 transition-all hover:bg-white/[0.08] hover:text-white active:scale-90 active:bg-white/[0.12] sm:h-9 sm:w-9"
            aria-label="Próximo dia"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/*
          Filtros.

          `flex-wrap` com `order`: no celular a primeira linha leva o seletor de
          profissional (que estica) e o alternador de visão (que não), e a barra
          de status desce inteira para a segunda porque é `w-full`. No desktop,
          onde tudo cabe, o `order` recoloca o alternador na direita e a linha
          volta a ser uma só — mesma marcação, duas plantas.
        */}
        <div className="flex flex-wrap items-center gap-2 lg:gap-3">
          {/* Filtro barbeiro (oculto para o próprio barbeiro, que só vê a si) */}
          {role !== "BARBER" && (
            <select
              value={barberFilter}
              onChange={(e) => setBarberFilter(e.target.value)}
              aria-label="Filtrar por profissional"
              className="order-1 h-11 min-w-0 flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-xs font-semibold text-neutral-300 focus:border-white/25 focus:outline-none lg:h-9 lg:flex-none [&>option]:bg-zinc-900 [&>option]:text-white"
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

          {/* Toggle de visão */}
          <div className="order-2 ml-auto flex w-fit shrink-0 gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1 lg:order-3">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all active:scale-95 lg:py-1.5 ${
                viewMode === "grid"
                  ? "bg-white text-black"
                  : "text-neutral-500 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Grade
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all active:scale-95 lg:py-1.5 ${
                viewMode === "list"
                  ? "bg-white text-black"
                  : "text-neutral-500 hover:text-white"
              }`}
            >
              <List className="w-3.5 h-3.5" /> Lista
            </button>
          </div>

          {/*
            Filtro de status como trilho deslizante.

            Seis opções não cabem em 390px: elas quebravam em duas e três linhas
            dentro da pílula, e a barra mudava de altura conforme o filtro
            escolhido — a página inteira pulava a cada toque. Deslizando, a
            altura é sempre a mesma e o gesto é o das barras segmentadas do
            sistema.
          */}
          <div className="rail order-3 w-full gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1 lg:order-2 lg:w-auto lg:overflow-visible">
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
        <div className="relative isolate rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="overflow-x-auto overscroll-x-contain">
            {/*
              A largura mínima vem de uma variável CSS, não de `style` calculado
              em JS.

              O valor precisa mudar com o ponto de corte — 152px por coluna no
              celular contra 180px no desktop —, e `style` inline não conhece
              media query. Passando só a CONTAGEM de colunas para o CSS, a conta
              acontece onde o ponto de corte existe.
            */}
            <table
              className="w-full min-w-[calc(5rem+var(--agenda-cols)*9.5rem)] table-fixed text-sm sm:min-w-[calc(6rem+var(--agenda-cols)*11.25rem)]"
              style={{ "--agenda-cols": visibleBarbers.length } as React.CSSProperties}
            >
              <colgroup>
                <col className="w-20 sm:w-24" />
                {visibleBarbers.map((barber) => (
                  <col
                    key={barber.id}
                    className="w-[9.5rem] sm:w-[180px]"
                  />
                ))}
              </colgroup>
              <thead className="bg-white/[0.02] border-b border-white/[0.06]">
                <tr>
                  <th className="sticky left-0 z-10 w-20 border-r border-white/[0.06] bg-[#080808] px-3 py-3 text-left text-xs font-semibold uppercase text-neutral-500 whitespace-nowrap sm:w-24 sm:px-4">
                    Horário
                  </th>
                  {visibleBarbers.map((barber) => (
                    <th
                      key={barber.id}
                      className="px-2 py-3 text-center text-xs font-semibold uppercase text-neutral-500 sm:px-4"
                    >
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                        <User className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{barber.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {dayGrid && !dayGrid.open && (
                  <tr>
                    <td
                      colSpan={visibleBarbers.length + 1}
                      className="px-4 py-10 text-center text-sm text-neutral-500"
                    >
                      A barbearia não abre neste dia da semana.
                      <span className="block text-xs text-neutral-600 mt-1">
                        Ajuste em Ajustes do App › Expediente.
                      </span>
                    </td>
                  </tr>
                )}
                {(dayGrid?.slots ?? []).map((time) => (
                  <tr
                    key={time}
                    className="hover:bg-white/[0.01]"
                  >
                    <td className="sticky left-0 z-10 w-20 border-r border-white/[0.06] bg-[#080808] px-3 py-2 font-semibold text-neutral-400 whitespace-nowrap sm:w-24 sm:px-4">
                      <div className="flex items-center gap-1.5">
                        <Clock className="hidden h-3.5 w-3.5 text-neutral-600 sm:block" />
                        {time}
                      </div>
                    </td>
                    {visibleBarbers.map((barber) => {
                      const booking = getBookingAtSlot(barber.id, time);
                      const block = getBlockAtSlot(barber.id, time);
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
                              className={`w-full rounded-lg border p-2.5 text-left transition-all active:scale-[0.97] ${STATUS_STYLE[status]} ${
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

                      if (block) {
                        return (
                          <td key={barber.id} className="px-2 py-2">
                            <button
                              onClick={() => setSelectedBlock(block)}
                              className="w-full rounded-lg border border-amber-500/15 bg-amber-500/[0.06] p-2.5 text-left transition-all hover:bg-amber-500/10 active:scale-[0.97]"
                            >
                              <p className="text-xs font-semibold text-amber-300 truncate">
                                Bloqueado
                              </p>
                              <p className="text-[10px] text-neutral-500 truncate">
                                {block.reason || `${block.startTime}–${block.endTime}`}
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
                              className="w-full rounded-lg border border-dashed border-white/10 p-2.5 text-xs text-neutral-600 transition-all hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-400 active:scale-[0.97] active:border-emerald-500/30 active:text-emerald-400"
                            >
                              Disponível
                            </button>
                          ) : (
                            <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                              <p className="text-xs text-neutral-700 text-center">
                                Indisponível
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
          {/*
            Sombra na borda direita quando há mais colunas do que cabem.

            A grade rola de lado no celular, e nada dizia isso: uma tabela que
            termina reta na borda parece uma tabela inteira. O esmaecido é a
            convenção de app para "continua" — e some sozinho quando só há um
            profissional, porque aí não há nada a revelar.
          */}
          {visibleBarbers.length > 1 && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#080808] to-transparent sm:hidden"
            />
          )}
        </div>
      ) : (
        /* ── VISÃO LISTA ────────────────────────────────────── */
        <div className="space-y-3">
          {filteredBlocks.length > 0 && (
            <div className="rounded-2xl border border-amber-500/15 overflow-hidden">
              <div className="px-5 py-3 border-b border-amber-500/10 bg-amber-500/[0.04]">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
                  Horários bloqueados
                </p>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {filteredBlocks.map((block) => (
                  <button
                    key={block.id}
                    onClick={() => setSelectedBlock(block)}
                    className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-amber-500/[0.04] active:bg-amber-500/[0.08] sm:gap-4 sm:px-5"
                  >
                    <div className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-amber-300 sm:gap-2 sm:text-sm">
                      <LockKeyhole className="w-3.5 h-3.5" />
                      {block.startTime}–{block.endTime}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-300 truncate">
                        {block.reason || "Horário indisponível"}
                      </p>
                      <p className="text-xs text-neutral-600 truncate">
                        {barbers.find((barber) => barber.id === block.barberId)?.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

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
                    className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-white/[0.02] active:bg-white/[0.05] sm:gap-4 sm:px-5"
                  >
                    <div className="flex w-12 shrink-0 items-center gap-1.5 text-sm font-semibold text-neutral-300 sm:w-16 sm:gap-2">
                      <Clock className="hidden h-3.5 w-3.5 text-neutral-600 sm:block" />
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
        </div>
      )}

      {/* Bloqueio pontual — preserva o contexto da data selecionada na agenda. */}
      <Modal
        open={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        title="Bloquear horário"
        description="O período deixa de aparecer como disponível para novos agendamentos."
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="block-barber" className="block text-sm text-neutral-400 mb-1">
              Profissional
            </label>
            <select
              id="block-barber"
              value={blockForm.barberId}
              disabled={role === "BARBER"}
              onChange={(event) => setBlockForm({ ...blockForm, barberId: event.target.value })}
              className="w-full h-10 px-3 bg-white/[0.02] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/25 disabled:opacity-60 [&>option]:bg-zinc-900 [&>option]:text-white"
            >
              <option value="">Selecione...</option>
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="block-date" className="block text-sm text-neutral-400 mb-1">
              Data
            </label>
            <input
              id="block-date"
              type="date"
              value={blockForm.date}
              onChange={(event) => setBlockForm({ ...blockForm, date: event.target.value })}
              className="w-full h-10 px-3 bg-white/[0.02] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/25"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="block-start" className="block text-sm text-neutral-400 mb-1">
                Início
              </label>
              <input
                id="block-start"
                type="time"
                value={blockForm.startTime}
                onChange={(event) => {
                  const startTime = event.target.value;
                  setBlockForm({
                    ...blockForm,
                    startTime,
                    endTime: defaultEndTime(startTime, dayGrid?.intervalMinutes ?? 30),
                  });
                }}
                className="w-full h-10 px-3 bg-white/[0.02] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/25"
              />
            </div>
            <div>
              <label htmlFor="block-end" className="block text-sm text-neutral-400 mb-1">
                Fim
              </label>
              <input
                id="block-end"
                type="time"
                value={blockForm.endTime}
                onChange={(event) => setBlockForm({ ...blockForm, endTime: event.target.value })}
                className="w-full h-10 px-3 bg-white/[0.02] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/25"
              />
            </div>
          </div>

          <div>
            <label htmlFor="block-reason" className="block text-sm text-neutral-400 mb-1">
              Motivo
            </label>
            <select
              id="block-reason"
              value={blockForm.reason}
              onChange={(event) => setBlockForm({ ...blockForm, reason: event.target.value as BlockReason })}
              className="w-full h-10 px-3 bg-white/[0.02] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/25 [&>option]:bg-zinc-900 [&>option]:text-white"
            >
              {BLOCK_REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="block-description" className="block text-sm text-neutral-400 mb-1">
              Observação <span className="text-neutral-600">(opcional)</span>
            </label>
            <input
              id="block-description"
              type="text"
              maxLength={200}
              value={blockForm.description}
              onChange={(event) => setBlockForm({ ...blockForm, description: event.target.value })}
              placeholder="Ex.: consulta médica"
              className="w-full h-10 px-3 bg-white/[0.02] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/25"
            />
          </div>

          {/*
              Rodapé de ação da folha: empilhado no celular, com a ação
              principal embaixo — é o que o polegar alcança primeiro numa folha
              colada ao rodapé — e lado a lado no diálogo do desktop.
          */}
          <div className="flex flex-col-reverse gap-2.5 pt-3 sm:flex-row sm:gap-3">
            <Button
              variant="outline"
              className="h-12 flex-1 rounded-xl active:scale-[0.98] sm:h-10"
              disabled={blockSaving}
              onClick={() => setIsBlockModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="h-12 flex-1 rounded-xl bg-amber-300 text-black transition-transform hover:bg-amber-200 active:scale-[0.98] sm:h-10"
              disabled={blockSaving}
              onClick={handleCreateBlock}
            >
              {blockSaving ? "Bloqueando..." : "Bloquear período"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!selectedBlock}
        onClose={() => setSelectedBlock(null)}
        title="Horário bloqueado"
        description="Revise o período antes de liberar a agenda novamente."
      >
        {selectedBlock && (
          <div className="space-y-4">
            <div className="space-y-2">
              <DetailRow
                label="Profissional"
                value={barbers.find((barber) => barber.id === selectedBlock.barberId)?.name ?? "—"}
              />
              <DetailRow label="Data" value={selectedDate.split("-").reverse().join("/")} />
              <DetailRow label="Período" value={`${selectedBlock.startTime}–${selectedBlock.endTime}`} />
              <DetailRow label="Motivo" value={selectedBlock.reason || "Não informado"} />
            </div>
            <div className="pt-4 border-t border-white/[0.06]">
              <p className="text-xs text-neutral-500 mb-3">
                Ao liberar, este período volta a aceitar novos agendamentos imediatamente.
              </p>
              <Button
                variant="outline"
                disabled={blockDeleting}
                onClick={handleDeleteBlock}
                className="h-12 w-full rounded-xl border-red-500/20 text-red-400 transition-transform hover:bg-red-500/10 active:scale-[0.98] sm:h-10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {blockDeleting ? "Liberando..." : "Liberar horário"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

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
            // Nome e telefone são campos de texto livre: lado a lado em 390px
            // sobra menos de 150px para cada um, e o valor digitado desaparece
            // pela esquerda enquanto se escreve.
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <div className="max-h-56 space-y-2 overflow-y-auto overscroll-contain sm:max-h-40">
              {services.map((s) => (
                <label
                  key={s.id}
                  className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/[0.02] active:bg-white/[0.05]"
                >
                  <input
                    type="checkbox"
                    checked={newBooking.serviceIds.includes(s.id)}
                    disabled={
                      !newBooking.serviceIds.includes(s.id) &&
                      newBooking.serviceIds.length >= MAX_SERVICES
                    }
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
                    className="h-[1.15rem] w-[1.15rem] shrink-0 accent-white"
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
              onClick={handleCreateBooking}
              disabled={saving}
              className="h-12 flex-1 rounded-xl bg-white text-black transition-transform hover:bg-neutral-200 active:scale-[0.98] sm:h-10"
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
              {/* Agendamento feito no balcão pode não ter telefone; a linha some
                  em vez de mostrar "—", que ocuparia espaço sem dizer nada. */}
              {detailBooking.client.phone && (
                <DetailRow
                  label="Telefone"
                  value={formatPhone(detailBooking.client.phone)}
                />
              )}
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
                  className="h-12 w-full rounded-xl transition-transform active:scale-[0.98] sm:h-10"
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
                      className="flex min-h-[3rem] items-center justify-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20 active:scale-[0.97] disabled:opacity-50"
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
      className={`flex h-12 items-center justify-center gap-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.97] disabled:opacity-40 sm:h-10 ${className}`}
    >
      {growingman}
      {label}
    </button>
  );
}
