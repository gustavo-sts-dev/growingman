"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Scissors, Calendar, Users, Briefcase, BarChart3,
  Settings, Bell, Search, LogOut, ExternalLink, Zap, DollarSign, Star, Package, Menu, X, TrendingUp, CornerDownLeft, CreditCard, PieChart,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { TenantLogo } from "@/components/TenantLogo";
import { apiGet, logoutSession } from "@/lib/api";
import type { AuthUser, Tenant } from "@/lib/types";

/*
  `short`: o mesmo destino escrito para caber num rótulo de 64px na barra
  inferior do celular. "Financeiro & PDV" vira "Caixa" ali e continua
  "Financeiro & PDV" na barra lateral — abreviar nos dois lugares empobreceria
  o menu do desktop, que tem espaço de sobra.
*/
const navItems = [
  { href: "/dashboard", growingman: BarChart3, label: "Visão Geral", short: "Início", exact: true },
  { href: "/dashboard/agenda", growingman: Calendar, label: "Agenda", short: "Agenda", exact: false },
  { href: "/dashboard/meu-desempenho", growingman: TrendingUp, label: "Meu Desempenho", short: "Desempenho", exact: false },
  { href: "/dashboard/barbeiros", growingman: Users, label: "Profissionais", short: "Equipe", exact: false },
  { href: "/dashboard/servicos", growingman: Briefcase, label: "Serviços", short: "Serviços", exact: true },
  { href: "/dashboard/servicos/estoque", growingman: Package, label: "Estoque", short: "Estoque", exact: false },
  { href: "/dashboard/financeiro", growingman: DollarSign, label: "Financeiro & PDV", short: "Caixa", exact: false },
  { href: "/dashboard/clientes", growingman: Star, label: "CRM & Clientes", short: "Clientes", exact: false },
  { href: "/dashboard/analise", growingman: PieChart, label: "Análise", short: "Análise", exact: false },
];

/**
 * Destinos da barra inferior do celular, por perfil.
 *
 * Num app de telefone a navegação principal fica ao alcance do polegar, não
 * atrás de um botão no canto superior esquerdo — o ponto mais distante da mão
 * que segura o aparelho. São as telas de uso diário; o resto continua no menu
 * completo, que a última aba abre.
 */
const TAB_BAR_ADMIN = [
  "/dashboard",
  "/dashboard/agenda",
  "/dashboard/financeiro",
  "/dashboard/clientes",
];
const TAB_BAR_BARBER = [
  "/dashboard",
  "/dashboard/agenda",
  "/dashboard/meu-desempenho",
];

// Itens visíveis para o perfil BARBER (acesso restrito).
const BARBER_ALLOWED = ["/dashboard", "/dashboard/agenda", "/dashboard/meu-desempenho"];

// Itens exclusivos do BARBER (não aparecem para o admin, que já vê o desempenho
// de todos os profissionais pela tela de Profissionais).
const BARBER_ONLY = ["/dashboard/meu-desempenho"];

const settingsItems = [
  // Fica no bloco de Configurações porque este bloco inteiro já é escondido do
  // perfil BARBER — mensalidade e código de indicação são assunto do dono.
  { href: "/dashboard/assinatura", growingman: CreditCard, label: "Assinatura", short: "Assinatura", exact: false },
  { href: "/dashboard/configuracoes", growingman: Settings, label: "Ajustes do App", short: "Ajustes", exact: false },
];

/**
 * Título da tela atual, para a barra de navegação do celular.
 *
 * Sem ele o topo do app não diz onde a pessoa está: no desktop a barra lateral
 * responde isso o tempo todo, mas no telefone ela some, e o título da página
 * fica abaixo da dobra assim que se rola um pouco. Ganha a rota mais específica
 * — `/dashboard/servicos/estoque` casaria com "Serviços" e com "Estoque", e é
 * "Estoque" que a pessoa está vendo.
 */
function useCurrentTitle(): string {
  const pathname = usePathname();
  return React.useMemo(() => {
    const match = [...navItems, ...settingsItems]
      .filter((i) => (i.exact ? pathname === i.href : pathname.startsWith(i.href)))
      .sort((a, b) => b.href.length - a.href.length)[0];
    return match?.short ?? "Painel";
  }, [pathname]);
}

