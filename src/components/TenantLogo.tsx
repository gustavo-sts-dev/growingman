import { Scissors } from "lucide-react";

interface TenantLogoProps {
  /** URL da logo do tenant (pode ser null/undefined). */
  logoUrl?: string | null;
  /** Classe do contêiner (tamanho/rounded). */
  className?: string;
  /** Cor de fundo quando cai no ícone de fallback. */
  fallbackBg?: string;
  /** Cor do ícone de fallback. */
  fallbackColor?: string;
  /** Tamanho do ícone de fallback (classe Tailwind). */
  growingmanClassName?: string;
  alt?: string;
}

/**
 * Renderiza a logo da barbearia; se não houver, mostra o ícone padrão (tesoura).
 * Usado tanto no app público quanto no painel — fonte única da regra de fallback.
 */
export function TenantLogo({
  logoUrl,
  className = "w-8 h-8 rounded-lg",
  fallbackBg,
  fallbackColor,
  growingmanClassName = "w-4 h-4",
  alt = "Logo",
}: TenantLogoProps) {
  if (logoUrl) {
    return (
      <div
        className={`${className} overflow-hidden flex items-center justify-center shrink-0`}
      >
        {/* Logo dinâmica do storage do tenant; next/image não se aplica bem aqui. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={alt}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center shrink-0`}
      style={fallbackBg ? { backgroundColor: fallbackBg } : undefined}
    >
      <Scissors
        className={growingmanClassName}
        style={fallbackColor ? { color: fallbackColor } : undefined}
      />
    </div>
  );
}
