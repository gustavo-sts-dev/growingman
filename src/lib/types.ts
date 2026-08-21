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

export type UserRole = "TENANT_ADMIN" | "BARBER" | "RECEPTIONIST" | "CUSTOMER";

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
  hero_image_url: string | null;
  /** Largura da imagem do topo em % da coluna; altura sai do aspecto do arquivo. */
  hero_image_width: number;
  show_stats: boolean | null;
  show_team: boolean | null;
  show_reviews: boolean | null;
  stat_clients: string | null;
  stat_rating: string | null;
  stat_experience: string | null;
  site_layout: import("@/lib/site-layout").SiteLayoutConfig | null;

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
