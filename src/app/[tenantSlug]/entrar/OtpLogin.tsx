"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/config";
import { Scissors, Loader2, ArrowLeft, Phone, KeyRound } from "lucide-react";

interface OtpLoginProps {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
}

type Step = "phone" | "pin";

export function OtpLogin({ tenantId, tenantSlug, tenantName }: OtpLoginProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardStyle = { backgroundColor: "var(--theme-card)" } as React.CSSProperties;
  const titleStyle = { color: "var(--theme-title)" } as React.CSSProperties;
  const buttonStyle = {
    backgroundColor: "var(--theme-button-bg)",
    color: "var(--theme-button-text)",
  } as React.CSSProperties;

  // Tokens derivados do tema (mesmo padrão do `T` do BookingFlow): nada de cores
  // fixas (bg-white/border-white) que quebram em tenants com tema claro.
  const cardBorder = {
    borderColor: "color-mix(in srgb, var(--theme-text) 18%, transparent)",
  } as React.CSSProperties;
  // Superfície sutil sobre o fundo (ícone, inputs em repouso).
  const surface = {
    backgroundColor: "color-mix(in srgb, var(--theme-text) 6%, var(--theme-bg))",
  } as React.CSSProperties;
  // Campo de input: superfície sutil + borda temática + texto do tema.
  const inputStyle = {
    backgroundColor: "color-mix(in srgb, var(--theme-text) 6%, var(--theme-bg))",
    borderColor: "color-mix(in srgb, var(--theme-text) 18%, transparent)",
    color: "var(--theme-title)",
  } as React.CSSProperties;
  // Borda de foco mais forte (aplicada no onFocus/onBlur dos inputs).
  const focusBorder = "color-mix(in srgb, var(--theme-text) 35%, transparent)";
  const restBorder = "color-mix(in srgb, var(--theme-text) 18%, transparent)";

  const requestPin = async () => {
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Informe um telefone válido com DDD.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl("/auth/customer/request-pin"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, tenantId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.message || "Não foi possível enviar o código.");
      }
      setStep("pin");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao enviar código.");
    } finally {
      setLoading(false);
    }
  };

  const verifyPin = async () => {
    if (pin.length !== 4) {
      setError("O código tem 4 dígitos.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl("/auth/customer/verify-pin"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, pin, tenantId, name }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || "Código inválido.");
      }
      // Sucesso — volta para a página da barbearia (sessão criada via cookie).
      // Leva para a área do cliente, e não de volta à home: quem acabou de
      // entrar veio ver os próprios horários — devolver à vitrine faz o login
      // parecer que não aconteceu.
      router.push(`/${tenantSlug}/meus-agendamentos`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao validar código.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm rounded-3xl border p-6 sm:p-8" style={{ ...cardStyle, ...cardBorder }}>
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={surface}>
          <Scissors className="w-6 h-6" style={titleStyle} />
        </div>
        <h1 className="text-xl font-black" style={titleStyle}>{tenantName}</h1>
        <p className="text-sm mt-1">
          {step === "phone" ? "Entre com seu WhatsApp para agendar" : "Digite o código que enviamos"}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {step === "phone" ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="otp-name" className="text-xs font-semibold uppercase tracking-wider opacity-70">Nome</label>
            <input
              id="otp-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full mt-1.5 h-12 px-4 rounded-xl border text-base focus:outline-none transition-colors"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = focusBorder; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = restBorder; }}
            />
          </div>
          <div>
            <label htmlFor="otp-phone" className="text-xs font-semibold uppercase tracking-wider opacity-70">WhatsApp</label>
            <div className="relative mt-1.5">
              <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                id="otp-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full h-12 pl-11 pr-4 rounded-xl border text-base focus:outline-none transition-colors"
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = focusBorder; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = restBorder; }}
                onKeyDown={(e) => e.key === "Enter" && requestPin()}
              />
            </div>
          </div>
          <button
            onClick={requestPin}
            disabled={loading}
            className="w-full h-12 rounded-xl font-bold text-base transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            style={buttonStyle}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Receber código"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor="otp-pin" className="text-xs font-semibold uppercase tracking-wider opacity-70">Código (4 dígitos)</label>
            <div className="relative mt-1.5">
              <KeyRound className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                id="otp-pin"
                type="tel"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="0000"
                className="w-full h-12 pl-11 pr-4 rounded-xl border text-base tracking-[0.5em] focus:outline-none transition-colors"
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = focusBorder; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = restBorder; }}
                onKeyDown={(e) => e.key === "Enter" && verifyPin()}
                autoFocus
              />
            </div>
          </div>
          <button
            onClick={verifyPin}
            disabled={loading}
            className="w-full h-12 rounded-xl font-bold text-base transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            style={buttonStyle}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Entrar"}
          </button>
          <button
            onClick={() => { setStep("phone"); setPin(""); setError(null); }}
            className="w-full text-sm opacity-70 hover:opacity-100 flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Trocar telefone
          </button>
        </div>
      )}
    </div>
  );
}
