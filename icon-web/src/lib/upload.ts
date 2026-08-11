/**
 * Upload de imagens via presigned URL (S3/MinIO).
 *
 * Fluxo:
 * 1. Pede ao backend uma URL assinada (POST /uploads/presign).
 * 2. Faz o PUT do arquivo direto no storage (não passa pela API).
 * 3. Retorna a URL pública final (a salvar no banco, ex.: logo_url).
 */
import { apiPost } from "@/lib/api";

export type UploadFolder = "tenants/logo" | "tenants/hero" | "services" | "products" | "barbers";

interface PresignResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Sobe uma imagem e devolve a URL pública.
 * Lança Error com mensagem amigável em caso de validação/falha.
 */
export async function uploadImage(file: File, folder: UploadFolder): Promise<string> {
  if (!ALLOWED.includes(file.type)) {
    throw new Error("Formato inválido. Use JPG, PNG, WEBP ou SVG.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Imagem muito grande (máx. 5 MB).");
  }

  // 1. Presign
  const { uploadUrl, publicUrl } = await apiPost<PresignResponse>("/uploads/presign", {
    folder,
    contentType: file.type,
  });

  // 2. PUT direto no storage
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!res.ok) {
    throw new Error("Falha ao enviar a imagem para o storage.");
  }

  // 3. URL pública
  return publicUrl;
}
