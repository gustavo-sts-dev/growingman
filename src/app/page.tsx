import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  Calendar,
  Scissors,
  MessageSquare,
  CreditCard,
} from "lucide-react";
import Image from "next/image";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between overflow-x-hidden relative selection:bg-white/20">
      {/* Background gradients */}
      <div className="fixed inset-0 -z-10 bg-black" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black" />
      <div className="fixed top-0 left-1/2 -z-10 -translate-x-1/2 w-[80vw] h-[50vh] bg-white/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
          <div className="rounded-lg overflow-hidden flex items-center justify-center">
            <Image
              src={"/logo.png"}
              width={32}
              height={32}
              alt="logomarca"
              className="rounded-lg"
            />
          </div>
          <span className="text-xl font-heading font-bold tracking-tight text-white">
            Growingman
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
          <Link
            href="#features"
            className="hover:text-white transition-colors"
          >
            Funcionalidades
          </Link>
          <Link
            href="#pricing"
            className="hover:text-white transition-colors"
          >
            Planos
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className="hidden sm:inline-flex text-neutral-300"
            >
              Entrar
            </Button>
          </Link>
          <Link href="/onboarding">
            <Button className="rounded-full font-semibold">
              Começar Agora
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-7xl mx-auto px-6 pt-32 pb-20 flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium text-neutral-300 mb-8 backdrop-blur-md">
          <span className="flex h-2 w-2 rounded-full bg-white mr-2"></span>A
          plataforma premium para barbearias
        </div>
        <h1 className="text-5xl md:text-7xl font-heading font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-500 max-w-4xl mb-6 pb-2">
          Sua barbearia, sua marca. <br /> Automatizada e premium.
        </h1>
        <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mb-10 leading-relaxed font-sans">
          Tenha seu próprio aplicativo White-Label. Agendamentos via WhatsApp
          com IA, split de pagamentos automático e a experiência que seus
          clientes merecem.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/onboarding">
            <Button
              size="lg"
              className="h-14 px-8 rounded-full text-base font-semibold w-full sm:w-auto shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] transition-all"
            >
              Criar minha conta agora <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            className="h-14 px-8 rounded-full text-base font-medium w-full sm:w-auto border-white/10 hover:bg-white/5"
          >
            Falar com consultor
          </Button>
        </div>

        {/* Mockup Preview Area */}
        <div className="w-full max-w-5xl mt-24 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
          <div className="aspect-video w-full rounded-2xl glass-card border border-white/10 overflow-hidden relative flex items-center justify-center bg-black/40">
            {/* Minimalist Dashboard Mock */}
            <div className="w-full h-full flex flex-col items-center justify-center p-8 opacity-80">
              <div className="w-full max-w-3xl flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-neutral-800" />
                  <div>
                    <div className="w-32 h-4 bg-neutral-800 rounded mb-2" />
                    <div className="w-24 h-3 bg-neutral-900 rounded" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-24 h-8 bg-neutral-800 rounded-lg" />
                  <div className="w-8 h-8 bg-neutral-800 rounded-lg" />
                </div>
              </div>
              <div className="w-full max-w-3xl grid grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-32 rounded-xl bg-neutral-900/50 border border-white/5 p-4 flex flex-col justify-end"
                  >
                    <div className="w-full h-2 bg-neutral-800 rounded mb-2" />
                    <div className="w-2/3 h-2 bg-neutral-800 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="w-full bg-neutral-950 py-32 border-y border-white/5 relative z-10"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">
              Tudo que seu negócio precisa
            </h2>
            <p className="text-neutral-400 text-lg max-w-2xl">
              Desenvolvemos as ferramentas essenciais para você escalar sua
              barbearia com tecnologia de ponta e zero dor de cabeça.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card p-8 rounded-2xl transition-transform hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">
                Agendamentos Inteligentes
              </h3>
              <p className="text-neutral-400 leading-relaxed">
                Seus clientes agendam 24/7 através do seu próprio aplicativo ou
                link. Reduza as faltas com lembretes automáticos.
              </p>
            </div>

            <div className="glass-card p-8 rounded-2xl transition-transform hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">IA no WhatsApp</h3>
              <p className="text-neutral-400 leading-relaxed">
                Um assistente virtual com a sua marca que responde clientes, faz
                agendamentos e tira dúvidas diretamente no WhatsApp.
              </p>
            </div>

            <div className="glass-card p-8 rounded-2xl transition-transform hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Split de Pagamentos</h3>
              <p className="text-neutral-400 leading-relaxed">
                A comissão do barbeiro e a sua parte caem diretamente nas
                respectivas contas via Pix. Sem necessidade de repasses manuais.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="w-full py-32 relative z-10"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">
              Investimento Simples e Transparente
            </h2>
            <p className="text-neutral-400 text-lg max-w-2xl">
              Escolha o plano ideal para o tamanho da sua barbearia. Sem taxas
              ocultas, cancele quando quiser.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Starter Plan */}
            <div className="glass-card rounded-3xl p-8 border-white/5 flex flex-col">
              <h3 className="text-2xl font-bold mb-2">Essencial</h3>
              <p className="text-neutral-400 mb-6">
                Para barbearias em crescimento
              </p>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl font-bold">R$ 149</span>
                <span className="text-neutral-500 font-medium">/mês</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  "Até 3 barbeiros",
                  "Agendamento Online",
                  "Lembretes via WhatsApp",
                  "Dashboard Financeiro",
                  "Suporte via Email",
                ].map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-neutral-300"
                  >
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl border-white/20 text-white hover:bg-white/10"
              >
                Começar Teste Grátis
              </Button>
            </div>

            {/* Premium Plan */}
            <div className="glass-card rounded-3xl p-8 border-white/20 relative flex flex-col shadow-[0_0_50px_rgba(255,255,255,0.05)] bg-white/5">
              <div className="absolute top-0 right-8 -translate-y-1/2 px-3 py-1 bg-white text-black text-xs font-bold rounded-full uppercase tracking-wider">
                Recomendado
              </div>
              <h3 className="text-2xl font-bold mb-2">Growingman Premium</h3>
              <p className="text-neutral-400 mb-6">Para líderes de mercado</p>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl font-bold">R$ 299</span>
                <span className="text-neutral-500 font-medium">/mês</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  "Barbeiros Ilimitados",
                  "App White-Label Customizado",
                  "Atendimento IA Completo",
                  "Split de Pagamento Pix",
                  "Suporte Prioritário VIP",
                  "Relatórios Avançados",
                ].map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-neutral-300"
                  >
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/onboarding">
                <Button className="w-full h-12 rounded-xl text-base font-semibold shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  Assinar Premium
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-12 z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-white/50" />
            <span className="font-heading font-bold text-white/50">
              Growingman SaaS
            </span>
          </div>
          <p className="text-neutral-500 text-sm">
            © 2026 Growingman. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </main>
  );
}
