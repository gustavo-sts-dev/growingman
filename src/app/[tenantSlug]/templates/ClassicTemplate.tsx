import {
  Scissors,
  Clock,
  Star,
  MapPin,
  Calendar as CalendarGrowingman,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { TenantLogo } from "@/components/TenantLogo";
import { HeroGlow } from "@/components/HeroGlow";
import {
  isSiteSectionVisible,
  normalizeSiteLayout,
  siteSectionOrder,
} from "@/lib/site-layout";
import { bookingHref, type TemplateProps, formatPrice, realStats } from "./types";

/**
 * CLÁSSICO — barbearia premium tradicional.
 * Hero centralizado e imponente, faixa de estatísticas, serviços em cartões
 * preenchidos, equipe em avatares, avaliações. Layout equilibrado e "cheio".
 */
export function ClassicTemplate({ tenant, services, barbers }: TemplateProps) {
  const stats = realStats(tenant);
  const headline = (tenant.page_headline?.trim() || tenant.name).toUpperCase();
  const sub =
    tenant.page_subheadline?.trim() ||
    tenant.description ||
    "Experiência premium em cada detalhe. Do corte clássico ao acabamento perfeito.";

  const heading = { fontFamily: "var(--font-heading)" };
  const border = "color-mix(in srgb, var(--theme-text) 12%, transparent)";
  const layout = normalizeSiteLayout(tenant.site_layout, "classic", {
    stats: tenant.show_stats,
    team: tenant.show_team,
  });
  const heroCentered = layout.hero.alignment === "center";
  const heroHeight = layout.hero.mobileHeight === "screen" ? "min-h-[100svh]" : "min-h-[72svh]";

  return (
    <div className="flex flex-col" style={{ fontFamily: "var(--font-body)" }}>
      {/* HERO */}
      <section
        className={`relative flex flex-col overflow-hidden md:min-h-[88vh] ${heroHeight}`}
        style={{
          order: siteSectionOrder(layout, "hero"),
          backgroundColor: "var(--theme-bg)",
        }}
      >
        {/* Malha de gradientes desfocados, tirada do tema. */}
        <HeroGlow className="absolute inset-0" />
        <nav className="relative z-10 flex items-center justify-between px-5 pt-5 md:px-12 md:pt-7">
          <div className="flex items-center gap-2.5">
            <TenantLogo
              logoUrl={tenant.logo_url}
              className="w-9 h-9 rounded-lg"
              fallbackBg="var(--theme-button-bg)"
              fallbackColor="var(--theme-button-text)"
              alt={tenant.name}
            />
            <span
              className="font-bold text-lg tracking-tight"
              style={{ ...heading, color: "var(--theme-title)" }}
            >
              {tenant.name}
            </span>
          </div>
          <div
            className="flex min-w-0 max-w-[44vw] items-center gap-2 text-sm sm:max-w-none"
            style={{ color: "var(--theme-text)" }}
          >
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{tenant.address || "Brasil"}</span>
          </div>
        </nav>

        <div className={`relative z-10 flex flex-1 flex-col justify-start px-5 pb-12 pt-[clamp(4.5rem,13svh,7rem)] md:justify-center md:px-6 md:py-16 ${heroCentered ? "items-center text-center" : "items-start text-left md:px-12"}`}>
          <div
            className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium md:mb-8"
            style={{
              border: `1px solid ${border}`,
              color: "var(--theme-text)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: "var(--theme-accent)" }}
            />
            Agendamento online disponível
          </div>
          <h1
            className="mb-5 break-words text-[clamp(2.75rem,14vw,4rem)] font-black leading-[0.92] tracking-[-0.03em] md:mb-6 md:text-[clamp(3.2rem,11vw,8rem)]"
            style={{ ...heading, color: "var(--theme-title)" }}
          >
            {headline}
          </h1>
          <p
            className="mb-8 max-w-lg text-base leading-relaxed md:mb-10 md:text-xl"
            style={{ color: "var(--theme-text)" }}
          >
            {sub}
          </p>
          <Link
            href={`/${tenant.slug}/agendar`}
            className="inline-flex w-full max-w-xs items-center justify-center gap-2.5 rounded-full px-8 py-4 text-sm font-bold shadow-xl transition-all hover:opacity-90 sm:w-auto"
            style={{
              backgroundColor: "var(--theme-button-bg)",
              color: "var(--theme-button-text)",
            }}
          >
            Agendar Agora <CalendarGrowingman className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* STATS */}
      {isSiteSectionVisible(layout, "stats") && stats.length > 0 && (
        <div
          className="py-6 border-y"
          style={{
            order: siteSectionOrder(layout, "stats"),
            borderColor: border,
            backgroundColor:
              "color-mix(in srgb, var(--theme-text) 2%, transparent)",
          }}
        >
          <div
            className={`max-w-5xl mx-auto px-6 grid gap-4 ${stats.length === 1 ? "grid-cols-1" : stats.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}
          >
            {stats.map((s) => (
              <div
                key={s.label}
                className="text-center"
              >
                <div
                  className="text-3xl font-black tracking-tight mb-1"
                  style={{ ...heading, color: "var(--theme-title)" }}
                >
                  {s.value}
                </div>
                <div
                  className="text-xs uppercase tracking-wider"
                  style={{ color: "var(--theme-text)", opacity: 0.7 }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SERVICES */}
      <section
        id="servicos"
        className="py-24 px-6"
        style={{
          order: siteSectionOrder(layout, "services"),
          background:
            "linear-gradient(to bottom, color-mix(in srgb, var(--theme-text) 3%, transparent), transparent)",
        }}
      >
        <div className="max-w-5xl mx-auto">
          <p
            className="text-xs uppercase tracking-[0.2em] font-semibold mb-3"
            style={{ color: "var(--theme-accent)" }}
          >
            Catálogo
          </p>
          <h2
            className="text-4xl font-black tracking-tight mb-12"
            style={{ ...heading, color: "var(--theme-title)" }}
          >
            Nossos Serviços
          </h2>
          {services.length === 0 ? (
            <p style={{ color: "var(--theme-text)" }}>
              Nenhum serviço cadastrado ainda.
            </p>
          ) : (
            <div className="grid gap-3">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className="flex flex-col gap-4 p-5 rounded-2xl border sm:flex-row sm:items-center sm:justify-between md:p-6"
                  style={{
                    backgroundColor: "var(--theme-card)",
                    borderColor: border,
                  }}
                >
                  <div className="flex items-center gap-5">
                    <div
                      className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 overflow-hidden relative"
                      style={{
                        backgroundColor:
                          "color-mix(in srgb, var(--theme-text) 5%, transparent)",
                        borderColor: border,
                      }}
                    >
                      {svc.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={svc.image_url}
                          alt={svc.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Scissors
                          className="w-5 h-5"
                          style={{ color: "var(--theme-text)" }}
                        />
                      )}
                    </div>
                    <div>
                      <h3
                        className="font-bold text-base"
                        style={{ ...heading, color: "var(--theme-title)" }}
                      >
                        {svc.name}
                      </h3>
                      <div
                        className="flex items-center gap-1 mt-1 text-xs"
                        style={{ color: "var(--theme-text)" }}
                      >
                        <Clock className="w-3 h-3" /> {svc.duration_minutes} min
                      </div>
                    </div>
                  </div>
                  <div className="flex w-full items-center justify-between gap-3 sm:ml-4 sm:w-auto sm:justify-start sm:gap-4">
                    <p
                      className="font-black text-base sm:text-lg tracking-tight"
                      style={{ ...heading, color: "var(--theme-title)" }}
                    >
                      {formatPrice(Number(svc.base_price))}
                    </p>
                    <Link
                      href={bookingHref(tenant.slug, svc.id)}
                      className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--theme-bg)]"
                      style={{
                        backgroundColor: "var(--theme-button-bg)",
                        color: "var(--theme-button-text)",
                      }}
                    >
                      Agendar
                      <ChevronRight
                        className="w-4 h-4"
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* TEAM */}
      {isSiteSectionVisible(layout, "team") && barbers.length > 0 && (
        <section
          id="equipe"
          className="py-24 px-6"
          style={{ order: siteSectionOrder(layout, "team") }}
        >
          <div className="max-w-5xl mx-auto">
            <p
              className="text-xs uppercase tracking-[0.2em] font-semibold mb-3"
              style={{ color: "var(--theme-accent)" }}
            >
              Nossa Equipe
            </p>
            <h2
              className="text-4xl font-black tracking-tight mb-12"
              style={{ ...heading, color: "var(--theme-title)" }}
            >
              Profissionais de Elite
            </h2>
            <div className="flex gap-5 overflow-x-auto pb-4">
              {barbers.map((b) => (
                <div
                  key={b.id}
                  className="w-[200px] min-w-[200px] shrink-0"
                >
                  <div
                    className="relative w-full aspect-square rounded-2xl border flex items-center justify-center mb-4 overflow-hidden"
                    style={{
                      backgroundColor: "var(--theme-card)",
                      borderColor: border,
                    }}
                  >
                    {b.avatarUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={b.avatarUrl}
                        alt={b.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span
                        className="text-5xl font-black opacity-50"
                        style={{ ...heading, color: "var(--theme-title)" }}
                      >
                        {b.name.charAt(0)}
                      </span>
                    )}
                    <div
                      className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full border-2"
                      style={{
                        backgroundColor: "var(--theme-accent)",
                        borderColor: "var(--theme-card)",
                      }}
                    />
                  </div>
                  <h3
                    className="font-bold text-base"
                    style={{ ...heading, color: "var(--theme-title)" }}
                  >
                    {b.name}
                  </h3>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--theme-text)" }}
                  >
                    Barbeiro Profissional
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <ClassicFooter
        tenant={tenant}
        heading={heading}
        border={border}
        showCta={isSiteSectionVisible(layout, "cta")}
        ctaOrder={siteSectionOrder(layout, "cta")}
      />
    </div>
  );
}

function ClassicFooter({
  tenant,
  heading,
  border,
  showCta,
  ctaOrder,
}: {
  tenant: TemplateProps["tenant"];
  heading: React.CSSProperties;
  border: string;
  showCta: boolean;
  ctaOrder: number;
}) {
  return (
    <>
      {showCta && <section className="py-24 px-6" style={{ order: ctaOrder }}>
        <div
          className="max-w-3xl mx-auto text-center p-12 rounded-3xl border"
          style={{ backgroundColor: "var(--theme-card)", borderColor: border }}
        >
          <Star
            className="w-6 h-6 mx-auto mb-4"
            style={{ color: "var(--theme-accent)" }}
          />
          <h2
            className="text-4xl md:text-5xl font-black tracking-tight mb-4"
            style={{ ...heading, color: "var(--theme-title)" }}
          >
            Pronto para o<br />
            melhor corte da sua vida?
          </h2>
          <Link
            href={`/${tenant.slug}/agendar`}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all mt-4"
            style={{
              backgroundColor: "var(--theme-button-bg)",
              color: "var(--theme-button-text)",
            }}
          >
            <CalendarGrowingman className="w-5 h-5" /> Agendar Horário
          </Link>
        </div>
      </section>}
      <footer
        className="border-t py-8 px-6"
        style={{ borderColor: border, order: 100 }}
      >
        <div
          className="max-w-5xl mx-auto flex items-center justify-between text-sm"
          style={{ color: "var(--theme-text)" }}
        >
          <span
            className="font-bold"
            style={{ ...heading, color: "var(--theme-title)" }}
          >
            {tenant.name}
          </span>
          <p>
            Powered by{" "}
            <span
              className="font-bold"
              style={{ color: "var(--theme-title)" }}
            >
              Growingman
            </span>
          </p>
        </div>
      </footer>
    </>
  );
}
