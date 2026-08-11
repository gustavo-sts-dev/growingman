import type { NextConfig } from "next";
import path from "node:path";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";
const apiOrigin = new URL(apiBase).origin;
const isDevelopment = process.env.NODE_ENV === "development";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  `img-src 'self' data: blob: ${apiOrigin}`,
  `connect-src 'self' ${apiOrigin}${isDevelopment ? " ws: wss:" : ""}`,
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
