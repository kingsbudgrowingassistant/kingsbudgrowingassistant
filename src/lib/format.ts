// ---------------------------------------------------------------------------
// Formatting helpers — currency, numbers, dates.
// ---------------------------------------------------------------------------

export function formatCurrency(value: number, currency = "ZAR") {
  if (!isFinite(value)) value = 0;
  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function formatNumber(value: number, digits = 0) {
  if (!isFinite(value)) value = 0;
  return new Intl.NumberFormat("en-ZA", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function formatGrams(value: number) {
  if (value >= 1000) {
    return `${formatNumber(value / 1000, 2)} kg`;
  }
  return `${formatNumber(value, 0)} g`;
}

export function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatMonthLabel(monthKey: string) {
  // monthKey format: "YYYY-MM"
  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) return monthKey;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("en-ZA", { month: "short", year: "2-digit" });
}

export function formatPercent(value: number, digits = 1) {
  if (!isFinite(value)) value = 0;
  return value.toFixed(digits);
}

export function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

export function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
