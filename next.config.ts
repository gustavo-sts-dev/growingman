import type { NextConfig } from "next";
import path from "node:path";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";
const apiOrigin = new URL(apiBase).origin;
const isDevelopment = process.env.NODE_ENV === "development";

/** Origem de uma URL vinda do ambiente, tolerando ausência ou valor inválido. */
function originOrEmpty(value: string | undefined): string {
  if (!value) return "";
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

// O storage de objetos usa DUAS origens distintas, e cada uma cai numa diretiva
// diferente da CSP:
//  - upload: o navegador envia direto ao bucket via presigned URL (connect-src);
//  - leitura: as imagens são servidas pelo domínio público do bucket (img-src).
// Ficam em env porque mudam por ambiente (MinIO local, R2 em produção) e o
// endpoint do R2 carrega o ID da conta.
const storageUploadOrigin = originOrEmpty(process.env.NEXT_PUBLIC_STORAGE_UPLOAD_URL);
const storagePublicOrigin = originOrEmpty(process.env.NEXT_PUBLIC_STORAGE_PUBLIC_URL);

/** Junta fontes ignorando as vazias, para não gerar diretiva com espaço duplo. */
const sources = (...values: string[]) => values.filter(Boolean).join(" ");

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  `img-src ${sources("'self'", "data:", "blob:", apiOrigin, storagePublicOrigin)}`,
  `connect-src ${sources("'self'", apiOrigin, storageUploadOrigin, isDevelopment ? "ws: wss:" : "")}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "worker-src 'self' blob:",
  ...(!isDevelopment ? ["upgrade-insecure-requests"] : []),
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Pin the workspace root so Turbopack doesn't infer it from a stray
  // lockfile elsewhere (e.g. C:\Users\gusta\package-lock.json).
  turbopack: {
    root: path.join(__dirname),
  },
  // Em dev, o Next bloqueia por padrão requisições cross-origin a assets/HMR
  // quando a página é acessada por um host diferente de `localhost` (ex.: pelo
  // IP da rede no celular). Sem isso, o WebSocket HMR falha e a página não
  // hidrata — o form de login faz submit nativo e só recarrega.
  // Liberamos a faixa de IPs da rede local para permitir acesso por celular.
  allowedDevOrigins: [
    "192.168.0.107",
    "192.168.0.*",
    "192.168.1.*",
    "solar-medline-metres-notebook.trycloudflare.com"
  ],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api-proxy/:path*",
        destination: `${apiBase}/:path*`,
      },
    ];
  },
};

export default nextConfig;
