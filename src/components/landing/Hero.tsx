import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { DashboardMock } from "./DashboardMock";
import { btn, containerFlush } from "@/components/brand/ui";
import { PRECO_BASE_FMT, PRECO_POR_PROFISSIONAL_FMT } from "@/lib/pricing";

/**
 * As três objeções que aparecem entre ler o título e clicar: quanto custa, se
 * prende, e se dá trabalho instalar. Ficam coladas na ação — a resposta precisa
 * estar no campo de visão do botão, não numa seção lá embaixo.
 *
 * Todas são promessas que o site já sustenta: o preço vem de `lib/pricing`, a
 * ausência de fidelidade está no CTA final e a página pública roda no navegador
 * (ver `Steps`). Nada aqui é reivindicação nova.
 */
const reassurances = [
  `${PRECO_BASE_FMT}/mês + ${PRECO_POR_PROFISSIONAL_FMT} por profissional`,
  "Sem contrato de fidelidade",
  "Sem instalar nada",
];

/**
 * Herói.
 *
 * A promessa vem antes do produto: o título diz o que MUDA para o dono, e não o
 * que o software é.
 *
 * Quem manda na altura é o conteúdo. A versão anterior amarrava o cartão à
 * altura da janela, e como o mock do painel tem tamanho próprio (~470px) e não
 * estica, sobrava uma faixa morta embaixo dele — o vazio cinza que fazia o
 * herói parecer sujo.
 */
export function Hero() {
  return (
    <section className="relative px-3 pt-4 sm:px-6 sm:pt-6">
      {/* Halos desfocados: profundidade atrás do cartão, sem competir com o texto */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-[30rem] w-[52rem] -translate-x-1/2 rounded-full bg-[#0d0c0a]/[0.10] blur-[130px]" />
        <div className="absolute bottom-10 -left-20 size-80 rounded-full bg-[#c9c3b6]/50 blur-[110px]" />
        <div className="absolute bottom-24 -right-16 size-80 rounded-full bg-[#6f6b64]/25 blur-[110px]" />
      </div>

      <div className={`relative ${containerFlush}`}>
        <div className="gm-aurora gm-grain relative overflow-hidden rounded-[1.5rem] shadow-[0_50px_120px_-60px_rgba(13,12,10,0.9)] sm:rounded-[2.25rem] lg:rounded-[2.75rem]">
          <div className="relative z-10 grid items-center gap-10 px-5 pb-12 pt-11 sm:px-9 sm:pb-14 sm:pt-14 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-10 lg:px-14 lg:py-12">
            {/* Coluna da oferta */}
            <div className="relative z-20">
              {/*
                Véu local: some no preto e só aparece se o texto encostar na poça
                de luz. Um véu sobre o cartão inteiro resolveria o mesmo e
                apagaria a curva do gradiente.
              */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-10 -inset-y-8 hidden rounded-[4rem] bg-[radial-gradient(closest-side,rgba(5,5,4,0.75),rgba(5,5,4,0.36)_62%,transparent)] blur-2xl lg:block"
              />

              <div className="relative">
                {/*
                  O título fala de benefício e não diz "barbearia" nem
                  "agendamento". Quem chega frio precisa desse rótulo em algum
                  lugar acima da dobra — é o trabalho desta etiqueta.
                */}
                <p className="gm-rise inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] py-1.5 pl-3 pr-3.5 text-[0.7rem] font-medium tracking-tight text-white/80 backdrop-blur-md sm:text-[0.76rem]">
                  <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-white/70" />
                  Sistema de agendamento para barbearias
                </p>

                {/*
                  Duas linhas declaradas, não quebra automática: "Você só corta."
                  é o fecho e precisa começar linha, como no original.
                */}
                <h1
                  className="gm-rise mt-6 font-heading text-[clamp(2.05rem,min(3.5vw,5.5svh),2.95rem)] font-semibold leading-[1.06] tracking-[-0.035em] text-white sm:mt-7"
                  style={{ animationDelay: "60ms", textShadow: "0 2px 30px rgba(0,0,0,0.35)" }}
                >
                  <span className="block">O cliente marca sozinho.</span>
                  <span className="block bg-[linear-gradient(100deg,#ffffff_10%,#e4e0d8_55%,#b3ada0_100%)] bg-clip-text text-transparent">
                    Você só corta.
                  </span>
                </h1>

                <p
                  className="gm-rise mt-4 max-w-[30rem] text-pretty text-[0.95rem] leading-6 text-white/85 sm:mt-5 sm:text-[1rem] sm:leading-7"
                  style={{ animationDelay: "140ms" }}
                >
                  Um link com a cara da sua barbearia recebe agendamento a qualquer hora e o
                  WhatsApp lembra o cliente antes do horário. Agenda, equipe e caixa no mesmo
                  painel.
                </p>

                <div
                  className="gm-rise mt-7 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5"
                  style={{ animationDelay: "220ms" }}
                >
                  <Link
                    href="/onboarding"
                    className={`${btn.onDarkSolid} w-full sm:w-auto lg:h-[3.25rem] lg:px-7`}
                  >
                    Criar minha barbearia
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                  <Link
                    href="#como-funciona"
                    className="inline-flex items-center gap-1.5 rounded-lg text-[0.9rem] font-medium text-white/75 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  >
                    Ver como funciona
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>

                <ul
                  className="gm-rise mt-6 flex flex-wrap gap-x-5 gap-y-1.5 text-[0.76rem] text-white/70 sm:text-[0.8rem]"
                  style={{ animationDelay: "280ms" }}
                >
                  {reassurances.map((item) => (
                    <li key={item} className="flex items-center gap-1.5">
                      <Check className="size-3.5 shrink-0 text-white/45" strokeWidth={2.5} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Coluna do produto */}
            <div className="gm-rise relative" style={{ animationDelay: "340ms" }} aria-hidden="true">
              {/* A janela passa da coluna e é cortada pela borda: a tela continua para fora */}
              <div className="-mr-5 overflow-hidden rounded-l-[0.9rem] shadow-[0_40px_90px_-35px_rgba(0,0,0,0.95)] sm:-mr-9 sm:rounded-l-[1.15rem] lg:mr-0 lg:w-[124%] lg:rounded-[1.15rem]">
                <DashboardMock />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
