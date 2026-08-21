"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import {
  formatCurrency,
  parseCurrencyInput,
  currencyInputValue,
} from "@/lib/format";
import {
  DollarSign,
  Lock,
  Unlock,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Wallet,
  Minus,
  Plus,
  Search,
  PackageX,
  Trash2,
} from "lucide-react";

type TabKey = "overview" | "pdv" | "caixa" | "comissoes";
type TxType = "INCOME" | "EXPENSE" | "ADVANCE" | "COMMISSION_PAYMENT";

interface Dashboard {
  todayIncome: number;
  todayExpenses: number;
  todayAdvances: number;
  todayCommissionsPaid: number;
  netProfit: number;
  cashRegisterOpen: boolean;
  cashRegisterBalance: number;
  pendingCommissionsTotal: number;
}

interface CashRegister {
  id: string;
  opening_balance: string | number;
  currentBalance: number;
}

interface Transaction {
  id: string;
  type: TxType;
  amount: string | number;
  payment_method: string;
  description: string | null;
}

interface Commission {
  id: string;
  name: string;
  commissionsAccrued: number;
  totalAdvancesTaken: number;
  totalCommissionsPaid: number;
  currentBalanceDue: number;
}

interface Product {
  id: string;
  name: string;
  base_price: string | number;
  stock_quantity: number;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Visão Geral" },
  { key: "pdv", label: "Frente de Caixa (PDV)" },
  { key: "caixa", label: "Caixa Diário" },
  { key: "comissoes", label: "Comissões & Vales" },
];

const TX_LABEL: Record<TxType, string> = {
  INCOME: "Entrada",
  EXPENSE: "Despesa",
  ADVANCE: "Vale",
  COMMISSION_PAYMENT: "Comissão",
};

const NEGATIVE_TYPES: TxType[] = ["EXPENSE", "ADVANCE", "COMMISSION_PAYMENT"];

