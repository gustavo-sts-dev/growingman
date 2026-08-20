"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Palette, Globe, Shield, Clock, Save, CheckCircle2,
  Scissors, AlertTriangle, Loader2, Percent, LayoutTemplate, Image as ImageGrowingman,
  CreditCard, type LucideIcon
} from "lucide-react";

import { apiGet, apiPatch, apiDelete } from "@/lib/api";
import { siteHost } from "@/lib/config";
import { useToast } from "@/components/ui/toast";
import { ImageUpload } from "@/components/ui/image-upload";
import type { AuthUser, Tenant } from "@/lib/types";
import { SITE_PRESETS, resolveSitePreset, type SitePresetId } from "@/lib/site-presets";
import { defaultSiteLayout, normalizeSiteLayout } from "@/lib/site-layout";

type TabId = "perfil" | "pagina" | "aparencia" | "politicas" | "financeiro";

const TABS: { id: TabId; label: string; growingman: LucideIcon }[] = [
  { id: "perfil",    label: "Perfil do App",  growingman: Globe          },
  { id: "pagina",    label: "Página Pública", growingman: LayoutTemplate },
  { id: "aparencia", label: "Aparência",       growingman: Palette        },
  { id: "financeiro",label: "Financeiro",      growingman: Percent        },
  { id: "politicas", label: "Políticas",       growingman: Shield         },
];

/** Cores que um preset de design aplica (nunca inclui `name` do tenant). */
type ThemeColors = {
  theme_bg: string;
  theme_card: string;
  theme_text: string;
  theme_title: string;
  theme_button_bg: string;
  theme_button_text: string;
  theme_accent: string;
};

/**
 * Paletas prontas da página pública, agrupadas por estilo.
 *
 * Cada paleta define as sete cores de uma vez porque combinações soltas quase
 * sempre quebram contraste — fundo claro com texto claro, botão que some no
 * card. Aqui os pares já nascem legíveis; o ajuste fino continua disponível em
 * "Cores Detalhadas", para quem quiser divergir por conta própria.
 */
type ColorPresetGroup = {
  style: string;
  hint: string;
  presets: { label: string; colors: ThemeColors }[];
};

