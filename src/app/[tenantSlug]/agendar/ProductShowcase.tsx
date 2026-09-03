"use client";

import { useEffect, useId, useState } from "react";
import { Check, ChevronDown, ShoppingBag } from "lucide-react";
import { apiUrl } from "@/lib/config";

/**
 * Vitrine de produtos da barbearia, no fim do agendamento.
 *
 * O cliente marca o que quer levar, e o valor entra no total do agendamento.
 * Estoque e caixa NÃO se movem aqui: a baixa acontece na conclusão do
 * atendimento, quando o produto sai de fato da prateleira.
 *
 * Some por completo quando não há produto com estoque. Uma seção vazia
 * perguntando "quer levar um produto?" e não mostrando nenhum é pior que ausente.
 *
 * A lista RECOLHE, e não some: quem fecha continua vendo o título e pode abrir
 * de novo. Antes havia um "x" que descartava a sugestão de vez — sem desfazer,
 * só recarregando a página. Marcar produto e recolher não esconde a conta: os
 * escolhidos seguem listados no resumo, logo abaixo desta seção.
 */

export interface ShowcaseProduct {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
}

interface Estilos {
  title: React.CSSProperties;
  textMuted: React.CSSProperties;
  surface: React.CSSProperties;
  border: React.CSSProperties;
  borderStrong: React.CSSProperties;
  buttonPrimary: React.CSSProperties;
}

export function ProductShowcase({
  tenantId,
  T,
  className = "",
  bleedClassName = "",
  style,
  selecionados,
  onToggle,
}: {
  tenantId: string;
  T: Estilos;
  /** Ids marcados. O estado vive no fluxo, que precisa dele para o total. */
  selecionados: string[];
  onToggle: (produto: ShowcaseProduct) => void;
  /** Espaçamento fica com quem posiciona: o componente não sabe onde será usado. */
  className?: string;
  /**
   * Sangria lateral aplicada SÓ à faixa de cards.
   *
   * Para o próximo card espiar na borda — o sinal de "tem mais para o lado" — a
   * faixa precisa passar por cima do padding de quem contém o componente, e só o
   * chamador sabe qual é esse padding. Vem separada do `className` porque a
   * sangria é do carrossel, não da seção: junto no container raiz, ela esticava
   * também o cabeçalho e jogava a seta do dropdown para fora do card.
   */
  bleedClassName?: string;
  /**
   * Estilo do container. A borda separadora precisa vir daqui, e não de um
   * wrapper do chamador: sem produto o componente devolve `null`, e aí um
   * wrapper deixaria uma borda solta sobre espaço vazio.
   */
  style?: React.CSSProperties;
}) {
  const [produtos, setProdutos] = useState<ShowcaseProduct[]>([]);
  const [recolhido, setRecolhido] = useState(false);
  /** `useId` porque nada impede duas vitrines na mesma página. */
  const idLista = useId();

  useEffect(() => {
    let cancelado = false;

    fetch(apiUrl(`/services/products?tenantId=${encodeURIComponent(tenantId)}`))
      .then((r) => (r.ok ? r.json() : []))
      .then((d: ShowcaseProduct[]) => {
        if (!cancelado) setProdutos(Array.isArray(d) ? d : []);
      })
      // A vitrine é acessória: se a busca falhar, o agendamento segue sem ela.
      .catch(() => undefined);

    return () => {
      cancelado = true;
    };
  }, [tenantId]);

  if (produtos.length === 0) return null;

  return (
    <div className={className} style={style}>
      {/*
        Padrão de divulgação (disclosure): o botão fica DENTRO do h4 para o
        leitor de tela anunciar título e estado juntos ("Quer levar um produto?,
        botão, expandido"). A linha inteira é o alvo de toque — no celular isso
        vale mais que acertar um ícone de 16px.
        `mb-3` só quando aberto: recolhido, a margem sobraria como espaço morto.
      */}
      <h4 className={recolhido ? "" : "mb-3"}>
        <button
          type="button"
          onClick={() => setRecolhido((atual) => !atual)}
          aria-expanded={!recolhido}
          aria-controls={idLista}
          className="flex w-full items-center gap-2 rounded-lg py-1 text-left text-base font-bold transition-opacity hover:opacity-70"
          style={T.title}
        >
          <ShoppingBag className="h-4 w-4 shrink-0" style={T.textMuted} />
          Quer levar um produto?
          {/* A seta gira em vez de trocar de ícone: o movimento liga um estado ao
              outro. `ml-auto` empurra para a direita, onde ficava o "x". */}
          <ChevronDown
            className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-200 ${
              recolhido ? "" : "rotate-180"
            }`}
            style={T.textMuted}
          />
        </button>
      </h4>

      {!recolhido && (
        <div id={idLista}>
          <p className="mb-4 text-sm" style={T.textMuted}>
            Toque para adicionar ao seu atendimento. Você leva no dia.
          </p>

          {/*
            Rolagem horizontal com encaixe. A sangria lateral vem do
            `bleedClassName` do chamador (ver a prop) e se aplica só a esta
            faixa: é ela que precisa passar por cima do padding do card para o
            próximo produto espiar na borda.
            `overscroll-x-contain` impede que o gesto continue na página e dispare o
            "voltar" do navegador.
          */}
          <div
            className={`flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 ${bleedClassName}`}
            style={{ scrollbarWidth: "thin" }}
          >
            {produtos.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onToggle(p)}
                aria-pressed={selecionados.includes(p.id)}
                className={`relative w-40 shrink-0 snap-start overflow-hidden rounded-xl border text-left transition-opacity hover:opacity-90 ${
                  selecionados.includes(p.id) ? "" : "opacity-100"
                }`}
                style={{
                  ...T.surface,
                  // Selecionado ganha borda de destaque; o resto fica na borda neutra.
                  ...(selecionados.includes(p.id) ? T.borderStrong : T.border),
                }}
              >
                {selecionados.includes(p.id) && (
                  /* Marca de seleção. Identidade nunca fica só na cor da borda: o
                     ícone é o que diferencia para quem não distingue matiz. */
                  <span
                    className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full"
                    style={T.buttonPrimary}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}
                <div
                  className="relative aspect-square w-full overflow-hidden"
                  style={T.surface}
                >
                  {p.imageUrl ? (
                    /* `<img>` cru, como o resto do app: as imagens vêm do bucket, cuja
                       origem muda por ambiente (MinIO local, R2 em produção) e vive em
                       env — `next/image` exigiria `remotePatterns` fixo no config. */
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ShoppingBag className="h-8 w-8 opacity-40" style={T.textMuted} />
                    </div>
                  )}
                </div>

                <div className="p-3">
                  {/* Duas linhas no máximo: nome de produto varia muito de tamanho e
                      um card mais alto que os outros desalinha a fileira inteira. */}
                  <p
                    className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight"
                    style={T.title}
                  >
                    {p.name}
                  </p>
                  <p className="mt-1.5 text-sm font-bold" style={T.title}>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(p.price)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
