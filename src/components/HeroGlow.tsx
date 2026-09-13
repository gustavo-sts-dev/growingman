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

      {/*
        O terceiro foco, mais fechado que os dois de cima.

        Era um círculo chapado com `blur(120px)`. O desfoque de verdade quebra a
        borda matemática do degradê e fica mais perto de luz difusa — mas custa
        caro demais: `filter: blur()` é rasterizado fora da tela num buffer
        inflado em ~3× o raio para cada lado, em pixels do aparelho, e o WebKit
        o refaz a CADA repintura da página. Esta é a página que o cliente da
        barbearia abre no celular; era ela pagando a conta em toda rolagem e em
        cada tecla digitada no agendamento.

        O degradê radial não tem buffer nenhum. A borda perfeita que o desfoque
        quebrava fica disfarçada pelas duas camadas de halo acima desta.
      */}
      <div
        className="absolute left-[6%] top-[8%] h-[80%] w-[80%]"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in srgb, var(--theme-accent) 14%, transparent) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
