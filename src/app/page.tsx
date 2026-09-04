import { Features } from "@/components/landing/Features";
import { FinalCta } from "@/components/landing/FinalCta";
import { Hero } from "@/components/landing/Hero";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { Pricing } from "@/components/landing/Pricing";
import { Stats } from "@/components/landing/Stats";
import { Steps } from "@/components/landing/Steps";

/**
 * Página de vendas. O tema claro vive isolado na classe `.gm` (ver globals.css),
 * então o restante do app segue no tema escuro sem ajuste nenhum.
 *
 * Ritmo das seções — claro, claro, escuro, claro, claro, escuro — para que
 * nenhuma dobra pareça a anterior e o olho encontre onde recomeçar a leitura.
 */
export default function LandingPage() {
  /*
   * `overflow-x-clip`, e não `hidden`.
   *
   * Os dois cortam o que vaza na horizontal — os halos desfocados das seções
   * passam da borda de propósito. Mas o CSS promove `overflow-y: visible` para
   * `auto` quando o outro eixo é `hidden`, e isso transforma a div abaixo num
   * contêiner de rolagem: a barra do topo passa a se prender a ELA, que nunca
   * rola por dentro, e o `sticky` deixa de ter efeito. `clip` é o único valor
   * que convive com `visible` sem essa promoção.
   */
  return (
    <div className="gm min-h-dvh overflow-x-clip overflow-y-visible antialiased">
      <LandingHeader />
      <main>
        <Hero />
        <Stats />
        <Steps />
        <Features />
        <Pricing />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
