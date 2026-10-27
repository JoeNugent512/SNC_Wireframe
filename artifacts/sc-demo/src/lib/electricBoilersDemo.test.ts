import assert from "node:assert/strict";
import { test } from "node:test";
import { BOILER_FUNDING, BOILER_PROJECT, BOILER_SETUP, BOILER_REQUEST } from "./electricBoilersDemo";
import { MOCK_PROJECTS, MOCK_CHANGE_REQUESTS, PENDING_SETUP_PROJECTS } from "./mockData";
import { fundingTotal, splitMoney } from "./projectFunding";

test("25T47 is in the existing setup queue and project/request collections", () => {
  assert(PENDING_SETUP_PROJECTS.some(project => project.number === "25T47"));
  assert(MOCK_PROJECTS.some(project => project.id === BOILER_SETUP.linkedProjectId));
  assert(MOCK_CHANGE_REQUESTS.some(request => request.id === BOILER_REQUEST.id));
  for (const field of ["dwgCoP", "hqProponent", "executingOrg", "projectLead", "needsContractSupport"] as const) {
    assert(BOILER_SETUP[field].trim(), `Missing required charter field ${field}`);
  }
  assert.equal(BOILER_PROJECT.projectLead, BOILER_REQUEST.submittedBy);
});

test("funding amounts preserve the EPMP annual totals and exact charter obligation", () => {
  assert.equal(BOILER_PROJECT.budget, 30000);
  assert.deepEqual(BOILER_FUNDING.years.map(fy => fundingTotal(BOILER_FUNDING, fy, "plan")), [5108, 13232, 11660, 0, 0]);
  assert.deepEqual(BOILER_FUNDING.years.map(fy => fundingTotal(BOILER_FUNDING, fy, "obligated")), [5108, 13182.98, 0, 0, 0]);
  assert.equal(Math.round(BOILER_FUNDING.years.reduce((sum, fy) => sum + fundingTotal(BOILER_FUNDING, fy, "obligated"), 0) * 100), 1829098);
  for (const fy of BOILER_FUNDING.years) {
    assert.equal(Math.round(BOILER_FUNDING.resources.reduce((sum, person) => sum + (person.annualObligations[fy] ?? 0), 0) * 100), Math.round(fundingTotal(BOILER_FUNDING, fy, "obligated") * 100));
    assert.equal(fundingTotal(BOILER_FUNDING, fy, "plan"), Object.values(BOILER_FUNDING.quarterly[fy].Labor).reduce((sum, amount) => sum + (amount ?? 0), 0));
    assert.equal(fundingTotal(BOILER_FUNDING, fy, "committed"), 0);
  }
});

test("schedule retains actual 98% progress independently of 100% charter completeness", () => {
  assert.equal(BOILER_PROJECT.schedule?.percentComplete, 98);
  assert.equal(BOILER_PROJECT.schedule?.status, "Final to DWG");
  assert.equal(BOILER_PROJECT.schedule?.milestones.length, 6);
  assert(BOILER_PROJECT.schedule?.milestones.every(m => m.planned || m.actual));
  assert(BOILER_PROJECT.schedule?.milestones.filter(m => m.required).every(m => m.planned));
  assert.equal(BOILER_PROJECT.schedule?.milestones.find(m => m.key === "rev35")?.actual, "2025-04-07");
  assert.equal(BOILER_PROJECT.schedule?.milestones.find(m => m.key === "final_dwg")?.actual, "2026-09-21");
  assert.equal(BOILER_PROJECT.schedule?.milestones.find(m => m.key === "complete")?.actual, "");
});

test("pending FY27 Q1 request funds Gunn and Phillips without fabricating obligations", () => {
  assert.equal(BOILER_REQUEST.status, "Pending Approval");
  assert.equal(BOILER_REQUEST.requestFY, "FY27");
  assert.equal(BOILER_REQUEST.requestQuarter, "Q1");
  assert.deepEqual(BOILER_REQUEST.lineItems.map(item => item.resource), ["Gunn, Charles", "Phillips, Jonah"]);
  assert.equal(BOILER_REQUEST.lineItems.reduce((sum, item) => sum + item.amount, 0), 2915);
  for (const item of BOILER_REQUEST.lineItems) {
    assert.equal(item.amount, 1457.5);
    assert.equal(item.from, 0);
    assert.equal(item.to, item.amount);
    assert.match(item.laborCode ?? "", /^\d{6}$/);
    assert.notEqual(item.laborCode, item.orgCode);
  }
  assert.equal(fundingTotal(BOILER_FUNDING, "FY27", "obligated"), 0);
  assert.deepEqual(splitMoney(13182.98, 4), [3295.75, 3295.75, 3295.74, 3295.74]);
});

test("demo labor codes use six numeric digits independently of organization codes", () => {
  for (const request of MOCK_CHANGE_REQUESTS) {
    for (const item of request.lineItems.filter(item => item.laborCode)) {
      assert.match(item.laborCode!, /^\d{6}$/);
      assert.notEqual(item.laborCode, item.orgCode);
    }
  }
});
