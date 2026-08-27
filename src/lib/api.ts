/**
 * apiFetch — wrapper de fetch com refresh automático de token.
 *
 * Fluxo:
 * 1. Faz a requisição com o access token. Backend gerencia cookies HttpOnly
 * 2. Se receber 401, tenta POST /api/auth/refresh (backend usa cookie refreshToken HttpOnly)
 * 3. Se refresh ok → backend seta novo accessToken cookie + repeats a requisição
 * 4. Se refresh falhar → redireciona para o login DA ÁREA (ver destinoDeLogin)
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
  // `Content-Type: application/json` só quando há corpo. Anunciar JSON sem
  // enviar nada faz o Fastify recusar a requisição com FST_ERR_CTP_EMPTY_JSON_BODY
  // — foi o que quebrava todo DELETE do app, que não manda corpo.
  const makeRequest = () =>
    fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: "include", // envia cookies HttpOnly automaticamente
      headers: {
        ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
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

    let success = false;
    try {
      success = await tryRefresh();
    } finally {
      isRefreshing = false;
      // AVISA OS QUE ESPERAM EM QUALQUER DESFECHO.
      //
      // Antes isto só era chamado no sucesso. Quando o refresh falhava — ou
      // seja, exatamente quando a sessão expirava por inatividade — as outras
      // requisições que estavam aguardando NUNCA eram resolvidas. As páginas do
      // painel disparam 4 ou 5 chamadas em paralelo: a primeira tentava o
      // refresh e as demais ficavam penduradas para sempre, então o `Promise.all`
      // nunca terminava, o `finally` que desliga o "carregando" nunca rodava e a
      // tela ficava presa no esqueleto — sem conteúdo, e por isso sem rolagem.
      onRefreshed(success);
    }

    if (!success) {
      try {
        await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
      } catch {}
      if (typeof window !== "undefined") {
        window.location.replace(destinoDeLogin(window.location.pathname));
      }
      // Retorna a resposta 401 original para não travar o caller
      return response;
    }

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
 * Rotas de primeiro nível que pertencem à PLATAFORMA, não a uma barbearia.
 *
 * Tudo o que não está aqui é `/[tenantSlug]/...` — é assim que o roteador do
 * Next já resolve a árvore de `src/app`. Ao criar uma pasta nova na raiz de
 * `src/app`, acrescente-a aqui: sem isso o nome dela seria lido como slug de
 * barbearia e um 401 mandaria o usuário para `/<pasta>/entrar`.
 */
const ROTAS_DA_PLATAFORMA = new Set([
  "admin",
  "api",
  "confirmar-cadastro",
  "dashboard",
  "login",
  "onboarding",
  "recuperar-senha",
  "redefinir-senha",
]);

/**
 * Para onde mandar quem tomou 401.
 *
 * Existem DOIS logins neste sistema e eles não se substituem: `/login` é
 * e-mail e senha do dono da barbearia, `/<slug>/entrar` é telefone e código
 * para o cliente. Mandar cliente para `/login` mostra a ele um formulário que
 * ele não tem como preencher — era o que acontecia ao abrir "Meus
 * agendamentos" sem sessão.
 *
 * Exportado para poder ser testado sem navegador.
 */
export function destinoDeLogin(pathname: string): string {
  const slug = pathname.split("/").filter(Boolean)[0];
  if (!slug || ROTAS_DA_PLATAFORMA.has(slug)) return "/login";
  return `/${slug}/entrar`;
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
  if (res.status === 204) return undefined as T;
  return res.json();
}

/**
 * Encerra a sessão sem passar pelo refresh automático do `apiFetch`.
 *
 * Logout precisa ser idempotente: mesmo se a sessão já expirou ou a API
 * estiver indisponível, a rota do Next remove os cookies deste domínio.
 */
export async function logoutSession(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  });
}
