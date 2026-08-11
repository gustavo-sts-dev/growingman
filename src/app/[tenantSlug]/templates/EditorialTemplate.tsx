import Link from "next/link";
import { TenantLogo } from "@/components/TenantLogo";
import { bookingHref, type TemplateProps, formatPrice } from "./types";

/**
 * REVISTA (editorial) — cara de editorial de moda.
 * Serifa display enorme, corpo estreito, fios de 1px, numeração de itens,
 * hero à esquerda com imagem lateral opcional, muitíssimo respiro. Assimétrico.
 */
export function EditorialTemplate({
  tenant,
  services,
  barbers,
}: TemplateProps) {
  const headline = tenant.page_headline?.trim() || tenant.name;
  const sub =
    tenant.page_subheadline?.trim() ||
    tenant.description ||
    "Um estúdio dedicado ao ofício. Cada corte, uma assinatura.";
  const hero = tenant.hero_image_url?.trim() || null;

  const serif = { fontFamily: "var(--font-heading)" };
  const line = "color-mix(in srgb, var(--theme-text) 22%, transparent)";

  return (
    <div style={{ fontFamily: "var(--font-body)" }}>
      {/* top rule + masthead */}
      <div
        className="border-b"
        style={{ borderColor: line }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TenantLogo
              logoUrl={tenant.logo_url}
              className="w-8 h-8 rounded-full"
              fallbackBg="var(--theme-button-bg)"
              fallbackColor="var(--theme-button-text)"
              alt={tenant.name}
            />
            <span
              className="text-sm uppercase tracking-[0.35em]"
              style={{ color: "var(--theme-title)" }}
            >
              {tenant.name}
            </span>
          </div>
          <span
            className="text-xs uppercase tracking-[0.25em] hidden sm:block"
            style={{ color: "var(--theme-text)" }}
          >
            {tenant.address || "Est. Growingman"}
          </span>
        </div>
      </div>

      {/* HERO — editorial split */}
      <section className="max-w-6xl mx-auto px-6 md:px-10 pt-16 md:pt-24 pb-20">
        <div
          className={`grid gap-12 ${hero ? "md:grid-cols-[1.3fr_1fr]" : "md:grid-cols-1"} items-end`}
        >
          <div>
            <p
              className="text-xs uppercase tracking-[0.4em] mb-8"
              style={{ color: "var(--theme-accent)" }}
            >
              O Estúdio — Est.
            </p>
            <h1
              className="italic leading-[0.92] mb-8 text-[clamp(3rem,9vw,7.5rem)]"
              style={{
                ...serif,
                color: "var(--theme-title)",
                fontWeight: 500,
                letterSpacing: "-0.02em",
                textWrap: "balance",
              }}
            >
              {headline}
            </h1>
            <p
              className="text-base md:text-lg leading-relaxed max-w-md mb-8"
              style={{ color: "var(--theme-text)" }}
            >
              {sub}
            </p>
            <Link
              href={`/${tenant.slug}/agendar`}
              className="inline-flex items-center -mx-1 px-1 py-3 text-sm uppercase tracking-[0.25em] border-b transition-opacity hover:opacity-70"
              style={{
                color: "var(--theme-title)",
                borderColor: "var(--theme-title)",
              }}
            >
              Agendar um horário →
            </Link>
          </div>
          {hero && (
            <div
              className="w-full aspect-[3/4] overflow-hidden"
              style={{ border: `1px solid ${line}` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hero}
                alt={tenant.name}
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
              />
            </div>
          )}
        </div>
      </section>

      {/* SERVICES — numbered editorial list */}
      <section
        id="servicos"
        className="border-t"
        style={{ borderColor: line }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-20">
          <div className="grid md:grid-cols-[240px_1fr] gap-10">
            <div>
              <h2
                className="italic text-4xl md:text-5xl"
                style={{
                  ...serif,
                  color: "var(--theme-title)",
                  fontWeight: 500,
                }}
              >
                Serviços
              </h2>
              <p
                className="text-xs uppercase tracking-[0.25em] mt-3"
                style={{ color: "var(--theme-text)" }}
              >
                Índice
              </p>
            </div>
            <div>
              {services.length === 0 ? (
                <p style={{ color: "var(--theme-text)" }}>
                  Nenhum serviço cadastrado ainda.
                </p>
              ) : (
                services.map((svc, i) => (
                  <div
                    key={svc.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 py-6 border-t"
                    style={{ borderColor: line }}
                  >
                    <div className="flex items-center gap-5">
                      <span
                        className="text-sm tabular-nums shrink-0"
                        style={{ ...serif, color: "var(--theme-accent)" }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {svc.image_url && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={svc.image_url}
                          alt={svc.name}
                          className="w-16 h-16 object-cover grayscale hover:grayscale-0 transition-all hidden sm:block shrink-0"
                        />
                      )}
                      <div>
                        <h3
                          className="text-xl md:text-2xl italic"
                          style={{
                            ...serif,
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
                          {svc.duration_minutes} minutos
                          {svc.description ? ` — ${svc.description}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex w-full shrink-0 items-center justify-between gap-4 sm:ml-auto sm:w-auto">
                      <span
                        className="text-lg tabular-nums"
                        style={{ ...serif, color: "var(--theme-title)" }}
                      >
                        {formatPrice(Number(svc.base_price))}
                      </span>
                      <Link
                        href={bookingHref(tenant.slug, svc.id)}
                        className="inline-flex min-h-11 items-center justify-center border-b px-1 text-xs font-semibold uppercase tracking-[0.16em] transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                        style={{ color: "var(--theme-title)", borderColor: line }}
                      >
                        Agendar
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* TEAM — editorial credits */}
      {barbers.length > 0 && (
        <section
          id="equipe"
          className="border-t"
          style={{ borderColor: line }}
        >
          <div className="max-w-6xl mx-auto px-6 md:px-10 py-20">
            <h2
              className="italic text-4xl md:text-5xl mb-10"
              style={{ ...serif, color: "var(--theme-title)", fontWeight: 500 }}
            >
              Os Artesãos
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-x-10 gap-y-6">
              {barbers.map((b, i) => (
                <div
                  key={b.id}
                  className="flex items-center gap-4 py-4 border-t"
                  style={{ borderColor: line }}
                >
                  <span
                    className="text-xs tabular-nums shrink-0"
                    style={{ ...serif, color: "var(--theme-accent)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {b.avatarUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={b.avatarUrl}
                      alt={b.name}
                      className="w-12 h-12 object-cover rounded-full grayscale hover:grayscale-0 transition-all shrink-0"
                    />
                  )}
                  <div>
                    <p
                      className="text-lg italic"
                      style={{
                        ...serif,
                        color: "var(--theme-title)",
                        fontWeight: 500,
                      }}
                    >
                      {b.name}
                    </p>
                    <p
                      className="text-xs uppercase tracking-[0.2em] mt-0.5"
                      style={{ color: "var(--theme-text)" }}
                    >
                      Barbeiro
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section
        className="border-t border-b"
        style={{ borderColor: line }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-24 text-center">
          <h2
            className="italic text-[clamp(2.5rem,7vw,5rem)] leading-[0.95] mb-8"
            style={{ ...serif, color: "var(--theme-title)", fontWeight: 500 }}
          >
            Marque a sua
            <br />
            próxima visita
          </h2>
          <Link
            href={`/${tenant.slug}/agendar`}
            className="inline-flex items-center -mx-1 px-1 py-3 text-sm uppercase tracking-[0.3em] border-b transition-opacity hover:opacity-70"
            style={{
              color: "var(--theme-title)",
              borderColor: "var(--theme-title)",
            }}
          >
            Agendar →
          </Link>
        </div>
      </section>
      <footer
        className="max-w-6xl mx-auto px-6 md:px-10 py-6 flex items-center justify-between text-xs uppercase tracking-[0.2em]"
        style={{ color: "var(--theme-text)" }}
      >
        <span style={{ color: "var(--theme-title)" }}>{tenant.name}</span>
        <span>Powered by Growingman</span>
      </footer>
    </div>
  );
}
