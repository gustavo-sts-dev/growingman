"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  XCircle,
} from "lucide-react";
import { btn } from "@/components/brand/ui";
import { apiUrl } from "@/lib/config";

type PixPayment = {
  paymentId: string;
  invoiceUrl: string;
  dueDate: string;
  value: number;
  qrCodeBase64: string;
  qrCodePayload: string;
};

type ConfirmResult =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "success";
      billingRequired: boolean;
      /** Piloto de lançamento: paga metade nos primeiros meses. */
      pilot: { percent: number; months: number } | null;
      payment: Partial<PixPayment> | null;
    };

export default function ConfirmarCadastro() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const hasCalled = useRef(false);
  const [result, setResult] = useState<ConfirmResult>({ status: "loading" });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token || hasCalled.current) return;
    hasCalled.current = true;

    const confirm = async () => {
      try {
        const response = await fetch(
          apiUrl(`/tenants/onboarding/confirm?token=${encodeURIComponent(token)}`),
        );
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          setResult({
            status: "error",
            message: data?.message ?? "Link inválido ou expirado.",
          });
          return;
        }

        setResult({
          status: "success",
          billingRequired: data.billingRequired ?? false,
          pilot: data.pilot ?? null,
          payment: data.payment ?? null,
        });
      } catch {
        setResult({
          status: "error",
          message: "Não foi possível conectar ao servidor. Tente novamente.",
        });
      }
    };

    confirm();
  }, [token]);

  const copyPixPayload = async (payload: string) => {
    await navigator.clipboard.writeText(payload);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  };

  // ── Token ausente ──────────────────────────────────────────────────────────
  if (!token) {
    return (
      <Card>
        <ErrorState
          message="Link inválido. Verifique se o endereço foi copiado corretamente."
        />
      </Card>
    );
  }

  // ── Carregando ─────────────────────────────────────────────────────────────
  if (result.status === "loading") {
    return (
      <Card>
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <Loader2 className="size-10 animate-spin text-[#0d0c0a]" aria-label="Verificando…" />
          <p className="text-[0.9rem] text-[#6f6b64]">Verificando seu e-mail e criando a conta…</p>
        </div>
      </Card>
    );
  }

  // ── Erro ───────────────────────────────────────────────────────────────────
  if (result.status === "error") {
    return (
      <Card>
        <ErrorState message={result.message} />
      </Card>
    );
  }

  /*
    Sucesso sem cobrança.

    Antes isto cobria dois casos: a cortesia de lançamento e o ambiente de
    desenvolvimento. A piloto agora PAGA (metade), então só resta o segundo —
    quando `BILLING_ENABLED` está desligada.
  */
  if (!result.billingRequired) {

    return (
      <Card>
        <div className="space-y-6">
          <header>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[#6f6b64]">
              Conta criada
            </p>
            <h1 className="mt-3 font-heading text-[clamp(1.45rem,3.4vw,1.9rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-[#0d0c0a]">
              Barbearia cadastrada
            </h1>
            <p className="mt-2.5 text-[0.9rem] leading-6 text-[#6f6b64]">
              Sua conta foi criada com sucesso. Faça login para acessar o painel.
            </p>
          </header>

          <div className="flex items-center gap-3.5 rounded-[1.15rem] border border-[#e4e0d8] bg-[#faf9f6] p-4 sm:p-5">
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-[#0d0c0a] text-white"
            >
              <Check className="size-4" strokeWidth={3} />
            </span>
            <p className="min-w-0 text-[0.9rem] leading-6 text-[#3a3733]">
              E-mail verificado e conta ativa
            </p>
          </div>

          <p className="border-t border-[#eae7e0] pt-6 text-[0.9rem] leading-6 text-[#6f6b64]">
            Entre com o e-mail e a senha cadastrados para abrir o painel.
          </p>

          <Link href="/login" className={`${btn.primary} w-full`}>
            Ir para o login
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </Card>
    );
  }

  // ── Sucesso com PIX ────────────────────────────────────────────────────────
  const pix = result.payment as Partial<PixPayment> | null;
  const hasQr = pix?.qrCodeBase64 && pix?.qrCodePayload;

  return (
    <Card>
      <div className="space-y-6">
        <header>
          {/* A piloto precisa VER que o valor já vem com desconto. Sem isto ela
              lê "Pague R$ 35" sem saber que são 50% de abatimento, e o
              benefício passa despercebido justamente na tela que decide. */}
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[#6f6b64]">
            {result.pilot ? "Vaga de lançamento" : "Cobrança gerada"}
          </p>
          <h1 className="mt-3 font-heading text-[clamp(1.45rem,3.4vw,1.9rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-[#0d0c0a]">
            {pix?.value
              ? `Pague R$ ${pix.value.toFixed(2).replace(".", ",")} via Pix`
              : "Conta criada com sucesso"}
          </h1>
          <p className="mt-2.5 text-[0.9rem] leading-6 text-[#6f6b64]">
            {result.pilot && pix?.dueDate
              ? `Você pegou uma das vagas de lançamento: ${result.pilot.percent}% de desconto pelos primeiros ${result.pilot.months} meses, já aplicado neste valor. Vencimento em ${new Date(`${pix.dueDate}T12:00:00`).toLocaleDateString("pt-BR")}.`
              : pix?.dueDate
              ? `Escaneie o QR Code ou copie o código. Vencimento em ${new Date(`${pix.dueDate}T12:00:00`).toLocaleDateString("pt-BR")}.`
              : "Acesse o painel e conclua o pagamento quando quiser."}
          </p>
        </header>

        {hasQr && (
          <div className="mx-auto w-full max-w-64 rounded-[1.15rem] border border-[#e4e0d8] bg-white p-4 shadow-[0_20px_44px_-34px_rgba(13,12,10,0.55)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${pix!.qrCodeBase64}`}
              alt="QR Code da cobrança Pix"
              className="aspect-square h-auto w-full"
            />
          </div>
        )}

        <div className="space-y-3">
          {hasQr && (
            <button
              type="button"
              onClick={() => copyPixPayload(pix!.qrCodePayload!)}
              className={`${btn.secondary} w-full`}
            >
              {copied ? (
                <>
                  <Check className="size-3.5" aria-hidden="true" />
                  Código copiado
                </>
              ) : (
                <>
                  <Copy className="size-3.5" aria-hidden="true" />
                  Copiar código Pix
                </>
              )}
            </button>
          )}
          {pix?.invoiceUrl && (
            <a
              href={pix.invoiceUrl}
              target="_blank"
              rel="noreferrer"
              className={`${btn.secondary} w-full`}
            >
              Abrir cobrança no Asaas
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          )}
        </div>

        <p className="border-t border-[#eae7e0] pt-6 text-[0.9rem] leading-6 text-[#6f6b64]">
          Depois do pagamento, entre com o e-mail e a senha cadastrados.
        </p>

        <Link href="/login" className={`${btn.primary} w-full`}>
          Ir para o login
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </Card>
  );
}

// ── Componentes auxiliares ─────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mt-8 rounded-[1.6rem] bg-[linear-gradient(160deg,#c9c3b6_0%,#e4e0d8_45%,rgba(228,224,216,0)_100%)] p-px shadow-[0_40px_90px_-55px_rgba(13,12,10,0.75)] sm:mt-10 sm:rounded-[1.85rem]">
        <section className="rounded-[1.55rem] bg-white p-6 sm:rounded-[1.8rem] sm:p-10">
          {children}
        </section>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <XCircle className="size-12 text-red-500" aria-hidden="true" />
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[#6f6b64]">
            Não foi possível confirmar
          </p>
          <h1 className="mt-3 font-heading text-[clamp(1.3rem,3vw,1.7rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-[#0d0c0a]">
            Link inválido ou expirado
          </h1>
          <p className="mt-2.5 text-[0.9rem] leading-6 text-[#6f6b64]">{message}</p>
        </div>
      </div>

      <div className="rounded-[1.15rem] border border-[#e4e0d8] bg-[#faf9f6] p-4 text-[0.82rem] leading-5 text-[#6f6b64]">
        O link de verificação expira após <strong className="text-[#0d0c0a]">24 horas</strong>.
        Inicie um novo cadastro e solicite o reenvio do e-mail se necessário.
      </div>

      <Link href="/onboarding" className={`${btn.primary} w-full`}>
        Iniciar novo cadastro
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}
