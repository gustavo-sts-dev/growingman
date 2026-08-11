"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

interface ResourceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Recarrega os dados manualmente (ex: após criar/editar/excluir). */
  reload: () => void;
}

/**
 * Hook genérico para buscar uma coleção/recurso da API com loading e error.
 * Evita o boilerplate de fetch + setState espalhado em cada página e contorna
 * o aviso do React sobre setState síncrono em effects (o fetch é assíncrono).
 *
 * @example const { data, loading, reload } = useResource<Service[]>("/services", []);
 */
export function useResource<T>(path: string, fallback: T): ResourceState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiGet<T>(path);
        if (!cancelled) {
          setData(res ?? fallback);
          setError(null);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const errorMsg = e instanceof Error ? e.message : "Erro ao carregar dados";
          setError(errorMsg);
          setData(fallback);
          // Se for erro 401, não tenta re-carregar automaticamente (vai redirecionar para login no apiFetch)
          console.error(`[useResource] ${path}:`, errorMsg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, nonce]);

  return { data, loading, error, reload };
}
