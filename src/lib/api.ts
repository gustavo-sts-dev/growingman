/**
 * apiFetch — wrapper de fetch com refresh automático de token.
 *
 * Fluxo:
 * 1. Faz a requisição com o access token. Backend gerencia cookies HttpOnly
 * 2. Se receber 401, tenta POST /api/auth/refresh (backend usa cookie refreshToken HttpOnly)
 * 3. Se refresh ok → backend seta novo accessToken cookie + repeats a requisição
 * 4. Se refresh falhar → redireciona para /login
 *
 * NOTA: accessToken e refreshToken são HttpOnly, não acessíveis via JS.
 * Confiamos em cookies + credentials: 'include' para o fetch enviar automaticamente.
 */

import { API_BASE } from "@/lib/config";

let isRefreshing = false;
let refreshSubscribers: ((success: boolean) => void)[] = [];

function onRefreshed(success: boolean) {
  refreshSubscribers.forEach((cb) => cb(success));
  refreshSubscribers = [];
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include", // envia cookies HttpOnly (refreshToken)
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });

    if (!res.ok) return false;

    // O backend renova os cookies apenas via Set-Cookie HttpOnly.
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const makeRequest = () =>
    fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: "include", // envia cookies HttpOnly automaticamente
      headers: {
        "Content-Type": "application/json",
        ...init.headers,
      },
    });

  const response = await makeRequest();

  if (response.status !== 401) {
    return response;
  }

  // ── 401: tenta refresh ────────────────────────────────────
  if (!isRefreshing) {
    isRefreshing = true;

    const success = await tryRefresh();
    isRefreshing = false;

    if (!success) {
      try {
        await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
      } catch {}
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      // Retorna a resposta 401 original para não travar o caller
      return response;
    }

    onRefreshed(true);
    return makeRequest(); // repete com novo token (nos cookies)
  }

  // Outra requisição já está fazendo refresh — espera
  return new Promise((resolve) => {
    refreshSubscribers.push((success: boolean) => {
      resolve(success ? makeRequest() : response);
    });
  });
}

/**
 * Extrai a mensagem de erro do corpo da resposta (campo `message` do backend),
 * caindo para um texto genérico com o status quando indisponível.
 */
async function throwApiError(res: Response): Promise<never> {
  const body: unknown = await res.json().catch(() => ({}));
  const message =
    body && typeof body === "object" && "message" in body
      ? String((body as { message: unknown }).message)
      : `API error ${res.status}`;
  throw new Error(message);
}

/**
 * Helper tipado: faz apiFetch e retorna JSON diretamente.
 * Lança erro se a resposta não for ok.
 */
export async function apiGet<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, { ...init, method: "GET" });
  if (!res.ok) await throwApiError(res);
  return res.json();
}

export async function apiPost<T = unknown>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, {
    ...init,
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) await throwApiError(res);
  return res.json();
}

export async function apiPatch<T = unknown>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, {
    ...init,
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) await throwApiError(res);
  return res.json();
}

export async function apiPut<T = unknown>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, {
    ...init,
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) await throwApiError(res);
  return res.json();
}

export async function apiDelete<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, { ...init, method: "DELETE" });
  if (!res.ok) await throwApiError(res);
  return res.json();
}
