export const numberFormat = new Intl.NumberFormat("pt-BR");

const shortDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
const longDate = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

export function formatShortDate(isoDate: string) {
  return shortDate.format(new Date(`${isoDate}T00:00:00Z`));
}

export function formatLongDate(isoDate: string) {
  const text = longDate.format(new Date(`${isoDate}T00:00:00Z`));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatSigned(value: number) {
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${numberFormat.format(Math.abs(value))}`;
}
