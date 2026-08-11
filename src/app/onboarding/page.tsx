"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ArrowLeft, CheckCircle2, QrCode, Copy, Building2, User, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/config";

export default function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  // Formulário: Step 1
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminCpfCnpj, setAdminCpfCnpj] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // Formulário: Step 2
  const [tenantName, setTenantName] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");

  // Estados de Carregamento e Resposta
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [pixData, setPixData] = useState<{ qrCodeBase64?: string; qrCodePayload?: string } | null>(null);

  const nextStep = () => {
    if (adminName.trim().length < 3) {
      setErrorMsg("Informe seu nome completo.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(adminEmail)) {
      setErrorMsg("Informe um e-mail válido.");
      return;
    }
    if (adminCpfCnpj.replace(/\D/g, "").length < 11) {
      setErrorMsg("Informe um CPF ou CNPJ válido.");
      return;
    }
    if (adminPassword.length < 12) {
      setErrorMsg("A senha deve ter pelo menos 12 caracteres.");
      return;
    }
    setErrorMsg("");
    setStep((s) => Math.min(s + 1, 3));
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleCreateAccount = async () => {
    setIsLoading(true);
    setErrorMsg("");

    try {
      const response = await fetch(apiUrl("/tenants/onboarding"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminName,
          adminEmail,
          adminCpfCnpj,
          adminPassword,
          tenantName,
          tenantSlug,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.errors?.[0]?.message || "Falha ao criar conta");
      }

      // Recebemos o QR Code da API
      if (data.payment) {
        setPixData(data.payment);
      }
      
      // Avança para a tela do Pix
      setStep(3);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Não foi possível criar a conta.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    // Na vida real, o Frontend ficaria fazendo Polling do Status do Pagamento
    // ou dependeria do Webhook para ser notificado por Socket.
    router.push("/dashboard");
  };

  const copyPixPayload = () => {
    if (pixData?.qrCodePayload) {
      navigator.clipboard.writeText(pixData.qrCodePayload);
      alert("Pix Copia e Cola copiado para a área de transferência!");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress Indicators */}
      <div className="flex items-center justify-between mb-8 px-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= i ? "bg-white text-black" : "bg-neutral-900 text-neutral-500 border border-white/10"}`}>
              {step > i ? <CheckCircle2 className="w-4 h-4" /> : i}
            </div>
            {i < 3 && (
              <div className={`w-16 h-1 mx-2 rounded-full transition-colors ${step > i ? "bg-white" : "bg-neutral-900"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="relative glass-card rounded-3xl p-8 border border-white/10 overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-6"
            >
              <div>
                <h2 className="text-2xl font-heading font-bold mb-2 flex items-center gap-2">
                  <User className="w-6 h-6 text-neutral-400" /> Seus Dados
                </h2>
                <p className="text-neutral-400 text-sm">Crie sua conta de administrador para gerenciar o sistema.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-1.5 block">Nome Completo</label>
                  <Input placeholder="João da Silva" value={adminName} onChange={e => setAdminName(e.target.value)} autoComplete="name" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-1.5 block">Email</label>
                  <Input type="email" placeholder="joao@exemplo.com" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} autoComplete="email" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-1.5 block">CPF ou CNPJ</label>
                  <Input placeholder="000.000.000-00" value={adminCpfCnpj} onChange={e => setAdminCpfCnpj(e.target.value)} inputMode="numeric" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-1.5 block">Senha</label>
                  <Input type="password" placeholder="••••••••••••" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} minLength={12} autoComplete="new-password" required />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {errorMsg}
                </div>
              )}

              <Button className="w-full mt-4 h-12 rounded-xl text-base" onClick={nextStep}>
                Continuar <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-6"
            >
              <div>
                <button onClick={prevStep} className="text-neutral-500 hover:text-white transition-colors mb-4 flex items-center text-sm font-medium">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                </button>
                <h2 className="text-2xl font-heading font-bold mb-2 flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-neutral-400" /> A Barbearia
                </h2>
                <p className="text-neutral-400 text-sm">Configure o ambiente e o link exclusivo da sua marca.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-1.5 block">Nome da Barbearia</label>
                  <Input placeholder="Barbearia do João" value={tenantName} onChange={e => setTenantName(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-1.5 block">URL Exclusiva</label>
                  <div className="flex items-center">
                    <span className="h-12 px-4 rounded-l-xl border border-r-0 border-white/10 bg-white/5 flex items-center text-neutral-500 text-sm">
                      growingman.com/
                    </span>
                    <Input className="rounded-l-none pl-2 focus-visible:ring-0 focus-visible:border-white/10 bg-white/5" placeholder="barbeariadojoao" value={tenantSlug} onChange={e => setTenantSlug(e.target.value)} />
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">Este será o link para seus clientes agendarem.</p>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {errorMsg}
                </div>
              )}

              <Button disabled={isLoading} className="w-full mt-4 h-12 rounded-xl text-base" onClick={handleCreateAccount}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Gerar Assinatura e Criar Conta"}
                {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-6 items-center text-center"
            >
              <div className="w-full flex justify-start mb-2">
                 <button onClick={prevStep} className="text-neutral-500 hover:text-white transition-colors flex items-center text-sm font-medium">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                </button>
              </div>
              
              <div>
                <h2 className="text-2xl font-heading font-bold mb-2">Finalizar Assinatura</h2>
                <p className="text-neutral-400 text-sm mb-6">Plano Growingman Premium - R$ 299/mês</p>
              </div>

              <div className="w-48 h-48 bg-white rounded-2xl p-4 flex items-center justify-center mb-4">
                {pixData?.qrCodeBase64 ? (
                  <img src={`data:image/jpeg;base64,${pixData.qrCodeBase64}`} alt="QR Code Pix" className="w-full h-full object-contain" />
                ) : (
                  <QrCode className="w-16 h-16 text-black opacity-10" />
                )}
              </div>

              <div className="w-full">
                 <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 mb-4 bg-white/5 hover:bg-white/10" onClick={copyPixPayload}>
                  <Copy className="w-4 h-4 mr-2" /> Copiar Código Pix
                </Button>
                
                <p className="text-xs text-neutral-500 mb-6">
                  Aguardando pagamento... O sistema será liberado automaticamente após a confirmação.
                </p>

                <Button className="w-full h-12 rounded-xl text-base font-semibold shadow-[0_0_20px_rgba(255,255,255,0.2)]" onClick={handleComplete}>
                  Simular Pagamento Aprovado
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
