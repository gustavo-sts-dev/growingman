/**
 * Tipos compartilhados da API (growingman-style-backend).
 *
 * Derivados manualmente dos schemas Zod do backend (modules/<nome>/schemas).
 * Objetivo: substituir o `any` espalhado nas páginas. Mantenha em sincronia
 * com o backend ao alterar contratos. Campos de entidade refletem o retorno
 * (snake_case do Prisma); inputs refletem os schemas de criação (camelCase).
 */

// ──────────────────────────────────────────────────────────
// Enums / unions
// ──────────────────────────────────────────────────────────
export type ServiceCategory =
  | "corte"
  | "barba"
  | "combo"
  | "tratamento"
  | "outros";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no-show";

/**
 * Normaliza o status vindo da API (que pode chegar em MAIÚSCULO do banco —
 * ex. `CONFIRMED`, `PENDING_PAYMENT`, `NO_SHOW`) para a union canônica em
 * minúsculo usada no front. Ao enviar de volta (`PATCH /:id/status`), use o
 * valor canônico (minúsculo), que é o que o schema Zod do backend espera.
 */
export function normalizeBookingStatus(
  raw: string | null | undefined,
): BookingStatus {
  switch ((raw ?? "").toUpperCase()) {
    case "CONFIRMED":
      return "confirmed";
    case "COMPLETED":
      return "completed";
    case "CANCELLED":
    case "CANCELED":
      return "cancelled";
    case "NO_SHOW":
    case "NO-SHOW":
      return "no-show";
    case "PENDING":
    case "PENDING_PAYMENT":
    default:
      return "pending";
  }
}

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  "no-show": "Não compareceu",
};

export type UserRole =
  | "SUPERADMIN"
  | "TENANT_ADMIN"
  | "BARBER"
  | "RECEPTIONIST"
  | "CUSTOMER";

export type TransactionType =
  | "INCOME"
  | "EXPENSE"
  | "ADVANCE"
  | "COMMISSION_PAYMENT";

export type PaymentMethod = "CASH" | "PIX" | "CREDIT_CARD" | "DEBIT_CARD";

// ──────────────────────────────────────────────────────────
// Auth / usuário
// ──────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// ──────────────────────────────────────────────────────────
// Tenant
// ──────────────────────────────────────────────────────────
/** Presets de layout do topo (hero) da página pública. */
export type HeroLayout = "center" | "left" | "image-bg" | "image-split";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  theme_bg: string | null;
  theme_card: string | null;
  theme_text: string | null;
  theme_title: string | null;
  theme_button_bg: string | null;
  theme_button_text: string | null;
  theme_accent: string | null;
  font_family: string | null;
  cancellation_policy_hours: number | null;
  global_commission_rate: number | null;
  privacy_policy_url: string | null;
  terms_of_service_url: string | null;

  // Personalização da página pública
  site_preset: string | null;
  address: string | null;
  page_headline: string | null;
  page_subheadline: string | null;
  hero_layout: HeroLayout | null;
  /** Largura da imagem do topo em % da coluna; altura sai do aspecto do arquivo. */
  show_stats: boolean | null;
  show_team: boolean | null;
  show_reviews: boolean | null;
  stat_clients: string | null;
  stat_rating: string | null;
  stat_experience: string | null;
  site_layout: import("@/lib/site-layout").SiteLayoutConfig | null;

  // Expediente da barbearia, em 'HH:mm' (24h). Define a grade de horários que a
  // página de agendamento oferece. O almoço é opcional — `null` significa que a
  // barbearia não fecha para pausa.
  opening_time: string;
  closing_time: string;
  lunch_start: string | null;
  lunch_end: string | null;
  /** Intervalo entre horários oferecidos, em minutos. */
  slot_interval_minutes: number;
  /** Dias em que a barbearia abre. 0 = domingo … 6 = sábado. */
  open_weekdays: number[];
  /** Nulos = sábado segue o expediente geral. */
  saturday_opening_time: string | null;
  saturday_closing_time: string | null;
  saturday_lunch_start: string | null;
  saturday_lunch_end: string | null;

  // Pagamentos online (Mercado Pago). O backend NUNCA devolve o token cru:
  // expõe apenas `mp_connected` (derivado) para indicar se há credencial salva.
  mp_connected?: boolean;
}

