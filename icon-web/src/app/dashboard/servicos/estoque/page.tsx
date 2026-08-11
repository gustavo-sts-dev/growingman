"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useResource } from "@/lib/use-resource";
import { apiPost } from "@/lib/api";
import {
  formatCurrency,
  currencyInputValue,
  parseCurrencyInput,
} from "@/lib/format";
import type { Product } from "@/lib/types";
import {
  Package,
  AlertTriangle,
  Plus,
  PlusCircle,
  Search,
  Boxes,
} from "lucide-react";

const LOW_STOCK_THRESHOLD = 5;

export default function EstoquePage() {
  const toast = useToast();
  const {
    data,
    loading,
    reload: fetchInventory,
  } = useResource<{ products: Product[] }>("/finance/pos/inventory", {
    products: [],
  });
  const products = useMemo(() => data?.products ?? [], [data]);

  const [search, setSearch] = useState("");

  // Modal de adição de produto
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    basePrice: 0,
    stock: 0,
  });
  const [creating, setCreating] = useState(false);

  // Modal de Adicionar Estoque
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockToAdd, setStockToAdd] = useState(1);
  const [addingStock, setAddingStock] = useState(false);

  // Resumo (agregação client-side).
  const summary = useMemo(() => {
    let units = 0;
    let low = 0;
    for (const p of products) {
      units += p.stock_quantity;
      if (p.stock_quantity <= LOW_STOCK_THRESHOLD) low++;
    }
    return { total: products.length, units, low };
  }, [products]);

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => p.name.toLowerCase().includes(term));
  }, [products, search]);

  const handleCreateProduct = async () => {
    if (newProduct.name.trim().length < 2) {
      toast.error("Informe o nome do produto.");
      return;
    }
    setCreating(true);
    try {
      await apiPost("/finance/pos/inventory/product", {
        name: newProduct.name.trim(),
        price: newProduct.basePrice,
        stockQuantity: newProduct.stock,
      });
      setIsNewProductModalOpen(false);
      setNewProduct({ name: "", basePrice: 0, stock: 0 });
      toast.success("Produto criado.");
      fetchInventory();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar produto.");
    } finally {
      setCreating(false);
    }
  };

  const handleAddStock = async () => {
    if (!selectedProduct || stockToAdd <= 0) return;
    setAddingStock(true);
    try {
      await apiPost("/finance/pos/inventory/add", {
        catalogItemId: selectedProduct.id,
        quantityToAdd: stockToAdd,
      });
      setSelectedProduct(null);
      toast.success("Estoque atualizado.");
      fetchInventory();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Erro ao adicionar estoque.",
      );
    } finally {
      setAddingStock(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-600 font-semibold mb-1.5">
            Controle
          </p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Estoque &amp; Produtos
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Gerencie produtos físicos disponíveis no PDV.
          </p>
        </div>
        <Button
          onClick={() => setIsNewProductModalOpen(true)}
          className="h-9 px-4 rounded-xl text-sm font-semibold bg-white text-black hover:bg-zinc-100 shadow-[0_0_20px_rgba(255,255,255,0.15)] shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Novo Produto
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard
          growingman={<Package className="w-4 h-4 text-white" />}
          label="Produtos"
          value={String(summary.total)}
          loading={loading}
        />
        <SummaryCard
          growingman={<Boxes className="w-4 h-4 text-emerald-400" />}
          label="Unidades"
          value={String(summary.units)}
          loading={loading}
        />
        <SummaryCard
          growingman={<AlertTriangle className="w-4 h-4 text-red-400" />}
          label="Estoque baixo"
          value={String(summary.low)}
          loading={loading}
        />
      </div>

      {/* Busca */}
      <div className="relative sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
        <input
          type="text"
          placeholder="Buscar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 bg-white/[0.02] border border-white/10 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/25"
        />
      </div>

      <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="divide-y divide-white/[0.04]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-6 py-4 animate-pulse"
              >
                <div className="w-8 h-8 rounded bg-white/[0.04]" />
                <div className="flex-1 h-3.5 w-40 bg-white/[0.05] rounded" />
                <div className="h-6 w-24 bg-white/[0.04] rounded" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <Package className="w-5 h-5 text-neutral-600" />
            </div>
            <p className="text-neutral-500 text-sm">
              Nenhum produto cadastrado no momento.
            </p>
            <Button
              onClick={() => setIsNewProductModalOpen(true)}
              className="mt-4 h-9 px-4 rounded-xl text-sm bg-white text-black hover:bg-zinc-100"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Criar primeiro produto
            </Button>
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="py-16 text-center text-neutral-500 text-sm">
            Nenhum produto encontrado com esse termo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[560px]">
              <thead className="bg-white/[0.02] border-b border-white/[0.06] text-xs uppercase text-neutral-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Produto</th>
                  <th className="px-6 py-4 font-semibold">Preço Base</th>
                  <th className="px-6 py-4 font-semibold">Qtd em Estoque</th>
                  <th className="px-6 py-4 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {visibleProducts.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-neutral-400" />
                        </div>
                        {p.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-300">
                      {formatCurrency(Number(p.base_price))}
                    </td>
                    <td className="px-6 py-4">
                      {p.stock_quantity <= LOW_STOCK_THRESHOLD ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                          <AlertTriangle className="w-3.5 h-3.5" />{" "}
                          {p.stock_quantity} (Baixo)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {p.stock_quantity} disponíveis
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        onClick={() => {
                          setSelectedProduct(p);
                          setStockToAdd(1);
                        }}
                        variant="outline"
                        size="sm"
                        className="h-8 border-white/10 hover:bg-white/10 text-xs"
                      >
                        <PlusCircle className="w-3.5 h-3.5 mr-1" /> Entrada
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL NOVO PRODUTO */}
      <Modal
        open={isNewProductModalOpen}
        onClose={() => setIsNewProductModalOpen(false)}
        title="Novo Produto (Físico)"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-400 mb-1">
              Nome do Produto
            </label>
            <input
              type="text"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
              placeholder="Ex: Pomada Efeito Matte"
              className="w-full h-10 px-3 bg-white/[0.02] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/25"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-1">
                Preço (R$)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={currencyInputValue(newProduct.basePrice)}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    basePrice: parseCurrencyInput(e.target.value),
                  })
                }
                className="w-full h-10 px-3 bg-white/[0.02] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/25"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1">
                Estoque Inicial
              </label>
              <input
                type="number"
                min={0}
                value={newProduct.stock}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    stock: Math.max(0, Number(e.target.value)),
                  })
                }
                className="w-full h-10 px-3 bg-white/[0.02] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/25"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => setIsNewProductModalOpen(false)}
              variant="outline"
              className="flex-1 rounded-xl"
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateProduct}
              disabled={creating}
              className="flex-1 rounded-xl bg-white text-black hover:bg-zinc-200"
            >
              {creating ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL ADICIONAR ESTOQUE */}
      <Modal
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title="Entrada de Estoque"
        description={selectedProduct?.name}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-400 mb-1">
              Qtd para Adicionar
            </label>
            <input
              type="number"
              min={1}
              value={stockToAdd}
              onChange={(e) =>
                setStockToAdd(Math.max(1, Number(e.target.value)))
              }
              className="w-full h-10 px-3 bg-white/[0.02] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/25"
            />
            {selectedProduct && (
              <p className="text-xs text-neutral-600 mt-1.5">
                Novo total:{" "}
                <span className="text-neutral-300 font-semibold">
                  {selectedProduct.stock_quantity + stockToAdd}
                </span>{" "}
                unidades.
              </p>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => setSelectedProduct(null)}
              variant="outline"
              className="flex-1 rounded-xl"
              disabled={addingStock}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddStock}
              disabled={addingStock}
              className="flex-1 rounded-xl bg-emerald-500 text-black hover:bg-emerald-400"
            >
              {addingStock ? "Confirmando..." : `Confirmar (+${stockToAdd})`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SummaryCard({
  growingman,
  label,
  value,
  loading,
}: {
  growingman: React.ReactNode;
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center gap-2 text-neutral-400 mb-2">
        {growingman}
        <span className="text-xs font-semibold">{label}</span>
      </div>
      {loading ? (
        <div className="h-7 w-12 bg-white/[0.05] rounded animate-pulse" />
      ) : (
        <p className="text-2xl font-black">{value}</p>
      )}
    </div>
  );
}