const COLOR_PRESET_GROUPS: ColorPresetGroup[] = [
  {
    style: "Escuro",
    hint: "Fundo preto, contraste alto. Combina com foto e com letra grande.",
    presets: [
      { label: "Ônix",       colors: { theme_bg: "#080808", theme_card: "#121212", theme_text: "#A1A1AA", theme_title: "#FFFFFF", theme_button_bg: "#FFFFFF", theme_button_text: "#000000", theme_accent: "#FFFFFF" } },
      { label: "Grafite",    colors: { theme_bg: "#17181A", theme_card: "#202225", theme_text: "#A8ADB4", theme_title: "#F5F6F7", theme_button_bg: "#E6E8EA", theme_button_text: "#17181A", theme_accent: "#8B96A5" } },
      { label: "Meia-noite", colors: { theme_bg: "#0B1120", theme_card: "#131C31", theme_text: "#94A3B8", theme_title: "#F1F5F9", theme_button_bg: "#38BDF8", theme_button_text: "#04121F", theme_accent: "#38BDF8" } },
      { label: "Carvão",     colors: { theme_bg: "#1A1A1A", theme_card: "#242424", theme_text: "#A3A3A3", theme_title: "#FAFAFA", theme_button_bg: "#C2410C", theme_button_text: "#FFFFFF", theme_accent: "#F97316" } },
    ],
  },
  {
    style: "Luxo",
    hint: "Tons metálicos e quentes sobre escuro. Cara de barbearia premium.",
    presets: [
      { label: "Ouro",      colors: { theme_bg: "#0A0A0A", theme_card: "#111111", theme_text: "#9CA3AF", theme_title: "#D4AF37", theme_button_bg: "#D4AF37", theme_button_text: "#000000", theme_accent: "#D4AF37" } },
      { label: "Bronze",    colors: { theme_bg: "#12100E", theme_card: "#1C1917", theme_text: "#A8A29E", theme_title: "#E7D3B7", theme_button_bg: "#B08D57", theme_button_text: "#14110E", theme_accent: "#B08D57" } },
      { label: "Champanhe", colors: { theme_bg: "#14110D", theme_card: "#1F1A14", theme_text: "#B0A79A", theme_title: "#F3E5CE", theme_button_bg: "#E8D5AE", theme_button_text: "#1A150F", theme_accent: "#C9A961" } },
      { label: "Bordô",     colors: { theme_bg: "#140A0D", theme_card: "#1F1013", theme_text: "#B9A2A7", theme_title: "#F5E9EB", theme_button_bg: "#8C1F2B", theme_button_text: "#FFFFFF", theme_accent: "#B2313F" } },
    ],
  },
  {
    style: "Claro",
    hint: "Fundo claro e leitura fácil. Bom para quem tem poucas fotos.",
    presets: [
      { label: "Neve",  colors: { theme_bg: "#F8FAFC", theme_card: "#FFFFFF", theme_text: "#475569", theme_title: "#0F172A", theme_button_bg: "#0F172A", theme_button_text: "#FFFFFF", theme_accent: "#3B82F6" } },
      { label: "Areia", colors: { theme_bg: "#F5F1EA", theme_card: "#FFFFFF", theme_text: "#6B6355", theme_title: "#26211A", theme_button_bg: "#26211A", theme_button_text: "#F5F1EA", theme_accent: "#A6784B" } },
      { label: "Linho", colors: { theme_bg: "#F7F5F2", theme_card: "#FFFFFF", theme_text: "#5C5750", theme_title: "#1C1A17", theme_button_bg: "#2F2A24", theme_button_text: "#FFFFFF", theme_accent: "#8A7B6A" } },
      { label: "Névoa", colors: { theme_bg: "#F1F5F9", theme_card: "#FFFFFF", theme_text: "#4B5563", theme_title: "#111827", theme_button_bg: "#334155", theme_button_text: "#FFFFFF", theme_accent: "#0EA5E9" } },
    ],
  },
  {
    style: "Vibrante",
    hint: "Acento saturado sobre escuro. Chama atenção no botão de agendar.",
    presets: [
      { label: "Cyber",      colors: { theme_bg: "#050511", theme_card: "#090919", theme_text: "#94A3B8", theme_title: "#E0E7FF", theme_button_bg: "#8B5CF6", theme_button_text: "#FFFFFF", theme_accent: "#10B981" } },
      { label: "Elétrico",   colors: { theme_bg: "#0A0A0F", theme_card: "#14141F", theme_text: "#9CA3AF", theme_title: "#FFFFFF", theme_button_bg: "#2563EB", theme_button_text: "#FFFFFF", theme_accent: "#22D3EE" } },
      { label: "Pôr do sol", colors: { theme_bg: "#1A0F14", theme_card: "#241419", theme_text: "#B79FA5", theme_title: "#FFF1E6", theme_button_bg: "#F97316", theme_button_text: "#1A0F14", theme_accent: "#FB7185" } },
      { label: "Menta",      colors: { theme_bg: "#06120F", theme_card: "#0C1D18", theme_text: "#93AFA6", theme_title: "#ECFDF5", theme_button_bg: "#10B981", theme_button_text: "#04120D", theme_accent: "#34D399" } },
    ],
  },
];

const THEME_COLOR_KEYS = [
  "theme_bg",
  "theme_card",
  "theme_text",
  "theme_title",
  "theme_button_bg",
  "theme_button_text",
  "theme_accent",
] as const;

