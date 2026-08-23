/**
 * Preço da assinatura, para exibição.
 *
 * A FONTE DA VERDADE é o backend, em `subscription-pricing.ts` — é ele que gera
 * a cobrança no Asaas. Estes valores existem só porque a landing page e o
 * cadastro precisam mostrar o preço antes de haver qualquer conta ou sessão,
 * então não há de onde buscá-lo.
 *
 * Estão aqui em UM lugar porque antes estavam escritos à mão em seis: dois no
 * cadastro e quatro na landing page. Trocar o preço exigia lembrar de todos, e
 * esquecer um significa anunciar um valor e cobrar outro — mentira sobre
 * dinheiro, na tela que o cliente lê antes de assinar.
 *
 * Ao mudar aqui, mude também `SUBSCRIPTION_BASE_PRICE` no backend.
 */

export const PRECO_BASE = 70;
export const PRECO_POR_PROFISSIONAL = 15;

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    // Sem centavos: são valores redondos, e "R$ 70,00" numa manchete pesa sem
    // acrescentar informação.
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);

/** "R$ 70" — a base, para manchete e resumo. */
export const PRECO_BASE_FMT = brl(PRECO_BASE);

/** "R$ 15" — o adicional por profissional ativo. */
export const PRECO_POR_PROFISSIONAL_FMT = brl(PRECO_POR_PROFISSIONAL);
