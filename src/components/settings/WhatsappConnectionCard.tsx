"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { formatPhone, onlyDigits } from "@/lib/format";
import { MessageCircle, Shield, Smartphone, QrCode, Sparkles } from "lucide-react";

interface StatusWhatsapp {
  provisionado: boolean;
  conectado: boolean;
  numero: string | null;
  qrcode?: string;
  paircode?: string;
  disponivel: boolean;
  ia: { limite: number; usadas: number; restantes: number } | null;
}

/** De quanto em quanto tempo perguntamos se o pareamento terminou. */
const POLL_MS = 3000;

/**
 * O QR do WhatsApp expira em torno de 60s e a uazapi gera outro; paramos de
 * consultar bem depois disso para não deixar um laço vivo numa aba esquecida
 * aberta a tarde inteira.
 */
const POLL_TIMEOUT_MS = 3 * 60 * 1000;

/** Aceita tanto data URI pronto quanto base64 cru. */
function comoImagem(qr: string): string {
  return qr.startsWith("data:") ? qr : `data:image/png;base64,${qr}`;
}

/**
 * Conexão do WhatsApp próprio da barbearia.
 *
 * Componente separado da página de configurações de propósito: ele tem estado
 * vivo (consulta em laço enquanto o QR está na tela) e a página é um formulário
 * grande e estático. Misturar os dois faria a página inteira re-renderizar a
 * cada três segundos enquanto alguém pareia o celular.
 */
