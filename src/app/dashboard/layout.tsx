"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Scissors, Calendar, Users, Briefcase, BarChart3,
  Settings, Bell, Search, LogOut, ExternalLink, Zap, DollarSign, Star, Package, Menu, X, TrendingUp, CornerDownLeft,
  type LucideIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { TenantLogo } from "@/components/TenantLogo";
import { apiGet, logoutSession } from "@/lib/api";
import type { AuthUser, Tenant } from "@/lib/types";

const navItems = [
  { href: "/dashboard", growingman: BarChart3, label: "Visão Geral", exact: true },
  { href: "/dashboard/agenda", growingman: Calendar, label: "Agenda", exact: false },
  { href: "/dashboard/meu-desempenho", growingman: TrendingUp, label: "Meu Desempenho", exact: false },
  { href: "/dashboard/barbeiros", growingman: Users, label: "Profissionais", exact: false },
  { href: "/dashboard/servicos", growingman: Briefcase, label: "Serviços", exact: true },
  { href: "/dashboard/servicos/estoque", growingman: Package, label: "Estoque", exact: false },
  { href: "/dashboard/financeiro", growingman: DollarSign, label: "Financeiro & PDV", exact: false },
  { href: "/dashboard/clientes", growingman: Star, label: "CRM & Clientes", exact: false },
];

// Itens visíveis para o perfil BARBER (acesso restrito).
const BARBER_ALLOWED = ["/dashboard", "/dashboard/agenda", "/dashboard/meu-desempenho"];

// Itens exclusivos do BARBER (não aparecem para o admin, que já vê o desempenho
// de todos os profissionais pela tela de Profissionais).
const BARBER_ONLY = ["/dashboard/meu-desempenho"];

const settingsItems = [
  { href: "/dashboard/configuracoes", growingman: Settings, label: "Ajustes do App", exact: false },
];

function NavLink({ href, growingman: Growingman, label, exact, onNavigate }: { href: string; growingman: LucideIcon; label: string; exact: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 text-sm group ${
        isActive
          ? "bg-white text-black shadow-[0_2px_12px_rgba(255,255,255,0.15)]"
          : "text-neutral-400 hover:text-white hover:bg-white/8"
      }`}
    >
      <Growingman className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-black' : ''}`} />
      {label}
      {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-black/40" />}
    </Link>
  );
}

/** Todas as telas pesquisáveis pela busca do topo. */
const SEARCHABLE = [...navItems, ...settingsItems];

