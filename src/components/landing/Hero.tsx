import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DashboardMock } from "./DashboardMock";

/**
 * Herói em tela cheia.
 *
 * Não é um cartão: a malha ocupa a janela inteira e a barra do topo flutua por
 * cima dela — daí a margem negativa, que puxa a seção para debaixo da barra.
 *
 * A composição é a da referência, medida sobre a imagem de 2000 × 1144 e
 * convertida para porcentagem da janela (a geometria em si mora em
 * `globals.css`, em `.gm-stage*`):
 *
 *   etiqueta  x 272  → 13,6%    y 337 → 29,5%
 *   título    corpo 70px → 3,5% da largura, entrelinha 1,14
 *   parágrafo corpo 19px → 0,95% da largura, entrelinha 2
 *   ação      altura 48px → 2,4% da largura, cantos redondos
 *   painel    x 1040 → 52%      y 200 → 17,5%, altura 58,5%
 *
 * Os corpos de texto usam `max(rem, cqw)`: proporcionais como no original, mas
 * com um piso — o original vive numa janela de 2000px, e a mesma proporção numa
 * de 1280 daria parágrafo de 12px.
 */
export function Hero() {
  return (
    <section className="gm-stage gm-aurora gm-grain relative -mt-[68px] flex min-h-svh flex-col overflow-hidden pb-16 pt-[92px] sm:-mt-[84px] sm:pb-20 sm:pt-[108px] lg:block lg:pb-0 lg:pt-0">
      {/* Coluna do texto */}
      <div className="gm-stage-copy relative z-10 px-5 sm:px-8">
        <p className="gm-rise inline-flex items-center rounded-full bg-white/[0.09] px-3 py-1.5 text-[0.72rem] font-medium tracking-tight text-white/80 lg:px-[0.9cqw] lg:py-[0.4cqw] lg:text-[max(0.72rem,0.7cqw)]">
          Sistema para barbearias
        </p>

        {/* Duas linhas declaradas: o fecho começa linha, como no original */}
        <h1
          className="gm-rise mt-5 font-heading text-[2.1rem] font-semibold leading-[1.14] tracking-[-0.035em] text-white sm:text-[2.6rem] lg:mt-[1.45cqw] lg:text-[max(2rem,3.05cqw)]"
          style={{ animationDelay: "60ms" }}
        >
          <span className="block">O cliente marca sozinho.</span>
          <span className="block bg-[linear-gradient(100deg,#ffffff_10%,#e4e0d8_55%,#b3ada0_100%)] bg-clip-text text-transparent">
            Você só corta.
          </span>
        </h1>

        <p
          className="gm-rise mt-5 max-w-[32rem] text-pretty text-[0.95rem] leading-7 text-white/80 sm:text-[1rem] lg:mt-[1.9cqw] lg:max-w-none lg:text-[max(0.95rem,0.95cqw)] lg:leading-[2]"
          style={{ animationDelay: "140ms" }}
        >
          Um link com a cara da sua barbearia recebe agendamento a qualquer hora e o WhatsApp lembra
          o cliente antes do horário.
        </p>

        <div className="gm-rise mt-7 lg:mt-[1.8cqw]" style={{ animationDelay: "220ms" }}>
          <Link
            href="/onboarding"
            className="inline-flex h-12 items-center gap-1 rounded-full bg-white px-6 text-[0.85rem] font-semibold tracking-tight text-[#0d0c0a] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)] transition-colors hover:bg-[#f3f1ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 lg:h-[max(2.75rem,2.4cqw)] lg:gap-[0.3cqw] lg:px-[1.6cqw] lg:text-[max(0.8rem,0.8cqw)]"
          >
            Criar minha barbearia
            <ChevronRight className="size-4 lg:size-[max(0.9rem,0.9cqw)]" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/*
        O painel. No celular ele entra no fluxo, empilhado e sangrando pela
        direita; a partir de lg vira a moldura posicionada de `.gm-stage-shot`,
        com o mock escalado por dentro e o excesso cortado.
      */}
      <div
        className="gm-stage-shot gm-rise relative z-0 mt-10 ml-5 overflow-hidden rounded-l-[0.9rem] shadow-[0_40px_90px_-35px_rgba(0,0,0,0.95)] sm:ml-8 sm:rounded-l-[1.15rem]"
        style={{ animationDelay: "340ms" }}
        aria-hidden="true"
      >
        <div className="w-[160%] sm:w-[135%]">
          <DashboardMock />
        </div>
      </div>
    </section>
  );
}
