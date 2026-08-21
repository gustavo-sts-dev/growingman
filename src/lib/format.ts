/**
 * Helpers de formatação centralizados (pt-BR).
 * Evita reimplementar Intl.NumberFormat/Date em cada página.
 */

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Formata um número (ou string numérica) como moeda BRL. */
export function formatCurrency(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  return BRL.format(Number.isFinite(n) ? (n as number) : 0);
}

/** Formata minutos como "1h 30min" / "45min". */
export function formatDuration(minutes: number | null | undefined): string {
  const m = minutes ?? 0;
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${h}h` : `${h}h ${rest}min`;
}

/** Converte um input de moeda (string com dígitos) em número. Ex: "1234" -> 12.34 */
export function parseCurrencyInput(raw: string): number {
  const digits = raw.replace(/\D/g, "");
  return Number(digits) / 100;
}

/** Mostra um número como input de moeda editável (sem símbolo). Ex: 12.34 -> "12,34" */
export function currencyInputValue(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Formata uma data ISO como dd/mm/yyyy. */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

/** Formata data + hora curto: dd/mm HH:mm */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Remove tudo que não for dígito. Útil para máscaras e validações. */
export function onlyDigits(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

/**
 * Aplica máscara de telefone BR conforme o usuário digita.
 *   10 dígitos  → (11) 9999-9999   (fixo)
 *   11 dígitos  → (11) 99999-9999  (celular)
 * Aceita entrada parcial e nunca ultrapassa 11 dígitos.
 */
export function formatPhone(value: string | null | undefined): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Valida telefone BR: exige 10 (fixo) ou 11 (celular) dígitos. */
export function isValidPhone(value: string | null | undefined): boolean {
  const len = onlyDigits(value).length;
  return len === 10 || len === 11;
}

/** Aplica máscara de CPF conforme o usuário digita: 000.000.000-00. */
export function formatCpf(value: string | null | undefined): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/**
 * Valida CPF com dígito verificador real (não só o comprimento).
 * Rejeita sequências repetidas (000..., 111...) e checa os dois dígitos.
 */
export function isValidCpf(value: string | null | undefined): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11) return false;
  // Sequências como 00000000000, 11111111111 têm DV válido mas são inválidas.
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digits = cpf.split("").map(Number);

  const calcCheckDigit = (length: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += digits[i] * (length + 1 - i);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return calcCheckDigit(9) === digits[9] && calcCheckDigit(10) === digits[10];
}

/**
 * Data no fuso da barbearia (America/Sao_Paulo), no formato AAAA-MM-DD que o
 * `<input type="date">` espera. `offsetDays` desloca em dias de calendário.
 *
 * Existe porque `new Date().toISOString()` devolve UTC: depois das 21h no
 * Brasil ele já virou o dia seguinte, e o seletor passava a recusar o próprio
 * dia de hoje. O backend decide a janela de agendamento em America/Sao_Paulo,
 * então o seletor precisa usar o mesmo referencial — senão oferece uma data que
 * a API vai rejeitar (ou esconde uma que ela aceitaria).
 *
 * `en-CA` é usado só porque formata como AAAA-MM-DD; o fuso é o que importa.
 */
export function brazilianDateInput(offsetDays = 0): string {
  const alvo = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(alvo);
}
