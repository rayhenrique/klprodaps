const BUSINESS_TIMEZONE = "America/Fortaleza";
const BUSINESS_OFFSET = "-03:00";

export { BUSINESS_TIMEZONE };

export function getLocalTodayISO(now: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function getCompetenciaParams(searchMonth?: string, searchYear?: string) {
  const today = new Date();
  const defaultMonth = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: BUSINESS_TIMEZONE,
      month: "numeric",
    }).format(today),
  );
  const defaultYear = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: BUSINESS_TIMEZONE,
      year: "numeric",
    }).format(today),
  );

  const month = Number(searchMonth) || defaultMonth;
  const year = Number(searchYear) || defaultYear;

  return { month, year };
}

export function getMonthBounds(month: number, year: number) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonthStart = new Date(
    `${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00${BUSINESS_OFFSET}`,
  );
  nextMonthStart.setDate(nextMonthStart.getDate() - 1);
  const end = `${year}-${String(month).padStart(2, "0")}-${String(
    nextMonthStart.getDate(),
  ).padStart(2, "0")}`;

  return { start, end };
}

export function getMonthLabel(month: number, year: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: BUSINESS_TIMEZONE,
  }).format(new Date(`${year}-${String(month).padStart(2, "0")}-01T12:00:00${BUSINESS_OFFSET}`));
}

export function isWeekendDay(dateInput: string | Date) {
  const date =
    typeof dateInput === "string"
      ? new Date(`${dateInput}T12:00:00${BUSINESS_OFFSET}`)
      : dateInput;

  return [0, 6].includes(date.getDay());
}

export function monthOptions() {
  return Array.from({ length: 12 }, (_, index) => ({
    value: String(index + 1),
    label: new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      timeZone: BUSINESS_TIMEZONE,
    }).format(new Date(`2026-${String(index + 1).padStart(2, "0")}-01T12:00:00${BUSINESS_OFFSET}`)),
  }));
}

export function yearOptions(offset = 1) {
  const currentYear = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: BUSINESS_TIMEZONE,
      year: "numeric",
    }).format(new Date()),
  );

  return Array.from({ length: 3 + offset }, (_, index) => String(currentYear - offset + index));
}
