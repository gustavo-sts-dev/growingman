"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Calendar as CalendarGrowingman,
  Clock,
  User,
  Phone,
  Scissors,
  CheckCircle,
  Check,
  Loader2,
  AlertCircle,
  ChevronDown,
  MessageCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/config";
import {
  brazilianDateInput,
  formatPhone,
  isValidPhone,
  onlyDigits,
} from "@/lib/format";

/**
 * Janela de agendamento, em dias de calendário. Precisa bater com
 * MAX_ADVANCE_DAYS no backend (booking.service.ts) — aqui é só para o seletor
 * não oferecer data que a API vai recusar; quem decide é o backend.
 */
const MAX_ADVANCE_DAYS = 5;

interface TenantLite {
  id: string;
  slug: string;
  name: string;
  /** Aviso de privacidade no ponto de coleta (LGPD Art. 9º). Pode não estar
   *  preenchido: nesse caso o aviso aparece sem link. */
  privacy_policy_url?: string | null;
}
interface ServiceLite {
  id: string;
  name: string;
  base_price: string | number;
  duration_minutes: number;
  image_url?: string | null;
}
interface BarberLite {
  id: string;
  name: string;
  phone?: string | null;
  avatarUrl?: string | null;
}
interface BookingFlowProps {
  tenant: TenantLite;
  services: ServiceLite[];
  barbers: BarberLite[];
  initialServiceId?: string;
}

type SectionType = "service" | "barber" | "datetime" | "user";

/**
 * Tokens de cor derivados do tema white-label do tenant.
 *
 * As CSS vars (--theme-*) são injetadas pela página pai a partir das cores que a
 * barbearia escolheu. Para superfícies, bordas e textos secundários usamos
 * `color-mix` com a cor de texto do tema — assim o componente funciona tanto em
 * temas escuros quanto claros, sem cores fixas (text-white/bg-black) que quebram
 * em fundo claro.
 */
const T = {
  title: { color: "var(--theme-title)" },
  text: { color: "var(--theme-text)" },
  // Texto secundário: mistura a cor de texto com o fundo (fica mais suave nos dois temas).
  textMuted: {
    color: "color-mix(in srgb, var(--theme-text) 65%, var(--theme-bg))",
  },
  // Superfície sutil sobre o fundo (cards internos, hovers).
  surface: {
    backgroundColor:
      "color-mix(in srgb, var(--theme-text) 6%, var(--theme-bg))",
  },
  surfaceStrong: {
    backgroundColor:
      "color-mix(in srgb, var(--theme-text) 12%, var(--theme-bg))",
  },
  // Borda neutra que aparece em fundo claro e escuro.
  border: {
    borderColor: "color-mix(in srgb, var(--theme-text) 18%, transparent)",
  },
  borderStrong: {
    borderColor: "color-mix(in srgb, var(--theme-text) 35%, transparent)",
  },
  // Input: fundo levemente contrastante + texto do tema.
  input: {
    backgroundColor:
      "color-mix(in srgb, var(--theme-text) 8%, var(--theme-bg))",
    borderColor: "color-mix(in srgb, var(--theme-text) 20%, transparent)",
    color: "var(--theme-title)",
  },
  // Botão primário usa as cores de botão escolhidas pela barbearia.
  buttonPrimary: {
    backgroundColor: "var(--theme-button-bg)",
    color: "var(--theme-button-text)",
  },
  card: { backgroundColor: "var(--theme-card)" },
} as const;

/** Resumo imutável do agendamento, capturado no momento da confirmação. */
interface BookingSummary {
  serviceName: string;
  barberName: string;
  barberPhone?: string | null;
  dateLabel: string;
  time: string;
  price: number;
  customerName: string;
}

function scrollToElement(
  element: HTMLElement | null,
  block: ScrollLogicalPosition = "start",
) {
  if (!element) return;
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  element.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block,
  });
}

