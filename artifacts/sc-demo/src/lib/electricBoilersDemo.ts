import type { Project, SetupProject, ChangeRequest } from "./mockData";
import { ALL_MILESTONE_DEFS } from "./scheduleTypes";
import { FUNDING_CATEGORIES, splitMoney, type ProjectFunding } from "./projectFunding";

const years = ["FY25", "FY26", "FY27", "FY28", "FY29"];
const laborPlan = [5108, 13232, 11660, 0, 0];
const laborObligations = [5108, 13182.98, 0, 0, 0];

export const BOILER_FUNDING: ProjectFunding = {
  years,
  annual: Object.fromEntries(years.map((fy, i) => [fy, Object.fromEntries(
    FUNDING_CATEGORIES.map(category => [category, {
      plan: category === "Labor" ? laborPlan[i] : 0,
      committed: 0,
      obligated: category === "Labor" ? laborObligations[i] : 0,
    }]),
  )])) as ProjectFunding["annual"],
  quarterly: Object.fromEntries(years.map((fy, i) => [fy, Object.fromEntries(
    FUNDING_CATEGORIES.map(category => {
      const amounts = splitMoney(category === "Labor" ? laborPlan[i] : 0, 4);
      return [category, Object.fromEntries(amounts.map((amount, q) => [`Q${q + 1}`, amount]))];
    }),
  )])) as ProjectFunding["quarterly"],
  resources: [
    { name: "Gunn, Charles", orgCode: "HQEC-DEMO", laborCode: "846201", annualObligations: { FY25: 2554, FY26: 6591.49, FY27: 0 } },
    { name: "Phillips, Jonah", orgCode: "HQEC-DEMO", laborCode: "846202", annualObligations: { FY25: 2554, FY26: 6591.49, FY27: 0 } },
  ],
  assumptions: "Annual totals are from the EPMP funding status. Quarterly and person-level splits are illustrative: FY27 is spread evenly across four quarters and split equally between Gunn and Phillips. FY25/FY26 person-level obligations are split equally; quarterly history is generated, not imported transaction detail. Organization and six-digit labor charge codes are fictional examples.",
};

const milestoneDates: Record<string, [string, string]> = {
  awarded: ["2024-12-11", "2024-12-11"],
  kickoff: ["2025-01-31", "2025-01-23"],
  rev35: ["2025-04-30", "2025-04-07"],
  pre_final: ["2025-11-28", "2026-06-04"],
  final_dwg: ["2026-01-28", "2026-09-21"],
  complete: ["2026-02-27", ""],
};

export const BOILER_PROJECT: Project = {
  id: "25T47",
  number: "25T47",
  name: "UFGS 23 xx xx Electric Boilers",
  description: "New document specifying electric boilers. No current UFGS for these boilers. Due to electrification, this technology is becoming more common to use. Two USACE Districts developed a local master that will be adapted into a UFGS. Additional USACE Districts are starting to develop these also.",
  costNotes: "Work will be performed in-house by USACE Districts (SAS/SAM) already working local masters for the same technology.",
  status: "Active",
  budget: 30000,
  planningBudget: 30000,
  budgetAtSubmission: 30000,
  actualObligation: 18290.98,
  startDate: "2024-12-11",
  endDate: "2026-02-27",
  pmName: "Brandon Martin",
  projectLead: "Brandon Martin",
  hqProponent: "Brandon Martin",
  dwgCoP: "Mechanical",
  executingOrg: "HQ E&C",
  needsContractSupport: "No",
  specialFundingType: "Regular S&C",
  primaryCmsLink: "https://cms.wbdg.org/revisions/1894",
  cmsGuestLink: "https://cms.wbdg.org/s/bDiFm",
  additionalCmsLinks: "",
  funding: BOILER_FUNDING,
  schedule: {
    status: "Final to DWG",
    percentComplete: 98,
    milestones: ALL_MILESTONE_DEFS.filter(def => milestoneDates[def.key]?.some(Boolean)).map(def => ({
      ...def,
      pct: def.key === "interim_res" ? 65 : def.pct,
      planned: milestoneDates[def.key]?.[0] ?? "",
      actual: milestoneDates[def.key]?.[1] ?? "",
    })),
  },
};

export const BOILER_SETUP: SetupProject = {
  ...BOILER_PROJECT,
  id: "setup-25T47",
  linkedProjectId: BOILER_PROJECT.id,
  estimatedBudget: 30000,
  sourceRef: "EPMP 25T47",
  submittedBy: "Brandon Martin",
  receivedDate: "2026-10-16",
  deliverables: [{ id: "25T47-ufgs", type: "UFGS", numDesc: "23 xx xx Electric Boilers" }],
};

export const BOILER_REQUEST: ChangeRequest = {
  id: "106",
  projectNumber: BOILER_PROJECT.number,
  projectName: BOILER_PROJECT.name,
  projectDescription: BOILER_PROJECT.description,
  submittedBy: "Brandon Martin",
  date: "2026-10-22",
  status: "Pending Approval",
  requestFY: "FY27",
  requestQuarter: "Q1",
  resourceCategory: "Labor",
  requestType: "Increase",
  justification: "FY27 Q1 labor funding for Charles Gunn and Jonah Phillips to complete electric-boiler UFGS coordination and resolve remaining comments after Final to DWG. Request $2,915 of the $11,660 FY27 labor plan, split equally between the two resources. Resource and quarterly splits are illustrative demo allocations.",
  typeJustifications: { Labor: "Fund Gunn and Phillips at $1,457.50 each for FY27 Q1. Historical FY25/FY26 obligations stay unchanged; this request creates no new obligations until processed." },
  lineItems: BOILER_FUNDING.resources.map(resource => ({
    direction: "Increase", type: "Labor",
    orgCode: resource.orgCode, resource: resource.name, laborCode: resource.laborCode,
    amount: 1457.50, from: 0, to: 1457.50,
  })),
};
