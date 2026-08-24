"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast deve ser usado dentro de <ToastProvider>");
  }
  return ctx;
}

const ICONS: Record<ToastType, LucideIcon> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const ACCENT: Record<ToastType, string> = {
  success: "text-green-400 border-green-500/20",
  error: "text-red-400 border-red-500/20",
  info: "text-blue-400 border-blue-500/20",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const idRef = React.useRef(0);

  const remove = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (message: string, type: ToastType = "info") => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove],
  );

  const value = React.useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (m: string) => toast(m, "success"),
      error: (m: string) => toast(m, "error"),
      info: (m: string) => toast(m, "info"),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/*
        Celular: faixa que desce do topo, presa às laterais e abaixo do entalhe
        — é onde o sistema operacional coloca os avisos dele, e é o único canto
        que não briga com o rodapé de navegação nem com o polegar.

        Também corrige um estouro real: `right-6` combinado com `w-full` fazia a
        pilha começar 24px fora da borda esquerda em telas de 390px, arrastando
        a página inteira na horizontal.

        Desktop: canto inferior direito, como antes.
      */}
      <div className="pointer-events-none fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[100] flex flex-col gap-2.5 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-auto sm:w-full sm:max-w-sm">
        {toasts.map((t) => {
          const Growingman = ICONS[t.type];
          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-2xl border bg-zinc-950/95 backdrop-blur-xl px-4 py-3.5 shadow-[0_8px_40px_rgba(0,0,0,0.5)] animate-[bannerIn_0.24s_cubic-bezier(0.32,0.72,0,1)] sm:animate-[slideIn_0.2s_ease-out]",
                ACCENT[t.type],
              )}
            >
              <Growingman
                className={cn(
                  "w-5 h-5 shrink-0 mt-0.5",
                  ACCENT[t.type].split(" ")[0],
                )}
              />
              <p className="text-sm text-white/90 flex-1 leading-snug">
                {t.message}
              </p>
              <button
                onClick={() => remove(t.id)}
                aria-label="Dispensar aviso"
                className="-my-2 -mr-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:text-white active:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
