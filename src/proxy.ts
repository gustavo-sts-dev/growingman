/**
 * Proxy (proteção de rota do Next).
 *
 * ⚠️ Next 16: "Middleware" foi RENOMEADO para "Proxy".
 *   - Arquivo: `src/proxy.ts` (mesmo nível de `app/`), NÃO `middleware.ts`.
 *     `middleware.ts` está DEPRECIADO; usar aquele nome aqui faria o Next
 *     ignorar (ou avisar) e a proteção não rodaria.
 *   - Export: função `proxy` (nomeada ou default) + `config` opcional.
 *   - Ref.: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
 *   - Confirmado no build: a saída lista `ƒ Proxy (Middleware)`, ou seja,
 *     este arquivo ESTÁ ativo e executando em cada request casado pelo matcher.
 *
 * Responsabilidade (checagem otimista, NÃO é autorização completa — os docs do
 * Next recomendam validar sessão também na origem de cada rota/fetch):
 *   - /dashboard/:path*  → exige sessão; sem sessão, redireciona p/ /login?redirect=...
 *   - /login             → se já logado, redireciona p/ /dashboard
 *
 * Cookies (nomes REAIS, conferidos no backend em
 * growingman-style-backend/src/modules/auth/controllers/auth.controller.ts):
 *   - `growingman_access_token` — access token LEGÍVEL, setado no cliente via js-cookie
 *     (src/app/login/page.tsx). É o único que o proxy consegue decodificar para
 *     checar expiração.
 *   - `refreshToken` — refresh token HttpOnly, setado pelo BACKEND via Set-Cookie
 *     (login usa credentials:"include"). O proxy roda no servidor, então ENXERGA
 *     o cookie HttpOnly, mas só verifica sua PRESENÇA (não dá para validar o
 *     conteúdo aqui). O backend também seta um `accessToken` HttpOnly próprio,
 *     que o proxy não usa (usamos o `growingman_access_token` legível).
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isTokenExpired(token: string): boolean {
  try {
    // JWT tem 3 partes: header.payload.signature
    const payload = JSON.parse(atob(token.split(".")[1])) as { exp?: number };
    // Sem `exp` no payload → tratamos como inválido/expirado.
    if (typeof payload.exp !== "number") return true;
    // exp é em segundos, Date.now() em ms
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; // se não consegue decodificar, considera expirado
  }
}

export function proxy(request: NextRequest) {
  const accessToken = request.cookies.get("growingman_access_token")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const hasRefreshToken = request.cookies.get("growingman_has_refresh_token")?.value;

  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isLogin = request.nextUrl.pathname === "/login";

  // ── Dashboard: precisa de autenticação ──────────────────────
  if (isDashboard) {
    // Tem access token válido → segue
    if (accessToken && !isTokenExpired(accessToken)) {
      return NextResponse.next();
    }

    // Access token ausente/expirado, mas tem refresh token → deixa passar.
    // Comportamento TOLERANTE proposital: o `apiFetch` no cliente renova o
    // token automaticamente ao tomar 401 (src/lib/api.ts → tryRefresh). Barrar
    // aqui quebraria o fluxo mobile documentado (o access token legível pode
    // demorar a "aparecer" logo após o login e causaria loop de volta ao /login).
    if (refreshToken || hasRefreshToken) {
      return NextResponse.next();
    }

    // Sem nenhum token → login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Login: se já tem sessão válida → redireciona pro dashboard ──
  if (isLogin) {
    const hasValidSession = accessToken && !isTokenExpired(accessToken);

    if (hasValidSession) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

// Matcher confirmado (regex compilada pelo Next testada manualmente):
//   '/dashboard/:path*' casa /dashboard E qualquer subpágina (/dashboard/agenda,
//   /dashboard/servicos/estoque, ...), mas NÃO casa prefixos falsos (/dashboardx).
//   '/login' casa /login (e /login/).
export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
