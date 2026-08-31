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
  return (
    <div className="gm min-h-dvh overflow-x-hidden overflow-y-visible antialiased">
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
