"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  Gift,
  Users,
  TrendingDown,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import { useResource } from "@/lib/use-resource";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/format";
import type { ReferralSummary, SubscriptionQuote } from "@/lib/types";

/** Rótulo e cor de cada situação de desconto. */
const DISCOUNT_LABEL = {
  ACTIVE: { text: "Valendo agora", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  PENDING: { text: "Na fila", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  EXPIRED: { text: "Expirado", cls: "bg-neutral-500/10 text-neutral-500 border-neutral-500/20" },
} as const;

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function SubscriptionPage() {
  const toast = useToast();
  // O tipo inclui `null` de propósito: não existe "mensalidade vazia" que faça
  // sentido exibir, então a ausência de dado é um estado próprio da tela.
  const { data: quote, loading: loadingQuote } =
    useResource<SubscriptionQuote | null>("/tenants/my/subscription", null);
  const { data: referral, loading: loadingReferral } =
    useResource<ReferralSummary | null>("/tenants/my/referrals", null);

  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (!referral?.code) return;
    try {
      await navigator.clipboard.writeText(referral.code);
      setCopied(true);
      // Volta ao estado normal sozinho: um "copiado!" permanente deixa de
      // informar se a segunda cópia funcionou.
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar. Selecione o código manualmente.");
    }
  };

  const ativos = referral?.discounts.filter((d) => d.status === "ACTIVE") ?? [];
  const naFila = referral?.discounts.filter((d) => d.status === "PENDING") ?? [];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-[1.6rem] font-semibold leading-tight text-white sm:text-2xl">Assinatura</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Sua mensalidade e o programa de indicação.
        </p>
      </div>

      {/* ── Mensalidade ─────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-neutral-300 mb-4">
          Sua mensalidade
        </h2>

        {loadingQuote || !quote ? (
          <div className="flex items-center gap-2 text-neutral-500 text-sm py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando…
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Plano base</span>
              <span className="text-neutral-200 tabular-nums">
                {formatCurrency(quote.basePrice)}
              </span>
            </div>

            <div className="flex justify-between gap-3 text-sm">
              <span className="min-w-0 text-neutral-400">
                {quote.activeBarbers}{" "}
                {quote.activeBarbers === 1 ? "profissional" : "profissionais"}
                <span className="text-neutral-600">
                  {" "}
                  × {formatCurrency(quote.pricePerBarber)}
                </span>
              </span>
              <span className="shrink-0 tabular-nums text-neutral-200">
                {formatCurrency(quote.pricePerBarber * quote.activeBarbers)}
              </span>
            </div>

            {quote.discountPercent > 0 && (
              <div className="flex justify-between gap-3 border-t border-white/[0.06] pt-3 text-sm">
                <span className="flex min-w-0 items-center gap-1.5 text-emerald-400">
                  <TrendingDown className="w-3.5 h-3.5" />
                  Desconto por indicação ({quote.discountPercent}%)
                </span>
                <span className="text-emerald-400 tabular-nums">
                  −{formatCurrency(quote.discountValue)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-3 border-t border-white/[0.06]">
              <span className="text-sm font-medium text-neutral-300">
                Total por mês
              </span>
              <span className="text-2xl font-semibold text-white tabular-nums">
                {formatCurrency(quote.total)}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* ── Programa de indicação ───────────────────────────────────────── */}
      <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-emerald-500/10 shrink-0">
            <Gift className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-200">
              Indique e ganhe 10%
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Cada barbearia que se cadastrar com o seu código te dá 10% de
              desconto por 3 meses. Acumula até{" "}
              {referral?.maxSimultaneous ?? 5} descontos ao mesmo tempo —
              metade da mensalidade.
            </p>
          </div>
        </div>

        {loadingReferral || !referral ? (
          <div className="flex items-center gap-2 text-neutral-500 text-sm py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando…
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-2 mb-5">
              <div className="flex flex-1 items-center justify-center rounded-lg border border-white/[0.08] bg-black/40 px-4 py-3.5 sm:justify-start sm:py-3">
                {/* `tracking` menor no celular: com 0.2em o código de oito
                    caracteres passava da largura da caixa em telas estreitas. */}
                <code className="font-mono text-lg tracking-[0.12em] text-white sm:tracking-[0.2em]">
                  {referral.code}
                </code>
              </div>
              <button
                onClick={copyCode}
                className="flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-medium text-black transition-all hover:bg-neutral-200 active:scale-[0.98] sm:h-auto sm:py-3"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar código
                  </>
                )}
              </button>
            </div>

            {/* Resumo dos descontos */}
            <div className="mb-5 grid grid-cols-2 gap-2.5 sm:gap-3">
              <div className="rounded-lg bg-black/30 border border-white/[0.06] p-3">
                <div className="text-xs text-neutral-500">Desconto atual</div>
                <div className="text-xl font-semibold text-emerald-400 tabular-nums mt-0.5">
                  {referral.discountPercent}%
                </div>
                <div className="text-[11px] text-neutral-600 mt-0.5">
                  {ativos.length} de {referral.maxSimultaneous} vagas
                </div>
              </div>
              <div className="rounded-lg bg-black/30 border border-white/[0.06] p-3">
                <div className="text-xs text-neutral-500">Na fila</div>
                <div className="text-xl font-semibold text-amber-400 tabular-nums mt-0.5">
                  {naFila.length}
                </div>
                <div className="text-[11px] text-neutral-600 mt-0.5">
                  {naFila.length > 0
                    ? "entram conforme os atuais expiram"
                    : "nenhum aguardando"}
                </div>
              </div>
            </div>

            {/* Lista de descontos */}
            {referral.discounts.length > 0 && (
              <div className="space-y-1.5 mb-5">
                <p className="text-[11px] font-semibold text-neutral-600 uppercase tracking-wider mb-2">
                  Seus descontos
                </p>
                {referral.discounts.map((d) => {
                  const label = DISCOUNT_LABEL[d.status];
                  return (
                    <div
                      key={d.id}
                      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border border-white/[0.04] bg-black/20 px-3 py-2.5"
                    >
                      <span className="text-sm tabular-nums text-neutral-300">
                        {d.percent}%
                      </span>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className="text-xs text-neutral-500">
                          {d.status === "PENDING"
                            ? "prazo começa ao ativar"
                            : `até ${formatDate(d.expiresAt)}`}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border ${label.cls}`}
                        >
                          {label.text}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Barbearias indicadas */}
            <div>
              <p className="text-[11px] font-semibold text-neutral-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3 h-3" />
                Barbearias que você indicou
              </p>

              {referral.referrals.length === 0 ? (
                <p className="text-sm text-neutral-500 py-3">
                  Nenhuma ainda. Compartilhe seu código para começar.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {referral.referrals.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.04] bg-black/20 px-3 py-2.5"
                    >
                      <span className="min-w-0 truncate text-sm text-neutral-300">
                        {r.name}
                      </span>
                      {r.confirmed ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shrink-0">
                          Desconto liberado
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border bg-neutral-500/10 text-neutral-400 border-neutral-500/20 shrink-0 flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Aguardando 1º pagamento
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
