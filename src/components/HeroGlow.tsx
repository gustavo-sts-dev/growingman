/**
 * Fundo do herói: malha de gradientes desfocados, tirada do tema da barbearia.
 *
 * Substitui o antigo fundo de seda (WebGL). Duas vantagens práticas: é CSS, então
 * as vars `--theme-*` valem direto — o shader precisava do valor resolvido em
 * JavaScript, e era daí que vinham os descompassos entre tema e efeito. E não
 * há canvas nem loop de animação, o que tira peso da página pública, que é
 * aberta no celular do cliente.
 *
 * A receita é a mesma da landing (`.gm-mesh` em globals.css): camadas de
 * radial-gradient sobre uma base, com os pontos de origem espalhados para o
 * conjunto não parecer simétrico.
 */
export function HeroGlow({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none ${className ?? ""}`}>
      {/* Base: sobe levemente do fundo em direção ao card, dando volume sem
          alterar a cor que o tema definiu para a seção. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(158deg, color-mix(in srgb, var(--theme-card) 70%, var(--theme-bg)) 0%, var(--theme-bg) 55%, color-mix(in srgb, var(--theme-bg) 88%, black) 100%)",
        }}
      />

      {/* Halos: opacidade baixa de propósito. O fundo precisa dar profundidade
          sem competir com o título — foi exatamente aí que a versão anterior
          errou, usando a cor de destaque em área cheia. */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(75% 60% at 12% 8%, color-mix(in srgb, var(--theme-card) 85%, transparent) 0%, transparent 60%)",
            "radial-gradient(60% 55% at 88% 12%, color-mix(in srgb, var(--theme-accent) 14%, transparent) 0%, transparent 65%)",
            "radial-gradient(90% 80% at 50% 115%, color-mix(in srgb, var(--theme-bg) 92%, black) 0%, transparent 62%)",
          ].join(", "),
        }}
      />

      {/* Um halo com blur real: o degradê radial tem borda matemática perfeita,
          e o desfoque quebra isso, aproximando de luz difusa. */}
      <div
        className="absolute left-[18%] top-[22%] h-[55%] w-[55%] rounded-full blur-[120px]"
        style={{
          background: "color-mix(in srgb, var(--theme-accent) 12%, transparent)",
        }}
      />
    </div>
  );
}
