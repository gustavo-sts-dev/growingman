"use client";

import { useEffect, useState } from "react";
import { Check, ShoppingBag, X } from "lucide-react";
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
   * Estilo do container. A borda separadora precisa vir daqui, e não de um
   * wrapper do chamador: sem produto o componente devolve `null`, e aí um
   * wrapper deixaria uma borda solta sobre espaço vazio.
   */
  style?: React.CSSProperties;
}) {
  const [produtos, setProdutos] = useState<ShowcaseProduct[]>([]);
  const [oculto, setOculto] = useState(false);

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

  if (produtos.length === 0 || oculto) return null;

  return (
    <div className={className} style={style}>
      <div className="mb-3 flex items-center gap-2">
        <ShoppingBag className="h-4 w-4 shrink-0" style={T.textMuted} />
        <h4 className="text-base font-bold" style={T.title}>
          Quer levar um produto?
        </h4>

        {/* Dispensar a sugestão. `ml-auto` empurra para a direita; área de toque
            de 44px (p-2 sobre ícone de 16) para não virar alvo de precisão. */}
        <button
          type="button"
          onClick={() => setOculto(true)}
          aria-label="Ocultar sugestão de produtos"
          className="-mr-2 ml-auto shrink-0 rounded-lg p-2 transition-opacity hover:opacity-70"
          style={T.textMuted}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mb-4 text-sm" style={T.textMuted}>
        Toque para adicionar ao seu atendimento. Você leva no dia.
      </p>

      {/*
        Rolagem horizontal com encaixe.
        O recuo lateral vem do `className` do chamador, e não daqui: para o
        próximo card espiar na borda — que é o que sinaliza "tem mais para o
        lado" — a faixa precisa sangrar por cima do padding de quem a contém, e
        só o chamador sabe qual é esse padding.
        `overscroll-x-contain` impede que o gesto continue na página e dispare o
        "voltar" do navegador.
      */}
      <div
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2"
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
  );
}