/** Busca global do topo: filtra os módulos e navega até o selecionado (estilo command palette). */
function TopbarSearch() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const results = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return SEARCHABLE.filter((i) => i.label.toLowerCase().includes(term)).slice(0, 6);
  }, [query]);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const go = (href: string) => {
    setQuery("");
    setOpen(false);
    router.push(href);
  };

  return (
    <div ref={containerRef} className="flex-1 max-w-sm relative">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none" />
      <Input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!results.length) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % results.length); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + results.length) % results.length); }
          else if (e.key === "Enter") { e.preventDefault(); go(results[active].href); }
          else if (e.key === "Escape") { setOpen(false); }
        }}
        className="pl-9 h-9 bg-white/[0.04] border-white/[0.06] rounded-xl text-sm placeholder:text-neutral-600 focus:border-white/20 focus:bg-white/[0.06] transition-colors"
        placeholder="Buscar módulos..."
      />
      {open && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-[0_12px_50px_rgba(0,0,0,0.6)] overflow-hidden z-50 py-1.5">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-neutral-500">Nenhum módulo encontrado.</p>
          ) : (
            results.map((item, i) => {
              const Icon = item.growingman;

              return (
                <button
                  key={item.href}
                  onClick={() => go(item.href)}
                  onMouseEnter={() => setActive(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                    i === active ? "bg-white/8 text-white" : "text-neutral-300 hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-neutral-500" />
                  <span className="flex-1">{item.label}</span>
                  {i === active && <CornerDownLeft className="w-3.5 h-3.5 text-neutral-600" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/** Sino de notificações. Sem backend de notificações ainda: estado vazio honesto. */
function NotificationsBell() {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notificações"
        aria-expanded={open}
        className={`relative w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
          open ? "border-white/20 bg-white/[0.06] text-white" : "border-white/[0.06] bg-white/[0.03] text-neutral-500 hover:text-white hover:border-white/15"
        }`}
      >
        <Bell className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-[0_12px_50px_rgba(0,0,0,0.6)] overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <p className="text-sm font-semibold text-white">Notificações</p>
          </div>
          <div className="px-4 py-8 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.04] flex items-center justify-center">
              <Bell className="w-4 h-4 text-neutral-600" />
            </div>
            <p className="text-sm text-neutral-500">Você está em dia!</p>
            <p className="text-xs text-neutral-600">Novos agendamentos e alertas aparecerão aqui.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [appSlug, setAppSlug] = React.useState<string | null>(null);
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const closeMobile = () => setMobileOpen(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logoutSession();
    } finally {
      // Navegação completa impede que estado/cache autenticado do dashboard
      // sobreviva à troca de sessão.
      window.location.replace("/login");
    }
  };

  React.useEffect(() => {
    apiGet<Tenant>("/tenants/my")
      .then((data) => {
        if (data?.slug) setAppSlug(data.slug);
        setLogoUrl(data?.logo_url ?? null);
      })
      .catch(() => {});

    apiGet<AuthUser>("/auth/me")
      .then((data) => {
        setUser(data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#080808] flex selection:bg-white/20">
      {/* ── Overlay (mobile, quando o drawer está aberto) ────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={closeMobile}
          aria-hidden
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside
        className={`w-[240px] border-r border-white/[0.06] bg-[#080808] flex-col h-screen shrink-0 z-40
          fixed inset-y-0 left-0 transition-transform duration-300 md:sticky md:top-0 md:translate-x-0 md:flex
          ${mobileOpen ? "flex translate-x-0" : "flex -translate-x-full md:translate-x-0"}`}
      >

        {/* Logo + fechar (mobile) */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/[0.06]">
          <Link href="/dashboard" onClick={closeMobile} className="flex items-center gap-2.5 group">
            {logoUrl ? (
              <TenantLogo logoUrl={logoUrl} className="w-8 h-8 rounded-lg" alt="Logo" />
            ) : (
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-[0_0_12px_rgba(255,255,255,0.2)] group-hover:shadow-[0_0_20px_rgba(255,255,255,0.35)] transition-shadow">
                <Scissors className="w-4 h-4 text-black" />
              </div>
            )}
            <span className="font-heading font-black text-lg tracking-tight text-white">Growingman</span>
          </Link>
          <button
            onClick={closeMobile}
            className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-3 overflow-y-auto">
          {/* Live badge */}
          <div className="flex items-center gap-2 px-3 py-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-600">Sistema Ativo</span>
          </div>

          <div className="space-y-0.5 mb-6">
            {navItems
              .filter(item => {
                if (user?.role === "BARBER") {
                  return BARBER_ALLOWED.includes(item.href);
                }
                // Admin (e demais perfis) veem tudo, exceto os itens só-de-barbeiro.
                return !BARBER_ONLY.includes(item.href);
              })
              .map((item) => (
              <NavLink key={item.href} {...item} onNavigate={closeMobile} />
            ))}
          </div>

          {user?.role !== "BARBER" && (
            <>
              <div className="h-px bg-white/[0.06] mx-2 mb-4" />
              <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-[0.15em] px-3 mb-2">Configurações</p>
              <div className="space-y-0.5">
                {settingsItems.map((item) => (
                  <NavLink key={item.href} {...item} onNavigate={closeMobile} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bottom: User + Logout */}
        <div className="p-3 border-t border-white/[0.06] space-y-1">
          {/* Quick link to public page */}
          <Link
            href={appSlug ? `/${appSlug}` : "/"}
            target="_blank"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-neutral-500 hover:text-white hover:bg-white/5 transition-all font-medium group"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Meu App</span>
            <Zap className="w-3 h-3 ml-auto text-yellow-500/70" />
          </Link>

          {/* User info */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-neutral-700 to-neutral-500 shrink-0 flex items-center justify-center text-xs font-bold uppercase">
              {user ? user.name.charAt(0) : "A"}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{user ? user.name : "Carregando..."}</div>
              <div className="text-[11px] text-neutral-500 truncate">{user ? user.role : "..."}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            aria-busy={isLoggingOut}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/10 font-medium transition-all disabled:cursor-wait disabled:opacity-60"
          >
            <LogOut className="w-4 h-4" />
            {isLoggingOut ? "Saindo..." : "Sair da Conta"}
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-white/[0.06] bg-[#080808] sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden w-9 h-9 rounded-xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center text-neutral-400 hover:text-white shrink-0"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <TopbarSearch />
          <div className="flex items-center gap-2">
            <NotificationsBell />
          </div>
        </header>

        {/* Page content
            `overflow-x-clip`: a coluna de conteúdo do painel não rola na
            horizontal — quem rola são os componentes que têm scroller próprio
            (barra de abas, tabelas). Sem isso, qualquer filho que estoure a
            largura arrasta a página inteira junto.

            `clip` e não `hidden` de propósito: `hidden` cria um contexto de
            rolagem e quebraria o `position: sticky` do cabeçalho e dos
            componentes internos. `clip` só corta, sem virar scroller. */}
        <div className="flex-1 overflow-y-auto overflow-x-clip p-4 sm:p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
