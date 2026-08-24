"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Copy, ExternalLink, Loader2, Mail, RefreshCw } from "lucide-react";
import { Field, FormAlert, TextInput, btn } from "@/components/brand/ui";
import { apiUrl, siteHost } from "@/lib/config";
import { PRECO_BASE_FMT, PRECO_POR_PROFISSIONAL_FMT } from "@/lib/pricing";

const STEP_LABELS = ["Responsável", "Barbearia", "Confirmar e-mail"];

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
  const [referralCode, setReferralCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

  const handleInitiate = async () => {
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
      const response = await fetch(apiUrl("/tenants/onboarding/initiate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminName: adminName.trim(),
          adminEmail: adminEmail.trim().toLowerCase(),
          adminCpfCnpj: adminCpfCnpj.replace(/\D/g, ""),
          adminPassword,
          tenantName: tenantName.trim(),
          tenantSlug,
          ...(referralCode ? { referralCode } : {}),
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Não foi possível iniciar o cadastro.");
      }

      setStep(3);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Não foi possível iniciar o cadastro.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown || isResending) return;
    setIsResending(true);

    try {
      await fetch(apiUrl("/tenants/onboarding/resend"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail.trim().toLowerCase() }),
      });
    } finally {
      setIsResending(false);
      // Cooldown de 30s para não virar spam
      setResendCooldown(true);
      window.setTimeout(() => setResendCooldown(false), 30_000);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <Stepper current={step} labels={STEP_LABELS} />

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

                <Field id="referral-code" label="Código de indicação (opcional)">
                  <TextInput
                    id="referral-code"
                    value={referralCode}
                    placeholder="Ex.: ABCD2345"
                    maxLength={16}
                    onChange={(event) =>
                      setReferralCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                    }
                  />
                  <p className="mt-1.5 text-[0.72rem] leading-4 text-[#8a857c]">
                    Recebeu o código de outra barbearia? Ela ganha desconto quando você assinar.
                  </p>
                </Field>
              </div>

              {/* Resumo da cobrança */}
              <div className="rounded-[1.15rem] border border-[#e4e0d8] bg-[#faf9f6] p-4 sm:p-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[#6f6b64]">
                      Growingman Premium
                    </p>
                    <p className="mt-1.5 text-[0.85rem] text-[#6f6b64]">{`Base mensal · ${PRECO_POR_PROFISSIONAL_FMT} por profissional`}</p>
                  </div>
                  <p className="shrink-0 font-heading text-[1.6rem] font-semibold leading-none tracking-[-0.04em] text-[#0d0c0a]">
                    {PRECO_BASE_FMT}
                    <span className="ml-1 text-[0.85rem] font-medium tracking-normal text-[#6f6b64]">
                      /mês
                    </span>
                  </p>
                </div>
                <p className="mt-3 border-t border-[#eae7e0] pt-3 text-[0.78rem] leading-5 text-[#8a857c]">
                  A primeira fatura é só a base, porque a barbearia ainda não tem profissional
                  cadastrado. A cobrança Pix vence em 3 dias.
                </p>
              </div>

              <FormAlert message={errorMsg || null} />

              <button
                type="button"
                disabled={isLoading}
                onClick={handleInitiate}
                className={`${btn.primary} w-full`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Enviando e-mail…
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <StepHeader
                eyebrow="Quase lá!"
                title="Confirme seu e-mail"
                text={`Enviamos um link de confirmação para ${adminEmail}. Clique nele para concluir o cadastro e criar sua conta.`}
              />

              {/* Ícone de e-mail animado */}
              <div className="flex justify-center py-2">
                <div className="relative grid size-20 place-items-center rounded-full bg-[#f3f1ec]">
                  <Mail className="size-9 text-[#0d0c0a]" aria-hidden="true" />
                  <span
                    aria-hidden="true"
                    className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#0d0c0a] text-[0.6rem] font-bold text-white shadow-sm"
                  >
                    1
                  </span>
                </div>
              </div>

              <div className="rounded-[1.15rem] border border-[#e4e0d8] bg-[#faf9f6] p-4 sm:p-5 space-y-2">
                <p className="text-[0.82rem] leading-5 text-[#3a3733] font-medium">O que fazer agora:</p>
                <ol className="space-y-1.5 text-[0.82rem] leading-5 text-[#6f6b64]">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-[#0d0c0a] text-[0.55rem] font-bold text-white">1</span>
                    Abra o e-mail enviado para <strong className="text-[#0d0c0a] break-all">{adminEmail}</strong>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-[#0d0c0a] text-[0.55rem] font-bold text-white">2</span>
                    Clique em <strong className="text-[#0d0c0a]">"Confirmar e-mail e criar conta"</strong>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-[#0d0c0a] text-[0.55rem] font-bold text-white">3</span>
                    Pronto — sua barbearia estará criada e o painel liberado
                  </li>
                </ol>
              </div>

              <p className="text-center text-[0.8rem] text-[#8a857c]">
                Não recebeu o e-mail? Verifique a pasta de spam.
              </p>

              <button
                type="button"
                disabled={isResending || resendCooldown}
                onClick={handleResend}
                className={`${btn.secondary} w-full`}
              >
                {isResending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    Reenviando…
                  </>
                ) : resendCooldown ? (
                  <>
                    <Check className="size-3.5" aria-hidden="true" />
                    E-mail reenviado
                  </>
                ) : (
                  <>
                    <RefreshCw className="size-3.5" aria-hidden="true" />
                    Reenviar e-mail
                  </>
                )}
              </button>

              <p className="border-t border-[#eae7e0] pt-4 text-center text-[0.78rem] text-[#8a857c]">
                Precisa corrigir o e-mail?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg("");
                    setStep(1);
                  }}
                  className="font-medium text-[#0d0c0a] underline underline-offset-2 hover:no-underline"
                >
                  Voltar ao início
                </button>
              </p>
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
