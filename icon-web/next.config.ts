import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
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
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";
    return [
      {
        source: "/api-proxy/:path*",
        destination: `${apiBase}/:path*`,
      },
    ];
  },
};

export default nextConfig;
