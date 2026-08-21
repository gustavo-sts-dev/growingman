/**
 * Imagem do topo da página pública.
 *
 * Substitui o uso como imagem de FUNDO. Antes ela era esticada com
 * `object-cover` para preencher a seção, o que cortava a foto de forma
 * imprevisível — uma foto vertical numa seção larga perdia topo e base, e o
 * dono não tinha como saber o que sobraria.
 *
 * Aqui a imagem aparece inteira: o dono define a LARGURA (% da coluna) e a
 * altura sai do aspecto do arquivo enviado. Nada é cortado e nada distorce.
 */
export function HeroImage({
  src,
  alt,
  /** Largura em % da coluna. Vem de `tenant.hero_image_width`. */
  width,
  className,
  style,
}: {
  src: string;
  alt: string;
  width: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  // Faixa defensiva: o valor vem da API, e um número fora disso estouraria a
  // coluna ou deixaria a foto ilegível. O backend valida igual — aqui é o
  // segundo cinto, porque o dado chega de fora.
  const safeWidth = Math.min(100, Math.max(20, Math.round(width)));

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      className={className}
      style={{
        width: `${safeWidth}%`,
        // `auto` é o que preserva o aspecto do arquivo. Trocar por valor fixo
        // aqui reintroduz o corte que esta mudança veio remover.
        height: "auto",
        ...style,
      }}
    />
  );
}
