"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Loader2, Users, Wallet } from "lucide-react";
import { BrandHeader, Field, FormAlert, TextInput, btn } from "@/components/brand/ui";
import { apiUrl } from "@/lib/config";

/** Os mesmos três módulos anunciados no selo do herói da landing. */
const modules = [
  { Icon: CalendarDays, label: "Agenda pública e bloqueios de horário" },
  { Icon: Users, label: "Equipe, clientes e serviços cadastrados" },
  { Icon: Wallet, label: "Financeiro, estoque e fechamento do mês" },
];

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
    <div className="gm min-h-dvh overflow-x-hidden overflow-y-visible antialiased">
      <BrandHeader actionHref="/onboarding" actionLabel="Criar conta" />

      <main className="relative px-3 pb-16 pt-6 sm:px-6 sm:pb-24 sm:pt-10">
        {/* Halos desfocados: a mesma profundidade do herói da landing */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/2 h-[26rem] w-[46rem] -translate-x-1/2 rounded-full bg-[#0d0c0a]/[0.09] blur-[130px]" />
          <div className="absolute top-52 -left-20 size-72 rounded-full bg-[#c9c3b6]/50 blur-[110px]" />
        </div>

        <div className="relative mx-auto grid w-full max-w-[1520px] items-stretch gap-3 lg:grid-cols-[1.05fr_0.95fr] lg:gap-5">
          {/* Painel de marca: mesma malha, véu e granulação do cartão do herói */}
          <section className="gm-mesh gm-scrim gm-grain relative hidden overflow-hidden rounded-[2rem] p-10 lg:flex lg:flex-col lg:justify-between xl:p-12">
            <div className="relative z-10">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/65">
                Painel Growingman
              </p>
              <h1 className="mt-6 max-w-md text-balance font-heading text-[clamp(2rem,3vw,2.9rem)] font-semibold leading-[1.06] tracking-[-0.035em] text-white">
                A agenda e a operação da sua barbearia{" "}
                <span className="bg-[linear-gradient(100deg,#ffffff_10%,#e4e0d8_55%,#b3ada0_100%)] bg-clip-text text-transparent">
                  no mesmo lugar
                </span>
              </h1>
            </div>

            <ul className="relative z-10 mt-12 space-y-3">
              {modules.map(({ Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-3.5 rounded-[1.15rem] border border-white/15 bg-white/[0.07] p-4 backdrop-blur-xl"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/15 text-white ring-1 ring-white/25"
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="text-[0.92rem] leading-6 text-white/80">{label}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Formulário */}
          <section className="rounded-[1.6rem] border border-[#e4e0d8] bg-white p-6 shadow-[0_40px_90px_-55px_rgba(13,12,10,0.75)] sm:rounded-[2rem] sm:p-10 lg:p-12">
            <div className="mx-auto flex h-full max-w-md flex-col justify-center">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[#6f6b64] sm:text-[0.68rem]">
                Acesso
              </p>
              <h2 className="mt-3 text-balance font-heading text-[clamp(1.6rem,3.4vw,2.2rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-[#0d0c0a]">
                Bem-vindo de volta
              </h2>
              <p className="mt-3 text-[0.92rem] leading-6 text-[#6f6b64] sm:text-[0.95rem]">
                Entre com o e-mail e a senha cadastrados para abrir o painel da barbearia.
              </p>

              <form onSubmit={handleLogin} className="mt-8 space-y-4">
                <Field id="login-email" label="E-mail">
                  <TextInput
                    id="login-email"
                    type="email"
                    placeholder="voce@barbearia.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </Field>

                <div>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <label htmlFor="login-password" className="text-[0.85rem] font-medium text-[#3a3733]">
                      Senha
                    </label>
                    <Link
                      href="/recuperar-senha"
                      className="rounded text-[0.78rem] text-[#6f6b64] underline-offset-4 transition-colors hover:text-[#0d0c0a] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d0c0a]"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <TextInput
                    id="login-password"
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>

                <FormAlert message={error} />

                <button type="submit" disabled={loading} className={`${btn.primary} w-full`}>
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      Entrando…
                    </>
                  ) : (
                    <>
                      Entrar no painel
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-8 border-t border-[#eae7e0] pt-6 text-[0.88rem] text-[#6f6b64]">
                Ainda não tem conta?{" "}
                <Link
                  href="/onboarding"
                  className="rounded font-semibold text-[#0d0c0a] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d0c0a]"
                >
                  Cadastre sua barbearia
                </Link>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
