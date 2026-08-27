"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, Loader2, Scissors, User, X } from "lucide-react";

import { apiGet, apiPost } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/components/ui/toast";

/**
 * Lista de agendamentos do cliente, com cancelamento.
 *
 * Todo o recorte por dono acontece no servidor: esta tela pede `/bookings/my` e
 * recebe só o que é dela. Nada aqui filtra por cliente — uma listagem que
 * filtrasse no navegador já teria recebido os dados de todo mundo antes de
 * escondê-los.
 */

interface AgendamentoItem {
  catalog_item: { name: string } | null;
  barber_profile: { user: { name: string } | null } | null;
}

interface Agendamento {
  id: string;
  start_time: string;
  status: string;
  total_amount: string | number;
  items: AgendamentoItem[];
}

const STATUS = {
  CONFIRMED: { rotulo: "Confirmado", cor: "#4ade80" },
  PENDING_PAYMENT: { rotulo: "Aguardando pagamento", cor: "#fbbf24" },
  COMPLETED: { rotulo: "Concluído", cor: "#60a5fa" },
  CANCELLED: { rotulo: "Cancelado", cor: "#a1a1aa" },
  NO_SHOW: { rotulo: "Não compareceu", cor: "#f87171" },
} as const;

/** Só faz sentido cancelar o que ainda vai acontecer. */
const cancelavel = (a: Agendamento) =>
  (a.status === "CONFIRMED" || a.status === "PENDING_PAYMENT") &&
  new Date(a.start_time).getTime() > Date.now();

function formatarQuando(iso: string) {
  const d = new Date(iso);
  return {
    data: d.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    }),
    hora: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}

export function MeusAgendamentos({
  tenantSlug,
  tenantName,
}: {
  tenantSlug: string;
  tenantName: string;
}) {
  const router = useRouter();
  const toast = useToast();

  const [agendamentos, setAgendamentos] = useState<Agendamento[] | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<Agendamento | null>(null);

  const buscar = useCallback(async () => {
    try {
      setAgendamentos(await apiGet<Agendamento[]>("/bookings/my"));
    } catch (err) {
      // Rede de segurança. No caminho comum o próprio apiFetch já redireciona
      // para `/<slug>/entrar` ao ver o 401 (ver destinoDeLogin). Isto cobre o
      // caso em que outra requisição está renovando o token e esta recebe o 401
      // original de volta, sem redirecionamento.
      const msg = err instanceof Error ? err.message : "";
      if (/401|não autenticado|unauthorized/i.test(msg)) {
        router.replace(`/${tenantSlug}/entrar`);
        return;
      }
      toast.error("Não foi possível carregar seus agendamentos.");
    } finally {
      setCarregando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void buscar();
  }, [buscar]);

  const cancelar = async (a: Agendamento) => {
    setCancelando(a.id);
    try {
      const r = await apiPost<{ withinPolicy: boolean | null; depositForfeited: boolean }>(
        `/bookings/my/${a.id}/cancel`,
      );

      // O servidor decide se foi dentro do prazo; a tela só relata. Dizer
      // "cancelado" sem mais nada esconderia um sinal retido.
      if (r.depositForfeited) {
        toast.error("Cancelado fora do prazo — o sinal pago não será devolvido.");
      } else if (r.withinPolicy === false) {
        toast.error("Cancelado fora do prazo combinado com a barbearia.");
      } else {
        toast.success("Agendamento cancelado.");
      }

      await buscar();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Não foi possível cancelar.",
      );
    } finally {
      setCancelando(null);
      setConfirmando(null);
    }
  };

  const titulo = { color: "var(--theme-title)" };
  const cartao = { backgroundColor: "var(--theme-card)" };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <header className="mb-8">
        <Link
          href={`/${tenantSlug}`}
          className="text-sm opacity-70 transition-opacity hover:opacity-100"
        >
          ← {tenantName}
        </Link>
        <h1
          className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl"
          style={titulo}
        >
          Meus agendamentos
        </h1>
      </header>

      {carregando && (
        <div className="flex items-center justify-center gap-2 py-16 opacity-70">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando…
        </div>
      )}

      {!carregando && agendamentos?.length === 0 && (
        <div
          className="rounded-2xl px-6 py-12 text-center"
          style={cartao}
        >
          <Scissors className="mx-auto mb-3 h-6 w-6 opacity-40" />
          <p className="font-semibold" style={titulo}>
            Você ainda não tem agendamentos
          </p>
          <p className="mt-1 text-sm opacity-70">
            Marque um horário e ele aparece aqui.
          </p>
          <Link
            href={`/${tenantSlug}/agendar`}
            className="mt-5 inline-block rounded-xl px-5 py-2.5 text-sm font-bold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "var(--theme-button-bg)",
              color: "var(--theme-button-text)",
            }}
          >
            Agendar horário
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {(agendamentos ?? []).map((a) => {
          const quando = formatarQuando(a.start_time);
          const st = STATUS[a.status as keyof typeof STATUS] ?? {
            rotulo: a.status,
            cor: "#a1a1aa",
          };
          const servicos = a.items
            .map((i) => i.catalog_item?.name)
            .filter(Boolean)
            .join(" + ");
          const profissional = a.items[0]?.barber_profile?.user?.name;

          return (
            <article
              key={a.id}
              className="rounded-2xl p-5"
              style={cartao}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold" style={titulo}>
                    {servicos || "Atendimento"}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm opacity-75">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {quando.data}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {quando.hora}
                    </span>
                    {profissional && (
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        {profissional}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  {/* A cor sozinha não carrega o estado: o rótulo diz. */}
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                    style={{ color: st.cor, backgroundColor: `${st.cor}1a` }}
                  >
                    {st.rotulo}
                  </span>
                  <span className="text-sm font-bold" style={titulo}>
                    {formatCurrency(Number(a.total_amount))}
                  </span>
                </div>
              </div>

              {cancelavel(a) && (
                <button
                  type="button"
                  onClick={() => setConfirmando(a)}
                  disabled={cancelando === a.id}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-current/20 px-3 py-2 text-xs font-semibold opacity-70 transition-opacity hover:opacity-100 disabled:opacity-40"
                >
                  {cancelando === a.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                  Cancelar agendamento
                </button>
              )}
            </article>
          );
        })}
      </div>

      {/* Confirmação: cancelar é irreversível e o clique é fácil de dar sem querer. */}
      {confirmando && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          onClick={() => setConfirmando(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={cartao}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold" style={titulo}>
              Cancelar este agendamento?
            </h2>
            <p className="mt-2 text-sm opacity-75">
              {formatarQuando(confirmando.start_time).data} às{" "}
              {formatarQuando(confirmando.start_time).hora}. Se quiser outro
              horário depois, é só agendar de novo.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmando(null)}
                className="flex-1 rounded-xl border border-current/20 py-3 text-sm font-semibold opacity-75 transition-opacity hover:opacity-100"
              >
                Manter
              </button>
              <button
                type="button"
                onClick={() => cancelar(confirmando)}
                disabled={cancelando !== null}
                className="flex-1 rounded-xl bg-red-500/15 py-3 text-sm font-bold text-red-400 transition-colors hover:bg-red-500/25 disabled:opacity-50"
              >
                {cancelando ? "Cancelando…" : "Cancelar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
