"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, apiPost } from "@/lib/api";

/**
 * Inscrição em Web Push do painel (admin/barbeiro).
 *
 * Fluxo: registra o service worker (/sw.js), pede permissão SÓ quando o usuário
 * ativa (nunca no load — navegadores penalizam prompt automático), assina no
 * PushManager com a chave VAPID pública e manda a inscrição ao backend.
 *
 * A chave vem de NEXT_PUBLIC_VAPID_PUBLIC_KEY e precisa bater com a do backend.
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export type PushStatus =
  | "loading" // ainda checando o estado atual
  | "unsupported" // navegador sem service worker / Push API
  | "denied" // permissão bloqueada no navegador (só o usuário reverte)
  | "disabled" // suportado e permitido, mas sem inscrição ativa
  | "enabled"; // inscrito e recebendo

/** Converte a chave VAPID (base64url) no formato que o PushManager exige. */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  // ArrayBuffer explícito (não ArrayBufferLike): é o que `BufferSource` do
  // applicationServerKey aceita — SharedArrayBuffer não serve.
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export interface UsePushNotifications {
  status: PushStatus;
  busy: boolean;
  /** Falso quando falta NEXT_PUBLIC_VAPID_PUBLIC_KEY: não dá para assinar. */
  configured: boolean;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotifications {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [busy, setBusy] = useState(false);

  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  // Registra o SW e resolve o estado inicial. Idempotente: register devolve o
  // registro existente se já houver. Toda escrita de estado acontece dentro da
  // função assíncrona (não no corpo síncrono do effect) de propósito.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supported) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.getSubscription();
        if (cancelled) return;
        if (Notification.permission === "denied") setStatus("denied");
        else setStatus(sub ? "enabled" : "disabled");
      } catch {
        if (!cancelled) setStatus("disabled");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supported]);

  const enable = useCallback(async () => {
    if (!supported || !VAPID_PUBLIC_KEY) return;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "disabled");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }
      await apiPost("/push/subscribe", sub.toJSON());
      setStatus("enabled");
    } catch {
      // Mantém coerente com o que o navegador realmente decidiu.
      setStatus(
        typeof Notification !== "undefined" && Notification.permission === "denied"
          ? "denied"
          : "disabled",
      );
    } finally {
      setBusy(false);
    }
  }, [supported]);

  const disable = useCallback(async () => {
    if (!supported) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const { endpoint } = sub;
        await sub.unsubscribe();
        // Remove do backend para não guardar inscrição que não recebe mais.
        await apiFetch("/push/subscribe", {
          method: "DELETE",
          body: JSON.stringify({ endpoint }),
        }).catch(() => {});
      }
      setStatus("disabled");
    } finally {
      setBusy(false);
    }
  }, [supported]);

  return {
    status,
    busy,
    configured: !!VAPID_PUBLIC_KEY,
    enable,
    disable,
  };
}
