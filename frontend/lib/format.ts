const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export const formatMoney = (value: number) => usd.format(value);

export const formatPrice = (value: number) => value.toFixed(2);

export const formatPercent = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

export const formatSigned = (value: number) => `${value >= 0 ? "+" : "-"}${usd.format(Math.abs(value))}`;

export const formatQty = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/0+$/, "");

export const toneClass = (value: number) =>
  value > 0 ? "text-up" : value < 0 ? "text-down" : "text-muted";
