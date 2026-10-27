/** Federal fiscal years run October 1–September 30, named for their ending year. */
export function getFiscalPeriod(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const part = (type: string) => Number(parts.find(p => p.type === type)?.value);
  const calendarYear = part("year");
  const month = part("month");
  const year = calendarYear + (month >= 10 ? 1 : 0);
  return {
    year,
    shortYear: year % 100,
    label: `FY${String(year % 100).padStart(2, "0")}`,
    quarter: Math.floor(((month + 2) % 12) / 3) + 1,
    today: new Date(Date.UTC(calendarYear, month - 1, part("day"))),
  };
}

export function getFiscalQuarters(year: number) {
  return [
    { key: "Q1", label: "Q1", range: "Oct – Dec", start: new Date(Date.UTC(year - 1, 9, 1)), end: new Date(Date.UTC(year - 1, 11, 31, 23, 59, 59, 999)) },
    { key: "Q2", label: "Q2", range: "Jan – Mar", start: new Date(Date.UTC(year, 0, 1)), end: new Date(Date.UTC(year, 2, 31, 23, 59, 59, 999)) },
    { key: "Q3", label: "Q3", range: "Apr – Jun", start: new Date(Date.UTC(year, 3, 1)), end: new Date(Date.UTC(year, 5, 30, 23, 59, 59, 999)) },
    { key: "Q4", label: "Q4", range: "Jul – Sep", start: new Date(Date.UTC(year, 6, 1)), end: new Date(Date.UTC(year, 8, 30, 23, 59, 59, 999)) },
  ];
}

/** Date-only stored submission dates must not shift back a day in US time zones. */
export function getFiscalYearForDate(date: string) {
  return getFiscalPeriod(new Date(`${date.slice(0, 10)}T12:00:00Z`)).year;
}

export function getDaysUntilFiscalQuarterEnd(period = getFiscalPeriod()) {
  const end = getFiscalQuarters(period.year)[period.quarter - 1].end;
  return Math.max(0, Math.floor((end.getTime() - period.today.getTime()) / 86_400_000));
}

export const CURRENT_FISCAL_PERIOD = getFiscalPeriod();
export const CURRENT_FY = CURRENT_FISCAL_PERIOD.label;
export const CURRENT_FY_NUMBER = CURRENT_FISCAL_PERIOD.shortYear;
export const CURRENT_QUARTER = CURRENT_FISCAL_PERIOD.quarter;