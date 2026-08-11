"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Copy, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiUrl, siteHost } from "@/lib/config";

type PixPayment = {
  paymentId: string;
  invoiceUrl: string;
  dueDate: string;
  value: number;
  qrCodeBase64: string;
  qrCodePayload: string;
};

const steps = ["Responsável", "Barbearia", "Pagamento"];

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
    <div className="mx-auto w-full max-w-lg">
      <ol className="mb-8 grid grid-cols-3 border-b border-neutral-800" aria-label="Etapas do cadastro">
        {steps.map((label, index) => {
          const number = index + 1;
          const active = step === number;
          const complete = step > number;
          return (
            <li
              key={label}
              aria-current={active ? "step" : undefined}
              className={`border-b-2 px-1 pb-3 text-xs font-medium sm:text-sm ${
                active ? "border-white text-white" : "border-transparent text-neutral-500"
              }`}
            >
              <span className="mr-2 font-mono">{complete ? "✓" : `0${number}`}</span>
              {label}
            </li>
          );
        })}
      </ol>

      <section className="border border-neutral-800 bg-neutral-950 p-6 sm:p-8">
        {step === 1 && (
          <div className="space-y-6">
            <header>
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">Dados de acesso</p>
              <h1 className="text-2xl font-semibold tracking-tight">Quem administra a barbearia?</h1>
              <p className="mt-2 text-sm leading-6 text-neutral-400">Use os dados do responsável pela assinatura.</p>
            </header>

            <div className="space-y-4">
              <Field id="admin-name" label="Nome completo">
                <Input id="admin-name" value={adminName} onChange={(event) => setAdminName(event.target.value)} autoComplete="name" />
              </Field>
              <Field id="admin-email" label="E-mail">
                <Input id="admin-email" type="email" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} autoComplete="email" />
              </Field>
              <Field id="admin-document" label="CPF ou CNPJ">
                <Input id="admin-document" value={adminCpfCnpj} onChange={(event) => setAdminCpfCnpj(event.target.value)} inputMode="numeric" autoComplete="off" />
              </Field>
              <Field id="admin-password" label="Senha" hint="Mínimo de 12 caracteres">
                <Input id="admin-password" type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} minLength={12} autoComplete="new-password" />
              </Field>
            </div>

            <ErrorMessage message={errorMsg} />
            <Button className="h-12 w-full" onClick={goToBusiness}>Continuar <ArrowRight className="ml-2 size-4" /></Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <header>
              <button type="button" onClick={() => { setErrorMsg(""); setStep(1); }} className="mb-5 flex items-center gap-2 text-sm text-neutral-400 hover:text-white">
                <ArrowLeft className="size-4" /> Voltar
              </button>
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">Identificação pública</p>
              <h1 className="text-2xl font-semibold tracking-tight">Dados da barbearia</h1>
              <p className="mt-2 text-sm leading-6 text-neutral-400">O endereço abaixo será usado pelos clientes para agendar.</p>
            </header>

            <div className="space-y-4">
              <Field id="tenant-name" label="Nome da barbearia">
                <Input id="tenant-name" value={tenantName} onChange={(event) => { const name = event.target.value; setTenantName(name); setTenantSlug(normalizeSlug(name)); }} />
              </Field>
              <Field id="tenant-slug" label="Endereço da agenda">
                <div className="grid w-full min-w-0 sm:grid-cols-[auto_minmax(8rem,1fr)]">
                  <span
                    className="flex h-12 min-w-0 items-center overflow-hidden text-ellipsis whitespace-nowrap rounded-t-xl border border-b-0 border-neutral-800 bg-black px-3 text-xs text-neutral-500 sm:rounded-l-xl sm:rounded-tr-none sm:border-b sm:border-r-0"
                    title={`${siteHost()}/`}
                  >
                    {siteHost()}/
                  </span>
                  <Input
                    id="tenant-slug"
                    className="min-w-0 rounded-t-none sm:rounded-l-none sm:rounded-tr-xl"
                    value={tenantSlug}
                    onChange={(event) => setTenantSlug(normalizeSlug(event.target.value))}
                  />
                </div>
              </Field>
            </div>

            <div className="border-y border-neutral-800 py-4 text-sm">
              <div className="flex items-center justify-between"><span className="text-neutral-400">Growingman Premium</span><strong>R$ 299/mês</strong></div>
              <p className="mt-2 text-xs text-neutral-500">A cobrança Pix vence em 3 dias.</p>
            </div>

            <ErrorMessage message={errorMsg} />
            <Button disabled={isLoading} className="h-12 w-full" onClick={handleCreateAccount}>
              {isLoading ? <><Loader2 className="mr-2 size-4 animate-spin" />Gerando cobrança…</> : <>Criar conta e gerar Pix <ArrowRight className="ml-2 size-4" /></>}
            </Button>
          </div>
        )}

        {step === 3 && pixData && (
          <div className="space-y-6">
            <header>
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">Cobrança gerada</p>
              <h1 className="text-2xl font-semibold tracking-tight">Pague R$ {pixData.value.toFixed(2).replace(".", ",")} via Pix</h1>
              <p className="mt-2 text-sm leading-6 text-neutral-400">Escaneie o QR Code ou copie o código. Vencimento em {new Date(`${pixData.dueDate}T12:00:00`).toLocaleDateString("pt-BR")}.</p>
            </header>

            <div className="mx-auto w-full max-w-64 bg-white p-4">
              {/* O Asaas fornece a imagem do QR Code em Base64. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="QR Code da cobrança Pix" className="aspect-square h-auto w-full" />
            </div>

            <div className="space-y-3">
              <Button variant="outline" className="h-12 w-full" onClick={copyPixPayload}>
                {copied ? <><Check className="mr-2 size-4" />Código copiado</> : <><Copy className="mr-2 size-4" />Copiar código Pix</>}
              </Button>
              <a href={pixData.invoiceUrl} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center border border-neutral-800 text-sm font-medium text-neutral-300 hover:border-neutral-600 hover:text-white">
                Abrir cobrança no Asaas <ExternalLink className="ml-2 size-4" />
              </a>
            </div>

            <p className="border-t border-neutral-800 pt-5 text-sm leading-6 text-neutral-400">Depois do pagamento, entre com o e-mail e a senha cadastrados.</p>
            <Button asChild className="h-12 w-full"><Link href="/login">Ir para entrar</Link></Button>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm font-medium text-neutral-200">{label}</label>
        {hint && <span className="text-xs text-neutral-500">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  if (!message) return null;
  return <p role="alert" className="border-l-2 border-red-500 bg-red-950/30 px-4 py-3 text-sm text-red-300">{message}</p>;
}
