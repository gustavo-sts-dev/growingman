import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";

const operations = [
  {
    number: "01",
    title: "Agenda pública",
    text: "O cliente escolhe serviço, profissional, data e horário pelo link da barbearia.",
  },
  {
    number: "02",
    title: "Rotina da equipe",
    text: "A agenda reúne atendimentos e bloqueios de horário para cada profissional.",
  },
  {
    number: "03",
    title: "Gestão do negócio",
    text: "Serviços, clientes, estoque e movimentações financeiras ficam no mesmo painel.",
  },
];

const included = [
  "Página de agendamento com a marca da barbearia",
  "Cadastro de serviços, profissionais e clientes",
  "Agenda e bloqueio de horários",
  "Painel financeiro e controle de estoque",
  "Personalização de cores, conteúdo e imagem de capa",
  "Integração opcional com Mercado Pago para cobranças de clientes",
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <header className="border-b border-neutral-900">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Growingman — página inicial">
            <Image src="/logo.png" width={34} height={34} alt="" className="rounded-md" priority />
            <span className="font-heading text-lg font-semibold tracking-tight">Growingman</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-neutral-400 md:flex" aria-label="Navegação principal">
            <Link href="#como-funciona" className="hover:text-white">Como funciona</Link>
            <Link href="#recursos" className="hover:text-white">Recursos</Link>
            <Link href="#plano" className="hover:text-white">Plano</Link>
          </nav>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" asChild className="hidden sm:inline-flex"><Link href="/login">Entrar</Link></Button>
            <Button asChild><Link href="/onboarding">Criar conta</Link></Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-14 px-5 pb-20 pt-16 sm:px-8 md:pb-28 md:pt-24 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
        <div>
          <p className="mb-8 font-mono text-xs uppercase tracking-[0.22em] text-neutral-500">Sistema para barbearias</p>
          <h1 className="max-w-4xl font-heading text-5xl font-semibold leading-[0.98] tracking-[-0.045em] sm:text-6xl md:text-8xl">
            A agenda e a operação da sua barbearia no mesmo lugar.
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-neutral-400 md:text-xl">
            Publique horários, receba agendamentos e acompanhe a rotina da equipe sem depender de planilhas ou mensagens espalhadas.
          </p>
          <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Button size="lg" asChild className="h-13 px-6">
              <Link href="/onboarding">Criar conta e gerar Pix <ArrowRight className="ml-2 size-4" /></Link>
            </Button>
            <span className="text-sm text-neutral-500">Plano único de R$ 299 por mês</span>
          </div>
        </div>

        <aside className="border-l border-neutral-800 pl-6 lg:mb-2" aria-label="Resumo do produto">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">Do link ao atendimento</p>
          <dl className="mt-7 space-y-6">
            <div><dt className="text-sm text-neutral-500">Cliente</dt><dd className="mt-1 text-lg">Agenda pelo navegador</dd></div>
            <div><dt className="text-sm text-neutral-500">Equipe</dt><dd className="mt-1 text-lg">Consulta a própria rotina</dd></div>
            <div><dt className="text-sm text-neutral-500">Gestor</dt><dd className="mt-1 text-lg">Acompanha a operação</dd></div>
          </dl>
        </aside>
      </section>

      <section id="como-funciona" className="border-y border-neutral-900 bg-neutral-950">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
            <header>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-500">Como funciona</p>
              <h2 className="mt-5 max-w-sm font-heading text-3xl font-semibold tracking-tight md:text-5xl">Uma rotina clara, do agendamento ao fechamento.</h2>
            </header>
            <ol className="border-t border-neutral-800">
              {operations.map((item) => (
                <li key={item.number} className="grid gap-4 border-b border-neutral-800 py-7 sm:grid-cols-[4rem_12rem_1fr] sm:items-start">
                  <span className="font-mono text-sm text-neutral-600">{item.number}</span>
                  <h3 className="text-lg font-medium">{item.title}</h3>
                  <p className="max-w-xl leading-7 text-neutral-400">{item.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="recursos" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-500">O que está incluído</p>
            <h2 className="mt-5 max-w-lg font-heading text-3xl font-semibold tracking-tight md:text-5xl">Ferramentas para o trabalho que acontece todos os dias.</h2>
          </div>
          <ul className="border-t border-neutral-800">
            {included.map((item) => (
              <li key={item} className="flex gap-4 border-b border-neutral-800 py-5 text-neutral-300">
                <Check className="mt-0.5 size-4 shrink-0 text-white" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="plano" className="border-t border-neutral-900">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 md:py-28 lg:grid-cols-[1fr_1fr] lg:items-start">
          <header>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-500">Assinatura</p>
            <h2 className="mt-5 font-heading text-4xl font-semibold tracking-tight md:text-6xl">Um plano para toda a operação.</h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-neutral-400">Você informa os dados da barbearia, gera a cobrança Pix e recebe o acesso ao painel.</p>
          </header>

          <div className="border-y border-neutral-700 py-7">
            <div className="flex items-end justify-between gap-6">
              <div><p className="text-sm text-neutral-500">Growingman Premium</p><p className="mt-2 text-2xl font-medium">Operação completa</p></div>
              <p className="text-right"><strong className="text-4xl font-semibold">R$ 299</strong><span className="block text-sm text-neutral-500">por mês</span></p>
            </div>
            <div className="mt-8 border-t border-neutral-800 pt-6">
              <Button size="lg" asChild className="h-13 w-full sm:w-auto"><Link href="/onboarding">Começar cadastro <ArrowRight className="ml-2 size-4" /></Link></Button>
              <p className="mt-4 text-xs leading-5 text-neutral-500">A cobrança inicial é gerada via Pix pelo Asaas e vence em 3 dias.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-10 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2"><Scissors className="size-4" /><span>Growingman</span></div>
          <p>© 2026 Growingman. Todos os direitos reservados.</p>
        </div>
      </footer>
    </main>
  );
}
