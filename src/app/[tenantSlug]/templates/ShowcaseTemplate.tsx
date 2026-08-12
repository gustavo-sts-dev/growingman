import Link from "next/link";
import { TenantLogo } from "@/components/TenantLogo";
import Silk from "@/components/Silk";
import { bookingHref, type TemplateProps, formatPrice } from "./types";

/**
 * VITRINE (showcase) — imersivo e fotográfico.
 * Hero de tela cheia com imagem de fundo e título condensado gigante; serviços
 * em mosaico/grade densa de cartões; forte apelo visual. Sem imagem, usa um
 * fundo tonal do tema (degradê) para manter o impacto.
 */
export function ShowcaseTemplate({ tenant, services, barbers }: TemplateProps) {
  const headline = (tenant.page_headline?.trim() || tenant.name).toUpperCase();
  const sub =
    tenant.page_subheadline?.trim() ||
    tenant.description ||
    "Estilo é atitude. Agende o seu.";
  const hero = tenant.hero_image_url?.trim() || null;

  // Oswald é condensada — "cond" reforça a verticalidade do template.
  const cond = {
    fontFamily: "var(--font-heading)",
    letterSpacing: "0.01em",
  } as React.CSSProperties;
  const border = "color-mix(in srgb, var(--theme-text) 12%, transparent)";

  return (
    <div style={{ fontFamily: "var(--font-body)" }}>
      {/* HERO — com imagem ganha altura; sem imagem, o Silk precisa de espaço p/ respirar. */}
      <section
        className={`relative flex flex-col justify-end overflow-hidden ${hero ? "min-h-[70vh]" : "min-h-[60vh]"}`}
      >
        {hero ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, var(--theme-bg) 2%, color-mix(in srgb, var(--theme-bg) 55%, transparent) 45%, color-mix(in srgb, var(--theme-bg) 30%, transparent) 100%)",
              }}
            />
          </>
        ) : (
          <Silk className="absolute inset-0" />
        )}

        <nav className="relative z-10 px-6 md:px-12 pt-7 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <TenantLogo
              logoUrl={tenant.logo_url}
              className="w-10 h-10 rounded-lg"
              fallbackBg="var(--theme-button-bg)"
              fallbackColor="var(--theme-button-text)"
              alt={tenant.name}
            />
            <span
              className="font-semibold text-lg uppercase tracking-wide"
              style={{ ...cond, color: "var(--theme-title)" }}
            >
              {tenant.name}
            </span>
          </div>
          <Link
            href={`/${tenant.slug}/agendar`}
            className="px-5 py-2.5 rounded-sm text-xs font-semibold uppercase tracking-widest"
            style={{
              backgroundColor: "var(--theme-button-bg)",
              color: "var(--theme-button-text)",
            }}
          >
            Agendar
          </Link>
        </nav>

        <div className="relative z-10 max-w-5xl px-6 pb-24 md:px-12 md:pb-36">
          <p
            className="text-xs uppercase tracking-[0.4em] mb-5"
            style={{ color: "var(--theme-accent)" }}
          >
            Barbearia
          </p>
          <h1
            className="uppercase font-bold leading-[0.9] mb-6 text-[clamp(3rem,10vw,7rem)] break-words"
            style={{ ...cond, color: "var(--theme-title)" }}
          >
            {headline}
          </h1>
          <p
            className="text-lg md:text-2xl max-w-xl"
            style={{ color: "var(--theme-text)" }}
          >
            {sub}
          </p>
        </div>
      </section>

      {/* SERVICES — dense mosaic */}
      <section
        id="servicos"
        className="px-6 md:px-12 py-20"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--theme-text) 3%, var(--theme-bg))",
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-2">
            <h2
              className="uppercase font-bold text-4xl md:text-6xl leading-none"
              style={{ ...cond, color: "var(--theme-title)" }}
            >
              Serviços
            </h2>
            <p
              className="text-xs uppercase tracking-[0.25em]"
              style={{ color: "var(--theme-accent)" }}
            >
              {services.length} opções
            </p>
          </div>
          {services.length === 0 ? (
            <p style={{ color: "var(--theme-text)" }}>
              Nenhum serviço cadastrado ainda.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className="p-5 flex flex-col justify-between min-h-[150px] rounded-sm border transition-colors hover:border-[color-mix(in_srgb,var(--theme-accent)_50%,transparent)] relative overflow-hidden"
                  style={{
                    backgroundColor: "var(--theme-card)",
                    borderColor: border,
                  }}
                >
                  {svc.image_url && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={svc.image_url}
                      alt={svc.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-20"
                    />
                  )}
                  <div className="relative z-10">
                    <h3
                      className="uppercase font-semibold text-lg leading-tight"
                      style={{ ...cond, color: "var(--theme-title)" }}
                    >
                      {svc.name}
                    </h3>
                    <p
                      className="text-xs uppercase tracking-wide mt-1"
                      style={{ color: "var(--theme-text)" }}
                    >
                      {svc.duration_minutes} min
                    </p>
                  </div>
                  <div className="relative z-10 mt-4 flex flex-col items-start gap-3 md:flex-row md:items-end md:justify-between">
                    <p
                      className="font-bold text-2xl"
                      style={{ ...cond, color: "var(--theme-accent)" }}
                    >
                      {formatPrice(Number(svc.base_price))}
                    </p>
                    <Link
                      href={bookingHref(tenant.slug, svc.id)}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-sm px-4 text-sm font-semibold uppercase tracking-wide transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--theme-card)] md:w-auto"
                      style={{
                        backgroundColor: "var(--theme-button-bg)",
                        color: "var(--theme-button-text)",
                      }}
                    >
                      Agendar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* TEAM — photo tiles */}
      {barbers.length > 0 && (
        <section
          id="equipe"
          className="px-6 md:px-12 py-20"
        >
          <div className="max-w-6xl mx-auto">
            <h2
              className="uppercase font-bold text-4xl md:text-6xl leading-none mb-8"
              style={{ ...cond, color: "var(--theme-title)" }}
            >
              Equipe
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
              {barbers.map((b) => (
                <div
                  key={b.id}
                  className="relative aspect-[3/4] rounded-sm overflow-hidden flex items-end p-4"
                  style={{
                    background:
                      "linear-gradient(to top, color-mix(in srgb, var(--theme-accent) 22%, var(--theme-card)), var(--theme-card))",
                  }}
                >
                  {b.avatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={b.avatarUrl}
                      alt={b.name}
                      className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80"
                    />
                  ) : (
                    <span
                      className="absolute top-3 right-4 text-6xl font-bold opacity-20"
                      style={{ ...cond, color: "var(--theme-title)" }}
                    >
                      {b.name.charAt(0)}
                    </span>
                  )}
                  <p
                    className="uppercase font-semibold text-sm relative z-10"
                    style={{ ...cond, color: "var(--theme-title)" }}
                  >
                    {b.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA band */}
      <section
        className="px-6 md:px-12 py-24 text-center"
        style={{ backgroundColor: "var(--theme-accent)" }}
      >
        <h2
          className="uppercase font-bold text-4xl md:text-6xl mb-6"
          style={{ ...cond, color: "var(--theme-bg)" }}
        >
          Bora marcar?
        </h2>
        <Link
          href={`/${tenant.slug}/agendar`}
          className="inline-block px-10 py-4 rounded-sm font-bold uppercase tracking-widest text-sm"
          style={{
            backgroundColor: "var(--theme-bg)",
            color: "var(--theme-title)",
          }}
        >
          Agendar Agora
        </Link>
      </section>
      <footer
        className="px-6 md:px-12 py-6 flex items-center justify-between text-xs uppercase tracking-widest"
        style={{ color: "var(--theme-text)" }}
      >
        <span style={{ ...cond, color: "var(--theme-title)" }}>
          {tenant.name}
        </span>
        <span>Powered by Growingman</span>
      </footer>
    </div>
  );
}
