import type { ChangeRequest } from "./mockData";
import { getFiscalYearForDate } from "./fiscalYear";

/** Compact display ID; internal request IDs and routes remain unchanged. */
export function formatRequestNumber(cr: ChangeRequest, requests: ChangeRequest[]): string {
  if (cr.requestNumber) return cr.requestNumber;
  const year = getFiscalYearForDate(cr.date);
  const yearlyRequests = requests
    .filter(request => getFiscalYearForDate(request.date) === year)
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  const sequence = yearlyRequests.findIndex(request => request.id === cr.id) + 1;
  return `FR-FY${String(year % 100).padStart(2, "0")}-${String(sequence).padStart(2, "0")}`;
}