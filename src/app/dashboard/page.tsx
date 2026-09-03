"use client";

import { Button } from "@/components/ui/button";
import {
  Plus,
  TrendingUp,
  Calendar,
  Users,
  ArrowRight,
  Scissors,
  ExternalLink,
  ChevronRight,
  Flame,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { publicUrl, siteHost } from "@/lib/config";
import { RevenueChart } from "@/components/RevenueChart";
import { useToast } from "@/components/ui/toast";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface DashboardStats {
  revenueToday: number;
  bookingsToday: number;
  newCustomersToday: number;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Ambas requisições vão enviar accessToken cookie automaticamente via credentials: include
        const [statsData, tenantData] = await Promise.all([
          apiGet<DashboardStats>("/dashboard/overview").catch(() => null),
          apiGet<Tenant>("/tenants/my").catch(() => null),
        ]);

        if (!statsData) {
          // 401 foi tratado no apiFetch e já redirecionou para /login
          router.push("/login");
          return;
        }

        setStats(statsData);
        setTenant(tenantData);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-white/5 rounded-lg w-1/3" />
          <div className="h-20 bg-white/5 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div>Erro ao carregar dashboard</div>;
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v);

  // Link real da página pública do tenant (ex.: "app.growingman.com.br/growingman"), não
  // um domínio inventado. `appHref` é o link clicável; `appUrl` é só o texto
  // amigável exibido (sem protocolo).
  const appHref = tenant ? publicUrl(`/${tenant.slug}`) : null;
  const appUrl = tenant ? `${siteHost()}/${tenant.slug}` : null;

  /**
   * Copia o link público da barbearia.
   *
   * Copia `appHref` (com protocolo), não o `appUrl` que aparece na tela: colado
   * no WhatsApp, só a versão com `https://` vira link clicável — o texto exibido
   * omite o protocolo por ser mais limpo de ler, mas péssimo de colar.
   */
  const copiarLink = async () => {
    if (!appHref) return;
    try {
      await navigator.clipboard.writeText(appHref);
      setLinkCopiado(true);
      // Volta sozinho: um "copiado" permanente deixa de informar se a segunda
      // cópia funcionou.
      setTimeout(() => setLinkCopiado(false), 2000);
    } catch {
      // `navigator.clipboard` falha em contexto não seguro ou sem permissão.
      toast.error("Não foi possível copiar. Selecione o link e copie à mão.");
    }
  };

  const statCards = [
    {
      label: "Faturamento Hoje",
      value: formatCurrency(stats.revenueToday),
      growingman: TrendingUp,
      href: "/dashboard/financeiro",
      color: "from-emerald-500/10 to-transparent",
      growingmanColor: "text-emerald-400",
      // Ocupa as duas colunas do celular: é o número mais longo (moeda
      // formatada) e o motivo pelo qual se abre esta tela.
      wide: true,
    },
    {
      label: "Agendamentos",
      value: stats.bookingsToday,
      growingman: Calendar,
      href: "/dashboard/agenda",
      color: "from-blue-500/10 to-transparent",
      growingmanColor: "text-blue-400",
    },
    {
      label: "Novos Clientes",
      value: stats.newCustomersToday,
      growingman: Users,
      href: "/dashboard/clientes",
      color: "from-violet-500/10 to-transparent",
      growingmanColor: "text-violet-400",
    },
  ];

  const quickLinks = [
    {
      label: "Gerenciar Serviços",
      desc: "Edite preços e duração",
      href: "/dashboard/servicos",
      growingman: Scissors,
    },
    {
      label: "Ver Profissionais",
      desc: "Equipe e comissões",
      href: "/dashboard/barbeiros",
      growingman: Users,
    },
    {
      label: "Abrir Agenda",
      desc: "Todos os agendamentos",
      href: "/dashboard/agenda",
      growingman: Calendar,
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-600 font-semibold mb-1.5">
            Visão Geral
          </p>
          <h1 className="text-[1.75rem] font-black leading-tight tracking-tight sm:text-3xl">
            {tenant ? `${tenant.name}` : "Seu Painel"}
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Bem-vindo de volta. Aqui está o resumo de hoje.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {appHref && (
            /*
              Copia, não navega.
              Era um link que abria a página pública numa aba nova. Como o cartão
              "Compartilhe seu app" logo abaixo já tem o "Abrir página", nada se
              perde — e aqui, onde o endereço está escrito, copiar é o que se quer
              fazer com ele.
            */
            <button
              type="button"
              onClick={copiarLink}
              title="Copiar link público"
              aria-label={`Copiar link público: ${appUrl}`}
              className="inline-flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-neutral-400 transition-all hover:border-white/20 hover:text-white active:scale-[0.98] sm:h-9 sm:flex-none"
            >
              {/* Só o ícone troca; o endereço continua visível. Trocar o texto por
                  "Copiado" faria o botão mudar de largura e a linha inteira pular. */}
              {linkCopiado ? (
                <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 shrink-0" />
              )}
              {/* O endereço público é longo. Num botão que divide a linha com
                  outro, ele precisa ceder por corte e não por empurrão: sem
                  isso a dupla estoura a largura da tela do celular. */}
              <span className="truncate">{appUrl}</span>
            </button>
          )}
          <Link href="/dashboard/agenda" className="shrink-0">
            <Button className="h-11 rounded-xl bg-white px-4 text-sm font-semibold text-black shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-transform hover:bg-zinc-100 active:scale-[0.98] sm:h-9">
              <Plus className="w-4 h-4 mr-1.5" /> Novo Agendamento
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Stats Grid ────────────────────────────────────── */}
      {/*
        Duas colunas no celular, com o faturamento ocupando a linha inteira.

        Empilhados um por linha, três cartões de 130px consumiam a tela toda
        antes do gráfico: a "visão geral" não mostrava visão nenhuma sem rolar.
        O dinheiro do dia é o número que se abre o app para ver, e é o mais
        largo dos três; os outros dois são contagens curtas e dividem a linha
        seguinte, como nos painéis de aplicativo.
      */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {statCards.map((card) => {
          const Icon = card.growingman;

          return (
            <Link
              key={card.label}
              href={card.href}
              className={`group ${card.wide ? "col-span-2 md:col-span-1" : ""}`}
            >
              <div className="relative h-full overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.04] active:scale-[0.98] sm:p-6">
                {/* bg glow */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-60 group-hover:opacity-100 transition-opacity`}
                />

                <div className="relative">
                  <div className="mb-3 flex items-center justify-between sm:mb-4">
                    <div
                      className={`w-9 h-9 rounded-xl bg-white/5 border border-white/[0.06] flex items-center justify-center ${card.growingmanColor}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-700 group-hover:text-neutral-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="mb-1 text-[0.65rem] font-medium uppercase tracking-wider text-neutral-500 sm:mb-1.5 sm:text-xs">
                    {card.label}
                  </p>
                  <p className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                    {card.value}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Gráfico de receita (últimos 7 dias) ───────────── */}
      <RevenueChart />

      {/* ── Quick Actions ─────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
          Acesso Rápido
        </h2>
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3 md:gap-3">
          {quickLinks.map((item) => {
            const Icon = item.growingman;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex min-h-[4.25rem] items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.05] active:scale-[0.98] active:bg-white/[0.06]"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/[0.06] flex items-center justify-center text-neutral-400 group-hover:text-white group-hover:bg-white/10 transition-all shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-white">{item.label}</p>
                  <p className="text-xs text-neutral-600 mt-0.5">{item.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-700 ml-auto shrink-0 group-hover:text-neutral-400 group-hover:translate-x-0.5 transition-all" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── CTA / App Link Banner ─────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.04)_0%,_transparent_60%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-5 sm:gap-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/5 sm:h-12 sm:w-12">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white mb-0.5">
                Compartilhe seu app
              </h3>
              {/* `break-words`: o link público é uma palavra única e longa, e
                  sem quebra forçada ele empurra o cartão para fora da tela. */}
              <p className="break-words text-sm text-neutral-500">
                {appUrl ? (
                  <>
                    Seu link público:{" "}
                    <span className="text-neutral-300 font-medium">
                      {appUrl}
                    </span>
                  </>
                ) : (
                  "Configure o slug da sua barbearia para ativar o link público."
                )}
              </p>
            </div>
          </div>
          {appHref && (
            <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={copiarLink}
                aria-label="Copiar link público da barbearia"
                className="h-11 flex-1 rounded-xl border-white/10 bg-white/5 px-4 text-sm font-medium transition-transform hover:bg-white/10 active:scale-[0.98] sm:h-9 sm:flex-none"
              >
                {linkCopiado ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Copiar link
                  </>
                )}
              </Button>

              <Link href={appHref} target="_blank" className="flex-1 sm:flex-none">
                <Button
                  variant="outline"
                  className="h-11 w-full rounded-xl border-white/10 bg-white/5 px-4 text-sm font-medium transition-transform hover:bg-white/10 active:scale-[0.98] sm:h-9"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Abrir página
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
