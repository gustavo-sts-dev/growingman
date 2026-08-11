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
} from "lucide-react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { publicUrl, siteHost } from "@/lib/config";
import { RevenueChart } from "@/components/RevenueChart";
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
      <div className="max-w-5xl mx-auto space-y-8">
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

  const statCards = [
    {
      label: "Faturamento Hoje",
      value: formatCurrency(stats.revenueToday),
      growingman: TrendingUp,
      href: "/dashboard/agenda",
      color: "from-emerald-500/10 to-transparent",
      growingmanColor: "text-emerald-400",
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
      href: "/dashboard/agenda",
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
    <div className="max-w-5xl mx-auto space-y-8">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-600 font-semibold mb-1.5">
            Visão Geral
          </p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {tenant ? `${tenant.name}` : "Seu Painel"}
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Bem-vindo de volta. Aqui está o resumo de hoje.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {appHref && (
            <Link
              href={appHref}
              target="_blank"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-neutral-400 hover:text-white hover:border-white/20 transition-all font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {appUrl}
            </Link>
          )}
          <Link href="/dashboard/agenda">
            <Button className="h-9 px-4 rounded-xl text-sm font-semibold bg-white text-black hover:bg-zinc-100 shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              <Plus className="w-4 h-4 mr-1.5" /> Novo Agendamento
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Stats Grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.growingman;

          return (
            <Link
              key={card.label}
              href={card.href}
              className="group"
            >
              <div className="relative p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300 overflow-hidden">
                {/* bg glow */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-60 group-hover:opacity-100 transition-opacity`}
                />

                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-9 h-9 rounded-xl bg-white/5 border border-white/[0.06] flex items-center justify-center ${card.growingmanColor}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-700 group-hover:text-neutral-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-neutral-500 text-xs font-medium uppercase tracking-wider mb-1.5">
                    {card.label}
                  </p>
                  <p className="text-3xl font-black tracking-tight text-white">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {quickLinks.map((item) => {
            const Icon = item.growingman;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-4 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-200"
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
      <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.04)_0%,_transparent_60%)]" />
        <div className="relative flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/[0.08] flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="font-bold text-white mb-0.5">
                Compartilhe seu app
              </h3>
              <p className="text-sm text-neutral-500">
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
            <Link
              href={appHref}
              target="_blank"
            >
              <Button
                variant="outline"
                className="h-9 px-4 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Abrir página
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
