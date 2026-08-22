"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

/**
 * Painel da PLATAFORMA — visão cross-tenant, restrita a SUPERADMIN.
 *
 * Fica fora de `/dashboard` de propósito: aquele layout é da barbearia (menu de
 * agenda, serviços, financeiro do tenant) e este mostra dados de TODAS elas.
 * Misturar os dois confundiria o contexto de quem usa e o de quem lê o código.
 *
 * A guarda aqui é de EXPERIÊNCIA, não de segurança: quem decide é o
 * `app.authorize(['SUPERADMIN'])` do backend, que responde 403 mesmo se alguém
 * abrir a rota na mão. Isto só evita mostrar uma tela quebrada a quem não tem
 * acesso.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"checando" | "liberado" | "negado">(
    "checando",
  );

  useEffect(() => {
    let cancelado = false;

    apiGet<AuthUser>("/auth/me")
      .then((user) => {
        if (cancelado) return;
        setStatus(user?.role === "SUPERADMIN" ? "liberado" : "negado");
      })
      .catch(() => {
        // Sem sessão o próprio apiFetch já redireciona para /login; aqui só
        // evitamos deixar a tela presa em "checando".
        if (!cancelado) setStatus("negado");
      });

    return () => {
      cancelado = true;
    };
  }, []);

  if (status === "checando") {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-600" />
      </div>
    );
  }

  if (status === "negado") {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-bold text-white">Área restrita</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Esta é a administração da plataforma. Sua conta não tem acesso.
          </p>
          <button
            onClick={() => router.replace("/dashboard")}
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black transition-colors hover:bg-neutral-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao meu painel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-white/[0.06] bg-[#080808] px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
            <ShieldCheck className="h-4 w-4 text-neutral-400" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight">
              Growingman
            </p>
            <p className="truncate text-[0.7rem] uppercase tracking-[0.18em] text-neutral-600">
              Plataforma
            </p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="shrink-0 rounded-xl border border-white/[0.08] px-3 py-2 text-xs font-semibold text-neutral-400 transition-colors hover:text-white"
        >
          Meu painel
        </Link>
      </header>

      {/* `overflow-x-clip`: mesma decisão do painel da barbearia — a coluna de
          conteúdo não rola na horizontal; quem rola são as tabelas, que têm
          scroller próprio. */}
      <main className="overflow-x-clip p-4 sm:p-6 md:p-8">{children}</main>
    </div>
  );
}
