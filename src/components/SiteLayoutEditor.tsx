"use client";

import { useMemo, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  GripVertical,
  Monitor,
  RotateCcw,
  Smartphone,
} from "lucide-react";

import {
  defaultSiteLayout,
  SITE_SECTION_LABELS,
  type HeroAlignment,
  type HeroImagePosition,
  type HeroMobileHeight,
  type SiteLayoutConfig,
  type SiteSectionId,
} from "@/lib/site-layout";
import type { SitePresetId } from "@/lib/site-presets";

interface SiteLayoutEditorProps {
  presetId: SitePresetId;
  value: SiteLayoutConfig;
  onChange: (value: SiteLayoutConfig) => void;
  preview: {
    name: string;
    headline: string;
    subheadline: string;
    imageUrl: string;
    colors: {
      background: string;
      card: string;
      text: string;
      title: string;
      button: string;
      buttonText: string;
      accent: string;
    };
  };
}

type PreviewMode = "desktop" | "mobile";

const REQUIRED_SECTIONS = new Set<SiteSectionId>(["hero", "services"]);

export function SiteLayoutEditor({
  presetId,
  value,
  onChange,
  preview,
}: SiteLayoutEditorProps) {
  const [selectedId, setSelectedId] = useState<SiteSectionId>("hero");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [draggedId, setDraggedId] = useState<SiteSectionId | null>(null);

  const selected = useMemo(
    () => value.sections.find((section) => section.id === selectedId) ?? value.sections[0],
    [selectedId, value.sections],
  );

  const updateHero = <K extends keyof SiteLayoutConfig["hero"]>(
    key: K,
    nextValue: SiteLayoutConfig["hero"][K],
  ) => onChange({ ...value, hero: { ...value.hero, [key]: nextValue } });

  const moveSection = (id: SiteSectionId, direction: -1 | 1) => {
    const index = value.sections.findIndex((section) => section.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= value.sections.length) return;

    const sections = [...value.sections];
    [sections[index], sections[target]] = [sections[target], sections[index]];
    onChange({ ...value, sections });
  };

  const placeSectionBefore = (movingId: SiteSectionId, targetId: SiteSectionId) => {
    if (movingId === targetId) return;
    const moving = value.sections.find((section) => section.id === movingId);
    if (!moving) return;

    const withoutMoving = value.sections.filter((section) => section.id !== movingId);
    const targetIndex = withoutMoving.findIndex((section) => section.id === targetId);
    withoutMoving.splice(targetIndex < 0 ? withoutMoving.length : targetIndex, 0, moving);
    onChange({ ...value, sections: withoutMoving });
  };

  const toggleSection = (id: SiteSectionId) => {
    if (REQUIRED_SECTIONS.has(id)) return;
    onChange({
      ...value,
      sections: value.sections.map((section) =>
        section.id === id ? { ...section, visible: !section.visible } : section,
      ),
    });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b0b0b]">
      <div className="flex flex-col gap-3 border-b border-white/[0.07] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Editor da página</h3>
          <p className="mt-0.5 text-xs text-neutral-500">
            Arraste as seções, selecione um bloco e ajuste suas propriedades.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/[0.08] bg-black p-1" aria-label="Tamanho da prévia">
            <PreviewModeButton
              active={previewMode === "desktop"}
              label="Desktop"
              onClick={() => setPreviewMode("desktop")}
            >
              <Monitor className="h-3.5 w-3.5" />
            </PreviewModeButton>
            <PreviewModeButton
              active={previewMode === "mobile"}
              label="Celular"
              onClick={() => setPreviewMode("mobile")}
            >
              <Smartphone className="h-3.5 w-3.5" />
            </PreviewModeButton>
          </div>
          <button
            type="button"
            onClick={() => onChange(defaultSiteLayout(presetId))}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 text-xs font-medium text-neutral-400 transition-colors hover:border-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[210px_minmax(0,1fr)_220px]">
        <div className="border-b border-white/[0.07] p-3 lg:border-b-0 lg:border-r">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600">
            Seções
          </p>
          <div className="space-y-1">
            {value.sections.map((section, index) => {
              const active = selected?.id === section.id;
              const required = REQUIRED_SECTIONS.has(section.id);

              return (
                <div
                  key={section.id}
                  draggable
                  onDragStart={() => setDraggedId(section.id)}
                  onDragEnd={() => setDraggedId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggedId) placeSectionBefore(draggedId, section.id);
                    setDraggedId(null);
                  }}
                  className={`group flex items-center gap-1 rounded-lg border transition-colors ${
                    active
                      ? "border-white/20 bg-white/[0.08]"
                      : "border-transparent hover:bg-white/[0.04]"
                  } ${draggedId === section.id ? "opacity-40" : ""}`}
                >
                  <button
                    type="button"
                    className="cursor-grab p-2 text-neutral-700 active:cursor-grabbing group-hover:text-neutral-500"
                    aria-label={`Arrastar ${SITE_SECTION_LABELS[section.id]}`}
                    onClick={() => setSelectedId(section.id)}
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedId(section.id)}
                    className={`min-h-10 min-w-0 flex-1 truncate text-left text-sm ${
                      section.visible ? "text-neutral-200" : "text-neutral-600"
                    }`}
                  >
                    {SITE_SECTION_LABELS[section.id]}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    disabled={required}
                    aria-label={
                      required
                        ? `${SITE_SECTION_LABELS[section.id]} é obrigatória`
                        : `${section.visible ? "Ocultar" : "Mostrar"} ${SITE_SECTION_LABELS[section.id]}`
                    }
                    className="p-2 text-neutral-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    {section.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <div className="mr-1 hidden items-center sm:flex lg:hidden xl:flex">
                    <button
                      type="button"
                      onClick={() => moveSection(section.id, -1)}
                      disabled={index === 0}
                      className="p-1 text-neutral-700 hover:text-white disabled:opacity-20"
                      aria-label={`Mover ${SITE_SECTION_LABELS[section.id]} para cima`}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(section.id, 1)}
                      disabled={index === value.sections.length - 1}
                      className="p-1 text-neutral-700 hover:text-white disabled:opacity-20"
                      aria-label={`Mover ${SITE_SECTION_LABELS[section.id]} para baixo`}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="min-h-[520px] overflow-auto bg-[#050505] p-4 sm:p-6">
          <div
            className={`mx-auto overflow-hidden border border-white/10 shadow-2xl transition-[width] duration-300 ${
              previewMode === "mobile" ? "w-[280px] max-w-full rounded-[24px]" : "w-full rounded-xl"
            }`}
            style={{
              backgroundColor: preview.colors.background,
              color: preview.colors.text,
              minHeight: previewMode === "mobile" ? 500 : 430,
            }}
          >
            {value.sections.map((section) =>
              section.visible ? (
                <EditorPreviewSection
                  key={section.id}
                  id={section.id}
                  selected={selected?.id === section.id}
                  mode={previewMode}
                  layout={value}
                  preview={preview}
                  onSelect={() => setSelectedId(section.id)}
                />
              ) : null,
            )}
          </div>
          <p className="mt-3 text-center text-[11px] text-neutral-600">
            Prévia estrutural. Textos, serviços e fotos reais aparecem na página publicada.
          </p>
        </div>

        <div className="border-t border-white/[0.07] p-4 lg:border-l lg:border-t-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600">
            Propriedades
          </p>
          <h4 className="mt-2 text-sm font-semibold text-white">
            {selected ? SITE_SECTION_LABELS[selected.id] : "Seção"}
          </h4>

          {selected?.id === "hero" ? (
            <div className="mt-5 space-y-5">
              <EditorControl label="Alinhamento">
                <SegmentedControl<HeroAlignment>
                  value={value.hero.alignment}
                  onChange={(next) => updateHero("alignment", next)}
                  options={[
                    { value: "left", label: "Esquerda", icon: <AlignLeft className="h-3.5 w-3.5" /> },
                    { value: "center", label: "Centro", icon: <AlignCenter className="h-3.5 w-3.5" /> },
                  ]}
                />
              </EditorControl>
              <EditorControl label="Altura no celular">
                <SegmentedControl<HeroMobileHeight>
                  value={value.hero.mobileHeight}
                  onChange={(next) => updateHero("mobileHeight", next)}
                  options={[
                    { value: "compact", label: "Compacta" },
                    { value: "screen", label: "Tela cheia" },
                  ]}
                />
              </EditorControl>
              {preview.imageUrl && (
                <EditorControl label="Posição da imagem">
                  <SegmentedControl<HeroImagePosition>
                    value={value.hero.imagePosition}
                    onChange={(next) => updateHero("imagePosition", next)}
                    options={[
                      { value: "top", label: "Topo" },
                      { value: "center", label: "Centro" },
                      { value: "bottom", label: "Base" },
                    ]}
                  />
                </EditorControl>
              )}
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <p className="text-xs leading-5 text-neutral-500">
                Use a lista à esquerda para mudar a posição desta seção na página.
              </p>
              {!REQUIRED_SECTIONS.has(selected?.id ?? "hero") && selected && (
                <button
                  type="button"
                  onClick={() => toggleSection(selected.id)}
                  className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/[0.09] text-xs font-medium text-neutral-300 transition-colors hover:border-white/20 hover:text-white"
                >
                  {selected.visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {selected.visible ? "Ocultar seção" : "Mostrar seção"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function EditorPreviewSection({
  id,
  selected,
  mode,
  layout,
  preview,
  onSelect,
}: {
  id: SiteSectionId;
  selected: boolean;
  mode: PreviewMode;
  layout: SiteLayoutConfig;
  preview: SiteLayoutEditorProps["preview"];
  onSelect: () => void;
}) {
  const outline = selected ? `inset 0 0 0 2px ${preview.colors.accent}` : undefined;
  const common = {
    boxShadow: outline,
    backgroundColor: id === "hero" ? preview.colors.background : preview.colors.card,
  };

  if (id === "hero") {
    const centered = layout.hero.alignment === "center";
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`relative block w-full overflow-hidden p-5 text-left ${
          mode === "mobile"
            ? layout.hero.mobileHeight === "screen" ? "min-h-[300px]" : "min-h-[230px]"
            : "min-h-[210px] p-8"
        }`}
        style={common}
      >
        {preview.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-35"
            style={{ objectPosition: layout.hero.imagePosition }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
        <div className={`relative flex h-full flex-col justify-end ${centered ? "items-center text-center" : "items-start"}`}>
          <span className="mb-5 text-[9px] font-semibold uppercase tracking-[0.22em]" style={{ color: preview.colors.accent }}>
            {preview.name || "Sua barbearia"}
          </span>
          <strong className={`${mode === "mobile" ? "text-2xl" : "max-w-md text-4xl"} leading-[0.95]`} style={{ color: preview.colors.title }}>
            {preview.headline || preview.name || "Título da sua página"}
          </strong>
          <span className="mt-3 max-w-sm text-xs leading-5" style={{ color: preview.colors.text }}>
            {preview.subheadline || "Uma apresentação curta do seu trabalho."}
          </span>
          <span
            className="mt-5 inline-flex rounded-full px-4 py-2 text-[10px] font-semibold"
            style={{ backgroundColor: preview.colors.button, color: preview.colors.buttonText }}
          >
            Agendar horário
          </span>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className="block w-full border-t border-black/10 p-4 text-left sm:p-5"
      style={common}
    >
      <span className="text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: preview.colors.accent }}>
        {SITE_SECTION_LABELS[id]}
      </span>
      {id === "stats" ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {["1.200+", "4,9", "8 anos"].map((item) => (
            <span key={item} className="border-t pt-2 text-xs font-semibold" style={{ color: preview.colors.title }}>
              {item}
            </span>
          ))}
        </div>
      ) : id === "services" ? (
        <div className="mt-3 space-y-2">
          {["Corte", "Barba"].map((item) => (
            <span key={item} className="flex items-center justify-between rounded-md border border-black/10 px-3 py-2 text-xs" style={{ color: preview.colors.title }}>
              {item}<small style={{ color: preview.colors.text }}>Agendar</small>
            </span>
          ))}
        </div>
      ) : id === "team" ? (
        <div className="mt-3 flex gap-2">
          {["A", "B", "C"].map((item) => (
            <span key={item} className="flex h-8 w-8 items-center justify-center rounded-full text-[10px]" style={{ backgroundColor: preview.colors.background, color: preview.colors.title }}>
              {item}
            </span>
          ))}
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between gap-3">
          <strong className="text-sm" style={{ color: preview.colors.title }}>Pronto para agendar?</strong>
          <span className="rounded-full px-3 py-1.5 text-[9px] font-semibold" style={{ backgroundColor: preview.colors.button, color: preview.colors.buttonText }}>
            Agendar
          </span>
        </div>
      )}
    </button>
  );
}

function EditorControl({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-neutral-400">{label}</p>
      {children}
    </div>
  );
}

function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; icon?: React.ReactNode }[];
}) {
  return (
    <div className="grid gap-1 rounded-lg bg-white/[0.04] p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`inline-flex min-h-9 items-center justify-center gap-1 rounded-md px-2 text-[11px] font-medium transition-colors ${
            value === option.value ? "bg-white text-black" : "text-neutral-500 hover:text-white"
          }`}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}

function PreviewModeButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Prévia em ${label}`}
      aria-pressed={active}
      className={`inline-flex min-h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium ${
        active ? "bg-white text-black" : "text-neutral-500 hover:text-white"
      }`}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
