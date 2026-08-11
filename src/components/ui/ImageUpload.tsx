"use client";

import { useRef, useState } from "react";
import { uploadImage, type UploadFolder } from "@/lib/upload";
import { Camera, Loader2, X } from "lucide-react";

interface ImageUploadProps {
  /** URL atual da imagem (null = sem imagem). */
  value: string | null;
  /** Callback com a URL pública após upload bem-sucedido. null = remoção. */
  onChange: (url: string | null) => void;
  /** Pasta do storage (enum do backend). */
  folder: UploadFolder;
  /** Formato do preview. */
  shape?: "square" | "circle";
  /** Tamanho (largura e altura) do preview em px. */
  size?: number;
  /** Placeholder quando não há imagem (ex: iniciais). */
  placeholder?: React.ReactNode;
  /** Callback de erro. */
  onError?: (message: string) => void;
  /** Label acessível. */
  label?: string;
  /** Classes extras. */
  className?: string;
}

/**
 * Componente reutilizável de upload de imagem com preview.
 * Usa presigned URL (S3/MinIO) via `uploadImage()`.
 */
export function ImageUpload({
  value,
  onChange,
  folder,
  shape = "square",
  size = 80,
  placeholder,
  onError,
  label = "Imagem",
  className = "",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset para permitir re-selecionar o mesmo arquivo
    e.target.value = "";

    setUploading(true);
    try {
      const publicUrl = await uploadImage(file, folder);
      onChange(publicUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar imagem.";
      onError?.(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const borderRadius = shape === "circle" ? "9999px" : "12px";

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {label && (
        <span className="text-sm text-neutral-400">{label}</span>
      )}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
        className={`relative group focus:outline-none cursor-pointer ${uploading ? 'pointer-events-none' : ''}`}
        style={{ width: size, height: size }}
        aria-label={`Upload ${label}`}
      >
        {/* Container */}
        <div
          className="w-full h-full overflow-hidden border-2 border-dashed border-white/10 hover:border-white/25 transition-colors flex items-center justify-center bg-white/[0.02]"
          style={{ borderRadius }}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
          ) : value ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={value}
              alt={label}
              className="w-full h-full object-cover"
              style={{ borderRadius }}
            />
          ) : placeholder ? (
            <>{placeholder}</>
          ) : (
            <Camera className="w-5 h-5 text-neutral-600" />
          )}
        </div>

        {/* Overlay de hover quando tem imagem */}
        {value && !uploading && (
          <div
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            style={{ borderRadius }}
          >
            <Camera className="w-5 h-5 text-white" />
          </div>
        )}

        {/* Botão de remover */}
        {value && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 hover:bg-red-400 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            aria-label="Remover imagem"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
