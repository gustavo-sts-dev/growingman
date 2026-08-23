"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { VIZ } from "./viz";
import type { AnalyticsSeriesPoint } from "@/lib/types";

/**
 * Faturamento ao longo do período.
 *
 * Desenhado em SVG, sem biblioteca de gráficos.
 *
 * A primeira versão usava `react-charts`, e ela QUEBROU em produção: a cadeia de
 * dependências dele (`@visx/responsive` → `lodash`, mais `performance-now`)
 * executa `Function("return this")()` para descobrir o objeto global, e a
 * Content Security Policy do site não permite `unsafe-eval`. A página inteira
 * deixava de carregar — não era um gráfico feio, era um erro fatal.
 *
 * A alternativa seria abrir `unsafe-eval` na CSP, o que enfraqueceria a política
 * do aplicativo inteiro para acomodar um único gráfico. Não vale: uma linha com
 * eixos e tooltip cabe em SVG, e o resto da página já era desenhado assim.
 *
 * UMA série só, de propósito. Faturamento (R$) e nº de agendamentos têm escalas
 * diferentes, e sobrepô-los exigiria dois eixos verticais — o gráfico que mais
 * engana que existe. A contagem por dia vive no tooltip e na tabela gêmea.
 */

/** Espaço reservado para os rótulos, em px. */
const PAD = { top: 16, right: 16, bottom: 28, left: 60 };
const HEIGHT = 240;
const Y_TICKS = 4;

/** Arredonda o topo do eixo para um número redondo acima do máximo. */
function niceMax(valor: number): number {
  if (valor <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(valor));
  return Math.ceil(valor / magnitude) * magnitude;
}

function ddmm(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export function RevenueTimeSeries({ points }: { points: AnalyticsSeriesPoint[] }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  // Mede o container em vez de assumir uma largura: o cartão muda de tamanho
  // com a janela, e um viewBox fixo esticaria o texto junto com o desenho.
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;

    const medir = () => setWidth(el.clientWidth);
    medir();

    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /**
   * Índice válido do ponto sob o cursor.
   *
   * Derivado, e não sincronizado por effect: quando o filtro encolhe o período,
   * o índice guardado pode apontar para um dia que não existe mais. Zerar isso
   * num `useEffect` custaria um render extra e ainda deixaria um quadro
   * intermediário lendo `points[i]` fora da faixa — checar aqui resolve antes de
   * qualquer leitura.
   */
  const idx = hover !== null && hover < points.length ? hover : null;

  const vazio = points.length === 0 || points.every((p) => p.revenue === 0);
  const plotW = Math.max(width - PAD.left - PAD.right, 0);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const topo = niceMax(Math.max(...points.map((p) => p.revenue), 0));

  // Um único ponto não tem intervalo: dividir por (n-1) daria divisão por zero.
  const x = (i: number) =>
    PAD.left + (points.length > 1 ? (i / (points.length - 1)) * plotW : plotW / 2);
  const y = (v: number) => PAD.top + plotH - (v / topo) * plotH;

  /**
   * Quantos rótulos cabem no eixo X sem colidir.
   *
   * ~48px por rótulo ("30/12" mais respiro). Um período de 90 dias com um rótulo
   * por dia viraria uma tarja ilegível.
   */
  const passoRotulo = Math.max(
    1,
    Math.ceil(points.length / Math.max(1, Math.floor(plotW / 48))),
  );

  const aoMover = (e: React.MouseEvent<SVGRectElement>) => {
    if (points.length === 0 || plotW <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = e.clientX - rect.left;
    const i = Math.round((rel / rect.width) * (points.length - 1));
    setHover(Math.min(Math.max(i, 0), points.length - 1));
  };

  const aoTeclado = (e: React.KeyboardEvent<SVGSVGElement>) => {
    // Teclado mostra o mesmo que o mouse: o valor não pode existir só no hover.
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const passo = e.key === "ArrowRight" ? 1 : -1;
    setHover((h) => {
      const base = h ?? 0;
      return Math.min(Math.max(base + passo, 0), points.length - 1);
    });
  };

  const ativo = idx !== null ? points[idx] : null;

  return (
    <div ref={boxRef} className="relative w-full">
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          tabIndex={0}
          aria-label="Faturamento por dia no período"
          onKeyDown={aoTeclado}
          onBlur={() => setHover(null)}
          className="rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
        >
          {/* Grade e rótulos do eixo Y. Hairline sólida, um tom acima do fundo. */}
          {Array.from({ length: Y_TICKS + 1 }, (_, i) => {
            const v = (topo / Y_TICKS) * i;
            const gy = y(v);
            return (
              <g key={i}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={gy}
                  y2={gy}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 10}
                  y={gy + 4}
                  textAnchor="end"
                  className="fill-neutral-600"
                  style={{ fontSize: 11 }}
                >
                  {`R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`}
                </text>
              </g>
            );
          })}

          {/* Rótulos do eixo X. */}
          {points.map((p, i) =>
            i % passoRotulo === 0 || i === points.length - 1 ? (
              <text
                key={p.date}
                x={x(i)}
                y={HEIGHT - 8}
                textAnchor="middle"
                className="fill-neutral-600"
                style={{ fontSize: 11 }}
              >
                {ddmm(p.date)}
              </text>
            ) : null,
          )}

          {!vazio && points.length > 0 && (
            <>
              {/* A série. Reta entre os pontos: faturamento diário é medição
                  discreta — não existe "meio da terça" com valor intermediário. */}
              <polyline
                fill="none"
                stroke={VIZ.series1}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                points={points.map((p, i) => `${x(i)},${y(p.revenue)}`).join(" ")}
              />

              {/* Crosshair + marcador do ponto sob o cursor. */}
              {ativo && idx !== null && (
                <>
                  <line
                    x1={x(idx)}
                    x2={x(idx)}
                    y1={PAD.top}
                    y2={PAD.top + plotH}
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth={1}
                  />
                  <circle
                    cx={x(idx)}
                    cy={y(ativo.revenue)}
                    r={5}
                    fill={VIZ.series1}
                    // Anel da cor da superfície separa o marcador da linha.
                    stroke="#0d0d0d"
                    strokeWidth={2}
                  />
                </>
              )}
            </>
          )}

          {/* Captura do mouse por cima de tudo — alvo largo, não o traço fino. */}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={plotW}
            height={plotH}
            fill="transparent"
            onMouseMove={aoMover}
            onMouseLeave={() => setHover(null)}
          />
        </svg>
      )}

      {/* Tooltip em HTML, não em SVG: texto, quebra de linha e sombra saem de
          graça, e ele não é cortado ao passar da borda do desenho. */}
      {ativo && idx !== null && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-white/[0.08] bg-black/90 px-3 py-2 shadow-lg"
          style={{
            left: Math.min(Math.max(x(idx) - 60, 0), Math.max(width - 130, 0)),
            top: 0,
          }}
        >
          <div className="text-[11px] text-neutral-500">
            {new Date(`${ativo.date}T12:00:00`).toLocaleDateString("pt-BR", {
              weekday: "short",
              day: "2-digit",
              month: "short",
            })}
          </div>
          <div className="text-sm font-semibold tabular-nums text-white">
            {formatCurrency(ativo.revenue)}
          </div>
          <div className="text-[11px] tabular-nums text-neutral-500">
            {ativo.bookings} {ativo.bookings === 1 ? "agendamento" : "agendamentos"}
          </div>
        </div>
      )}

      {vazio && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-neutral-500">
          Nenhum atendimento concluído no período.
        </p>
      )}
    </div>
  );
}
