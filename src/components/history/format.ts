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

const fullDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

/** "26/10/2026". */
export function formatFullDate(isoDate: string) {
  return fullDate.format(new Date(`${isoDate}T00:00:00Z`));
}

export function formatLongDate(isoDate: string) {
  const text = longDate.format(new Date(`${isoDate}T00:00:00Z`));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** "21/09/2026 às 22:14", no fuso do usuário. */
export function formatDateTime(iso: string) {
  return dateTime.format(new Date(iso)).replace(",", " às");
}

const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

/** "14:32", no fuso do usuário. */
export function formatTime(iso: string) {
  return time.format(new Date(iso));
}

export function formatSigned(value: number) {
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${numberFormat.format(Math.abs(value))}`;
}