export default function ConfiguracoesPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabId>("perfil");
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [tenant, setTenant]       = useState<Tenant | null>(null);
  const [userRole, setUserRole]   = useState<AuthUser["role"] | null>(null);
  const [mpLoading, setMpLoading] = useState(false);
  // Host público (ex.: "app.growingman.com.br"). Resolvido após montar para evitar
  // divergência de hidratação com o valor de fallback do servidor (sincronização
  // legítima com o `window`, daí o disable pontual da regra do lint).
  const [host, setHost]           = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHost(siteHost());
  }, []);

  const [form, setForm] = useState({
    name:                     "",
    slug:                     "",
    theme_bg:                 "#080808",
    theme_card:               "#121212",
    theme_text:               "#A1A1AA",
    theme_title:              "#FFFFFF",
    theme_button_bg:          "#FFFFFF",
    theme_button_text:        "#000000",
    theme_accent:             "#4ade80",
    font_family:              "Inter",
    logo_url:                 "",
    cancellation_policy_hours: 2,
    global_commission_rate:   50,
    privacy_policy_url:       "",
    terms_of_service_url:     "",
    // Página pública
    address:                  "",
    page_headline:            "",
    page_subheadline:         "",
    site_preset:              "classic",
    hero_image_url:           "",
    stat_clients:             "",
    stat_rating:              "",
    stat_experience:          "",
    site_layout:              defaultSiteLayout("classic"),
    // Pagamentos online (Mercado Pago). Campo de escrita-única: o backend nunca
    // devolve o token salvo, então este valor começa e permanece vazio até o dono
    // colar um novo. Enviado no PATCH apenas quando preenchido (ver handleSave).
  });

  // O callback do OAuth devolve o dono para cá com ?status=... (o backend não tem
  // como abrir um toast na SPA, então sinaliza pela URL).
  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("status");
    if (!status) return;

    if (status === "mp_conectado") toast.success("Mercado Pago conectado com sucesso.");
    else if (status === "mp_cancelado") toast.error("Conexão com o Mercado Pago cancelada.");
    else if (status === "mp_erro") toast.error("Não foi possível conectar ao Mercado Pago.");

    // Limpa o parâmetro para o aviso não reaparecer a cada refresh.
    window.history.replaceState({}, "", window.location.pathname);
  }, [toast]);

  /** Passo 1 do OAuth: o backend devolve a URL do MP e mandamos o dono para lá. */
  const handleMpConnect = async () => {
    setMpLoading(true);
    try {
      const { authorizationUrl } = await apiGet<{ authorizationUrl: string }>(
        "/payments/mp/oauth/connect",
      );
      window.location.href = authorizationUrl;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao iniciar a conexão.");
      setMpLoading(false);
    }
  };

  const handleMpDisconnect = async () => {
    setMpLoading(true);
    try {
      await apiDelete("/payments/mp/oauth");
      setTenant((t) => (t ? { ...t, mp_connected: false } : t));
      toast.success("Conta do Mercado Pago desconectada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao desconectar.");
    } finally {
      setMpLoading(false);
    }
  };

  useEffect(() => {
    apiGet<AuthUser>("/auth/me")
      .then((user) => setUserRole(user.role))
      .catch(console.error);

    apiGet<Tenant>("/tenants/my")
      .then((data) => {
        if (!data) return;
        setTenant(data);
        const preset = resolveSitePreset(data.site_preset);
        setForm((f) => ({
          ...f,
          name:                     data.name               ?? "",
          slug:                     data.slug               ?? "",
          theme_bg:                 data.theme_bg           ?? "#080808",
          theme_card:               data.theme_card         ?? "#121212",
          theme_text:               data.theme_text         ?? "#A1A1AA",
          theme_title:              data.theme_title        ?? "#FFFFFF",
          theme_button_bg:          data.theme_button_bg    ?? "#FFFFFF",
          theme_button_text:        data.theme_button_text  ?? "#000000",
          theme_accent:             data.theme_accent       ?? "#4ade80",
          font_family:              data.font_family        ?? "Inter",
          logo_url:                 data.logo_url           ?? "",
          cancellation_policy_hours: data.cancellation_policy_hours ?? 2,
          global_commission_rate:   data.global_commission_rate ?? 50,
          privacy_policy_url:       data.privacy_policy_url  ?? "",
          terms_of_service_url:     data.terms_of_service_url ?? "",
          address:                  data.address ?? "",
          page_headline:            data.page_headline ?? "",
          page_subheadline:         data.page_subheadline ?? "",
          site_preset:              data.site_preset ?? "classic",
          hero_image_url:           data.hero_image_url ?? "",
          stat_clients:             data.stat_clients ?? "",
          stat_rating:              data.stat_rating ?? "",
          stat_experience:          data.stat_experience ?? "",
          site_layout:              normalizeSiteLayout(data.site_layout, preset.id, {
            stats: data.show_stats,
            team: data.show_team,
          }),
        }));
      })
      .catch(console.error);
  }, []);

  const applyPreset = (preset: Partial<typeof form>) => {
    setForm(f => ({ ...f, ...preset }));
  };

  const set = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [field]: value }));

  const activePreset = resolveSitePreset(form.site_preset);

  const handleSave = async () => {
    setSaving(true);
    try {
      // O token do MP não passa mais por aqui: a conta é conectada via OAuth
      // (handleMpConnect), então este formulário não carrega nenhum segredo.
      const updated = await apiPatch<Tenant>("/tenants/my", form);
      setTenant(updated);
      setSaved(true);
      toast.success(activeTab === "pagina" ? "Página publicada com sucesso." : "Alterações salvas com sucesso.");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro de rede ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${activeTab === "pagina" ? "max-w-6xl" : "max-w-3xl"} mx-auto space-y-6 sm:space-y-8`}>
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-neutral-600 font-semibold mb-1.5">Configurações</p>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Ajustes do App</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Personalize a identidade visual e as políticas do seu app white-label.
        </p>
      </div>

      {/* Preview strip */}
      {tenant && (
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: form.theme_accent }}
          >
            <Scissors className="w-5 h-5 text-black" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white text-sm">{form.name || "Sua Barbearia"}</p>
            <p className="text-xs text-neutral-500 truncate">{host || "…"}/<span className="text-neutral-300">{form.slug || "seu-slug"}</span></p>
          </div>
          <a
            href={`/${form.slug}`}
            target="_blank"
            className="ml-auto shrink-0 text-xs font-medium text-neutral-500 hover:text-white transition-colors underline underline-offset-2"
          >
            Visualizar →
          </a>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-full sm:w-fit overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.growingman;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-500 hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── ABA: PERFIL ───────────────────────────────────── */}
      {activeTab === "perfil" && (
        <div className="space-y-5">
          <FieldGroup title="Informações Básicas">
            <Field label="Nome da Barbearia" hint="Aparece no app e na landing page.">
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Ex: Growingman Barbearia Premium"
                className="bg-white/[0.04] border-white/[0.08] focus:border-white/25 rounded-xl h-11"
              />
            </Field>
            <Field label="Slug (URL Pública)" hint={`Seu link ficará: ${host || "seu-site"}/${form.slug || "seu-slug"}`}>
              <div className="flex items-center">
                <div className="h-11 px-3 bg-white/[0.02] border border-r-0 border-white/[0.08] rounded-l-xl flex items-center justify-center text-xs sm:text-sm text-neutral-500 select-none shrink-0">
                  {host || "…"}/
                </div>
                <Input
                  value={form.slug}
                  onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="seu-slug"
                  className="bg-white/[0.04] border-white/[0.08] focus:border-white/25 rounded-l-none rounded-r-xl h-11 font-mono min-w-0"
                />
              </div>
            </Field>
            <Field label="Logo da Barbearia" hint="PNG, JPG ou WEBP. Máx. 5 MB.">
              <ImageUpload
                value={form.logo_url}
                folder="tenants/logo"
                shape="square"
                onChange={(url) => set("logo_url", url)}
                hint="A logo aparece no app público e no painel."
              />
            </Field>
          </FieldGroup>
        </div>
      )}

      {/* ── ABA: PÁGINA PÚBLICA ───────────────────────────── */}
      {activeTab === "pagina" && (
        <div className="space-y-5">
          <FieldGroup title="Conteúdo do Topo (Hero)">
            <Field label="Título principal" hint="Deixe em branco para usar o nome da barbearia.">
              <Input
                value={form.page_headline}
                onChange={(e) => set("page_headline", e.target.value)}
                placeholder={form.name || "Nome da barbearia"}
                maxLength={120}
                className="bg-white/[0.04] border-white/[0.08] focus:border-white/25 rounded-xl h-11"
              />
            </Field>
            <Field label="Subtítulo" hint="Uma frase curta que descreve seu diferencial.">
              <textarea
                value={form.page_subheadline}
                onChange={(e) => set("page_subheadline", e.target.value)}
                placeholder="Ex: Experiência premium em cada detalhe. Do corte clássico ao acabamento perfeito."
                maxLength={280}
                rows={3}
                className="w-full p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-white/25 resize-none transition-colors"
              />
            </Field>
            <Field label="Endereço" hint="Exibido no topo da página pública.">
              <Input
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="Ex: Rua das Flores, 123 - Centro"
                maxLength={255}
                className="bg-white/[0.04] border-white/[0.08] focus:border-white/25 rounded-xl h-11"
              />
            </Field>
          </FieldGroup>

          <FieldGroup title="Preset de Layout do Site">
            <p className="text-sm text-neutral-400 mb-1">
              Escolha um modelo pronto — ele define a estrutura de toda a página pública (topo e seções). As cores e a fonte continuam nos ajustes de Aparência.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SITE_PRESETS.map((preset) => {
                const active = form.site_preset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setForm((current) => ({
                        ...current,
                        site_preset: preset.id,
                        site_layout: defaultSiteLayout(preset.id),
                      }));
                    }}
                    className={`group rounded-xl border overflow-hidden text-left transition-all ${
                      active ? "border-white/40 ring-1 ring-white/20" : "border-white/[0.08] hover:border-white/20"
                    }`}
                  >
                    <div className="relative h-24 bg-black/40 border-b border-white/[0.06]">
                      <HeroPresetPreview id={preset.id} />
                      {preset.needsImage && (
                        <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-semibold text-white">
                          <ImageGrowingman className="w-3 h-3" /> Imagem
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center ${active ? "border-white bg-white" : "border-white/30"}`}>
                          {active && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                        </span>
                        <span className={`text-sm font-semibold ${active ? "text-white" : "text-neutral-300"}`}>{preset.label}</span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">{preset.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </FieldGroup>

          {activePreset.needsImage && (
            <FieldGroup title="Imagem de Capa">
              <Field label="Foto do topo" hint="Recomendado: imagem horizontal de alta qualidade (JPG/PNG/WEBP). Máx. 5 MB.">
                <ImageUpload
                  value={form.hero_image_url}
                  folder="tenants/hero"
                  shape="wide"
                  onChange={(url) => set("hero_image_url", url)}
                  hint="Usada pelos presets com imagem."
                />
              </Field>
              {!form.hero_image_url && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                  <AlertTriangle className="w-4 h-4 text-amber-500/80 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-400/80 leading-relaxed">
                    Sem uma imagem, este preset exibe o topo padrão. Envie uma foto para ativá-lo.
                  </p>
                </div>
              )}
            </FieldGroup>
          )}

          {activePreset.sections.includes("stats") && (
            <FieldGroup title="Números de Destaque">
              <p className="text-sm text-neutral-400 mb-1">Personalize os valores da barra de destaques. Deixe em branco para usar o padrão.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Clientes atendidos">
                  <Input value={form.stat_clients} onChange={(e) => set("stat_clients", e.target.value)} placeholder="1.200+" maxLength={20} className="bg-white/[0.04] border-white/[0.08] focus:border-white/25 rounded-xl h-11" />
                </Field>
                <Field label="Avaliação média">
                  <Input value={form.stat_rating} onChange={(e) => set("stat_rating", e.target.value)} placeholder="4.9 ★" maxLength={20} className="bg-white/[0.04] border-white/[0.08] focus:border-white/25 rounded-xl h-11" />
                </Field>
                <Field label="Anos de experiência">
                  <Input value={form.stat_experience} onChange={(e) => set("stat_experience", e.target.value)} placeholder="8+" maxLength={20} className="bg-white/[0.04] border-white/[0.08] focus:border-white/25 rounded-xl h-11" />
                </Field>
              </div>
            </FieldGroup>
          )}
        </div>
      )}

      {/* ── ABA: APARÊNCIA ────────────────────────────────── */}
      {activeTab === "aparencia" && (
        <div className="space-y-5">
          <FieldGroup title="Paletas Prontas">
            <p className="text-sm text-neutral-400 mb-5">Escolha uma combinação pronta ou ajuste as cores uma a uma abaixo.</p>
            <div className="space-y-6">
              {COLOR_PRESET_GROUPS.map(group => (
                <div key={group.style}>
                  <div className="mb-3">
                    <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-400">{group.style}</h4>
                    <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">{group.hint}</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {group.presets.map(p => {
                      const active = THEME_COLOR_KEYS.every(key => form[key] === p.colors[key]);

                      return (
                        <button
                          key={p.label}
                          onClick={() => applyPreset(p.colors)}
                          aria-pressed={active}
                          className={`relative flex flex-col items-start p-3 rounded-xl border transition-all text-left ${
                            active
                              ? "border-white/40 bg-white/[0.06]"
                              : "border-white/[0.08] hover:bg-white/[0.04] hover:border-white/20"
                          }`}
                        >
                          {active && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-white absolute top-2.5 right-2.5" aria-hidden="true" />
                          )}
                          {/* Amostra na ordem em que aparecem na página: fundo, botão, destaque. */}
                          <div className="flex gap-1 mb-2">
                            <span className="w-4 h-4 rounded-full border border-white/10" style={{ background: p.colors.theme_bg }} />
                            <span className="w-4 h-4 rounded-full border border-white/10" style={{ background: p.colors.theme_button_bg }} />
                            <span className="w-4 h-4 rounded-full border border-white/10" style={{ background: p.colors.theme_accent }} />
                          </div>
                          <span className={`text-xs font-medium ${active ? "text-white" : "text-neutral-300"}`}>{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </FieldGroup>

          <FieldGroup title="Cores Detalhadas">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {([
                { id: "theme_bg", label: "Fundo Geral" },
                { id: "theme_card", label: "Fundo dos Cards" },
                { id: "theme_title", label: "Cor dos Títulos" },
                { id: "theme_text", label: "Cor dos Textos" },
                { id: "theme_button_bg", label: "Fundo Botão" },
                { id: "theme_button_text", label: "Texto Botão" },
                { id: "theme_accent", label: "Destaques / Ícones" }
              ] as const).map(field => (
                <Field key={field.id} label={field.label}>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form[field.id]}
                      onChange={(e) => set(field.id, e.target.value)}
                      className="w-10 h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] cursor-pointer p-0.5"
                    />
                    <Input
                      value={form[field.id]}
                      onChange={(e) => set(field.id, e.target.value)}
                      className="flex-1 bg-white/[0.04] border-white/[0.08] focus:border-white/25 rounded-xl h-10 font-mono text-xs uppercase px-2"
                    />
                  </div>
                </Field>
              ))}
            </div>
          </FieldGroup>

          <p className="text-xs text-neutral-500 -mt-1">
            A fonte da sua página vem do <span className="text-neutral-300 font-medium">preset de layout</span> escolhido na aba
            <span className="text-neutral-300 font-medium"> Página Pública</span> — cada preset já traz uma tipografia combinando.
          </p>

          {/* Live preview */}
          <div
            className="p-6 rounded-2xl border border-white/[0.06] overflow-hidden"
            style={{ backgroundColor: form.theme_bg }}
          >
            <p className="text-xs mb-4 font-sans uppercase tracking-wider" style={{ color: form.theme_text }}>Preview</p>
            <div 
              className="p-5 rounded-2xl border border-white/5" 
              style={{ backgroundColor: form.theme_card }}
            >
              <h3
                className="text-2xl font-black mb-1"
                style={{ color: form.theme_title }}
              >
                {form.name || "Sua Barbearia"}
              </h3>
              <p className="text-sm mb-4" style={{ color: form.theme_text }}>
                Experiência premium em cada detalhe.
              </p>
              
              <div className="flex items-center gap-3">
                <button
                  className="px-5 py-2.5 rounded-full text-sm font-bold transition-transform active:scale-95"
                  style={{ backgroundColor: form.theme_button_bg, color: form.theme_button_text }}
                >
                  Agendar Horário
                </button>
                <div className="flex items-center gap-2 text-xs font-medium" style={{ color: form.theme_accent }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: form.theme_accent }} />
                  Disponível
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ABA: FINANCEIRO ───────────────────────────────── */}
      {activeTab === "financeiro" && (
        <div className="space-y-5">
          <FieldGroup title="Comissões Padrão">
            <Field
              label="Comissão Global do Sistema"
              hint="Taxa de comissão padrão aplicada a novos barbeiros ou serviços."
            >
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.global_commission_rate}
                  onChange={(e) => set("global_commission_rate", Number(e.target.value))}
                  className="w-28 bg-white/[0.04] border-white/[0.08] focus:border-white/25 rounded-xl h-11 text-center"
                />
                <span className="text-neutral-500 text-sm flex items-center gap-1.5">
                  <Percent className="w-4 h-4" /> da receita do serviço
                </span>
              </div>
            </Field>
          </FieldGroup>

          {userRole === "TENANT_ADMIN" && (
          <FieldGroup title="Conta de recebimento (Mercado Pago)">
            {/* OAuth: o dono autoriza pela conta dele. Antes era preciso caçar o
                access_token no painel do MP e colar aqui — inviável na prática. */}
            {tenant?.mp_connected ? (
              <>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/5 border border-green-500/15">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <p className="text-xs text-green-400/90 leading-relaxed">
                    Conta da barbearia conectada. As cobranças geradas no fechamento
                    do atendimento caem direto nesta conta do Mercado Pago.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  disabled={mpLoading}
                  onClick={handleMpDisconnect}
                  className="w-full h-11 rounded-xl border-red-500/20 text-red-400 hover:bg-red-500/10"
                >
                  {mpLoading ? "Desconectando..." : "Desconectar conta"}
                </Button>
              </>
            ) : (
              <>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Conecte a conta Mercado Pago da barbearia para receber cobranças de
                  atendimentos. Apenas o dono pode conectar ou trocar esta conta.
                </p>

                <Button
                  type="button"
                  disabled={mpLoading}
                  onClick={handleMpConnect}
                  className="w-full h-11 rounded-xl font-semibold"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {mpLoading ? "Redirecionando..." : "Conectar Mercado Pago"}
                </Button>
              </>
            )}

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <Shield className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
              <p className="text-xs text-neutral-500 leading-relaxed">
                Não pedimos sua senha nem seu token: a autorização acontece no site do
                Mercado Pago. As credenciais ficam cifradas no servidor e nunca são
                exibidas aqui.
              </p>
            </div>
          </FieldGroup>
          )}
        </div>
      )}

      {/* ── ABA: POLÍTICAS ────────────────────────────────── */}
      {activeTab === "politicas" && (
        <div className="space-y-5">
          <FieldGroup title="Política de Cancelamento">
            <Field
              label="Antecedência mínima para cancelamento"
              hint="Clientes não poderão cancelar com menos horas de antecedência."
            >
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={0}
                  max={72}
                  value={form.cancellation_policy_hours}
                  onChange={(e) => set("cancellation_policy_hours", Number(e.target.value))}
                  className="w-28 bg-white/[0.04] border-white/[0.08] focus:border-white/25 rounded-xl h-11 text-center"
                />
                <span className="text-neutral-500 text-sm flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> horas antes do agendamento
                </span>
              </div>
            </Field>
          </FieldGroup>

          <FieldGroup title="Documentos Legais">
            <Field label="URL da Política de Privacidade">
              <Input
                value={form.privacy_policy_url}
                onChange={(e) => set("privacy_policy_url", e.target.value)}
                placeholder="https://..."
                className="bg-white/[0.04] border-white/[0.08] focus:border-white/25 rounded-xl h-11"
              />
            </Field>
            <Field label="URL dos Termos de Serviço">
              <Input
                value={form.terms_of_service_url}
                onChange={(e) => set("terms_of_service_url", e.target.value)}
                placeholder="https://..."
                className="bg-white/[0.04] border-white/[0.08] focus:border-white/25 rounded-xl h-11"
              />
            </Field>
          </FieldGroup>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/15">
            <AlertTriangle className="w-4 h-4 text-yellow-500/80 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-400/80 leading-relaxed">
              Manter a política de privacidade atualizada é obrigatório pela LGPD. Consulte um advogado especializado.
            </p>
          </div>
        </div>
      )}

      {/* Save button */}
      <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/[0.05]">
        {activeTab === "pagina" && (
          <p className="text-xs text-neutral-600">
            A prévia só fica pública depois de publicar.
          </p>
        )}
        <Button
          onClick={handleSave}
          disabled={saving || saved}
          className={`h-10 px-6 rounded-xl text-sm font-semibold transition-all ${
            saved
              ? "bg-green-500 text-white hover:bg-green-500"
              : "bg-white text-black hover:bg-zinc-100 shadow-[0_0_20px_rgba(255,255,255,0.12)]"
          }`}
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {activeTab === "pagina" ? "Publicando..." : "Salvando..."}</>
          ) : saved ? (
            <><CheckCircle2 className="w-4 h-4 mr-2" /> {activeTab === "pagina" ? "Publicado!" : "Salvo!"}</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> {activeTab === "pagina" ? "Publicar página" : "Salvar Alterações"}</>
          )}
        </Button>
      </div>
    </div>
  );
}

