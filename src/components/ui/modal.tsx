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

const SIZE: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

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

  React.useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
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
    document.body.style.overflow = "hidden";
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
      document.body.style.overflow = previousOverflow;
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
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
          "w-full bg-zinc-950 border border-white/10 rounded-3xl p-6 shadow-[0_20px_70px_rgba(0,0,0,0.6)] animate-[scaleIn_0.18s_ease-out]",
          SIZE[size]
        )}
      >
        {(title || description) && (
          <div className="mb-6 pr-8 relative">
            {title && <h3 id={titleId} className="text-xl font-bold">{title}</h3>}
            {description && <p id={descriptionId} className="text-sm text-neutral-500 mt-1">{description}</p>}
            <button
              onClick={onClose}
              className="absolute -top-1 right-0 w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/8 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {children}
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
      <div className="flex gap-3 pt-6">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 h-10 rounded-xl border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={cn(
            "flex-1 h-10 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50",
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
