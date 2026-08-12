import { MapPin, Clock } from "lucide-react";
import Link from "next/link";
import { TenantLogo } from "@/components/TenantLogo";
import Silk from "@/components/Silk";
import { bookingHref, type TemplateProps, formatPrice } from "./types";

/**
 * CONVERSÃO (split) — feito para agendar rápido.
 * Duas colunas: à esquerda a marca + CTA fixos; à direita a lista de serviços
 * com botão "Agendar" por item. Pouca rolagem, ação sempre à vista. Poppins.
 */
export function SplitTemplate({ tenant, services, barbers }: TemplateProps) {
  const headline = tenant.page_headline?.trim() || tenant.name;
  const sub =
    tenant.page_subheadline?.trim() ||
    tenant.description ||
    "Escolha o serviço e reserve em segundos.";
  const hero = tenant.hero_image_url?.trim() || null;
  const geo = { fontFamily: "var(--font-heading)" };
  const border = "color-mix(in srgb, var(--theme-text) 12%, transparent)";

  return (
    <div
      style={{ fontFamily: "var(--font-body)" }}
      className="md:h-screen md:overflow-hidden"
    >
      <div className="md:grid md:grid-cols-2 md:h-full">
        {/* LEFT — brand + CTA (sticky feel) */}
        <div
          className="relative flex min-h-[100svh] flex-col p-5 sm:p-8 md:min-h-0 md:p-12"
          style={{ backgroundColor: "var(--theme-card)" }}
        >
          {hero ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hero}
                alt=""
                aria-hidden
                className="absolute inset-0 w-full h-full object-cover opacity-25"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to bottom, transparent, var(--theme-card))",
                }}
              />
            </>
          ) : (
            /* Sem imagem: fundo de seda animado no painel da marca. */
            <Silk className="absolute inset-0 opacity-60" />
          )}
          <div className="relative z-10 flex min-w-0 items-center gap-3">
            <TenantLogo
              logoUrl={tenant.logo_url}
              className="w-10 h-10 rounded-xl"
              fallbackBg="var(--theme-button-bg)"
              fallbackColor="var(--theme-button-text)"
              alt={tenant.name}
            />
            <span
              className="truncate text-lg font-semibold"
              style={{ ...geo, color: "var(--theme-title)" }}
            >
              {tenant.name}
            </span>
          </div>
          <div className="relative z-10 mt-[clamp(4rem,14svh,7rem)] md:mt-auto">
            <h1
              className="mb-4 break-words text-[clamp(2.35rem,12vw,3.5rem)] font-extrabold leading-[1.02] md:mb-5 md:text-[clamp(2.5rem,6vw,4.5rem)]"
              style={{
                ...geo,
                color: "var(--theme-title)",
                letterSpacing: "-0.02em",
                textWrap: "balance",
              }}
            >
              {headline}
            </h1>
            <p
              className="mb-6 max-w-sm text-base leading-relaxed md:mb-8 md:text-lg"
              style={{ color: "var(--theme-text)" }}
            >
              {sub}
            </p>
            <Link
              href={`/${tenant.slug}/agendar`}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-8 py-4 text-base font-bold transition-all hover:opacity-90 sm:w-auto"
              style={{
                backgroundColor: "var(--theme-button-bg)",
                color: "var(--theme-button-text)",
              }}
            >
              Agendar horário
            </Link>
          </div>
          <p
            className="relative z-10 mt-auto flex items-center gap-1.5 pt-8 text-xs"
            style={{ color: "var(--theme-text)" }}
          >
            <MapPin className="w-3.5 h-3.5" />
            {tenant.address || "Brasil"}
          </p>
        </div>

        {/* RIGHT — service list, own scroll */}
        <div className="p-8 md:p-12 md:overflow-y-auto">
          <p
            className="text-xs uppercase tracking-[0.25em] font-semibold mb-6"
            style={{ color: "var(--theme-accent)" }}
          >
            Reserve agora
          </p>
          {services.length === 0 ? (
            <p style={{ color: "var(--theme-text)" }}>
              Nenhum serviço cadastrado ainda.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className="flex items-center justify-between gap-4 p-4 rounded-2xl border"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--theme-text) 4%, var(--theme-bg))",
                    borderColor: border,
                  }}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {svc.image_url && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={svc.image_url}
                        alt={svc.name}
                        className="w-12 h-12 object-cover rounded-xl shrink-0 hidden sm:block"
                      />
                    )}
                    <div className="min-w-0">
                      <h3
                        className="font-semibold text-base truncate"
                        style={{ ...geo, color: "var(--theme-title)" }}
                      >
                        {svc.name}
                      </h3>
                      <div
                        className="flex items-center gap-2 mt-0.5 text-xs"
                        style={{ color: "var(--theme-text)" }}
                      >
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {svc.duration_minutes}min
                        </span>
                        <span>·</span>
                        <span
                          className="font-semibold"
                          style={{ color: "var(--theme-title)" }}
                        >
                          {formatPrice(Number(svc.base_price))}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={bookingHref(tenant.slug, svc.id)}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--theme-bg)]"
                    style={{
                      backgroundColor: "var(--theme-button-bg)",
                      color: "var(--theme-button-text)",
                    }}
                  >
                    Agendar
                  </Link>
                </div>
              ))}
            </div>
          )}

          {barbers.length > 0 && (
            <div
              className="mt-8 pt-6 border-t"
              style={{ borderColor: border }}
            >
              <p
                className="text-xs uppercase tracking-[0.25em] font-semibold mb-3"
                style={{ color: "var(--theme-accent)" }}
              >
                Equipe
              </p>
              <div className="flex flex-wrap gap-2">
                {barbers.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border"
                    style={{ borderColor: border, color: "var(--theme-title)" }}
                  >
                    {b.avatarUrl && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={b.avatarUrl}
                        alt={b.name}
                        className="w-5 h-5 object-cover rounded-full shrink-0"
                      />
                    )}
                    <span>{b.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p
            className="mt-8 text-xs"
            style={{ color: "var(--theme-text)", opacity: 0.7 }}
          >
            Powered by Growingman
          </p>
        </div>
      </div>
    </div>
  );
}
