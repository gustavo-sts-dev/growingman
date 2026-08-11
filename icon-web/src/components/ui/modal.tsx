"use client";

import * as React from "react";
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
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "w-full bg-zinc-950 border border-white/10 rounded-3xl p-6 shadow-[0_20px_70px_rgba(0,0,0,0.6)] animate-[scaleIn_0.18s_ease-out]",
          SIZE[size]
        )}
      >
        {(title || description) && (
          <div className="mb-6 pr-8 relative">
            {title && <h3 className="text-xl font-bold">{title}</h3>}
            {description && <p className="text-sm text-neutral-500 mt-1">{description}</p>}
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
    </div>
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
