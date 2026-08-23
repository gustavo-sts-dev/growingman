"use client";

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { apiUrl } from "@/lib/config";

/**
 * Vitrine de produtos da barbearia, no fim do agendamento.
 *
 * É um convite, não um carrinho: o cliente vê o que existe e pede no balcão. Não
 * há reserva nem cobrança aqui — juntar produto ao agendamento mexeria em preço,
 * estoque e pagamento, e nada disso está neste fluxo.
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
}

export function ProductShowcase({
  tenantId,
  T,
}: {
  tenantId: string;
  T: Estilos;
}) {
  const [produtos, setProdutos] = useState<ShowcaseProduct[]>([]);

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
    <div className="mt-8">
      <div className="mb-3 flex items-center gap-2">
        <ShoppingBag className="h-4 w-4" style={T.textMuted} />
        <h4 className="text-base font-bold" style={T.title}>
          Quer levar um produto?
        </h4>
      </div>
      <p className="mb-4 text-sm" style={T.textMuted}>
        Peça na barbearia no dia do seu horário.
      </p>

      {/*
        Rolagem horizontal com encaixe.
        `-mx-1 px-1` deixa o card sangrar até a borda da tela em vez de parar num
        recuo — o corte do último card na margem é o que sinaliza "tem mais para
        o lado". `overscroll-x-contain` impede que o gesto continue na página e
        dispare o "voltar" do navegador.
      */}
      <div
        className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-1 pb-2"
        style={{ scrollbarWidth: "thin" }}
      >
        {produtos.map((p) => (
          <article
            key={p.id}
            className="w-40 shrink-0 snap-start overflow-hidden rounded-xl border"
            style={{ ...T.surface, ...T.border }}
          >
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
          </article>
        ))}
      </div>
    </div>
  );
}
