"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scissors, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { apiUrl } from "@/lib/config";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl("/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // O backend responde SEMPRE 200 genérico (não revela se o e-mail existe).
      // Só tratamos como erro problemas reais (rate limit, indisponibilidade).
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        if (response.status === 429) {
          throw new Error("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
        }
        throw new Error(data?.message || `Erro ao enviar (${response.status}).`);
      }

      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível conectar ao servidor. Verifique sua conexão."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center p-8 sm:p-12">
      <div className="w-full max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <Scissors className="w-5 h-5 text-black" />
          </div>
          <span className="font-bold text-xl tracking-tighter">ICON</span>
        </div>

        {sent ? (
          <div>
            <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                Se o e-mail existir, enviamos as instruções de recuperação. Verifique sua
                caixa de entrada (e o spam).
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para o login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-10">
              <h2 className="text-3xl font-bold mb-3">Recuperar senha</h2>
              <p className="text-zinc-400">
                Informe seu e-mail e enviaremos um link para redefinir sua senha.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">E-mail</label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-white"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-white text-black hover:bg-zinc-200 text-base font-semibold transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar link de recuperação"
                )}
              </Button>
            </form>

            <Link
              href="/login"
              className="mt-8 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para o login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
