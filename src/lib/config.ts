/**
 * Configuração central da URL da API.
 *
 * IMPORTANTE: nunca colocar `http://localhost:3333` hardcoded nas páginas/componentes.
 * Sempre use `API_BASE` (que inclui o prefixo /api) ou `apiUrl(path)`.
 *
 * Por que isso importa: ao acessar de outro dispositivo (celular na mesma rede),
 * `localhost` aponta para o próprio celular, não para o servidor. O valor vem de
 * `NEXT_PUBLIC_API_URL` (definido em `.env.local`), ex.:
 *   NEXT_PUBLIC_API_URL=http://192.168.0.107:3333/api
 *
 * Funciona tanto em Client Components quanto em Server Components, pois variáveis
 * `NEXT_PUBLIC_*` são embutidas no bundle em build/runtime.
 */
const envApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api";
export const API_BASE = typeof window !== "undefined" ? "/api-proxy" : envApiUrl;

/** Monta uma URL completa da API a partir de um path com barra inicial. Ex.: apiUrl("/tenants/my"). */
export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}

/**
 * URL base pública do app (onde ficam as páginas white-label, ex.: `/{slug}`).
 *
 * Nunca hardcode `localhost:3000` nas telas: em produção o domínio é outro e ao
 * acessar de outro dispositivo o `localhost` aponta para o próprio aparelho.
 * Valor vem de `NEXT_PUBLIC_SITE_URL` (ex.: https://app.growingman.com.br). Sem env,
 * usa `window.location.origin` no cliente ou o fallback local no servidor.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3000");

/** Host público sem esquema (ex.: "app.growingman.com.br"), para exibir links amigáveis ao usuário. */
export function siteHost(): string {
  try {
    return new URL(SITE_URL).host;
  } catch {
    return SITE_URL.replace(/^https?:\/\//, "");
  }
}

/** Monta a URL pública completa de um caminho. Ex.: publicUrl(`/${slug}`). */
export function publicUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}