/* ── Componentes auxiliares ─────────────────────────── */

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
      <div className="px-5 py-3 bg-white/[0.02] border-b border-white/[0.05]">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{title}</p>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-white">{label}</label>
      {hint && <p className="text-xs text-neutral-600">{hint}</p>}
      {children}
    </div>
  );
}

/**
 * Mini-mockup do layout de cada TEMPLATE (ilustrativo). Cada preset é um
 * template inteiro e distinto, então cada preview tem uma silhueta própria —
 * não mais só a variante de hero.
 */
function HeroPresetPreview({ id }: { id: SitePresetId }) {
  const bar = "rounded-full bg-white/25";
  const dim = "bg-white/12";

  // CLÁSSICO — centrado, imponente, com "grade" de cards abaixo.
  if (id === "classic") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-3">
        <div className={`${bar} h-2.5 w-20`} />
        <div className={`${bar} h-1.5 w-14 ${dim} mb-1`} />
        <div className="grid grid-cols-3 gap-1 w-full px-3">
          <div className="h-3 rounded bg-white/15" />
          <div className="h-3 rounded bg-white/15" />
          <div className="h-3 rounded bg-white/15" />
        </div>
      </div>
    );
  }

  // REVISTA — serifa grande à esquerda, coluna estreita + fio.
  if (id === "editorial") {
    return (
      <div className="absolute inset-0 flex flex-col items-start justify-center gap-2 p-4">
        <div className="italic font-serif text-white/80 text-lg leading-none">Aa</div>
        <div className="h-px w-full bg-white/20" />
        <div className={`${bar} h-1.5 w-24 ${dim}`} />
        <div className={`${bar} h-1.5 w-16 ${dim}`} />
      </div>
    );
  }

  // VITRINE — imagem cobrindo tudo, título condensado embaixo, mosaico.
  if (id === "showcase") {
    return (
      <div className="absolute inset-0 bg-gradient-to-tr from-neutral-700 via-neutral-600 to-neutral-800 flex flex-col justify-end p-2.5">
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative h-3 w-16 bg-white/85 rounded-sm mb-1.5" />
        <div className="relative grid grid-cols-3 gap-1">
          <div className="h-4 bg-white/25 rounded-sm" />
          <div className="h-4 bg-white/25 rounded-sm" />
          <div className="h-4 bg-white/25 rounded-sm" />
        </div>
      </div>
    );
  }

  // CONVERSÃO — split: bloco de marca à esquerda, lista à direita.
  if (id === "split") {
    return (
      <div className="absolute inset-0 grid grid-cols-2">
        <div className="flex flex-col items-start justify-center gap-1.5 p-3 bg-white/[0.06]">
          <div className={`${bar} h-2.5 w-12`} />
          <div className="h-2.5 w-10 rounded-full bg-white/70 mt-1" />
        </div>
        <div className="flex flex-col justify-center gap-1.5 p-3">
          <div className="h-2.5 w-full rounded bg-white/15" />
          <div className="h-2.5 w-full rounded bg-white/15" />
          <div className="h-2.5 w-3/4 rounded bg-white/15" />
        </div>
      </div>
    );
  }

  // MINIMALISTA — quase vazio, uma linha de texto centrada e um fio.
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
      <div className={`${bar} h-1.5 w-16 bg-white/40`} style={{ letterSpacing: "0.3em" }} />
      <div className="h-px w-10 bg-white/20" />
    </div>
  );
}