export default function FinanceiroPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  // Modais
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [cashAction, setCashAction] = useState<"OPEN" | "CLOSE">("OPEN");
  const [cashAmount, setCashAmount] = useState(0);
  const [cashSaving, setCashSaving] = useState(false);

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txSaving, setTxSaving] = useState(false);
  // id do lançamento sendo apagado — trava só a linha dele, não a tabela.
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [txData, setTxData] = useState<{
    type: TxType;
    amount: number;
    description: string;
    paymentMethod: string;
    barberProfileId: string;
  }>({
    type: "EXPENSE",
    amount: 0,
    description: "",
    paymentMethod: "CASH",
    barberProfileId: "",
  });

  // PDV
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>(
    [],
  );
  const [posPaymentMethod, setPosPaymentMethod] = useState("CASH");
  const [posLoading, setPosLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [hideOutOfStock, setHideOutOfStock] = useState(false);

  // Quantidade de cada produto já no carrinho (para badge no catálogo).
  const cartQtyById = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of cart) map[c.product.id] = c.quantity;
    return map;
  }, [cart]);

  // Catálogo filtrado por busca e disponibilidade.
  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch = !term || p.name.toLowerCase().includes(term);
      const matchesStock = !hideOutOfStock || p.stock_quantity > 0;
      return matchesSearch && matchesStock;
    });
  }, [products, productSearch, hideOutOfStock]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const [dash, cash, tx, comm, inv] = await Promise.all([
          apiGet<Dashboard>("/finance/dashboard").catch(() => null),
          apiGet<{ current: CashRegister | null }>(
            "/finance/cash-register",
          ).catch(() => ({ current: null })),
          apiGet<Transaction[]>("/finance/transactions").catch(() => []),
          apiGet<Commission[]>("/finance/commissions").catch(() => []),
          apiGet<{ products?: Product[] }>("/finance/pos/inventory").catch(
            () => ({ products: [] }),
          ),
        ]);
        if (cancelled) return;
        setDashboard(dash);
        setCashRegister(cash?.current ?? null);
        setTransactions(Array.isArray(tx) ? tx : []);
        setCommissions(Array.isArray(comm) ? comm : []);
        setProducts(inv?.products ?? []);
      } catch {
        if (!cancelled) toast.error("Falha ao carregar dados financeiros.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const handleCashRegister = async () => {
    setCashSaving(true);
    try {
      if (cashAction === "OPEN") {
        await apiPost("/finance/cash-register/open", {
          openingBalance: cashAmount,
        });
        toast.success("Caixa aberto com sucesso.");
      } else {
        await apiPost("/finance/cash-register/close", {
          closingBalance: cashAmount,
        });
        toast.success("Caixa fechado com sucesso.");
      }
      setIsCashModalOpen(false);
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao operar o caixa.");
    } finally {
      setCashSaving(false);
    }
  };

  const handleTransaction = async () => {
    if (txData.amount <= 0) {
      toast.error("Informe um valor maior que zero.");
      return;
    }
    setTxSaving(true);
    try {
      await apiPost("/finance/transactions", {
        ...txData,
        barberProfileId: txData.barberProfileId || undefined,
      });
      toast.success("Lançamento registrado.");
      setIsTxModalOpen(false);
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao lançar transação.");
    } finally {
      setTxSaving(false);
    }
  };

  /**
   * Apaga um lançamento do caixa. O backend é quem decide se pode: recusa
   * lançamento de caixa já fechado e pagamento de comissão, e a mensagem dele
   * explica o motivo — por isso o catch mostra `e.message` em vez de um texto
   * genérico.
   */
  const handleDeleteTransaction = async (tx: Transaction) => {
    const rotulo = tx.description || "este lançamento";
    if (!confirm(`Apagar "${rotulo}"? O valor sai do caixa e não há como desfazer.`)) {
      return;
    }

    setDeletingTxId(tx.id);
    try {
      await apiDelete(`/finance/transactions/${tx.id}`);
      toast.success("Lançamento apagado.");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao apagar lançamento.");
    } finally {
      setDeletingTxId(null);
    }
  };

  // ===== PDV =====
  const addToCart = (product: Product) => {
    if (product.stock_quantity < 1) {
      toast.error("Produto sem estoque.");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((p) => p.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          toast.error("Estoque insuficiente.");
          return prev;
        }
        return prev.map((p) =>
          p.product.id === product.id ? { ...p, quantity: p.quantity + 1 } : p,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const changeQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((p) => {
          if (p.product.id !== productId) return p;
          const next = p.quantity + delta;
          if (next > p.product.stock_quantity) {
            toast.error("Estoque insuficiente.");
            return p;
          }
          return { ...p, quantity: next };
        })
        .filter((p) => p.quantity > 0),
    );
  };

  const cartTotal = cart.reduce(
    (sum, c) => sum + Number(c.product.base_price) * c.quantity,
    0,
  );

  const processPosSale = async () => {
    if (cart.length === 0) return;
    setPosLoading(true);
    try {
      const items = cart.map((c) => ({
        catalog_item_id: c.product.id,
        quantity: c.quantity,
      }));
      await apiPost("/finance/pos/sale", {
        items,
        paymentMethod: posPaymentMethod,
        notes: "Venda Rápida",
      });
      toast.success("Venda realizada com sucesso!");
      setCart([]);
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao realizar venda.");
    } finally {
      setPosLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-neutral-600 font-semibold mb-1.5">
          Gestão Financeira
        </p>
        <h1 className="text-3xl font-black tracking-tight">
          Financeiro &amp; PDV
        </h1>
        <p className="text-neutral-500 text-sm mt-1">
          Acompanhe seu fluxo de caixa, vales e lucro líquido.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.08] overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.key
                ? "border-white text-white"
                : "border-transparent text-neutral-500 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] animate-pulse h-24"
            />
          ))}
        </div>
      ) : (
        <>
          {/* TAB: OVERVIEW */}
          {activeTab === "overview" && dashboard && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard
                  growingman={<TrendingUp className="w-4 h-4 text-green-400" />}
                  label="Entradas (Hoje)"
                  value={formatCurrency(dashboard.todayIncome)}
                />
                <MetricCard
                  growingman={<TrendingDown className="w-4 h-4 text-red-400" />}
                  label="Despesas (Hoje)"
                  value={formatCurrency(dashboard.todayExpenses)}
                />
                <MetricCard
                  growingman={<Users className="w-4 h-4 text-amber-400" />}
                  label="Vales (Hoje)"
                  value={formatCurrency(dashboard.todayAdvances)}
                />
                <MetricCard
                  growingman={<DollarSign className="w-4 h-4 text-white" />}
                  label="Lucro Líquido"
                  value={formatCurrency(dashboard.netProfit)}
                  highlight
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold">
                      Saldo em Caixa
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">
                      {formatCurrency(dashboard.cashRegisterBalance)}
                    </p>
                    <p
                      className={`text-[11px] font-semibold ${dashboard.cashRegisterOpen ? "text-green-400" : "text-neutral-500"}`}
                    >
                      {dashboard.cashRegisterOpen
                        ? "Caixa aberto"
                        : "Caixa fechado"}
                    </p>
                  </div>
                </div>
                <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-semibold">
                      Comissões a Pagar
                    </span>
                  </div>
                  <p className="text-xl font-bold text-amber-400">
                    {formatCurrency(dashboard.pendingCommissionsTotal)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PDV */}
          {activeTab === "pdv" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h3 className="font-bold text-lg">Catálogo Rápido</h3>
                  <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hideOutOfStock}
                      onChange={(e) => setHideOutOfStock(e.target.checked)}
                      className="w-3.5 h-3.5 accent-white"
                    />
                    Ocultar sem estoque
                  </label>
                </div>

                {/* Busca de produtos */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Buscar produto..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 bg-white/[0.02] border border-white/10 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/25"
                  />
                </div>

                {products.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 border border-dashed border-white/10 rounded-2xl">
                    Nenhum produto cadastrado.
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 border border-dashed border-white/10 rounded-2xl flex flex-col items-center gap-2">
                    <PackageX className="w-6 h-6 opacity-40" />
                    Nenhum produto encontrado.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredProducts.map((p) => {
                      const inCart = cartQtyById[p.id] ?? 0;
                      return (
                        <button
                          key={p.id}
                          onClick={() => addToCart(p)}
                          disabled={p.stock_quantity < 1}
                          className={`relative text-left p-4 rounded-xl border transition-colors ${
                            p.stock_quantity > 0
                              ? "border-white/[0.06] bg-white/[0.02] hover:border-white/20 cursor-pointer"
                              : "border-red-500/20 bg-red-500/5 opacity-50 cursor-not-allowed"
                          } ${inCart > 0 ? "ring-1 ring-emerald-500/40" : ""}`}
                        >
                          {inCart > 0 && (
                            <span className="absolute top-2 right-2 min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full bg-emerald-500 text-black text-[11px] font-bold">
                              {inCart}
                            </span>
                          )}
                          <div className="font-bold text-sm mb-1 truncate pr-6">
                            {p.name}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-emerald-400 font-semibold">
                              {formatCurrency(p.base_price)}
                            </span>
                            <span
                              className={`text-xs ${p.stock_quantity < 1 ? "text-red-400" : "text-neutral-500"}`}
                            >
                              {p.stock_quantity < 1
                                ? "Sem estoque"
                                : `Estoque: ${p.stock_quantity}`}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Carrinho */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 flex flex-col h-[500px] lg:h-[calc(100vh-9rem)] lg:max-h-[640px] lg:sticky lg:top-20">
                <h3 className="font-bold text-lg mb-4 flex items-center justify-between">
                  <span>Carrinho</span>
                  <span className="bg-white/10 text-white text-xs px-2 py-1 rounded-md">
                    {cart.length} itens
                  </span>
                </h3>

                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-500 text-sm">
                      <FileText className="w-8 h-8 mb-2 opacity-20" />
                      Selecione produtos
                    </div>
                  ) : (
                    cart.map((c) => (
                      <div
                        key={c.product.id}
                        className="flex items-center justify-between bg-white/[0.03] p-3 rounded-lg border border-white/5"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-sm font-semibold truncate">
                            {c.product.name}
                          </p>
                          <p className="text-xs text-neutral-400">
                            {formatCurrency(c.product.base_price)} un.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => changeQty(c.product.id, -1)}
                            aria-label="Diminuir quantidade"
                            className="w-7 h-7 flex items-center justify-center rounded-md bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-5 text-center text-sm font-semibold text-white">
                            {c.quantity}
                          </span>
                          <button
                            onClick={() => changeQty(c.product.id, 1)}
                            aria-label="Aumentar quantidade"
                            className="w-7 h-7 flex items-center justify-center rounded-md bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-white/10 pt-4 mt-auto">
                  <div className="flex justify-between mb-4">
                    <span className="text-neutral-400">Total a pagar</span>
                    <span className="text-2xl font-black text-white">
                      {formatCurrency(cartTotal)}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <select
                      value={posPaymentMethod}
                      onChange={(e) => setPosPaymentMethod(e.target.value)}
                      className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/25 [&>option]:bg-zinc-900 [&>option]:text-white"
                    >
                      <option value="CASH">Dinheiro Físico</option>
                      <option value="PIX">PIX QR Code</option>
                      <option value="CREDIT_CARD">Maquininha (Crédito)</option>
                      <option value="DEBIT_CARD">Maquininha (Débito)</option>
                    </select>
                    {posPaymentMethod === "CASH" && !cashRegister ? (
                      <div className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 font-semibold text-sm">
                        <Lock className="w-4 h-4" />
                        Abra o caixa para vender em dinheiro
                      </div>
                    ) : (
                      <Button
                        onClick={processPosSale}
                        disabled={cart.length === 0 || posLoading}
                        className="w-full h-12 bg-white text-black font-bold hover:bg-zinc-200 disabled:opacity-50"
                      >
                        {posLoading ? "Processando..." : "Finalizar Venda"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CAIXA */}
          {activeTab === "caixa" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-6 rounded-2xl border border-white/[0.06] bg-gradient-to-r from-white/[0.02] to-transparent">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    {cashRegister ? (
                      <Unlock className="w-5 h-5 text-green-400" />
                    ) : (
                      <Lock className="w-5 h-5 text-neutral-500" />
                    )}
                    {cashRegister ? "Caixa Aberto" : "Caixa Fechado"}
                  </h3>
                  <p className="text-sm text-neutral-500 mt-1">
                    {cashRegister
                      ? `Saldo atual: ${formatCurrency(cashRegister.currentBalance)}`
                      : "Abra o caixa para aceitar pagamentos em dinheiro."}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setCashAction(cashRegister ? "CLOSE" : "OPEN");
                    setCashAmount(
                      cashRegister ? cashRegister.currentBalance : 0,
                    );
                    setIsCashModalOpen(true);
                  }}
                  className={`h-10 px-6 rounded-xl font-semibold ${
                    cashRegister
                      ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      : "bg-white text-black hover:bg-zinc-200"
                  }`}
                >
                  {cashRegister ? "Fechar Caixa" : "Abrir Caixa"}
                </Button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Lançamentos</h3>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setTxData({
                        type: "EXPENSE",
                        amount: 0,
                        description: "",
                        paymentMethod: "CASH",
                        barberProfileId: "",
                      });
                      setIsTxModalOpen(true);
                    }}
                    className="h-8 px-3 rounded-lg text-xs bg-white/10 text-white hover:bg-white/20"
                  >
                    + Novo Lançamento
                  </Button>
                </div>
                <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[560px]">
                      <thead className="bg-white/[0.02] border-b border-white/[0.06] text-xs uppercase text-neutral-500">
                        <tr>
                          <th className="px-5 py-3 font-semibold">Descrição</th>
                          <th className="px-5 py-3 font-semibold">Tipo</th>
                          <th className="px-5 py-3 font-semibold">Método</th>
                          <th className="px-5 py-3 font-semibold text-right">
                            Valor
                          </th>
                          <th className="px-5 py-3 font-semibold w-px">
                            <span className="sr-only">Ações</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {transactions.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-5 py-8 text-center text-neutral-600"
                            >
                              Nenhum lançamento ainda.
                            </td>
                          </tr>
                        ) : (
                          transactions.map((tx) => {
                            const isNeg = NEGATIVE_TYPES.includes(tx.type);
                            return (
                              <tr
                                key={tx.id}
                                className="hover:bg-white/[0.02]"
                              >
                                <td className="px-5 py-3 text-white">
                                  {tx.description || "-"}
                                </td>
                                <td className="px-5 py-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      tx.type === "INCOME"
                                        ? "bg-green-500/10 text-green-400"
                                        : tx.type === "EXPENSE"
                                          ? "bg-red-500/10 text-red-400"
                                          : tx.type === "ADVANCE"
                                            ? "bg-amber-500/10 text-amber-400"
                                            : "bg-blue-500/10 text-blue-400"
                                    }`}
                                  >
                                    {TX_LABEL[tx.type]}
                                  </span>
                                </td>
                                <td className="px-5 py-3 text-neutral-400 text-xs">
                                  {tx.payment_method}
                                </td>
                                <td
                                  className={`px-5 py-3 text-right font-bold ${isNeg ? "text-red-400" : "text-green-400"}`}
                                >
                                  {isNeg ? "-" : "+"}
                                  {formatCurrency(tx.amount)}
                                </td>
                                <td className="px-5 py-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTransaction(tx)}
                                    disabled={deletingTxId === tx.id}
                                    title="Apagar lançamento"
                                    aria-label={`Apagar lançamento ${tx.description || ""}`}
                                    className="p-1.5 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: COMISSOES */}
          {activeTab === "comissoes" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {commissions.length === 0 ? (
                <p className="text-neutral-500 text-sm">
                  Nenhum barbeiro cadastrado.
                </p>
              ) : (
                commissions.map((comm) => (
                  <div
                    key={comm.id}
                    className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]"
                  >
                    <h4 className="font-bold text-lg mb-4">{comm.name}</h4>
                    <div className="space-y-2 mb-4">
                      <Row
                        label="Comissões geradas"
                        value={formatCurrency(comm.commissionsAccrued)}
                        valueClass="text-neutral-300"
                      />
                      <Row
                        label="Vales (adiantado)"
                        value={formatCurrency(comm.totalAdvancesTaken)}
                        valueClass="text-amber-400"
                      />
                      <div className="flex justify-between text-sm pt-2 border-t border-white/[0.06]">
                        <span className="text-neutral-400 font-semibold">
                          A pagar
                        </span>
                        <span
                          className={`font-bold ${comm.currentBalanceDue > 0 ? "text-emerald-400" : "text-neutral-500"}`}
                        >
                          {formatCurrency(comm.currentBalanceDue)}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setTxData({
                            type: "ADVANCE",
                            amount: 0,
                            description: `Vale para ${comm.name}`,
                            paymentMethod: "CASH",
                            barberProfileId: comm.id,
                          });
                          setIsTxModalOpen(true);
                        }}
                        className="h-9 rounded-xl text-xs bg-white/10 text-white hover:bg-white/20"
                      >
                        Vale
                      </Button>
                      <Button
                        onClick={() => {
                          setTxData({
                            type: "COMMISSION_PAYMENT",
                            amount: comm.currentBalanceDue,
                            description: `Comissão de ${comm.name}`,
                            paymentMethod: "CASH",
                            barberProfileId: comm.id,
                          });
                          setIsTxModalOpen(true);
                        }}
                        disabled={comm.currentBalanceDue <= 0}
                        className="h-9 rounded-xl text-xs bg-white text-black hover:bg-zinc-200 disabled:opacity-40"
                      >
                        Pagar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Modal Caixa */}
      <Modal
        open={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
        title={cashAction === "OPEN" ? "Abrir Caixa" : "Fechar Caixa"}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-neutral-400 uppercase">
              {cashAction === "OPEN"
                ? "Troco Inicial (R$)"
                : "Saldo em Dinheiro (R$)"}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={currencyInputValue(cashAmount)}
              onChange={(e) =>
                setCashAmount(parseCurrencyInput(e.target.value))
              }
              className="w-full mt-1.5 h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-white/30 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => setIsCashModalOpen(false)}
              variant="outline"
              className="flex-1 h-10 rounded-xl"
              disabled={cashSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCashRegister}
              disabled={cashSaving}
              className="flex-1 h-10 rounded-xl bg-white text-black hover:bg-zinc-200"
            >
              {cashSaving ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Transação */}
      <Modal
        open={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        title="Novo Lançamento"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-neutral-400 uppercase">
              Tipo
            </label>
            <select
              value={txData.type}
              onChange={(e) =>
                setTxData({ ...txData, type: e.target.value as TxType })
              }
              className="w-full mt-1.5 h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none [&>option]:bg-zinc-900 [&>option]:text-white"
            >
              <option value="INCOME">Entrada (Suprimento)</option>
              <option value="EXPENSE">Saída (Despesa)</option>
              <option value="ADVANCE">Vale / Adiantamento</option>
              <option value="COMMISSION_PAYMENT">Pagamento de Comissão</option>
            </select>
          </div>

          {(txData.type === "ADVANCE" ||
            txData.type === "COMMISSION_PAYMENT") && (
            <div>
              <label className="text-xs font-semibold text-neutral-400 uppercase">
                Barbeiro
              </label>
              <select
                value={txData.barberProfileId}
                onChange={(e) =>
                  setTxData({ ...txData, barberProfileId: e.target.value })
                }
                className="w-full mt-1.5 h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none [&>option]:bg-zinc-900 [&>option]:text-white"
              >
                <option value="">Selecione...</option>
                {commissions.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                  >
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-400 uppercase">
                Valor (R$)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={currencyInputValue(txData.amount)}
                onChange={(e) =>
                  setTxData({
                    ...txData,
                    amount: parseCurrencyInput(e.target.value),
                  })
                }
                className="w-full mt-1.5 h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-400 uppercase">
                Método
              </label>
              <select
                value={txData.paymentMethod}
                onChange={(e) =>
                  setTxData({ ...txData, paymentMethod: e.target.value })
                }
                className="w-full mt-1.5 h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none [&>option]:bg-zinc-900 [&>option]:text-white"
              >
                <option value="CASH">Dinheiro Físico</option>
                <option value="PIX">PIX</option>
                <option value="CREDIT_CARD">Cartão</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-400 uppercase">
              Descrição
            </label>
            <input
              type="text"
              placeholder="Ex: Compra de café"
              value={txData.description}
              onChange={(e) =>
                setTxData({ ...txData, description: e.target.value })
              }
              className="w-full mt-1.5 h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => setIsTxModalOpen(false)}
              variant="outline"
              className="flex-1 h-10 rounded-xl"
              disabled={txSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleTransaction}
              disabled={txSaving}
              className="flex-1 h-10 rounded-xl bg-white text-black hover:bg-zinc-200"
            >
              {txSaving ? "Lançando..." : "Lançar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function MetricCard({
  growingman,
  label,
  value,
  highlight,
}: {
  growingman: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-5 rounded-2xl border border-white/[0.06] ${highlight ? "bg-white/[0.04]" : "bg-white/[0.02]"}`}
    >
      <div className="flex items-center gap-2 text-neutral-400 mb-2">
        {growingman}
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className={`text-2xl ${highlight ? "font-black" : "font-bold"}`}>
        {value}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-neutral-500">{label}</span>
      <span className={`font-semibold ${valueClass ?? ""}`}>{value}</span>
    </div>
  );
}
