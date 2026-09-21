// Thai locale with the Gregorian calendar: Thai month names, but CE years so the
// figures line up with what the API stores.
const LOCALE = "th-TH-u-ca-gregory";

const currency = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "THB",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 0,
});

const currencyPrecise = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "THB",
  currencyDisplay: "narrowSymbol",
  minimumFractionDigits: 2,
});

export const formatTHB = (value: number) => currency.format(value);
export const formatTHBPrecise = (value: number) => currencyPrecise.format(value);

const dateFmt = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const dateTimeFmt = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

const timeFmt = new Intl.DateTimeFormat(LOCALE, {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

const weekdayFmt = new Intl.DateTimeFormat(LOCALE, {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const weekdayShortFmt = new Intl.DateTimeFormat(LOCALE, {
  weekday: "short",
  timeZone: "UTC",
});

export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso));
export const formatTime = (iso: string) => timeFmt.format(new Date(iso));
export const formatWeekday = (iso: string) => weekdayFmt.format(new Date(iso));
export const formatWeekdayShort = (iso: string) => weekdayShortFmt.format(new Date(iso));

/** yyyy-MM-dd in UTC, which is what the booking endpoints expect. */
export const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

export const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

export const startOfUtcDay = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

export function relativeFromNow(iso: string) {
  const target = new Date(iso).getTime();
  const diffMs = target - Date.now();
  const abs = Math.abs(diffMs);
  const minutes = Math.round(abs / 60000);

  if (minutes < 60) return diffMs >= 0 ? `อีก ${minutes} นาที` : `${minutes} นาทีที่แล้ว`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return diffMs >= 0 ? `อีก ${hours} ชม.` : `${hours} ชม. ที่แล้ว`;
  const days = Math.round(hours / 24);
  return diffMs >= 0 ? `อีก ${days} วัน` : `${days} วันที่แล้ว`;
}

export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export const DAY_LABELS = ["จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์", "อาทิตย์"];