export function BookingFlow({
  tenant,
  services,
  barbers,
  initialServiceId = "",
}: BookingFlowProps) {
  const router = useRouter();
  // `null` = todas recolhidas. Sem esse estado o cabeçalho só conseguia ABRIR:
  // clicar numa seção já aberta reatribuía o mesmo valor e nada fechava, embora
  // o chevron girasse como se fosse um toggle.
  const [activeSection, setActiveSection] = useState<SectionType | null>(
    initialServiceId ? "barber" : "service",
  );

  /** Alterna a seção: abre se estiver fechada, recolhe se já estiver aberta. */
  const toggleSection = (section: SectionType) =>
    setActiveSection((current) => (current === section ? null : section));
  const sectionRefs = useRef<
    Partial<Record<SectionType, HTMLDivElement | null>>
  >({});
  const checkoutRef = useRef<HTMLDivElement | null>(null);
  const confirmationRef = useRef<HTMLDivElement | null>(null);
  const pendingSectionScroll = useRef(false);
  const wasBaseValid = useRef(false);
  const [loading, setLoading] = useState(false);
  const [loadingHours, setLoadingHours] = useState(false);
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [bookingSummary, setBookingSummary] = useState<BookingSummary | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState("");
  // Nome do cadastro existente para o telefone digitado (null = cliente novo).
  const [knownClient, setKnownClient] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    serviceId: initialServiceId,
    barberId: "",
    date: "",
    time: "",
    nome: "",
    telefone: "",
  });

  const getServiceInfo = (id: string) => services.find((s) => s.id === id);
  const getBarberInfo = (id: string) => barbers.find((b) => b.id === id);
  const getPrice = () => {
    const s = getServiceInfo(formData.serviceId);
    return s ? Number(s.base_price) : 0;
  };

  const getInitials = (name: string) => {
    if (!name) return "B";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  // Nome: backend exige min 3 chars; aqui também pedimos nome + sobrenome.
  const isValidName = useMemo(() => {
    const trimmed = formData.nome.trim();
    return trimmed.length >= 3 && trimmed.split(/\s+/).length >= 2;
  }, [formData.nome]);

  const phoneValid = useMemo(
    () => isValidPhone(formData.telefone),
    [formData.telefone],
  );
  const isValidUser = isValidName && phoneValid;

  const isBaseValid = !!(
    formData.serviceId &&
    formData.barberId &&
    formData.date &&
    formData.time &&
    isValidUser
  );

  const isFormComplete = isBaseValid;

  /** Avança o fluxo e sinaliza que a próxima etapa deve entrar no viewport. */
  const advanceToSection = (section: SectionType) => {
    pendingSectionScroll.current = true;
    setActiveSection(section);
  };

  useEffect(() => {
    if (!pendingSectionScroll.current) return;
    pendingSectionScroll.current = false;

    const frame = window.requestAnimationFrame(() => {
      scrollToElement(activeSection ? sectionRefs.current[activeSection] ?? null : null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeSection]);

  // Quando os dados pessoais ficam válidos, revela a ação final sem tirar
  // abruptamente o campo em edição da tela.
  useEffect(() => {
    const justCompleted = isBaseValid && !wasBaseValid.current;
    wasBaseValid.current = isBaseValid;
    if (!justCompleted) return;

    const frame = window.requestAnimationFrame(() => {
      scrollToElement(checkoutRef.current, "nearest");
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isBaseValid]);

  useEffect(() => {
    if (!confirmed || !bookingSummary) return;

    const frame = window.requestAnimationFrame(() => {
      scrollToElement(confirmationRef.current);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [confirmed, bookingSummary]);

  // O telefone é a identidade do cliente no backend. Assim que ele for válido,
  // buscamos o cadastro e preenchemos o nome — o cliente pode corrigi-lo (o
  // backend passa a atualizar o cadastro). Sem isso, quem já tinha cadastro via
  // o nome antigo ser usado no agendamento sem nenhum aviso.
  useEffect(() => {
    if (!phoneValid) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setKnownClient(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          apiUrl(
            `/bookings/client-lookup?tenantId=${tenant.id}&phone=${onlyDigits(formData.telefone)}`,
          ),
          { signal: controller.signal },
        );
        if (!res.ok) return;
        // A API devolve só o PRIMEIRO nome (a rota é pública; entregar o nome
        // completo a quem varre telefones vaza demais). Serve para reconhecer
        // o cliente, não para preencher o campo: preencher com um nome
        // truncado faria o agendamento sobrescrever o cadastro sem o sobrenome.
        const { firstName } = await res.json();
        setKnownClient(firstName || null);
      } catch {
        // Lookup é conveniência: falhou, segue o fluxo manual.
      }
    }, 400);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [phoneValid, formData.telefone, tenant.id]);

  // Check Availability
  useEffect(() => {
    const checkAvailability = async () => {
      if (!formData.barberId || !formData.date) {
        setAvailableHours([]);
        return;
      }

      setLoadingHours(true);
      try {
        const res = await fetch(
          apiUrl(
            `/bookings/availability?barberId=${formData.barberId}&date=${formData.date}&serviceId=${formData.serviceId}`,
          ),
        );
        if (res.ok) {
          const data = await res.json();
          setAvailableHours(data.availableSlots || []);
          if (
            formData.time &&
            !(data.availableSlots || []).includes(formData.time)
          ) {
            setFormData((prev) => ({ ...prev, time: "" }));
          }
        }
      } catch (err) {
        console.error("Availability error", err);
      } finally {
        setLoadingHours(false);
      }
    };

    checkAvailability();
    // formData.time é lido para revalidar o horário escolhido, mas não deve
    // disparar o efeito (evita refetch ao apenas selecionar a hora).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.barberId, formData.date, formData.serviceId]);

  /** Monta um snapshot legível do agendamento para a tela de confirmação. */
  const buildSummary = (): BookingSummary => {
    const s = getServiceInfo(formData.serviceId);
    const b = getBarberInfo(formData.barberId);
    return {
      serviceName: s?.name ?? "",
      barberName: b?.name ?? "",
      barberPhone: b?.phone,
      dateLabel: formData.date.split("-").reverse().join("/"),
      time: formData.time,
      price: getPrice(),
      customerName: formData.nome,
    };
  };

  const handleSubmit = async () => {
    if (!isFormComplete) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const payload = {
        tenantId: tenant.id,
        serviceId: formData.serviceId,
        barberId: formData.barberId,
        date: formData.date,
        time: formData.time,
        customerName: formData.nome.trim(),
        customerPhone: onlyDigits(formData.telefone),
      };
      const res = await fetch(apiUrl("/bookings"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        const msg: string = errData?.message || "Erro ao confirmar agendamento";

        throw new Error(msg);
      }

      setBookingSummary(buildSummary());
      setConfirmed(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  /** Abre o WhatsApp do profissional — chamado só no clique direto do usuário. */
  const openWhatsApp = () => {
    const summary = bookingSummary;
    if (!summary?.barberPhone) return;
    const firstName = summary.barberName.split(" ")[0];
    const mensagem = `Olá ${firstName}! \n\nAcabei de confirmar meu agendamento:\n\n*Nome:* ${summary.customerName}\n*Data:* ${summary.dateLabel}\n*Horário:* ${summary.time}\n*Serviço:* ${summary.serviceName}\n*Valor:* R$ ${summary.price.toFixed(2)}\n\nObrigado!`;
    const cleanPhone = summary.barberPhone.replace(/\D/g, "");
    const displayPhone = cleanPhone.startsWith("55")
      ? cleanPhone
      : `55${cleanPhone}`;
    window.open(
      `https://wa.me/${displayPhone}?text=${encodeURIComponent(mensagem)}`,
      "_blank",
    );
  };

  const sectionStyle =
    "border rounded-2xl overflow-hidden transition-all duration-300";
  const headerBtnStyle =
    "w-full px-5 py-4 flex items-center justify-between focus:outline-none";

  /** Estilo da "casca" de cada seção (ativa = destaque, inativa = sutil). */
  const sectionShell = (isActive: boolean) =>
    isActive ? { ...T.surface, ...T.borderStrong } : { ...T.border };

  const getStepCircle = (step: number, isDone: boolean, isActive: boolean) => {
    const style = isDone
      ? T.buttonPrimary
      : isActive
        ? T.surfaceStrong
        : T.surface;
    const textStyle = isDone ? {} : isActive ? T.title : T.textMuted;
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors"
        style={{ ...style, ...textStyle }}
      >
        {isDone && !isActive ? <Check className="w-4 h-4" /> : step}
      </div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-8">
      <div className="mb-8 text-center sm:text-left">
        <h1
          className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2"
          style={T.title}
        >
          Agendamento
        </h1>
        <p
          style={T.text}
          className="font-medium"
        >
          Preencha os dados abaixo para reservar seu horário.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl flex items-center gap-3 text-sm border bg-red-500/10 text-red-400 border-red-500/20">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* 1. SERVIÇO */}
        <div
          ref={(node) => {
            sectionRefs.current.service = node;
          }}
          className={`${sectionStyle} scroll-mt-6`}
          style={sectionShell(activeSection === "service")}
        >
          <button
            onClick={() => toggleSection("service")}
            className={headerBtnStyle}
          >
            <div className="flex items-center gap-4">
              {getStepCircle(
                1,
                !!formData.serviceId,
                activeSection === "service",
              )}
              <div className="text-left">
                <h3
                  className="font-bold text-lg"
                  style={
                    activeSection === "service" || formData.serviceId
                      ? T.title
                      : T.textMuted
                  }
                >
                  O que você deseja?
                </h3>
                {formData.serviceId && activeSection !== "service" && (
                  <p
                    className="text-sm font-medium mt-0.5"
                    style={T.textMuted}
                  >
                    {getServiceInfo(formData.serviceId)?.name}
                  </p>
                )}
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${activeSection === "service" ? "rotate-180" : ""}`}
              style={T.textMuted}
            />
          </button>

          {activeSection === "service" && (
            <div className="px-5 pb-5 pt-2 grid gap-3">
              {services.map((s) => {
                const selected = formData.serviceId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setFormData({ ...formData, serviceId: s.id });
                      advanceToSection("barber");
                    }}
                    className="w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center"
                    style={
                      selected
                        ? { ...T.surfaceStrong, ...T.borderStrong }
                        : { ...T.border }
                    }
                  >
                    <div className="flex items-center gap-4">
                      {s.image_url && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={s.image_url}
                          alt={s.name}
                          className="w-12 h-12 object-cover rounded-xl shrink-0 border border-white/10"
                        />
                      )}
                      <div>
                        <h4
                          className="font-bold text-base"
                          style={T.title}
                        >
                          {s.name}
                        </h4>
                        <div
                          className="flex items-center gap-2 mt-1 text-sm font-medium"
                          style={T.textMuted}
                        >
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />{" "}
                            {s.duration_minutes} min
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className="font-extrabold text-lg"
                      style={T.title}
                    >
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(Number(s.base_price))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. PROFISSIONAL */}
        <div
          ref={(node) => {
            sectionRefs.current.barber = node;
          }}
          className={`${sectionStyle} scroll-mt-6 ${!formData.serviceId ? "opacity-50 pointer-events-none" : ""}`}
          style={sectionShell(activeSection === "barber")}
        >
          <button
            onClick={() => toggleSection("barber")}
            className={headerBtnStyle}
          >
            <div className="flex items-center gap-4">
              {getStepCircle(
                2,
                !!formData.barberId,
                activeSection === "barber",
              )}
              <div className="text-left">
                <h3
                  className="font-bold text-lg"
                  style={
                    activeSection === "barber" || formData.barberId
                      ? T.title
                      : T.textMuted
                  }
                >
                  Com quem?
                </h3>
                {formData.barberId && activeSection !== "barber" && (
                  <p
                    className="text-sm font-medium mt-0.5"
                    style={T.textMuted}
                  >
                    {getBarberInfo(formData.barberId)?.name}
                  </p>
                )}
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${activeSection === "barber" ? "rotate-180" : ""}`}
              style={T.textMuted}
            />
          </button>

          {activeSection === "barber" && (
            <div className="px-5 pb-5 pt-2 flex flex-col gap-3">
              {barbers.map((b) => {
                const selected = formData.barberId === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => {
                      setFormData({ ...formData, barberId: b.id });
                      advanceToSection("datetime");
                    }}
                    className="w-full flex items-center gap-4 p-3 rounded-xl border transition-all"
                    style={
                      selected
                        ? { ...T.surfaceStrong, ...T.borderStrong }
                        : { ...T.border }
                    }
                  >
                    {b.avatarUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={b.avatarUrl}
                        alt={b.name}
                        className="w-12 h-12 object-cover rounded-full shrink-0 border border-white/10"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center font-bold text-base"
                        style={
                          selected
                            ? T.buttonPrimary
                            : { ...T.surfaceStrong, ...T.title }
                        }
                      >
                        {getInitials(b.name)}
                      </div>
                    )}
                    <span
                      className="font-bold text-lg"
                      style={T.title}
                    >
                      {b.name}
                    </span>
                    <div className="ml-auto">
                      {selected ? (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={T.buttonPrimary}
                        >
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <div
                          className="w-5 h-5 rounded-full border-2"
                          style={T.border}
                        ></div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. DATA E HORA */}
        <div
          ref={(node) => {
            sectionRefs.current.datetime = node;
          }}
          className={`${sectionStyle} scroll-mt-6 ${!formData.barberId ? "opacity-50 pointer-events-none" : ""}`}
          style={sectionShell(activeSection === "datetime")}
        >
          <button
            onClick={() => toggleSection("datetime")}
            className={headerBtnStyle}
          >
            <div className="flex items-center gap-4">
              {getStepCircle(
                3,
                !!(formData.date && formData.time),
                activeSection === "datetime",
              )}
              <div className="text-left">
                <h3
                  className="font-bold text-lg"
                  style={
                    activeSection === "datetime" ||
                    (formData.date && formData.time)
                      ? T.title
                      : T.textMuted
                  }
                >
                  Quando?
                </h3>
                {formData.date &&
                  formData.time &&
                  activeSection !== "datetime" && (
                    <p
                      className="text-sm font-medium mt-0.5"
                      style={T.textMuted}
                    >
                      {formData.date.split("-").reverse().join("/")} às{" "}
                      {formData.time}
                    </p>
                  )}
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${activeSection === "datetime" ? "rotate-180" : ""}`}
              style={T.textMuted}
            />
          </button>

          {activeSection === "datetime" && (
            <div className="px-5 pb-5 pt-2 space-y-6">
              <div>
                <label
                  className="block text-sm font-bold mb-2"
                  style={T.title}
                >
                  Escolha o dia
                </label>
                <div className="relative max-w-xs">
                  <input
                    type="date"
                    value={formData.date}
                    min={brazilianDateInput()}
                    max={brazilianDateInput(MAX_ADVANCE_DAYS)}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full pl-11 pr-4 py-3 text-base border rounded-xl focus:ring-0 transition-all font-bold cursor-pointer"
                    style={T.input}
                  />
                  <CalendarGrowingman
                    className="w-5 h-5 absolute left-4 top-3.5 pointer-events-none"
                    style={T.textMuted}
                  />
                </div>
              </div>

              {formData.date && (
                <div
                  className="pt-4 border-t"
                  style={T.border}
                >
                  <label
                    className="flex items-center justify-between text-sm font-bold mb-3"
                    style={T.title}
                  >
                    Horários disponíveis
                    {loadingHours && (
                      <Loader2
                        className="w-4 h-4 animate-spin"
                        style={T.textMuted}
                      />
                    )}
                  </label>

                  {!loadingHours && availableHours.length === 0 ? (
                    <div
                      className="text-sm p-4 rounded-xl border"
                      style={{ ...T.surface, ...T.border, ...T.textMuted }}
                    >
                      Nenhum horário disponível para esta data. Selecione outro
                      dia.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2.5">
                      {availableHours.map((h) => {
                        const selected = formData.time === h;
                        return (
                          <button
                            key={h}
                            onClick={() => {
                              setFormData({ ...formData, time: h });
                              advanceToSection("user");
                            }}
                            className="px-4 py-2.5 rounded-lg border text-sm font-bold transition-all"
                            style={
                              selected
                                ? {
                                    ...T.buttonPrimary,
                                    borderColor: "var(--theme-button-bg)",
                                  }
                                : { ...T.border, ...T.title }
                            }
                          >
                            {h}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. DADOS DO CLIENTE */}
        <div
          ref={(node) => {
            sectionRefs.current.user = node;
          }}
          className={`${sectionStyle} scroll-mt-6 ${!formData.time ? "opacity-50 pointer-events-none" : ""}`}
          style={sectionShell(activeSection === "user")}
        >
          <button
            onClick={() => toggleSection("user")}
            className={headerBtnStyle}
          >
            <div className="flex items-center gap-4">
              {getStepCircle(4, isValidUser, activeSection === "user")}
              <div className="text-left">
                <h3
                  className="font-bold text-lg"
                  style={
                    activeSection === "user" || isValidUser
                      ? T.title
                      : T.textMuted
                  }
                >
                  Seus Dados
                </h3>
                {isValidUser && activeSection !== "user" && (
                  <p
                    className="text-sm font-medium mt-0.5"
                    style={T.textMuted}
                  >
                    {formData.nome.split(" ")[0]} ({formData.telefone})
                  </p>
                )}
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${activeSection === "user" ? "rotate-180" : ""}`}
              style={T.textMuted}
            />
          </button>

          {activeSection === "user" && (
            <div className="px-5 pb-5 pt-2 space-y-5">
              {/* WhatsApp vem primeiro: é a identidade do cliente. Com ele, buscamos
                  o cadastro e preenchemos o nome automaticamente. */}
              <div>
                <label
                  className="block text-sm font-bold mb-2"
                  style={T.title}
                >
                  WhatsApp
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={formData.telefone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        telefone: formatPhone(e.target.value),
                      })
                    }
                    placeholder="(11) 99999-9999"
                    maxLength={16}
                    className="w-full pl-11 pr-4 py-3 text-base border rounded-xl focus:outline-none transition-all font-medium"
                    style={T.input}
                  />
                  <Phone
                    className="w-5 h-5 absolute left-4 top-3.5 pointer-events-none"
                    style={T.textMuted}
                  />
                </div>
                {formData.telefone.length > 0 && !phoneValid && (
                  <p className="text-xs mt-1.5 font-medium text-red-400">
                    Telefone inválido. Use DDD + número.
                  </p>
                )}
              </div>

              <div>
                <label
                  className="block text-sm font-bold mb-2"
                  style={T.title}
                >
                  Nome Completo
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    placeholder="Ex: João Silva"
                    className="w-full pl-11 pr-4 py-3 text-base border rounded-xl focus:outline-none transition-all font-medium"
                    style={T.input}
                  />
                  <User
                    className="w-5 h-5 absolute left-4 top-3.5 pointer-events-none"
                    style={T.textMuted}
                  />
                </div>
                {knownClient && (
                  <p
                    className="text-xs mt-1.5 font-medium"
                    style={T.textMuted}
                  >
                    Bem-vindo de volta, {knownClient}! Confirme seu nome
                    completo para continuar.
                  </p>
                )}
                {formData.nome.trim().length > 0 && !isValidName && (
                  <p className="text-xs mt-1.5 font-medium text-red-400">
                    Informe nome e sobrenome.
                  </p>
                )}
              </div>

            </div>
          )}
        </div>

        {/* TELA DE CONFIRMAÇÃO (sem pop-up automático, sem timer de navegação) */}
        {confirmed && bookingSummary && (
          <div
            ref={confirmationRef}
            className={`${sectionStyle} scroll-mt-6`}
            style={{ ...T.surface, ...T.borderStrong }}
          >
            <div className="px-6 py-8 flex flex-col items-center text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ ...T.buttonPrimary }}
              >
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4
                className="text-2xl font-extrabold mb-1"
                style={T.title}
              >
                Agendamento confirmado! ✓
              </h4>
              <p
                className="font-medium text-sm mb-6"
                style={T.textMuted}
              >
                Seu horário foi reservado. Nos vemos em breve!
              </p>

              <div
                className="w-full rounded-xl border p-4 mb-6 text-left space-y-2"
                style={{ ...T.card, ...T.border }}
              >
                <div className="flex justify-between text-sm">
                  <span
                    className="font-medium"
                    style={T.textMuted}
                  >
                    Serviço
                  </span>
                  <span
                    className="font-bold"
                    style={T.title}
                  >
                    {bookingSummary.serviceName}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span
                    className="font-medium"
                    style={T.textMuted}
                  >
                    Profissional
                  </span>
                  <span
                    className="font-bold"
                    style={T.title}
                  >
                    {bookingSummary.barberName}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span
                    className="font-medium"
                    style={T.textMuted}
                  >
                    Data
                  </span>
                  <span
                    className="font-bold"
                    style={T.title}
                  >
                    {bookingSummary.dateLabel}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span
                    className="font-medium"
                    style={T.textMuted}
                  >
                    Horário
                  </span>
                  <span
                    className="font-bold"
                    style={T.title}
                  >
                    {bookingSummary.time}
                  </span>
                </div>
                <div
                  className="flex justify-between text-sm pt-2 border-t"
                  style={T.border}
                >
                  <span
                    className="font-medium"
                    style={T.textMuted}
                  >
                    Total
                  </span>
                  <span
                    className="font-extrabold"
                    style={T.title}
                  >
                    R$ {bookingSummary.price.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="w-full flex flex-col gap-3">
                {bookingSummary.barberPhone && (
                  <button
                    onClick={openWhatsApp}
                    className="w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 hover:opacity-90 active:scale-95"
                    style={T.buttonPrimary}
                  >
                    <MessageCircle className="w-5 h-5" /> Avisar no WhatsApp
                  </button>
                )}
                <button
                  onClick={() => router.push(`/${tenant.slug}`)}
                  className="w-full py-3.5 rounded-xl font-bold border transition-all hover:opacity-90 active:scale-95"
                  style={{ ...T.surfaceStrong, ...T.border, ...T.title }}
                >
                  Voltar ao início
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER BUTTON BOX */}
      {!confirmed && (
        <div
          ref={checkoutRef}
          className={`mt-8 transition-all duration-500 ${isBaseValid ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
        >
          <div
            className="p-6 rounded-2xl shadow-xl border"
            style={{ ...T.card, ...T.border }}
          >
            <div
              className="flex items-center justify-between mb-6"
            >
              <div>
                <p
                  className="text-sm font-medium mb-1"
                  style={T.textMuted}
                >
                  Total do Serviço
                </p>
                <p
                  className="text-2xl font-bold"
                  style={T.title}
                >
                  R$ {getPrice()?.toFixed(2)}
                </p>
              </div>
              <Scissors
                className="w-8 h-8"
                style={T.textMuted}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !isFormComplete}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                loading || !isFormComplete
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:opacity-90 active:scale-95"
              }`}
              style={T.buttonPrimary}
            >
              {loading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <span>Confirmar Agendamento</span>
              )}
            </button>
            <p
              className="text-xs text-center mt-4 font-medium"
              style={T.textMuted}
            >
              O pagamento é combinado diretamente com a barbearia.
            </p>

            {/* LGPD Art. 9º: o titular precisa saber, NO MOMENTO DA COLETA, quem
                trata os dados e para quê. Fica aqui, junto do botão, e não num
                rodapé distante — é neste clique que o dado é entregue. */}
            <p
              className="text-[0.7rem] leading-relaxed text-center mt-3"
              style={T.textMuted}
            >
              Ao confirmar, {tenant.name} usa seu nome e telefone para realizar e
              gerenciar este atendimento.
              {tenant.privacy_policy_url ? (
                <>
                  {" "}
                  <a
                    href={tenant.privacy_policy_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:opacity-80"
                  >
                    Política de Privacidade
                  </a>
                  .
                </>
              ) : null}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