/**
 * `true` abaixo do ponto de corte `md`, onde a barra lateral vira gaveta.
 *
 * Existe para uma decisão que o CSS não alcança: marcar a gaveta fechada como
 * `inert`. Uma classe pode escondê-la da vista, mas não do foco do teclado nem
 * do leitor de tela — e uma gaveta fechada com nove links tabuláveis antes do
 * conteúdo é uma armadilha para quem navega assim.
 *
 * Começa `false` no servidor e no primeiro render do cliente porque não há
 * largura de janela para consultar antes de montar; a correção no efeito não
 * causa divergência de hidratação visível, já que só acrescenta um atributo.
 */
function useIsNarrow(): boolean {
  const [narrow, setNarrow] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setNarrow(mq.matches);
    // A largura da janela só existe depois de montar — é exatamente a
    // informação que falta no servidor, então o estado nasce aqui.
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return narrow;
}

function NavLink({ href, growingman: Growingman, label, exact, onNavigate }: { href: string; growingman: LucideIcon; label: string; exact: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    /*
      `min-h-[44px]` no celular: 44px é o alvo mínimo confortável para o dedo, e
      a lista inteira do menu passa a ser tocável sem mira. No desktop, onde o
      ponteiro é preciso, a altura volta ao compacto de antes.

      `active:` e não só `hover:`: num aparelho de toque não existe passar por
      cima, e sem retorno imediato ao toque a interface parece travada até a
      próxima tela pintar.
    */
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group md:min-h-0 ${
        isActive
          ? "bg-white text-black shadow-[0_2px_12px_rgba(255,255,255,0.15)]"
          : "text-neutral-400 hover:text-white hover:bg-white/8 active:bg-white/12"
      }`}
    >
      <Growingman className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-black' : ''}`} />
      {label}
      {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-black/40" />}
    </Link>
  );
}

/**
 * Um destino da barra inferior.
 *
 * O rótulo é minúsculo e o ícone manda — é a proporção das barras de abas do
 * sistema. O estado ativo não usa fundo branco como a barra lateral: numa faixa
 * de 56px, um bloco sólido pesaria demais e brigaria com o conteúdo logo acima.
 * Cor cheia e um traço curto no topo dizem o mesmo com menos tinta.
 */
function TabBarItem({
  href,
  growingman: Growingman,
  label,
  exact,
}: {
  href: string;
  growingman: LucideIcon;
  label: string;
  exact: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className="relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 transition-transform active:scale-[0.92]"
    >
      {isActive && (
        <span
          aria-hidden
          className="absolute top-0 h-0.5 w-8 rounded-full bg-white"
        />
      )}
      <Growingman
        className={cn(
          "h-[1.35rem] w-[1.35rem] transition-colors",
          isActive ? "text-white" : "text-neutral-500",
        )}
      />
      <span
        className={cn(
          "text-[0.625rem] font-semibold leading-none tracking-tight transition-colors",
          isActive ? "text-white" : "text-neutral-500",
        )}
      >
        {label}
      </span>
    </Link>
  );
}

/** Todas as telas pesquisáveis pela busca do topo. */
const SEARCHABLE = [...navItems, ...settingsItems];

