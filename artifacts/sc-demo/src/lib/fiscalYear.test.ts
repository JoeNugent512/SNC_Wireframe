import assert from "node:assert/strict";
import { test } from "node:test";
import { getFiscalPeriod, getFiscalQuarters, getFiscalYearForDate, getDaysUntilFiscalQuarterEnd } from "./fiscalYear";
import { formatRequestNumber } from "./requestNumber";
import { MOCK_CHANGE_REQUESTS, type ChangeRequest } from "./mockData";

test("FY27 starts at midnight October 1 in America/Chicago, not UTC midnight", () => {
  const before = getFiscalPeriod(new Date("2026-10-01T04:59:59Z"));
  const after = getFiscalPeriod(new Date("2026-10-01T05:00:00Z"));
  assert.equal(before.label, "FY26");
  assert.equal(before.quarter, 4);
  assert.equal(before.today.toISOString().slice(0, 10), "2026-09-30");
  assert.equal(after.label, "FY27");
  assert.equal(after.shortYear, 27);
  assert.equal(after.quarter, 1);
  assert.equal(after.today.toISOString().slice(0, 10), "2026-10-01");
});

test("all months follow federal fiscal quarters and their ending year", () => {
  const expected = [2, 2, 2, 3, 3, 3, 4, 4, 4, 1, 1, 1];
  for (let month = 1; month <= 12; month++) {
    const period = getFiscalPeriod(new Date(`2026-${String(month).padStart(2, "0")}-15T12:00:00Z`));
    assert.equal(period.quarter, expected[month - 1]);
    assert.equal(period.year, month >= 10 ? 2027 : 2026);
  }
  assert.equal(getFiscalYearForDate("2026-09-30"), 2026);
  assert.equal(getFiscalYearForDate("2026-10-01"), 2027);
  assert.equal(getFiscalYearForDate("2027-09-30"), 2027);
  assert.equal(getFiscalYearForDate("2027-10-01"), 2028);
});

test("FY27 quarter dates cover Oct 2026 through Sep 2027 including the full final day", () => {
  const quarters = getFiscalQuarters(2027);
  assert.deepEqual(quarters.map(q => q.start.toISOString().slice(0, 10)),
    ["2026-10-01", "2027-01-01", "2027-04-01", "2027-07-01"]);
  assert.deepEqual(quarters.map(q => q.end.toISOString()),
    ["2026-12-31T23:59:59.999Z", "2027-03-31T23:59:59.999Z", "2027-06-30T23:59:59.999Z", "2027-09-30T23:59:59.999Z"]);
  quarters.slice(1).forEach((q, i) => assert.equal(q.start.getTime() - quarters[i].end.getTime(), 1));
});

test("request numbers group Oct–Dec and Jan–Sep in the same fiscal year", () => {
  const fixture = MOCK_CHANGE_REQUESTS[0];
  const requests: ChangeRequest[] = [
    { ...fixture, id: "201", date: "2026-09-30" },
    { ...fixture, id: "202", date: "2026-10-01" },
    { ...fixture, id: "203", date: "2027-01-15" },
    { ...fixture, id: "204", date: "2027-10-01" },
  ];
  assert.deepEqual(requests.map(cr => formatRequestNumber(cr, requests)),
    ["FR-FY26-01", "FR-FY27-01", "FR-FY27-02", "FR-FY28-01"]);
});

test("near-quarter-end window includes the exact 30-day threshold and the last day", () => {
  assert.equal(getDaysUntilFiscalQuarterEnd(getFiscalPeriod(new Date("2026-10-01T12:00:00Z"))), 91);
  assert.equal(getDaysUntilFiscalQuarterEnd(getFiscalPeriod(new Date("2026-12-01T12:00:00Z"))), 30);
  assert.equal(getDaysUntilFiscalQuarterEnd(getFiscalPeriod(new Date("2026-12-31T12:00:00Z"))), 0);
  assert.equal(getDaysUntilFiscalQuarterEnd(getFiscalPeriod(new Date("2027-09-30T12:00:00Z"))), 0);
});

test("historical demo requests and explicit existing request numbers remain unchanged", () => {
  assert.deepEqual(MOCK_CHANGE_REQUESTS.filter(cr => cr.date.startsWith("2024")).map(cr => formatRequestNumber(cr, MOCK_CHANGE_REQUESTS)),
    ["FR-FY24-01", "FR-FY24-02", "FR-FY24-03", "FR-FY24-04", "FR-FY24-05"]);
  const existing = { ...MOCK_CHANGE_REQUESTS[0], requestNumber: "KEEP-EXISTING-ID" };
  assert.equal(formatRequestNumber(existing, [existing]), "KEEP-EXISTING-ID");
});