"use client";

import { Bell, BellRing, BellOff, Loader2 } from "lucide-react";
import { usePushNotifications } from "@/lib/usePushNotifications";
import { useToast } from "@/components/ui/toast";

/**
 * Liga/desliga as notificações push de agendamento NESTE navegador.
 *
 * Mora no rodapé da sidebar do painel (visível a admin e barbeiro, no celular e
 * no desktop) porque barbeiro não acessa a página de Configurações. Some sozinho
 * quando o navegador não suporta push ou quando a chave VAPID não está
 * configurada — não há o que ativar nesses casos.
 */
export function PushToggle() {
  const { status, busy, configured, enable, disable } = usePushNotifications();
  const toast = useToast();

  // Nada a mostrar: recurso desligado no ambiente ou navegador incompatível.
  if (!configured || status === "unsupported" || status === "loading") return null;

  const baseClass =
    "flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all md:min-h-0";

  if (status === "denied") {
    return (
      <div
        className={`${baseClass} text-neutral-500`}
        title="As notificações estão bloqueadas nas permissões do navegador. Reative por lá para receber avisos de agendamento."
      >
        <BellOff className="h-4 w-4 shrink-0" />
        <span className="truncate">Notificações bloqueadas</span>
      </div>
    );
  }

  const enabled = status === "enabled";

  const onClick = async () => {
    if (busy) return;
    if (enabled) {
      await disable();
      toast.info("Notificações desativadas neste navegador.");
      return;
    }
    await enable();
    // Lê o resultado pela permissão do navegador: se ainda não foi concedida, o
    // usuário recusou o prompt (ou está em iOS sem o app instalado).
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      toast.success("Notificações ativadas neste navegador.");
    } else if (typeof Notification !== "undefined" && Notification.permission === "denied") {
      toast.error("Permissão negada. Reative nas configurações do navegador.");
    } else {
      toast.info("No iPhone, instale o app na tela de início para receber notificações.");
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-busy={busy}
      className={`${baseClass} ${
        enabled
          ? "text-white hover:bg-white/5 active:bg-white/10"
          : "text-neutral-500 hover:bg-white/5 hover:text-white active:bg-white/10"
      } disabled:opacity-60`}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
      ) : enabled ? (
        <BellRing className="h-4 w-4 shrink-0 text-green-400" />
      ) : (
        <Bell className="h-4 w-4 shrink-0" />
      )}
      <span className="truncate">
        {enabled ? "Notificações ativas" : "Ativar notificações"}
      </span>
    </button>
  );
}
