"use client";

import { useMemo } from "react";
import { Chart } from "react-charts";
import { VIZ } from "./viz";
import type { AnalyticsSeriesPoint } from "@/lib/types";

/**
 * Faturamento ao longo do período.
 *
 * Único gráfico da página que usa `react-charts`: é o que tem eixo de tempo
 * contínuo, onde ticks e crosshair valem a dependência. Os demais são barras
 * em HTML.
 *
 * A biblioteca é do TanStack e sua tipagem publicada é `options: any` — não há
 * checagem alguma sobre o formato dos dados. Por isso o contrato dela fica
 * ISOLADO neste arquivo: o `any` para nesta fronteira, e o resto da página
 * continua tipado. A API da 2.1 é `data` + `axes`, e cada ponto usa
 * `primary`/`secondary` (o par `x`/`y` era da v1).
 *
 * UMA série só, de propósito. Faturamento (R$) e nº de agendamentos têm escalas
 * diferentes, e sobrepô-los exigiria dois eixos verticais — o gráfico que mais
 * engana que existe. A contagem por dia vive na tabela gêmea.
 */
export function RevenueTimeSeries({ points }: { points: AnalyticsSeriesPoint[] }) {
  const data = useMemo(
    () => [
      {
        label: "Faturamento",
        data: points.map((p) => ({
          // Meia-noite BR, alinhado com onde o d3 coloca os ticks de dia.
          //
          // Ancorar ao meio-dia deslocava cada ponto meia casa para a direita do
          // seu rótulo: o pico ficava visualmente entre dois dias e o leitor
          // atribuía o faturamento ao dia errado. O offset explícito -03:00
          // mantém a data correta independente do fuso de quem abre a tela.
          primary: new Date(`${p.date}T00:00:00-03:00`),
          secondary: p.revenue,
        })),
      },
    ],
    [points],
  );

  const axes = useMemo(
    () => [
      {
        primary: true,
        type: "time",
        position: "bottom",
        showGrid: false,
        /**
         * Sem isto o eixo repetia cada data DUAS vezes.
         *
         * O padrão é 10 ticks; num período de 7 dias o d3 atende esse número
         * escolhendo intervalos de 12 horas, e como o rótulo mostra só dia/mês,
         * meia-noite e meio-dia viravam o mesmo texto lado a lado. Pedir no
         * máximo um tick por dia faz o d3 cair num intervalo diário ou maior.
         */
        tickCount: Math.min(points.length, 7),
        format: (d: Date) =>
          d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      },
      {
        type: "linear",
        position: "left",
        // Grade sólida e discreta, um tom acima da superfície.
        showGrid: true,
        tickCount: 5,
        // Sem centavos: "R$ 1.234,00" em cada tick empurra o gráfico para a
        // direita e não acrescenta informação nenhuma numa régua.
        format: (v: number) =>
          `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`,
      },
    ],
    [points.length],
  );

  /**
   * A curva fica na `curveMonotoneX` padrão da biblioteca.
   *
   * Uma reta entre os pontos seria mais literal — faturamento diário é medição
   * discreta, não contínua — mas trocar a curva exigiria `@visx/curve`, que aqui
   * só existe como dependência transitiva do react-charts e não resolve a partir
   * do projeto. A monotônica preserva mínimos e máximos (não inventa pico nem
   * vale que os dados não tenham), então o custo é estético, não de leitura.
   */

  const getSeriesStyle = useMemo(
    () => () => ({
      color: VIZ.series1,
      // Linha de 2px: marca fina, conforme a especificação.
      strokeWidth: 2,
    }),
    [],
  );

  const vazio = points.every((p) => p.revenue === 0);

  return (
    <div className="relative">
      <div className="h-64">
        <Chart
          data={data}
          axes={axes}
          getSeriesStyle={getSeriesStyle}
          tooltip
          dark
        />
      </div>

      {vazio && (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-neutral-500 pointer-events-none">
          Nenhum atendimento concluído no período.
        </p>
      )}
    </div>
  );
}