// ──────────────────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────────────────
export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: string | number;
  duration: number;
  category: ServiceCategory;
  fidelityPoints?: number;
  growingman?: string | null;
  growingmanType?: "fontawesome" | "emoji";
  imageUrl?: string | null;
  isActive: boolean;
}

export interface CreateServiceInput {
  name: string;
  description?: string;
  price: number;
  duration: number;
  category?: ServiceCategory;
  fidelityPoints?: number;
  growingman?: string;
  growingmanType?: "fontawesome" | "emoji";
  imageUrl?: string | null;
  isActive?: boolean;
}

export type UpdateServiceInput = Partial<CreateServiceInput>;

// ──────────────────────────────────────────────────────────
// Barber
// ──────────────────────────────────────────────────────────
export interface WorkDay {
  start?: string | null;
  end?: string | null;
  isWorking: boolean;
}

export interface WorkSchedule {
  monday: WorkDay;
  tuesday: WorkDay;
  wednesday: WorkDay;
  thursday: WorkDay;
  friday: WorkDay;
  saturday: WorkDay;
  sunday: WorkDay;
}

/**
 * Entidade Barber como RETORNADA pela API (GET /barbers).
 * Atenção: a API retorna o nome como `name` (vem de User.name no backend).
 * O input de criação usa `fullName` (ver CreateBarberInput) — não confundir.
 */
export interface Barber {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialties?: string[];
  commissionPercentage?: number;
  avatarUrl?: string | null;
  workSchedule?: WorkSchedule;
  isActive: boolean;
}

export interface CreateBarberInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  specialties?: string[];
  avatarUrl?: string | null;
  commissionPercentage?: number;
  workSchedule?: WorkSchedule;
}

export type UpdateBarberInput = Partial<Omit<CreateBarberInput, "password">> & {
  password?: string;
  isActive?: boolean;
  avatarUrl?: string | null;
};

export interface BarberStats {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  totalRevenue: number;
  commissionRate: number;
  estimatedCommission: number;
}

// ──────────────────────────────────────────────────────────
// Booking
// ──────────────────────────────────────────────────────────
export interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  barberId: string;
  serviceId: string;
  date: string;
  time: string;
  status: BookingStatus;
  notes?: string | null;
  cancellationReason?: string | null;
}

export interface CreateBookingInput {
  customerName: string;
  customerPhone: string;
  barberId: string;
  serviceId: string;
  date: string;
  time: string;
  notes?: string;
}

export interface UpdateBookingStatusInput {
  status: BookingStatus;
  cancellationReason?: string;
}

export interface BlockedSlot {
  id: string;
  barberId: string;
  date: string | null;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  recurringDays: number[];
  reason: string | null;
}

// ──────────────────────────────────────────────────────────
// CRM
// ──────────────────────────────────────────────────────────
export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  points: number;
  no_shows: number;
  last_visit: string | null;
  days_absent: number | null;
}

// ──────────────────────────────────────────────────────────
// Finance
// ──────────────────────────────────────────────────────────
export interface RevenueSeriesPoint {
  date: string; // yyyy-MM-dd
  revenue: number;
  bookings: number;
}

export interface FinanceDashboard {
  todayIncome: number;
  todayExpenses: number;
  todayAdvances: number;
  todayCommissionsPaid: number;
  netProfit: number;
  cashRegisterOpen: boolean;
  cashRegisterBalance: number;
  pendingCommissionsTotal: number;
}

export interface CashRegister {
  id: string;
  opening_balance: string | number;
  currentBalance: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: string | number;
  payment_method: string;
  description: string | null;
}

export interface Commission {
  id: string;
  name: string;
  commissionsAccrued: number;
  totalAdvancesTaken: number;
  totalCommissionsPaid: number;
  currentBalanceDue: number;
}

export interface Product {
  id: string;
  name: string;
  base_price: string | number;
  stock_quantity: number;
}