/** Busca global do topo: filtra os módulos e navega até o selecionado (estilo command palette). */
function TopbarSearch({ autoFocus = false, onCancel }: { autoFocus?: boolean; onCancel?: () => void }) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
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

  // `autoFocus` como efeito, e não como atributo: o campo só existe depois do
  // toque na lupa, e o atributo nativo só age na primeira montagem do documento.
  React.useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const go = (href: string) => {
    setQuery("");
    setOpen(false);
    onCancel?.();
    router.push(href);
  };

  return (
    <div ref={containerRef} className="relative flex flex-1 items-center gap-2 md:max-w-sm">
      <div className="relative min-w-0 flex-1">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") { setOpen(false); onCancel?.(); return; }
            if (!results.length) return;
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % results.length); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + results.length) % results.length); }
            else if (e.key === "Enter") { e.preventDefault(); go(results[active].href); }
          }}
          className="h-10 rounded-xl border-white/[0.06] bg-white/[0.04] pl-9 text-sm transition-colors placeholder:text-neutral-600 focus:border-white/20 focus:bg-white/[0.06] md:h-9"
          placeholder="Buscar módulos..."
        />
      </div>
      {/* "Cancelar" em texto ao lado do campo é como o sistema fecha uma busca
          no telefone; no desktop a busca vive na barra e não precisa de saída. */}
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 rounded-lg px-1 py-2 text-sm font-medium text-neutral-400 transition-colors active:text-white md:hidden"
        >
          Cancelar
        </button>
      )}
      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 py-1.5 shadow-[0_12px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl">
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
                  className={`flex min-h-[44px] w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                    i === active ? "bg-white/8 text-white" : "text-neutral-300 hover:bg-white/5 active:bg-white/8"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-neutral-500" />
                  <span className="flex-1">{item.label}</span>
                  {i === active && <CornerDownLeft className="hidden h-3.5 w-3.5 text-neutral-600 md:block" />}
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
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all active:scale-95 md:h-9 md:w-9 ${
          open ? "border-white/20 bg-white/[0.06] text-white" : "border-white/[0.06] bg-white/[0.03] text-neutral-500 hover:text-white hover:border-white/15"
        }`}
      >
        <Bell className="w-4 h-4" />
      </button>
      {open && (
        // `max-w-[calc(100vw-1.5rem)]`: ancorado à direita do sino, um painel de
        // 288px ainda cabe num aparelho de 320px — mas só porque este teto
        // existe. Sem ele, o painel empurraria a página na horizontal.
        <div className="absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 shadow-[0_12px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl">
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
  const [mobileSearch, setMobileSearch] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const isNarrow = useIsNarrow();
  const asideRef = React.useRef<HTMLElement>(null);
  const pathname = usePathname();
  const title = useCurrentTitle();
  const closeMobile = () => setMobileOpen(false);

  const isBarber = user?.role === "BARBER";
  const visibleNav = React.useMemo(
    () =>
      navItems.filter((item) =>
        isBarber
          ? BARBER_ALLOWED.includes(item.href)
          : !BARBER_ONLY.includes(item.href),
      ),
    [isBarber],
  );
  const tabItems = React.useMemo(() => {
    const wanted = isBarber ? TAB_BAR_BARBER : TAB_BAR_ADMIN;
    return wanted
      .map((href) => navItems.find((i) => i.href === href))
      .filter((i): i is (typeof navItems)[number] => Boolean(i));
  }, [isBarber]);

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

  /*
    Trava o balanço elástico do documento enquanto o painel está na tela.

    `overscroll-behavior` só age no elemento que realmente rola, e no painel esse
    elemento é o <body> — a área de conteúdo tem altura fixa e rola por dentro.
    Precisa portanto ficar no body, mas só aqui: na landing, puxar para
    recarregar é comportamento de página que ninguém pediu para tirar.
  */
  React.useEffect(() => {
    document.body.classList.add("app-viewport");
    return () => document.body.classList.remove("app-viewport");
  }, []);

  /* Trocar de tela fecha o que estava aberto por cima dela. */
  React.useEffect(() => {
    // Sincronização com a navegação, que é externa ao React: a rota muda por
    // fora e a casca reage. Não é estado derivado de props.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
    setMobileSearch(false);
  }, [pathname]);

  /* Esc fecha o menu — mesma saída que o modal oferece. */
  React.useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  /*
    Ao ABRIR, apaga o transform que o gesto deixou escrito no nó.

    Fechar arrastando termina com `translateX(-100%)` inline, e estilo inline
    ganha de classe: sem esta limpeza, a segunda abertura do menu não mostraria
    nada — o painel entraria na árvore já deslocado para fora da tela.
  */
  React.useEffect(() => {
    if (mobileOpen && asideRef.current) {
      asideRef.current.style.transition = "";
      asideRef.current.style.transform = "";
    }
  }, [mobileOpen]);

  /*
    Arrastar o menu para a esquerda para fechá-lo.

    O eixo é decidido uma vez por gesto, nos primeiros 8px: se o dedo anda mais
    na vertical, o gesto é rolagem da lista de itens e o menu não se mexe. Sem
    esse desempate, rolar um menu longo puxaria o painel de lado junto.
  */
  const drawerDrag = React.useRef<{ x: number; y: number; axis: "x" | "y" | null; dx: number } | null>(null);

  const onDrawerTouchStart = (e: React.TouchEvent) => {
    drawerDrag.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, axis: null, dx: 0 };
  };

  const onDrawerTouchMove = (e: React.TouchEvent) => {
    const drag = drawerDrag.current;
    if (!drag || !asideRef.current) return;
    const dx = e.touches[0].clientX - drag.x;
    const dy = e.touches[0].clientY - drag.y;

    if (drag.axis === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      drag.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (drag.axis === "x") asideRef.current.style.transition = "none";
    }
    if (drag.axis !== "x") return;

    // Só para a esquerda: o painel já está encostado na borda direita dele.
    drag.dx = Math.min(0, dx);
    asideRef.current.style.transform = `translateX(${drag.dx}px)`;
  };

  const onDrawerTouchEnd = () => {
    const drag = drawerDrag.current;
    drawerDrag.current = null;
    const aside = asideRef.current;
    if (!drag || !aside || drag.axis !== "x") return;

    aside.style.transition = "transform 0.26s cubic-bezier(0.32, 0.72, 0, 1)";
    if (drag.dx < -70) {
      aside.style.transform = "translateX(-100%)";
      window.setTimeout(() => setMobileOpen(false), 180);
    } else {
      aside.style.transform = "";
    }
  };


  return (
    /*
      `h-dvh` (altura DEFINIDA), e não `min-h-screen`.
      O painel é uma casca: barra lateral fixa e só a área de conteúdo rolando
      (o `overflow-y-auto` mais abaixo). Com altura apenas MÍNIMA, esse
      `overflow-y-auto` não tinha contra o que se limitar — crescia até o tamanho
      do conteúdo e a página inteira passava a rolar junto, dando duas barras.
      Aparecia sempre que o conteúdo passava da altura da tela; em celular
      deitado, quase sempre.
      `dvh` em vez de `vh` porque no celular a barra do navegador recolhe, e
      `100vh` conta a altura sem ela — sobra faixa fora da tela.

      O recuo lateral por área segura: com `viewport-fit=cover` a página passa a
      ocupar a tela toda, entalhe incluído. Deitado, o entalhe do iPhone fica na
      lateral e comeria a primeira coluna de conteúdo sem esta reserva.

      (Comentário sem sintaxe de classe de propósito: o Tailwind v4 varre o
      arquivo inteiro, comentários incluídos, e um exemplo escrito como classe
      vira uma regra CSS de verdade — com reticências dentro, uma regra que não
      compila.)
    */
    <div className="flex h-dvh bg-[#080808] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] selection:bg-white/20">
      {/* ── Overlay (mobile, quando o drawer está aberto) ────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out] md:hidden"
          onClick={closeMobile}
          aria-hidden
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────── */}
      {/*
        `inert` quando fechado no celular: o painel continua na árvore, apenas
        deslocado para fora da tela. Sem isso, o Tab do teclado e o leitor de
        tela percorrem nove links invisíveis antes de chegar ao conteúdo.
        A checagem por largura evita desligar a barra lateral do desktop, onde
        ela está permanentemente visível.
      */}
      <aside
        ref={asideRef}
        aria-label="Menu principal"
        inert={!mobileOpen && isNarrow ? true : undefined}
        onTouchStart={onDrawerTouchStart}
        onTouchMove={onDrawerTouchMove}
        onTouchEnd={onDrawerTouchEnd}
        onTouchCancel={onDrawerTouchEnd}
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-dvh w-[17.5rem] shrink-0 flex-col border-r border-white/[0.06] bg-[#080808]",
          "pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]",
          "transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          "md:sticky md:top-0 md:w-[240px] md:translate-x-0 md:pt-0",
          mobileOpen ? "translate-x-0 shadow-[0_0_80px_rgba(0,0,0,0.8)]" : "-translate-x-full",
        )}
      >

        {/* Logo + fechar (mobile) */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] px-5">
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
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-xl text-neutral-400 transition-colors hover:bg-white/5 hover:text-white active:bg-white/10 md:hidden"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation
            `overscroll-contain`: chegar ao fim da lista para de arrastar a tela
            que está atrás do menu — a rolagem morre no painel, como num app. */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3">
          {/* Live badge */}
          <div className="flex items-center gap-2 px-3 py-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-600">Sistema Ativo</span>
          </div>

          <div className="space-y-0.5 mb-6">
            {visibleNav.map((item) => (
              <NavLink key={item.href} {...item} onNavigate={closeMobile} />
            ))}
          </div>

          {!isBarber && (
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
        <div className="shrink-0 space-y-1 border-t border-white/[0.06] p-3">
          {/* Quick link to public page */}
          <Link
            href={appSlug ? `/${appSlug}` : "/"}
            target="_blank"
            className="flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-500 transition-all hover:bg-white/5 hover:text-white active:bg-white/10 md:min-h-0"
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
            className="flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400/80 transition-all hover:bg-red-500/10 hover:text-red-400 active:bg-red-500/15 disabled:cursor-wait disabled:opacity-60 md:min-h-0"
          >
            <LogOut className="w-4 h-4" />
            {isLoggingOut ? "Saindo..." : "Sair da Conta"}
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      {/* `min-h-0`: por padrão um item flex não encolhe abaixo do conteúdo, o
          que impediria a área de rolagem interna de se limitar à tela. */}
      <main className="flex-1 flex flex-col min-h-0 min-w-0">
        {/*
          Barra de navegação.

          No celular ela mostra ONDE a pessoa está — o nome da tela — em vez do
          campo de busca ocupando a largura inteira. É a diferença entre uma
          barra de ferramentas de site e a nav bar de um app: o título da página
          sai de vista assim que se rola o conteúdo, e sem ele o topo não diz
          nada. A busca continua a um toque, na lupa, e assume a barra inteira
          quando aberta.

          O recuo de topo por `safe-area-inset-top` cobre o app instalado na
          tela inicial, onde não existe barra do navegador cobrindo o entalhe e
          o título nasceria por baixo do relógio do sistema. Vem com `min-h`, e
          não `h`: altura fixa mais recuo espremeria o conteúdo dentro dos
          mesmos 56px em vez de empurrar a barra para baixo do entalhe.
        */}
        <header className="sticky top-0 z-20 flex min-h-14 shrink-0 items-center gap-2 border-b border-white/[0.06] bg-[#080808]/95 px-3 pt-[env(safe-area-inset-top)] backdrop-blur-xl md:min-h-16 md:gap-3 md:bg-[#080808] md:px-6 md:pt-0">
          {mobileSearch ? (
            <TopbarSearch autoFocus onCancel={() => setMobileSearch(false)} />
          ) : (
            <>
              <h2 className="flex-1 truncate text-[0.95rem] font-bold tracking-tight text-white md:hidden">
                {title}
              </h2>
              <div className="hidden flex-1 md:flex">
                <TopbarSearch />
              </div>
              <button
                onClick={() => setMobileSearch(true)}
                aria-label="Buscar módulos"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-neutral-400 transition-all active:scale-95 md:hidden"
              >
                <Search className="h-4 w-4" />
              </button>
              <div className="flex shrink-0 items-center gap-2">
                <NotificationsBell />
              </div>
            </>
          )}
        </header>

        {/* Page content
            `overflow-x-clip`: a coluna de conteúdo do painel não rola na
            horizontal — quem rola são os componentes que têm scroller próprio
            (barra de abas, tabelas). Sem isso, qualquer filho que estoure a
            largura arrasta a página inteira junto.

            `clip` e não `hidden` de propósito: `hidden` cria um contexto de
            rolagem e quebraria o `position: sticky` do cabeçalho e dos
            componentes internos. `clip` só corta, sem virar scroller.

            O recuo de baixo reserva a altura da barra de abas, que é `fixed` e
            portanto não empurra nada: sem ele o último cartão de toda página
            nasceria por baixo dela. `--app-tabbar` vale zero no desktop, então
            a mesma expressão serve para os dois. */}
        <div className="flex-1 overflow-y-auto overflow-x-clip overscroll-contain p-4 pb-[calc(var(--app-tabbar)+1.5rem)] sm:p-6 sm:pb-[calc(var(--app-tabbar)+1.5rem)] md:p-8">
          {children}
        </div>
      </main>

      {/*
        ── Barra de abas (só celular) ─────────────────────────

        `fixed` e não dentro do <main>: precisa ficar colada ao rodapé da tela,
        não ao fim do conteúdo. `z-20` a deixa abaixo do overlay do menu (z-30),
        para que abrir o menu escureça a barra junto com o resto — acesa por
        cima do escurecimento, ela pareceria um segundo aplicativo.

        O respiro de baixo é `max(0.375rem, safe-area)`: no iPhone reserva a
        faixa da barra de gestos; num Android que não tem essa faixa, sobra
        apenas uma folga discreta.
      */}
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-20 flex items-stretch gap-1 border-t border-white/[0.06] bg-[#080808]/[0.92] px-2 pb-[max(0.375rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-xl md:hidden"
      >
        {tabItems.map((item) => (
          <TabBarItem
            key={item.href}
            href={item.href}
            growingman={item.growingman}
            label={item.short}
            exact={item.exact}
          />
        ))}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-expanded={mobileOpen}
          aria-label="Abrir menu completo"
          className="relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 transition-transform active:scale-[0.92]"
        >
          <Menu className={cn("h-[1.35rem] w-[1.35rem] transition-colors", mobileOpen ? "text-white" : "text-neutral-500")} />
          <span className={cn("text-[0.625rem] font-semibold leading-none tracking-tight transition-colors", mobileOpen ? "text-white" : "text-neutral-500")}>
            Menu
          </span>
        </button>
      </nav>
    </div>
  );
}
