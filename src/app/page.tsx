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
    <main className="min-h-screen overflow-x-hidden bg-black text-neutral-100 selection:bg-[#c8b78f] selection:text-black">
      <header className="relative z-20 border-b border-neutral-900/90 bg-black">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-3" aria-label="Growingman — página inicial">
            <Image src="/logo.png" width={34} height={34} alt="" className="rounded-md" priority />
            <span className="font-heading text-lg font-semibold tracking-[-0.02em]">Growingman</span>
          </Link>
          <nav className="hidden items-center gap-9 text-sm text-neutral-400 md:flex" aria-label="Navegação principal">
            <Link href="#como-funciona" className="transition-colors hover:text-white">Como funciona</Link>
            <Link href="#recursos" className="transition-colors hover:text-white">Recursos</Link>
            <Link href="#plano" className="transition-colors hover:text-white">Plano</Link>
          </nav>
          <div className="flex items-center gap-1 sm:gap-3">
            <Button variant="ghost" asChild className="hidden sm:inline-flex"><Link href="/login">Entrar</Link></Button>
            <Button asChild><Link href="/onboarding">Criar conta</Link></Button>
          </div>
        </div>
      </header>

      <section className="bg-[linear-gradient(180deg,#000_0%,#000_38%,#4f4638_100%)]">
        <div className="mx-auto grid min-h-[calc(100svh-5rem)] max-w-7xl gap-16 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.65fr)] lg:items-center lg:gap-20 lg:px-10 lg:py-24">
          <div className="max-w-4xl">
            <p className="mb-7 font-mono text-[0.69rem] uppercase tracking-[0.24em] text-[#c8b78f] sm:mb-9">Sistema para barbearias</p>
            <h1 className="text-balance font-heading text-[clamp(3.35rem,7.1vw,6.75rem)] font-semibold leading-[0.91] tracking-[-0.052em] text-neutral-50">
              A agenda e a operação da sua barbearia no mesmo lugar.
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-7 text-neutral-400 sm:text-lg sm:leading-8 md:mt-9">
              Publique horários, receba agendamentos e acompanhe a rotina da equipe sem depender de planilhas ou mensagens espalhadas.
            </p>
            <div className="mt-9 flex flex-col items-start gap-4 sm:mt-10 sm:flex-row sm:items-center sm:gap-5">
              <Button size="lg" asChild className="h-13 px-6 shadow-[0_10px_35px_rgba(0,0,0,0.35)]">
                <Link href="/onboarding">Criar conta e gerar Pix <ArrowRight className="ml-2 size-4" /></Link>
              </Button>
              <span className="text-sm leading-6 text-neutral-500">Plano único · R$ 299 por mês</span>
            </div>
          </div>

          <aside className="w-full max-w-md border-t border-neutral-800 pt-7 lg:justify-self-end lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0" aria-label="Resumo do produto">
            <p className="font-mono text-[0.69rem] uppercase tracking-[0.22em] text-[#c8b78f]">Do link ao atendimento</p>
            <dl className="mt-6 border-t border-neutral-800/80">
              <div className="grid grid-cols-[4.5rem_1fr] gap-4 border-b border-neutral-800/80 py-5">
                <dt className="text-sm text-neutral-500">Cliente</dt>
                <dd className="font-medium leading-6 text-neutral-100">Agenda pelo navegador</dd>
              </div>
              <div className="grid grid-cols-[4.5rem_1fr] gap-4 border-b border-neutral-800/80 py-5">
                <dt className="text-sm text-neutral-500">Equipe</dt>
                <dd className="font-medium leading-6 text-neutral-100">Consulta a própria rotina</dd>
              </div>
              <div className="grid grid-cols-[4.5rem_1fr] gap-4 border-b border-neutral-800/80 py-5">
                <dt className="text-sm text-neutral-500">Gestor</dt>
                <dd className="font-medium leading-6 text-neutral-100">Acompanha a operação</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section id="como-funciona" className="bg-[linear-gradient(180deg,#4f4638_0%,#000_100%)]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <header>
              <p className="font-mono text-[0.69rem] uppercase tracking-[0.22em] text-[#c8b78f]">Como funciona</p>
              <h2 className="mt-5 max-w-md font-heading text-3xl font-semibold leading-[1.05] tracking-[-0.035em] text-neutral-100 md:text-5xl">Uma rotina clara, do agendamento ao fechamento.</h2>
            </header>
            <ol className="border-t border-neutral-800">
              {operations.map((item) => (
                <li key={item.number} className="grid gap-3 border-b border-neutral-800 py-7 sm:grid-cols-[3.5rem_11rem_1fr] sm:items-start sm:gap-5">
                  <span className="font-mono text-xs text-[#c8b78f]">{item.number}</span>
                  <h3 className="text-lg font-medium text-neutral-100">{item.title}</h3>
                  <p className="max-w-xl leading-7 text-neutral-400">{item.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="recursos" className="bg-[linear-gradient(180deg,#000_0%,#4f4638_100%)]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <div>
            <p className="font-mono text-[0.69rem] uppercase tracking-[0.22em] text-[#c8b78f]">O que está incluído</p>
            <h2 className="mt-5 max-w-lg font-heading text-3xl font-semibold leading-[1.05] tracking-[-0.035em] text-neutral-100 md:text-5xl">Ferramentas para o trabalho que acontece todos os dias.</h2>
          </div>
          <ul className="border-t border-neutral-800">
            {included.map((item) => (
              <li key={item} className="flex gap-4 border-b border-neutral-800 py-5 leading-7 text-neutral-300">
                <Check className="mt-1 size-4 shrink-0 text-[#c8b78f]" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          </div>
        </div>
      </section>

      <section id="plano" className="bg-[linear-gradient(180deg,#4f4638_0%,#000_100%)]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 md:py-28 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-24 lg:px-10">
          <header>
            <p className="font-mono text-[0.69rem] uppercase tracking-[0.22em] text-[#c8b78f]">Assinatura</p>
            <h2 className="mt-5 font-heading text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-neutral-100 md:text-6xl">Um plano para toda a operação.</h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-neutral-400 sm:text-lg sm:leading-8">Você informa os dados da barbearia, gera a cobrança Pix e recebe o acesso ao painel.</p>
          </header>

          <div className="border-y border-neutral-700 py-7 sm:py-8">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
              <div><p className="text-sm text-neutral-500">Growingman Premium</p><p className="mt-2 text-2xl font-medium">Operação completa</p></div>
              <p className="sm:text-right"><strong className="text-4xl font-semibold tracking-[-0.035em]">R$ 299</strong><span className="mt-1 block text-sm text-neutral-500">por mês</span></p>
            </div>
            <div className="mt-8 border-t border-neutral-800 pt-7">
              <Button size="lg" asChild className="h-13 w-full sm:w-auto"><Link href="/onboarding">Começar cadastro <ArrowRight className="ml-2 size-4" /></Link></Button>
              <p className="mt-4 text-xs leading-5 text-neutral-500">A cobrança inicial é gerada via Pix pelo Asaas e vence em 3 dias.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-10 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <div className="flex items-center gap-2"><Scissors className="size-4" /><span>Growingman</span></div>
          <p>© 2026 Growingman. Todos os direitos reservados.</p>
        </div>
      </footer>
    </main>
  );
}
