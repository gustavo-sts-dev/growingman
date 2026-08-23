"use client";

import { useId, useState } from "react";
import { Table2, BarChart3 } from "lucide-react";

/**
 * Peças de visualização da página de análise.
 *
 * Construídas em HTML/CSS e não numa biblioteca: um ranking é literalmente uma
 * div com largura proporcional, e escrevê-lo à mão dá controle exato sobre as
 * especificações de marca (ponta arredondada de 4px ancorada na base, vão de 2px
 * entre barras, régua sólida de um tom acima da superfície) que uma biblioteca
 * genérica obrigaria a desfazer por CSS.
 *
 * A série temporal é a exceção e usa `react-charts` — é a única com eixo de
 * tempo contínuo, onde ticks e crosshair valem a dependência.
 */

/** Superfície do dashboard: quase preto. As cores foram validadas contra ela. */
export const VIZ = {
  /** Categórico slot 1 — usado em toda medida única. */
  series1: "#3987e5",
  /** Categórico slot 2 — só onde há DUAS categorias na mesma figura. */
  series2: "#d95926",
  good: "#0ca30c",
  warning: "#fab219",
  critical: "#d03b3b",
} as const;

// ── Cartão base ──────────────────────────────────────────────────────────────

export function VizCard({
  title,
  subtitle,
  children,
  table,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Gêmeo em tabela. Todo gráfico tem um — o valor nunca fica só na cor. */
  table?: React.ReactNode;
}) {
  const [showTable, setShowTable] = useState(false);
  const id = useId();

  return (
    <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-sm font-semibold text-neutral-200">{title}</h2>
          {subtitle && (
            <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>
          )}
        </div>

        {table && (
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            aria-pressed={showTable}
            aria-controls={id}
            className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-md border border-white/[0.08] text-[11px] text-neutral-400 hover:text-neutral-200 hover:border-white/20 transition-colors"
          >
            {showTable ? (
              <>
                <BarChart3 className="w-3 h-3" /> Gráfico
              </>
            ) : (
              <>
                <Table2 className="w-3 h-3" /> Tabela
              </>
            )}
          </button>
        )}
      </div>

      <div id={id}>{showTable && table ? table : children}</div>
    </section>
  );
}

// ── Ranking horizontal ───────────────────────────────────────────────────────

export interface RankRow {
  id: string;
  label: string;
  value: number;
  /** Texto já formatado (moeda, contagem…). O componente não decide formato. */
  display: string;
  /** Linha secundária, ex.: "12 atendimentos". */
  meta?: string;
}

/**
 * Barras horizontais para ranking.
 *
 * Uma medida só entre categorias → uma cor só. Oito matizes aqui seria pintar
 * identidade onde a informação é magnitude, e a posição já ordena.
 */
export function RankBars({
  rows,
  empty = "Sem dados no período.",
}: {
  rows: RankRow[];
  empty?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-neutral-500 py-6 text-center">{empty}</p>;
  }

  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    // gap-y de 2px entre barras: vão de superfície, não borda desenhada.
    <div className="flex flex-col gap-3">
      {rows.map((r) => (
        <div key={r.id}>
          <div className="flex items-baseline justify-between gap-3 mb-1.5">
            <span className="text-sm text-neutral-300 truncate">{r.label}</span>
            <span className="text-sm text-neutral-200 tabular-nums shrink-0">
              {r.display}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-sm bg-white/[0.04] overflow-hidden">
              <div
                className="h-full rounded-r-[4px]"
                style={{
                  width: `${Math.max((r.value / max) * 100, r.value > 0 ? 2 : 0)}%`,
                  background: VIZ.series1,
                }}
              />
            </div>
            {r.meta && (
              <span className="text-[11px] text-neutral-600 tabular-nums shrink-0 w-20 text-right">
                {r.meta}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Colunas (distribuições) ──────────────────────────────────────────────────

/** Altura da área de plotagem das colunas, em px. */
const PLOT_H = 140;

export interface ColumnPoint {
  key: string;
  label: string;
  value: number;
}

/**
 * Colunas verticais para distribuição (hora do dia, dia da semana).
 *
 * Rótulo direto só no pico — um número em cima de cada coluna vira ruído e não
 * é lido; o resto vem pelo tooltip e pela tabela.
 */
export function ColumnBars({
  points,
  formatValue,
  empty = "Sem dados no período.",
}: {
  points: ColumnPoint[];
  formatValue: (v: number) => string;
  empty?: string;
}) {
  if (points.length === 0 || points.every((p) => p.value === 0)) {
    return <p className="text-sm text-neutral-500 py-6 text-center">{empty}</p>;
  }

  const max = Math.max(...points.map((p) => p.value), 1);

  return (
    <div className="flex gap-[2px]" role="list">
      {points.map((p) => {
        const isPeak = p.value === max && p.value > 0;
        // Altura em PIXELS, não em porcentagem: um `height: %` só resolve contra
        // um pai de altura definida, e dentro de um flex item ele vira zero —
        // as barras simplesmente sumiam.
        const alturaPx = p.value > 0 ? Math.max(Math.round((p.value / max) * PLOT_H), 3) : 0;

        return (
          <div
            key={p.key}
            role="listitem"
            className="flex-1 flex flex-col items-center gap-1.5 min-w-0 group"
            title={`${p.label}: ${formatValue(p.value)}`}
          >
            {/* Rótulo direto só no pico; o resto aparece no hover e na tabela. */}
            <span
              className={`text-[10px] tabular-nums h-3.5 transition-opacity ${
                isPeak
                  ? "text-neutral-300"
                  : "text-neutral-500 opacity-0 group-hover:opacity-100"
              }`}
            >
              {p.value > 0 ? formatValue(p.value) : ""}
            </span>

            <div
              className="w-full flex items-end"
              style={{ height: PLOT_H }}
            >
              <div
                className="w-full rounded-t-[4px] transition-opacity group-hover:opacity-80"
                style={{
                  height: alturaPx,
                  background: isPeak ? VIZ.series1 : "rgba(57,135,229,0.55)",
                }}
              />
            </div>

            <span className="text-[10px] text-neutral-600 truncate w-full text-center">
              {p.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Tabela gêmea ─────────────────────────────────────────────────────────────

export function VizTable({
  head,
  rows,
}: {
  head: string[];
  rows: Array<Array<string | number>>;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-neutral-500 py-6 text-center">Sem dados.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            {head.map((h, i) => (
              <th
                key={h}
                className={`pb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-600 ${
                  i > 0 ? "text-right" : ""
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-white/[0.04]">
              {r.map((c, j) => (
                <td
                  key={j}
                  className={`py-2 text-neutral-300 ${
                    j > 0 ? "text-right tabular-nums" : ""
                  }`}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
