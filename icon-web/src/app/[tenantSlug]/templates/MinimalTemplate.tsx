import Link from "next/link";
import { type TemplateProps, formatPrice } from "./types";

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

  return (
    <div style={{ fontFamily: "var(--font-body)" }}>
      <div className="max-w-2xl mx-auto px-6">
        {/* HERO — pure type */}
        <section className="min-h-[80vh] flex flex-col justify-center py-24">
          <p
            className="text-[0.7rem] uppercase tracking-[0.5em] mb-10"
            style={{ color: "var(--theme-text)" }}
          >
            {tenant.address || "Barbearia"}
          </p>
          <h1
            className="mb-8 text-[clamp(2rem,7vw,4rem)]"
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
            className="text-base leading-relaxed max-w-sm mb-12"
            style={{ color: "var(--theme-text)" }}
          >
            {sub}
          </p>
          <Link
            href={`/${tenant.slug}/agendar`}
            className="text-sm uppercase tracking-[0.3em] self-start pb-1.5 border-b transition-opacity hover:opacity-60"
            style={{ color: "var(--theme-title)", borderColor: line }}
          >
            Agendar
          </Link>
        </section>

        {/* SERVICES — hairline list */}
        <section
          id="servicos"
          className="py-16 border-t"
          style={{ borderColor: line }}
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
                        alt={svc.name}
                        className="w-10 h-10 object-cover grayscale hidden sm:block shrink-0"
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
                  <span
                    className="text-base tabular-nums shrink-0 sm:ml-auto"
                    style={{ ...grotesk, color: "var(--theme-title)" }}
                  >
                    {formatPrice(Number(svc.base_price))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* TEAM — plain list */}
        {barbers.length > 0 && (
          <section
            id="equipe"
            className="py-16 border-t"
            style={{ borderColor: line }}
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
                      alt={b.name}
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
        <section
          className="py-24 border-t text-center"
          style={{ borderColor: line }}
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
        </section>

        <footer
          className="py-8 border-t flex items-center justify-between text-[0.7rem] uppercase tracking-[0.2em]"
          style={{ borderColor: line, color: "var(--theme-text)" }}
        >
          <span style={{ color: "var(--theme-title)" }}>{tenant.name}</span>
          <span>Growingman</span>
        </footer>
      </div>
    </div>
  );
}