export function WhatsappConnectionCard() {
  const toast = useToast();
  const [status, setStatus] = useState<StatusWhatsapp | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [agindo, setAgindo] = useState(false);
  const [porCodigo, setPorCodigo] = useState(false);
  const [telefone, setTelefone] = useState("");

  // `useRef` e não estado: só o efeito de polling lê isto, e guardá-lo em
  // estado dispararia um render a cada tique sem mudar nada na tela.
  const inicioPoll = useRef<number>(0);

  const buscarStatus = useCallback(async () => {
    return apiGet<StatusWhatsapp>("/whatsapp/status");
  }, []);

  useEffect(() => {
    let vivo = true;
    buscarStatus()
      .then((s) => vivo && setStatus(s))
      .catch(() => vivo && setStatus(null))
      .finally(() => vivo && setCarregando(false));
    return () => {
      vivo = false;
    };
  }, [buscarStatus]);

  // Enquanto há QR/código na tela, pergunta de tempos em tempos se conectou.
  // O webhook também avisa o servidor, mas o navegador precisa descobrir de
  // alguma forma — e em dev a uazapi nem alcança o nosso webhook.
  const aguardandoPareamento =
    !!status?.provisionado && !status.conectado && (!!status.qrcode || !!status.paircode);

  useEffect(() => {
    if (!aguardandoPareamento) return;

    if (!inicioPoll.current) inicioPoll.current = Date.now();
    let vivo = true;

    const id = setInterval(async () => {
      if (Date.now() - inicioPoll.current > POLL_TIMEOUT_MS) {
        clearInterval(id);
        return;
      }
      try {
        const s = await buscarStatus();
        if (!vivo) return;
        setStatus(s);
        if (s.conectado) {
          clearInterval(id);
          toast.success("WhatsApp conectado.");
        }
      } catch {
        /* erro de rede isolado: a próxima passada tenta de novo */
      }
    }, POLL_MS);

    return () => {
      vivo = false;
      clearInterval(id);
    };
  }, [aguardandoPareamento, buscarStatus, toast]);

  const conectar = async () => {
    const digitos = onlyDigits(telefone);
    if (porCodigo && digitos.length < 10) {
      toast.error("Informe o número com DDD para receber o código.");
      return;
    }

    setAgindo(true);
    inicioPoll.current = 0;
    try {
      const s = await apiPost<StatusWhatsapp>("/whatsapp/connect", {
        ...(porCodigo ? { phone: digitos } : {}),
      });
      setStatus(s);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível iniciar a conexão.");
    } finally {
      setAgindo(false);
    }
  };

  const desconectar = async () => {
    setAgindo(true);
    try {
      await apiDelete("/whatsapp");
      setStatus({ provisionado: false, conectado: false, numero: null, disponivel: true, ia: null });
      toast.success("Número desconectado. Os agendamentos voltam a sair pelo número do sistema.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível desconectar.");
    } finally {
      setAgindo(false);
    }
  };

  // Servidor sem suporte configurado: o cartão não existe, em vez de existir e
  // dar erro quando alguém clicar.
  if (!carregando && !status?.disponivel) return null;

  return (
    <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
      <div className="px-5 py-3 bg-white/[0.02] border-b border-white/[0.05]">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          WhatsApp da Barbearia
        </p>
      </div>

      <div className="p-5 space-y-4">
        {carregando ? (
          <div className="h-11 rounded-xl bg-white/[0.03] animate-pulse" />
        ) : status?.conectado ? (
          <>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
              <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">Conectado</p>
                <p className="text-xs text-neutral-400 truncate">
                  {status.numero ? formatPhone(status.numero) : "Número pareado"}
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-500 leading-relaxed">
              As confirmações e lembretes de agendamento saem por este número. O código
              de acesso que seus clientes usam para entrar continua vindo do número do
              Growingman — assim ninguém fica sem conseguir entrar se este aqui cair.
            </p>

            {/*
              Só aparece para quem contratou o atendimento automático. Sem o
              add-on o cartão não menciona IA, em vez de mostrar "0 de 0".
            */}
            {status.ia && (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="text-sm font-semibold text-white">
                      Atendimento automático
                    </span>
                  </div>
                  <span className="text-xs text-neutral-400 tabular-nums shrink-0">
                    {status.ia.restantes} de {status.ia.limite}
                  </span>
                </div>

                <div className="mt-2.5 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500/70"
                    style={{
                      width: `${Math.min(100, (status.ia.usadas / Math.max(status.ia.limite, 1)) * 100)}%`,
                    }}
                  />
                </div>

                <p className="mt-2.5 text-xs text-neutral-500 leading-relaxed">
                  {status.ia.restantes > 0
                    ? "Quem chamar no WhatsApp é atendido e consegue marcar sozinho. As conversas do mês renovam no dia 1."
                    : "As conversas do mês acabaram. Quem chamar recebe o link de agendamento e o contato do barbeiro."}
                </p>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              disabled={agindo}
              onClick={desconectar}
              className="w-full h-11 rounded-xl border-red-500/20 text-red-400 hover:bg-red-500/10"
            >
              {agindo ? "Desconectando..." : "Desconectar número"}
            </Button>
          </>
        ) : aguardandoPareamento ? (
          <>
            {status?.paircode ? (
              <div className="space-y-2 text-center">
                <p className="text-xs text-neutral-500">
                  No WhatsApp: Aparelhos conectados → Conectar aparelho → Conectar com
                  número de telefone.
                </p>
                <p className="text-3xl font-bold tracking-[0.3em] text-white">
                  {status.paircode}
                </p>
              </div>
            ) : status?.qrcode ? (
              <div className="space-y-2">
                <div className="rounded-xl bg-white p-3 mx-auto w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={comoImagem(status.qrcode)}
                    alt="QR Code para conectar o WhatsApp"
                    className="w-44 h-44"
                  />
                </div>
                <p className="text-xs text-neutral-500 text-center">
                  No WhatsApp: Aparelhos conectados → Conectar aparelho.
                </p>
              </div>
            ) : null}

            <p className="text-xs text-neutral-600 text-center">
              Aguardando você parear no celular...
            </p>

            <Button
              type="button"
              variant="outline"
              disabled={agindo}
              onClick={conectar}
              className="w-full h-11 rounded-xl"
            >
              {agindo ? "Gerando..." : "Gerar novo código"}
            </Button>
          </>
        ) : (
          <>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Conecte o WhatsApp da barbearia para que as confirmações e lembretes de
              agendamento cheguem ao cliente pelo <strong>seu</strong> número, e não por
              um desconhecido. Sem conectar, tudo continua funcionando pelo número do
              Growingman.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPorCodigo(false)}
                className={`flex-1 h-10 rounded-xl border text-xs font-semibold transition-colors ${
                  porCodigo
                    ? "border-white/[0.08] text-neutral-400 hover:bg-white/[0.04]"
                    : "border-white/25 bg-white/[0.06] text-white"
                }`}
              >
                <QrCode className="w-3.5 h-3.5 inline mr-1.5" />
                QR Code
              </button>
              <button
                type="button"
                onClick={() => setPorCodigo(true)}
                className={`flex-1 h-10 rounded-xl border text-xs font-semibold transition-colors ${
                  porCodigo
                    ? "border-white/25 bg-white/[0.06] text-white"
                    : "border-white/[0.08] text-neutral-400 hover:bg-white/[0.04]"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 inline mr-1.5" />
                Código
              </button>
            </div>

            {/*
              O código por telefone existe porque o painel costuma estar aberto no
              MESMO celular onde o WhatsApp roda — e aí não há uma segunda tela
              para escanear o QR.
            */}
            {porCodigo && (
              <Input
                type="tel"
                inputMode="numeric"
                value={telefone}
                onChange={(e) => setTelefone(formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                className="bg-white/[0.04] border-white/[0.08] rounded-xl h-11"
              />
            )}

            <Button
              type="button"
              disabled={agindo}
              onClick={conectar}
              className="w-full h-11 rounded-xl font-semibold"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {agindo ? "Preparando..." : "Conectar meu número"}
            </Button>
          </>
        )}

        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <Shield className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
          <p className="text-xs text-neutral-500 leading-relaxed">
            A conexão usa o WhatsApp que já está no seu celular — não pedimos senha, e
            você pode desconectar aqui ou pelo próprio aparelho a qualquer momento.
          </p>
        </div>
      </div>
    </div>
  );
}
