"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadImage, type UploadFolder } from "@/lib/upload";
import { useToast } from "@/components/ui/toast";

interface ImageUploadProps {
  /** URL atual da imagem (preview). */
  value?: string | null;
  /** Pasta lógica no storage. */
  folder: UploadFolder;
  /** Chamado com a URL pública após upload bem-sucedido (ou "" ao remover). */
  onChange: (url: string) => void;
  /** Texto auxiliar abaixo do botão. */
  hint?: string;
  /** Formato do preview: quadrado (logo) ou banner largo. */
  shape?: "square" | "wide";
}

export function ImageUpload({
  value,
  folder,
  onChange,
  hint,
  shape = "square",
}: ImageUploadProps) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, folder);
      onChange(url);
      toast.success("Imagem enviada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao enviar imagem.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const isWide = shape === "wide";
  const previewSize = isWide ? "w-full h-32 sm:h-40" : "w-20 h-20 sm:w-24 sm:h-24";

  return (
    // No formato "wide" o preview ocupa a largura toda, então os controles ficam
    // ABAIXO (coluna). No "square" (logo) eles ficam ao lado (linha) a partir de sm.
    <div className={`flex items-start gap-4 ${isWide ? "flex-col" : "flex-col sm:flex-row"}`}>
      {/* Preview */}
      <div
        className={`${previewSize} rounded-xl border border-white/[0.1] bg-white/[0.03] overflow-hidden flex items-center justify-center relative ${isWide ? "" : "shrink-0"}`}
      >
        {value ? (
          // Imagem dinâmica de storage externo — next/image não se aplica bem aqui.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Pré-visualização" className="w-full h-full object-cover" />
        ) : (
          <ImagePlus className="w-6 h-6 text-neutral-600" />
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="flex-1 min-w-0 w-full">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="h-9 px-4 rounded-xl text-sm font-semibold bg-white/[0.06] text-white hover:bg-white/[0.12] transition-colors disabled:opacity-50 inline-flex items-center gap-2"
          >
            <ImagePlus className="w-4 h-4" />
            {value ? "Trocar imagem" : "Enviar imagem"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              disabled={uploading}
              className="h-9 px-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              Remover
            </button>
          )}
        </div>
        {hint && <p className="text-xs text-neutral-600 mt-2">{hint}</p>}
      </div>
    </div>
  );
}
