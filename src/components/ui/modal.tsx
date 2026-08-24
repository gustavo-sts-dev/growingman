"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  /** largura máxima do conteúdo. default: max-w-md */
  size?: "sm" | "md" | "lg";
}

/*
  Largura máxima só a partir de `sm`.

  No celular a folha ocupa a largura inteira — é o que a torna uma folha e não
  uma caixa flutuante. Com `max-w-sm` valendo em toda tela, um iPhone Pro Max
  (430px) deixaria duas faixas de fundo nas laterais de um painel colado no
  rodapé: nem diálogo, nem folha.
*/
const SIZE: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
};

/** Arrasto necessário para a folha entender que o gesto é "fechar". */
const DISMISS_THRESHOLD_PX = 96;

/**
 * Trava de rolagem do body, contada.
 *
 * Antes cada modal guardava o `overflow` anterior ao abrir e o devolvia ao
 * fechar. Com mais de um modal na mesma tela — a agenda tem cinco — o segundo a
 * abrir capturava "hidden" como "valor anterior" e o restaurava ao fechar,
 * deixando a página sem rolagem até recarregar. Como dependia da ordem de
 * abertura, travava "do nada".
 *
 * Com contador: só o primeiro a abrir guarda o valor original e trava; só o
 * último a fechar destrava. Módulo-nível de propósito — a contagem tem que ser
 * compartilhada entre TODAS as instâncias.
 */
let openModalCount = 0;
let overflowBeforeLock = "";

