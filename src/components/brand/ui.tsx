import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Design system do tema claro Growingman — usado pela landing e pelas telas de
 * acesso (login e cadastro). Os tokens de cor, as malhas de gradiente e as
 * animações vivem na classe `.gm` em globals.css; aqui ficam os componentes.
 *
 * O app autenticado continua no tema escuro e não é afetado por nada daqui.
 */

/**
 * Largura e respiro únicos — tudo alinha na mesma coluna: barra do topo, herói,
 * seções e rodapé. A medida é a do herói (1520px): duas colunas largas não
 * cabiam nos 1180px anteriores, e uma faixa mais estreita que o primeiro quadro
 * deixava a página inteira desalinhada dele.
 */
export const container = "mx-auto w-full max-w-[1520px] px-5 sm:px-8";

/** Mesma coluna, sem respiro lateral: para seções que já aplicam o próprio padding. */
export const containerFlush = "mx-auto w-full max-w-[1520px]";

/** Ritmo vertical único entre seções. */
export const sectionPad = "py-16 sm:py-24 lg:py-32";

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 text-[0.7rem] font-bold uppercase tracking-[0.12em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-55 sm:px-6 sm:text-[0.72rem] sm:tracking-[0.14em]";

/** Ações da página. Uma primária por dobra; o resto é secundário ou texto. */
export const btn = {
  /** Sobre fundo claro. */
  primary: cn(
    btnBase,
    "h-11 bg-[#0d0c0a] text-white shadow-[0_16px_34px_-16px_rgba(13,12,10,0.75)] sm:h-12",
    "hover:-translate-y-0.5 hover:bg-black hover:shadow-[0_22px_44px_-18px_rgba(13,12,10,0.8)]",
    "focus-visible:ring-[#0d0c0a] focus-visible:ring-offset-[#f3f1ec]",
  ),
  /** Sobre fundo claro, peso menor. */
  secondary: cn(
    btnBase,
    "h-11 border border-[#d9d4c9] bg-white text-[#0d0c0a] shadow-[0_10px_24px_-18px_rgba(13,12,10,0.5)] sm:h-12",
    "hover:-translate-y-0.5 hover:border-[#0d0c0a] hover:bg-[#faf9f6]",
    "focus-visible:ring-[#0d0c0a] focus-visible:ring-offset-[#f3f1ec]",
  ),
  /** Sobre malha escura — máximo contraste, é a ação principal ali. */
  onDarkSolid: cn(
    btnBase,
    "h-11 bg-white text-[#0d0c0a] shadow-[0_16px_36px_-16px_rgba(0,0,0,0.9)] sm:h-12",
    "hover:-translate-y-0.5 hover:bg-[#f3f1ec]",
    "focus-visible:ring-white focus-visible:ring-offset-transparent",
  ),
  /** Sobre malha escura, peso menor. */
  onDarkGhost: cn(
    btnBase,
    "h-11 border border-white/25 bg-white/10 text-white backdrop-blur-md sm:h-12",
    "hover:-translate-y-0.5 hover:border-white/45 hover:bg-white/20",
    "focus-visible:ring-white/70 focus-visible:ring-offset-transparent",
  ),
};

/** Etiqueta de topo da seção: o degrau mais baixo da hierarquia textual. */
export function Eyebrow({
  children,
  align = "left",
  tone = "light",
  className,
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[0.65rem] font-semibold uppercase tracking-[0.22em] sm:text-[0.68rem] sm:tracking-[0.24em]",
        tone === "light" ? "text-[#6f6b64]" : "text-white/65",
        align === "right" && "text-left lg:text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </p>
  );
}

/**
 * Marca desenhada em código: o mesmo selo do painel (quadrado + tesoura),
 * invertida conforme o fundo. Evita carregar o PNG de 7 MB nas telas públicas.
 */
export function Wordmark({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <span className="flex items-center gap-2 sm:gap-2.5">
      {/*
        A marca de verdade, recortada do logo.

        Antes era um ícone genérico de tesoura do lucide dentro de um quadrado
        colorido — um placeholder. Aqui vai o símbolo próprio, sem a palavra
        "GROWINGMAN" que o arquivo original também traz: ela já aparece ao lado,
        e repetir deixaria a marca escrita duas vezes na mesma linha.

        A imagem é a própria placa (fundo claro, símbolo verde), então o contêiner
        não pinta fundo: só recorta o canto e projeta a sombra do tom.
      */}
      <span
        aria-hidden="true"
        className={cn(
          "block size-8 shrink-0 overflow-hidden rounded-[0.6rem] sm:size-9 sm:rounded-[0.65rem]"
        )}
      >
        {/* `<img>` cru, como o resto do app. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/growingman-mark.png"
          alt=""
          className="h-full w-full object-cover"
        />
      </span>
      <span
        className={cn(
          "font-heading text-[0.98rem] font-bold tracking-[-0.02em] sm:text-[1.05rem]",
          tone === "light" ? "text-[#0d0c0a]" : "text-white",
        )}
      >
        Growingman
      </span>
    </span>
  );
}

/** Barra flutuante em vidro — a mesma da landing, com uma ação contextual. */
export function BrandHeader({
  actionHref,
  actionLabel,
}: {
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      <div className="mx-auto flex h-14 w-full max-w-[1520px] items-center justify-between gap-2 rounded-[1.15rem] border border-white/70 bg-white/75 px-2.5 shadow-[0_18px_50px_-28px_rgba(13,12,10,0.55)] backdrop-blur-xl sm:h-16 sm:gap-4 sm:px-5">
        <Link
          href="/"
          aria-label="Growingman — página inicial"
          className="min-w-0 shrink rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d0c0a] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <Wordmark />
        </Link>
        <Link
          href={actionHref}
          className="shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-[0.82rem] font-medium text-[#6f6b64] transition-colors hover:bg-[#f3f1ec] hover:text-[#0d0c0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d0c0a] sm:px-3.5 sm:text-sm"
        >
          {actionLabel}
        </Link>
      </div>
    </header>
  );
}

/** Campo de formulário no tema claro: rótulo, dica opcional e controle. */
export function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[0.85rem] font-medium text-[#3a3733]">
          {label}
        </label>
        {hint && <span className="text-[0.75rem] text-[#8a857c]">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/** Input no tema claro. O `Input` compartilhado é escuro e serve ao dashboard. */
export const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-xl border border-[#d9d4c9] bg-white px-4 text-[0.95rem] text-[#0d0c0a] transition-colors",
        "placeholder:text-[#a39d92]",
        "focus-visible:border-[#0d0c0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d0c0a]/15",
        "disabled:cursor-not-allowed disabled:opacity-55",
        className,
      )}
      {...props}
    />
  ),
);
TextInput.displayName = "TextInput";

/** Aviso de erro do formulário. Vermelho é cor de estado, não da marca — usado só aqui. */
export function FormAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-xl border border-[#e8cfcb] bg-[#fbf1f0] px-4 py-3 text-[0.88rem] leading-6 text-[#8a2c22]"
    >
      {message}
    </p>
  );
}
