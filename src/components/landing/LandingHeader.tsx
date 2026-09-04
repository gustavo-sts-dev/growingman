"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/brand/ui";
import { cn } from "@/lib/utils";

const nav = [
  { href: "#recursos", label: "Recursos" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#plano", label: "Plano" },
];

/**
 * Barra do topo, em dois estados.
 *
 * No alto da página ela flutua SOBRE o herói, que é escuro e ocupa a janela
 * inteira: barra branca ali vira um retângulo colado em cima da imagem, que é
 * exatamente o que separava os dois. Sem fundo, com o texto claro, ela passa a
 * fazer parte da mesma cena.
 *
 * Ao rolar, o fundo atrás dela vira o creme da página — e aí o texto claro
 * sumiria. Nesse ponto volta a barra de vidro, que é a que funciona no claro.
 *
 * O limiar é 24px: alto o bastante para não piscar com o quique da rolagem no
 * iOS, baixo o bastante para a troca acontecer assim que a pessoa começa a rolar.
 */
export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    // Roda uma vez: a página pode abrir já rolada (voltar do navegador, âncora).
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      <div
        className={cn(
          "mx-auto flex h-14 w-full max-w-[var(--gm-site-max)] items-center justify-between gap-2 rounded-[1.15rem] px-2.5 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 sm:h-16 sm:gap-4 sm:px-5",
          scrolled
            ? "border border-white/70 bg-white/75 shadow-[0_18px_50px_-28px_rgba(13,12,10,0.55)] backdrop-blur-xl"
            : "border border-transparent bg-transparent shadow-none",
        )}
      >
        <Link
          href="/"
          aria-label="Growingman — página inicial"
          className={cn(
            "min-w-0 shrink rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            scrolled
              ? "focus-visible:ring-[#0d0c0a] focus-visible:ring-offset-white"
              : "focus-visible:ring-white focus-visible:ring-offset-transparent",
          )}
        >
          <Wordmark tone={scrolled ? "light" : "dark"} />
        </Link>

        <nav aria-label="Navegação principal" className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2",
                scrolled
                  ? "text-[#6f6b64] hover:bg-[#f3f1ec] hover:text-[#0d0c0a] focus-visible:ring-[#0d0c0a]"
                  : "text-white/70 hover:bg-white/10 hover:text-white focus-visible:ring-white/70",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/login"
            className={cn(
              "hidden rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 sm:inline-flex",
              scrolled
                ? "text-[#6f6b64] hover:bg-[#f3f1ec] hover:text-[#0d0c0a] focus-visible:ring-[#0d0c0a]"
                : "text-white/70 hover:bg-white/10 hover:text-white focus-visible:ring-white/70",
            )}
          >
            Entrar
          </Link>
          {/*
            No topo o botão repete a forma da ação do herói (pílula branca): são
            a mesma oferta, e duas formas diferentes para o mesmo clique na mesma
            tela é ruído. Rolando, volta ao retângulo escuro do resto do site.
          */}
          <Link
            href="/onboarding"
            className={cn(
              "inline-flex h-9 shrink-0 items-center whitespace-nowrap px-3 text-[0.65rem] font-bold uppercase tracking-[0.1em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:h-10 sm:px-5 sm:text-[0.7rem] sm:tracking-[0.13em]",
              scrolled
                ? "rounded-xl bg-[#0d0c0a] text-white shadow-[0_12px_26px_-14px_rgba(13,12,10,0.9)] hover:-translate-y-0.5 hover:bg-black focus-visible:ring-[#0d0c0a] focus-visible:ring-offset-white"
                : "rounded-full bg-white text-[#0d0c0a] shadow-[0_14px_30px_-16px_rgba(0,0,0,0.9)] hover:bg-[#f3f1ec] focus-visible:ring-white focus-visible:ring-offset-transparent",
            )}
          >
            Criar conta
          </Link>
        </div>
      </div>
    </header>
  );
}