function lockBodyScroll() {
  if (openModalCount === 0) {
    overflowBeforeLock = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  openModalCount += 1;
}

function unlockBodyScroll() {
  // `Math.max` protege contra desmontagem fora de ordem: sem ele, um unlock a
  // mais deixaria o contador negativo e o próximo lock nunca travaria.
  openModalCount = Math.max(0, openModalCount - 1);
  if (openModalCount === 0) {
    document.body.style.overflow = overflowBeforeLock;
  }
}

export function Modal({ open, onClose, title, description, children, size = "md" }: ModalProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);
  const onCloseRef = React.useRef(onClose);
  const titleId = React.useId();
  const descriptionId = React.useId();
  // `document` não existe no render do servidor, então o portal só entra depois
  // de montar. Sem isso o build do Next quebra.
  //
  // É exatamente o caso que a regra do lint existe para evitar — estado setado
  // em efeito — mas aqui é intencional: o próprio ato de montar no cliente é a
  // informação que falta no servidor. Checar `typeof document` no render em vez
  // disso causaria divergência de hidratação quando o modal já nasce aberto.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  /*
    Arrastar para fechar.

    A folha segue o dedo em tempo real e só fecha se o arrasto passar do limiar;
    abaixo dele ela volta ao lugar. Sem esse retorno elástico o gesto vira um
    botão escondido — a pessoa não descobre quanto falta, e um toque trêmulo
    fecha o formulário preenchido pela metade.

    O transform é escrito direto no nó, sem estado do React: um `setState` por
    quadro repintaria o formulário inteiro a 60fps e o arrasto engasgaria
    justamente nos modais grandes (o de agendamento tem a lista de serviços).

    Só o cabeçalho e a alça arrastam. Colocar o gesto na folha inteira brigaria
    com a rolagem do conteúdo: puxar a lista de serviços para baixo, já no topo
    dela, fecharia o modal em vez de esticar a lista.
  */
  const dragRef = React.useRef<{ startY: number; deltaY: number } | null>(null);

  const handleDragStart = (e: React.TouchEvent) => {
    if (!panelRef.current) return;
    // Só na folha. A partir de `sm` isto é um diálogo centrado, e arrastá-lo
    // para baixo num laptop com tela sensível ao toque seria um gesto sem
    // sentido: não há rodapé de onde ele tenha saído.
    if (window.matchMedia("(min-width: 40rem)").matches) return;
    dragRef.current = { startY: e.touches[0].clientY, deltaY: 0 };
    panelRef.current.style.transition = "none";
  };

  const handleDragMove = (e: React.TouchEvent) => {
    const drag = dragRef.current;
    if (!drag || !panelRef.current) return;
    // Só para baixo: puxar para cima não tem para onde ir e o elástico ao
    // contrário descolaria a folha do rodapé.
    const deltaY = Math.max(0, e.touches[0].clientY - drag.startY);
    drag.deltaY = deltaY;
    panelRef.current.style.transform = `translateY(${deltaY}px)`;
  };

  const handleDragEnd = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    const panel = panelRef.current;
    if (!drag || !panel) return;

    panel.style.transition = "transform 0.26s cubic-bezier(0.32, 0.72, 0, 1)";
    if (drag.deltaY > DISMISS_THRESHOLD_PX) {
      // Termina a saída antes de desmontar: fechar no meio do caminho faria a
      // folha sumir com um corte seco.
      panel.style.transform = "translateY(100%)";
      window.setTimeout(() => onCloseRef.current(), 200);
    } else {
      panel.style.transform = "";
    }
  };

  React.useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
      if (e.key !== "Tab") return;

      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
      );
      if (focusable.length === 0) {
        e.preventDefault();
        panelRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    lockBodyScroll();
    const frame = window.requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(focusableSelector);
      // `preventScroll`: focar um elemento faz o navegador rolar os ancestrais
      // para revelá-lo. O painel é `fixed` (coordenadas de viewport), então essa
      // rolagem não serve para nada — e era ela que deslocava o container do
      // dashboard na horizontal ao abrir o modal.
      (first ?? panelRef.current)?.focus({ preventScroll: true });
    });

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      unlockBodyScroll();
      previousFocusRef.current?.focus();
    };
  }, [open]);

  if (!open || !mounted) return null;

  /**
   * Renderizado em `document.body`, não onde foi declarado.
   *
   * As páginas do painel vivem dentro de um container com `overflow-y-auto`, e
   * pelo spec um eixo não-`visible` transforma o outro em `auto` — ou seja,
   * aquele container também rola na horizontal. Um modal `fixed` declarado lá
   * dentro fazia o navegador rolar esse container ao abrir, produzindo scroll
   * lateral na página inteira.
   *
   * O portal também garante que o modal fique acima de qualquer contexto de
   * empilhamento criado por ancestrais com transform, blur ou z-index.
   */
  return createPortal(
    /*
      `items-end` no celular, `items-center` a partir de `sm`: mesma árvore,
      duas apresentações. No aparelho a folha nasce colada no rodapé — perto do
      polegar, que é onde ficam os botões de ação — e no desktop volta a ser o
      diálogo centrado de sempre.
    */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out] sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : "Janela de diálogo"}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          "flex w-full flex-col overflow-hidden border border-white/10 bg-zinc-950 shadow-[0_-8px_60px_rgba(0,0,0,0.7)] outline-none",
          // Celular: folha ancorada no rodapé. `92dvh` (e não `vh`) porque a
          // barra do navegador recolhe e `vh` conta a altura sem ela — a folha
          // nasceria mais alta que a tela.
          "max-h-[92dvh] rounded-t-[1.75rem] border-b-0 animate-[sheetIn_0.3s_cubic-bezier(0.32,0.72,0,1)]",
          // Desktop: diálogo centrado, como antes.
          "sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:border-b sm:shadow-[0_20px_70px_rgba(0,0,0,0.6)] sm:animate-[scaleIn_0.18s_ease-out]",
          SIZE[size],
        )}
      >
        {/*
          Alça de arrasto — a affordance do gesto.

          `touch-none` não é enfeite: sem ele o navegador interpreta o mesmo
          movimento como rolagem e o `touchmove` chega cancelado, deixando a
          folha presa no meio do caminho.
        */}
        <div
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          onTouchCancel={handleDragEnd}
          className="shrink-0 touch-none px-5 pt-3 sm:hidden"
        >
          <span
            aria-hidden
            className="mx-auto block h-1 w-9 rounded-full bg-white/20"
          />
        </div>

        {(title || description) && (
          <div
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
            onTouchCancel={handleDragEnd}
            className="relative shrink-0 touch-none px-5 pt-4 pb-4 pr-14 sm:touch-auto sm:px-6 sm:pt-6 sm:pb-5 sm:pr-14"
          >
            {title && (
              <h3 id={titleId} className="text-lg font-bold sm:text-xl">
                {title}
              </h3>
            )}
            {description && (
              <p
                id={descriptionId}
                className="mt-1 text-sm leading-snug text-neutral-500"
              >
                {description}
              </p>
            )}
            {/* 44px de alvo: o mínimo confortável para o polegar. O ícone
                continua com 16px — cresce a área, não o desenho. */}
            <button
              onClick={onClose}
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-white/8 hover:text-white active:bg-white/12 sm:right-4 sm:top-5 sm:h-9 sm:w-9"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/*
          Só o conteúdo rola, e o cabeçalho fica.

          Antes quem rolava era o fundo escuro inteiro, com o diálogo dentro. Na
          folha isso não serve: o título subiria junto e o gesto de rolar o
          formulário competiria com o de fechar.

          O recuo do rodapé soma a barra de gestos do aparelho — é o que impede
          o último botão de nascer debaixo dela no iPhone.
        */}
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-6",
            // Sem cabeçalho (ConfirmDialog) o respiro de cima tem de vir daqui.
            !title && !description && "pt-5 sm:pt-6",
          )}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} size="sm">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-sm text-neutral-400 mt-2 leading-relaxed">{message}</p>
      {/* Empilhado no celular com a ação principal em cima: numa folha colada
          ao rodapé, o botão de baixo é o que o polegar alcança primeiro, e
          "Excluir" não pode ser o mais fácil de acertar sem querer. */}
      <div className="flex flex-col-reverse gap-2.5 pt-6 sm:flex-row sm:gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="h-12 flex-1 rounded-xl border border-white/10 text-sm font-medium transition-colors hover:bg-white/5 active:bg-white/10 disabled:opacity-50 sm:h-10"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={cn(
            "h-12 flex-1 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 sm:h-10",
            destructive
              ? "bg-red-500/90 text-white hover:bg-red-500"
              : "bg-white text-black hover:bg-neutral-200"
          )}
        >
          {loading ? "Processando..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
