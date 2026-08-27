import Link from "next/link";
import {
  isSiteSectionVisible,
  normalizeSiteLayout,
  siteSectionOrder,
} from "@/lib/site-layout";
import { bookingHref, type TemplateProps, formatPrice } from "./types";
import { TenantFooterLinks } from "./TenantFooterLinks";

/**
 * MINIMALISTA — silêncio e tipografia.
 * Quase sem elementos: nome em letras espaçadas, muito espaço em branco, listas
 * separadas por fios de 1px (nenhuma caixa), sem ícones, sem faixas de cor. A
 * identidade é o vazio e o tracking. Space Grotesk em peso leve.
 */
export function MinimalTemplate({ tenant, services, barbers }: TemplateProps) {
  const headline = tenant.page_headline?.trim() || tenant.name;
  const sub =
    tenant.page_subheadline?.trim() ||
    tenant.description ||
    "Corte e barba, sem excessos.";
  const grotesk = { fontFamily: "var(--font-heading)" };
  const line = "color-mix(in srgb, var(--theme-text) 18%, transparent)";
  const layout = normalizeSiteLayout(tenant.site_layout, "minimal", {
    team: tenant.show_team,
  });
  const heroCentered = layout.hero.alignment === "center";
  const heroHeight = layout.hero.mobileHeight === "screen" ? "min-h-[100svh]" : "min-h-[82svh]";

  return (
    <div style={{ fontFamily: "var(--font-body)" }}>
      <div className="mx-auto flex max-w-2xl flex-col px-5 sm:px-6">
        {/* HERO — pure type */}
        <section
          className={`flex flex-col justify-start pb-16 pt-[clamp(7rem,18svh,10rem)] md:min-h-[80vh] md:justify-center md:py-24 ${heroHeight} ${heroCentered ? "items-center text-center" : ""}`}
          style={{ order: siteSectionOrder(layout, "hero") }}
        >
          <p
            className="mb-7 break-words text-[0.7rem] uppercase tracking-[0.35em] sm:tracking-[0.5em] md:mb-10"
            style={{ color: "var(--theme-text)" }}
          >
            {tenant.address || "Barbearia"}
          </p>
          {/* `w-full`: mesmo caso do Classic — pai `flex flex-col items-center`
              dimensiona o item pelo conteúdo, e nome longo sem espaço estoura a
              tela. Ver o comentário lá para o porquê de `break-words` não bastar. */}
          <h1
            className="mb-6 w-full break-words text-[clamp(2rem,10vw,3rem)] md:mb-8 md:text-[clamp(2rem,7vw,4rem)]"
            style={{
              ...grotesk,
              color: "var(--theme-title)",
              fontWeight: 400,
              letterSpacing: "0.02em",
              lineHeight: 1.1,
              textWrap: "balance",
            }}
          >
            {headline}
          </h1>
          <p
            className="mb-9 max-w-sm text-base leading-relaxed md:mb-12"
            style={{ color: "var(--theme-text)" }}
          >
            {sub}
          </p>
          <Link
            href={`/${tenant.slug}/agendar`}
            className={`inline-flex min-h-11 items-center border-b pb-1.5 text-sm uppercase tracking-[0.25em] transition-opacity hover:opacity-60 sm:tracking-[0.3em] ${heroCentered ? "self-center" : "self-start"}`}
            style={{ color: "var(--theme-title)", borderColor: line }}
          >
            Agendar
          </Link>
        </section>

        {/* SERVICES — hairline list */}
        <section
          id="servicos"
          className="py-16 border-t"
          style={{ borderColor: line, order: siteSectionOrder(layout, "services") }}
        >
          <p
            className="text-[0.7rem] uppercase tracking-[0.4em] mb-10"
            style={{ color: "var(--theme-text)" }}
          >
            Serviços
          </p>
          {services.length === 0 ? (
            <p style={{ color: "var(--theme-text)" }}>
              Nenhum serviço cadastrado ainda.
            </p>
          ) : (
            <div>
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 py-5 border-t"
                  style={{ borderColor: line }}
                >
                  <div className="flex items-center gap-4">
                    {svc.image_url && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={svc.image_url}
                        alt=""
                        aria-hidden="true"
                        className="w-10 h-10 object-cover grayscale shrink-0"
                      />
                    )}
                    <div>
                      <h3
                        className="text-lg"
                        style={{
                          ...grotesk,
                          color: "var(--theme-title)",
                          fontWeight: 500,
                        }}
                      >
                        {svc.name}
                      </h3>
                      <p
                        className="text-xs uppercase tracking-[0.15em] mt-1"
                        style={{ color: "var(--theme-text)" }}
                      >
                        {svc.duration_minutes} min
                      </p>
                    </div>
                  </div>
                  <div className="flex w-full shrink-0 items-center justify-between gap-4 sm:ml-auto sm:w-auto">
                    <span
                      className="text-base tabular-nums"
                      style={{ ...grotesk, color: "var(--theme-title)" }}
                    >
                      {formatPrice(Number(svc.base_price))}
                    </span>
                    <Link
                      href={bookingHref(tenant.slug, svc.id)}
                      className="inline-flex min-h-11 items-center justify-center border-b px-1 text-[0.7rem] font-medium uppercase tracking-[0.2em] transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                      style={{ color: "var(--theme-title)", borderColor: line }}
                    >
                      Agendar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* TEAM — plain list */}
        {isSiteSectionVisible(layout, "team") && barbers.length > 0 && (
          <section
            id="equipe"
            className="py-16 border-t"
            style={{ borderColor: line, order: siteSectionOrder(layout, "team") }}
          >
            <p
              className="text-[0.7rem] uppercase tracking-[0.4em] mb-10"
              style={{ color: "var(--theme-text)" }}
            >
              Equipe
            </p>
            <div className="flex flex-col gap-3">
              {barbers.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-3"
                >
                  {b.avatarUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={b.avatarUrl}
                      alt=""
                      aria-hidden="true"
                      className="w-8 h-8 object-cover rounded-full grayscale shrink-0"
                    />
                  )}
                  <p
                    className="text-lg"
                    style={{
                      ...grotesk,
                      color: "var(--theme-title)",
                      fontWeight: 400,
                    }}
                  >
                    {b.name}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        {isSiteSectionVisible(layout, "cta") && <section
          className="py-24 border-t text-center"
          style={{ borderColor: line, order: siteSectionOrder(layout, "cta") }}
        >
          <Link
            href={`/${tenant.slug}/agendar`}
            className="text-[clamp(1.5rem,5vw,2.5rem)] inline-block transition-opacity hover:opacity-60"
            style={{
              ...grotesk,
              color: "var(--theme-title)",
              fontWeight: 400,
              letterSpacing: "0.02em",
            }}
          >
            Marcar horário →
          </Link>
        </section>}

        <footer
          className="py-8 border-t flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-[0.7rem] uppercase tracking-[0.2em]"
          style={{ borderColor: line, color: "var(--theme-text)", order: 100 }}
        >
          <span style={{ color: "var(--theme-title)" }}>{tenant.name}</span>
          <TenantFooterLinks tenant={tenant} />
          <span>Growingman</span>
        </footer>
      </div>
    </div>
  );
}
