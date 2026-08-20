"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Copy, ExternalLink, Loader2 } from "lucide-react";
import { Field, FormAlert, TextInput, btn } from "@/components/brand/ui";
import { apiUrl, siteHost } from "@/lib/config";

type PixPayment = {
  paymentId: string;
  invoiceUrl: string;
  dueDate: string;
  value: number;
  qrCodeBase64: string;
  qrCodePayload: string;
};

const STEP_LABELS = ["Responsável", "Barbearia", "Pagamento"];

/** Fora de produção o backend dispensa a cobrança — a última etapa vira confirmação. */
const STEP_LABELS_SEM_COBRANCA = ["Responsável", "Barbearia", "Conclusão"];

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminCpfCnpj, setAdminCpfCnpj] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [pixData, setPixData] = useState<PixPayment | null>(null);
  const [billingRequired, setBillingRequired] = useState(true);
  /** Preenchido quando a barbearia pegou uma das vagas de cortesia de lançamento. */
  const [trial, setTrial] = useState<{ months: number; endsAt: string } | null>(null);

  const validateOwner = () => {
    const documentLength = adminCpfCnpj.replace(/\D/g, "").length;
    if (adminName.trim().length < 3) return "Informe seu nome completo.";
    if (!/^\S+@\S+\.\S+$/.test(adminEmail)) return "Informe um e-mail válido.";
    if (![11, 14].includes(documentLength)) return "Informe um CPF ou CNPJ válido.";
    if (adminPassword.length < 12) return "A senha deve ter pelo menos 12 caracteres.";
    return "";
  };

  const goToBusiness = () => {
    const error = validateOwner();
    if (error) {
      setErrorMsg(error);
      return;
    }
    setErrorMsg("");
    setStep(2);
  };

  const handleCreateAccount = async () => {
    if (tenantName.trim().length < 3) {
      setErrorMsg("Informe o nome da barbearia.");
      return;
    }
    if (tenantSlug.length < 3) {
      setErrorMsg("Escolha um endereço com pelo menos 3 caracteres.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const response = await fetch(apiUrl("/tenants/onboarding"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminName: adminName.trim(),
          adminEmail: adminEmail.trim(),
          adminCpfCnpj: adminCpfCnpj.replace(/\D/g, ""),
          adminPassword,
          tenantName: tenantName.trim(),
          tenantSlug,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Não foi possível criar a cobrança.");
      }

      // Fora de produção o backend cria a conta sem gerar cobrança. Este flag
      // distingue "cobrança dispensada" de "cobrança que falhou" — sem ele, a
      // ausência de QR Code cairia no erro logo abaixo.
      if (data?.billingRequired === false) {
        setBillingRequired(false);
        // Duas razões distintas para não haver cobrança: cortesia de lançamento
        // (produção) ou a flag de ambiente desligada (dev). O texto muda.
        setTrial(
          data?.trialMonths && data?.trialEndsAt
            ? { months: data.trialMonths, endsAt: data.trialEndsAt }
            : null,
        );
        setStep(3);
        return;
      }

      const payment = data?.payment as Partial<PixPayment> | undefined;
      if (
        !payment?.paymentId ||
        !payment.invoiceUrl ||
        !payment.qrCodeBase64 ||
        !payment.qrCodePayload
      ) {
        throw new Error("A cobrança foi criada sem um QR Code válido. Tente novamente.");
      }

      setPixData(payment as PixPayment);
      setStep(3);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Não foi possível criar a conta.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyPixPayload = async () => {
    if (!pixData?.qrCodePayload) return;
    await navigator.clipboard.writeText(pixData.qrCodePayload);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <Stepper
        current={step}
        labels={billingRequired ? STEP_LABELS : STEP_LABELS_SEM_COBRANCA}
      />

      {/* Borda em gradiente: o mesmo destaque do cartão de plano da landing */}
      <div className="mt-8 rounded-[1.6rem] bg-[linear-gradient(160deg,#c9c3b6_0%,#e4e0d8_45%,rgba(228,224,216,0)_100%)] p-px shadow-[0_40px_90px_-55px_rgba(13,12,10,0.75)] sm:mt-10 sm:rounded-[1.85rem]">
        <section className="rounded-[1.55rem] bg-white p-6 sm:rounded-[1.8rem] sm:p-10">
          {step === 1 && (
            <div className="space-y-6">
              <StepHeader
                eyebrow="Dados de acesso"
                title="Quem administra a barbearia?"
                text="Use os dados do responsável pela assinatura."
              />

              <div className="space-y-4">
                <Field id="admin-name" label="Nome completo">
                  <TextInput
                    id="admin-name"
                    value={adminName}
                    onChange={(event) => setAdminName(event.target.value)}
                    autoComplete="name"
                  />
                </Field>
                <Field id="admin-email" label="E-mail">
                  <TextInput
                    id="admin-email"
                    type="email"
                    value={adminEmail}
                    onChange={(event) => setAdminEmail(event.target.value)}
                    autoComplete="email"
                  />
                </Field>
                <Field id="admin-document" label="CPF ou CNPJ">
                  <TextInput
                    id="admin-document"
                    value={adminCpfCnpj}
                    onChange={(event) => setAdminCpfCnpj(event.target.value)}
                    inputMode="numeric"
                    autoComplete="off"
                  />
                </Field>
                <Field id="admin-password" label="Senha" hint="Mínimo de 12 caracteres">
                  <TextInput
                    id="admin-password"
                    type="password"
                    value={adminPassword}
                    onChange={(event) => setAdminPassword(event.target.value)}
                    minLength={12}
                    autoComplete="new-password"
                  />
                </Field>
              </div>

              <FormAlert message={errorMsg || null} />

              <button type="button" onClick={goToBusiness} className={`${btn.primary} w-full`}>
                Continuar
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg("");
                    setStep(1);
                  }}
                  className="mb-5 inline-flex items-center gap-2 rounded-lg text-[0.85rem] font-medium text-[#6f6b64] transition-colors hover:text-[#0d0c0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d0c0a]"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Voltar
                </button>
                <StepHeader
                  eyebrow="Identificação pública"
                  title="Dados da barbearia"
                  text="O endereço abaixo será usado pelos clientes para agendar."
                />
              </div>

              <div className="space-y-4">
                <Field id="tenant-name" label="Nome da barbearia">
                  <TextInput
                    id="tenant-name"
                    value={tenantName}
                    onChange={(event) => {
                      const name = event.target.value;
                      setTenantName(name);
                      setTenantSlug(normalizeSlug(name));
                    }}
                  />
                </Field>
                <Field id="tenant-slug" label="Endereço da agenda">
                  <div className="grid w-full min-w-0 sm:grid-cols-[auto_minmax(8rem,1fr)]">
                    <span
                      className="flex h-12 min-w-0 items-center overflow-hidden text-ellipsis whitespace-nowrap rounded-t-xl border border-b-0 border-[#d9d4c9] bg-[#f3f1ec] px-3 text-[0.8rem] text-[#6f6b64] sm:rounded-l-xl sm:rounded-tr-none sm:border-b sm:border-r-0"
                      title={`${siteHost()}/`}
                    >
                      {siteHost()}/
                    </span>
                    <TextInput
                      id="tenant-slug"
                      className="min-w-0 rounded-t-none sm:rounded-l-none sm:rounded-tr-xl"
                      value={tenantSlug}
                      onChange={(event) => setTenantSlug(normalizeSlug(event.target.value))}
                    />
                  </div>
                </Field>
              </div>

              {/* Resumo da cobrança, no mesmo padrão da seção de plano */}
              <div className="rounded-[1.15rem] border border-[#e4e0d8] bg-[#faf9f6] p-4 sm:p-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[#6f6b64]">
                      Growingman Premium
                    </p>
                    <p className="mt-1.5 text-[0.85rem] text-[#6f6b64]">Base mensal · R$ 15 por profissional</p>
                  </div>
                  <p className="shrink-0 font-heading text-[1.6rem] font-semibold leading-none tracking-[-0.04em] text-[#0d0c0a]">
                    R$ 110
                    <span className="ml-1 text-[0.85rem] font-medium tracking-normal text-[#6f6b64]">
                      /mês
                    </span>
                  </p>
                </div>
                <p className="mt-3 border-t border-[#eae7e0] pt-3 text-[0.78rem] leading-5 text-[#8a857c]">
                  A primeira fatura é só a base, porque a barbearia ainda não tem profissional cadastrado. A cobrança Pix vence em 3 dias.
                </p>
              </div>

              <FormAlert message={errorMsg || null} />

              <button
                type="button"
                disabled={isLoading}
                onClick={handleCreateAccount}
                className={`${btn.primary} w-full`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Gerando cobrança…
                  </>
                ) : (
                  <>
                    Criar conta e gerar Pix
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          )}

          {step === 3 && !billingRequired && (
            <div className="space-y-6">
              <StepHeader
                eyebrow={trial ? "Cortesia de lançamento" : "Conta criada"}
                title={
                  trial ? `${trial.months} meses por nossa conta` : "Barbearia cadastrada"
                }
                text={
                  trial
                    ? `Você pegou uma das vagas de lançamento. Nada a pagar até ${new Date(
                        trial.endsAt,
                      ).toLocaleDateString("pt-BR")} — o painel já está liberado.`
                    : "A cobrança da assinatura está desativada neste ambiente, então o acesso já está liberado."
                }
              />

              <div className="flex items-center gap-3.5 rounded-[1.15rem] border border-[#e4e0d8] bg-[#faf9f6] p-4 sm:p-5">
                <span
                  aria-hidden="true"
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-[#0d0c0a] text-white"
                >
                  <Check className="size-4" strokeWidth={3} />
                </span>
                <p className="min-w-0 text-[0.9rem] leading-6 text-[#3a3733]">
                  Página pública em{" "}
                  <span className="font-semibold break-all text-[#0d0c0a]">
                    {siteHost()}/{tenantSlug}
                  </span>
                </p>
              </div>

              <p className="border-t border-[#eae7e0] pt-6 text-[0.9rem] leading-6 text-[#6f6b64]">
                Entre com o e-mail e a senha cadastrados para abrir o painel.
              </p>

              <Link href="/login" className={`${btn.primary} w-full`}>
                Ir para entrar
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          )}

          {step === 3 && billingRequired && pixData && (
            <div className="space-y-6">
              <StepHeader
                eyebrow="Cobrança gerada"
                title={`Pague R$ ${pixData.value.toFixed(2).replace(".", ",")} via Pix`}
                text={`Escaneie o QR Code ou copie o código. Vencimento em ${new Date(
                  `${pixData.dueDate}T12:00:00`,
                ).toLocaleDateString("pt-BR")}.`}
              />

              <div className="mx-auto w-full max-w-64 rounded-[1.15rem] border border-[#e4e0d8] bg-white p-4 shadow-[0_20px_44px_-34px_rgba(13,12,10,0.55)]">
                {/* O Asaas fornece a imagem do QR Code em Base64. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                  alt="QR Code da cobrança Pix"
                  className="aspect-square h-auto w-full"
                />
              </div>

              <div className="space-y-3">
                <button type="button" onClick={copyPixPayload} className={`${btn.secondary} w-full`}>
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
                <a
                  href={pixData.invoiceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`${btn.secondary} w-full`}
                >
                  Abrir cobrança no Asaas
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              </div>

              <p className="border-t border-[#eae7e0] pt-6 text-[0.9rem] leading-6 text-[#6f6b64]">
                Depois do pagamento, entre com o e-mail e a senha cadastrados.
              </p>

              <Link href="/login" className={`${btn.primary} w-full`}>
                Ir para entrar
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/** Cabeçalho de etapa: mesma escala tipográfica das seções da landing. */
function StepHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <header>
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[#6f6b64] sm:text-[0.68rem]">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-balance font-heading text-[clamp(1.45rem,3.4vw,1.9rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-[#0d0c0a]">
        {title}
      </h1>
      <p className="mt-2.5 text-[0.9rem] leading-6 text-[#6f6b64] sm:text-[0.93rem]">{text}</p>
    </header>
  );
}

/** Etapas com o mesmo selo numerado da seção "Como funciona". */
function Stepper({ current, labels }: { current: number; labels: string[] }) {
  return (
    <ol className="flex items-start gap-2 sm:gap-3" aria-label="Etapas do cadastro">
      {labels.map((label, index) => {
        const number = index + 1;
        const active = current === number;
        const complete = current > number;
        const reached = active || complete;

        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center"
          >
            <div className="flex w-full items-center gap-2">
              <span
                aria-hidden="true"
                className={`h-px flex-1 ${index === 0 ? "opacity-0" : reached ? "bg-[#b3ada0]" : "bg-[#e4e0d8]"}`}
              />
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-full font-heading text-[0.8rem] font-semibold sm:size-10 sm:text-[0.85rem] ${
                  reached
                    ? "bg-[linear-gradient(145deg,#5a564e_0%,#1c1a17_60%,#000000_100%)] text-white shadow-[0_12px_28px_-14px_rgba(13,12,10,0.9)]"
                    : "border border-[#e4e0d8] bg-white text-[#a39d92]"
                }`}
              >
                {complete ? <Check className="size-4" strokeWidth={3} aria-hidden="true" /> : `0${number}`}
              </span>
              <span
                aria-hidden="true"
                className={`h-px flex-1 ${
                  index === labels.length - 1 ? "opacity-0" : current > number ? "bg-[#b3ada0]" : "bg-[#e4e0d8]"
                }`}
              />
            </div>
            <span
              className={`truncate text-[0.72rem] font-medium sm:text-[0.8rem] ${
                reached ? "text-[#0d0c0a]" : "text-[#8a857c]"
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