// ──────────────────────────────────────────────────────────
// Review
// ──────────────────────────────────────────────────────────
export interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  createdAt: string;
}


// ──────────────────────────────────────────────────────────
// Painel da plataforma (/admin) — visão cross-tenant, só SUPERADMIN
// ──────────────────────────────────────────────────────────
export interface AdminOverview {
  tenants: {
    total: number;
    active: number;
    inTrial: number;
    newLast30Days: number;
  };
  barbers: { active: number };
  customers: { total: number };
  bookings: {
    total: number;
    last30Days: number;
    /** Chave = status do agendamento (CONFIRMED, COMPLETED, ...). */
    byStatus: Record<string, number>;
  };
  revenue: {
    /** Soma das mensalidades das barbearias que já saíram da cortesia. */
    monthlyRecurringRevenue: number;
    billableTenants: number;
  };
  generatedAt: string;
}

export interface AdminTenantRow {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  trialEndsAt: string | null;
  createdAt: string;
  activeBarbers: number;
  customers: number;
  bookings: number;
  inTrial: boolean;
  /** Mensalidade calculada — existe mesmo em cortesia, mas aí não é cobrada. */
  monthlyPrice: number;
  billedNow: boolean;
}

// ── Assinatura e programa de indicação ────────────────────────────────────────

export type SubscriptionStatus =
  | "TRIAL"
  | "ACTIVE"
  | "OVERDUE"
  | "SUSPENDED"
  | "CANCELED";

/** Retorno de `GET /tenants/my/subscription`. */
export interface SubscriptionQuote {
  basePrice: number;
  pricePerBarber: number;
  activeBarbers: number;
  /** Valor antes dos descontos de indicação. */
  subtotal: number;
  discountPercent: number;
  discountValue: number;
  /** O que será efetivamente cobrado. */
  total: number;
}

export type ReferralDiscountStatus = "PENDING" | "ACTIVE" | "EXPIRED";

export interface ReferralDiscount {
  id: string;
  /** `PERCENT` = recompensa de quem indica; `FIXED` = bônus de quem foi indicado. */
  kind: "PERCENT" | "FIXED";
  status: ReferralDiscountStatus;
  percent: number;
  /** Abatimento em reais, quando `kind = FIXED`. */
  amount: number | null;
  /** Nulo enquanto o desconto espera na fila: o prazo só corre quando ativa. */
  expiresAt: string | null;
}

export interface ReferralEntry {
  id: string;
  name: string;
  /** Vira true quando a barbearia indicada paga a primeira mensalidade. */
  confirmed: boolean;
  createdAt: string;
}

/** Retorno de `GET /tenants/my/referrals`. */
export interface ReferralSummary {
  code: string;
  discountPercent: number;
  /** Abatimento em reais por ter entrado indicado. Zero para quem não foi. */
  discountAmount: number;
  maxSimultaneous: number;
  discounts: ReferralDiscount[];
  referrals: ReferralEntry[];
}

// ── Página de análise ────────────────────────────────────────────────

/** Filtros da tela. Um contrato só, compartilhado por todos os gráficos. */
export interface AnalyticsFilters {
  from: string;
  to: string;
  barberId?: string;
  serviceId?: string;
}

export interface AnalyticsSummary {
  revenue: number;
  completed: number;
  /** Agendamentos que existiram na agenda, em qualquer desfecho. */
  total: number;
  cancelled: number;
  noShow: number;
  averageTicket: number;
  cancellationRate: number;
  noShowRate: number;
}

export interface AnalyticsSeriesPoint {
  date: string;
  revenue: number;
  bookings: number;
}

export interface AnalyticsAggregate {
  id: string;
  name: string;
  revenue: number;
  count: number;
}

/** Retorno de `GET /dashboard/analytics`. */
export interface AnalyticsResponse {
  period: { from: string; to: string };
  summary: AnalyticsSummary;
  series: AnalyticsSeriesPoint[];
  byBarber: AnalyticsAggregate[];
  byService: AnalyticsAggregate[];
  peakHours: Array<{ hour: number; count: number }>;
  peakWeekdays: Array<{ weekday: number; label: string; count: number }>;
  clients: { new: number; returning: number };
}
