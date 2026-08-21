"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar as CalendarGrowingman,
  X,
  CheckCircle2,
} from "lucide-react";
import { apiUrl } from "@/lib/config";
import { useToast } from "@/components/ui/toast";

interface BookingServiceOption {
  id: string;
  name: string;
  duration_minutes: number;
  base_price: string | number;
}

interface BookingBarberOption {
  id: string;
  name: string;
}

interface BookingModalProps {
  tenantId: string;
  services: BookingServiceOption[];
  barbers: BookingBarberOption[];
  heroMode?: boolean;
}

export function BookingModal({
  tenantId,
  services,
  barbers,
  heroMode,
}: BookingModalProps) {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    serviceId: "",
    barberId: "",
    date: "",
    time: "",
    customerName: "",
    customerPhone: "",
    notes: "",
  });

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setStep(1);
      setSuccess(false);
      setFormData({
        serviceId: "",
        barberId: "",
        date: "",
        time: "",
        customerName: "",
        customerPhone: "",
        notes: "",
      });
    }, 300);
  };

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        tenantId,
      };

      const res = await fetch(apiUrl("/bookings"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        // A API explica o motivo (horário ocupado, data fora da janela...).
        // Mostrar a mensagem dela ajuda mais que um texto genérico.
        const body = await res.json().catch(() => null);
        toast.error(body?.message || "Erro ao realizar agendamento.");
      }
    } catch {
      toast.error("Falha de conexão. Verifique sua internet e tente de novo.");
    } finally {
      setLoading(false);
    }
  };

  const selectedService = services.find((s) => s.id === formData.serviceId);
  const selectedBarber = barbers.find((b) => b.id === formData.barberId);

  return (
    <>
      {heroMode ? (
        <button
          onClick={handleOpen}
          className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-white text-black font-bold text-sm hover:bg-zinc-100 transition-all duration-200 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)]"
        >
          Agendar Agora
          <span className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center group-hover:bg-black/20 transition-colors">
            <CalendarGrowingman className="w-3.5 h-3.5" />
          </span>
        </button>
      ) : (
        <Button
          onClick={handleOpen}
          className="w-full h-14 mt-8 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold text-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
        >
          <CalendarGrowingman className="w-5 h-5" />
          Agendar Horário
        </Button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
              <h3 className="text-xl font-bold font-heading">
                {success ? "Sucesso!" : `Agendamento - Passo ${step} de 3`}
              </h3>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {success ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    Horário Confirmado!
                  </h3>
                  <p className="text-neutral-400 mb-8">
                    Seu agendamento foi realizado com sucesso. Te esperamos na
                    barbearia!
                  </p>
                  <Button
                    onClick={handleClose}
                    className="w-full rounded-full h-12"
                  >
                    Concluir
                  </Button>
                </div>
              ) : step === 1 ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">
                      Escolha o Serviço
                    </label>
                    <div className="grid gap-2">
                      {services.map((svc) => (
                        <div
                          key={svc.id}
                          onClick={() =>
                            setFormData({ ...formData, serviceId: svc.id })
                          }
                          className={`p-4 rounded-xl border cursor-pointer transition-colors ${formData.serviceId === svc.id ? "border-white bg-white/10" : "border-white/10 hover:border-white/30"}`}
                        >
                          <div className="font-medium text-white">
                            {svc.name}
                          </div>
                          <div className="flex justify-between mt-1 text-sm text-neutral-400">
                            <span>{svc.duration_minutes} min</span>
                            <span>
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(Number(svc.base_price))}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={handleNext}
                    disabled={!formData.serviceId}
                    className="w-full h-12 rounded-full"
                  >
                    Próximo Passo
                  </Button>
                </div>
              ) : step === 2 ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">
                      Escolha o Profissional
                    </label>
                    <div className="grid gap-2">
                      {barbers.map((barber) => (
                        <div
                          key={barber.id}
                          onClick={() =>
                            setFormData({ ...formData, barberId: barber.id })
                          }
                          className={`p-4 rounded-xl border flex items-center gap-4 cursor-pointer transition-colors ${formData.barberId === barber.id ? "border-white bg-white/10" : "border-white/10 hover:border-white/30"}`}
                        >
                          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold">
                            {barber.name.charAt(0)}
                          </div>
                          <div className="font-medium text-white">
                            {barber.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-2">
                        Data
                      </label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                        className="bg-zinc-900 border-white/10"
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-2">
                        Horário
                      </label>
                      <Input
                        type="time"
                        value={formData.time}
                        onChange={(e) =>
                          setFormData({ ...formData, time: e.target.value })
                        }
                        className="bg-zinc-900 border-white/10"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handlePrev}
                      variant="outline"
                      className="flex-1 rounded-full border-white/20"
                    >
                      Voltar
                    </Button>
                    <Button
                      onClick={handleNext}
                      disabled={
                        !formData.barberId || !formData.date || !formData.time
                      }
                      className="flex-1 rounded-full"
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Serviço:</span>{" "}
                      <span className="font-medium">
                        {selectedService?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Profissional:</span>{" "}
                      <span className="font-medium">
                        {selectedBarber?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Data/Hora:</span>{" "}
                      <span className="font-medium">
                        {formData.date} às {formData.time}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 mt-2 border-t border-white/10 text-lg">
                      <span className="text-neutral-400">Total:</span>{" "}
                      <span className="font-bold text-white">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(Number(selectedService?.base_price || 0))}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">
                      Seus Dados
                    </label>
                    <div className="space-y-3">
                      <Input
                        placeholder="Nome Completo"
                        value={formData.customerName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customerName: e.target.value,
                          })
                        }
                        className="bg-zinc-900 border-white/10"
                      />
                      <Input
                        placeholder="WhatsApp (ex: 11999999999)"
                        value={formData.customerPhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customerPhone: e.target.value,
                          })
                        }
                        className="bg-zinc-900 border-white/10"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handlePrev}
                      variant="outline"
                      className="flex-1 rounded-full border-white/20"
                    >
                      Voltar
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={
                        loading ||
                        !formData.customerName ||
                        !formData.customerPhone
                      }
                      className="flex-1 rounded-full bg-white text-black hover:bg-neutral-200"
                    >
                      {loading ? "Confirmando..." : "Confirmar Agendamento"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
