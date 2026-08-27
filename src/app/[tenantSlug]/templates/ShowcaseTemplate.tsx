import Link from "next/link";
import { TenantLogo } from "@/components/TenantLogo";
import { HeroGlow } from "@/components/HeroGlow";
import {
  isSiteSectionVisible,
  normalizeSiteLayout,
  siteSectionOrder,
} from "@/lib/site-layout";
import { bookingHref, type TemplateProps, formatPrice } from "./types";
import { TenantFooterLinks } from "./TenantFooterLinks";

/**
 * VITRINE (showcase) — imersivo e fotográfico.
 * Hero de tela cheia com título condensado gigante sobre a malha tonal do
 * tema; serviços em mosaico/grade densa de cartões; forte apelo visual.
 */
export function ShowcaseTemplate({ tenant, services, barbers }: TemplateProps) {
  const headline = (tenant.page_headline?.trim() || tenant.name).toUpperCase();
  const sub =
    tenant.page_subheadline?.trim() ||
    tenant.description ||
    "Estilo é atitude. Agende o seu.";

  // Oswald é condensada — "cond" reforça a verticalidade do template.
  const cond = {
    fontFamily: "var(--font-heading)",
    letterSpacing: "0.01em",
  } as React.CSSProperties;
  const border = "color-mix(in srgb, var(--theme-text) 12%, transparent)";
  const layout = normalizeSiteLayout(tenant.site_layout, "showcase", {
    team: tenant.show_team,
  });
  const heroCentered = layout.hero.alignment === "center";
  const mobileHeroHeight =
    layout.hero.mobileHeight === "screen" ? "min-h-[100svh]" : "min-h-[64svh]";

  return (
    <div className="flex flex-col" style={{ fontFamily: "var(--font-body)" }}>
      {/* HERO — tipografia sobre a malha do tema. */}
      <section
        className={`relative flex flex-col overflow-hidden md:justify-end md:min-h-[60vh] ${mobileHeroHeight}`}
        style={{
          order: siteSectionOrder(layout, "hero"),
          backgroundColor: "var(--theme-bg)",
        }}
      >
        <HeroGlow className="absolute inset-0" />

        <nav className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5 md:relative md:inset-auto md:z-10 md:mb-4 md:px-12 md:pb-0 md:pt-7">
          <div className="flex min-w-0 items-center gap-2.5">
            <TenantLogo
              logoUrl={tenant.logo_url}
              className="h-9 w-9 rounded-lg md:h-10 md:w-10"
              fallbackBg="var(--theme-button-bg)"
              fallbackColor="var(--theme-button-text)"
              alt={tenant.name}
            />
            <span
              className="truncate text-base font-semibold uppercase tracking-wide md:text-lg"
              style={{ ...cond, color: "var(--theme-title)" }}
            >
              {tenant.name}
            </span>
          </div>
          <Link
            href={`/${tenant.slug}/agendar`}
            className="ml-3 inline-flex min-h-11 shrink-0 items-center rounded-sm px-4 py-2.5 text-xs font-semibold uppercase tracking-widest md:px-5"
            style={{
              backgroundColor: "var(--theme-button-bg)",
              color: "var(--theme-button-text)",
            }}
          >
            Agendar
          </Link>
        </nav>

        <div className={`relative z-10 mt-auto max-w-5xl px-5 pb-[clamp(7rem,18svh,9rem)] pt-28 md:mt-0 md:px-12 md:pb-36 md:pt-0 ${heroCentered ? "mx-auto text-center" : ""}`}>
          <p
            className="mb-4 text-xs uppercase tracking-[0.32em] md:mb-5 md:tracking-[0.4em]"
            style={{ color: "var(--theme-accent)" }}
          >
            Barbearia
          </p>
          <h1
            className="mb-5 break-words text-[clamp(2.75rem,13vw,4.5rem)] font-bold uppercase leading-[0.9] md:mb-6 md:text-[clamp(3rem,10vw,7rem)]"
            style={{ ...cond, color: "var(--theme-title)" }}
          >
            {headline}
          </h1>
          <p
            className={`max-w-xl text-base leading-relaxed md:text-2xl md:leading-normal ${heroCentered ? "mx-auto" : ""}`}
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
          order: siteSectionOrder(layout, "services"),
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
                  className="p-5 flex flex-col justify-between min-h-[150px] rounded-sm border transition-colors hover:border-[color-mix(in_srgb,var(--theme-accent)_50%,transparent)] overflow-hidden"
                  style={{
                    backgroundColor: "var(--theme-card)",
                    borderColor: border,
                  }}
                >
                  {/* Foto e identificação formam UM bloco: o cartão usa
                      justify-between, então três filhos soltos ganhariam vãos
                      distribuídos entre si em vez de imagem+título no topo e
                      preço embaixo. */}
                  <div>
                    {/* A foto entra como imagem normal. Antes ficava esticada
                        por trás do texto a 20% de opacidade: a legibilidade do
                        preço dependia de qual foto foi enviada, e quando ela não
                        carregava o navegador desenhava o alt como marca d'água
                        atravessando o cartão. */}
                    {svc.image_url && (
                      <div
                        className="mb-4 aspect-[16/10] w-full overflow-hidden rounded-sm"
                        style={{
                          backgroundColor:
                            "color-mix(in srgb, var(--theme-text) 8%, transparent)",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={svc.image_url}
                          alt=""
                          aria-hidden="true"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
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
                  <div className="mt-4 flex flex-col items-start gap-3 md:flex-row md:items-end md:justify-between">
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
      {isSiteSectionVisible(layout, "team") && barbers.length > 0 && (
        <section
          id="equipe"
          className="px-6 md:px-12 py-20"
          style={{ order: siteSectionOrder(layout, "team") }}
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
                /* A foto do profissional deixou de ser fundo com o nome por
                   cima: agora é imagem normal, e o nome vem abaixo dela. Assim
                   o nome não depende do contraste da foto, e quem não tem foto
                   cadastrada continua com a inicial no mesmo lugar. */
                <div key={b.id} className="flex flex-col gap-2">
                  <div
                    className="aspect-[3/4] overflow-hidden rounded-sm"
                    style={{
                      background:
                        "linear-gradient(to top, color-mix(in srgb, var(--theme-accent) 22%, var(--theme-card)), var(--theme-card))",
                    }}
                  >
                    {b.avatarUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={b.avatarUrl}
                        alt=""
                        aria-hidden="true"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center text-6xl font-bold opacity-20"
                        style={{ ...cond, color: "var(--theme-title)" }}
                        aria-hidden="true"
                      >
                        {b.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <p
                    className="uppercase font-semibold text-sm"
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
      {isSiteSectionVisible(layout, "cta") && <section
        className="px-6 md:px-12 py-24 text-center"
        style={{ backgroundColor: "var(--theme-accent)", order: siteSectionOrder(layout, "cta") }}
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
      </section>}
      <footer
        className="px-6 md:px-12 py-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-xs uppercase tracking-widest"
        style={{ color: "var(--theme-text)", order: 100 }}
      >
        <span style={{ ...cond, color: "var(--theme-title)" }}>
          {tenant.name}
        </span>
        <TenantFooterLinks tenant={tenant} />
        <span>Powered by Growingman</span>
      </footer>
    </div>
  );
}
