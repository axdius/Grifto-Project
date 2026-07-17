export interface MoneyLike {
  amountMinor: number;
  currency: string;
}

/** Formats minor units as a localized currency string: 4599900 → "₹45,999". */
export function formatMoney(money: MoneyLike, options: { showDecimals?: boolean } = {}): string {
  const major = money.amountMinor / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: money.currency,
    maximumFractionDigits: options.showDecimals ? 2 : 0,
    minimumFractionDigits: options.showDecimals ? 2 : 0,
  }).format(major);
}

/** Parses a user-entered rupee amount ("45,999.50") into minor units, or null. */
export function parseMoneyInput(input: string): number | null {
  const cleaned = input.replace(/[₹,\s]/g, "");
  if (!cleaned || !/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(parseFloat(cleaned) * 100);
}
