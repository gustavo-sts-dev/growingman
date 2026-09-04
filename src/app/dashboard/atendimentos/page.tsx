"use client";

import { useState } from "react";
import { useResource } from "@/lib/use-resource";
import { apiGet } from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatPhone } from "@/lib/format";
import { MessagesSquare, CalendarCheck, Sparkles } from "lucide-react";

interface Conversa {
  id: string;
  clientPhone: string;
  clientName: string | null;
  turns: number;
  converted: boolean;
  startedAt: string;
  lastAt: string;
  preview: string | null;
}

interface Fala {
  autor: "cliente" | "agente";
  texto: string;
}

interface Transcricao {
  id: string;
  clientPhone: string;
  converted: boolean;
  startedAt: string;
  falas: Fala[];
}

/** Data curta no fuso da barbearia — a lista é escaneada, não lida. */
function quando(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Conversas que o atendimento automático teve no WhatsApp.
 *
 * Existe para responder "o que o robô falou com meu cliente?". Sem esta tela o
 * agente é uma caixa-preta: quando alguém chega dizendo "me disseram que tinha
 * vaga às 15h", não há onde conferir — e a dúvida vira chamado de suporte.
 */
export default function AtendimentosPage() {
  const toast = useToast();
  const { data, loading } = useResource<{ conversas: Conversa[] }>(
    "/ai/conversations",
    { conversas: [] },
  );

  const [aberta, setAberta] = useState<Transcricao | null>(null);
  const [carregandoId, setCarregandoId] = useState<string | null>(null);

  const conversas = data?.conversas ?? [];

  const abrir = async (id: string) => {
    setCarregandoId(id);
    try {
      setAberta(await apiGet<Transcricao>(`/ai/conversations/${id}`));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível abrir a conversa.");
    } finally {
      setCarregandoId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Atendimentos</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Conversas que o atendimento automático teve no seu WhatsApp.
        </p>
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : conversas.length === 0 ? (
        /*
          Vazio explica o recurso em vez de só dizer "nada aqui": esta tela é o
          primeiro lugar onde muita gente vai descobrir que o atendimento
          automático existe.
        */
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-neutral-600" />
          <p className="mt-3 text-sm font-semibold text-white">
            Nenhuma conversa por aqui ainda
          </p>
          <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-neutral-500">
            Com o atendimento automático ativo, quem chamar no WhatsApp da barbearia é
            respondido na hora e consegue marcar sozinho. As conversas aparecem aqui
            para você conferir o que foi dito.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {conversas.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => abrir(c.id)}
              disabled={carregandoId === c.id}
              className="flex w-full items-start gap-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-left transition-colors hover:bg-white/[0.04] disabled:opacity-60"
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04]">
                <MessagesSquare className="h-4 w-4 text-neutral-400" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span className="text-sm font-semibold text-white">
                    {c.clientName ?? formatPhone(c.clientPhone)}
                  </span>
                  {/*
                    O selo responde de longe a pergunta que importa: esta
                    conversa deu em agendamento ou não?
                  */}
                  {c.converted && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/[0.08] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                      <CalendarCheck className="h-3 w-3" />
                      Agendou
                    </span>
                  )}
                </div>

                {c.preview && (
                  <p className="mt-1 truncate text-sm text-neutral-400">{c.preview}</p>
                )}

                <p className="mt-1.5 text-xs text-neutral-600">
                  {quando(c.lastAt)} · {c.turns} {c.turns === 1 ? "troca" : "trocas"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal
        open={aberta !== null}
        onClose={() => setAberta(null)}
        title="Conversa"
        description={
          aberta
            ? `${formatPhone(aberta.clientPhone)} · ${quando(aberta.startedAt)}`
            : undefined
        }
      >
        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {aberta?.falas.length === 0 && (
            <p className="text-sm text-neutral-500">
              Esta conversa não tem mensagens registradas.
            </p>
          )}

          {aberta?.falas.map((f, i) => (
            <div
              key={i}
              className={`flex ${f.autor === "cliente" ? "justify-start" : "justify-end"}`}
            >
              {/*
                Cliente à esquerda, agente à direita — a mesma convenção do
                próprio WhatsApp, para a leitura ser imediata.
              */}
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  f.autor === "cliente"
                    ? "rounded-tl-sm bg-white/[0.05] text-neutral-200"
                    : "rounded-tr-sm bg-emerald-500/[0.10] text-emerald-50"
                }`}
              >
                {f.texto}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
