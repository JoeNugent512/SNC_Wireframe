import type { ScheduleMilestone } from "./scheduleTypes";
import type { QuarterAmounts } from "./planningFiscalMath";

export const FUNDING_CATEGORIES = ["Labor", "Travel", "Contracts", "Outsourcing & Other"] as const;
export type FundingCategory = typeof FUNDING_CATEGORIES[number];
export interface FundingStatus {
  plan: number;
  committed: number;
  obligated: number;
}
export interface FundingResource {
  name: string;
  orgCode: string;
  laborCode: string;
  annualObligations: Record<string, number>;
}
export interface ProjectFunding {
  years: string[];
  annual: Record<string, Record<FundingCategory, FundingStatus>>;
  quarterly: Record<string, Record<FundingCategory, QuarterAmounts>>;
  resources: FundingResource[];
  assumptions: string;
}
export interface ProjectScheduleSeed {
  status: string;
  percentComplete: number;
  milestones: ScheduleMilestone[];
}

export function fundingCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function splitMoney(amount: number, count: number): number[] {
  const cents = Math.round(amount * 100);
  const base = Math.floor(cents / count);
  return Array.from({ length: count }, (_, i) => (base + (i < cents % count ? 1 : 0)) / 100);
}

export function fundingTotal(funding: ProjectFunding, fy: string, field: keyof FundingStatus) {
  return FUNDING_CATEGORIES.reduce((sum, category) => sum + (funding.annual[fy]?.[category]?.[field] ?? 0), 0);
}
