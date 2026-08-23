import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/** India transfers are the one amount in the app tracked in INR, not USD. */
export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMiles(miles: number) {
  return `${new Intl.NumberFormat("en-US").format(Math.round(miles))} mi`;
}

// Every stored date here is a calendar day with no meaningful time component, serialized as
// UTC midnight ("...T00:00:00.000Z"). Parsing that with `new Date()` and formatting in the
// viewer's local timezone shifts it back a day for anyone west of UTC — so pull the Y/M/D
// straight out of the string instead of letting the Date constructor reinterpret it.
export function formatDate(date: string | Date) {
  const iso = typeof date === "string" ? date : date.toISOString();
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function toDateInputValue(date: string | Date) {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

// A stored calendar-day date has no real time component (see formatDate above) — reinterpreting
// it through toDateInputValue's local-timezone shift rolls it back a day for anyone west of UTC.
// Use this instead whenever prefilling a date <input> from an already-stored value (e.g. editing
// an existing record); reserve toDateInputValue() itself for a genuine moment like `new Date()`.
export function toStoredDateInputValue(date: string) {
  return date.slice(0, 10);
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function monthLabel(year: number, month: number) {
  return `${MONTH_NAMES[month]} ${year}`;
}

export function shortMonthLabel(year: number, month: number) {
  return `${MONTH_NAMES[month].slice(0, 3)} '${String(year).slice(2)}`;
}

/** Transaction dates are stored as UTC midnight, so bucket months in UTC too. */
export function monthRange(year: number, month: number) {
  return {
    start: new Date(Date.UTC(year, month, 1)),
    end: new Date(Date.UTC(year, month + 1, 1)),
  };
}

