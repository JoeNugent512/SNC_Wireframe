import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clampQuarterPlanToObligationFloor,
  getAllocatableQuarterBucket,
  getQuarterSyncReductionCapacity,
  syncQuarterPlanToAnnual,
  scopeDemoActualsToAnnualPlan,
  resolveAnnualPlanEdit,
} from "./planningFiscalMath.ts";

test("quarter edits cannot reduce an obligated amount", () => {
  assert.equal(clampQuarterPlanToObligationFloor(100, 240), 240);
  assert.equal(clampQuarterPlanToObligationFloor(100, 0), 100);
  assert.equal(clampQuarterPlanToObligationFloor(-10, 0), 0);
});

test("negative annual sync reduces only editable amounts above obligation floors", () => {
  const quarters = { Q1: 300, Q2: 100, Q3: 100, Q4: 100 };
  const floors = { Q1: 300, Q2: 40, Q3: 20, Q4: 0 };
  const editable = ["Q2", "Q3", "Q4"] as const;

  assert.equal(getQuarterSyncReductionCapacity(quarters, floors, editable), 240);
  const synced = syncQuarterPlanToAnnual(quarters, 450, floors, editable, "Q2");

  assert.deepEqual(synced, { Q1: 300, Q2: 40, Q3: 20, Q4: 90 });
  assert.equal(Object.values(synced).reduce((sum, amount) => sum + (amount ?? 0), 0), 450);
  assert.ok((synced.Q1 ?? 0) >= floors.Q1);
  assert.ok((synced.Q2 ?? 0) >= floors.Q2);
  assert.ok((synced.Q3 ?? 0) >= floors.Q3);
});

test("annual sync leaves quarterly obligation floors intact when reduction capacity is insufficient", () => {
  const quarters = { Q1: 300, Q2: 40, Q3: 20, Q4: 0 };
  const floors = { Q1: 300, Q2: 40, Q3: 20, Q4: 0 };
  const synced = syncQuarterPlanToAnnual(quarters, 100, floors, ["Q2", "Q3", "Q4"], "Q2");

  assert.deepEqual(synced, quarters);
  assert.equal(getQuarterSyncReductionCapacity(quarters, floors, ["Q2", "Q3", "Q4"]), 0);
});

test("allocatable buckets exclude obligations but remain conserved within open quarters", () => {
  const planned = { Q1: 300, Q2: 200, Q3: 100, Q4: 50 };
  const obligated = { Q1: 100, Q2: 50, Q3: 0, Q4: 0 };

  const allOpenBucket = getAllocatableQuarterBucket(planned, obligated, ["Q1", "Q2", "Q3", "Q4"]);
  assert.equal(allOpenBucket, 500);
  assert.equal(allOpenBucket + 150, 650);

  const remainingOpenBucket = getAllocatableQuarterBucket(planned, obligated, ["Q2", "Q3", "Q4"]);
  assert.equal(remainingOpenBucket, 300);
  assert.equal(remainingOpenBucket + 50, 350);
});

test("whole-project travel obligations cannot consume the entire current-FY demo plan", () => {
  const source = [{ committed: 58000, obligated: 30654 }];
  const annualPlan = 18000;
  const [travel] = scopeDemoActualsToAnnualPlan(source, annualPlan);
  const available = getAllocatableQuarterBucket({ Q1: annualPlan }, { Q1: travel.obligated }, ["Q1"]);
  assert(available > 0);
  assert(travel.obligated <= travel.committed);
  assert(travel.committed <= annualPlan);
  assert.equal(Math.round((available + travel.obligated) * 100), annualPlan * 100);
  assert.equal(source[0].obligated, 30654, "source lifetime data must not be mutated");
});

test("Coastal demo labor open commitments fit the current-FY allocation bucket", () => {
  const source = [
    { committed: 397800, obligated: 208260 },
    { committed: 334800, obligated: 174600 },
    { committed: 290880, obligated: 151200 },
    { committed: 208260, obligated: 108810 },
  ];
  const annualPlan = 330000;
  const scoped = scopeDemoActualsToAnnualPlan(source, annualPlan);
  const obligated = scoped.reduce((sum, resource) => sum + resource.obligated, 0);
  const openCommitments = scoped.reduce((sum, resource) => sum + resource.committed - resource.obligated, 0);
  const available = getAllocatableQuarterBucket({ Q1: annualPlan }, { Q1: obligated }, ["Q1"]);
  assert(available > openCommitments, "unchanged resources must not start over-allocated");
  assert(scoped.every(resource => resource.obligated <= resource.committed));
  assert.deepEqual(scopeDemoActualsToAnnualPlan(source, 0).map(resource => resource.committed), [0, 0, 0, 0]);
});

test("annual travel edits never silently add the old $11,953 obligation-floor difference", () => {
  assert.deepEqual(resolveAnnualPlanEdit(18701, 18701, 7966), { accepted: true, amount: 18701 });
  assert.deepEqual(resolveAnnualPlanEdit(18701, 1, 7966), { accepted: false, amount: 18701 });
  assert.deepEqual(resolveAnnualPlanEdit(18701, 18701, 30654), { accepted: false, amount: 18701 });
  assert.deepEqual(resolveAnnualPlanEdit(18701, 20000, 7966), { accepted: true, amount: 20000 });
});

test("clearing a zero-obligation annual plan sets zero; invalid or negative amounts leave it unchanged", () => {
  assert.deepEqual(resolveAnnualPlanEdit(1, 0, 0), { accepted: true, amount: 0 });
  assert.deepEqual(resolveAnnualPlanEdit(100, -1, 0), { accepted: false, amount: 100 });
  assert.deepEqual(resolveAnnualPlanEdit(100, NaN, 0), { accepted: false, amount: 100 });
});