"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scissors, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { apiUrl } from "@/lib/config";

function RedefinirSenhaForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Link inválido ou incompleto. Solicite uma nova recuperação de senha.");
      return;
    }
    if (password.length < 12) {
      setError("A senha deve ter pelo menos 12 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(apiUrl("/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 400 || response.status === 401) {
          throw new Error(
            "Link inválido ou expirado. Solicite uma nova recuperação de senha."
          );
        }
        if (response.status === 429) {
          throw new Error("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
        }
        throw new Error(data?.message || `Erro ao redefinir senha (${response.status}).`);
      }

      // Sucesso: leva ao login.
      router.push("/login");
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
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
          <Scissors className="w-5 h-5 text-black" />
        </div>
        <span className="font-bold text-xl tracking-tighter">ICON</span>
      </div>

      <div className="mb-10">
        <h2 className="text-3xl font-bold mb-3">Redefinir senha</h2>
        <p className="text-zinc-400">Escolha uma nova senha para a sua conta.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Nova senha</label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={12}
            autoComplete="new-password"
            className="bg-white/5 border-white/10 h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-white"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Confirmar nova senha</label>
          <Input
            type="password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={12}
            autoComplete="new-password"
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
              Redefinindo...
            </>
          ) : (
            "Redefinir senha"
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
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center p-8 sm:p-12">
      <Suspense
        fallback={
          <div className="w-full max-w-md mx-auto flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
          </div>
        }
      >
        <RedefinirSenhaForm />
      </Suspense>
    </div>
  );
}
