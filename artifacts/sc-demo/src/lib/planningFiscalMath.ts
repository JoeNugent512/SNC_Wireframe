/** Reject invalid annual edits rather than silently inserting extra funding. */
export function resolveAnnualPlanEdit(currentAmount: number, requestedAmount: number, obligatedFloor: number) {
  const accepted = Number.isFinite(requestedAmount) && requestedAmount >= Math.max(0, obligatedFloor);
  return { accepted, amount: accepted ? requestedAmount : currentAmount };
}

/**
 * Scope synthetic whole-project resource seeds to one FY's initial plan.
 * This is demo generation only: never rescale imported actuals or recalculate
 * actuals when the user edits a plan. Keep the same 8% headroom as plan seeding.
 */
export function scopeDemoActualsToAnnualPlan<T extends { committed: number; obligated: number }>(
  resources: readonly T[],
  annualPlan: number,
): T[] {
  const sourceCommitted = resources.reduce((sum, resource) => sum + resource.committed, 0);
  const budget = Math.floor(Math.max(0, annualPlan) / 1.08);
  const scale = sourceCommitted > 0 ? budget / sourceCommitted : 0;
  let remaining = budget;
  return resources.map((resource, index) => {
    const committed = sourceCommitted <= 0 ? 0 : index === resources.length - 1
      ? remaining
      : Math.min(remaining, Math.max(0, Math.round(resource.committed * scale)));
    remaining -= committed;
    const obligated = Math.min(committed, Math.max(0, Math.round(resource.obligated * scale)));
    return { ...resource, committed, obligated };
  });
}

export type FiscalQuarterKey = "Q1" | "Q2" | "Q3" | "Q4";
export type QuarterAmounts = Partial<Record<FiscalQuarterKey, number>>;

const QUARTER_KEYS: FiscalQuarterKey[] = ["Q1", "Q2", "Q3", "Q4"];

export function clampQuarterPlanToObligationFloor(
  requestedAmount: number,
  obligatedFloor: number
): number {
  return Math.max(0, requestedAmount, obligatedFloor);
}

export function getQuarterSyncReductionCapacity(
  quarters: QuarterAmounts,
  obligationFloors: QuarterAmounts,
  editableKeys: readonly FiscalQuarterKey[]
): number {
  return editableKeys.reduce(
    (capacity, key) =>
      capacity + Math.max(0, (quarters[key] ?? 0) - (obligationFloors[key] ?? 0)),
    0
  );
}

export function syncQuarterPlanToAnnual(
  quarters: QuarterAmounts,
  annualAmount: number,
  obligationFloors: QuarterAmounts,
  editableKeys: readonly FiscalQuarterKey[],
  addToKey: FiscalQuarterKey
): QuarterAmounts {
  const updated: QuarterAmounts = Object.fromEntries(
    QUARTER_KEYS.map((key) => [key, quarters[key] ?? 0])
  ) as QuarterAmounts;
  const currentTotal = QUARTER_KEYS.reduce((sum, key) => sum + (updated[key] ?? 0), 0);
  const difference = annualAmount - currentTotal;

  if (difference > 0) {
    updated[addToKey] = (updated[addToKey] ?? 0) + difference;
    return updated;
  }

  let reduction = Math.abs(difference);
  for (const key of editableKeys) {
    const floor = Math.max(0, obligationFloors[key] ?? 0);
    const available = Math.max(0, (updated[key] ?? 0) - floor);
    const applied = Math.min(available, reduction);
    updated[key] = (updated[key] ?? 0) - applied;
    reduction -= applied;
    if (reduction === 0) break;
  }

  return updated;
}

export function getAllocatableQuarterBucket(
  plannedByQuarter: QuarterAmounts,
  obligatedByQuarter: QuarterAmounts,
  openQuarterKeys: readonly FiscalQuarterKey[]
): number {
  return openQuarterKeys.reduce(
    (available, key) =>
      available + Math.max(0, (plannedByQuarter[key] ?? 0) - (obligatedByQuarter[key] ?? 0)),
    0
  );
}