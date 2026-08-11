"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scissors, AlertCircle, Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/config";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl("/auth/login"), {
        method: "POST",
        credentials: "include", // necessário para receber cookies HttpOnly (refreshToken)
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // Resposta de erro pode vir sem corpo JSON — parse defensivo para não
      // mascarar o status real com "Unexpected end of JSON input".
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("E-mail ou senha incorretos.");
        }
        throw new Error(
          data?.message || `Erro ao fazer login (${response.status})`,
        );
      }

      // Cookies HttpOnly (accessToken, refreshToken) são setados automaticamente
      // pelo backend no Set-Cookie header. O navegador os recebe e persiste.
      // Navegação completa para o dashboard onde o servidor lerá os cookies.
      window.location.href = "/dashboard";
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível conectar ao servidor. Verifique sua conexão.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      {/* Lado Esquerdo - Imagem / Branding */}
      <div className="hidden md:flex flex-1 relative bg-zinc-900 border-r border-white/10 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800/50 via-zinc-900/50 to-black"></div>
        <div className="relative z-10 flex flex-col items-center max-w-lg text-center p-12">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-white/10">
            <Scissors className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-4xl font-bold mb-6 tracking-tight">
            O futuro da sua barbearia.
          </h1>
          <p className="text-zinc-400 text-lg">
            Acesse o Growingman para gerenciar sua agenda, pagamentos e muito
            mais em uma interface feita para a excelência.
          </p>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="flex-1 flex flex-col justify-center p-8 sm:p-12 md:p-24 relative">
        <div className="absolute top-8 left-8 md:hidden flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <Scissors className="w-5 h-5 text-black" />
          </div>
          <span className="font-bold text-xl tracking-tighter">ICON</span>
        </div>

        <div className="w-full max-w-md mx-auto mt-12 md:mt-0">
          <div className="mb-10">
            <h2 className="text-3xl font-bold mb-3">Bem-vindo de volta</h2>
            <p className="text-zinc-400">
              Insira suas credenciais para acessar o painel.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form
            onSubmit={handleLogin}
            className="space-y-6"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                E-mail
              </label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="bg-white/5 border-white/10 h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-white"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-300">
                  Senha
                </label>
                <Link
                  href="/recuperar-senha"
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="bg-white/5 border-white/10 h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-white"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-white text-black hover:bg-zinc-200 text-base font-semibold transition-all mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar no Dashboard"
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-zinc-500 text-sm">
            Não tem uma conta?{" "}
            <Link
              href="/onboarding"
              className="text-white font-medium hover:underline"
            >
              Crie sua barbearia
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
